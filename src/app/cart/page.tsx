import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { CartView } from "@/features/cart/cart-view";

export default function CartPage() { return <AppShell title="السلة" backHref="/"><PageContainer className="py-7"><h1 className="mb-6 text-2xl font-black">سلة الطلب</h1><CartView /></PageContainer></AppShell>; }
