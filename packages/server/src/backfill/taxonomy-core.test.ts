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
  it("returns null when the species has no taxonId in Artdatabanken", async () => {
    const result = await resolveSpeciesTaxonomy("Fakus nonexistens", {
      findTaxonId: vi.fn().mockResolvedValue(null),
      getParents: vi.fn(),
      fallback: mockFallback,
    });
    expect(result).toBeNull();
  });

  it("returns the payload from Artdatabanken when vernacular is present", async () => {
    const result = await resolveSpeciesTaxonomy("Parus major", {
      findTaxonId: vi.fn().mockResolvedValue(267169),
      getParents: vi.fn().mockResolvedValue({
        family: { taxonId: 1, scientificName: "Paridae", vernacularName: "Mesar" },
        order: { taxonId: 2, scientificName: "Passeriformes", vernacularName: "Tättingar" },
      }),
      fallback: mockFallback,
    });

    expect(result).toEqual({
      familyScientific: "Paridae",
      orderScientific: "Passeriformes",
      order: "Tättingar",
    });
  });

  it("falls back to static JSON when Artdatabanken has no Swedish order name", async () => {
    const result = await resolveSpeciesTaxonomy("Parus major", {
      findTaxonId: vi.fn().mockResolvedValue(267169),
      getParents: vi.fn().mockResolvedValue({
        family: { taxonId: 1, scientificName: "Paridae", vernacularName: null },
        order: { taxonId: 2, scientificName: "Passeriformes", vernacularName: null },
      }),
      fallback: mockFallback,
    });

    expect(result).toEqual({
      familyScientific: "Paridae",
      orderScientific: "Passeriformes",
      order: "Tättingar",
    });
  });

  it("leaves order null when neither Artdatabanken nor fallback has a Swedish name", async () => {
    const result = await resolveSpeciesTaxonomy("Parus major", {
      findTaxonId: vi.fn().mockResolvedValue(267169),
      getParents: vi.fn().mockResolvedValue({
        family: { taxonId: 1, scientificName: "Unknownidae", vernacularName: null },
        order: { taxonId: 2, scientificName: "Unknowniformes", vernacularName: null },
      }),
      fallback: mockFallback,
    });

    expect(result).toEqual({
      familyScientific: "Unknownidae",
      orderScientific: "Unknowniformes",
      order: null,
    });
  });

  it("returns null family/order scientific names when parents are missing", async () => {
    const result = await resolveSpeciesTaxonomy("Parus major", {
      findTaxonId: vi.fn().mockResolvedValue(267169),
      getParents: vi.fn().mockResolvedValue({ family: null, order: null }),
      fallback: mockFallback,
    });

    expect(result).toEqual({
      familyScientific: null,
      orderScientific: null,
      order: null,
    });
  });

  it("matches fallback keys case-insensitively via scientific-name slug", async () => {
    const result = await resolveSpeciesTaxonomy("Parus major", {
      findTaxonId: vi.fn().mockResolvedValue(267169),
      getParents: vi.fn().mockResolvedValue({
        family: { taxonId: 1, scientificName: "PARIDAE", vernacularName: null },
        order: { taxonId: 2, scientificName: "PASSERIFORMES", vernacularName: null },
      }),
      fallback: mockFallback,
    });

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
        findTaxonId: vi.fn().mockResolvedValue(267169),
        getParents: vi.fn().mockResolvedValue({
          family: { taxonId: 1, scientificName: "Paridae", vernacularName: "Mesar" },
          order: { taxonId: 2, scientificName: "Passeriformes", vernacularName: "Tättingar" },
        }),
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

  it("returns { resolved: false } without calling updateSpecies when taxonId not found", async () => {
    const updateSpecies = vi.fn();
    const result = await processSpeciesBackfill(
      { id: "a", scientificName: "Fakus nonexistens" },
      {
        findTaxonId: vi.fn().mockResolvedValue(null),
        getParents: vi.fn(),
        fallback: mockFallback,
        updateSpecies,
        logger: silentLogger,
      },
    );

    expect(updateSpecies).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "a", order: null, resolved: false });
  });

  it("catches errors from the Artdatabanken calls and logs them instead of rejecting", async () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const result = await processSpeciesBackfill(
      { id: "a", scientificName: "Parus major" },
      {
        findTaxonId: vi.fn().mockRejectedValue(new Error("rate limited")),
        getParents: vi.fn(),
        fallback: mockFallback,
        updateSpecies: vi.fn(),
        logger,
      },
    );

    expect(result).toEqual({ id: "a", order: null, resolved: false });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("catches errors from updateSpecies itself", async () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const result = await processSpeciesBackfill(
      { id: "a", scientificName: "Parus major" },
      {
        findTaxonId: vi.fn().mockResolvedValue(267169),
        getParents: vi.fn().mockResolvedValue({
          family: { taxonId: 1, scientificName: "Paridae", vernacularName: "Mesar" },
          order: { taxonId: 2, scientificName: "Passeriformes", vernacularName: "Tättingar" },
        }),
        fallback: mockFallback,
        updateSpecies: vi.fn().mockRejectedValue(new Error("DB down")),
        logger,
      },
    );

    expect(result).toEqual({ id: "a", order: null, resolved: false });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
