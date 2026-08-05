"use client";

import { Minus, Plus } from "lucide-react";

export function QuantitySelector({ value, onChange, min = 1 }: { value: number; onChange: (value: number) => void; min?: number }) {
  return (
    <div className="inline-flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-1">
      <button type="button" aria-label="تقليل الكمية" onClick={() => onChange(Math.max(min, value - 1))} className="grid size-9 place-items-center rounded-xl bg-gray-100 text-gray-700 disabled:opacity-40" disabled={value <= min}><Minus className="size-4" /></button>
      <span className="min-w-5 text-center font-black">{new Intl.NumberFormat("ar-DZ-u-nu-latn").format(value)}</span>
      <button type="button" aria-label="زيادة الكمية" onClick={() => onChange(value + 1)} className="grid size-9 place-items-center rounded-xl bg-primary text-white"><Plus className="size-4" /></button>
    </div>
  );
}

