import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp, getAdminDb } from "./admin";

export type PushPayload = { notification: { title: string; body: string }; data: { type: string; orderId: string; orderNumber: string; url: string; status: string } };
type TokenRecord = { id: string; token: string };
const invalidCodes = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token"]);

export function pushTokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const snapshot = await getAdminDb().collection("pushTokens").where("userId", "==", userId).where("enabled", "==", true).get();
  return sendPushToTokens(snapshot.docs.map((doc) => ({ id: doc.id, token: String(doc.data().token ?? "") })).filter((item) => item.token), payload);
}

export async function sendPushToRestaurant(restaurantId: string, payload: PushPayload) {
  const snapshot = await getAdminDb().collection("restaurants").doc(restaurantId).get();
  const ownerId = snapshot.data()?.ownerId;
  if (typeof ownerId !== "string" || !ownerId) return { successCount: 0, failureCount: 0, cleanedCount: 0, errorCodes: ["restaurant-owner-missing"] };
  return sendPushToUser(ownerId, payload);
}

export async function sendPushToTokens(records: TokenRecord[], payload: PushPayload) {
  let successCount = 0; let failureCount = 0; const invalidIds: string[] = []; const errorCodes = new Set<string>();
  for (let start = 0; start < records.length; start += 500) {
    const batch = records.slice(start, start + 500);
    try {
      const response = await getMessaging(getAdminApp()).sendEachForMulticast({ tokens: batch.map((item) => item.token), notification: payload.notification, data: payload.data, webpush: { headers: { Urgency: "high" }, fcmOptions: { link: payload.data.url }, notification: { icon: "/images/icon.png", badge: "/images/icon.png", tag: `${payload.data.type}:${payload.data.orderId}`, renotify: true, data: { url: payload.data.url } } } });
      successCount += response.successCount; failureCount += response.failureCount;
      response.responses.forEach((item, index) => { if (!item.success) { const code = item.error?.code ?? "messaging/unknown"; errorCodes.add(code); if (invalidCodes.has(code)) invalidIds.push(batch[index].id); } });
    } catch (error) { failureCount += batch.length; errorCodes.add(error instanceof Error ? (error as Error & { code?: string }).code ?? "messaging/send-failed" : "messaging/send-failed"); }
  }
  const cleanedCount = await removeInvalidPushTokens(invalidIds);
  return { successCount, failureCount, cleanedCount, errorCodes: [...errorCodes] };
}

export async function removeInvalidPushTokens(documentIds: string[]) {
  if (!documentIds.length) return 0;
  const database = getAdminDb(); const batch = database.batch();
  [...new Set(documentIds)].forEach((id) => batch.set(database.collection("pushTokens").doc(id), { enabled: false, updatedAt: FieldValue.serverTimestamp(), disabledReason: "invalid-token" }, { merge: true }));
  await batch.commit(); return new Set(documentIds).size;
}

export function logPushResult(event: string, result: { successCount: number; failureCount: number; cleanedCount: number; errorCodes: string[] }) { console.info("[push]", { event, successCount: result.successCount, failureCount: result.failureCount, cleanedCount: result.cleanedCount, errorCodes: result.errorCodes }); }