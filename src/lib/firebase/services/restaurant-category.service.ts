import type { CategoryDocument } from "@/types/collections";
import { restaurantApi } from "../restaurant-api";
export type RestaurantCategory = CategoryDocument & { productsCount: number };
export const getRestaurantCategories = () => restaurantApi<RestaurantCategory[]>("/api/restaurant/categories");
