import { getFirebaseAuth } from "@/lib/firebase/auth";

export type UserNotification = { id: string; title: string; body: string; audience: "all" | "customers" | "restaurants" | "user"; targetUserId: string | null; type: string; link: string; createdAt: string | null; isRead: boolean };
export type NotificationBundle = { notifications: UserNotification[]; unreadCount: number };

async function notificationApi<T>(url: string, method: "GET" | "PATCH" = "GET") {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("انتهت جلسة تسجيل الدخول.");
  const token = await user.getIdToken();
  const response = await fetch(url, { method, cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => null) as { success?: boolean; data?: T; error?: { message?: string } } | null;
  if (!response.ok || result?.success !== true) throw new Error(result?.error?.message || "تعذر تحميل الإشعارات. حاول مرة أخرى.");
  return result.data as T;
}

export const getUserNotifications = () => notificationApi<NotificationBundle>("/api/notifications");
export const markNotificationRead = (id: string) => notificationApi<{ notificationId: string }>(`/api/notifications/${encodeURIComponent(id)}/read`, "PATCH");
export const markAllNotificationsRead = () => notificationApi<{ updatedCount: number }>("/api/notifications/read-all", "PATCH");
