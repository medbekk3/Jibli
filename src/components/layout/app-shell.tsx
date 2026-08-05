import type { ReactNode } from "react";

import { Header } from "./header";
import { MobileBottomNavigation } from "./mobile-bottom-navigation";

export function AppShell({ children, title, backHref }: { children: ReactNode; title?: string; backHref?: string }) {
  return (
    <div className="brand-glow min-h-dvh bg-surface pb-20 md:pb-0">
      <Header title={title} backHref={backHref} />
      {children}
      <MobileBottomNavigation />
    </div>
  );
}
