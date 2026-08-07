import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

type RateLimitKind = "login" | "general";
type RateLimitResult =
  | { status: "allowed"; limit: number; remaining: number; reset: number }
  | { status: "blocked"; limit: number; remaining: number; reset: number }
  | { status: "unavailable" };

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const limiters = redis
  ? {
      login: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "jibli:rate-limit:login",
        timeout: 1_000,
      }),
      general: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "1 m"),
        prefix: "jibli:rate-limit:general",
        timeout: 1_000,
      }),
    }
  : null;

function getRequestIdentifier(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const netlifyIp = request.headers.get("x-nf-client-connection-ip")?.trim();
  const fallback = request.headers.get("x-real-ip")?.trim();
  return (netlifyIp || forwarded || fallback || "unknown").slice(0, 128);
}

function getRateLimitKind(request: NextRequest): RateLimitKind {
  const { pathname } = request.nextUrl;
  if (
    request.method === "POST" &&
    (pathname === "/api/auth/session" || pathname === "/api/auth/restaurant-session")
  ) {
    return "login";
  }

  return "general";
}

export async function checkApiRateLimit(request: NextRequest): Promise<RateLimitResult> {
  if (!limiters) {
    return process.env.NODE_ENV === "production"
      ? { status: "unavailable" }
      : { status: "allowed", limit: 0, remaining: 0, reset: 0 };
  }

  try {
    const kind = getRateLimitKind(request);
    const result = await limiters[kind].limit(`${kind}:${getRequestIdentifier(request)}`);

    if (result.reason === "timeout") {
      return { status: "unavailable" };
    }

    return {
      status: result.success ? "allowed" : "blocked",
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    return { status: "unavailable" };
  }
}