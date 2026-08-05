"use client";

import { Bell, LayoutDashboard, ListPlus, LogOut, Menu, Power, Settings, ShoppingBag, Tags, UtensilsCrossed, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useNotifications } from "@/features/notifications/notification-context";
import type { RestaurantDocument } from "@/types/collections";

const links = [
  { href: "/restaurant-dashboard", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/restaurant-dashboard/products", label: "الأكلات", icon: UtensilsCrossed },
  { href: "/restaurant-dashboard/products/add", label: "إضافة أكلة", icon: ListPlus, exact: true },
  { href: "/restaurant-dashboard/categories", label: "التصنيفات", icon: Tags },
  { href: "/restaurant-dashboard/settings", label: "الإعدادات", icon: Settings },
  { href: "/restaurant-dashboard/orders", label: "الطلبات", icon: ShoppingBag },
  { href: "/restaurant-dashboard/notifications", label: "الإشعارات", icon: Bell },
];

export function RestaurantShell({ children, title, restaurant, onToggleOpen, updatingOpen = false }: { children: ReactNode; title: string; restaurant?: RestaurantDocument; onToggleOpen?: () => void; updatingOpen?: boolean }) {
  const pathname = usePathname(); const router = useRouter(); const { signOut } = useAuth(); const { unreadCount } = useNotifications(); const [open, setOpen] = useState(false);
  async function leave() { await signOut(); router.replace("/login"); router.refresh(); }
  const navigation = <><div className="flex h-20 items-center gap-3 border-b border-white/10 px-5"><div className="relative size-10 overflow-hidden rounded-xl bg-white/10">{restaurant?.logoUrl && <Image src={restaurant.logoUrl} alt={`شعار ${restaurant.name}`} fill className="object-cover" sizes="40px" />}</div><div className="min-w-0 flex-1"><Link href="/restaurant-dashboard" className="block text-xl font-black text-primary">جيبلي</Link><p className="truncate text-xs text-white/50">{restaurant?.name ?? "لوحة المطعم"}</p></div><button aria-label="إغلاق القائمة" onClick={() => setOpen(false)} className="md:hidden"><X className="size-5" /></button></div><nav className="space-y-1 p-3">{links.map(({ href, label, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${active ? "bg-primary text-white" : "text-white/65 hover:bg-white/5"}`}><Icon className="size-5" />{label}{href.endsWith("notifications") && unreadCount > 0 && <span className="mr-auto rounded-full bg-primary px-2 py-0.5 text-[10px] text-white">{unreadCount}</span>}</Link>; })}</nav><button onClick={leave} className="mx-3 mt-auto mb-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold"><LogOut className="size-5" />تسجيل الخروج</button></>;
  return <div className="min-h-dvh overflow-x-hidden bg-surface md:grid md:grid-cols-[250px_minmax(0,1fr)]"><aside className="sticky top-0 hidden h-dvh flex-col bg-gray-950 text-white md:flex">{navigation}</aside>{open && <div className="fixed inset-0 z-50 md:hidden"><button aria-label="إغلاق القائمة" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} /><aside className="relative flex h-full w-72 flex-col bg-gray-950 text-white">{navigation}</aside></div>}<div className="min-w-0"><header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/95 px-4 backdrop-blur sm:px-6"><button aria-label="فتح القائمة" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl bg-surface md:hidden"><Menu className="size-5" /></button><h1 className="min-w-0 flex-1 truncate text-lg font-black">{title}</h1>{restaurant && <span className={`hidden rounded-full px-3 py-1 text-xs font-black sm:inline-flex ${restaurant.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{restaurant.isOpen ? "المطعم مفتوح" : "المطعم مغلق"}</span>}{onToggleOpen && <button onClick={onToggleOpen} disabled={updatingOpen} className="flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-3 text-xs font-black text-white disabled:opacity-60"><Power className="size-4" />{updatingOpen ? "جاري التحديث" : restaurant?.isOpen ? "إغلاق" : "فتح"}</button>}<Link href="/restaurant-dashboard/notifications" aria-label="الإشعارات" className="relative grid size-10 place-items-center rounded-xl bg-orange-50 text-primary"><Bell className="size-4" />{unreadCount > 0 && <span className="absolute -left-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[9px] font-black text-white">{unreadCount > 99 ? "+99" : unreadCount}</span>}</Link><button onClick={leave} aria-label="تسجيل الخروج" className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-600"><LogOut className="size-4" /></button></header><main className="mx-auto min-w-0 max-w-7xl p-4 sm:p-6">{children}</main></div></div>;
}
