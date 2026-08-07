type SuccessEnvelope<T> = { success: true; data: T };
type FailureEnvelope = { success: false; error: { code: string; message: string } };

export class AdminApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

function reviveAdminDates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reviveAdminDates);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if ((key.endsWith("At") || key === "startDate" || key === "endDate") && typeof item === "string" && !Number.isNaN(Date.parse(item))) {
      const date = new Date(item);
      return [key, { toDate: () => date, toMillis: () => date.getTime() }];
    }
    return [key, reviveAdminDates(item)];
  }));
}

export async function adminApi<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body = await response.json().catch(() => null) as SuccessEnvelope<T> | FailureEnvelope | null;
  if (!response.ok || !body || body.success !== true) {
    const failure = body && body.success === false ? body.error : null;
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.replace("/login?redirect=/admin");
    }
    throw new AdminApiError(response.status, failure?.code ?? "ADMIN_OPERATION_FAILED", failure?.message ?? "تعذر تنفيذ العملية الإدارية.");
  }
  return reviveAdminDates(body.data) as T;
}
