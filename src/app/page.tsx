"use client";

import { MapPin, Store } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryCard } from "@/components/ui/category-card";
import { EmptyState } from "@/components/ui/empty-state";
import { OfferCard } from "@/components/ui/offer-card";
import { RestaurantCard } from "@/components/ui/restaurant-card";
import { SearchBar } from "@/components/ui/search-bar";
import { SectionTitle } from "@/components/ui/section-title";
import { useHomeData } from "@/features/public-data/hooks";

export default function HomePage() {
  const { data, loading, error, retry } = useHomeData(); const openRestaurants = data.restaurants.filter((restaurant) => restaurant.isOpen); const featuredRestaurants = data.restaurants.filter((restaurant) => restaurant.popular);
  return <AppShell><PageContainer><section className="py-7 sm:py-10"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-sm text-gray-500">أهلاً بك في جيبلي 👋</p><h1 className="mt-1 text-2xl font-black sm:text-3xl"></h1></div><div className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-gray-600 shadow-sm"><MapPin className="size-4 text-primary" />بريان</div></div><SearchBar /></section>{error ? <ErrorState message="تعذر تحميل المطاعم. حاول مرة أخرى." onRetry={retry} /> : loading ? <div className="py-20 text-center text-sm font-bold text-gray-400">جاري تحميل المطاعم...</div> : data.restaurants.length === 0 ? <EmptyState icon={Store} title="لا توجد مطاعم متاحة حالياً." description="ستظهر المطاعم هنا بعد إضافتها وتفعيلها من الإدارة." /> : <>{data.categories.length > 0 && <section className="pb-8"><SectionTitle title=" ماذا تريد أن تأكل ؟ " /><div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-6 sm:overflow-visible">{data.categories.map((category) => <CategoryCard key={category.id} category={category} />)}</div></section>}<section className="pb-10"><SectionTitle title="المطاعم المفتوحة" href="/restaurants" />{openRestaurants.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{openRestaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div> : <EmptyState icon={Store} title="لا توجد مطاعم مفتوحة" description="يمكنك تصفح المطاعم المغلقة والعودة لاحقاً." />}</section>{featuredRestaurants.length > 0 && <section className="pb-10"><SectionTitle title="المطاعم المميزة" href="/restaurants" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{featuredRestaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} compact />)}</div></section>}<section className="pb-10"><SectionTitle title="جميع المطاعم" href="/restaurants" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div></section>{data.offers.length > 0 && <section className="pb-10"><SectionTitle title="عروض ما تتفوتش" /><div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible">{data.offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}</div></section>}</>}</PageContainer></AppShell>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="mb-6 rounded-2xl bg-red-50 p-5 text-center text-sm font-bold text-red-600"><p>{message}</p><button type="button" onClick={onRetry} className="mt-4 h-10 rounded-xl bg-red-600 px-5 font-black text-white">إعادة المحاولة</button></div>; }
