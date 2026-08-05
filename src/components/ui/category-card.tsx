import type { Category } from "@/types";
import Link from "next/link";
import Image from "next/image";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href="/restaurants" className="flex min-w-20 flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200">
      <span className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-orange-50 text-2xl" aria-hidden>{category.image ? <Image src={category.image} alt="" fill className="object-cover" sizes="48px" /> : category.icon}</span>
      <span className="whitespace-nowrap text-xs font-bold text-gray-700">{category.name}</span>
    </Link>
  );
}
