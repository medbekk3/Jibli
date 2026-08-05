"use client";

import { LoaderCircle, Search, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminFormSection, AdminPageHeader, useAdminToast } from "@/components/admin/admin-ui";
import { saveAdminNotification, type NotificationAudience, type NotificationType } from "@/lib/firebase/services/admin-notification.service";
import { getAdminUsers, type AdminUser } from "@/lib/firebase/services/admin-user.service";

export default function NotificationsPage() {
  const [saving, setSaving] = useState(false);
  const [audience, setAudience] = useState<NotificationAudience>("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const submittingRef = useRef(false);
  const { show } = useAdminToast();
  useEffect(() => { getAdminUsers().then(setUsers).catch(() => show("تعذر تحميل قائمة المستخدمين.", "error")); }, [show]);
  const filteredUsers = useMemo(() => users.filter((user) => `${user.fullName} ${user.email} ${user.phone}`.toLowerCase().includes(search.toLowerCase())).slice(0, 20), [search, users]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submittingRef.current) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    submittingRef.current = true;
    setSaving(true);
    try {
      await saveAdminNotification({ audience, targetUserId: audience === "user" ? targetUserId : null, title: String(form.get("title") ?? "").trim(), body: String(form.get("body") ?? "").trim(), type: String(form.get("type") ?? "general") as NotificationType, link: String(form.get("link") ?? "").trim() });
      formElement.reset(); setAudience("all"); setTargetUserId(""); setSearch(""); show("تم إرسال الإشعار بنجاح.");
    } catch (error) { show(error instanceof Error ? error.message : "تعذر نشر الإشعار.", "error"); }
    finally { submittingRef.current = false; setSaving(false); }
  }
  return <AdminShell title="الإشعارات"><AdminPageHeader title="إنشاء إشعار" description="نشر إشعار داخل التطبيق للفئة التي تختارها" breadcrumbs={[{ label: "الإشعارات" }]} /><form onSubmit={submit} className="max-w-3xl"><AdminFormSection title="بيانات الإشعار"><div className="space-y-4"><label className="block text-sm font-bold">الفئة<select value={audience} onChange={(event) => { setAudience(event.target.value as NotificationAudience); setTargetUserId(""); }} className="mt-2 h-11 w-full rounded-xl border px-3"><option value="all">الجميع</option><option value="customers">الزبائن</option><option value="restaurants">المطاعم</option><option value="user">مستخدم محدد</option></select></label>{audience === "user" && <div className="rounded-2xl border bg-gray-50 p-4"><label className="relative block"><Search className="absolute right-3 top-3.5 size-4 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو البريد أو الهاتف" className="h-11 w-full rounded-xl border bg-white pr-10 pl-3" /></label><select required value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} className="mt-3 h-11 w-full rounded-xl border bg-white px-3"><option value="">اختر المستخدم</option>{filteredUsers.map((user) => <option key={user.uid} value={user.uid}>{user.fullName || user.email} — {user.role === "customer" ? "زبون" : user.role === "restaurant" ? "مطعم" : "إدارة"}</option>)}</select></div>}<label className="block text-sm font-bold">نوع الإشعار<select name="type" className="mt-2 h-11 w-full rounded-xl border px-3"><option value="general">عام</option><option value="offer">عرض</option><option value="system">النظام</option><option value="order">طلب</option></select></label><label className="block text-sm font-bold">العنوان<input name="title" required maxLength={120} className="mt-2 h-11 w-full rounded-xl border px-3" /></label><label className="block text-sm font-bold">نص الإشعار<textarea name="body" required maxLength={500} rows={5} className="mt-2 w-full rounded-xl border p-3" /></label><label className="block text-sm font-bold">رابط اختياري داخل التطبيق<input name="link" placeholder="مثال: /offers" className="mt-2 h-11 w-full rounded-xl border px-3" /></label><div className="rounded-xl bg-orange-50 p-3 text-sm text-orange-800">سيظهر الإشعار لـ {audience === "all" ? "جميع المستخدمين" : audience === "customers" ? "الزبائن فقط" : audience === "restaurants" ? "حسابات المطاعم فقط" : "المستخدم المحدد فقط"}.</div><button disabled={saving || (audience === "user" && !targetUserId)} className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-black text-white disabled:opacity-50">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{saving ? "جاري النشر..." : "نشر الإشعار"}</button></div></AdminFormSection></form></AdminShell>;
}
