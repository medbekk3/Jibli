export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { evaluateCoupon } from "@/lib/coupons/server";
import { normalizeCouponCode } from "@/lib/coupons/shared";
import { requireServerUser } from "@/lib/firebase/server-auth";

export async function POST(request: NextRequest) {
  const access = await requireServerUser(request, "customer"); if (access.error) return access.error;
  try {
    const body = await request.json() as Record<string, unknown>; const code = normalizeCouponCode(body.code); const restaurantId = typeof body.restaurantId === "string" ? body.restaurantId.trim() : ""; const subtotal = Math.max(0, Number(body.subtotal) || 0);
    if (!code || !restaurantId || subtotal <= 0) return fail("COUPON_INVALID", "الكوبون غير صالح.");
    const snapshot = await adminDb.collection("discountCoupons").where("code", "==", code).limit(1).get(); const couponDoc = snapshot.docs[0]; const usage = couponDoc ? await couponDoc.ref.collection("usages").doc(access.uid).get() : null;
    const result = evaluateCoupon(couponDoc?.data(), couponDoc?.id ?? "", { restaurantId, subtotal, userId: access.uid, usedBefore: usage?.exists === true });
    if (!result.valid) return fail(result.code, result.message);
    return NextResponse.json({ success: true, data: { couponId: result.couponId, code: String(result.coupon.code), title: String(result.coupon.title), discount: result.discount } });
  } catch { return fail("COUPON_INVALID", "تعذر التحقق من الكوبون."); }
}
function fail(code: string, message: string) { return NextResponse.json({ success: false, error: { code, message } }, { status: 409 }); }
