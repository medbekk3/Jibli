export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PushAuthError, requirePushUser } from "@/lib/firebase/push-auth";
import { logPushResult, sendPushToUser } from "@/lib/firebase/push-notifications";

export async function POST(request: NextRequest) {
  try { const user = await requirePushUser(request); const result = await sendPushToUser(user.uid, { notification: { title: "\u0625\u0634\u0639\u0627\u0631 \u062a\u062c\u0631\u064a\u0628\u064a \u0645\u0646 \u062c\u064a\u0628\u0644\u064a \ud83d\udd14", body: "\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u062a\u0639\u0645\u0644 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062c\u0647\u0627\u0632." }, data: { type: "push_test", orderId: "", orderNumber: "", url: user.role === "restaurant" ? "/restaurant-dashboard" : "/", status: "test" } }); logPushResult("push_test", result); return NextResponse.json({ success: true, data: { delivered: result.successCount, failed: result.failureCount } }); }
  catch (error) { if (error instanceof PushAuthError) return NextResponse.json({ success: false, error: { code: "PUSH_FORBIDDEN", message: error.message } }, { status: error.status }); return NextResponse.json({ success: false, error: { code: "PUSH_TEST_FAILED", message: "\u062a\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0625\u0634\u0639\u0627\u0631 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631." } }, { status: 500 }); }
}