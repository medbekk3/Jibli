"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { getRestaurantDashboard } from "@/lib/firebase/services/restaurant-dashboard.service";
import type { RestaurantDocument } from "@/types/collections";

type RestaurantContextValue = { restaurant: RestaurantDocument | null; loading: boolean; error: string; refresh: () => Promise<void> };
const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user, role, status, loading: authLoading } = useAuth();
  const shouldLoad = Boolean(user && role === "restaurant" && status === "active");
  const [restaurant, setRestaurant] = useState<RestaurantDocument | null>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user || role !== "restaurant" || status !== "active") return;
    try { setRestaurant((await getRestaurantDashboard()).restaurant); setError(""); }
    catch (caught) { setRestaurant(null); setError(caught instanceof Error ? caught.message : "تعذر تحميل بيانات المطعم."); }
    finally { setRestaurantLoading(false); }
  }, [role, status, user]);

  useEffect(() => { if (shouldLoad) void Promise.resolve().then(refresh); }, [refresh, shouldLoad]);
  const value = useMemo(() => ({ restaurant, loading: authLoading || (shouldLoad && restaurantLoading), error, refresh }), [authLoading, error, refresh, restaurant, restaurantLoading, shouldLoad]);
  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurantAccount() {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error("يجب استعمال بيانات المطعم داخل مزود المطعم.");
  return context;
}
