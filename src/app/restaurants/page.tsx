"use client";

import { SlidersHorizontal, Store } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { RestaurantCard } from "@/components/ui/restaurant-card";
import { SearchBar } from "@/components/ui/search-bar";
import { useRestaurantsData } from "@/features/public-data/hooks";

export default function RestaurantsPage() {
  const { data: restaurants, loading, error, retry } = useRestaurantsData(); const [query, setQuery] = useState(""); const [status, setStatus] = useState<"all" | "open" | "closed">("all");
  const filtered = restaurants.filter((restaurant) => restaurant.name.includes(query.trim()) && (status === "all" || (status === "open" ? restaurant.isOpen : !restaurant.isOpen)));
  return <AppShell title="المطاعم"><PageContainer className="py-7"><div className="mb-6"><p className="text-sm text-gray-500">كل مطاعم بريان في مكان واحد</p><h1 className="mt-1 text-2xl font-black">اختار مطعمك</h1></div><div className="mb-7 grid gap-2 sm:grid-cols-[1fr_190px]"><SearchBar placeholder="ابحث باسم المطعم" value={query} onChange={setQuery} /><label className="relative"><SlidersHorizontal className="absolute top-4 right-3 size-4 text-gray-400" /><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="تصفية المطاعم حسب الحالة" className="h-13 w-full rounded-2xl border border-gray-100 bg-white pr-10 pl-3 text-sm font-bold shadow-sm"><option value="all">كل المطاعم</option><option value="open">المطاعم المفتوحة</option><option value="closed">المطاعم المغلقة</option></select></label></div>{error ? <div className="rounded-2xl bg-red-50 p-5 text-center text-sm font-bold text-red-600"><p>تعذر تحميل المطاعم. حاول مرة أخرى.</p><button type="button" onClick={retry} className="mt-4 h-10 rounded-xl bg-red-600 px-5 font-black text-white">إعادة المحاولة</button></div> : loading ? <div className="py-20 text-center text-sm font-bold text-gray-400">جاري تحميل المطاعم...</div> : restaurants.length === 0 ? <EmptyState icon={Store} title="لا توجد مطاعم متاحة حالياً." description="ستظهر المطاعم هنا بعد تفعيلها من الإدارة." /> : <><p className="mb-4 text-sm font-bold text-gray-500">{new Intl.NumberFormat("ar-DZ-u-nu-latn").format(filtered.length)} مطاعم متاحة</p>{filtered.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div> : <EmptyState icon={SlidersHorizontal} title="لا توجد نتائج" description="جرّب اسماً آخر أو غيّر حالة التصفية." />}</>}</PageContainer></AppShell>;
}

