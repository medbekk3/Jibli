"use client";

import { CheckCircle2, Layers3, Plus, Power, Settings, UtensilsCrossed, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminLoading } from "@/components/admin/admin-feedback";
import { RestaurantError } from "@/components/restaurant-dashboard/restaurant-feedback";
import { RestaurantShell } from "@/components/restaurant-dashboard/restaurant-shell";
import { RestaurantAccountState } from "@/features/restaurant-dashboard/account-state";
import { useAuth } from "@/features/auth/auth-context";
import { useRestaurantAccount } from "@/features/restaurant-dashboard/restaurant-context";
import { getRestaurantDashboard, setRestaurantOpenStatus, type RestaurantDashboardData } from "@/lib/firebase/services/restaurant-dashboard.service";

export default function RestaurantDashboardPage() {
  const { role, status } = useAuth(); const account = useRestaurantAccount();
  const [data, setData] = useState<RestaurantDashboardData | null>(null); const [error, setError] = useState(""); const [updating, setUpdating] = useState(false);
  const load = useCallback(async () => { try { setData(await getRestaurantDashboard()); setError(""); } catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر تحميل لوحة المطعم."); } }, []);
  useEffect(() => { if (role !== "restaurant" || status !== "active") return; let active = true; getRestaurantDashboard().then((value) => { if (active) { setData(value); setError(""); } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "تعذر تحميل لوحة المطعم."); }); return () => { active = false; }; }, [role, status]);
  if (role !== "restaurant") return null;
  if (status === "pending") return <RestaurantAccountState type="pending" />;
  if (status === "suspended") return <RestaurantAccountState type="suspended" />;
  if (account.loading || (!data && !error)) return <AdminLoading />;
  if (!account.restaurant) return error.includes("لا يوجد مطعم مرتبط") ? <RestaurantAccountState type="missing" /> : error ? <RestaurantShell title="لوحة المطعم"><RestaurantError message={error} onRetry={load} /></RestaurantShell> : <RestaurantAccountState type="missing" />;
  if (!data) return <RestaurantShell title="لوحة المطعم"><RestaurantError message={error} onRetry={load} /></RestaurantShell>;
  const restaurant = data.restaurant;
  async function toggle() { if (updating) return; setUpdating(true); try { await setRestaurantOpenStatus(!restaurant.isOpen); await Promise.all([load(), account.refresh()]); } catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر تحديث حالة المطعم."); } finally { setUpdating(false); } }
  const stats = [{ label: "عدد الأكلات", value: data.stats.total, icon: UtensilsCrossed }, { label: "الأكلات المتوفرة", value: data.stats.available, icon: CheckCircle2 }, { label: "غير المتوفرة", value: data.stats.unavailable, icon: XCircle }, { label: "التصنيفات المستخدمة", value: data.stats.categories, icon: Layers3 }];
  return <RestaurantShell title="لوحة المطعم" restaurant={restaurant} onToggleOpen={toggle} updatingOpen={updating}>
    {error && <div className="mb-4"><RestaurantError message={error} onRetry={load} /></div>}
    <section className="flex flex-col gap-4 rounded-3xl bg-gray-950 p-5 text-white sm:flex-row sm:items-center"><div className="relative size-20 overflow-hidden rounded-2xl bg-white/10">{restaurant.logoUrl && <Image src={restaurant.logoUrl} alt={`شعار ${restaurant.name}`} fill className="object-cover" sizes="80px" />}</div><div className="flex-1"><p className="text-sm text-white/55">مرحباً بك في مطعمك</p><h2 className="mt-1 text-2xl font-black">{restaurant.name}</h2><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${restaurant.isOpen ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>{restaurant.isOpen ? "مفتوح" : "مغلق"}</span></div><button onClick={toggle} disabled={updating} className={`flex h-12 items-center justify-center gap-2 rounded-2xl px-5 font-black disabled:opacity-60 ${restaurant.isOpen ? "bg-red-500" : "bg-primary"}`}><Power className="size-5" />{updating ? "جاري التحديث..." : restaurant.isOpen ? "إغلاق المطعم" : "فتح المطعم"}</button></section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl bg-white p-5 shadow-sm"><Icon className="size-5 text-primary" /><p className="mt-4 text-3xl font-black">{value}</p><p className="mt-1 text-sm text-gray-500">{label}</p></article>)}</section>
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Link href="/restaurant-dashboard/products/add" className="flex items-center gap-3 rounded-2xl bg-primary p-5 font-black text-white"><Plus />إضافة أكلة</Link><Link href="/restaurant-dashboard/products" className="flex items-center gap-3 rounded-2xl bg-white p-5 font-black shadow-sm"><UtensilsCrossed className="text-primary" />إدارة الأكلات</Link><Link href="/restaurant-dashboard/settings" className="flex items-center gap-3 rounded-2xl bg-white p-5 font-black shadow-sm"><Settings className="text-primary" />تعديل الإعدادات</Link><button onClick={toggle} disabled={updating} className="flex items-center gap-3 rounded-2xl bg-white p-5 text-right font-black shadow-sm"><Power className="text-primary" />{restaurant.isOpen ? "إغلاق المطعم" : "فتح المطعم"}</button></section>
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-black">أحدث الأكلات</h2><div className="mt-4 divide-y divide-gray-100">{data.latestProducts.map((product) => <Link key={product.id} href={`/restaurant-dashboard/products/${product.id}/edit`} className="flex items-center justify-between gap-3 py-3"><span className="font-bold">{product.name}</span><span className={product.isAvailable ? "text-emerald-600" : "text-gray-400"}>{product.isAvailable ? "متوفرة" : "غير متوفرة"}</span></Link>)}{data.latestProducts.length === 0 && <p className="py-8 text-center text-sm text-gray-400">لا توجد أكلات بعد.</p>}</div></section>
  </RestaurantShell>;
}
