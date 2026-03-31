import { describe, it, expect } from "vitest";
import { toSpeciesSlug, fromSpeciesSlug, proxyImageUrl, getIdentifyErrorMessage } from "./utils";

describe("toSpeciesSlug", () => {
  it("converts scientific name to slug", () => {
    expect(toSpeciesSlug("Parus major")).toBe("parus-major");
  });

  it("handles multiple spaces", () => {
    expect(toSpeciesSlug("Parus  major")).toBe("parus-major");
  });

  it("lowercases the name", () => {
    expect(toSpeciesSlug("PARUS MAJOR")).toBe("parus-major");
  });
});

describe("fromSpeciesSlug", () => {
  it("converts slug back to name", () => {
    expect(fromSpeciesSlug("parus-major")).toBe("parus major");
  });
});

describe("proxyImageUrl", () => {
  it("returns proxied URL for a valid URL", () => {
    expect(proxyImageUrl("https://upload.wikimedia.org/foo.jpg")).toBe(
      "/api/image-proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Ffoo.jpg",
    );
  });

  it("returns null for null input", () => {
    expect(proxyImageUrl(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(proxyImageUrl(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(proxyImageUrl("")).toBeNull();
  });
});

describe("getIdentifyErrorMessage", () => {
  it("returns Swedish rate limit message", () => {
    expect(getIdentifyErrorMessage(new Error("rate_limit"))).toBe(
      "AI-tjänsten är överbelastad just nu. Försök igen om en stund.",
    );
  });

  it("returns Swedish unavailable message", () => {
    expect(getIdentifyErrorMessage(new Error("ai_unavailable"))).toBe(
      "AI-tjänsten är inte tillgänglig just nu. Försök igen senare.",
    );
  });

  it("returns Swedish timeout message", () => {
    expect(getIdentifyErrorMessage(new Error("timeout"))).toBe(
      "Anslutningen tog för lång tid. Kontrollera din internetanslutning och försök igen.",
    );
  });

  it("returns generic Swedish message for unknown errors", () => {
    expect(getIdentifyErrorMessage(new Error("something"))).toBe(
      "Kunde inte identifiera fågeln. Försök igen.",
    );
  });

  it("returns generic message for non-Error values", () => {
    expect(getIdentifyErrorMessage("not an error")).toBe(
      "Kunde inte identifiera fågeln. Försök igen.",
    );
  });
});
