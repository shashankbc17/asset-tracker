import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as fbSignOut,
  User,
  Auth
} from 'firebase/auth';
import { getActiveFirebaseConfig } from './firebaseConfig';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

type AuthListener = (user: UserProfile | null) => void;

class AuthenticationService {
  currentUser: UserProfile | null = null;
  private listeners: AuthListener[] = [];
  private auth: Auth | null = null;

  constructor() {
    // 1. Immediately read cached user session synchronously from localStorage in 0ms
    const cached = localStorage.getItem('metals_auth_user');
    if (cached) {
      try {
        this.currentUser = JSON.parse(cached);
      } catch {
        this.currentUser = null;
      }
    }

    // 2. Initialize Firebase Auth asynchronously in background to confirm valid token
    this.initFirebase();
  }

  getInitialUser(): UserProfile | null {
    if (this.currentUser) return this.currentUser;
    const cached = localStorage.getItem('metals_auth_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  }

  private initFirebase() {
    try {
      const config = getActiveFirebaseConfig();
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      this.auth = getAuth(app);

      onAuthStateChanged(this.auth, (user: User | null) => {
        if (user) {
          this.currentUser = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          };
          localStorage.setItem('metals_auth_user', JSON.stringify(this.currentUser));
        } else {
          this.currentUser = null;
          localStorage.removeItem('metals_auth_user');
        }
        this.notify();
      });
    } catch (err) {
      console.warn('Firebase Auth initialization error:', err);
      this.notify();
    }
  }

  async signInWithGoogle(): Promise<UserProfile | null> {
    if (!this.auth) {
      const config = getActiveFirebaseConfig();
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      this.auth = getAuth(app);
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(this.auth, provider);
      const u = result.user;
      this.currentUser = {
        uid: u.uid,
        displayName: u.displayName || u.email?.split('@')[0] || 'User',
        email: u.email || '',
        photoURL: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
      };
      localStorage.setItem('metals_auth_user', JSON.stringify(this.currentUser));
      this.notify();
      return this.currentUser;
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  }

  async signOut(): Promise<void> {
    localStorage.removeItem('metals_auth_user');
    if (this.auth) {
      try {
        await fbSignOut(this.auth);
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    this.currentUser = null;
    this.notify();
  }

  onAuthStateChange(cb: AuthListener): () => void {
    this.listeners.push(cb);
    // Immediately call listener with current user state
    cb(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentUser);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

export const AuthService = new AuthenticationService();
