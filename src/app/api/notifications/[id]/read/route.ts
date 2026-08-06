export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { markNotificationRead, notificationAllowed, NotificationApiError, requireNotificationUser } from "@/lib/notifications/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireNotificationUser(request); const { id } = await params;
    const snapshot = await adminDb.collection("notifications").doc(id).get();
    if (!snapshot.exists) throw new NotificationApiError(404, "NOTIFICATION_NOT_FOUND", "الإشعار غير موجود.");
    if (!notificationAllowed(snapshot.data()!, user.uid, user.role)) throw new NotificationApiError(403, "NOTIFICATION_FORBIDDEN", "ليس لديك صلاحية قراءة هذا الإشعار.");
    await markNotificationRead(id, user.uid);
    return NextResponse.json({ success: true, data: { notificationId: id } });
  } catch (error) {
    const value = error instanceof NotificationApiError ? error : new NotificationApiError(500, "NOTIFICATION_READ_FAILED", "تعذر تحديث حالة الإشعار.");
    return NextResponse.json({ success: false, error: { code: value.code, message: value.message } }, { status: value.status });
  }
}
