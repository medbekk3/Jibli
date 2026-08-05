"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "./auth-context";

export function RoleLanding({ title, description }: { title: string; description: string }) {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  async function leave() { await signOut(); router.replace("/login"); }

  return <main className="grid min-h-dvh place-items-center bg-surface p-5"><div className="w-full max-w-lg rounded-3xl bg-white p-7 text-center shadow-sm"><span className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-primary"><ShieldCheck className="size-8" /></span><h1 className="mt-5 text-2xl font-black">{title}</h1><p className="mt-2 text-sm leading-7 text-gray-500">{description}</p>{profile && <p className="mt-4 rounded-xl bg-surface p-3 text-sm font-bold">{profile.fullName}</p>}<button type="button" onClick={leave} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 font-black text-white"><LogOut className="size-5" />تسجيل الخروج</button></div></main>;
}
