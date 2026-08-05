"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/features/cart/cart-context";
import type { NewCartItem } from "@/features/cart/cart-types";
import { formatPrice } from "@/lib/format";
import { getRestaurant } from "@/lib/firebase/services/restaurant.service";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const { addItem, replaceCartWith } = useCart(); const [message, setMessage] = useState(""); const [pendingItem, setPendingItem] = useState<NewCartItem | null>(null); const hasAddons = Boolean(product.addons?.some((addon) => addon.isAvailable));
  async function addDirectly() { setMessage(""); try { const restaurant = await getRestaurant(product.restaurantId); if (!restaurant?.isActive) { setMessage("المطعم موقوف حالياً."); return; } if (!restaurant.isOpen) { setMessage("المطعم مغلق حالياً ولا يستقبل الطلبات."); return; } const item: NewCartItem = { productId: product.id, restaurantId: product.restaurantId, restaurantName: restaurant.name, productName: product.name, imageUrl: product.image, unitPrice: product.price, quantity: 1, selectedAddons: [], note: "" }; const result = addItem(item); if (!result.ok) { setPendingItem(item); return; } setMessage("تمت الإضافة إلى السلة."); } catch { setMessage("تعذر التحقق من حالة المطعم."); } }
  function replace() { if (!pendingItem) return; replaceCartWith(pendingItem); setPendingItem(null); setMessage("تم تفريغ السلة وإضافة الأكلة."); }
  return <><article className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"><Link href={`/products/${product.id}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl sm:size-28"><Image src={product.image} alt={`صورة ${product.name}`} fill className="object-cover" sizes="112px" /></Link><div className="flex min-w-0 flex-1 flex-col"><Link href={`/products/${product.id}`}><h3 className="font-black text-gray-950">{product.name}</h3></Link><p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{product.description}</p>{message && <p className={`mt-1 text-[11px] font-bold ${message.startsWith("تم") ? "text-emerald-600" : "text-red-600"}`}>{message}</p>}<div className="mt-auto flex items-end justify-between gap-2 pt-2"><span className="font-black text-primary">{formatPrice(product.price)}</span>{hasAddons ? <Link href={`/products/${product.id}`} aria-label={`اختيار إضافات ${product.name}`} className="grid size-9 place-items-center rounded-xl bg-primary text-white"><Plus className="size-5" /></Link> : <button type="button" onClick={addDirectly} aria-label={`إضافة ${product.name}`} className="grid size-9 place-items-center rounded-xl bg-primary text-white"><Plus className="size-5" /></button>}</div></div></article>{pendingItem && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"><h2 className="text-lg font-black">طلب من مطعم آخر</h2><p className="mt-3 text-sm leading-7 text-gray-600">تحتوي سلتك على طلب من مطعم آخر. هل تريد تفريغ السلة وإضافة هذه الأكلة؟</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setPendingItem(null)} className="h-12 flex-1 rounded-xl bg-gray-100 font-black">إلغاء</button><button type="button" onClick={replace} className="h-12 flex-1 rounded-xl bg-primary font-black text-white">تفريغ السلة والمتابعة</button></div></div></div>}</>;
}
