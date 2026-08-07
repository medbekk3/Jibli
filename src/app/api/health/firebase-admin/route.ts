import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireActiveAdminSession();

    await adminAuth.listUsers(1);
    await adminDb.collection("restaurants").limit(1).get();

    return adminSuccess({
      success: true,
      adminInitialized: true,
      authReachable: true,
      firestoreReachable: true,
    });
  } catch (error) {
    logAdminApiFailure("GET /api/health/firebase-admin", "health check", error);

    if (isAdminSessionError(error)) {
      return adminFailure(error.code, error.message, error.status);
    }

    return adminFailure(
      "FIREBASE_ADMIN_NOT_CONFIGURED",
      "تعذر إكمال فحص اتصال الخادم.",
      500,
    );
  }
}