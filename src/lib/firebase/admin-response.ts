import { apiError, apiSuccess } from "@/lib/api/response";

export type AdminErrorCode =
  | "ADMIN_SESSION_REQUIRED"
  | "ADMIN_FORBIDDEN"
  | "FIREBASE_ADMIN_NOT_CONFIGURED"
  | "DASHBOARD_LOAD_FAILED"
  | "RESTAURANTS_LOAD_FAILED"
  | "USERS_LOAD_FAILED"
  | "CUSTOMERS_LOAD_FAILED"
  | "RESTAURANT_CREATE_FAILED"
  | "INVALID_FORM_DATA"
  | "ADMIN_OPERATION_FAILED";

export function adminSuccess<T>(data: T, status = 200) {
  return apiSuccess(data, status);
}

export function adminFailure(code: AdminErrorCode, message: string, status: number) {
  return apiError(code, message, status);
}

export function logAdminApiFailure(api: string, stage: string, error: unknown) {
  const value = error instanceof Error
    ? { code: (error as Error & { code?: string }).code ?? "unknown", message: error.message }
    : { code: "unknown", message: "خطأ غير معروف" };
  console.error("[واجهة الإدارة] فشل الطلب", { api, stage, errorCode: value.code, errorMessage: value.message });
}
