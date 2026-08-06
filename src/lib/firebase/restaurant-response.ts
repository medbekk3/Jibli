import { apiError, apiSuccess } from "@/lib/api/response";
import { logProductionRouteError } from "@/lib/api/production-route-log";
import { isRestaurantSessionError } from "./restaurant-session";

export function restaurantSuccess<T>(data: T, status = 200) { return apiSuccess(data, status); }
export function restaurantFailure(code: string, message: string, status: number) { return apiError(code, message, status); }
export function restaurantError(api: string, stage: string, error: unknown, fallback: string) {
  const status = isRestaurantSessionError(error) ? error.status : 500;
  logProductionRouteError(api, status, error);
  if (isRestaurantSessionError(error)) return restaurantFailure(error.code, error.message, error.status);
  return restaurantFailure("RESTAURANT_OPERATION_FAILED", fallback, 500);
}
