import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import type { CreateRestaurantInput, RestaurantDocument } from "@/types/collections";
import { getFirebaseDb } from "../firestore";
import { adminApi } from "../admin-api";

const name = "restaurants";
const mapDoc = (snapshot: { id: string; data: () => unknown }) => ({ ...(snapshot.data() as Omit<RestaurantDocument, "id">), id: snapshot.id });
const sort = (items: RestaurantDocument[]) => items.sort((a, b) => a.displayOrder - b.displayOrder);

export async function getRestaurants() { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi<RestaurantDocument[]>("/api/admin/restaurants"); const result = await getDocs(collection(getFirebaseDb(), name)); return sort(result.docs.map(mapDoc)); }
export async function getActiveRestaurants() { const result = await getDocs(query(collection(getFirebaseDb(), name), where("isActive", "==", true))); return sort(result.docs.map(mapDoc)); }
export async function getRestaurant(id: string) { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi<RestaurantDocument>(`/api/admin/restaurants/${id}`); const result = await getDoc(doc(getFirebaseDb(), name, id)); return result.exists() ? mapDoc(result) : null; }
export async function createRestaurant(data: CreateRestaurantInput) { const reference = doc(collection(getFirebaseDb(), name)); await setDoc(reference, { ...data, id: reference.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return reference.id; }
export function updateRestaurant(id: string, data: Partial<CreateRestaurantInput>) { return updateDoc(doc(getFirebaseDb(), name, id), { ...data, updatedAt: serverTimestamp() }); }
export function deleteRestaurant(id: string) { return deleteDoc(doc(getFirebaseDb(), name, id)); }
