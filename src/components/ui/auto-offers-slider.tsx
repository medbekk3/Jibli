"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Offer } from "@/types";
import { OfferCard } from "./offer-card";

export function AutoOffersSlider({ offers }: { offers: Offer[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (offers.length < 2 || paused) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % offers.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [offers.length, paused]);

  if (!offers.length) return null;

  const activeIndex = Math.min(index, offers.length - 1);
  const next = () => setIndex((current) => (current + 1) % offers.length);
  const previous = () =>
    setIndex((current) => (current - 1 + offers.length) % offers.length);

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={offers[activeIndex].id}
          initial={reduceMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          drag={offers.length > 1 && !reduceMotion ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragStart={() => setPaused(true)}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 45) {
              if (info.offset.x > 0) previous();
              else next();
            }
            setPaused(false);
          }}
        >
          <OfferCard offer={offers[activeIndex]} />
        </motion.div>
      </AnimatePresence>

      {offers.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" dir="ltr">
          {offers.map((offer, itemIndex) => (
            <button
              key={offer.id}
              type="button"
              aria-label={`عرض ${itemIndex + 1}`}
              onClick={() => setIndex(itemIndex)}
              className={`h-1.5 rounded-full transition-all ${
                itemIndex === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}