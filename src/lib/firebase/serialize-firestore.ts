import { DocumentReference, Timestamp } from "@/lib/firebase/admin";

export function serializeFirestoreData(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof DocumentReference) return value.path;
  if (Array.isArray(value)) return value.map(serializeFirestoreData);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeFirestoreData(item)]));
}

export function serializeDocument(id: string, data: Record<string, unknown>) {
  return serializeFirestoreData({ ...data, id });
}
