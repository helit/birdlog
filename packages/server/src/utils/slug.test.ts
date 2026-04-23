import { describe, it, expect } from "vitest";
import { scientificToSlug } from "./slug.js";

describe("scientificToSlug", () => {
  it("lowercases a single-word scientific name", () => {
    expect(scientificToSlug("Passeriformes")).toBe("passeriformes");
  });

  it("replaces spaces with dashes for binomials", () => {
    expect(scientificToSlug("Motacilla alba")).toBe("motacilla-alba");
  });

  it("collapses repeated whitespace to a single dash", () => {
    expect(scientificToSlug("Parus   major")).toBe("parus-major");
  });

  it("trims leading and trailing whitespace", () => {
    expect(scientificToSlug("  Paridae  ")).toBe("paridae");
  });

  it("strips non-ASCII letters", () => {
    expect(scientificToSlug("Motacillidæ")).toBe("motacillid");
  });

  it("leaves already-ASCII lowercase names unchanged", () => {
    expect(scientificToSlug("paridae")).toBe("paridae");
  });

  it("drops characters that are not letters, digits, dashes, or whitespace", () => {
    expect(scientificToSlug("Parus (major)")).toBe("parus-major");
  });
});
