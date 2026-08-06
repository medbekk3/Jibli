import { getFirebaseAuth } from "../auth";
import { adminApi } from "../admin-api";
import type { OrderDocument, OrderStatusCode } from "@/types/collections";
import type { PreparedOrderPayload } from "@/features/cart/cart-types";

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error?: { code?: string; message?: string } };

export class OrderApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) { super(message); this.name = "OrderApiError"; }
}

async function customerApi<T>(url: string, options: RequestInit = {}) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new OrderApiError("CUSTOMER_UNAUTHORIZED", "يجب تسجيل الدخول بحساب زبون.", 401);
  const token = await user.getIdToken(true);
  const response = await fetch(url, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers } });
  const result = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !result?.success) { const error = result && !result.success ? result.error : null; throw new OrderApiError(error?.code ?? "ORDER_REQUEST_FAILED", error?.message ?? "تعذر تنفيذ العملية. حاول مرة أخرى.", response.status); }
  return result.data;
}

async function restaurantApi<T>(url: string, options: RequestInit = {}) {
  const response = await fetch(url, { ...options, cache: "no-store", credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } });
  const result = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !result?.success) { const error = result && !result.success ? result.error : null; throw new OrderApiError(error?.code ?? "RESTAURANT_ORDERS_LOAD_FAILED", error?.message ?? "تعذر تحميل طلبات المطعم.", response.status); }
  return result.data;
}

export function createOrder(input: PreparedOrderPayload) { return customerApi<{ orderId: string; orderNumber: string; status: "pending"; total: number }>("/api/orders", { method: "POST", body: JSON.stringify(input) }); }
export async function getCustomerOrders() { const data = await customerApi<{ orders: OrderDocument[] }>("/api/orders"); return data.orders.map(hydrateOrder); }
export async function getOrder(id: string) { const data = await customerApi<{ order: OrderDocument; statusHistory: OrderStatusHistory[] }>(`/api/orders/${encodeURIComponent(id)}`); return { order: hydrateOrder(data.order), statusHistory: data.statusHistory.map(hydrateHistory) }; }
export async function getRestaurantOrders() { const data = await restaurantApi<{ orders: OrderDocument[] }>("/api/restaurant/orders"); return data.orders.map(hydrateOrder); }
export async function getRestaurantOrder(id: string) { const data = await restaurantApi<{ order: OrderDocument; statusHistory: OrderStatusHistory[] }>(`/api/restaurant/orders/${encodeURIComponent(id)}`); return { order: hydrateOrder(data.order), statusHistory: data.statusHistory.map(hydrateHistory) }; }
export async function getAdminOrders() { return (await adminApi<OrderDocument[]>("/api/admin/orders")).map(hydrateOrder); }
export async function getAdminOrder(id: string) { const data = await adminApi<{ order: OrderDocument; statusHistory: OrderStatusHistory[] }>(`/api/admin/orders/${encodeURIComponent(id)}`); return { order: hydrateOrder(data.order), statusHistory: data.statusHistory.map(hydrateHistory) }; }
export function subscribeCustomerOrders(_: string, onData: (orders: OrderDocument[]) => void, onError: (error: Error) => void) { let active = true; const load = () => getCustomerOrders().then((orders) => { if (active) onData(orders); }).catch((error) => { if (active) onError(error instanceof Error ? error : new Error("تعذر تحميل الطلبات.")); }); void load(); const interval = window.setInterval(load, 10_000); const refresh = () => void load(); window.addEventListener("jibli:push", refresh); return () => { active = false; window.clearInterval(interval); window.removeEventListener("jibli:push", refresh); }; }
export function subscribeRestaurantOrders(_: string, onData: (orders: OrderDocument[]) => void, onError: (error: Error) => void) { let active = true; const load = () => getRestaurantOrders().then((orders) => { if (active) onData(orders); }).catch((error) => { if (active) onError(error instanceof Error ? error : new Error("تعذر تحميل طلبات المطعم.")); }); void load(); const refresh = () => void load(); const interval = window.setInterval(refresh, 10_000); window.addEventListener("jibli:push", refresh); return () => { active = false; window.clearInterval(interval); window.removeEventListener("jibli:push", refresh); }; }
export function subscribeAllOrders(onData: (orders: OrderDocument[]) => void, onError: (error: Error) => void) { let active = true; const load = () => getAdminOrders().then((orders) => { if (active) onData(orders); }).catch((error) => { if (active) onError(error instanceof Error ? error : new Error("تعذر تحميل الطلبات.")); }); void load(); const interval = window.setInterval(load, 10_000); const refresh = () => void load(); window.addEventListener("jibli:push", refresh); return () => { active = false; window.clearInterval(interval); window.removeEventListener("jibli:push", refresh); }; }
export function subscribeOrder(id: string, onData: (order: OrderDocument | null) => void, onError: (error: Error) => void) { let active = true; const load = () => { const request = typeof window !== "undefined" && window.location.pathname.startsWith("/admin") ? getAdminOrder(id) : getOrder(id); return request.then((result) => { if (active) onData(result.order); }).catch((error) => { if (active) onError(error instanceof Error ? error : new Error("تعذر تحميل الطلب.")); }); }; void load(); const interval = window.setInterval(load, 10_000); const refresh = () => void load(); window.addEventListener("jibli:push", refresh); return () => { active = false; window.clearInterval(interval); window.removeEventListener("jibli:push", refresh); }; }
export function cancelOrder(id: string, reason: string) { return customerApi<{ message: string }>(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: "PATCH", body: JSON.stringify({ reason }) }); }
export function updateRestaurantOrderStatus(id: string, nextStatus: OrderStatusCode, data: Record<string, unknown> = {}) { return restaurantApi<{ orderId: string; status: OrderStatusCode; updatedAt: string }>(`/api/restaurant/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ nextStatus, ...data }) }); }
export const orderStatusLabel = (status: OrderStatusCode) => ({ pending: "طلب جديد", accepted: "تم قبول الطلب", preparing: "جاري التحضير", out_for_delivery: "خرج للتوصيل", delivered: "تم التسليم", rejected: "تم رفض الطلب", cancelled: "تم إلغاء الطلب" })[status];

export type OrderStatusHistory = { id: string; status: OrderStatusCode; changedBy: string; changedByRole: "restaurant" | "customer" | "admin"; note: string; createdAt: OrderDocument["createdAt"] };

function hydrateOrder(order: OrderDocument) {
  const fields = ["createdAt", "updatedAt", "acceptedAt", "preparingAt", "outForDeliveryAt", "deliveredAt", "rejectedAt", "cancelledAt"] as const;
  const value = { ...order } as Record<string, unknown>;
  const total = Number(value.total ?? 0);
  value.deliveryFee = Number(value.deliveryFee ?? 0);
  value.discount = Number(value.discount ?? 0);
  value.subtotal = Number(value.subtotal ?? total);
  value.deliveryZoneName = typeof value.deliveryZoneName === "string" && value.deliveryZoneName ? value.deliveryZoneName : "غير محدد";
  for (const field of fields) { const date = value[field]; if (typeof date === "string") value[field] = { toDate: () => new Date(date) }; }
  return value as unknown as OrderDocument;
}
function hydrateHistory(item: OrderStatusHistory) { const value = { ...item } as Record<string, unknown>; const createdAt = value.createdAt; if (typeof createdAt === "string") value.createdAt = { toDate: () => new Date(createdAt) }; return value as unknown as OrderStatusHistory; }
