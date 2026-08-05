import { adminApi } from "../admin-api";
import type { OrderDocument, ProductDocument, RestaurantDocument, UserDocument } from "@/types/collections";

export type AdminDashboardStats = {
  restaurants:number; activeRestaurants:number; closedRestaurants:number; users:number; customers:number; restaurantUsers:number;
  categories:number; products:number; offers:number; orders:number; dailyOrders:number; newOrders:number; ongoingOrders:number;
  completedOrders:number; rejectedOrCancelledOrders:number; totalSales:number; totalDeliveryFees:number;
};
export type AdminActivityLog = { id:string; adminId:string; action:string; entityType:string; entityId:string; description:string; createdAt:UserDocument["createdAt"] };
export type AdminDashboardData = {
  stats:AdminDashboardStats; latestRestaurants:RestaurantDocument[]; latestUsers:UserDocument[]; latestProducts:ProductDocument[];
  latestOrders:OrderDocument[]; suspendedRestaurants:RestaurantDocument[]; activityLogs:AdminActivityLog[]; generatedAt:string;
};
export const getAdminDashboardData = () => adminApi<AdminDashboardData>("/api/admin/dashboard");
