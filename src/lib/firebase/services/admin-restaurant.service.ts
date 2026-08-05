import { adminApi } from "../admin-api"; import type { CreateRestaurantInput,RestaurantDocument } from "@/types/collections";
export type AdminRestaurant=RestaurantDocument&{owner?:{uid:string;fullName?:string;email?:string;phone?:string}|null;productsCount?:number};
export const listAdminRestaurants=()=>adminApi<AdminRestaurant[]>("/api/admin/restaurants");
export const getAdminRestaurant=(id:string)=>adminApi<AdminRestaurant>(`/api/admin/restaurants/${id}`);
export function createRestaurantWithOwner(account:{firstName:string;lastName:string;email:string;phone:string;password:string},restaurant:Omit<CreateRestaurantInput,"ownerId">){return adminApi<{restaurantId:string;ownerId:string;email:string}>("/api/admin/restaurants",{method:"POST",body:JSON.stringify({account,restaurant})})}
export const updateAdminRestaurant=(id:string,data:Partial<Omit<CreateRestaurantInput,"ownerId">>)=>adminApi<{id:string;message:string}>(`/api/admin/restaurants/${id}`,{method:"PATCH",body:JSON.stringify(data)});
