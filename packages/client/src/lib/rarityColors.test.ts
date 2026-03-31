import { describe, it, expect } from "vitest";
import { rarityColors } from "./rarityColors";

describe("rarityColors", () => {
  it("has all expected rarity levels", () => {
    expect(Object.keys(rarityColors)).toEqual([
      "very_common",
      "common",
      "uncommon",
      "rare",
      "not_observed",
    ]);
  });

  it("each level has bg, text, and dot properties", () => {
    for (const [, colors] of Object.entries(rarityColors)) {
      expect(colors).toHaveProperty("bg");
      expect(colors).toHaveProperty("text");
      expect(colors).toHaveProperty("dot");
    }
  });

  it("uses distinct color families per level", () => {
    expect(rarityColors.very_common.bg).toContain("emerald");
    expect(rarityColors.common.bg).toContain("sky");
    expect(rarityColors.uncommon.bg).toContain("amber");
    expect(rarityColors.rare.bg).toContain("rose");
    expect(rarityColors.not_observed.bg).toContain("violet");
  });
});
