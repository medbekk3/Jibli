"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavigation } from "@/config/navigation";
import { useCart } from "@/features/cart/cart-context";

export function MobileBottomNavigation() {
  const pathname = usePathname(); const { hydrated, getItemsCount } = useCart(); const count = hydrated ? getItemsCount() : 0;
  return <nav aria-label="التنقل الرئيسي" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[#fffdf9]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(36,26,22,.06)] backdrop-blur-xl md:hidden"><div className="mx-auto grid h-[4.5rem] max-w-lg grid-cols-5">{mobileNavigation.map(({ label, href, icon: Icon }) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); const cart = href === "/cart"; return <Link key={href} href={href} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-transform active:scale-95 ${cart ? "text-primary" : active ? "text-primary" : "text-gray-400"}`}><span className={`relative grid transition-transform duration-200 ${cart ? "-translate-y-4 size-15 place-items-center rounded-full bg-[#FF6B00] text-white shadow-[0_10px_22px_rgba(255,107,0,.35)] active:scale-95" : ""}`}><Icon className={cart ? "size-7" : "size-5"} strokeWidth={active || cart ? 2.5 : 2} />{cart && count > 0 && <Badge count={count} />}</span><span className={`max-w-full truncate px-1 ${cart ? "-mt-4" : ""}`}>{label}</span></Link>; })}</div></nav>;
}
function Badge({ count }: { count: number }) { return <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-white bg-red-500 text-[9px] font-black text-white">{count > 99 ? "+99" : new Intl.NumberFormat("ar-DZ-u-nu-latn").format(count)}</span>; }
