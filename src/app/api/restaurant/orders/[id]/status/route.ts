export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "@/lib/firebase/admin";
import { adminDb } from "@/lib/firebase/admin";
import { isRestaurantSessionError, requireActiveRestaurantSession } from "@/lib/firebase/restaurant-session";
import { isOrderStatus, isValidOrderTransition } from "@/lib/orders/status-transitions";
import type { OrderStatusCode } from "@/types/collections";
import { logPushResult, sendPushToUser, type PushPayload } from "@/lib/firebase/push-notifications";

const errors: Record<string, { message: string; status: number }> = {
  RESTAURANT_SESSION_REQUIRED: { message: "انتهت جلسة المطعم، سجّل الدخول مجدداً.", status: 401 },
  RESTAURANT_FORBIDDEN: { message: "هذا الحساب غير مخول لإدارة المطعم.", status: 403 },
  RESTAURANT_NOT_FOUND: { message: "لا يوجد مطعم مرتبط بهذا الحساب.", status: 404 },
  FIREBASE_ADMIN_NOT_CONFIGURED: { message: "تعذر الاتصال بخدمة المطعم.", status: 500 },
  ORDER_NOT_FOUND: { message: "الطلب غير موجود.", status: 404 },
  ORDER_FORBIDDEN: { message: "لا تملك صلاحية إدارة هذا الطلب.", status: 403 },
  INVALID_ORDER_TRANSITION: { message: "لا يمكن تغيير حالة الطلب بهذه الطريقة.", status: 409 },
  ORDER_ALREADY_UPDATED: { message: "تم تحديث الطلب مسبقاً. حدّث الصفحة.", status: 409 },
  PREPARATION_TIME_REQUIRED: { message: "اختر مدة تحضير صحيحة بين 5 و180 دقيقة.", status: 400 },
  REJECTION_REASON_REQUIRED: { message: "يجب كتابة سبب الرفض.", status: 400 },
  RESTAURANT_ACCOUNT_INACTIVE: { message: "حساب المطعم غير نشط.", status: 403 },
  ORDER_UPDATE_FAILED: { message: "تعذر تحديث الطلب. حاول مرة أخرى.", status: 500 },
};

class TransitionError extends Error { constructor(public code: string) { super(errors[code]?.message ?? errors.ORDER_UPDATE_FAILED.message); } }
const failure = (code: string) => NextResponse.json({ success: false, error: { code, message: errors[code]?.message ?? errors.ORDER_UPDATE_FAILED.message } }, { status: errors[code]?.status ?? 500 });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try { session = await requireActiveRestaurantSession(); }
  catch (error) {
    if (isRestaurantSessionError(error)) return failure(error.code);
    return failure("ORDER_UPDATE_FAILED");
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return failure("INVALID_ORDER_TRANSITION"); }
  const nextStatus = body.nextStatus;
  if (!isOrderStatus(nextStatus)) return failure("INVALID_ORDER_TRANSITION");

  try {
    const database = adminDb;
    const orderReference = database.collection("orders").doc(id);
    const historyReference = orderReference.collection("statusHistory").doc();
    const notificationReference = database.collection("notifications").doc(`order_status_${id}_${nextStatus}`);
    const updatedOrder = await database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderReference);
      if (!snapshot.exists) throw new TransitionError("ORDER_NOT_FOUND");
      const order = snapshot.data() ?? {};
      if (order.restaurantId !== session.restaurant.id) throw new TransitionError("ORDER_FORBIDDEN");
      const currentStatus = order.status as OrderStatusCode;
      if (currentStatus === nextStatus) throw new TransitionError("ORDER_ALREADY_UPDATED");
      if (!isOrderStatus(currentStatus) || !isValidOrderTransition(currentStatus, nextStatus)) throw new TransitionError("INVALID_ORDER_TRANSITION");

      const updates: Record<string, unknown> = { status: nextStatus, updatedAt: FieldValue.serverTimestamp() };
      let note = "";
      if (nextStatus === "accepted") {
        const duration = Number(body.estimatedPreparationTime);
        if (!Number.isInteger(duration) || duration < 5 || duration > 180) throw new TransitionError("PREPARATION_TIME_REQUIRED");
        updates.acceptedAt = FieldValue.serverTimestamp(); updates.estimatedPreparationTime = duration;
        note = `مدة التحضير: ${duration} دقيقة`;
      } else if (nextStatus === "preparing") updates.preparingAt = FieldValue.serverTimestamp();
      else if (nextStatus === "out_for_delivery") updates.outForDeliveryAt = FieldValue.serverTimestamp();
      else if (nextStatus === "delivered") {
        const paymentReceived = body.paymentReceived !== false;
        updates.deliveredAt = FieldValue.serverTimestamp(); updates.paymentStatus = paymentReceived ? "paid" : "unpaid";
        if (!paymentReceived) { updates.restaurantNote = "تم التسليم دون تأكيد استلام المبلغ."; note = "لم يتم تأكيد استلام المبلغ"; }
      } else if (nextStatus === "rejected") {
        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "";
        if (!reason) throw new TransitionError("REJECTION_REASON_REQUIRED");
        updates.rejectedAt = FieldValue.serverTimestamp(); updates.rejectionReason = reason; note = reason;
      }

      const pushOrder = { customerId: String(order.customerId ?? ""), orderNumber: String(order.orderNumber ?? ""), estimatedPreparationTime: nextStatus === "accepted" ? Number(updates.estimatedPreparationTime) : Number(order.estimatedPreparationTime ?? 0), rejectionReason: nextStatus === "rejected" ? String(updates.rejectionReason ?? "") : String(order.rejectionReason ?? "") };
      const notification = statusPushPayload(id, nextStatus, pushOrder);
      transaction.update(orderReference, updates);
      transaction.set(historyReference, { status: nextStatus, changedBy: session.uid, changedByRole: "restaurant", note, createdAt: FieldValue.serverTimestamp() });
      transaction.set(notificationReference, { title: notification.notification.title, body: notification.notification.body, audience: "user", targetUserId: pushOrder.customerId, type: "order", link: notification.data.url, isActive: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return pushOrder;
    });
    try {
      if (updatedOrder.customerId) { const pushResult = await sendPushToUser(updatedOrder.customerId, statusPushPayload(id, nextStatus, updatedOrder)); logPushResult(`order_status:${id}:${nextStatus}`, pushResult); }
    } catch (pushError) {
      console.warn("[push]", { event: `order_status:${id}:${nextStatus}`, errorCode: pushError instanceof Error ? (pushError as Error & { code?: string }).code ?? "push-failed" : "push-failed" });
    }
    return NextResponse.json({ success: true, data: { orderId: id, status: nextStatus, updatedAt: new Date().toISOString() } });
  } catch (error) {
    if (error instanceof TransitionError) return failure(error.code);
    console.error("[حالة الطلب] فشل التحديث", { api: "PATCH /api/restaurant/orders/[id]/status", orderId: id, restaurantId: session.restaurant.id, errorCode: error instanceof Error ? (error as Error & { code?: string }).code ?? "unknown" : "unknown", errorMessage: error instanceof Error ? error.message : "خطأ غير معروف" });
    return failure("ORDER_UPDATE_FAILED");
  }
}

