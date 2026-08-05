import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "./admin";
import type { UserRole } from "@/types/auth";

export class PushAuthError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function requirePushUser(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new PushAuthError(401, "\u0627\u0646\u062a\u0647\u062a \u062c\u0644\u0633\u0629 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644.");
  let uid = "";
  try { uid = (await getAdminAuth().verifyIdToken(header.slice(7))).uid; }
  catch { throw new PushAuthError(401, "\u0627\u0646\u062a\u0647\u062a \u062c\u0644\u0633\u0629 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644."); }
  const snapshot = await getAdminDb().collection("users").doc(uid).get();
  const profile = snapshot.data();
  if (!snapshot.exists || profile?.status !== "active" || !["customer", "restaurant", "admin"].includes(String(profile.role))) throw new PushAuthError(403, "\u0627\u0644\u062d\u0633\u0627\u0628 \u063a\u064a\u0631 \u0645\u062e\u0648\u0644 \u0644\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a.");
  return { uid, role: profile.role as UserRole };
}