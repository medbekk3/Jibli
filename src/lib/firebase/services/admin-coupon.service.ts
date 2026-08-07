import { adminApi } from "../admin-api";
import type { DiscountCouponDocument } from "@/types/collections";

export type CouponInput = {
  code: string; title: string; description: string; type: "percentage" | "fixed"; percentage: number; fixedAmount: number;
  minimumOrder: number; maximumDiscount: number; restaurantId: string; isGlobal: boolean; usageLimit: number;
  oneTimePerUser: boolean; allowedUsers: string[]; isActive: boolean; startDate: string; endDate: string;
};
export const listAdminCoupons = () => adminApi<DiscountCouponDocument[]>("/api/admin/coupons");
export const createCoupon = (data: CouponInput) => adminApi<{ id: string }>("/api/admin/coupons", { method: "POST", body: JSON.stringify(data) });
export const updateCoupon = (id: string, data: CouponInput) => adminApi<{ id: string }>(`/api/admin/coupons/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteCoupon = (id: string) => adminApi<{ id: string }>(`/api/admin/coupons/${encodeURIComponent(id)}`, { method: "DELETE" });
