import { NextRequest, NextResponse } from "next/server";
import { serializeFirestoreData } from "@/lib/firebase/serialize-firestore";
import { getAllowedNotificationDocuments, NotificationApiError, normalizeNotificationAudience, readNotificationIds, requireNotificationUser } from "@/lib/notifications/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireNotificationUser(request);
    const documents = await getAllowedNotificationDocuments(user.uid, user.role);
    const readIds = await readNotificationIds(user.uid, documents);
    const notifications = documents.map((document) => {
      const data = document.data();
      return serializeFirestoreData({ id: document.id, title: String(data.title ?? ""), body: String(data.body ?? ""), audience: normalizeNotificationAudience(data.audience), targetUserId: data.targetUserId ?? null, type: String(data.type ?? "general"), link: String(data.link ?? ""), createdAt: data.createdAt ?? null, isRead: readIds.has(document.id) });
    });
    return NextResponse.json({ success: true, data: { notifications, unreadCount: documents.length - readIds.size } });
  } catch (error) {
    const value = error instanceof NotificationApiError ? error : new NotificationApiError(500, "NOTIFICATIONS_LOAD_FAILED", "تعذر تحميل الإشعارات. حاول مرة أخرى.");
    console.error("[GET /api/notifications] فشل تحميل الإشعارات", { code: value.code, message: error instanceof Error ? error.message : value.message });
    return NextResponse.json({ success: false, error: { code: value.code, message: value.message } }, { status: value.status });
  }
}
