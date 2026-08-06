type ErrorWithCode = Error & { code?: unknown };

function safeError(error: unknown) {
  if (error instanceof Error) {
    const code = (error as ErrorWithCode).code;
    return {
      code: typeof code === "string" ? code : "unknown",
      message: error.message || "Unknown error",
    };
  }

  return { code: "unknown", message: "Unknown error" };
}

export function logProductionRouteError(route: string, status: number, error: unknown) {
  if (process.env.NODE_ENV !== "production") return;

  console.error("[production-route-error]", {
    route,
    status,
    error: safeError(error),
  });
}