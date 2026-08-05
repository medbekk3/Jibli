"use client";

import { Bell, ChevronRight, ShoppingCart, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/features/cart/cart-context";
import { useNotifications } from "@/features/notifications/notification-context";

import { PageContainer } from "./page-container";

export function Header({ title, backHref }: { title?: string; backHref?: string }) {
  const { items, hydrated } = useCart();
  const { unreadCount } = useNotifications();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-[#fffdf9]/90 shadow-[0_1px_0_rgba(36,26,22,.02)] backdrop-blur-xl">
      <PageContainer className="flex min-h-[4.75rem] items-center justify-between gap-2 py-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {backHref && (
            <Link href={backHref} aria-label={"\u0631\u062c\u0648\u0639"} className="grid size-10 shrink-0 place-items-center rounded-2xl border border-line bg-white">
              <ChevronRight className="size-5" />
            </Link>
          )}
          <Link href="/" aria-label={"\u062c\u064a\u0628\u0644\u064a - \u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629"} className="flex min-w-0 items-center gap-2.5 text-right sm:gap-3" dir="rtl">
            <Image src="/images/icon-192.png" alt="Jibli" width={192} height={192} priority className="size-11 shrink-0 rounded-2xl object-cover shadow-[0_7px_20px_rgba(237,91,24,.2)] sm:size-12" sizes="48px" />
            <span className="min-w-0 leading-none">
              <span className="block text-xl font-black tracking-[-0.04em] text-ink sm:text-[1.35rem]">&#x062C;&#x064A;&#x0628;&#x0644;&#x064A;</span>
              <span className="mt-1.5 line-clamp-2 max-w-40 text-right text-[9px] font-medium leading-[1.45] text-[#6B7280] min-[390px]:max-w-52 sm:max-w-none sm:whitespace-nowrap sm:text-[10px]">
                &#x062C;&#x064A;&#x0628;&#x0644;&#x064A;&#x2026; &#x0643;&#x0644; &#x0645;&#x0637;&#x0627;&#x0639;&#x0645; &#x0628;&#x0631;&#x064A;&#x0627;&#x0646; &#x0641;&#x064A; &#x0645;&#x0643;&#x0627;&#x0646; &#x0648;&#x0627;&#x062D;&#x062F;
              </span>
            </span>
          </Link>
          {title && <span className="hidden truncate border-r border-gray-200 pr-3 text-sm font-bold text-gray-700 lg:inline">{title}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link href="/notifications" aria-label={"\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a"} className="relative grid size-9 place-items-center rounded-xl bg-white ring-1 ring-line sm:size-10 sm:rounded-2xl">
            <Bell className="size-[1.15rem] sm:size-5" />
            {unreadCount > 0 && <Badge count={unreadCount} />}
          </Link>
          <Link href="/cart" aria-label={"\u0627\u0644\u0633\u0644\u0629"} className="relative grid size-9 place-items-center rounded-xl bg-primary-soft text-primary sm:size-10 sm:rounded-2xl">
            <ShoppingCart className="size-[1.15rem] sm:size-5" />
            {hydrated && count > 0 && <Badge count={count} />}
          </Link>
          <Link href="/profile" aria-label={"\u0627\u0644\u062d\u0633\u0627\u0628"} className="grid size-9 place-items-center rounded-xl bg-ink text-white sm:flex sm:h-10 sm:w-auto sm:gap-2 sm:rounded-2xl sm:px-3 sm:text-xs sm:font-bold">
            <UserRound className="size-4" />
            <span className="hidden md:inline">&#x0627;&#x0644;&#x062D;&#x0633;&#x0627;&#x0628;</span>
          </Link>
        </div>
      </PageContainer>
    </header>
  );
}

function Badge({ count }: { count: number }) {
  return <span className="absolute -left-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[9px] font-black text-white">{count > 99 ? "+99" : new Intl.NumberFormat("ar-DZ-u-nu-latn").format(count)}</span>;
}