import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { requireFirebaseApp } from "./config";

let persistenceSetup: Promise<void> | null = null;

export function getFirebaseAuth() {
  return getAuth(requireFirebaseApp());
}

export function initializeFirebaseAuthPersistence() {
  if (typeof window === "undefined") return Promise.resolve();

  persistenceSetup ??= setPersistence(getFirebaseAuth(), browserLocalPersistence);
  return persistenceSetup;
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