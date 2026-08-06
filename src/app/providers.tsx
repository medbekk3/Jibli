"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/auth-context";
import { RouteGuard } from "@/features/auth/route-guard";
import { CartProvider } from "@/features/cart/cart-context";
import { NotificationProvider } from "@/features/notifications/notification-context";
import { PushNotificationsProvider } from "@/features/push-notifications/push-provider";
import { PushPermissionPrompt } from "@/features/push-notifications/push-permission-prompt";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider><NotificationProvider><PushNotificationsProvider><PushPermissionPrompt /><CartProvider><RouteGuard>{children}</RouteGuard></CartProvider></PushNotificationsProvider></NotificationProvider></AuthProvider>;
}
