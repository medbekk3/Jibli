import { FieldValue, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export type NormalizedAudience = "all" | "customers" | "restaurants" | "user";

export function normalizeNotificationAudience(value: unknown): NormalizedAudience | null {
  const audience = String(value ?? "").trim().toLowerCase();
  if (audience === "customer" || audience === "customers") return "customers";
  if (audience === "restaurant" || audience === "restaurants") return "restaurants";
  if (audience === "all" || audience === "all-users" || audience === "all_users") return "all";
  if (audience === "user") return "user";
  return null;
}

export async function requireNotificationUser(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new NotificationApiError(401, "NOTIFICATION_SESSION_REQUIRED", "انتهت جلسة تسجيل الدخول.");
  let decoded;
  try { decoded = await getAdminAuth().verifyIdToken(header.slice(7)); }
  catch { throw new NotificationApiError(401, "NOTIFICATION_SESSION_REQUIRED", "انتهت جلسة تسجيل الدخول."); }
  const snapshot = await getAdminDb().collection("users").doc(decoded.uid).get();
  const profile = snapshot.data();
  if (!snapshot.exists || profile?.status !== "active" || !["customer", "restaurant"].includes(String(profile.role))) {
    throw new NotificationApiError(403, "NOTIFICATION_FORBIDDEN", "ليس لديك صلاحية عرض الإشعارات.");
  }
  return { uid: decoded.uid, role: profile!.role as "customer" | "restaurant" };
}

export function notificationAllowed(data: DocumentData, uid: string, role: "customer" | "restaurant") {
  if (data.isActive !== true) return false;
  const audience = normalizeNotificationAudience(data.audience);
  if (!audience) return false;
  return audience === "all" || audience === (role === "customer" ? "customers" : "restaurants") || (audience === "user" && data.targetUserId === uid);
}

export async function getAllowedNotificationDocuments(uid: string, role: "customer" | "restaurant") {
  const snapshot = await getAdminDb().collection("notifications").where("isActive", "==", true).limit(100).get();
  const missingAudience = snapshot.docs.filter((document) => !normalizeNotificationAudience(document.data().audience)).map((document) => document.id);
  if (missingAudience.length) console.warn("[الإشعارات] وثائق بجمهور ناقص أو غير معروف", { notificationIds: missingAudience });
  return snapshot.docs.filter((document) => notificationAllowed(document.data(), uid, role)).sort((a, b) => timestampMillis(b) - timestampMillis(a));
}

export async function readNotificationIds(uid: string, documents: QueryDocumentSnapshot<DocumentData>[]) {
  if (!documents.length) return new Set<string>();
  const refs = documents.map((document) => getAdminDb().collection("notificationReads").doc(`${document.id}_${uid}`));
  const snapshots = await getAdminDb().getAll(...refs);
  return new Set(snapshots.filter((snapshot) => snapshot.exists).map((snapshot) => String(snapshot.data()?.notificationId ?? "")));
}

export async function markNotificationRead(notificationId: string, uid: string) {
  await getAdminDb().collection("notificationReads").doc(`${notificationId}_${uid}`).set({ notificationId, userId: uid, readAt: FieldValue.serverTimestamp() }, { merge: true });
}

function timestampMillis(document: QueryDocumentSnapshot<DocumentData>) {
  const value = document.data().createdAt;
  return typeof value?.toMillis === "function" ? value.toMillis() : 0;
}

export class NotificationApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
