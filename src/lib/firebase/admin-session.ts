import { cookies } from "next/headers";

import { getAdminAuth, getAdminDb } from "./admin";

export class AdminSessionError extends Error {
  constructor(public status: 401 | 403 | 500, public code: "ADMIN_SESSION_REQUIRED" | "ADMIN_FORBIDDEN" | "FIREBASE_ADMIN_NOT_CONFIGURED", message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export async function requireActiveAdminSession() {
  const session = (await cookies()).get("jibli_admin_session")?.value;
  if (!session) throw new AdminSessionError(401, "ADMIN_SESSION_REQUIRED", "انتهت جلسة الإدارة، سجّل الدخول مجدداً.");

  let decoded;
  try {
    decoded = await getAdminAuth().verifySessionCookie(session, true);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (typeof code === "string" && (code.startsWith("app/") || code.startsWith("credential/"))) {
      throw new AdminSessionError(500, "FIREBASE_ADMIN_NOT_CONFIGURED", "تعذر إعداد Firebase Admin على الخادم.", { cause: error });
    }
    throw new AdminSessionError(401, "ADMIN_SESSION_REQUIRED", "انتهت جلسة الإدارة، سجّل الدخول مجدداً.", { cause: error });
  }

  let snapshot;
  try {
    snapshot = await getAdminDb().collection("users").doc(decoded.uid).get();
  } catch (error) {
    throw new AdminSessionError(500, "FIREBASE_ADMIN_NOT_CONFIGURED", "تعذر الاتصال بقاعدة بيانات الإدارة.", { cause: error });
  }
  const profile = snapshot.data();
  if (!snapshot.exists || profile?.role !== "admin" || profile?.status !== "active") {
    throw new AdminSessionError(403, "ADMIN_FORBIDDEN", "لا تملك صلاحية الإدارة النشطة.");
  }
  return { uid: decoded.uid, profile: { ...(profile as Record<string, unknown>), uid: decoded.uid } };
}

export function isAdminSessionError(error: unknown): error is AdminSessionError {
  return error instanceof AdminSessionError;
}
