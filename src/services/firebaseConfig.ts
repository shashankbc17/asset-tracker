// Firebase Configuration for Asset Tracker (My Wealth Tracker)
// Admin: shashankbc17@gmail.com
//
// ⚠️  SECURITY: Credentials are loaded from environment variables.
//     Copy .env.example → .env and fill in your Firebase values.
//     Never hardcode secrets directly in this file.

export const ADMIN_EMAILS = ['shashankbc17@gmail.com'];

// Read config from Vite environment variables (injected at build time from .env)
const ENV_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Warn loudly in development if .env is not set up
if (!ENV_FIREBASE_CONFIG.apiKey) {
  console.warn(
    '⚠️ Firebase API key is missing. ' +
    'Copy .env.example to .env and fill in your Firebase credentials.'
  );
}

export const DEFAULT_FIREBASE_CONFIG = ENV_FIREBASE_CONFIG;

export function getActiveFirebaseConfig() {
  const custom = localStorage.getItem('firebase_web_config') || localStorage.getItem('metals_firebase_config');
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch {
      // fallback to env config
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

