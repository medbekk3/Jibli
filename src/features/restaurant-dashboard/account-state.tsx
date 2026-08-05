"use client";

import { Clock3, LogOut, ShieldX, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

export function RestaurantAccountState({ type }: { type: "pending" | "suspended" | "missing" }) {
  const router = useRouter(); const { signOut } = useAuth();
  const content = type === "pending" ? { icon: Clock3, title: "الحساب قيد المراجعة", description: "تراجع الإدارة بيانات حساب المطعم حالياً. ستتمكن من الدخول بعد الموافقة." } : type === "suspended" ? { icon: ShieldX, title: "حساب المطعم موقوف", description: "تم إيقاف هذا الحساب. تواصل مع إدارة جيبلي لمعرفة التفاصيل." } : { icon: Store, title: "لا يوجد مطعم مرتبط", description: "لم نجد مطعماً مرتبطاً بحسابك. تواصل مع الإدارة لإضافة معرّف حسابك إلى المطعم." };
  const Icon = content.icon;
  async function leave() { await signOut(); router.replace("/login"); }
  return <main className="grid min-h-dvh place-items-center bg-surface p-5"><div className="w-full max-w-lg rounded-3xl bg-white p-7 text-center shadow-sm"><span className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-primary"><Icon className="size-8" /></span><h1 className="mt-5 text-2xl font-black">{content.title}</h1><p className="mt-3 text-sm leading-7 text-gray-500">{content.description}</p><button type="button" onClick={leave} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 font-black text-white"><LogOut className="size-5" />تسجيل الخروج</button></div></main>;
}
