"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useCart } from "@/features/cart/cart-context";
import type { CartValidationData } from "@/features/cart/cart-types";
import { formatPrice } from "@/lib/format";
import { getRestaurantById, PublicRestaurantError } from "@/lib/api/public-restaurant.service";

type ValidationEnvelope = {
  success: boolean;
  data?: CartValidationData;
  error?: { code?: string; message?: string };
};

const validationMessages: Record<string, string> = {
  RESTAURANT_NOT_FOUND: "المطعم غير موجود.",
  RESTAURANT_INACTIVE: "المطعم غير متاح حالياً.",
  RESTAURANT_CLOSED: "المطعم مغلق حالياً.",
  PRODUCT_NOT_FOUND: "أحد المنتجات لم يعد موجوداً.",
  PRODUCT_UNAVAILABLE: "أحد المنتجات غير متوفر حالياً.",
  PRODUCT_RESTAURANT_MISMATCH: "يوجد منتج غير مرتبط بهذا المطعم.",
  INVALID_ADDON: "إحدى الإضافات لم تعد متاحة.",
};

export function CartView() {
  const { items, hydrated, subtotal, addonsTotal, updateQuantity, removeItem, clearCart, syncValidatedItems } = useCart();
  const [validation, setValidation] = useState<CartValidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<string[]>([]);
  const [valid, setValid] = useState(false);
  const validationKey = useMemo(() => items.map((item) => `${item.productId}:${item.quantity}:${item.selectedAddons.map((addon) => addon.addonId).join(",")}`).join("|"), [items]);

  useEffect(() => {
    if (!hydrated) return;
    if (!items.length) return;

    const controller = new AbortController();
    const restaurantId = items[0].restaurantId;
    const productIds = items.map((item) => item.productId);
    void Promise.resolve().then(() => setLoading(true));

    void getRestaurantById(restaurantId).then(() => fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        restaurantId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedAddonIds: item.selectedAddons.map((addon) => addon.addonId),
        })),
      }),
    })).then(async (response) => {
      const result = await response.json().catch(() => null) as ValidationEnvelope | null;
      if (!response.ok || !result?.success || !result.data) {
        const errorCode = result?.error?.code ?? "CART_VALIDATION_FAILED";
        const errorMessage = result?.error?.message ?? "تعذر التحقق من بيانات السلة. حاول مرة أخرى.";
        if (process.env.NODE_ENV === "development") {
          console.error("فشل التحقق من السلة", { restaurantId, productIds, responseStatus: response.status, errorCode, errorMessage, stage: "استجابة واجهة التحقق" });
        }
        throw Object.assign(new Error(errorMessage), { code: errorCode });
      }

      const hasPriceChanges = result.data.items.some((validated, index) => {
        const local = items[index];
        if (!local || local.productId !== validated.productId || local.unitPrice !== validated.unitPrice) return true;
        if (local.selectedAddons.length !== validated.selectedAddons.length) return true;
        return validated.selectedAddons.some((addon, addonIndex) => {
          const current = local.selectedAddons[addonIndex];
          return !current || current.addonId !== addon.addonId || current.name !== addon.name || current.price !== addon.price;
        });
      });
      const hasDetailsChanges = result.data.items.some((validated, index) => {
        const local = items[index];
        return Boolean(local && (local.productName !== validated.name || local.imageUrl !== validated.imageUrl || local.restaurantName !== result.data?.restaurant.name));
      });

      setValidation(result.data);
      setNotices(hasPriceChanges ? ["تم تحديث أسعار بعض المنتجات."] : []);
      setValid(true);
      setLoading(false);
      if (hasPriceChanges || hasDetailsChanges) syncValidatedItems(result.data.items, result.data.restaurant.name);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const details: Error & { code?: string; status?: number } = error instanceof Error
        ? error as Error & { code?: string; status?: number }
        : new Error("تعذر التحقق من بيانات السلة. حاول مرة أخرى.");
      if (process.env.NODE_ENV === "development" && error instanceof PublicRestaurantError) console.error("فشل التحقق من مطعم السلة", { restaurantId, productIds, responseStatus: error.status, errorCode: error.code, errorMessage: error.message, stage: "تحميل المطعم العام" });
      setValidation(null);
      setNotices([validationMessages[details.code ?? ""] ?? (details.code === "CART_VALIDATION_FAILED" ? details.message : "تعذر التحقق من بيانات السلة. حاول مرة أخرى.")]);
      setValid(false);
      setLoading(false);
    });

    return () => controller.abort();
    // validationKey يمثل البيانات التي يتطلب تغيرها إعادة التحقق فقط.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, validationKey, syncValidatedItems]);

  if (!hydrated || (items.length > 0 && loading)) return <div className="space-y-3 py-12"><div className="mx-auto h-24 max-w-3xl animate-pulse rounded-3xl bg-white" /><p className="text-center text-sm font-bold text-gray-400">جاري التحقق من السلة...</p></div>;
  if (!items.length) return <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-orange-50 text-primary"><ShoppingBag className="size-6" /></span><h2 className="mt-4 font-black">سلتك فارغة حالياً.</h2><Link href="/restaurants" className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-black text-white">استعرض المطاعم</Link></div>;

  const deliveryFee = validation?.deliveryFee ?? 0;
  const displayedSubtotal = validation?.subtotal ?? subtotal;
  const displayedTotal = validation?.total ?? displayedSubtotal + deliveryFee;
  const confirmRemove = (id: string, name: string) => { if (window.confirm(`هل تريد حذف «${name}» من السلة؟`)) removeItem(id); };
  const confirmClear = () => { if (window.confirm("هل تريد تفريغ السلة بالكامل؟")) clearCart(); };

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><section><div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-gray-500">طلبك من <strong className="text-gray-950">{validation?.restaurant.name ?? items[0].restaurantName}</strong></p><button onClick={confirmClear} className="text-xs font-bold text-red-600">تفريغ السلة</button></div>{notices.map((notice) => <div key={notice} className="mb-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-700">{notice}</div>)}<div className="space-y-3">{items.map((item) => <article key={item.cartItemId} className="rounded-3xl bg-white p-4 shadow-sm"><div className="flex gap-3"><div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100">{item.imageUrl && <Image src={item.imageUrl} alt={`صورة ${item.productName}`} fill className="object-cover" sizes="80px" />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><h2 className="font-black">{item.productName}</h2><p className="mt-1 text-xs text-gray-400">{item.selectedAddons.length ? item.selectedAddons.map((addon) => addon.name).join("، ") : "بدون إضافات"}</p>{item.note && <p className="mt-1 text-xs text-gray-400">ملاحظة: {item.note}</p>}<p className="mt-2 text-xs font-bold text-gray-500">سعر الوحدة: {formatPrice(item.unitPrice)}</p></div><button onClick={() => confirmRemove(item.cartItemId, item.productName)} aria-label={`حذف ${item.productName}`} className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500"><Trash2 className="size-4" /></button></div><div className="mt-4 flex items-center justify-between"><QuantitySelector value={item.quantity} onChange={(value) => updateQuantity(item.cartItemId, value)} /><span className="font-black text-primary">{formatPrice(item.itemTotal)}</span></div></div></div></article>)}</div></section><aside className="h-fit rounded-3xl bg-white p-5 shadow-sm lg:sticky lg:top-24"><h2 className="text-lg font-black">ملخص السلة</h2><div className="mt-5 space-y-3 text-sm"><Row label="سعر الأكلات" value={displayedSubtotal - addonsTotal} /><Row label="سعر الإضافات" value={addonsTotal} /><Row label="المجموع الفرعي" value={displayedSubtotal} /><Row label="سعر التوصيل" value={deliveryFee} /><div className="flex justify-between border-t pt-4 text-base font-black"><span>المجموع النهائي</span><span className="text-primary">{formatPrice(displayedTotal)}</span></div></div><p className="mt-4 text-[11px] leading-5 text-gray-400">سيُعاد التحقق من الأسعار وسعر التوصيل على الخادم عند تفعيل إرسال الطلب.</p>{valid ? <Link href="/checkout" className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-primary font-black text-white">متابعة إتمام الطلب</Link> : <button disabled className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-gray-200 font-black text-gray-500">راجع السلة قبل المتابعة</button>}</aside></div>;
}

function Row({ label, value }: { label: string; value: number }) { return <div className="flex justify-between text-gray-500"><span>{label}</span><span>{formatPrice(value)}</span></div>; }
