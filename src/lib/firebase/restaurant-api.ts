type Success<T> = { success: true; data: T };
type Failure = { success: false; error: { code: string; message: string } };

export class RestaurantApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }

function revive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(revive);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (key.endsWith("At") && typeof item === "string" && !Number.isNaN(Date.parse(item))) { const date = new Date(item); return [key, { toDate: () => date, toMillis: () => date.getTime() }]; }
    return [key, revive(item)];
  }));
}

export async function restaurantApi<T>(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...init.headers } });
  const body = await response.json().catch(() => null) as Success<T> | Failure | null;
  if (!response.ok || !body || body.success !== true) {
    const failure = body && body.success === false ? body.error : null;
    if (response.status === 401 && typeof window !== "undefined") window.location.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    const fallback = response.status === 403 ? "حساب المطعم غير مخول أو موقوف." : response.status === 404 ? "المطعم أو الأكلة غير موجودة." : "تعذر تنفيذ العملية على الخادم.";
    throw new RestaurantApiError(response.status, failure?.code ?? "RESTAURANT_OPERATION_FAILED", failure?.message ?? fallback);
  }
  return revive(body.data) as T;
}
