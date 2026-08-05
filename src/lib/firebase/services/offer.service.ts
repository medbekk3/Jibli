import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import type { OfferDocument } from "@/types/collections";
import { getFirebaseDb } from "../firestore";

const name = "offers";
const mapDoc = (snapshot: { id: string; data: () => unknown }) => ({ ...(snapshot.data() as Omit<OfferDocument, "id">), id: snapshot.id });
export async function getOffers() { const result = await getDocs(collection(getFirebaseDb(), name)); return result.docs.map(mapDoc); }
export async function getActiveOffers() { const result = await getDocs(query(collection(getFirebaseDb(), name), where("isActive", "==", true))); return result.docs.map(mapDoc); }
export function createOffer(data: Omit<OfferDocument, "id" | "createdAt" | "updatedAt">) { return addDoc(collection(getFirebaseDb(), name), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); }
export function updateOffer(id: string, data: Partial<Omit<OfferDocument, "id" | "createdAt" | "updatedAt">>) { return updateDoc(doc(getFirebaseDb(), name, id), { ...data, updatedAt: serverTimestamp() }); }
export function deleteOffer(id: string) { return deleteDoc(doc(getFirebaseDb(), name, id)); }
