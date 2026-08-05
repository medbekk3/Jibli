import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { RestaurantProvider } from "@/features/restaurant-dashboard/restaurant-context";
import { getRestaurantSession, RestaurantSessionError } from "@/lib/firebase/restaurant-session";
export default async function RestaurantDashboardLayout({ children }: { children: ReactNode }) {
  try { await getRestaurantSession(); }
  catch (error) { if (error instanceof RestaurantSessionError && error.status === 403) redirect("/"); redirect("/login?redirect=/restaurant-dashboard"); }
  return <RestaurantProvider>{children}</RestaurantProvider>;
}
