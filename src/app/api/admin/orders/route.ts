export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import{adminDb}from"@/lib/firebase/admin";import{adminFailure,adminSuccess,logAdminApiFailure}from"@/lib/firebase/admin-response";import{isAdminSessionError,requireActiveAdminSession}from"@/lib/firebase/admin-session";import{serializeDocument}from"@/lib/firebase/serialize-firestore";
export async function GET(){try{await requireActiveAdminSession();const s=await adminDb.collection("orders").orderBy("createdAt","desc").limit(5000).get();return adminSuccess(s.docs.map(d=>serializeDocument(d.id,d.data())))}catch(e){logAdminApiFailure("GET /api/admin/orders","القراءة",e);if(isAdminSessionError(e))return adminFailure(e.code,e.message,e.status);return adminFailure("ADMIN_OPERATION_FAILED","تعذر تحميل الطلبات.",500)}}
