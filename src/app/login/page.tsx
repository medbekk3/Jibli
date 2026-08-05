import { AuthShell } from "@/features/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string; reason?: string }> }) {
  const params = await searchParams;
  return <AuthShell title="تسجيل الدخول" description="أدخل بيانات حسابك للمتابعة في جيبلي."><LoginForm redirect={params.redirect} pendingNotice={params.reason === "pending"} /></AuthShell>;
}
