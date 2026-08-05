"use client";

import { Search } from "lucide-react";

export function SearchBar({ placeholder = "ابحث عن مطعم أو أكلة", value, onChange }: { placeholder?: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className="flex h-13 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 shadow-sm focus-within:border-orange-200 focus-within:ring-4 focus-within:ring-orange-50">
      <Search className="size-5 shrink-0 text-primary" />
      <input type="search" value={value} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
    </label>
  );
}
