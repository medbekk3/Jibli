import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { PushAuthError, requirePushUser } from "@/lib/firebase/push-auth";
import { pushTokenHash } from "@/lib/firebase/push-notifications";

export async function DELETE(request: NextRequest) {
  try { const user = await requirePushUser(request); const body = await request.json() as Record<string, unknown>; const token = typeof body.token === "string" ? body.token.trim() : ""; if (!token) return NextResponse.json({ success: true, data: { enabled: false } }); const reference = getAdminDb().collection("pushTokens").doc(pushTokenHash(token)); const snapshot = await reference.get(); if (snapshot.exists && snapshot.data()?.userId === user.uid) await reference.set({ enabled: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); return NextResponse.json({ success: true, data: { enabled: false } }); }
  catch (error) { if (error instanceof PushAuthError) return NextResponse.json({ success: false, error: { code: "PUSH_FORBIDDEN", message: error.message } }, { status: error.status }); return NextResponse.json({ success: false, error: { code: "PUSH_UNREGISTER_FAILED", message: "\u062a\u0639\u0630\u0631 \u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a." } }, { status: 500 }); }
}