"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { getArabicAuthError } from "@/lib/firebase/errors";

import { useAuth } from "./auth-context";
import { AuthField, FormMessage } from "./form-fields";

export function RegisterForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const passwordConfirmation = String(form.get("passwordConfirmation") ?? "");
    const acceptedTerms = form.get("terms") === "on";

    if (!firstName || !lastName || !phone || !email || !password || !passwordConfirmation) { setError("أكمل جميع الحقول المطلوبة."); return; }
    if (password.length < 6) { setError("كلمة المرور يجب أن تحتوي على ستة أحرف على الأقل."); return; }
    if (password !== passwordConfirmation) { setError("كلمتا المرور غير متطابقتين."); return; }
    if (!acceptedTerms) { setError("يجب الموافقة على الشروط لإنشاء الحساب."); return; }

    setSubmitting(true);
    try {
      await signUp({ firstName, lastName, phone, email, password });
      router.replace("/profile");
    } catch (caughtError) {
      setError(getArabicAuthError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <FormMessage type="error">{error}</FormMessage>}
      <div className="grid gap-4 sm:grid-cols-2"><AuthField label="الاسم" name="firstName" autoComplete="given-name" placeholder="الاسم" required /><AuthField label="اللقب" name="lastName" autoComplete="family-name" placeholder="اللقب" required /></div>
      <AuthField label="رقم الهاتف" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0550 00 00 00" required />
      <AuthField label="البريد الإلكتروني" name="email" type="email" autoComplete="email" placeholder="اكتب بريدك الإلكتروني" required />
      <AuthField label="كلمة المرور" name="password" type="password" autoComplete="new-password" placeholder="ستة أحرف على الأقل" minLength={6} required />
      <AuthField label="تأكيد كلمة المرور" name="passwordConfirmation" type="password" autoComplete="new-password" placeholder="أعد كتابة كلمة المرور" minLength={6} required />
      <label className="flex items-start gap-3 text-sm leading-6 text-gray-600"><input name="terms" type="checkbox" className="mt-1 size-4 accent-primary" required /><span>أوافق على شروط الاستخدام وسياسة الخصوصية.</span></label>
      <button disabled={submitting} type="submit" className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{submitting && <LoaderCircle className="size-5 animate-spin" />}{submitting ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}</button>
      <p className="text-center text-sm text-gray-500">لديك حساب؟ <Link href="/login" className="font-black text-primary">سجّل الدخول</Link></p>
    </form>
  );
}
