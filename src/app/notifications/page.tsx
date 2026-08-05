"use client";

import { AppShell } from "@/components/layout/app-shell";
import { NotificationList } from "@/features/notifications/notification-list";

export default function NotificationsPage() {
  return <AppShell title="الإشعارات" backHref="/"><div className="mx-auto max-w-3xl p-4 sm:py-8"><NotificationList /></div></AppShell>;
}
