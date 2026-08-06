export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { FieldValue } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { cleanProductInput } from "@/lib/firebase/restaurant-data";
import { restaurantError, restaurantFailure, restaurantSuccess } from "@/lib/firebase/restaurant-response";
import { requireActiveRestaurantSession } from "@/lib/firebase/restaurant-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";

export async function GET() {
  try {
    const { restaurant } = await requireActiveRestaurantSession();
    const snapshot = await adminDb.collection("products").where("restaurantId", "==", restaurant.id).get();
    const products = snapshot.docs.map((document) => serializeDocument(document.id, document.data())).sort((a, b) => Number((a as { displayOrder?: number }).displayOrder ?? 0) - Number((b as { displayOrder?: number }).displayOrder ?? 0));
    return restaurantSuccess(products);
  } catch (error) { return restaurantError("GET /api/restaurant/products", "القراءة", error, "تعذر تحميل الأكلات."); }
}

export async function POST(request: NextRequest) {
  try {
    const { restaurant } = await requireActiveRestaurantSession();
    const input = cleanProductInput(await request.json());
    if (!input.name || !input.description || !input.categoryId || !input.imageUrl) return restaurantFailure("INVALID_FORM_DATA", "أكمل بيانات الأكلة المطلوبة.", 400);
    const category = await adminDb.collection("categories").doc(input.categoryId).get();
    if (!category.exists || category.data()?.isActive !== true) return restaurantFailure("INVALID_FORM_DATA", "التصنيف المحدد غير متاح.", 400);
    const reference = adminDb.collection("products").doc();
    await reference.set({ ...input, id: reference.id, restaurantId: restaurant.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return restaurantSuccess({ id: reference.id }, 201);
  } catch (error) { return restaurantError("POST /api/restaurant/products", "الإنشاء", error, "تعذر إضافة الأكلة."); }
}
