export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireActiveAdminSession();
    const { id } = await params;
    const body = await request.json().catch(() => ({})) as { restaurantOnly?: boolean };
    const profileSnapshot = await adminDb.collection("users").doc(id).get();
    if (!profileSnapshot.exists) return adminFailure("INVALID_FORM_DATA", "وثيقة المستخدم غير موجودة.", 404);
    if (body.restaurantOnly === true && profileSnapshot.data()?.role !== "restaurant") return adminFailure("INVALID_FORM_DATA", "الحساب المحدد ليس حساب مطعم.", 409);
    let authUser;
    try { authUser = await adminAuth.getUser(id); }
    catch (error) {
      if ((error as { code?: string }).code === "auth/user-not-found") return adminFailure("INVALID_FORM_DATA", "حساب المصادقة غير موجود.", 404);
      throw error;
    }
    if (!authUser.email) return adminFailure("INVALID_FORM_DATA", "لا يوجد بريد إلكتروني مرتبط بالحساب.", 400);
    const link = await adminAuth.generatePasswordResetLink(authUser.email);
    return adminSuccess({ message: "تم إنشاء رابط آمن لإعادة تعيين كلمة المرور.", link });
  } catch (error) {
    logAdminApiFailure("POST /api/admin/users/[id]/reset-password", "إنشاء رابط إعادة التعيين", error);
    if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status);
    const code = (error as { code?: string }).code;
    if (code === "auth/invalid-email") return adminFailure("INVALID_FORM_DATA", "البريد الإلكتروني المرتبط بالحساب غير صالح.", 400);
    return adminFailure("ADMIN_OPERATION_FAILED", "تعذر إنشاء رابط إعادة تعيين كلمة المرور.", 500);
  }
}
