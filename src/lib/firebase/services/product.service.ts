import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import type { CreateProductInput, ProductDocument } from "@/types/collections";
import { getFirebaseDb } from "../firestore";
import { adminApi } from "../admin-api";

const name = "products";
const mapDoc = (snapshot: { id: string; data: () => unknown }) => ({ ...(snapshot.data() as Omit<ProductDocument, "id">), id: snapshot.id });
const sort = (items: ProductDocument[]) => items.sort((a, b) => a.displayOrder - b.displayOrder);
export async function getProducts() { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi<ProductDocument[]>("/api/admin/products"); const result = await getDocs(collection(getFirebaseDb(), name)); return sort(result.docs.map(mapDoc)); }
export async function getRestaurantProducts(restaurantId: string) { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi<ProductDocument[]>(`/api/admin/products?restaurantId=${encodeURIComponent(restaurantId)}`); const result = await getDocs(query(collection(getFirebaseDb(), name), where("restaurantId", "==", restaurantId))); return sort(result.docs.map(mapDoc)); }
export async function getAvailableRestaurantProducts(restaurantId: string) { const result = await getDocs(query(collection(getFirebaseDb(), name), where("restaurantId", "==", restaurantId), where("isAvailable", "==", true))); return sort(result.docs.map(mapDoc)); }
export async function getProduct(id: string) { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi<ProductDocument>(`/api/admin/products/${id}`); const result = await getDoc(doc(getFirebaseDb(), name, id)); return result.exists() ? mapDoc(result) : null; }
export async function createProduct(data: CreateProductInput) { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return (await adminApi<{id:string}>("/api/admin/products",{method:"POST",body:JSON.stringify(data)})).id; const reference = doc(collection(getFirebaseDb(), name)); await setDoc(reference, { ...data, id: reference.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return reference.id; }
export function updateProduct(id: string, data: Partial<CreateProductInput>) { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi(`/api/admin/products/${id}`,{method:"PATCH",body:JSON.stringify(data)}); return updateDoc(doc(getFirebaseDb(), name, id), { ...data, updatedAt: serverTimestamp() }); }
export function deleteProduct(id: string) { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi(`/api/admin/products/${id}`,{method:"DELETE"}); return deleteDoc(doc(getFirebaseDb(), name, id)); }
