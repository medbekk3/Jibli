import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { isRestaurantSessionError, requireActiveRestaurantSession } from "@/lib/firebase/restaurant-session";
import { serializeDocument, serializeFirestoreData } from "@/lib/firebase/serialize-firestore";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveRestaurantSession();
    const { id } = await params;
    const order = await getAdminDb().collection("orders").doc(id).get();
    if (!order.exists) return failure("ORDER_NOT_FOUND", "الطلب غير موجود.", 404);
    if (order.data()?.restaurantId !== session.restaurant.id) return failure("ORDER_FORBIDDEN", "لا تملك صلاحية إدارة هذا الطلب.", 403);
    const history = await order.ref.collection("statusHistory").orderBy("createdAt", "asc").get();
    return NextResponse.json({ success: true, data: { order: serializeDocument(order.id, order.data() ?? {}), statusHistory: serializeFirestoreData(history.docs.map((doc) => ({ id: doc.id, ...doc.data() }))) } });
  } catch (error) {
    if (isRestaurantSessionError(error)) return failure(error.code, error.message, error.status);
    console.error("[طلبات المطعم] فشل التفاصيل", { errorCode: error instanceof Error ? (error as Error & { code?: string }).code ?? "unknown" : "unknown", errorMessage: error instanceof Error ? error.message : "خطأ غير معروف" });
    return failure("RESTAURANT_ORDER_LOAD_FAILED", "تعذر تحميل تفاصيل الطلب.", 500);
  }
}

function failure(code: string, message: string, status: number) { return NextResponse.json({ success: false, error: { code, message } }, { status }); }
