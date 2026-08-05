import Link from "next/link";

export function SectionTitle({ title, href, action = "عرض الكل" }: { title: string; href?: string; action?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xl font-black text-gray-950">{title}</h2>
      {href && <Link href={href} className="text-xs font-bold text-primary">{action}</Link>}
    </div>
  );
}
