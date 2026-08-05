import Image from "next/image";
import Link from "next/link";

import type { Offer } from "@/types";

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Link href={`/restaurants/${offer.restaurantId}`} className="relative block h-44 min-w-[85%] overflow-hidden rounded-3xl sm:min-w-0">
      <Image src={offer.image} alt={`صورة ${offer.title}`} fill className="object-cover" sizes="(max-width: 640px) 85vw, 500px" />
      <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/35 to-transparent" />
      <div className="absolute inset-y-0 right-0 flex max-w-[75%] flex-col justify-center p-5 text-white">
        <span className="mb-2 w-fit rounded-full bg-primary px-2.5 py-1 text-[10px] font-black">عرض مميز</span>
        <h3 className="text-xl font-black">{offer.title}</h3>
        <p className="mt-1 text-xs leading-5 text-white/80">{offer.description}</p>
      </div>
    </Link>
  );
}
