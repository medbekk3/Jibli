import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import type { CategoryDocument, CreateCategoryInput } from "@/types/collections";
import { getFirebaseDb } from "../firestore";
import { adminApi } from "../admin-api";

const name = "categories";
const mapDoc = (snapshot: { id: string; data: () => unknown }) => ({ ...(snapshot.data() as Omit<CategoryDocument, "id">), id: snapshot.id });
const sort = (items: CategoryDocument[]) => items.sort((a, b) => a.displayOrder - b.displayOrder);
export async function getCategories() { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi<CategoryDocument[]>("/api/admin/categories"); const result = await getDocs(collection(getFirebaseDb(), name)); return sort(result.docs.map(mapDoc)); }
export async function getActiveCategories() { const result = await getDocs(query(collection(getFirebaseDb(), name), where("isActive", "==", true))); return sort(result.docs.map(mapDoc)); }
export async function createCategory(data: CreateCategoryInput) { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return (await adminApi<{id:string}>("/api/admin/categories",{method:"POST",body:JSON.stringify(data)})).id; const reference = doc(collection(getFirebaseDb(), name)); await setDoc(reference, { ...data, id: reference.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return reference.id; }
export function updateCategory(id: string, data: Partial<CreateCategoryInput>) { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi(`/api/admin/categories/${id}`,{method:"PATCH",body:JSON.stringify(data)}); return updateDoc(doc(getFirebaseDb(), name, id), { ...data, updatedAt: serverTimestamp() }); }
export function deleteCategory(id: string) { if(typeof window!=="undefined"&&window.location.pathname.startsWith("/admin"))return adminApi(`/api/admin/categories/${id}`,{method:"DELETE"}); return deleteDoc(doc(getFirebaseDb(), name, id)); }
