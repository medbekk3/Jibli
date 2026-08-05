"use client";
import { SearchX } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductDetails } from "@/features/products/product-details";
import { useProductData } from "./hooks";
export function ProductView({ id }: { id: string }) { const { data: product, loading, error, retry } = useProductData(id); if (loading) return <AppShell backHref="/restaurants"><div className="py-24 text-center text-sm font-bold text-gray-400">جاري تحميل الأكلة...</div></AppShell>; if (error || !product) return <AppShell backHref="/restaurants"><PageContainer className="py-12"><EmptyState icon={SearchX} title="الأكلة غير متوفرة" description={error || "هذه الأكلة غير متوفرة حالياً."} />{error && <button type="button" onClick={retry} className="mx-auto mt-4 flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-black text-white">إعادة المحاولة</button>}</PageContainer></AppShell>; return <AppShell backHref={`/restaurants/${product.restaurantId}`}><ProductDetails product={product} /></AppShell>; }
