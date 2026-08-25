import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, Firestore } from 'firebase/firestore';
import { Asset, MetalRates, Liability } from '../types/portfolio';
import { getActiveFirebaseConfig } from './firebaseConfig';
import { LOCAL_STORAGE_KEY, LOCAL_STORAGE_LIABILITIES_KEY } from './api';

let db: Firestore | null = null;
let firestoreUnsubscribe: (() => void) | null = null;

function getDb(): Firestore | null {
  if (db) return db;
  try {
    const config = getActiveFirebaseConfig();
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    return db;
  } catch (err) {
    console.warn('Firestore initialization warning:', err);
    return null;
  }
}

export function subscribeToUserPortfolio(
  uid: string,
  onUpdate: (assets: Asset[], rates?: MetalRates, liabilities?: Liability[]) => void
): () => void {
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
  }

  const firestore = getDb();
  if (!firestore) return () => {};

  try {
    const docRef = doc(firestore, 'users', uid, 'portfolio', 'current');
    firestoreUnsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const assets = (data.assets && Array.isArray(data.assets)) ? data.assets : [];
            const liabilities = (data.liabilities && Array.isArray(data.liabilities)) ? data.liabilities : [];
            
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_${uid}`, JSON.stringify(assets));
            localStorage.setItem(`wealth_assets_${uid}`, JSON.stringify(assets));
            localStorage.setItem(`${LOCAL_STORAGE_LIABILITIES_KEY}_${uid}`, JSON.stringify(liabilities));
            if (data.rates) {
              localStorage.setItem(`metals_rates_${uid}`, JSON.stringify(data.rates));
            }
            onUpdate(assets, data.rates, liabilities);
          } else {
            // Document doesn't exist yet on cloud
            const cachedAssets = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${uid}`) || localStorage.getItem(`wealth_assets_${uid}`);
            const cachedLiabilities = localStorage.getItem(`${LOCAL_STORAGE_LIABILITIES_KEY}_${uid}`);
            if (cachedAssets || cachedLiabilities) {
              try {
                setDoc(docRef, {
                  assets: cachedAssets ? JSON.parse(cachedAssets) : [],
                  liabilities: cachedLiabilities ? JSON.parse(cachedLiabilities) : [],
                  updatedAt: new Date().toISOString(),
                }).catch(() => {});
              } catch {}
            }
          }
        } catch (innerErr) {
          console.warn('Snapshot parse error:', innerErr);
        }
      },
      (err) => {
        // Firestore permission/network error: fallback smoothly to local cache
        console.warn('Firestore subscription fallback (using local cache):', err.message);
      }
    );
  } catch (err) {
    console.warn('Firestore subscribe error:', err);
  }

  return () => {
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }
  };
}

export async function savePortfolioToFirestore(
  uid: string, 
  assets: Asset[], 
  rates?: MetalRates,
  liabilities?: Liability[]
): Promise<void> {
  const firestore = getDb();
  if (!firestore || !uid || uid === 'default_user') return;

  try {
    const docRef = doc(firestore, 'users', uid, 'portfolio', 'current');
    const payload: Record<string, any> = {
      assets,
      rates: rates || null,
      updatedAt: new Date().toISOString(),
    };
    if (liabilities !== undefined) {
      payload.liabilities = liabilities;
    }
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('Failed saving to Firestore (data is safe locally):', err);
  }
}

