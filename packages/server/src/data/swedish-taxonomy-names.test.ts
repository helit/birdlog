import { describe, it, expect } from "vitest";
import data from "./swedish-taxonomy-names.json" with { type: "json" };

const SLUG_RE = /^[a-z0-9-]+$/;

describe("swedish-taxonomy-names.json", () => {
  it("has top-level `orders` and `families` objects", () => {
    expect(data).toHaveProperty("orders");
    expect(data).toHaveProperty("families");
    expect(typeof data.orders).toBe("object");
    expect(typeof data.families).toBe("object");
  });

  it("every order key is lowercase ASCII [a-z0-9-]+", () => {
    for (const key of Object.keys(data.orders)) {
      expect(key).toMatch(SLUG_RE);
    }
  });

  it("every family key is lowercase ASCII [a-z0-9-]+", () => {
    for (const key of Object.keys(data.families)) {
      expect(key).toMatch(SLUG_RE);
    }
  });

  it("every order has a non-empty sv name", () => {
    for (const [key, value] of Object.entries(data.orders)) {
      expect(typeof (value as { sv: string }).sv).toBe("string");
      expect((value as { sv: string }).sv.length, `orders.${key}.sv`).toBeGreaterThan(0);
    }
  });

  it("every family has a non-empty sv name", () => {
    for (const [key, value] of Object.entries(data.families)) {
      expect(typeof (value as { sv: string }).sv).toBe("string");
      expect((value as { sv: string }).sv.length, `families.${key}.sv`).toBeGreaterThan(0);
    }
  });

  it("includes the Passeriformes → Tättingar fallback", () => {
    expect(data.orders.passeriformes?.sv).toBe("Tättingar");
  });
});
