import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireActiveAdminSession(); const { id } = await params;
    const snapshot = await getAdminDb().collection("users").doc(id).get();
    const auth = await getAdminAuth().getUser(id).catch(() => null);
    if (!snapshot.exists && !auth) return adminFailure("INVALID_FORM_DATA", "المستخدم غير موجود.", 404);
    return adminSuccess(serializeDocument(id, { uid: id, ...(snapshot.data() ?? {}), firestoreDocumentExists: snapshot.exists, authAccountExists: Boolean(auth), authDisabled: auth?.disabled ?? null, lastLoginAt: snapshot.data()?.lastLoginAt ?? auth?.metadata.lastSignInTime ?? null }));
  } catch (error) {
    logAdminApiFailure("GET /api/admin/users/[id]", "تحميل المستخدم", error);
    if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status);
    return adminFailure("USERS_LOAD_FAILED", "تعذر تحميل بيانات المستخدم.", 500);
  }
}
