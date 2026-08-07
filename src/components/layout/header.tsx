"use client";

import { Bell, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useNotifications } from "@/features/notifications/notification-context";
import { InstallAppButton } from "./install-app-button";
import { PageContainer } from "./page-container";

export function Header({ title, backHref }: { title?: string; backHref?: string }) {
  const { unreadCount } = useNotifications();
  return <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
    <PageContainer className="flex min-h-[4.5rem] items-center justify-between gap-2 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        {backHref && <Link href={backHref} aria-label="رجوع" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface text-ink transition hover:bg-primary-soft"><ChevronRight className="size-5" /></Link>}
        <Link href="/" aria-label="جيبلي - الصفحة الرئيسية" className="flex min-w-0 items-center gap-2.5"><Image src="/images/icon-192.png" alt="Jibli" width={192} height={192} priority className="size-10 shrink-0 rounded-2xl object-cover shadow-[0_8px_18px_rgba(255,122,0,.20)]" sizes="40px" /><span className="min-w-0"><span className="block text-lg font-black tracking-[-.04em] text-ink">جيبلي</span><span className="block truncate text-[9px] font-medium text-muted">كل مطاعم بريان في مكان واحد</span></span></Link>
        {title && <span className="hidden truncate border-r border-line pr-3 text-sm font-bold text-muted lg:inline">{title}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2"><InstallAppButton /><Link href="/notifications" aria-label="الإشعارات" className="relative grid size-10 place-items-center rounded-2xl bg-surface text-ink transition hover:bg-primary-soft"><Bell className="size-5" />{unreadCount > 0 && <Badge count={unreadCount} />}</Link></div>
    </PageContainer>
  </header>;
}
function Badge({ count }: { count: number }) { return <span className="absolute -left-1 -top-1 grid size-5 place-items-center rounded-full bg-ink text-[9px] font-black text-white">{count > 99 ? "+99" : new Intl.NumberFormat("ar-DZ-u-nu-latn").format(count)}</span>; }
