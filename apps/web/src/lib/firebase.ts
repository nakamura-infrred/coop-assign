import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type UserCredential,
} from 'firebase/auth'

function readConfig() {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MEASUREMENT_ID,
  } = import.meta.env

  if (
    !VITE_FIREBASE_API_KEY ||
    !VITE_FIREBASE_APP_ID ||
    !VITE_FIREBASE_AUTH_DOMAIN ||
    !VITE_FIREBASE_MESSAGING_SENDER_ID ||
    !VITE_FIREBASE_PROJECT_ID ||
    !VITE_FIREBASE_STORAGE_BUCKET
  ) {
    throw new Error('Firebase 環境変数が不足しています。README.md の設定手順を確認してください。')
  }

  return {
    apiKey: VITE_FIREBASE_API_KEY,
    appId: VITE_FIREBASE_APP_ID,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
    projectId: VITE_FIREBASE_PROJECT_ID,
    storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
    measurementId: VITE_FIREBASE_MEASUREMENT_ID,
  }
}

const firebaseApp = getApps().length ? getApp() : initializeApp(readConfig())

export const auth = getAuth(firebaseApp)
const provider = new GoogleAuthProvider()

export function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, provider)
}

export function signOutFromFirebase() {
  return signOut(auth)
}

export { firebaseApp }
