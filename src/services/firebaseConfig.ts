// Firebase configuration for Google Sign-In & Cloud Firestore Sync
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCcE9n2kuUelaEAMnbccx4CMbJ9NAQO1g0",
  authDomain: "heirloom-cookbook-io.firebaseapp.com",
  projectId: "heirloom-cookbook-io",
  storageBucket: "heirloom-cookbook-io.firebasestorage.app",
  messagingSenderId: "1075282950451",
  appId: "1:1075282950451:web:47558ddb0bdad5c1742646",
};

export function getActiveFirebaseConfig() {
  const custom = localStorage.getItem('metals_firebase_config');
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch (e) {
      // fallback
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}
