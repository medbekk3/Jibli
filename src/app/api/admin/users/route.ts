export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";

export async function GET() {
  try {
    await requireActiveAdminSession();
    const dbSnapshot = await adminDb.collection("users").get();
    const authUsers = new Map<string, { disabled: boolean; lastSignInTime: string | null }>();
    let pageToken: string | undefined;
    do {
      const page = await adminAuth.listUsers(1000, pageToken);
      page.users.forEach((user) => authUsers.set(user.uid, { disabled: user.disabled, lastSignInTime: user.metadata.lastSignInTime ?? null }));
      pageToken = page.pageToken;
    } while (pageToken);
    const firestoreIds = new Set(dbSnapshot.docs.map((doc) => doc.id));
    const users = dbSnapshot.docs.map((document) => {
      const auth = authUsers.get(document.id);
      const value = document.data();
      return serializeDocument(document.id, { ...value, uid: document.id, firstName:value.firstName??"",lastName:value.lastName??"",fullName:value.fullName??"",email:value.email??"",phone:value.phone??"",role:value.role??"customer",status:value.status??"pending",createdAt:value.createdAt??null,updatedAt:value.updatedAt??null,authAccountExists: Boolean(auth), authDisabled: auth?.disabled ?? null, lastLoginAt: value.lastLoginAt ?? auth?.lastSignInTime ?? null });
    });
    for (const [uid, auth] of authUsers) if (!firestoreIds.has(uid)) users.push(serializeDocument(uid, { uid, fullName: "", firstName: "", lastName: "", email: "", phone: "", role: "customer", status: "pending", firestoreDocumentExists: false, authAccountExists: true, authDisabled: auth.disabled, lastLoginAt: auth.lastSignInTime, createdAt: null, updatedAt: null }));
    return adminSuccess(users);
  } catch (error) {
    logAdminApiFailure("GET /api/admin/users", "دمج Firestore وAuthentication", error);
    if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status);
    return adminFailure("USERS_LOAD_FAILED", "تعذر تحميل المستخدمين.", 500);
  }
}
