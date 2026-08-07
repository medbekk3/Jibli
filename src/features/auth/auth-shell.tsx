import type { ReactNode } from "react";
import { BrandMark } from "@/components/ui/brand-mark";

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="brand-grid brand-glow min-h-dvh bg-surface px-4 py-8 sm:grid sm:place-items-center sm:py-12"><div className="mx-auto w-full max-w-md">
    <div className="flex justify-center"><BrandMark /></div>
    <div className="mt-8 rounded-[24px] border border-white bg-white p-5 shadow-[0_20px_55px_rgba(6,26,53,.10)] sm:p-8">
      <span className="block h-1 w-12 rounded-full bg-primary" />
      <h1 className="mt-5 text-2xl font-black tracking-[-.03em] text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
      <div className="mt-7">{children}</div>
    </div>
  </div></main>;
}
