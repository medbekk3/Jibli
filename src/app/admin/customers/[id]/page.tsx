"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminLoadingSkeleton, AdminPageHeader, StatusBadge, useAdminToast } from "@/components/admin/admin-ui";
import { getAdminCustomer, type AdminCustomer, type AdminCustomerDate } from "@/lib/firebase/services/admin-customer.service";
import { updateAdminUserStatus } from "@/lib/firebase/services/admin-user.service";

export default function AdminCustomerDetailsPage() {
  const id = String(useParams<{ id:string }>().id ?? "");
  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const { show } = useAdminToast();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setCustomer((await getAdminCustomer(id)).customer); }
    catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "تعذر تحميل بيانات الزبون."); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function toggle() {
    if (!customer || updating) return;
    setUpdating(true);
    try { await updateAdminUserStatus(customer.uid, customer.status === "active" ? "suspended" : "active"); show("تم تحديث حالة الزبون."); await load(); }
    catch (caughtError) { show(caughtError instanceof Error ? caughtError.message : "تعذر تحديث حالة الزبون.", "error"); }
    finally { setUpdating(false); }
  }

  return <AdminShell title="تفاصيل الزبون">
    {loading ? <AdminLoadingSkeleton /> : error ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600"><span>{error}</span><button onClick={() => void load()} className="rounded-lg bg-red-600 px-4 py-2 text-white">إعادة المحاولة</button></div> : !customer ? <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><p className="font-black">الزبون غير موجود</p></div> : <>
      <AdminPageHeader title={customer.fullName || "زبون"} description="بيانات حساب الزبون" breadcrumbs={[{label:"الزبائن",href:"/admin/customers"},{label:customer.fullName || "التفاصيل"}]} />
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><StatusBadge active={customer.status === "active"} /><dl className="mt-5 grid gap-4 md:grid-cols-2">{[["الاسم الكامل",customer.fullName || "—"],["البريد الإلكتروني",customer.email || "—"],["رقم الهاتف",customer.phone || "—"],["تاريخ التسجيل",formatDate(customer.createdAt)],["عدد الطلبات",String(customer.ordersCount)],["إجمالي قيمة الطلبات",`${new Intl.NumberFormat("ar-DZ-u-nu-latn").format(customer.totalSpent)} د.ج`],["آخر طلب",formatDate(customer.lastOrderAt)]].map(([label,value]) => <div key={label} className="rounded-xl bg-gray-50 p-4"><dt className="text-xs text-gray-400">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl><button disabled={updating} onClick={() => void toggle()} className="mt-6 h-11 rounded-xl bg-red-50 px-4 font-bold text-red-600 disabled:opacity-50">{updating ? "جاري التحديث..." : customer.status === "active" ? "توقيف الحساب" : "تفعيل الحساب"}</button></section>
    </>}
  </AdminShell>;
}

function formatDate(value: AdminCustomerDate) { if (!value) return "—"; const date=typeof value === "string"?new Date(value):value.toDate(); return Number.isNaN(date.getTime())?"—":new Intl.DateTimeFormat("ar-DZ-u-nu-latn").format(date); }

