import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { cleanSettingsInput } from "@/lib/firebase/restaurant-data";
import { restaurantError, restaurantFailure, restaurantSuccess } from "@/lib/firebase/restaurant-response";
import { requireActiveRestaurantSession } from "@/lib/firebase/restaurant-session";

export async function PATCH(request: NextRequest) {
  try {
    const { restaurant } = await requireActiveRestaurantSession(); const input = cleanSettingsInput(await request.json());
    if (!input.phone || !input.address || !input.description || !input.deliveryTime || !input.workingHours) return restaurantFailure("INVALID_FORM_DATA", "أكمل بيانات المطعم المطلوبة.", 400);
    await getAdminDb().collection("restaurants").doc(restaurant.id).update(input); return restaurantSuccess({ id: restaurant.id });
  } catch (error) { return restaurantError("PATCH /api/restaurant/settings", "التحديث", error, "تعذر حفظ إعدادات المطعم."); }
}
