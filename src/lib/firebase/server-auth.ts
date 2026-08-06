import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "./admin";

export async function requireServerUser(request: NextRequest, role: "customer" | "restaurant" | "admin") {
  const header = request.headers.get("authorization"); if (!header?.startsWith("Bearer ")) return { error: NextResponse.json({ success: false, error: { code: "CUSTOMER_UNAUTHORIZED", message: "يجب تسجيل الدخول بحساب زبون." } }, { status: 401 }) };
  try { const token = await adminAuth.verifyIdToken(header.slice(7)); const snapshot = await adminDb.collection("users").doc(token.uid).get(); const profile = snapshot.data(); if (!snapshot.exists || profile?.role !== role || profile?.status !== "active") return { error: NextResponse.json({ success: false, error: { code: "CUSTOMER_UNAUTHORIZED", message: "يجب تسجيل الدخول بحساب زبون نشط." } }, { status: 403 }) }; return { uid: token.uid, profile: profile! }; }
  catch { return { error: NextResponse.json({ success: false, error: { code: "CUSTOMER_UNAUTHORIZED", message: "انتهت صلاحية تسجيل الدخول، أعد المحاولة." } }, { status: 401 }) }; }
}
