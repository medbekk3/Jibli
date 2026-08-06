import { NextResponse } from "next/server";
import { adminApp, adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorDetails(error: unknown) {
  if (error instanceof Error) return { code: String((error as Error & { code?: unknown }).code ?? "unknown"), message: error.message };
  return { code: "unknown", message: "Unknown error" };
}

export async function GET() {
  let stage = "initializeApp";
  try {
    if (!adminApp) throw new Error("Firebase Admin app was not initialized");
    stage = "getAuth";
    if (!adminAuth) throw new Error("Firebase Admin Auth was not initialized");
    stage = "getFirestore";
    if (!adminDb) throw new Error("Firebase Admin Firestore was not initialized");
    stage = "adminAuth.listUsers";
    await adminAuth.listUsers(1);
    stage = "adminDb.restaurantsQuery";
    await adminDb.collection("restaurants").limit(1).get();
    return NextResponse.json({ success: true, adminInitialized: true, authReachable: true, firestoreReachable: true });
  } catch (error) {
    return NextResponse.json({ success: false, stage, ...errorDetails(error) }, { status: 500 });
  }
}