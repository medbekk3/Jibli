export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { FieldValue } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { addAdminActivity } from "@/lib/firebase/admin-activity";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const bool = (value: unknown, fallback = false) => typeof value === "boolean" ? value : fallback;

export async function GET() {
  try {
    await requireActiveAdminSession();
    const db = adminDb;
    const snapshot = await db.collection("restaurants").get();
    const rows = await Promise.all(snapshot.docs.map(async (document) => {
      const value = document.data();
      const ownerId = text(value.ownerId);
      const [owner, products] = await Promise.all([
        ownerId ? db.collection("users").doc(ownerId).get() : null,
        db.collection("products").where("restaurantId", "==", document.id).get(),
      ]);
      return serializeDocument(document.id, {
        ...value, name: text(value.name), description: text(value.description), phone: text(value.phone), address: text(value.address), ownerId,
        logoUrl: text(value.logoUrl), logoPublicId: text(value.logoPublicId), coverUrl: text(value.coverUrl), coverPublicId: text(value.coverPublicId),
        deliveryTime: text(value.deliveryTime), deliveryFee: number(value.deliveryFee), minimumOrder: number(value.minimumOrder), workingHours: text(value.workingHours),
        isActive: bool(value.isActive), isOpen: bool(value.isOpen), isFeatured: bool(value.isFeatured),
        displayOrder: number(value.displayOrder), createdAt: value.createdAt ?? null, updatedAt: value.updatedAt ?? null,
        owner: owner?.exists ? { uid: owner.id, ...owner.data() } : null,
        productsCount: products.size,
      });
    }));
    return adminSuccess(rows);
  } catch (error) {
    logAdminApiFailure("GET /api/admin/restaurants", "قراءة المطاعم وملاكها", error);
    if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status);
    return adminFailure("RESTAURANTS_LOAD_FAILED", "تعذر تحميل المطاعم.", 500);
  }
}

export async function POST(request: NextRequest) {
  let createdUid = "";
  let stage = "التحقق من الجلسة";
  try {
    const admin = await requireActiveAdminSession();
    stage = "قراءة وتنظيف البيانات";
    const payload = await request.json() as { account?: Record<string, unknown>; restaurant?: Record<string, unknown> };
    const account = payload.account ?? {};
    const restaurant = payload.restaurant ?? {};
    const firstName = text(account.firstName); const lastName = text(account.lastName);
    const email = text(account.email).toLowerCase(); const phone = text(account.phone); const password = text(account.password);
    const name = text(restaurant.name);
    if (!firstName || !lastName || !email || !phone || password.length < 6 || !name) {
      return adminFailure("INVALID_FORM_DATA", "بيانات الحساب أو المطعم غير مكتملة.", 400);
    }
    stage = "إنشاء حساب Authentication";
    const authUser = await adminAuth.createUser({ email, password, displayName: `${firstName} ${lastName}` });
    createdUid = authUser.uid;
    stage = "إنشاء وثيقتي المستخدم والمطعم";
    const db = adminDb; const restaurantRef = db.collection("restaurants").doc(); const batch = db.batch();
    const now = FieldValue.serverTimestamp(); const isActive = bool(restaurant.isActive, true);
    batch.set(db.collection("users").doc(createdUid), {
      uid: createdUid, firstName, lastName, fullName: `${firstName} ${lastName}`, email, phone,
      role: "restaurant", status: isActive ? "active" : "suspended", createdAt: now, updatedAt: now,
    });
    batch.set(restaurantRef, {
      ownerId: createdUid, name, description: text(restaurant.description), phone: text(restaurant.phone),
      address: text(restaurant.address), logoUrl: text(restaurant.logoUrl), logoPublicId: text(restaurant.logoPublicId),
      coverUrl: text(restaurant.coverUrl), coverPublicId: text(restaurant.coverPublicId), deliveryTime: text(restaurant.deliveryTime),
      deliveryFee: number(restaurant.deliveryFee), minimumOrder: number(restaurant.minimumOrder), workingHours: text(restaurant.workingHours),
      isOpen: bool(restaurant.isOpen, true), isActive, isFeatured: bool(restaurant.isFeatured), displayOrder: number(restaurant.displayOrder),
      createdAt: now, updatedAt: now,
    });
    addAdminActivity(db, admin.uid, "create", "restaurant", restaurantRef.id, `إضافة المطعم: ${name}`, batch);
    await batch.commit();
    console.info("[إنشاء مطعم] اكتملت العملية", { restaurantId: restaurantRef.id, ownerId: createdUid });
    return adminSuccess({ restaurantId: restaurantRef.id, ownerId: createdUid, email }, 201);
  } catch (error) {
    logAdminApiFailure("POST /api/admin/restaurants", stage, error);
    if (createdUid) await adminAuth.deleteUser(createdUid).catch((rollbackError) => logAdminApiFailure("POST /api/admin/restaurants", "التراجع عن حساب Authentication", rollbackError));
    if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status);
    const code = (error as { code?: string }).code;
    if (code === "auth/email-already-exists") return adminFailure("INVALID_FORM_DATA", "البريد الإلكتروني مستعمل من قبل.", 400);
    return adminFailure("RESTAURANT_CREATE_FAILED", "تعذر إنشاء حساب المطعم كاملاً.", 500);
  }
}
