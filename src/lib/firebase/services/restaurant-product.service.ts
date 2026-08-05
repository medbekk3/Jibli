import type { CreateProductInput, ProductDocument } from "@/types/collections";
import { restaurantApi } from "../restaurant-api";

export type RestaurantProductInput = Omit<CreateProductInput, "restaurantId">;
export const getRestaurantProducts = () => restaurantApi<ProductDocument[]>("/api/restaurant/products");
export const getRestaurantProduct = (id: string) => restaurantApi<ProductDocument>(`/api/restaurant/products/${encodeURIComponent(id)}`);
export const createRestaurantProduct = (data: RestaurantProductInput) => restaurantApi<{ id: string }>("/api/restaurant/products", { method: "POST", body: JSON.stringify(data) });
export const updateRestaurantProduct = (id: string, data: RestaurantProductInput) => restaurantApi<{ id: string }>(`/api/restaurant/products/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteRestaurantProduct = (id: string) => restaurantApi<{ id: string }>(`/api/restaurant/products/${encodeURIComponent(id)}`, { method: "DELETE" });
