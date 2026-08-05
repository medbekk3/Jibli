import { getAdminDb } from "@/lib/firebase/admin";
import { restaurantError, restaurantSuccess } from "@/lib/firebase/restaurant-response";
import { requireActiveRestaurantSession } from "@/lib/firebase/restaurant-session";
import { serializeFirestoreData } from "@/lib/firebase/serialize-firestore";

export async function GET() {
  try {
    const session = await requireActiveRestaurantSession();
    const products = await getAdminDb().collection("products").where("restaurantId", "==", session.restaurant.id).get();
    const items: Array<Record<string, unknown> & { id: string }> = products.docs.map((document) => ({ ...document.data(), id: document.id }));
    const usedCategories = new Set(items.map((item) => String(item.categoryId ?? "")).filter(Boolean));
    const latest = [...items].sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt)).slice(0, 5);
    return restaurantSuccess(serializeFirestoreData({
      restaurant: session.restaurant,
      profile: session.profile,
      stats: { total: items.length, available: items.filter((item) => item.isAvailable === true).length, unavailable: items.filter((item) => item.isAvailable !== true).length, categories: usedCategories.size },
      latestProducts: latest,
    }));
  } catch (error) { return restaurantError("GET /api/restaurant/dashboard", "التحميل", error, "تعذر تحميل لوحة المطعم."); }
}

function timestampMillis(value: unknown) { return value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function" ? (value as { toMillis: () => number }).toMillis() : 0; }
