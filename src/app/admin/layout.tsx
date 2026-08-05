import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { ToastProvider } from "@/components/admin/admin-ui";
import { AdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireActiveAdminSession();
  } catch (error) {
    if (error instanceof AdminSessionError && error.status === 403) redirect("/");
    redirect("/login?redirect=/admin");
  }
  return <ToastProvider>{children}</ToastProvider>;
}
