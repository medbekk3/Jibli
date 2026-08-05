import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface p-6 text-center">
      <div><span className="mx-auto grid size-20 place-items-center rounded-full bg-orange-50 text-primary"><SearchX className="size-9" /></span><h1 className="mt-6 text-2xl font-black">الصفحة غير موجودة</h1><p className="mt-2 text-sm text-gray-500">تعذر العثور على الصفحة التي تبحث عنها.</p><Link href="/" className="mt-6 inline-flex h-12 items-center rounded-2xl bg-primary px-6 font-black text-white">العودة للرئيسية</Link></div>
    </main>
  );
}
