import { LoaderCircle } from "lucide-react";

export function AuthLoading() {
  return <main className="grid min-h-dvh place-items-center bg-surface"><div className="text-center"><LoaderCircle className="mx-auto size-9 animate-spin text-primary" /><p className="mt-4 text-sm font-bold text-gray-600">جاري التحقق من الجلسة...</p></div></main>;
}
