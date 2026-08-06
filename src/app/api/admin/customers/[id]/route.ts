export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { adminFailure,adminSuccess,logAdminApiFailure } from "@/lib/firebase/admin-response";
import { isAdminSessionError,requireActiveAdminSession } from "@/lib/firebase/admin-session";
import { serializeFirestoreData } from "@/lib/firebase/serialize-firestore";
export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requireActiveAdminSession();const{id}=await params;const db=adminDb;const [snapshot,orders]=await Promise.all([db.collection("users").doc(id).get(),db.collection("orders").where("customerId","==",id).limit(5000).get()]);const value=snapshot.data();if(!snapshot.exists||value?.role!=="customer")return adminSuccess({customer:null});const rows=orders.docs.map(doc=>doc.data());const delivered=rows.filter(order=>order.status==="delivered");const latest=[...rows].sort((a,b)=>String(b.createdAt??"").localeCompare(String(a.createdAt??"")))[0];return adminSuccess({customer:serializeFirestoreData({uid:id,firstName:value.firstName??"",lastName:value.lastName??"",fullName:value.fullName??"",email:value.email??"",phone:value.phone??"",role:"customer",status:value.status??"active",createdAt:value.createdAt??null,updatedAt:value.updatedAt??null,lastLoginAt:value.lastLoginAt??null,ordersCount:rows.length,totalSpent:delivered.reduce((sum,order)=>sum+(Number(order.total)||0),0),lastOrderAt:latest?.createdAt??null})})}catch(error){logAdminApiFailure("GET /api/admin/customers/[id]","تحميل تفاصيل الزبون",error);if(isAdminSessionError(error))return adminFailure(error.code,error.message,error.status);return adminFailure("CUSTOMERS_LOAD_FAILED","تعذر تحميل بيانات الزبون.",500)}}
