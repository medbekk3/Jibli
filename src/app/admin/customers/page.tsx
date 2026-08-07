"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState, AdminFilterBar, AdminLoadingSkeleton, AdminPageHeader, AdminSearchInput, StatusBadge, useAdminToast } from "@/components/admin/admin-ui";
import { getAdminCustomers, type AdminCustomer, type AdminCustomerDate } from "@/lib/firebase/services/admin-customer.service";
import { updateAdminUserStatus } from "@/lib/firebase/services/admin-user.service";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const { show } = useAdminToast();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await getAdminCustomers();
      setCustomers(result.customers); setTotal(result.total);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "تعذر تحميل الزبائن.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const visible = useMemo(() => customers.filter((customer) => {
    const phrase = search.trim().toLocaleLowerCase("ar");
    const matchesSearch = !phrase || customer.fullName.toLocaleLowerCase("ar").includes(phrase) || customer.email.toLocaleLowerCase().includes(phrase) || customer.phone.includes(phrase);
    return matchesSearch && (!status || customer.status === status);
  }), [customers, search, status]);

  async function toggle(customer: AdminCustomer) {
    if (updatingId) return;
    setUpdatingId(customer.uid);
    try {
      await updateAdminUserStatus(customer.uid, customer.status === "active" ? "suspended" : "active");
      show("تم تحديث حالة الزبون."); await load();
    } catch (caughtError) {
      show(caughtError instanceof Error ? caughtError.message : "تعذر تحديث حالة الزبون.", "error");
    } finally { setUpdatingId(""); }
  }

  return <AdminShell title="الزبائن">
    <AdminPageHeader title="الزبائن" description={`إجمالي الزبائن: ${new Intl.NumberFormat("ar-DZ-u-nu-latn").format(total)}`} breadcrumbs={[{ label: "الزبائن" }]} />
    <AdminFilterBar>
      <AdminSearchInput value={search} onChange={setSearch} placeholder="ابحث بالاسم أو البريد أو الهاتف" />
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm">
        <option value="">كل الحالات</option><option value="active">نشط</option><option value="suspended">موقوف</option>
      </select>
      <span className="mr-auto text-xs text-gray-400">{visible.length} زبون</span>
    </AdminFilterBar>
    {error && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600"><span>{error}</span><button type="button" onClick={() => void load()} className="rounded-lg bg-red-600 px-4 py-2 text-white">إعادة المحاولة</button></div>}
    {loading ? <AdminLoadingSkeleton /> : visible.length === 0 ? <AdminEmptyState title="لا يوجد زبائن" description={customers.length ? "لا توجد نتائج مطابقة للبحث والتصفية." : "لا توجد حسابات زبائن مسجلة حالياً."} /> : <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
      <table className="min-w-[960px] w-full border-separate border-spacing-0 text-right text-sm">
        <thead>
          <tr>
            {[
              "الاسم الكامل", "البريد الإلكتروني", "رقم الهاتف", "الحالة",
              "عدد الطلبات", "إجمالي الطلبات", "تاريخ التسجيل", "الإجراءات",
            ].map((header) => (
              <th
                key={header}
                scope="col"
                className="sticky top-0 z-10 h-16 border-b border-gray-200 bg-gray-50 px-4 py-3 text-right align-middle text-xs font-bold text-gray-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">

      {visible.map((customer) => <tr key={customer.uid} className="h-[68px] border-b border-gray-100 transition-colors hover:bg-orange-50/40">
        <td className="h-[68px] px-4 py-3 align-middle font-black">{customer.fullName || "—"}</td><td className="h-[68px] px-4 py-3 align-middle">{customer.email || "—"}</td><td className="h-[68px] px-4 py-3 align-middle">{customer.phone || "—"}</td>
        <td className="h-[68px] px-4 py-3 align-middle"><StatusBadge active={customer.status === "active"} /></td><td className="h-[68px] px-4 py-3 align-middle">{customer.ordersCount}</td><td className="h-[68px] px-4 py-3 align-middle">{new Intl.NumberFormat("ar-DZ-u-nu-latn").format(customer.totalSpent)} د.ج</td><td className="h-[68px] px-4 py-3 align-middle">{formatDate(customer.createdAt)}</td>
        <td className="h-[68px] px-4 py-3 align-middle"><div className="flex items-center gap-2"><Link href={`/admin/customers/${customer.uid}`} aria-label="عرض التفاصيل" className="grid size-9 place-items-center rounded-lg bg-gray-100"><Eye className="size-4" /></Link><button disabled={updatingId === customer.uid} onClick={() => void toggle(customer)} className="h-9 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-600 disabled:opacity-50">{updatingId === customer.uid ? "جاري التحديث..." : customer.status === "active" ? "توقيف" : "تفعيل"}</button></div></td>
      </tr>)}

        </tbody>
      </table>
    </div>}
  </AdminShell>;
}

function formatDate(value: AdminCustomerDate) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value.toDate();
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ar-DZ-u-nu-latn").format(date);
}

