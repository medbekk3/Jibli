import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-orange-50 text-primary"><Icon className="size-6" /></span>
      <h3 className="mt-4 font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}
