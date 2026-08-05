import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth, getAdminDb } from "./admin";

function logAdminAuthorizationFailure(stage: string, error: unknown) {
  const details = error instanceof Error
    ? { code: (error as Error & { code?: string }).code ?? "unknown", message: error.message }
    : { code: "unknown", message: "خطأ غير معروف" };
  console.error("[صلاحية الإدارة] فشل التحقق", {
    stage,
    errorCode: details.code,
    errorMessage: details.message,
  });
}

export async function requireActiveAdmin(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ") || !header.slice(7).trim()) {
    return { error: NextResponse.json({ message: "يلزم تسجيل الدخول." }, { status: 401 }) };
  }

  let token;
  try {
    token = await getAdminAuth().verifyIdToken(header.slice(7));
  } catch (error) {
    logAdminAuthorizationFailure("التحقق من رمز الدخول", error);
    return { error: NextResponse.json({ message: "جلسة الإدارة غير صالحة." }, { status: 401 }) };
  }

  try {
    const snapshot = await getAdminDb().collection("users").doc(token.uid).get();
    const profile = snapshot.data();
    if (!snapshot.exists || profile?.role !== "admin" || profile?.status !== "active") {
      logAdminAuthorizationFailure("التحقق من الدور والحالة", new Error("الحساب ليس مديراً نشطاً."));
      return { error: NextResponse.json({ message: "لا تملك صلاحية تنفيذ هذا الإجراء." }, { status: 403 }) };
    }
    return { uid: token.uid };
  } catch (error) {
    logAdminAuthorizationFailure("قراءة ملف المستخدم", error);
    return { error: NextResponse.json({ message: "تعذر التحقق من صلاحية الإدارة على الخادم." }, { status: 500 }) };
  }
}
