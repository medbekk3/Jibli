import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import type { ReactNode } from "react";

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="brand-grid brand-glow min-h-dvh bg-surface px-4 py-8 sm:grid sm:place-items-center sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center"><BrandMark /></div>
        <div className="mt-7 rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_24px_70px_rgba(85,46,25,.11)] backdrop-blur sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><ShieldCheck className="size-6" /></span>
          <h1 className="mt-5 text-2xl font-black">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </main>
  );
}
