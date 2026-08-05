import { FieldValue } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { restaurantError, restaurantFailure, restaurantSuccess } from "@/lib/firebase/restaurant-response";
import { requireActiveRestaurantSession } from "@/lib/firebase/restaurant-session";

export async function PATCH(request: NextRequest) {
  try { const { restaurant } = await requireActiveRestaurantSession(); const body = await request.json() as { isOpen?: unknown }; if (typeof body.isOpen !== "boolean") return restaurantFailure("INVALID_FORM_DATA", "حالة المطعم غير صالحة.", 400); await getAdminDb().collection("restaurants").doc(restaurant.id).update({ isOpen: body.isOpen, updatedAt: FieldValue.serverTimestamp() }); return restaurantSuccess({ isOpen: body.isOpen }); }
  catch (error) { return restaurantError("PATCH /api/restaurant/open-status", "التحديث", error, "تعذر تحديث حالة المطعم."); }
}
