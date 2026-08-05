"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/auth-context";
import { RouteGuard } from "@/features/auth/route-guard";
import { CartProvider } from "@/features/cart/cart-context";
import { NotificationProvider } from "@/features/notifications/notification-context";
import { PushNotificationsProvider } from "@/features/push-notifications/push-provider";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider><NotificationProvider><PushNotificationsProvider><CartProvider><RouteGuard>{children}</RouteGuard></CartProvider></PushNotificationsProvider></NotificationProvider></AuthProvider>;
}
