"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { getArabicAuthError } from "@/lib/firebase/errors";

import { useAuth } from "./auth-context";
import { AuthField, FormMessage } from "./form-fields";

export function LoginForm({ redirect, pendingNotice }: { redirect?: string; pendingNotice?: boolean }) {
  const router = useRouter();
  const { signIn, signOut } = useAuth();
  const [error, setError] = useState(pendingNotice ? "حساب المطعم في انتظار موافقة الإدارة." : "");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) { setError("أدخل البريد الإلكتروني وكلمة المرور."); return; }

    setSubmitting(true);
    try {
      const profile = await signIn(email, password);
      if (profile.role === "admin") {
        router.replace("/admin");
        router.refresh();
        return;
      }
      if (profile.role === "restaurant") { router.replace("/restaurant-dashboard"); return; }
      if (profile.status === "suspended") { await signOut(); setError("هذا الحساب موقوف. تواصل مع الإدارة للمساعدة."); return; }
      const safeRedirect = redirect === "/admin/dashboard" ? "/admin" : redirect;
      if (safeRedirect?.startsWith("/") && !safeRedirect.startsWith("//")) { router.replace(safeRedirect); return; }
      router.replace("/");
    } catch (caughtError) {
      setError(getArabicAuthError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <FormMessage type="error">{error}</FormMessage>}
      <AuthField label="البريد الإلكتروني" name="email" type="email" autoComplete="email" placeholder="اكتب بريدك الإلكتروني" required />
      <div><AuthField label="كلمة المرور" name="password" type="password" autoComplete="current-password" placeholder="اكتب كلمة المرور" required /><Link href="/forgot-password" className="mt-2 block w-fit text-xs font-bold text-primary">نسيت كلمة المرور؟</Link></div>
      <button disabled={submitting} type="submit" className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{submitting && <LoaderCircle className="size-5 animate-spin" />}{submitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}</button>
      <p className="text-center text-sm text-gray-500">ليس لديك حساب؟ <Link href="/register" className="font-black text-primary">أنشئ حساباً جديداً</Link></p>
    </form>
  );
}
