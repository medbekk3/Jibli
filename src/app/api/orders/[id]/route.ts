export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { serializeDocument, serializeFirestoreData } from "@/lib/firebase/serialize-firestore";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return failure("CUSTOMER_UNAUTHORIZED", "يجب تسجيل الدخول لعرض هذا الطلب.", 401);
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    const [profileSnapshot, orderSnapshot] = await Promise.all([
      adminDb.collection("users").doc(decoded.uid).get(),
      adminDb.collection("orders").doc((await params).id).get(),
    ]);
    if (!orderSnapshot.exists) return failure("ORDER_NOT_FOUND", "الطلب غير موجود.", 404);
    const profile = profileSnapshot.data() ?? {};
    const order = orderSnapshot.data() ?? {};
    let allowed = profile.status === "active" && (profile.role === "admin" || (profile.role === "customer" && order.customerId === decoded.uid));
    if (!allowed && profile.status === "active" && profile.role === "restaurant") {
      const restaurant = await adminDb.collection("restaurants").where("ownerId", "==", decoded.uid).limit(1).get();
      allowed = restaurant.docs[0]?.id === order.restaurantId;
    }
    if (!allowed) return failure("ORDER_FORBIDDEN", "لا تملك صلاحية عرض هذا الطلب.", 403);
    const history = await orderSnapshot.ref.collection("statusHistory").orderBy("createdAt", "asc").get();
    return NextResponse.json({ success: true, data: { order: serializeDocument(orderSnapshot.id, order), statusHistory: serializeFirestoreData(history.docs.map((doc) => ({ id: doc.id, ...doc.data() }))) } });
  } catch (error) {
    console.error("[الطلبات] فشل قراءة الطلب", { api: "GET /api/orders/[id]", errorCode: error instanceof Error ? (error as Error & { code?: string }).code ?? "unknown" : "unknown", errorMessage: error instanceof Error ? error.message : "خطأ غير معروف" });
    return failure("ORDER_LOAD_FAILED", "تعذر تحميل الطلب. حاول مرة أخرى.", 500);
  }
}

function failure(code: string, message: string, status: number) { return NextResponse.json({ success: false, error: { code, message } }, { status }); }
