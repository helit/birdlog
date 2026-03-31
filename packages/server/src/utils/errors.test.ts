import { describe, it, expect } from "vitest";
import { classifyIdentifyError } from "./errors.js";

describe("classifyIdentifyError", () => {
  it("returns rate_limit for rate limit errors", () => {
    expect(classifyIdentifyError(new Error("Rate limit exceeded"))).toEqual({
      status: 429,
      message: "rate_limit",
    });
    expect(classifyIdentifyError(new Error("429 Too Many Requests"))).toEqual({
      status: 429,
      message: "rate_limit",
    });
  });

  it("returns ai_unavailable for auth/billing errors", () => {
    expect(classifyIdentifyError(new Error("401 Unauthorized"))).toEqual({
      status: 502,
      message: "ai_unavailable",
    });
    expect(classifyIdentifyError(new Error("403 Forbidden"))).toEqual({
      status: 502,
      message: "ai_unavailable",
    });
    expect(classifyIdentifyError(new Error("Invalid API key"))).toEqual({
      status: 502,
      message: "ai_unavailable",
    });
    expect(classifyIdentifyError(new Error("insufficient_quota"))).toEqual({
      status: 502,
      message: "ai_unavailable",
    });
  });

  it("returns timeout for network errors", () => {
    expect(classifyIdentifyError(new Error("Request timeout"))).toEqual({
      status: 504,
      message: "timeout",
    });
    expect(classifyIdentifyError(new Error("ECONNREFUSED"))).toEqual({
      status: 504,
      message: "timeout",
    });
    expect(classifyIdentifyError(new Error("ENOTFOUND"))).toEqual({
      status: 504,
      message: "timeout",
    });
    expect(classifyIdentifyError(new Error("fetch failed"))).toEqual({
      status: 504,
      message: "timeout",
    });
  });

  it("returns unknown for unrecognized Error instances", () => {
    expect(classifyIdentifyError(new Error("something unexpected"))).toEqual({
      status: 500,
      message: "unknown",
    });
  });

  it("returns unknown for non-Error values", () => {
    expect(classifyIdentifyError("string error")).toEqual({
      status: 500,
      message: "unknown",
    });
    expect(classifyIdentifyError(null)).toEqual({
      status: 500,
      message: "unknown",
    });
    expect(classifyIdentifyError(undefined)).toEqual({
      status: 500,
      message: "unknown",
    });
    expect(classifyIdentifyError(42)).toEqual({
      status: 500,
      message: "unknown",
    });
  });
});
