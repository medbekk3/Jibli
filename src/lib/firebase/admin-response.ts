import { apiError, apiSuccess } from "@/lib/api/response";
import { logProductionRouteError } from "@/lib/api/production-route-log";

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

export function logAdminApiFailure(route: string, _stage: string, error: unknown, status = 500) {
  logProductionRouteError(route, status, error);
}
