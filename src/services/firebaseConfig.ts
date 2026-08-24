// Original Dedicated Firebase Configuration for Asset Tracker (My Wealth Tracker)
// Project ID: my-wealth-tracker-50d2c
// Admin: shashankbc17@gmail.com

export const ADMIN_EMAILS = ['shashankbc17@gmail.com'];

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCfsEG-1jGkImSumkNFqKVnyaSiXHkT8ys",
  authDomain: "my-wealth-tracker-50d2c.firebaseapp.com",
  projectId: "my-wealth-tracker-50d2c",
  storageBucket: "my-wealth-tracker-50d2c.firebasestorage.app",
  messagingSenderId: "749131807291",
  appId: "1:749131807291:web:89cab5dbd316e5ed2dfa1e",
  measurementId: "G-HWGSD19563"
};

export function getActiveFirebaseConfig() {
  const custom = localStorage.getItem('firebase_web_config') || localStorage.getItem('metals_firebase_config');
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch {
      // fallback
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}
