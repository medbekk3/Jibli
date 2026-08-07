"use client";

import { Clock3, SearchX, ShoppingBag, Store } from "lucide-react";
import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/ui/product-card";
import { formatArabicNumber } from "@/lib/format";
import { useRestaurantData } from "./hooks";

export function RestaurantView({ id }: { id: string }) {
  const { data, loading, error, retry } = useRestaurantData(id);
  const { restaurant, products } = data;
  if (loading) return <AppShell backHref="/restaurants"><div className="py-24 text-center text-sm font-bold text-muted">جاري تحميل المطعم...</div></AppShell>;
  if (error || !restaurant) return <AppShell backHref="/restaurants"><PageContainer className="py-12"><div className="space-y-4"><EmptyState icon={SearchX} title="المطعم غير متاح حالياً." description={error || "المطعم غير موجود أو تم توقيفه."} />{error && <button type="button" onClick={retry} className="mx-auto flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-black text-white">إعادة المحاولة</button>}</div></PageContainer></AppShell>;

  const productCategories = [...new Set(products.map((product) => product.category))];
  return <AppShell backHref="/restaurants">
    <div className="relative h-64 w-full bg-surface sm:h-80">{restaurant.image ? <Image src={restaurant.image} alt={`غلاف ${restaurant.name}`} fill priority className="object-cover" sizes="100vw" /> : <span className="grid h-full place-items-center text-muted"><Store className="size-16" /></span>}<div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" /></div>
    <PageContainer className="relative -mt-14"><section className="rounded-[24px] border border-white bg-white p-5 shadow-[0_16px_40px_rgba(6,26,53,.12)] sm:p-7"><div className="flex items-start gap-4"><div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-[22px] border-4 border-white bg-surface text-muted shadow-lg">{restaurant.logo ? <Image src={restaurant.logo} alt={`شعار ${restaurant.name}`} fill className="object-cover" sizes="80px" /> : <Store className="size-8" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black text-ink">{restaurant.name}</h1><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${restaurant.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{restaurant.isOpen ? "مفتوح" : "مغلق"}</span></div>{restaurant.description && <p className="mt-2 text-sm leading-6 text-muted">{restaurant.description}</p>}</div></div><div className="mt-5 flex gap-5 border-t border-line pt-4"><Info icon={Clock3} label="وقت التوصيل" value={formatArabicNumber(restaurant.deliveryTime || "غير محددة")} /><Info icon={ShoppingBag} label="أقل طلب" value={formatArabicNumber(restaurant.minimumOrder)} /></div></section>
      {productCategories.length > 0 && <div className="sticky top-[4.5rem] z-30 -mx-4 mt-5 flex gap-2 overflow-x-auto border-y border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">{productCategories.map((category) => <span key={category} className="whitespace-nowrap rounded-full bg-surface px-4 py-2 text-xs font-black text-muted">{category || "الأكلات"}</span>)}</div>}
      <section className="py-6"><h2 className="mb-4 text-xl font-black text-ink">قائمة الأكلات</h2>{products.length ? <div className="grid gap-3 md:grid-cols-2">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState icon={ShoppingBag} title="لم يضف المطعم قائمة الطعام بعد." description="ستظهر الأكلات هنا عند إضافتها من المطعم." />}</section>
    </PageContainer>
  </AppShell>;
}
function Info({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) { return <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="size-4" /></span><span><p className="text-[10px] text-muted">{label}</p><p className="text-xs font-black text-ink">{value}</p></span></div>; }
