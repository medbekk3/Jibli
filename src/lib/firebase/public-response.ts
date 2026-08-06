import { NextResponse } from "next/server";

import { logProductionRouteError } from "@/lib/api/production-route-log";

export function publicSuccess<T>(data: T, status = 200) { return NextResponse.json({ success: true, data }, { status, headers: { "Cache-Control": "no-store" } }); }
export function publicFailure(code: string, message: string, status: number) { return NextResponse.json({ success: false, error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } }); }
export function logPublicFailure(route: string, error: unknown, _context: Record<string, string> = {}, status = 500) { void _context; logProductionRouteError(route, status, error); }