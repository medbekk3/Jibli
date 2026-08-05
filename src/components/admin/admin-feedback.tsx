import { LoaderCircle } from "lucide-react";

export function AdminLoading() { return <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-bold text-gray-500"><LoaderCircle className="size-5 animate-spin text-primary" />جاري تحميل البيانات...</div>; }
export function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) { if (!message) return null; return <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600"><p>{message}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-3 h-9 rounded-xl bg-red-600 px-4 text-xs font-black text-white">إعادة المحاولة</button>}</div>; }
