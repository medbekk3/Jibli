import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { requireFirebaseApp } from "./config";

export function getFirebaseAuth() {
  return getAuth(requireFirebaseApp());
}

export function createAccount(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export function logoutFromFirebase() {
  return firebaseSignOut(getFirebaseAuth());
}

export function sendResetEmail(email: string) {
  return sendPasswordResetEmail(getFirebaseAuth(), email);
}
