import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

import type { SignUpData, UserProfile } from "@/types/auth";

import { requireFirebaseApp } from "./config";

export function getFirebaseDb() {
  return getFirestore(requireFirebaseApp());
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), "users", uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export async function createCustomerProfile(uid: string, data: SignUpData) {
  const profile = {
    uid,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    role: "customer" as const,
    status: "active" as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(getFirebaseDb(), "users", uid), profile);
}
