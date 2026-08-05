"use client";

import { Banknote, MapPin, Phone, ReceiptText, RefreshCw, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RestaurantShell } from "@/components/restaurant-dashboard/restaurant-shell";
import { useRestaurantAccount } from "@/features/restaurant-dashboard/restaurant-context";
import { formatPrice } from "@/lib/format";
import { getRestaurantOrder, orderStatusLabel, updateRestaurantOrderStatus, type OrderStatusHistory } from "@/lib/firebase/services/order.service";
import type { OrderDocument, OrderStatusCode } from "@/types/collections";

const rejectionReasons = ["المنتج غير متوفر", "ضغط كبير على الطلبات", "العنوان خارج نطاق التوصيل", "المطعم سيتوقف مؤقتاً", "تعذر التواصل مع الزبون", "سبب آخر"];

export default function RestaurantOrderDetailsPage() {
  const id = String(useParams<{ id: string }>().id);
  const { restaurant } = useRestaurantAccount();
  const [order, setOrder] = useState<OrderDocument | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true); const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [dialog, setDialog] = useState<"accept" | "reject" | "deliver" | null>(null);
  const [duration, setDuration] = useState(30); const [reason, setReason] = useState(rejectionReasons[0]); const [customReason, setCustomReason] = useState(""); const [paymentReceived, setPaymentReceived] = useState(true);

  const load = useCallback(async (silent = false) => { if (!silent) setLoading(true); try { const result = await getRestaurantOrder(id); setOrder(result.order); setHistory(result.statusHistory); setError(""); } catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر تحميل تفاصيل الطلب."); } finally { if (!silent) setLoading(false); } }, [id]);
  useEffect(() => { void Promise.resolve().then(() => load()); const interval = window.setInterval(() => void load(true), 10_000); return () => window.clearInterval(interval); }, [load]);

  async function change(nextStatus: OrderStatusCode, data: Record<string, unknown> = {}) {
    if (!order || updating) return; setUpdating(true); setError(""); setSuccess("");
    try { await updateRestaurantOrderStatus(order.id, nextStatus, data); await load(true); setDialog(null); setSuccess("تم تحديث حالة الطلب بنجاح."); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر تحديث الطلب. حاول مرة أخرى."); }
    finally { setUpdating(false); }
  }

  function confirmed(nextStatus: OrderStatusCode, message: string) { if (window.confirm(message)) void change(nextStatus); }
  if (loading) return <RestaurantShell title="تفاصيل الطلب" restaurant={restaurant ?? undefined}><p className="py-20 text-center text-sm text-gray-400">جاري تحميل تفاصيل الطلب...</p></RestaurantShell>;

  return <RestaurantShell title="تفاصيل الطلب" restaurant={restaurant ?? undefined}>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</p>}{success && <p className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</p>}
    {!order ? <div className="rounded-2xl bg-white p-8 text-center font-bold">الطلب غير موجود.</div> : <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-gray-400">{order.orderNumber}</p><h1 className="mt-1 text-2xl font-black">{orderStatusLabel(order.status)}</h1><p className="mt-1 text-xs text-gray-400">{formatDate(order.createdAt)}</p></div><button onClick={() => void load()} disabled={updating} className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black"><RefreshCw className="size-4" />تحديث الطلب</button></div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-5">
        <Card title="بيانات الزبون" icon={UserRound}><Info label="الاسم" value={order.customerName} /><Info label="الهاتف" value={order.customerPhone} /><a href={`tel:${order.customerPhone}`} className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-black text-white"><Phone className="size-4" />اتصال بالزبون</a></Card>
        <Card title="عنوان التوصيل" icon={MapPin}><Info label="الحي" value={order.deliveryAddress.area} /><Info label="العنوان" value={order.deliveryAddress.address} /><Info label="نقطة قريبة" value={order.deliveryAddress.landmark || "—"} />{order.customerNote && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">ملاحظة الزبون: {order.customerNote}</p>}</Card>
        <Card title="الأكلات" icon={ReceiptText}><div className="divide-y">{order.items.map((item, index) => <div key={`${item.productId}-${index}`} className="py-4 first:pt-0"><div className="flex justify-between gap-4 font-black"><span>{item.name} × {item.quantity}</span><span>{formatPrice(item.itemTotal)}</span></div>{item.addons.length > 0 && <p className="mt-2 text-xs text-gray-500">الإضافات: {item.addons.map((addon) => `${addon.name} (${formatPrice(addon.price)})`).join("، ")}</p>}{item.note && <p className="mt-2 text-xs text-gray-500">ملاحظة: {item.note}</p>}</div>)}</div></Card>
      </div><aside className="space-y-5">
        <Card title="ملخص الدفع" icon={Banknote}><Info label="المجموع الفرعي" value={formatPrice(order.subtotal)} /><Info label="سعر التوصيل" value={formatPrice(order.deliveryFee)} /><Info label="المجموع النهائي" value={formatPrice(order.total)} /><Info label="طريقة الدفع" value="نقداً عند الاستلام" /><Info label="حالة الدفع" value={order.paymentStatus === "paid" ? "تم الدفع" : "غير مدفوع"} /></Card>
        <ActionPanel order={order} updating={updating} onAccept={() => setDialog("accept")} onReject={() => setDialog("reject")} onPreparing={() => confirmed("preparing", "هل تريد بدء تحضير هذا الطلب؟")} onDelivery={() => confirmed("out_for_delivery", "تأكد من العنوان ورقم الهاتف قبل إخراج الطلب للتوصيل. هل تريد المتابعة؟")} onDelivered={() => setDialog("deliver")} />
        <Card title="سجل الحالات" icon={RefreshCw}>{history.length ? <div className="space-y-3">{history.map((item) => <div key={item.id} className="border-r-2 border-primary pr-3 text-sm"><p className="font-black">{orderStatusLabel(item.status)}</p><p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>{item.note && <p className="mt-1 text-xs text-gray-500">{item.note}</p>}</div>)}</div> : <p className="text-sm text-gray-400">لا توجد تغييرات مسجلة بعد.</p>}</Card>
      </aside></div>
    </>}
    {dialog === "accept" && <Dialog title="قبول الطلب" close={() => setDialog(null)}><p className="mb-3 text-sm text-gray-500">اختر مدة التحضير بالدقائق.</p><div className="grid grid-cols-4 gap-2">{[15, 20, 30, 45].map((value) => <button key={value} type="button" onClick={() => setDuration(value)} className={`h-11 rounded-xl text-sm font-black ${duration === value ? "bg-primary text-white" : "bg-gray-100"}`}>{value}</button>)}</div><label className="mt-4 block text-sm font-bold">مدة مخصصة<input type="number" min={5} max={180} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-2 h-12 w-full rounded-xl border px-3" /></label><Confirm disabled={updating || !Number.isInteger(duration) || duration < 5 || duration > 180} onClick={() => void change("accepted", { estimatedPreparationTime: duration })} label="تأكيد قبول الطلب" /></Dialog>}
    {dialog === "reject" && <Dialog title="رفض الطلب" close={() => setDialog(null)}><select value={reason} onChange={(event) => setReason(event.target.value)} className="h-12 w-full rounded-xl border px-3">{rejectionReasons.map((value) => <option key={value}>{value}</option>)}</select>{reason === "سبب آخر" && <textarea value={customReason} onChange={(event) => setCustomReason(event.target.value)} className="mt-3 w-full rounded-xl border p-3" rows={3} placeholder="اكتب سبب الرفض" />}<Confirm disabled={updating || (reason === "سبب آخر" && !customReason.trim())} onClick={() => void change("rejected", { reason: reason === "سبب آخر" ? customReason : reason })} label="تأكيد رفض الطلب" danger /></Dialog>}
    {dialog === "deliver" && <Dialog title="تأكيد التسليم" close={() => setDialog(null)}><label className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm font-bold"><input type="checkbox" checked={paymentReceived} onChange={(event) => setPaymentReceived(event.target.checked)} className="size-5 accent-primary" />تم استلام المبلغ</label><Confirm disabled={updating} onClick={() => void change("delivered", { paymentReceived })} label="تم تسليم الطلب" /></Dialog>}
  </RestaurantShell>;
}

function ActionPanel({ order, updating, onAccept, onReject, onPreparing, onDelivery, onDelivered }: { order: OrderDocument; updating: boolean; onAccept: () => void; onReject: () => void; onPreparing: () => void; onDelivery: () => void; onDelivered: () => void }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-black">إجراءات الطلب</h2><div className="mt-4 grid gap-3">{order.status === "pending" && <><button disabled={updating} onClick={onAccept} className="h-12 rounded-xl bg-primary font-black text-white">قبول الطلب</button><button disabled={updating} onClick={onReject} className="h-12 rounded-xl bg-red-50 font-black text-red-600">رفض الطلب</button></>}{order.status === "accepted" && <button disabled={updating} onClick={onPreparing} className="h-12 rounded-xl bg-primary font-black text-white">بدء التحضير</button>}{order.status === "preparing" && <button disabled={updating} onClick={onDelivery} className="h-12 rounded-xl bg-primary font-black text-white">خرج الطلب للتوصيل</button>}{order.status === "out_for_delivery" && <button disabled={updating} onClick={onDelivered} className="h-12 rounded-xl bg-emerald-600 font-black text-white">تم تسليم الطلب</button>}{["delivered", "rejected", "cancelled"].includes(order.status) && <p className="rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-500">لا توجد إجراءات متاحة لهذه الحالة.</p>}</div></div>; }
function Card({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) { return <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 font-black"><Icon className="size-5 text-primary" />{title}</h2>{children}</section>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b py-3 text-sm last:border-0"><span className="text-gray-400">{label}</span><strong className="text-left">{value}</strong></div>; }
function Dialog({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2><button onClick={close} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold">إغلاق</button></div>{children}</div></div>; }
function Confirm({ label, onClick, disabled, danger = false }: { label: string; onClick: () => void; disabled: boolean; danger?: boolean }) { return <button disabled={disabled} onClick={onClick} className={`mt-5 h-12 w-full rounded-xl font-black text-white disabled:opacity-50 ${danger ? "bg-red-600" : "bg-primary"}`}>{label}</button>; }
function formatDate(value: OrderDocument["createdAt"] | null) { return value?.toDate ? new Intl.DateTimeFormat("ar-DZ-u-nu-latn", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate()) : "—"; }
