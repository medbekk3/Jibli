export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";
export async function GET() { try { const snapshot = await adminDb.collection("deliveryZones").where("isActive", "==", true).get(); const zones = snapshot.docs.map((doc) => serializeDocument(doc.id, doc.data()) as {sortOrder?:unknown;name?:unknown}).sort((a,b)=>Number(a.sortOrder??0)-Number(b.sortOrder??0)||String(a.name).localeCompare(String(b.name),"ar")); return NextResponse.json({success:true,data:{zones}}); } catch(error) { console.error("[GET /api/delivery-zones]",{code:error instanceof Error?(error as Error&{code?:string}).code??"unknown":"unknown",message:error instanceof Error?error.message:"خطأ غير معروف"}); return NextResponse.json({success:false,error:{code:"DELIVERY_ZONES_LOAD_FAILED",message:"تعذر تحميل أحياء التوصيل."}},{status:500}); } }