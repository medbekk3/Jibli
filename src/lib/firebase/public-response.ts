import { NextResponse } from "next/server";

export function publicSuccess<T>(data: T, status = 200) { return NextResponse.json({ success: true, data }, { status, headers: { "Cache-Control": "no-store" } }); }
export function publicFailure(code: string, message: string, status: number) { return NextResponse.json({ success: false, error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } }); }
export function logPublicFailure(api: string, error: unknown, context: Record<string, string> = {}) { const details = error instanceof Error ? { code: (error as Error & { code?: string }).code ?? "unknown", message: error.message } : { code: "unknown", message: "خطأ غير معروف" }; console.error("[الواجهة العامة] فشل الطلب", { api, ...context, errorCode: details.code, errorMessage: details.message }); }
