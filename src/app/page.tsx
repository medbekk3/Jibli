"use client";

import { MapPin, SearchX, Store, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryCard } from "@/components/ui/category-card";
import { AutoOffersSlider } from "@/components/ui/auto-offers-slider";
import { RestaurantCard } from "@/components/ui/restaurant-card";
import { SearchBar } from "@/components/ui/search-bar";
import { SectionTitle } from "@/components/ui/section-title";
import { useHomeData } from "@/features/public-data/hooks";
import { loadPublicProducts } from "@/lib/firebase/public-data";
import type { Product } from "@/types";

export default function HomePage() {
  const { data, loading, error, retry } = useHomeData();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const normalizedQuery = normalize(query);

  useEffect(() => {
    if (!normalizedQuery || data.restaurants.length === 0) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setSearchingProducts(true);
      void Promise.all(data.restaurants.slice(0, 12).map((restaurant) => loadPublicProducts(restaurant.id).catch(() => []))).then((groups) => {
        if (active) setProducts(groups.flat());
      }).finally(() => { if (active) setSearchingProducts(false); });
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [data.restaurants, normalizedQuery]);

  const search = useMemo(() => {
    if (!normalizedQuery) return { restaurants: [], products: [], categories: [] };
    return {
      restaurants: data.restaurants.filter((item) => normalize(item.name).includes(normalizedQuery)).slice(0, 3),
      products: products.filter((item) => normalize(item.name).includes(normalizedQuery)).slice(0, 4),
      categories: data.categories.filter((item) => normalize(item.name).includes(normalizedQuery)).slice(0, 3),
    };
  }, [data.categories, data.restaurants, normalizedQuery, products]);

  const hasResults = search.restaurants.length + search.products.length + search.categories.length > 0;
  const openRestaurants = data.restaurants.filter((restaurant) => restaurant.isOpen).slice(0, 6);

  return <AppShell><PageContainer>
    <section className="pb-5 pt-4 sm:pt-7">
      <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-muted">أهلاً بك في جيبلي</p><span className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-muted shadow-sm"><MapPin className="size-4 text-primary" />بريان</span></div>
      <SearchBar value={query} onChange={setQuery} />
      {normalizedQuery && <div role="status" className="relative z-20 mt-2 rounded-2xl border border-line bg-white p-3 shadow-lg">
        {searchingProducts && <p className="px-2 py-2 text-xs font-bold text-muted">جاري البحث…</p>}
        {!searchingProducts && !hasResults && <div className="flex items-center gap-2 px-2 py-3 text-sm font-bold text-muted"><SearchX className="size-5 text-primary" />لا توجد نتائج مطابقة لـ «{query}».</div>}
        {hasResults && <div className="space-y-1">
          {search.restaurants.map((item) => <SearchLink key={item.id} href={`/restaurants/${item.id}`} label={item.name} type="مطعم" />)}
          {search.products.map((item) => <SearchLink key={item.id} href={`/products/${item.id}`} label={item.name} type="أكلة" />)}
          {search.categories.map((item) => <SearchLink key={item.id} href="/restaurants" label={item.name} type="تصنيف" />)}
        </div>}
      </div>}
    </section>
    {loading ? <HomeSkeleton /> : error ? <ErrorState onRetry={retry} /> : <>
      {data.offers.length > 0 && <section className="pb-7"><SectionTitle title="عروض اليوم" /><AutoOffersSlider offers={data.offers} /></section>}
      {data.categories.length > 0 && <section className="pb-8"><SectionTitle title="التصنيفات" /><div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">{data.categories.slice(0, 8).map((category) => <CategoryCard key={category.id} category={category} />)}</div></section>}
      <section className="pb-8"><SectionTitle title="مطاعم مفتوحة الآن" />{openRestaurants.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{openRestaurants.map((restaurant, index) => <RestaurantCard key={restaurant.id} restaurant={restaurant} priority={index === 0} />)}</div> : <div className="rounded-2xl bg-white p-5 text-center"><Store className="mx-auto size-6 text-gray-300" /><p className="mt-2 text-sm font-bold text-muted">لا توجد مطاعم مفتوحة حالياً.</p></div>}</section>
      <section className="pb-8"><SectionTitle title="المطاعم" href="/restaurants" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.restaurants.slice(0, 6).map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div>{data.restaurants.length > 6 && <Link href="/restaurants" className="mt-4 flex min-h-12 items-center justify-center rounded-2xl border border-primary/20 bg-white text-sm font-black text-primary">عرض كل المطاعم</Link>}</section>
    </>}
  </PageContainer></AppShell>;
}
function SearchLink({ href, label, type }: { href: string; label: string; type: string }) { return <Link href={href} className="flex min-h-11 items-center justify-between rounded-xl px-2 text-sm font-bold transition hover:bg-primary-soft"><span>{label}</span><span className="flex items-center gap-1 text-[11px] text-muted">{type === "أكلة" ? <UtensilsCrossed className="size-3.5" /> : <Store className="size-3.5" />}{type}</span></Link>; }
function normalize(value: string) { return value.trim().toLocaleLowerCase("ar-DZ"); }
function HomeSkeleton() { return <div className="space-y-7"><div className="h-44 animate-pulse rounded-3xl bg-white" /><div className="flex gap-3 overflow-hidden">{[1, 2, 3].map((item) => <div key={item} className="h-24 w-20 shrink-0 animate-pulse rounded-2xl bg-white" />)}</div><div className="grid gap-4 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-56 animate-pulse rounded-3xl bg-white" />)}</div></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="rounded-2xl bg-red-50 p-5 text-center text-sm font-bold text-red-600"><p>تعذر تحميل الصفحة الرئيسية. حاول مرة أخرى.</p><button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-xl bg-red-600 px-5 font-black text-white">إعادة المحاولة</button></div>; }
