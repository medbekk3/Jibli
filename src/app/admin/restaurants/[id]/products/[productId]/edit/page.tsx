import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/features/admin/product-form";
export default async function EditProductPage({ params }: { params: Promise<{ id: string; productId: string }> }) { const { id, productId } = await params; return <AdminShell title="تعديل الأكلة"><ProductForm restaurantId={id} productId={productId} /></AdminShell>; }
