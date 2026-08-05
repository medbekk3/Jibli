"use client";
import { ProductForm } from "@/features/admin/product-form";
import { RestaurantShell } from "@/components/restaurant-dashboard/restaurant-shell";
import { useRestaurantAccount } from "@/features/restaurant-dashboard/restaurant-context";
import { AdminLoading } from "@/components/admin/admin-feedback";
export default function AddRestaurantProductPage() { const { restaurant, loading } = useRestaurantAccount(); return <RestaurantShell title="إضافة أكلة">{loading || !restaurant ? <AdminLoading /> : <ProductForm restaurantId={restaurant.id} ownerMode />}</RestaurantShell>; }
