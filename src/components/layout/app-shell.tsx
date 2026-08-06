import type { ReactNode } from "react";

import { Header } from "./header";
import { MobileBottomNavigation } from "./mobile-bottom-navigation";

export function AppShell({ children, title, backHref }: { children: ReactNode; title?: string; backHref?: string }) {
  return (
    <div className="brand-glow min-h-dvh overflow-x-clip bg-surface pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header title={title} backHref={backHref} />
      {children}
      <MobileBottomNavigation />
    </div>
  );
}
