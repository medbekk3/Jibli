"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AuthLoading } from "./auth-loading";
import { useAuth } from "./auth-context";

const customerPaths = ["/profile", "/orders", "/cart", "/checkout", "/order-success", "/complaints"];
const isWithin = (pathname: string, root: string) => pathname === root || pathname.startsWith(`${root}/`);

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const { user, profile, role, status, loading } = useAuth();
  const customerRoute = customerPaths.some((path) => isWithin(pathname, path));
  const restaurantRoute = isWithin(pathname, "/restaurant-dashboard");
  const restaurantRoot = pathname === "/restaurant-dashboard";
  const adminRoute = isWithin(pathname, "/admin");
  const protectedRoute = customerRoute || restaurantRoute || adminRoute;
  const allowed = !protectedRoute || Boolean(user && profile && (
    (customerRoute && role === "customer" && status === "active")
    || (adminRoute && role === "admin" && status === "active")
    || (restaurantRoute && role === "restaurant" && (restaurantRoot || status === "active"))
  ));

  useEffect(() => {
    if (loading || !protectedRoute || allowed) return;
    if (!user || !profile) { router.replace(`/login?redirect=${encodeURIComponent(pathname)}`); return; }
    if (restaurantRoute && role === "restaurant" && !restaurantRoot) { router.replace("/restaurant-dashboard"); return; }
    router.replace("/");
  }, [allowed, loading, pathname, profile, protectedRoute, restaurantRoot, restaurantRoute, role, router, user]);

  if (protectedRoute && (loading || !allowed)) return <AuthLoading />;
  return children;
}
