import { AuthShell } from "@/features/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return <AuthShell title="استرجاع كلمة المرور" description="سنرسل لك رابطاً يساعدك على إنشاء كلمة مرور جديدة."><ForgotPasswordForm /></AuthShell>;
}
