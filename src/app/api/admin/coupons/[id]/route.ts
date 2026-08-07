export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { FieldValue, Timestamp, adminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";
import { normalizeCouponCode } from "@/lib/coupons/shared";

const date = (value: unknown) => { const parsed = new Date(String(value ?? "")); return Number.isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed); };
const number = (value: unknown) => { const result = Number(value); return Number.isFinite(result) && result >= 0 ? result : 0; };
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireActiveAdminSession(); const { id } = await params; const body = await request.json() as Record<string, unknown>; const existing = await adminDb.collection("discountCoupons").doc(id).get();
    if (!existing.exists) return adminFailure("INVALID_FORM_DATA", "الكوبون غير موجود.", 404);
    const code = normalizeCouponCode(body.code); const startDate = date(body.startDate); const endDate = date(body.endDate); const type = body.type === "fixed" ? "fixed" : "percentage";
    if (!code || !String(body.title ?? "").trim() || !startDate || !endDate || startDate.toMillis() > endDate.toMillis()) return adminFailure("INVALID_FORM_DATA", "بيانات الكوبون غير صالحة.", 400);
    if (type === "percentage" && (number(body.percentage) <= 0 || number(body.percentage) > 100)) return adminFailure("INVALID_FORM_DATA", "نسبة الخصم يجب أن تكون بين 1 و100.", 400);
    if (type === "fixed" && number(body.fixedAmount) <= 0) return adminFailure("INVALID_FORM_DATA", "مبلغ الخصم مطلوب.", 400);
    const same = await adminDb.collection("discountCoupons").where("code", "==", code).limit(2).get(); if (same.docs.some((document) => document.id !== id)) return adminFailure("INVALID_FORM_DATA", "كود الكوبون مستخدم مسبقاً.", 409);
    const allowedUsers = Array.isArray(body.allowedUsers) ? [...new Set(body.allowedUsers.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean))].slice(0, 200) : [];
    await existing.ref.update({ code, title: String(body.title).trim().slice(0, 200), description: String(body.description ?? "").trim().slice(0, 500), type, percentage: type === "percentage" ? number(body.percentage) : 0, fixedAmount: type === "fixed" ? number(body.fixedAmount) : 0, minimumOrder: number(body.minimumOrder), maximumDiscount: number(body.maximumDiscount), restaurantId: body.isGlobal === true ? "" : String(body.restaurantId ?? "").trim().slice(0, 128), isGlobal: body.isGlobal === true, usageLimit: Math.floor(number(body.usageLimit)), oneTimePerUser: body.oneTimePerUser === true, allowedUsers, isActive: body.isActive !== false, startDate, endDate, updatedAt: FieldValue.serverTimestamp() });
    return adminSuccess({ id });
  } catch (error) { logAdminApiFailure("PATCH /api/admin/coupons/[id]", "التحديث", error); if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status); return adminFailure("ADMIN_OPERATION_FAILED", "تعذر تعديل الكوبون.", 500); }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireActiveAdminSession(); const { id } = await params; await adminDb.collection("discountCoupons").doc(id).delete(); return adminSuccess({ id }); }
  catch (error) { logAdminApiFailure("DELETE /api/admin/coupons/[id]", "الحذف", error); if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status); return adminFailure("ADMIN_OPERATION_FAILED", "تعذر حذف الكوبون.", 500); }
}
