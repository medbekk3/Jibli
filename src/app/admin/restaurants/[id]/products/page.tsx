"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminError, AdminLoading } from "@/components/admin/admin-feedback";
import { AdminShell } from "@/components/admin/admin-shell";
import { deleteProduct, listRestaurantProducts as getRestaurantProducts } from "@/lib/firebase/services/admin-product.service";
import { formatPrice } from "@/lib/format";
import type { ProductDocument } from "@/types/collections";

export default function AdminProductsPage() {
  const restaurantId = String(useParams<{ id: string }>().id); const [items, setItems] = useState<ProductDocument[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(() => { getRestaurantProducts(restaurantId).then(setItems).catch(() => setError("تعذر تحميل الأكلات.")).finally(() => setLoading(false)); }, [restaurantId]); useEffect(load, [load]);
  async function remove(id: string) { if (!window.confirm("هل تريد حذف هذه الأكلة؟")) return; try { await deleteProduct(id); load(); } catch { setError("تعذر حذف الأكلة."); } }
  return <AdminShell title="إدارة الأكلات"><div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-sm text-gray-500">أكلات المطعم المحدد</p><h2 className="mt-1 text-2xl font-black">قائمة الأكلات</h2></div><Link href={`/admin/restaurants/${restaurantId}/products/add`} className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white"><Plus className="size-4" />إضافة أكلة</Link></div>{error && <AdminError message={error} />}{loading ? <AdminLoading /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-3xl bg-white shadow-sm"><div className="relative h-40 bg-surface">{item.imageUrl && <Image src={item.imageUrl} alt={`صورة ${item.name}`} fill className="object-cover" sizes="360px" />}</div><div className="p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-black">{item.name}</h3><p className="mt-1 text-sm font-black text-primary">{formatPrice(item.price)}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${item.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{item.isAvailable ? "متوفرة" : "غير متوفرة"}</span></div><div className="mt-4 flex gap-2"><Link href={`/admin/restaurants/${restaurantId}/products/${item.id}/edit`} aria-label={`تعديل ${item.name}`} className="grid size-9 place-items-center rounded-xl bg-gray-100"><Pencil className="size-4" /></Link><button type="button" onClick={() => remove(item.id)} aria-label={`حذف ${item.name}`} className="grid size-9 place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 className="size-4" /></button></div></div></article>)}</div>}</AdminShell>;
}
