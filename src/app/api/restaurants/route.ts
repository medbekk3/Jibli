import { getAdminDb } from "@/lib/firebase/admin";
import { publicRestaurant, timestampMillis } from "@/lib/firebase/public-mappers";
import { logPublicFailure, publicFailure, publicSuccess } from "@/lib/firebase/public-response";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("restaurants").where("isActive", "==", true).get();
    const restaurants = snapshot.docs.sort((a, b) => { const order = Number(a.data().displayOrder ?? 0) - Number(b.data().displayOrder ?? 0); return order || timestampMillis(b.data().createdAt) - timestampMillis(a.data().createdAt); }).map((document) => publicRestaurant(document.id, document.data()));
    return publicSuccess({ restaurants });
  } catch (error) { logPublicFailure("GET /api/restaurants", error); return publicFailure("RESTAURANTS_LOAD_FAILED", "تعذر تحميل المطاعم. حاول مرة أخرى.", 500); }
}
