"use client";

import { Check, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useCart } from "@/features/cart/cart-context";
import type { NewCartItem } from "@/features/cart/cart-types";
import { formatPrice } from "@/lib/format";
import { getRestaurantById, PublicRestaurantError, type PublicRestaurant } from "@/lib/api/public-restaurant.service";
import type { Product } from "@/types";

export function ProductDetails({ product }: { product: Product }) {
  const { addItem, replaceCartWith } = useCart(); const [quantity, setQuantity] = useState(1); const [selected, setSelected] = useState<string[]>([]); const [note, setNote] = useState(""); const [restaurant, setRestaurant] = useState<PublicRestaurant | null>(null); const [loading, setLoading] = useState(true); const [message, setMessage] = useState(""); const [success, setSuccess] = useState(""); const [conflictItem, setConflictItem] = useState<NewCartItem | null>(null);
  const extras = product.addons?.filter((item) => item.isAvailable) ?? []; const selectedAddons = extras.filter((item) => selected.includes(item.id)); const extrasTotal = selectedAddons.reduce((sum, item) => sum + item.price, 0); const total = (product.price + extrasTotal) * quantity;

  useEffect(() => {
    let active = true;
    async function loadRestaurant() {
      try {
        const linkedRestaurant = await getRestaurantById(product.restaurantId);
        if (linkedRestaurant.id !== product.restaurantId) throw new Error("بيانات المطعم المرتبط بالأكلة غير متطابقة.");
        if (!active) return;
        setRestaurant(linkedRestaurant);
        if (linkedRestaurant.isActive !== true) setMessage("المطعم غير متاح حالياً.");
        else if (linkedRestaurant.isOpen !== true) setMessage("المطعم مغلق حالياً.");
        else setMessage("");
      } catch (error) {
        const currentError = error instanceof Error ? error : new Error("تعذر تحميل بيانات المطعم. حاول مرة أخرى.");
        const apiError = error instanceof PublicRestaurantError ? error : null;
        if (process.env.NODE_ENV === "development") console.error("[التحقق من مطعم الأكلة]", { productId: product.id, restaurantId: product.restaurantId, responseStatus: apiError?.status ?? 0, errorCode: apiError?.code ?? "UNKNOWN", errorMessage: currentError.message });
        if (active) { setRestaurant(null); setMessage(currentError.message); }
      } finally { if (active) setLoading(false); }
    }
    void loadRestaurant();
    return () => { active = false; };
  }, [product.id, product.restaurantId]);

  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function buildItem(): NewCartItem | null { if (!restaurant) return null; return { productId: product.id, restaurantId: product.restaurantId, restaurantName: restaurant.name, productName: product.name, imageUrl: product.image, unitPrice: product.price, quantity, selectedAddons: selectedAddons.map((item) => ({ addonId: item.id, name: item.name, price: item.price })), note }; }
  function add() { setMessage(""); setSuccess(""); if (!restaurant) { setMessage("المطعم غير موجود أو غير متاح حالياً."); return; } if (restaurant.isActive !== true) { setMessage("المطعم غير متاح حالياً."); return; } if (restaurant.isOpen !== true) { setMessage("المطعم مغلق حالياً."); return; } const item = buildItem(); if (!item) return; const result = addItem(item); if (!result.ok) { setConflictItem(item); return; } setSuccess("تمت إضافة الأكلة إلى السلة بنجاح."); }
  function replace() { if (!conflictItem) return; replaceCartWith(conflictItem); setConflictItem(null); setSuccess("تم تفريغ السلة وإضافة الأكلة بنجاح."); }

  return <div className="mx-auto max-w-2xl overflow-hidden bg-white sm:my-8 sm:rounded-3xl sm:shadow-sm"><div className="relative h-72 sm:h-96"><Image src={product.image} alt={`صورة ${product.name}`} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 700px" /></div><div className="space-y-7 p-5 sm:p-8"><div><div className="flex items-start justify-between gap-4"><h1 className="text-2xl font-black">{product.name}</h1><span className="whitespace-nowrap text-lg font-black text-primary">{formatPrice(product.price)}</span></div><p className="mt-3 text-sm leading-7 text-gray-500">{product.description}</p></div>{message && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{message}</div>}{success && <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div>}<div className="flex items-center justify-between border-y border-gray-100 py-5"><div><h2 className="font-black">الكمية</h2><p className="mt-1 text-xs text-gray-400">اختر الكمية المناسبة</p></div><QuantitySelector value={quantity} onChange={setQuantity} /></div><section><h2 className="font-black">الإضافات</h2><p className="mt-1 text-xs text-gray-400">يمكنك اختيار أكثر من إضافة</p>{extras.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{extras.map((extra) => { const active = selected.includes(extra.id); return <button key={extra.id} type="button" onClick={() => toggle(extra.id)} className={`flex items-center justify-between rounded-2xl border p-4 text-right ${active ? "border-primary bg-orange-50" : "border-gray-100"}`}><span className="flex items-center gap-3"><span className={`grid size-5 place-items-center rounded-md border ${active ? "border-primary bg-primary text-white" : "border-gray-300"}`}>{active && <Check className="size-3" />}</span><span className="text-sm font-bold">{extra.name}</span></span><span className="text-xs text-gray-500">+ {formatPrice(extra.price)}</span></button>; })}</div> : <p className="mt-3 text-sm text-gray-400">لا توجد إضافات متاحة لهذه الأكلة.</p>}</section><label className="block"><span className="font-black">ملاحظة للمطعم</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} rows={3} placeholder="مثال: بدون بصل" className="mt-3 w-full resize-none rounded-2xl border border-gray-200 p-4 text-sm outline-none focus:border-primary" /></label><button type="button" onClick={add} disabled={loading || restaurant?.isActive !== true || restaurant?.isOpen !== true} className="flex h-14 w-full items-center justify-between rounded-2xl bg-primary px-5 font-black text-white shadow-lg shadow-orange-200 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"><span className="flex items-center gap-2"><ShoppingCart className="size-5" />{loading ? "جاري التحقق..." : "إضافة إلى السلة"}</span><span>{formatPrice(total)}</span></button></div>{conflictItem && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"><h2 className="text-lg font-black">طلب من مطعم آخر</h2><p className="mt-3 text-sm leading-7 text-gray-600">تحتوي سلتك على طلب من مطعم آخر. هل تريد تفريغ السلة وإضافة هذه الأكلة؟</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setConflictItem(null)} className="h-12 flex-1 rounded-xl bg-gray-100 font-black">إلغاء</button><button type="button" onClick={replace} className="h-12 flex-1 rounded-xl bg-primary font-black text-white">تفريغ السلة والمتابعة</button></div></div></div>}</div>;
}
