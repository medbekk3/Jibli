import Image from "next/image";
import Link from "next/link";

export function BrandMark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="جيبلي - الصفحة الرئيسية">
    <Image src="/images/icon-192.png" alt="" width={192} height={192} className="size-11 shrink-0 rounded-2xl object-cover shadow-[0_10px_24px_rgba(255,122,0,.25)] transition-transform duration-200 group-hover:scale-105" />
    {!compact && <span className="leading-none"><span className={`block text-[1.35rem] font-black tracking-[-.04em] ${inverse ? "text-white" : "text-ink"}`}>جيبلي</span><span className={`mt-1 block text-[9px] font-medium ${inverse ? "text-white/65" : "text-muted"}`}>كل مطاعم بريان في مكان واحد</span></span>}
  </Link>;
}
