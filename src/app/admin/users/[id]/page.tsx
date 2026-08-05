"use client";
import { KeyRound, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminLoadingSkeleton, AdminPageHeader, StatusBadge, UserRoleBadge, useAdminToast } from "@/components/admin/admin-ui";
import { createPasswordResetLink, getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from "@/lib/firebase/services/admin-user.service";
import type { UserRole } from "@/types/auth";
import type { UserDocument } from "@/types/collections";

export default function UserDetails() {
  const id = String(useParams<{ id: string }>().id); const [item, setItem] = useState<UserDocument | null>(null); const [loading, setLoading] = useState(true); const { show } = useAdminToast();
  const load = useCallback(async () => { const users = await getAdminUsers(); setItem(users.find((user) => user.uid === id) ?? null); setLoading(false); }, [id]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  async function changeStatus() { if (!item) return; await updateAdminUserStatus(id, item.status === "active" ? "suspended" : "active"); show("تم تحديث الحالة."); await load(); }
  async function changeRole(value: UserRole) { await updateAdminUserRole(id, value); show("تم تحديث نوع الحساب."); await load(); }
  async function reset() { const result = await createPasswordResetLink(id); await navigator.clipboard.writeText(result.link); show("تم نسخ رابط إعادة التعيين."); }
  return <AdminShell title="تفاصيل المستخدم">{loading ? <AdminLoadingSkeleton /> : !item ? <p>المستخدم غير موجود.</p> : <><AdminPageHeader title={item.fullName} description="بيانات المستخدم وإجراءات الحساب" breadcrumbs={[{ label: "المستخدمون", href: "/admin/users" }, { label: item.fullName }]} /><section className="rounded-2xl bg-white p-6 shadow-sm"><span className="grid size-16 place-items-center rounded-2xl bg-orange-50 text-primary"><UserRound className="size-8" /></span><div className="mt-5 flex flex-wrap gap-2"><UserRoleBadge role={item.role} /><StatusBadge active={item.status === "active"} /></div><dl className="mt-5 grid gap-4 md:grid-cols-2">{[["الاسم الكامل", item.fullName], ["البريد الإلكتروني", item.email], ["رقم الهاتف", item.phone], ["معرّف الحساب", item.uid]].map(([key, value]) => <div key={key} className="rounded-xl bg-gray-50 p-4"><dt className="text-xs text-gray-400">{key}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl><div className="mt-6 flex flex-wrap gap-3"><button onClick={changeStatus} className="h-11 rounded-xl bg-red-50 px-4 font-bold text-red-600">{item.status === "active" ? "توقيف الحساب" : "تفعيل الحساب"}</button><button onClick={reset} className="flex h-11 items-center gap-2 rounded-xl border px-4 font-bold"><KeyRound className="size-4" />إعادة تعيين كلمة المرور</button><select value={item.role} onChange={(event) => changeRole(event.target.value as UserRole)} className="h-11 rounded-xl border px-4 font-bold"><option value="customer">زبون</option><option value="restaurant">مطعم</option><option value="admin">إدارة</option></select></div></section></>}</AdminShell>;
}
