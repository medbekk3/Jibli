"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { getUserNotifications, markAllNotificationsRead, markNotificationRead, type UserNotification } from "@/lib/firebase/services/notification.service";

type NotificationContextValue = { notifications: UserNotification[]; unreadCount: number; loading: boolean; error: string; refresh: () => Promise<void>; markRead: (id: string) => Promise<void>; markAllRead: () => Promise<void> };
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, role, status } = useAuth(); const [notifications, setNotifications] = useState<UserNotification[]>([]); const [unreadCount, setUnreadCount] = useState(0); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const enabled = Boolean(user && status === "active" && (role === "customer" || role === "restaurant"));
  const refresh = useCallback(async () => { if (!enabled) return; setLoading(true); setError(""); try { const data = await getUserNotifications(); setNotifications(data.notifications); setUnreadCount(data.unreadCount); } catch (value) { setError(value instanceof Error ? value.message : "تعذر تحميل الإشعارات. حاول مرة أخرى."); } finally { setLoading(false); } }, [enabled]);
  useEffect(() => { if (!enabled) { void Promise.resolve().then(() => { setNotifications([]); setUnreadCount(0); setError(""); setLoading(false); }); return; } void Promise.resolve().then(refresh); const timer = window.setInterval(() => void refresh(), 30000); return () => window.clearInterval(timer); }, [enabled, refresh]);
  const markRead = useCallback(async (id: string) => { const current = notifications.find((item) => item.id === id); if (!current || current.isRead) return; await markNotificationRead(id); setNotifications((items) => items.map((item) => item.id === id ? { ...item, isRead: true } : item)); setUnreadCount((count) => Math.max(0, count - 1)); }, [notifications]);
  const markAllRead = useCallback(async () => { if (!unreadCount) return; await markAllNotificationsRead(); setNotifications((items) => items.map((item) => ({ ...item, isRead: true }))); setUnreadCount(0); }, [unreadCount]);
  const value = useMemo(() => ({ notifications, unreadCount, loading, error, refresh, markRead, markAllRead }), [error, loading, markAllRead, markRead, notifications, refresh, unreadCount]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() { const value = useContext(NotificationContext); if (!value) throw new Error("يجب استعمال الإشعارات داخل مزود الإشعارات."); return value; }
