import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  DocumentReference,
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
  type WriteBatch,
} from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function requiredEnvironment(name: "FIREBASE_ADMIN_PROJECT_ID" | "FIREBASE_ADMIN_CLIENT_EMAIL") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function normalizePrivateKey(value: string | undefined): string {
  if (!value) throw new Error("Missing FIREBASE_ADMIN_PRIVATE_KEY");
  let normalized = value.trim();
  if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) normalized = normalized.slice(1, -1);
  return normalized.replace(/\\n/g, "\n");
}

function createAdminApp(): App {
  if (getApps().length > 0) return getApp();
  const projectId = requiredEnvironment("FIREBASE_ADMIN_PROJECT_ID");
  const clientEmail = requiredEnvironment("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (publicProjectId && projectId !== publicProjectId) throw new Error("Firebase Admin project ID does not match the public Firebase project ID");
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
}

export const adminApp = createAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminMessaging = getMessaging(adminApp);
export { DocumentReference, FieldValue, Timestamp };
export type { DocumentData, Firestore, QueryDocumentSnapshot, WriteBatch };
