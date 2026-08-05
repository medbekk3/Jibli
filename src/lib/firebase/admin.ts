import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type AdminEnvironment = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

let adminApp: App | undefined;

function readAdminEnvironment(): AdminEnvironment {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  const missing = [
    !projectId && "FIREBASE_ADMIN_PROJECT_ID",
    !clientEmail && "FIREBASE_ADMIN_CLIENT_EMAIL",
    !privateKey && "FIREBASE_ADMIN_PRIVATE_KEY",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`إعدادات Firebase Admin ناقصة: ${missing.join("، ")}`);
  }

  if (publicProjectId && projectId !== publicProjectId) {
    throw new Error("معرّف مشروع Firebase Admin لا يطابق معرّف مشروع الواجهة.");
  }

  return { projectId, clientEmail, privateKey } as AdminEnvironment;
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existingApp = getApps()[0];
  if (existingApp) {
    adminApp = existingApp;
    return existingApp;
  }

  const environment = readAdminEnvironment();
  adminApp = initializeApp({
    credential: cert(environment),
    projectId: environment.projectId,
  });
  return adminApp;
}

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDb = () => getFirestore(getAdminApp());
