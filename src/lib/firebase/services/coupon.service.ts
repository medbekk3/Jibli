import { getFirebaseAuth } from "../auth";
import { normalizeCouponCode } from "@/lib/coupons/shared";

export type CouponValidationResult = { couponId: string; code: string; title: string; discount: number };
export async function validateCoupon(code: string, restaurantId: string, subtotal: number) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("يجب تسجيل الدخول قبل تطبيق الكوبون.");
  const response = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ code: normalizeCouponCode(code), restaurantId, subtotal }) });
  const body = await response.json().catch(() => null) as { success?: boolean; data?: CouponValidationResult; error?: { message?: string } } | null;
  if (!response.ok || !body?.success || !body.data) throw new Error(body?.error?.message ?? "تعذر التحقق من الكوبون.");
  return body.data;
}
