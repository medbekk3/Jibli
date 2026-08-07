export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { FieldValue, Timestamp, adminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";
import { normalizeCouponCode } from "@/lib/coupons/shared";

function validDate(value: unknown) { const date = new Date(String(value ?? "")); return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date); }
function number(value: unknown) { const result = Number(value); return Number.isFinite(result) && result >= 0 ? result : 0; }
function text(value: unknown, limit = 200) { return typeof value === "string" ? value.trim().slice(0, limit) : ""; }
function array(value: unknown) { return Array.isArray(value) ? [...new Set(value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean))].slice(0, 200) : []; }

export async function GET() {
  try { await requireActiveAdminSession(); const snapshot = await adminDb.collection("discountCoupons").get(); return adminSuccess(snapshot.docs.map((document) => serializeDocument(document.id, document.data()))); }
  catch (error) { logAdminApiFailure("GET /api/admin/coupons", "القراءة", error); if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status); return adminFailure("ADMIN_OPERATION_FAILED", "تعذر تحميل الكوبونات.", 500); }
}
export async function POST(request: Request) {
  try {
    await requireActiveAdminSession();
    const body = await request.json() as Record<string, unknown>;
    const code = normalizeCouponCode(body.code); const startDate = validDate(body.startDate); const endDate = validDate(body.endDate);
    const type = body.type === "fixed" ? "fixed" : "percentage";
    if (!code || !text(body.title) || !startDate || !endDate || startDate.toMillis() > endDate.toMillis()) return adminFailure("INVALID_FORM_DATA", "بيانات الكوبون غير صالحة.", 400);
    if (type === "percentage" && (number(body.percentage) <= 0 || number(body.percentage) > 100)) return adminFailure("INVALID_FORM_DATA", "نسبة الخصم يجب أن تكون بين 1 و100.", 400);
    if (type === "fixed" && number(body.fixedAmount) <= 0) return adminFailure("INVALID_FORM_DATA", "مبلغ الخصم مطلوب.", 400);
    if (body.isGlobal !== true && !text(body.restaurantId, 128)) return adminFailure("INVALID_FORM_DATA", "اختر مطعماً أو فعّل الكوبون العام.", 400);
    if (!(await adminDb.collection("discountCoupons").where("code", "==", code).limit(1).get()).empty) return adminFailure("INVALID_FORM_DATA", "كود الكوبون مستخدم مسبقاً.", 409);
    const ref = adminDb.collection("discountCoupons").doc();
    await ref.set({ id: ref.id, code, title: text(body.title), description: text(body.description, 500), type, percentage: type === "percentage" ? number(body.percentage) : 0, fixedAmount: type === "fixed" ? number(body.fixedAmount) : 0, minimumOrder: number(body.minimumOrder), maximumDiscount: number(body.maximumDiscount), restaurantId: body.isGlobal === true ? "" : text(body.restaurantId, 128), isGlobal: body.isGlobal === true, usageLimit: Math.floor(number(body.usageLimit)), usedCount: 0, oneTimePerUser: body.oneTimePerUser === true, allowedUsers: array(body.allowedUsers), isActive: body.isActive !== false, startDate, endDate, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return adminSuccess({ id: ref.id }, 201);
  } catch (error) { logAdminApiFailure("POST /api/admin/coupons", "الإنشاء", error); if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status); return adminFailure("ADMIN_OPERATION_FAILED", "تعذر إنشاء الكوبون.", 500); }
}
