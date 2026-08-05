import { adminApi } from "../admin-api";

export type NotificationAudience = "all" | "customers" | "restaurants" | "user";
export type NotificationType = "general" | "offer" | "system" | "order";
export type AdminNotificationInput = { audience: NotificationAudience; targetUserId?: string | null; title: string; body: string; type: NotificationType; link?: string };

export const saveAdminNotification = (data: AdminNotificationInput) => adminApi<{ id: string; message: string }>("/api/admin/notifications", { method: "POST", body: JSON.stringify(data) });
