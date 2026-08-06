export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { adminDb } from "@/lib/firebase/admin";
import { restaurantError, restaurantSuccess } from "@/lib/firebase/restaurant-response";
import { requireActiveRestaurantSession } from "@/lib/firebase/restaurant-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";

export async function GET() {
  try {
    const { restaurant } = await requireActiveRestaurantSession();
    const [categories, products] = await Promise.all([adminDb.collection("categories").where("isActive", "==", true).get(), adminDb.collection("products").where("restaurantId", "==", restaurant.id).get()]);
    const usage = new Map<string, number>(); products.docs.forEach((document) => { const id = String(document.data().categoryId ?? ""); usage.set(id, (usage.get(id) ?? 0) + 1); });
    const data: Array<Record<string, unknown> & { productsCount: number }> = categories.docs.map((document) => ({ ...(serializeDocument(document.id, document.data()) as Record<string, unknown>), productsCount: usage.get(document.id) ?? 0 }));
    data.sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));
    return restaurantSuccess(data);
  } catch (error) { return restaurantError("GET /api/restaurant/categories", "القراءة", error, "تعذر تحميل التصنيفات."); }
}
