import { NextResponse } from "next/server";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { code: string; message: string } };
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json<ApiFailure>({ success: false, error: { code, message } }, { status });
}

export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const body = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !body || body.success !== true) {
    const failure = body?.success === false ? body.error : null;
    throw new ApiClientError(response.status, failure?.code ?? "API_REQUEST_FAILED", failure?.message ?? fallbackMessage);
  }
  return body.data;
}
