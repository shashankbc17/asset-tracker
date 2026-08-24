import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, Firestore } from 'firebase/firestore';
import { Asset, MetalRates } from '../types/portfolio';
import { getActiveFirebaseConfig } from './firebaseConfig';

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
  onUpdate: (assets: Asset[], rates?: MetalRates) => void
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
        if (snapshot.exists()) {
          const data = snapshot.data();
          const assets = (data.assets && Array.isArray(data.assets)) ? data.assets : [];
          localStorage.setItem(`wealth_assets_${uid}`, JSON.stringify(assets));
          if (data.rates) {
            localStorage.setItem(`metals_rates_${uid}`, JSON.stringify(data.rates));
          }
          onUpdate(assets, data.rates);
        } else {
          // Initialize user's private cloud document if empty
          const cachedLocal = localStorage.getItem(`wealth_assets_${uid}`);
          const initialAssets = cachedLocal ? JSON.parse(cachedLocal) : [];
          setDoc(docRef, {
            assets: initialAssets,
            updatedAt: new Date().toISOString(),
          }).catch(console.warn);
        }
      },
      (err) => {
        console.warn('Firestore subscription error:', err);
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

export async function savePortfolioToFirestore(uid: string, assets: Asset[], rates?: MetalRates): Promise<void> {
  const firestore = getDb();
  if (!firestore || !uid || uid === 'default_user') return;

  try {
    const docRef = doc(firestore, 'users', uid, 'portfolio', 'current');
    await setDoc(docRef, {
      assets,
      rates: rates || null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Failed saving to Firestore:', err);
  }
}
