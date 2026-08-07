import { Star, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatArabicNumber } from "@/lib/format";
import type { Restaurant } from "@/types";

export function RestaurantCard({ restaurant, compact = false, priority = false }: { restaurant: Restaurant; compact?: boolean; priority?: boolean }) {
  return <Link href={`/restaurants/${restaurant.id}`} className="group block overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_8px_24px_rgba(6,26,53,.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(6,26,53,.10)]">
    <div className={`relative overflow-hidden bg-surface ${compact ? "h-28" : "h-40 sm:h-44"}`}>
      {restaurant.image ? <Image src={restaurant.image} alt={`صورة ${restaurant.name}`} fill priority={priority} className="object-cover transition duration-300 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 360px" /> : <span className="grid h-full place-items-center text-gray-300"><Store className="size-10" /></span>}
      <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-black shadow-sm ${restaurant.isOpen ? "bg-emerald-500 text-white" : "bg-ink text-white"}`}>{restaurant.isOpen ? "مفتوح" : "مغلق"}</span>
      {restaurant.rating > 0 && <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-ink shadow-sm"><Star className="size-3.5 fill-amber-400 text-amber-400" />{formatArabicNumber(restaurant.rating)}</span>}
    </div>
    <div className="flex min-h-18 items-center gap-3 p-4">
      <div className="relative size-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-surface shadow-sm">{restaurant.logo ? <Image src={restaurant.logo} alt={`شعار ${restaurant.name}`} fill className="object-cover" sizes="44px" /> : <Store className="grid size-full place-items-center p-3 text-muted" />}</div>
      <div className="min-w-0"><h3 className="truncate font-black text-ink">{restaurant.name}</h3>{restaurant.description && <p className="mt-1 line-clamp-1 text-xs text-muted">{restaurant.description}</p>}</div>
    </div>
  </Link>;
}
