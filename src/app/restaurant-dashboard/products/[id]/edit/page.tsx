"use client";
import { useParams } from "next/navigation";
import { ProductForm } from "@/features/admin/product-form";
import { RestaurantShell } from "@/components/restaurant-dashboard/restaurant-shell";
import { useRestaurantAccount } from "@/features/restaurant-dashboard/restaurant-context";
import { AdminLoading } from "@/components/admin/admin-feedback";
export default function EditRestaurantProductPage() { const productId = String(useParams<{ id: string }>().id); const { restaurant, loading } = useRestaurantAccount(); return <RestaurantShell title="تعديل الأكلة">{loading || !restaurant ? <AdminLoading /> : <ProductForm restaurantId={restaurant.id} productId={productId} ownerMode />}</RestaurantShell>; }
