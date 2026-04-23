import { describe, it, expect } from "vitest";
import { normalizeForSearch } from "./normalize.js";

describe("normalizeForSearch", () => {
  it("strips Swedish diacritics and lowercases", () => {
    expect(normalizeForSearch("Blåmes")).toBe("blames");
  });

  it("handles multi-word strings and multiple diacritics", () => {
    expect(normalizeForSearch("Östlig törnskata")).toBe("ostlig tornskata");
  });

  it("leaves already-ASCII lowercase input unchanged", () => {
    expect(normalizeForSearch("parus major")).toBe("parus major");
  });

  it("is case-insensitive on ASCII letters", () => {
    expect(normalizeForSearch("Parus Major")).toBe("parus major");
  });

  it("preserves non-letter characters", () => {
    expect(normalizeForSearch("Blå-mes")).toBe("bla-mes");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeForSearch("")).toBe("");
  });
});
