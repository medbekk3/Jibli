import type { OrderStatusCode } from "@/types/collections";

export const ORDER_TRANSITIONS: Readonly<Record<OrderStatusCode, readonly OrderStatusCode[]>> = {
  pending: ["accepted", "rejected"], accepted: ["preparing"], preparing: ["out_for_delivery"],
  out_for_delivery: ["delivered"], delivered: [], rejected: [], cancelled: [],
};

export function isOrderStatus(value: unknown): value is OrderStatusCode {
  return typeof value === "string" && value in ORDER_TRANSITIONS;
}

export function isValidOrderTransition(currentStatus: OrderStatusCode, nextStatus: OrderStatusCode) {
  return ORDER_TRANSITIONS[currentStatus].includes(nextStatus);
}
