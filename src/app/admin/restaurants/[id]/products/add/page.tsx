import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/features/admin/product-form";
export default async function AddProductPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminShell title="إضافة أكلة"><ProductForm restaurantId={id} /></AdminShell>; }
