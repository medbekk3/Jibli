import { computeCouponDiscount, couponMessages, type CouponValidationCode } from "./shared";

type CouponRecord = Record<string, unknown>;
export type CouponEvaluation = { valid: true; discount: number; coupon: CouponRecord; couponId: string } | { valid: false; code: CouponValidationCode; message: string };

function millis(value: unknown) {
  return value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function" ? (value as { toMillis: () => number }).toMillis() : value instanceof Date ? value.getTime() : 0;
}

export function evaluateCoupon(coupon: CouponRecord | undefined, couponId: string, input: { restaurantId: string; subtotal: number; userId: string; usedBefore: boolean; now?: number }): CouponEvaluation {
  if (!coupon) return failure("COUPON_INVALID");
  if (coupon.isActive !== true) return failure("COUPON_INACTIVE");
  const now = input.now ?? Date.now();
  const start = millis(coupon.startDate);
  const end = millis(coupon.endDate);
  if (start && now < start) return failure("COUPON_NOT_STARTED");
  if (end && now > end) return failure("COUPON_EXPIRED");
  if (coupon.isGlobal !== true && String(coupon.restaurantId ?? "") !== input.restaurantId) return failure("COUPON_RESTAURANT_MISMATCH");
  const allowed = Array.isArray(coupon.allowedUsers) ? coupon.allowedUsers.filter((value): value is string => typeof value === "string") : [];
  if (allowed.length > 0 && !allowed.includes(input.userId)) return failure("COUPON_NOT_ALLOWED");
  if (input.usedBefore && coupon.oneTimePerUser === true) return failure("COUPON_ALREADY_USED");
  const limit = Math.max(0, Number(coupon.usageLimit) || 0);
  if (limit > 0 && Math.max(0, Number(coupon.usedCount) || 0) >= limit) return failure("COUPON_USAGE_LIMIT_REACHED");
  const minimum = Math.max(0, Number(coupon.minimumOrder) || 0);
  if (input.subtotal < minimum) return failure("COUPON_MINIMUM_NOT_REACHED");
  const type = coupon.type === "fixed" ? "fixed" : "percentage";
  return { valid: true, couponId, coupon, discount: computeCouponDiscount({ type, percentage: Number(coupon.percentage) || 0, fixedAmount: Number(coupon.fixedAmount) || 0, maximumDiscount: Number(coupon.maximumDiscount) || 0 }, input.subtotal) };
}
function failure(code: CouponValidationCode): CouponEvaluation { return { valid: false, code, message: couponMessages[code] }; }
