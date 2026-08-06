import { NextRequest } from "next/server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { logProductionRouteError } from "@/lib/api/production-route-log";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

type FailureStage =
  | "قراءة الطلب"
  | "إعداد Firebase Admin"
  | "التحقق من رمز الدخول"
  | "قراءة ملف المستخدم"
  | "التحقق من صلاحية الإدارة"
  | "إنشاء جلسة الإدارة";

function errorDetails(error: unknown) {
  if (error instanceof Error) {
    const coded = error as Error & { code?: string };
    return { code: coded.code ?? "unknown", message: error.message };
  }
  return { code: "unknown", message: "خطأ غير معروف" };
}

function logSessionFailure(_stage: FailureStage, error: unknown, status = 500) {
  logProductionRouteError("POST /api/auth/session", status, error);
}


function tokenFailure(error: unknown) {
  const { code } = errorDetails(error);
  if (code === "auth/id-token-expired") {
    return apiError("AUTH_ID_TOKEN_EXPIRED", "انتهت صلاحية جلسة الدخول، أعد تسجيل الدخول.", 401);
  }
  if (code === "auth/id-token-revoked") {
    return apiError("AUTH_ID_TOKEN_REVOKED", "تم إلغاء جلسة الدخول، أعد تسجيل الدخول.", 401);
  }
  if (code === "auth/invalid-credential" || code === "app/invalid-credential") {
    return apiError("FIREBASE_ADMIN_NOT_CONFIGURED", "إعدادات Firebase Admin غير صحيحة.", 500);
  }
  if (code === "auth/argument-error") {
    return apiError("AUTH_INVALID_TOKEN", "رمز تسجيل الدخول غير صالح.", 401);
  }
  return apiError("AUTH_INVALID_TOKEN", "تعذر التحقق من جلسة الدخول. أعد تسجيل الدخول.", 401);
}

function serverFailure(stage: FailureStage, error: unknown) {
  logSessionFailure(stage, error);
  return apiError("FIREBASE_ADMIN_NOT_CONFIGURED", "تعذر إعداد جلسة الإدارة على الخادم. راجع إعدادات Firebase Admin.", 500);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    logSessionFailure("قراءة الطلب", error, 400);
    return apiError("INVALID_FORM_DATA", "بيانات طلب تسجيل الدخول غير صالحة.", 400);
  }

  const idToken = typeof body === "object" && body !== null && "idToken" in body
    ? (body as { idToken?: unknown }).idToken
    : undefined;
  if (typeof idToken !== "string" || !idToken.trim()) {
    return apiError("INVALID_FORM_DATA", "رمز تسجيل الدخول مطلوب.", 400);
  }

  let auth;
  let database;
  try {
    auth = getAdminAuth();
    database = getAdminDb();
  } catch (error) {
    return serverFailure("إعداد Firebase Admin", error);
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch (error) {
    const failure = tokenFailure(error);
    logSessionFailure("التحقق من رمز الدخول", error, failure.status);
    return failure;
  }

  let profileSnapshot;
  try {
    profileSnapshot = await database.collection("users").doc(decoded.uid).get();
  } catch (error) {
    return serverFailure("قراءة ملف المستخدم", error);
  }

  const profile = profileSnapshot.data();
  if (!profileSnapshot.exists || profile?.role !== "admin" || profile?.status !== "active") {
    logSessionFailure("التحقق من صلاحية الإدارة", new Error("الحساب ليس مديراً نشطاً."), 403);
    return apiError("ADMIN_FORBIDDEN", "هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة.", 403);
  }

  let sessionCookie: string;
  try {
    sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });
  } catch (error) {
    return serverFailure("إنشاء جلسة الإدارة", error);
  }

  const response = apiSuccess({ sessionCreated: true });
  response.cookies.set("jibli_admin_session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = apiSuccess({ sessionDeleted: true });
  response.cookies.set("jibli_admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
