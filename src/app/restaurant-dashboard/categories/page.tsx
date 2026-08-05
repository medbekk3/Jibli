"use client";

import { Tags } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AdminError, AdminLoading } from "@/components/admin/admin-feedback";
import { RestaurantShell } from "@/components/restaurant-dashboard/restaurant-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useRestaurantAccount } from "@/features/restaurant-dashboard/restaurant-context";
import { getRestaurantCategories, type RestaurantCategory } from "@/lib/firebase/services/restaurant-category.service";

export default function RestaurantCategoriesPage() {
  const { restaurant } = useRestaurantAccount(); const [items, setItems] = useState<RestaurantCategory[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); try { setItems(await getRestaurantCategories()); setError(""); } catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر تحميل التصنيفات."); } finally { setLoading(false); } }, []);
  useEffect(() => { let active = true; getRestaurantCategories().then((value) => { if (active) { setItems(value); setError(""); setLoading(false); } }).catch((caught) => { if (active) { setError(caught instanceof Error ? caught.message : "تعذر تحميل التصنيفات."); setLoading(false); } }); return () => { active = false; }; }, []);
  return <RestaurantShell title="التصنيفات" restaurant={restaurant ?? undefined}><div className="mb-6"><h2 className="text-2xl font-black">التصنيفات المتاحة</h2><p className="mt-1 text-sm text-gray-500">يمكنك استعمال التصنيفات النشطة التي أنشأتها الإدارة، ولا يمكن تعديلها من هنا.</p></div>{error && <AdminError message={error} onRetry={load} />}{loading ? <AdminLoading /> : items.length === 0 ? <EmptyState icon={Tags} title="لا توجد تصنيفات نشطة" description="ستظهر التصنيفات هنا بعد إضافتها وتفعيلها من الإدارة." /> : <div className="overflow-hidden rounded-3xl bg-white shadow-sm"><table className="w-full text-right text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">التصنيف</th><th className="p-4">عدد أكلات مطعمك</th><th className="p-4">الاستخدام</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-gray-100"><td className="p-4"><div className="flex items-center gap-3"><div className="relative size-11 overflow-hidden rounded-xl bg-surface">{item.imageUrl && <Image src={item.imageUrl} alt={`صورة ${item.name}`} fill className="object-cover" sizes="44px" />}</div><span className="font-black">{item.name}</span></div></td><td className="p-4 font-bold">{item.productsCount}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${item.productsCount ? "bg-orange-50 text-primary" : "bg-gray-100 text-gray-500"}`}>{item.productsCount ? "مستخدم" : "غير مستخدم"}</span></td></tr>)}</tbody></table></div>}</RestaurantShell>;
}
