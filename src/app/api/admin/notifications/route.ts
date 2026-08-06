export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { FieldValue } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";

const audiences = new Set(["all", "customers", "restaurants", "user"]);
const types = new Set(["general", "offer", "system", "order"]);

export async function POST(request: NextRequest) {
  try {
    const admin = await requireActiveAdminSession();
    const value = await request.json().catch(() => null) as Record<string, unknown> | null;
    const title = String(value?.title ?? "").trim();
    const body = String(value?.body ?? "").trim();
    const audience = String(value?.audience ?? "all");
    const type = String(value?.type ?? "general");
    const targetUserId = audience === "user" ? String(value?.targetUserId ?? "").trim() : null;
    const link = String(value?.link ?? "").trim();
    if (!title || !body || !audiences.has(audience) || !types.has(type) || (audience === "user" && !targetUserId)) {
      return adminFailure("INVALID_FORM_DATA", "بيانات الإشعار غير مكتملة أو غير صحيحة.", 400);
    }
    if (targetUserId) {
      const target = await adminDb.collection("users").doc(targetUserId).get();
      if (!target.exists) return adminFailure("INVALID_FORM_DATA", "المستخدم المحدد غير موجود.", 400);
    }
    const ref = adminDb.collection("notifications").doc();
    await ref.set({ title, body, audience, targetUserId, createdBy: admin.uid, createdAt: FieldValue.serverTimestamp(), isActive: true, type, link });
    return adminSuccess({ id: ref.id, message: "تم نشر الإشعار بنجاح." }, 201);
  } catch (error) {
    logAdminApiFailure("POST /api/admin/notifications", "نشر الإشعار", error);
    if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status);
    return adminFailure("ADMIN_OPERATION_FAILED", "تعذر نشر الإشعار.", 500);
  }
}
