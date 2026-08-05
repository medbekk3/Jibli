import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { CheckoutForm } from "@/features/checkout/checkout-form";

export default function CheckoutPage() { return <AppShell title="إتمام الطلب" backHref="/cart"><PageContainer className="py-7"><CheckoutForm /></PageContainer></AppShell>; }
