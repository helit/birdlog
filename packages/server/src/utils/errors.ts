export function classifyIdentifyError(error: unknown): { status: number; message: string } {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // OpenAI rate limit (429)
    if (msg.includes("rate limit") || msg.includes("429")) {
      return { status: 429, message: "rate_limit" };
    }

    // OpenAI auth/billing issues (401/403)
    if (msg.includes("401") || msg.includes("403") || msg.includes("api key") || msg.includes("insufficient_quota")) {
      return { status: 502, message: "ai_unavailable" };
    }

    // Network/timeout
    if (msg.includes("timeout") || msg.includes("econnrefused") || msg.includes("enotfound") || msg.includes("fetch failed")) {
      return { status: 504, message: "timeout" };
    }
  }

  return { status: 500, message: "unknown" };
}
