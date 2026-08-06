"use client";
import { MapPin, Store } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryCard } from "@/components/ui/category-card";
import { OfferCard } from "@/components/ui/offer-card";
import { RestaurantCard } from "@/components/ui/restaurant-card";
import { SearchBar } from "@/components/ui/search-bar";
import { SectionTitle } from "@/components/ui/section-title";
import { useHomeData } from "@/features/public-data/hooks";

export default function HomePage(){
 const {data,loading,error,retry}=useHomeData();
 const openRestaurants=data.restaurants.filter(restaurant=>restaurant.isOpen).slice(0,6);
 return <AppShell><PageContainer>
  <section className="pb-5 pt-4 sm:pt-7"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-gray-500">ماذا تشتهي اليوم؟</p><span className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-gray-600 shadow-sm"><MapPin className="size-4 text-primary"/>بريان</span></div><SearchBar /></section>
  {loading?<HomeSkeleton/>:error?<ErrorState onRetry={retry}/>:<>
   {data.offers.length>0&&<section className="pb-7"><SectionTitle title="عروض اليوم"/><div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">{data.offers.map(offer=><div key={offer.id} className="w-[88%] shrink-0 snap-start sm:w-[48%]"><OfferCard offer={offer}/></div>)}</div></section>}
   <section className="pb-8"><SectionTitle title="مطاعم مفتوحة الآن"/>{openRestaurants.length?<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{openRestaurants.map((restaurant,index)=><RestaurantCard key={restaurant.id} restaurant={restaurant} priority={index===0}/>)}</div>:<div className="rounded-2xl bg-white p-5 text-center"><Store className="mx-auto size-6 text-gray-300"/><p className="mt-2 text-sm font-bold text-gray-500">لا توجد مطاعم مفتوحة حالياً.</p><Link href="/restaurants" className="mt-3 inline-flex min-h-11 items-center text-sm font-black text-primary">عرض المطاعم المغلقة</Link></div>}<Link href="/restaurants" className="mt-4 flex min-h-12 items-center justify-center rounded-2xl border border-primary/20 bg-white text-sm font-black text-primary">عرض كل المطاعم</Link></section>
   {data.categories.length>0&&<section className="pb-8"><SectionTitle title="اقتراحات سريعة"/><div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">{data.categories.slice(0,8).map(category=><CategoryCard key={category.id} category={category}/>)}</div></section>}
  </>}
 </PageContainer></AppShell>
}
function HomeSkeleton(){return <div className="space-y-7"><div className="h-44 animate-pulse rounded-3xl bg-white"/><div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4].map(i=><div key={i} className="h-64 animate-pulse rounded-3xl bg-white"/>)}</div></div>}
function ErrorState({onRetry}:{onRetry:()=>void}){return <div className="rounded-2xl bg-red-50 p-5 text-center text-sm font-bold text-red-600"><p>تعذر تحميل الصفحة الرئيسية. حاول مرة أخرى.</p><button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-xl bg-red-600 px-5 font-black text-white">إعادة المحاولة</button></div>}
