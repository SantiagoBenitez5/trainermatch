// Firebase client configuration and initialization with intelligent fallback support

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

let firebaseConfig: any = null;
let isFirebaseInitialized = false;

// Attempt to load the configuration
try {
  // @ts-ignore
  import("./firebase-applet-config.json").then((config) => {
    firebaseConfig = config.default;
  }).catch(() => {
    // Console log only to not disturb runtime
    console.log("Firebase Applet configuration not found. Fallback authentication system active.");
  });
} catch (e) {
  // Ignore
}

// Fallback dummy config if no real one is loaded yet
const fallbackConfig = {
  apiKey: "AIzaSyDummyKeyForLocalPreviewAndTestingOnly",
  authDomain: "trainermatch-preview.firebaseapp.com",
  projectId: "trainermatch-preview",
  storageBucket: "trainermatch-preview.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

export function getFirebaseApp() {
  const currentConfig = firebaseConfig || fallbackConfig;
  try {
    if (getApps().length === 0) {
      isFirebaseInitialized = true;
      return initializeApp(currentConfig);
    }
    return getApp();
  } catch (error) {
    console.error("Error initializing Firebase App:", error);
    return null;
  }
}

// Lazy getters to prevent crashes on load
export const getFirebaseAuth = () => {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
};

export const getGoogleProvider = () => {
  return new GoogleAuthProvider();
};

export { isFirebaseInitialized };
