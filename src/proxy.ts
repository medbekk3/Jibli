import { NextResponse, type NextRequest } from "next/server";
import { checkApiRateLimit } from "@/lib/api/rate-limit";

const rateLimitMessage = "تم تجاوز الحد المسموح، حاول لاحقاً.";

export async function proxy(request: NextRequest) {
  const result = await checkApiRateLimit(request);

  if (result.status === "unavailable") {
    return NextResponse.json(
      { success: false, message: "تعذر التحقق من الحد المسموح للطلبات." },
      { status: 503 },
    );
  }

  if (result.status === "blocked") {
    const response = NextResponse.json(
      { success: false, message: rateLimitMessage },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))));
    response.headers.set("X-RateLimit-Limit", String(result.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    return response;
  }

  const response = NextResponse.next();
  if (result.limit > 0) {
    response.headers.set("X-RateLimit-Limit", String(result.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};