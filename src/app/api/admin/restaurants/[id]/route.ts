export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { FieldValue } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { addAdminActivity } from "@/lib/firebase/admin-activity";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";

const allowedFields = new Set(["name","description","phone","address","logoUrl","logoPublicId","coverUrl","coverPublicId","deliveryTime","deliveryFee","minimumOrder","workingHours","isOpen","isActive","isFeatured","displayOrder"]);

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireActiveAdminSession();
    const { id } = await params; const db = adminDb; const snapshot = await db.collection("restaurants").doc(id).get();
    if (!snapshot.exists) return adminFailure("INVALID_FORM_DATA", "المطعم غير موجود.", 404);
    const data = snapshot.data() ?? {}; const ownerId = typeof data.ownerId === "string" ? data.ownerId : "";
    const [owner, products] = await Promise.all([ownerId ? db.collection("users").doc(ownerId).get() : null, db.collection("products").where("restaurantId", "==", id).get()]);
    return adminSuccess(serializeDocument(id, { ...data, name:data.name??"",description:data.description??"",phone:data.phone??"",address:data.address??"",logoUrl:data.logoUrl??"",logoPublicId:data.logoPublicId??"",coverUrl:data.coverUrl??"",coverPublicId:data.coverPublicId??"",deliveryTime:data.deliveryTime??"",deliveryFee:Number(data.deliveryFee)||0,minimumOrder:Number(data.minimumOrder)||0,workingHours:data.workingHours??"",isOpen:data.isOpen??false,isActive:data.isActive??false,isFeatured:data.isFeatured??false,displayOrder:Number(data.displayOrder)||0,createdAt:data.createdAt??null,updatedAt:data.updatedAt??null,owner: owner?.exists ? { uid: owner.id, ...owner.data() } : null, productsCount: products.size }));
  } catch (error) {
    logAdminApiFailure("GET /api/admin/restaurants/[id]", "تحميل تفاصيل المطعم", error);
    if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status);
    return adminFailure("RESTAURANTS_LOAD_FAILED", "تعذر تحميل بيانات المطعم.", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireActiveAdminSession();
    const { id } = await params; const raw = await request.json() as Record<string, unknown>;
    const updates = Object.fromEntries(Object.entries(raw).filter(([key, value]) => allowedFields.has(key) && value !== undefined));
    if (!Object.keys(updates).length) return adminFailure("INVALID_FORM_DATA", "لا توجد بيانات صالحة للتحديث.", 400);
    const db = adminDb; const ref = db.collection("restaurants").doc(id); const snapshot = await ref.get();
    if (!snapshot.exists) return adminFailure("INVALID_FORM_DATA", "المطعم غير موجود.", 404);
    const batch = db.batch(); batch.update(ref, { ...updates, updatedAt: FieldValue.serverTimestamp() });
    const ownerId = snapshot.data()?.ownerId;
    if (typeof updates.isActive === "boolean" && typeof ownerId === "string" && ownerId) {
      batch.update(db.collection("users").doc(ownerId), { status: updates.isActive ? "active" : "suspended", updatedAt: FieldValue.serverTimestamp() });
    }
    addAdminActivity(db, admin.uid, "update", "restaurant", id, typeof updates.isActive === "boolean" ? (updates.isActive ? "تفعيل المطعم وحسابه" : "توقيف المطعم وحسابه") : "تعديل بيانات المطعم", batch);
    await batch.commit(); return adminSuccess({ id, message: "تم تحديث المطعم." });
  } catch (error) {
    logAdminApiFailure("PATCH /api/admin/restaurants/[id]", "تحديث المطعم وحساب مالكه", error);
    if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status);
    return adminFailure("ADMIN_OPERATION_FAILED", "تعذر تحديث المطعم.", 500);
  }
}
