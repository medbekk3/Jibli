"use client";

import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AdminError, AdminLoading } from "@/components/admin/admin-feedback";
import { ImageUploader } from "@/components/ui/image-uploader";
import { listAdminCategories } from "@/lib/firebase/services/admin-category.service";
import { createProduct, getAdminProduct, updateProduct } from "@/lib/firebase/services/admin-product.service";
import { getRestaurantCategories } from "@/lib/firebase/services/restaurant-category.service";
import { createRestaurantProduct, getRestaurantProduct, updateRestaurantProduct } from "@/lib/firebase/services/restaurant-product.service";
import type { CategoryDocument, CreateProductInput, ProductAddon, ProductDocument } from "@/types/collections";

const inputClass = "mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-orange-50";
const newAddon = (): ProductAddon => ({ id: crypto.randomUUID(), name: "", price: 0, isAvailable: true });

export function ProductForm({ restaurantId, productId, ownerMode = false }: { restaurantId: string; productId?: string; ownerMode?: boolean }) {
  const router = useRouter();
  const [item, setItem] = useState<ProductDocument | null>(null);
  const [categories, setCategories] = useState<CategoryDocument[]>([]);
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [image, setImage] = useState({ url: "", publicId: "" });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState("");

  useEffect(() => {
    const productRequest = productId ? (ownerMode ? getRestaurantProduct(productId) : getAdminProduct(productId)) : Promise.resolve(null);
    const categoryRequest = ownerMode ? getRestaurantCategories() : listAdminCategories();
    Promise.all([categoryRequest, productRequest]).then(([categoryItems, product]) => {
      setCategories(categoryItems.filter((category) => category.isActive));
      if (product) { setItem(product); setAddons(product.addons ?? []); setImage({ url: product.imageUrl, publicId: product.imagePublicId }); }
    }).catch(() => setError("تعذر تحميل بيانات الأكلة أو لا تملك صلاحية تعديلها.")).finally(() => setLoading(false));
  }, [ownerMode, productId, restaurantId]);

  function updateAddon(id: string, values: Partial<ProductAddon>) { setAddons((current) => current.map((addon) => addon.id === id ? { ...addon, ...values } : addon)); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving) return; setError("");
    if (!image.url) { setError("ارفع صورة الأكلة قبل الحفظ."); return; }
    const form = new FormData(event.currentTarget);
    const data: CreateProductInput = { restaurantId, categoryId: String(form.get("categoryId") ?? ""), name: String(form.get("name") ?? "").trim(), description: String(form.get("description") ?? "").trim(), imageUrl: image.url, imagePublicId: image.publicId, price: Number(form.get("price")), preparationTime: Number(form.get("preparationTime")), isAvailable: form.get("isAvailable") === "on", isFeatured: form.get("isFeatured") === "on", displayOrder: Number(form.get("displayOrder")), addons: addons.filter((addon) => addon.name.trim()).map((addon) => ({ ...addon, name: addon.name.trim(), price: Number(addon.price) })) };
    if (!data.name || !data.description || !data.categoryId) { setError("أكمل جميع الحقول المطلوبة."); return; }
    setSaving(true);
    try {
      if (ownerMode) {
        const { restaurantId: _restaurantId, ...ownedData } = data; void _restaurantId;
        if (productId) await updateRestaurantProduct(productId, ownedData); else await createRestaurantProduct(ownedData);
        router.replace("/restaurant-dashboard/products");
      } else {
        if (productId) await updateProduct(productId, data); else await createProduct(data);
        router.replace(`/admin/restaurants/${restaurantId}/products`);
      }
    } catch { setError("تعذر حفظ الأكلة. تحقق من الصلاحيات وحاول مجدداً."); } finally { setSaving(false); }
  }
  if (loading) return <AdminLoading />;
  return <form onSubmit={submit} className="space-y-6">
    {error && <AdminError message={error} />}
    <section className="grid gap-5 rounded-3xl bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-7">
      <label className="text-sm font-bold">اسم الأكلة<input name="name" defaultValue={item?.name} className={inputClass} required /></label>
      <label className="text-sm font-bold">التصنيف<select name="categoryId" defaultValue={item?.categoryId ?? ""} className={inputClass} required><option value="" disabled>اختر التصنيف</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="text-sm font-bold sm:col-span-2">الوصف<textarea name="description" defaultValue={item?.description} rows={3} className={`${inputClass} h-auto py-3`} required /></label>
      <label className="text-sm font-bold">السعر<input name="price" type="number" min="0" defaultValue={item?.price ?? 0} className={inputClass} required /></label>
      <label className="text-sm font-bold">مدة التحضير بالدقائق<input name="preparationTime" type="number" min="0" defaultValue={item?.preparationTime ?? 15} className={inputClass} required /></label>
      <label className="text-sm font-bold">ترتيب العرض<input name="displayOrder" type="number" min="0" defaultValue={item?.displayOrder ?? 0} className={inputClass} required /></label>
      <div className="flex items-end gap-5 pb-3"><label className="flex items-center gap-2 text-sm font-bold"><input name="isAvailable" type="checkbox" defaultChecked={item?.isAvailable ?? true} className="size-4 accent-primary" />متوفرة</label><label className="flex items-center gap-2 text-sm font-bold"><input name="isFeatured" type="checkbox" defaultChecked={item?.isFeatured ?? false} className="size-4 accent-primary" />مميزة</label></div>
    </section>
    <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7"><ImageUploader label="صورة الأكلة" folder="jibli/products" value={image.url} onUploaded={({ url, publicId }) => setImage({ url, publicId })} /></section>
    <details className="rounded-3xl bg-white p-5 shadow-sm sm:p-7"><summary className="cursor-pointer font-black">تفاصيل متقدمة وإضافات</summary><div className="mt-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-black">الإضافات</h2><p className="mt-1 text-xs text-gray-400">إضافات بسيطة خاصة بهذه الأكلة</p></div><button type="button" onClick={() => setAddons((current) => [...current, newAddon()])} className="flex h-10 items-center gap-2 rounded-xl bg-orange-50 px-3 text-xs font-black text-primary"><Plus className="size-4" />إضافة</button></div><div className="space-y-3">{addons.map((addon) => <div key={addon.id} className="grid gap-3 rounded-2xl bg-surface p-3 sm:grid-cols-[1fr_140px_auto_auto]"><input value={addon.name} onChange={(event) => updateAddon(addon.id, { name: event.target.value })} placeholder="اسم الإضافة" aria-label="اسم الإضافة" className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /><input value={addon.price} onChange={(event) => updateAddon(addon.id, { price: Number(event.target.value) })} type="number" min="0" aria-label="سعر الإضافة" className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={addon.isAvailable} onChange={(event) => updateAddon(addon.id, { isAvailable: event.target.checked })} className="size-4 accent-primary" />متوفرة</label><button type="button" onClick={() => setAddons((current) => current.filter((currentAddon) => currentAddon.id !== addon.id))} aria-label="حذف الإضافة" className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 className="size-4" /></button></div>)}</div></div></details>
    <button type="submit" disabled={saving} className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-black text-white disabled:opacity-60 sm:w-52">{saving ? <LoaderCircle className="size-5 animate-spin" /> : <Save className="size-5" />}{saving ? "جاري الحفظ..." : "حفظ الأكلة"}</button>
  </form>;
}
