export type DiscountCouponType = "percentage" | "fixed";
export type CouponValidationCode = "COUPON_INVALID" | "COUPON_EXPIRED" | "COUPON_NOT_STARTED" | "COUPON_MINIMUM_NOT_REACHED" | "COUPON_USAGE_LIMIT_REACHED" | "COUPON_ALREADY_USED" | "COUPON_RESTAURANT_MISMATCH" | "COUPON_INACTIVE" | "COUPON_NOT_ALLOWED";

export const couponMessages: Record<CouponValidationCode, string> = {
  COUPON_INVALID: "الكوبون غير صالح.",
  COUPON_EXPIRED: "انتهت صلاحية الكوبون.",
  COUPON_NOT_STARTED: "الكوبون غير متاح بعد.",
  COUPON_MINIMUM_NOT_REACHED: "لم يصل الطلب إلى الحد الأدنى المطلوب للكوبون.",
  COUPON_USAGE_LIMIT_REACHED: "تم الوصول إلى الحد الأقصى لاستخدام الكوبون.",
  COUPON_ALREADY_USED: "تم استخدام هذا الكوبون سابقاً على هذا الحساب.",
  COUPON_RESTAURANT_MISMATCH: "هذا الكوبون غير متاح لهذا المطعم.",
  COUPON_INACTIVE: "الكوبون غير نشط حالياً.",
  COUPON_NOT_ALLOWED: "هذا الكوبون غير متاح لهذا الحساب.",
};

export function normalizeCouponCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

export function computeCouponDiscount(coupon: { type: DiscountCouponType; percentage?: number; fixedAmount?: number; maximumDiscount?: number }, subtotal: number) {
  const raw = coupon.type === "percentage" ? subtotal * Math.max(0, Number(coupon.percentage) || 0) / 100 : Math.max(0, Number(coupon.fixedAmount) || 0);
  const cap = Math.max(0, Number(coupon.maximumDiscount) || 0);
  return Math.min(subtotal, cap > 0 ? Math.min(raw, cap) : raw);
}
