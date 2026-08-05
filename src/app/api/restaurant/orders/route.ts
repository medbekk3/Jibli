import { getAdminDb } from "@/lib/firebase/admin";
import { isRestaurantSessionError, requireActiveRestaurantSession } from "@/lib/firebase/restaurant-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await requireActiveRestaurantSession();
    const snapshot = await getAdminDb().collection("orders").where("restaurantId", "==", session.restaurant.id).limit(100).get();
    const orders = snapshot.docs.sort((a, b) => timestampMillis(b.data().createdAt) - timestampMillis(a.data().createdAt)).map((doc) => serializeDocument(doc.id, doc.data()));
    return NextResponse.json({ success: true, data: { orders } });
  } catch (error) {
    if (isRestaurantSessionError(error)) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    console.error("[طلبات المطعم] فشل القراءة", { errorCode: error instanceof Error ? (error as Error & { code?: string }).code ?? "unknown" : "unknown", errorMessage: error instanceof Error ? error.message : "خطأ غير معروف" });
    return NextResponse.json({ success: false, error: { code: "RESTAURANT_ORDERS_LOAD_FAILED", message: "تعذر تحميل طلبات المطعم." } }, { status: 500 });
  }
}

function timestampMillis(value: unknown) { return value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function" ? (value as { toMillis: () => number }).toMillis() : 0; }
