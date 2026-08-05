"use client";

import { RestaurantShell } from "@/components/restaurant-dashboard/restaurant-shell";
import { NotificationList } from "@/features/notifications/notification-list";
import { useRestaurantAccount } from "@/features/restaurant-dashboard/restaurant-context";

export default function RestaurantNotificationsPage() {
  const { restaurant } = useRestaurantAccount();
  return <RestaurantShell title="الإشعارات" restaurant={restaurant ?? undefined}><NotificationList /></RestaurantShell>;
}
