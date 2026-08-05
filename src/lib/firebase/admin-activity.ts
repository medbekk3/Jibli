import { FieldValue, type Firestore, type WriteBatch } from "firebase-admin/firestore";

export function adminActivityData(adminId: string, action: string, entityType: string, entityId: string, description: string) {
  return { adminId, action, entityType, entityId, description, createdAt: FieldValue.serverTimestamp() };
}

export function addAdminActivity(db: Firestore, adminId: string, action: string, entityType: string, entityId: string, description: string, writer?: WriteBatch) {
  const reference = db.collection("adminActivityLogs").doc();
  const data = adminActivityData(adminId, action, entityType, entityId, description);
  if (writer) { writer.set(reference, data); return reference; }
  return reference.set(data);
}
