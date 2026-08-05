import { Bike } from "lucide-react";
import Link from "next/link";

export function BrandMark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label={"\u062c\u064a\u0628\u0644\u064a - \u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629"}>
      <span className="brand-icon grid size-10 shrink-0 place-items-center rounded-[14px] text-white shadow-[0_8px_22px_rgba(234,88,12,.24)] transition-transform group-hover:-rotate-3 group-hover:scale-105">
        <Bike className="size-5" strokeWidth={2.5} />
      </span>
      {!compact && <span className="leading-none"><span className={`block text-[1.35rem] font-black tracking-[-0.04em] ${inverse ? "text-white" : "text-ink"}`}>&#x062C;&#x064A;&#x0628;&#x0644;&#x064A;</span><span className={`mt-1 block text-[8px] font-bold tracking-[.12em] ${inverse ? "text-white/50" : "text-muted"}`}>&#x0645;&#x0646; &#x0628;&#x0631;&#x064A;&#x0627;&#x0646;&#x060C; &#x0644;&#x0628;&#x0631;&#x064A;&#x0627;&#x0646;</span></span>}
    </Link>
  );
}
