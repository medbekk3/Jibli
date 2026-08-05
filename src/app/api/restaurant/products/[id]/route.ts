import { FieldValue } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { cleanProductInput } from "@/lib/firebase/restaurant-data";
import { restaurantError, restaurantFailure, restaurantSuccess } from "@/lib/firebase/restaurant-response";
import { requireActiveRestaurantSession } from "@/lib/firebase/restaurant-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";

async function owned(id: string, restaurantId: string) {
  const snapshot = await getAdminDb().collection("products").doc(id).get();
  return snapshot.exists && snapshot.data()?.restaurantId === restaurantId ? snapshot : null;
}
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { const { restaurant } = await requireActiveRestaurantSession(); const { id } = await params; const item = await owned(id, restaurant.id); if (!item) return restaurantFailure("PRODUCT_NOT_FOUND", "الأكلة غير موجودة.", 404); return restaurantSuccess(serializeDocument(item.id, item.data()!)); }
  catch (error) { return restaurantError("GET /api/restaurant/products/[id]", "القراءة", error, "تعذر تحميل الأكلة."); }
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { restaurant } = await requireActiveRestaurantSession(); const { id } = await params;
    if (!await owned(id, restaurant.id)) return restaurantFailure("PRODUCT_NOT_FOUND", "الأكلة غير موجودة.", 404);
    const input = cleanProductInput(await request.json());
    if (!input.name || !input.description || !input.categoryId || !input.imageUrl) return restaurantFailure("INVALID_FORM_DATA", "أكمل بيانات الأكلة المطلوبة.", 400);
    const category = await getAdminDb().collection("categories").doc(input.categoryId).get();
    if (!category.exists || category.data()?.isActive !== true) return restaurantFailure("INVALID_FORM_DATA", "التصنيف المحدد غير متاح.", 400);
    await getAdminDb().collection("products").doc(id).update({ ...input, updatedAt: FieldValue.serverTimestamp() });
    return restaurantSuccess({ id });
  } catch (error) { return restaurantError("PATCH /api/restaurant/products/[id]", "التحديث", error, "تعذر تعديل الأكلة."); }
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { const { restaurant } = await requireActiveRestaurantSession(); const { id } = await params; if (!await owned(id, restaurant.id)) return restaurantFailure("PRODUCT_NOT_FOUND", "الأكلة غير موجودة.", 404); await getAdminDb().collection("products").doc(id).delete(); return restaurantSuccess({ id }); }
  catch (error) { return restaurantError("DELETE /api/restaurant/products/[id]", "الحذف", error, "تعذر حذف الأكلة."); }
}
