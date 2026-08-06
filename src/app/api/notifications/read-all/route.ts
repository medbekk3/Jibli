export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { FieldValue } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAllowedNotificationDocuments, NotificationApiError, requireNotificationUser } from "@/lib/notifications/server";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireNotificationUser(request); const documents = await getAllowedNotificationDocuments(user.uid, user.role); const batch = adminDb.batch();
    for (const document of documents) batch.set(adminDb.collection("notificationReads").doc(`${document.id}_${user.uid}`), { notificationId: document.id, userId: user.uid, readAt: FieldValue.serverTimestamp() }, { merge: true });
    await batch.commit();
    return NextResponse.json({ success: true, data: { updatedCount: documents.length } });
  } catch (error) {
    const value = error instanceof NotificationApiError ? error : new NotificationApiError(500, "NOTIFICATIONS_READ_FAILED", "تعذر تحديد الإشعارات كمقروءة.");
    return NextResponse.json({ success: false, error: { code: value.code, message: value.message } }, { status: value.status });
  }
}
