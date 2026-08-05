"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { getArabicAuthError } from "@/lib/firebase/errors";

import { useAuth } from "./auth-context";
import { AuthField, FormMessage } from "./form-fields";

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(""); setSuccess("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) { setError("أدخل بريدك الإلكتروني."); return; }
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSuccess("تم إرسال رابط استرجاع كلمة المرور. تحقق من بريدك الإلكتروني.");
    } catch (caughtError) {
      setError(getArabicAuthError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <FormMessage type="error">{error}</FormMessage>}
      {success && <FormMessage type="success">{success}</FormMessage>}
      <AuthField label="البريد الإلكتروني" name="email" type="email" autoComplete="email" placeholder="اكتب بريدك الإلكتروني" required />
      <button disabled={submitting} type="submit" className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{submitting && <LoaderCircle className="size-5 animate-spin" />}{submitting ? "جاري الإرسال..." : "إرسال رابط الاسترجاع"}</button>
      <Link href="/login" className="block text-center text-sm font-black text-primary">العودة إلى تسجيل الدخول</Link>
    </form>
  );
}
