import type { InputHTMLAttributes, ReactNode } from "react";

export const authInputClass = "mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-orange-50";

export function AuthField({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block text-sm font-bold text-gray-800">{label}<input {...props} className={authInputClass} /></label>;
}

export function FormMessage({ type, children }: { type: "error" | "success"; children: ReactNode }) {
  return <div role={type === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm font-bold leading-6 ${type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>{children}</div>;
}
