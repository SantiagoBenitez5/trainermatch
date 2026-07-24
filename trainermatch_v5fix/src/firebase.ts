import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";

// Firebase client configuration using environment variables with real fallbacks
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyA23Rf45cZcj-VzbS4MNm2bDWjZX20CQDc",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "trainermatch-56c9a.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "trainermatch-56c9a",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "trainermatch-56c9a.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "210080002298",
  appId: env.VITE_FIREBASE_APP_ID || "1:210080002298:web:4ad4eb2c4909aab9c45943"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Helper functions for existing imports to maintain full compatibility
export const getFirebaseAuth = () => auth;
export const getGoogleProvider = () => new GoogleAuthProvider();

export { app, auth, GoogleAuthProvider, EmailAuthProvider };
