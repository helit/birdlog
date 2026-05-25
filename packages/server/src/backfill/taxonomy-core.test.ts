import { describe, it, expect, vi } from "vitest";
import { resolveSpeciesTaxonomy, processSpeciesBackfill } from "./taxonomy-core.js";

const mockFallback = {
  orders: {
    passeriformes: { sv: "Tättingar" },
  },
  families: {
    paridae: { sv: "Mesar" },
  },
};

describe("resolveSpeciesTaxonomy", () => {
  it("returns null when the entry is undefined (not found in the lookup map)", () => {
    expect(resolveSpeciesTaxonomy(undefined, mockFallback)).toBeNull();
  });

  it("maps family and order scientific names into the payload", () => {
    const result = resolveSpeciesTaxonomy(
      { family: "Paridae", order: "Passeriformes" },
      mockFallback,
    );
    expect(result).toEqual({
      familyScientific: "Paridae",
      orderScientific: "Passeriformes",
      order: "Tättingar",
    });
  });

  it("applies the static fallback for the Swedish order name", () => {
    const result = resolveSpeciesTaxonomy(
      { family: "Paridae", order: "Passeriformes" },
      { orders: { passeriformes: { sv: "Tättingar" } }, families: {} },
    );
    expect(result?.order).toBe("Tättingar");
  });

  it("leaves order null when the scientific order is absent from the fallback", () => {
    const result = resolveSpeciesTaxonomy(
      { family: "Unknownidae", order: "Unknowniformes" },
      mockFallback,
    );
    expect(result).toEqual({
      familyScientific: "Unknownidae",
      orderScientific: "Unknowniformes",
      order: null,
    });
  });

  it("returns null-valued scientific names when the entry has them", () => {
    const result = resolveSpeciesTaxonomy(
      { family: null, order: null },
      mockFallback,
    );
    expect(result).toEqual({
      familyScientific: null,
      orderScientific: null,
      order: null,
    });
  });

  it("matches fallback keys case-insensitively via the scientific-name slug", () => {
    const result = resolveSpeciesTaxonomy(
      { family: "PARIDAE", order: "PASSERIFORMES" },
      mockFallback,
    );
    expect(result?.order).toBe("Tättingar");
  });
});

describe("processSpeciesBackfill", () => {
  const silentLogger = { warn: () => {}, error: () => {} };

  it("calls updateSpecies with the resolved payload on success", async () => {
    const updateSpecies = vi.fn().mockResolvedValue(undefined);
    const result = await processSpeciesBackfill(
      { id: "a", scientificName: "Parus major" },
      {
        lookup: () => ({ family: "Paridae", order: "Passeriformes" }),
        fallback: mockFallback,
        updateSpecies,
        logger: silentLogger,
      },
    );

    expect(updateSpecies).toHaveBeenCalledWith("a", {
      familyScientific: "Paridae",
      orderScientific: "Passeriformes",
      order: "Tättingar",
    });
    expect(result).toEqual({ id: "a", order: "Tättingar", resolved: true });
  });

  it("returns { resolved: false } without calling updateSpecies when the lookup misses", async () => {
    const updateSpecies = vi.fn();
    const result = await processSpeciesBackfill(
      { id: "a", scientificName: "Fakus nonexistens" },
      {
        lookup: () => undefined,
        fallback: mockFallback,
        updateSpecies,
        logger: silentLogger,
      },
    );

    expect(updateSpecies).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "a", order: null, resolved: false });
  });

  it("catches errors from updateSpecies and logs them instead of rejecting", async () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const result = await processSpeciesBackfill(
      { id: "a", scientificName: "Parus major" },
      {
        lookup: () => ({ family: "Paridae", order: "Passeriformes" }),
        fallback: mockFallback,
        updateSpecies: vi.fn().mockRejectedValue(new Error("DB down")),
        logger,
      },
    );

    expect(result).toEqual({ id: "a", order: null, resolved: false });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
