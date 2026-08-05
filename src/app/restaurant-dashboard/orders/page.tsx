"use client";

import { RefreshCw, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RestaurantShell } from "@/components/restaurant-dashboard/restaurant-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useRestaurantAccount } from "@/features/restaurant-dashboard/restaurant-context";
import { formatPrice } from "@/lib/format";
import { getRestaurantOrders, orderStatusLabel } from "@/lib/firebase/services/order.service";
import type { OrderDocument } from "@/types/collections";

const tabs = [{ id: "new", label: "طلبات جديدة" }, { id: "active", label: "قيد التنفيذ" }, { id: "delivery", label: "خرجت للتوصيل" }, { id: "completed", label: "مكتملة" }, { id: "rejected", label: "مرفوضة وملغاة" }] as const;

export default function RestaurantOrdersPage() {
  const { restaurant } = useRestaurantAccount(); const [orders, setOrders] = useState<OrderDocument[]>([]);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("new"); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async (silent = false) => { if (silent) setRefreshing(true); else setLoading(true); try { setOrders(await getRestaurantOrders()); setError(""); } catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر تحميل طلبات المطعم."); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void Promise.resolve().then(() => load()); const interval = window.setInterval(() => void load(true), 10_000); return () => window.clearInterval(interval); }, [load]);
  const filtered = useMemo(() => orders.filter((order) => tab === "new" ? order.status === "pending" : tab === "active" ? ["accepted", "preparing"].includes(order.status) : tab === "delivery" ? order.status === "out_for_delivery" : tab === "completed" ? order.status === "delivered" : ["rejected", "cancelled"].includes(order.status)), [orders, tab]);
  const newCount = orders.filter((order) => order.status === "pending").length;

  return <RestaurantShell title="الطلبات" restaurant={restaurant ?? undefined}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2 overflow-x-auto pb-2">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${tab === item.id ? "bg-primary text-white" : "bg-white text-gray-500"}`}>{item.label}{item.id === "new" && newCount > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-white px-1 text-xs text-primary">{newCount}</span>}</button>)}</div><button onClick={() => void load(true)} disabled={refreshing} className="flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black disabled:opacity-50"><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />تحديث الطلبات</button></div>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</p>}
    {loading ? <p className="py-16 text-center text-sm text-gray-400">جاري تحميل الطلبات...</p> : filtered.length ? <div className="grid gap-3 xl:grid-cols-2">{filtered.map((order) => <article key={order.id} className={`rounded-2xl bg-white p-5 shadow-sm ${order.status === "pending" ? "border-2 border-orange-200" : "border border-transparent"}`}><div className="flex justify-between gap-3"><div><p className="text-xs text-gray-400">{order.orderNumber}</p><h2 className="mt-1 font-black">{order.customerName}</h2><p className="mt-1 text-xs text-gray-500">{order.customerPhone} · {order.deliveryAddress.area}</p></div><div className="text-left"><span className="text-sm font-black text-primary">{formatPrice(order.total)}</span><p className="mt-1 text-xs text-gray-400">{elapsed(order.createdAt)}</p></div></div><div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 text-xs"><span>وقت الطلب: <strong>{formatTime(order.createdAt)}</strong></span><span>عدد العناصر: <strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</strong></span></div><div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500">{orderStatusLabel(order.status)}</span><Link href={`/restaurant-dashboard/orders/${order.id}`} className="rounded-xl bg-gray-950 px-4 py-2 text-xs font-black text-white">عرض التفاصيل</Link></div></article>)}</div> : <EmptyState icon={ShoppingBag} title="لا توجد طلبات" description="لا توجد طلبات ضمن هذا القسم حالياً." />}
  </RestaurantShell>;
}

function formatTime(value: OrderDocument["createdAt"]) { return value?.toDate ? new Intl.DateTimeFormat("ar-DZ-u-nu-latn", { hour: "2-digit", minute: "2-digit" }).format(value.toDate()) : "—"; }
function elapsed(value: OrderDocument["createdAt"]) { if (!value?.toDate) return "—"; const minutes = Math.max(0, Math.floor((Date.now() - value.toDate().getTime()) / 60_000)); return minutes < 1 ? "وصل الآن" : minutes < 60 ? `منذ ${minutes} دقيقة` : `منذ ${Math.floor(minutes / 60)} ساعة`; }
