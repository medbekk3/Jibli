export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "@/lib/firebase/admin";
import { adminDb } from "@/lib/firebase/admin";
import { PushAuthError, requirePushUser } from "@/lib/firebase/push-auth";
import { pushTokenHash } from "@/lib/firebase/push-notifications";

export async function POST(request: NextRequest) {
  try {
    const user = await requirePushUser(request); const body = await request.json() as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token.trim() : ""; const platform = body.platform === "web" ? "web" : "";
    if (!token || token.length > 4096 || !platform) return NextResponse.json({ success: false, error: { code: "INVALID_PUSH_TOKEN", message: "\u0631\u0645\u0632 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u063a\u064a\u0631 \u0635\u0627\u0644\u062d." } }, { status: 400 });
    const hash = pushTokenHash(token); const database = adminDb; const reference = database.collection("pushTokens").doc(hash);
    await database.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference); const data = existing.data();
      if (existing.exists && data?.userId && data.userId !== user.uid && data.enabled === true) throw new PushAuthError(409, "\u0647\u0630\u0627 \u0627\u0644\u062c\u0647\u0627\u0632 \u0645\u0631\u062a\u0628\u0637 \u0628\u062d\u0633\u0627\u0628 \u0622\u062e\u0631. \u0633\u062c\u0651\u0644 \u0627\u0644\u062e\u0631\u0648\u062c \u0645\u0646\u0647 \u0623\u0648\u0644\u0627\u064b.");
      const now = FieldValue.serverTimestamp(); transaction.set(reference, { userId: user.uid, token, tokenHash: hash, role: user.role, platform, userAgent: request.headers.get("user-agent")?.slice(0, 240) ?? "", enabled: true, createdAt: existing.exists ? data?.createdAt ?? now : now, updatedAt: now, lastSeenAt: now }, { merge: true });
    });
    return NextResponse.json({ success: true, data: { enabled: true } });
  } catch (error) { if (error instanceof PushAuthError) return NextResponse.json({ success: false, error: { code: "PUSH_FORBIDDEN", message: error.message } }, { status: error.status }); return NextResponse.json({ success: false, error: { code: "PUSH_REGISTER_FAILED", message: "\u062a\u0639\u0630\u0631 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a." } }, { status: 500 }); }
}