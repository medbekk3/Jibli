import { apiError, apiSuccess } from "@/lib/api/response";
import { isRestaurantSessionError } from "./restaurant-session";

export function restaurantSuccess<T>(data: T, status = 200) { return apiSuccess(data, status); }
export function restaurantFailure(code: string, message: string, status: number) { return apiError(code, message, status); }
export function restaurantError(api: string, stage: string, error: unknown, fallback: string) {
  const details = error instanceof Error ? { code: (error as Error & { code?: string }).code ?? "unknown", message: error.message } : { code: "unknown", message: "خطأ غير معروف" };
  console.error("[واجهة المطعم] فشل الطلب", { api, stage, errorCode: details.code, errorMessage: details.message });
  if (isRestaurantSessionError(error)) return restaurantFailure(error.code, error.message, error.status);
  return restaurantFailure("RESTAURANT_OPERATION_FAILED", fallback, 500);
}
