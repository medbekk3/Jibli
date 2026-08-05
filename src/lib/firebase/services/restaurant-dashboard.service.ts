import type { ProductDocument, RestaurantDocument, UserDocument } from "@/types/collections";
import { restaurantApi } from "../restaurant-api";

export type RestaurantDashboardData = {
  restaurant: RestaurantDocument;
  profile: UserDocument;
  stats: { total: number; available: number; unavailable: number; categories: number };
  latestProducts: ProductDocument[];
};

export const getRestaurantDashboard = () => restaurantApi<RestaurantDashboardData>("/api/restaurant/dashboard");
export const setRestaurantOpenStatus = (isOpen: boolean) => restaurantApi<{ isOpen: boolean }>("/api/restaurant/open-status", { method: "PATCH", body: JSON.stringify({ isOpen }) });
