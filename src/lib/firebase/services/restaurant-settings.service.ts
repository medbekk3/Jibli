import type { RestaurantDocument } from "@/types/collections";
import { restaurantApi } from "../restaurant-api";
export type RestaurantSettingsInput = Pick<RestaurantDocument, "description" | "phone" | "address" | "logoUrl" | "logoPublicId" | "coverUrl" | "coverPublicId" | "deliveryTime" | "deliveryFee" | "minimumOrder" | "isOpen" | "workingHours">;
export const updateRestaurantSettings = (data: RestaurantSettingsInput) => restaurantApi<{ id: string }>("/api/restaurant/settings", { method: "PATCH", body: JSON.stringify(data) });
