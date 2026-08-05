import { AdminShell } from "@/components/admin/admin-shell";
import { RestaurantForm } from "@/features/admin/restaurant-form";
export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminShell title="تعديل المطعم"><RestaurantForm restaurantId={id} /></AdminShell>; }