function statusPushPayload(orderId: string, status: OrderStatusCode, order: { orderNumber: string; estimatedPreparationTime: number; rejectionReason: string }): PushPayload {
  const messages: Partial<Record<OrderStatusCode, { title: string; body: string }>> = {
    accepted: { title: "\u062a\u0645 \u0642\u0628\u0648\u0644 \u0637\u0644\u0628\u0643 \u2705", body: `\u0642\u0628\u0644 \u0627\u0644\u0645\u0637\u0639\u0645 \u0637\u0644\u0628\u0643 ${order.orderNumber}. \u0645\u062f\u0629 \u0627\u0644\u062a\u062d\u0636\u064a\u0631 \u0627\u0644\u0645\u062a\u0648\u0642\u0639\u0629: ${order.estimatedPreparationTime} \u062f\u0642\u064a\u0642\u0629.` },
    preparing: { title: "\u0637\u0644\u0628\u0643 \u0642\u064a\u062f \u0627\u0644\u062a\u062d\u0636\u064a\u0631 \ud83d\udc68\u200d\ud83c\udf73", body: `\u0628\u062f\u0623 \u0627\u0644\u0645\u0637\u0639\u0645 \u0628\u062a\u062d\u0636\u064a\u0631 \u0637\u0644\u0628\u0643 ${order.orderNumber}.` },
    out_for_delivery: { title: "\u0637\u0644\u0628\u0643 \u062e\u0631\u062c \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \ud83d\udef5", body: `\u0637\u0644\u0628\u0643 ${order.orderNumber} \u0641\u064a \u0627\u0644\u0637\u0631\u064a\u0642 \u0625\u0644\u064a\u0643.` },
    delivered: { title: "\u062a\u0645 \u062a\u0633\u0644\u064a\u0645 \u0637\u0644\u0628\u0643 \u2705", body: `\u0646\u062a\u0645\u0646\u0649 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0631\u0627\u0636\u064a\u0627\u064b \u0639\u0646 \u0637\u0644\u0628\u0643 ${order.orderNumber}.` },
    rejected: { title: "\u062a\u0645 \u0631\u0641\u0636 \u0627\u0644\u0637\u0644\u0628", body: `\u062a\u0639\u0630\u0631 \u0642\u0628\u0648\u0644 \u0637\u0644\u0628\u0643 ${order.orderNumber}: ${order.rejectionReason}` },
    cancelled: { title: "\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0637\u0644\u0628", body: `\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0637\u0644\u0628\u0643 ${order.orderNumber}.` },
  };
  const message = messages[status] ?? { title: "\u062a\u062d\u062f\u064a\u062b \u0637\u0644\u0628\u0643", body: `\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0637\u0644\u0628\u0643 ${order.orderNumber}.` };
  return { notification: message, data: { type: "order_status", orderId, orderNumber: order.orderNumber, url: `/orders/${orderId}`, status } };
}