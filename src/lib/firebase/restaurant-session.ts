import { cookies } from "next/headers";

import { getAdminAuth, getAdminDb } from "./admin";

export const RESTAURANT_SESSION_COOKIE = "jibli_restaurant_session";

export class RestaurantSessionError extends Error {
  constructor(
    public status: 401 | 403 | 404 | 500,
    public code: "RESTAURANT_SESSION_REQUIRED" | "RESTAURANT_FORBIDDEN" | "RESTAURANT_NOT_FOUND" | "FIREBASE_ADMIN_NOT_CONFIGURED",
    message: string,
    options?: ErrorOptions,
  ) { super(message, options); }
}

export async function getRestaurantSession() {
  const session = (await cookies()).get(RESTAURANT_SESSION_COOKIE)?.value;
  if (!session) throw new RestaurantSessionError(401, "RESTAURANT_SESSION_REQUIRED", "انتهت جلسة المطعم، سجّل الدخول مجدداً.");

  let decoded;
  try { decoded = await getAdminAuth().verifySessionCookie(session, true); }
  catch (error) { throw new RestaurantSessionError(401, "RESTAURANT_SESSION_REQUIRED", "انتهت جلسة المطعم، سجّل الدخول مجدداً.", { cause: error }); }

  const database = getAdminDb();
  let profileSnapshot;
  try { profileSnapshot = await database.collection("users").doc(decoded.uid).get(); }
  catch (error) { throw new RestaurantSessionError(500, "FIREBASE_ADMIN_NOT_CONFIGURED", "تعذر الاتصال ببيانات حساب المطعم.", { cause: error }); }
  const profile = profileSnapshot.data();
  if (!profileSnapshot.exists || profile?.role !== "restaurant") {
    throw new RestaurantSessionError(403, "RESTAURANT_FORBIDDEN", "هذا الحساب غير مخول لدخول لوحة المطعم.");
  }

  const restaurantSnapshot = await database.collection("restaurants").where("ownerId", "==", decoded.uid).limit(1).get();
  const restaurantDocument = restaurantSnapshot.docs[0];
  return {
    uid: decoded.uid,
    profile: { ...(profile as Record<string, unknown>), uid: decoded.uid } as Record<string, unknown> & { uid: string; status?: unknown },
    restaurant: restaurantDocument ? { ...restaurantDocument.data(), id: restaurantDocument.id } : null,
  };
}

export async function requireActiveRestaurantSession() {
  const session = await getRestaurantSession();
  if (session.profile.status !== "active") {
    throw new RestaurantSessionError(403, "RESTAURANT_FORBIDDEN", session.profile.status === "pending" ? "حسابك قيد المراجعة." : "تم توقيف حساب المطعم.");
  }
  if (!session.restaurant) throw new RestaurantSessionError(404, "RESTAURANT_NOT_FOUND", "لا يوجد مطعم مرتبط بهذا الحساب. تواصل مع الإدارة.");
  return { ...session, restaurant: session.restaurant as Record<string, unknown> & { id: string } };
}

export function isRestaurantSessionError(error: unknown): error is RestaurantSessionError {
  return error instanceof RestaurantSessionError;
}
