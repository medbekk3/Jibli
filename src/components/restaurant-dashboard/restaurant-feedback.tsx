"use client";
import { AdminError } from "@/components/admin/admin-feedback";
export function RestaurantError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div><AdminError message={message} /><button type="button" onClick={onRetry} className="mt-3 h-10 rounded-xl bg-gray-950 px-4 text-sm font-black text-white">إعادة المحاولة</button></div>; }
