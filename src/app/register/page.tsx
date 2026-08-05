import { AuthShell } from "@/features/auth/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return <AuthShell title="إنشاء حساب جديد" description="أنشئ حساب زبون وابدأ الطلب من مطاعم بريان."><RegisterForm /></AuthShell>;
}
