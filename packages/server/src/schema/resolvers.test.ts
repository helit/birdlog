import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock artdatabanken module before importing resolvers
vi.mock("../services/artdatabanken.js", () => ({
  getAreaDistribution: vi.fn(),
  calculateSpeciesRarity: vi.fn(),
  getWikipediaSummary: vi.fn(),
  getWikimediaImage: vi.fn().mockResolvedValue(null),
  clearDistributionCache: vi.fn(),
}));

// Shared mocks so both test code and resolvers see the same Prisma instance
const { speciesFindManyMock, speciesFindFirstMock, speciesFindUniqueMock } = vi.hoisted(() => ({
  speciesFindManyMock: vi.fn(),
  speciesFindFirstMock: vi.fn(),
  speciesFindUniqueMock: vi.fn(),
}));

// Mock Prisma
vi.mock("@prisma/client", () => {
  function PrismaClient() {
    return {
      species: { findMany: speciesFindManyMock, findFirst: speciesFindFirstMock, findUnique: speciesFindUniqueMock, update: vi.fn(), create: vi.fn() },
      sighting: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
      user: { findUnique: vi.fn(), create: vi.fn() },
    };
  }
  return { PrismaClient };
});

const FAKE_DISTRIBUTION = {
  entries: [
    { taxonId: 1, scientificName: "Parus major", vernacularName: "talgoxe", observationCount: 50 },
    { taxonId: 2, scientificName: "Cyanistes caeruleus", vernacularName: "blåmes", observationCount: 40 },
    { taxonId: 3, scientificName: "Fringilla coelebs", vernacularName: "bofink", observationCount: 30 },
    { taxonId: 4, scientificName: "Erithacus rubecula", vernacularName: "rödhake", observationCount: 5 },
    { taxonId: 5, scientificName: "Turdus merula", vernacularName: "koltrast", observationCount: 4 },
    { taxonId: 6, scientificName: "Sitta europaea", vernacularName: "nötväcka", observationCount: 3 },
  ],
  totalSpecies: 6,
  fetchedAt: Date.now(),
};

const COORDS = { latitude: 59.3, longitude: 18.0 };

describe("nearbyBirds resolver — force flag", () => {
  let resolvers: typeof import("./resolvers.js")["resolvers"];
  let getAreaDistribution: ReturnType<typeof vi.fn>;
  let clearDistributionCache: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const artdatabanken = await import("../services/artdatabanken.js");
    getAreaDistribution = artdatabanken.getAreaDistribution as ReturnType<typeof vi.fn>;
    clearDistributionCache = artdatabanken.clearDistributionCache as ReturnType<typeof vi.fn>;
    getAreaDistribution.mockResolvedValue(FAKE_DISTRIBUTION);
    clearDistributionCache.mockResolvedValue(undefined);

    const mod = await import("./resolvers.js");
    resolvers = mod.resolvers;
  });

  it("returns cached result without calling getAreaDistribution on second call (no force)", async () => {
    // Warm the cache
    await resolvers.Query.nearbyBirds(undefined, COORDS);
    getAreaDistribution.mockClear();

    // Second call without force — should use cache
    await resolvers.Query.nearbyBirds(undefined, COORDS);
    expect(getAreaDistribution).not.toHaveBeenCalled();
  });

  it("calls getAreaDistribution when force: true even with a populated cache", async () => {
    // Warm the cache
    await resolvers.Query.nearbyBirds(undefined, COORDS);
    getAreaDistribution.mockClear();

    // Call with force: true — must bypass cache
    await resolvers.Query.nearbyBirds(undefined, { ...COORDS, force: true });
    expect(getAreaDistribution).toHaveBeenCalledOnce();
  });

  it("calls clearDistributionCache before getAreaDistribution when force: true", async () => {
    const callOrder: string[] = [];
    clearDistributionCache.mockImplementation(async () => { callOrder.push("clear"); });
    getAreaDistribution.mockImplementation(async () => { callOrder.push("fetch"); return FAKE_DISTRIBUTION; });

    await resolvers.Query.nearbyBirds(undefined, { ...COORDS, force: true });

    expect(callOrder).toEqual(["clear", "fetch"]);
  });
});

// --- Task 7: Fågelbok resolvers ---

interface SpeciesRow {
  id: string;
  swedishName: string;
  scientificName: string;
  englishName: string | null;
  family: string | null;
  description: string | null;
  imageUrl: string | null;
  order: string | null;
  orderScientific: string | null;
  familyScientific: string | null;
}

function speciesRow(partial: Partial<SpeciesRow> & { id: string; swedishName: string; scientificName: string }): SpeciesRow {
  return {
    englishName: null,
    family: null,
    description: null,
    imageUrl: null,
    order: null,
    orderScientific: null,
    familyScientific: null,
    ...partial,
  };
}

describe("allOrders resolver", () => {
  let resolvers: typeof import("./resolvers.js")["resolvers"];
  const findMany = speciesFindManyMock;

  beforeEach(async () => {
    vi.resetModules();
    findMany.mockReset();
    const mod = await import("./resolvers.js");
    resolvers = mod.resolvers;
  });

  it("returns distinct orders sorted by Swedish name, nulls last", async () => {
    findMany.mockResolvedValue([
      speciesRow({ id: "a", swedishName: "X", scientificName: "X x", order: "Tättingar", orderScientific: "Passeriformes" }),
      speciesRow({ id: "b", swedishName: "Y", scientificName: "Y y", order: null, orderScientific: "Zeroiformes" }),
      speciesRow({ id: "c", swedishName: "Z", scientificName: "Z z", order: "Andfåglar", orderScientific: "Anseriformes" }),
      speciesRow({ id: "d", swedishName: "W", scientificName: "W w", order: "Tättingar", orderScientific: "Passeriformes" }),
    ]);

    const result = await resolvers.Query.allOrders();

    expect(result.map((r) => r.scientificName)).toEqual(["Anseriformes", "Passeriformes", "Zeroiformes"]);
    expect(result[0].swedishName).toBe("Andfåglar");
    expect(result[2].swedishName).toBeNull();
    expect(result[0].slug).toBe("anseriformes");
  });

  it("returns [] when no species have an orderScientific", async () => {
    findMany.mockResolvedValue([]);
    const result = await resolvers.Query.allOrders();
    expect(result).toEqual([]);
  });

  it("projects only order + orderScientific columns", async () => {
    findMany.mockResolvedValue([]);
    await resolvers.Query.allOrders();
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderScientific: { not: null } },
        select: { order: true, orderScientific: true },
      }),
    );
  });

  it("prefers non-null Swedish name when rows collide on orderScientific", async () => {
    findMany.mockResolvedValue([
      speciesRow({ id: "a", swedishName: "X", scientificName: "X x", order: null, orderScientific: "Passeriformes" }),
      speciesRow({ id: "b", swedishName: "Y", scientificName: "Y y", order: "Tättingar", orderScientific: "Passeriformes" }),
    ]);
    const result = await resolvers.Query.allOrders();
    expect(result).toHaveLength(1);
    expect(result[0].swedishName).toBe("Tättingar");
  });
});

describe("order(slug) resolver", () => {
  let resolvers: typeof import("./resolvers.js")["resolvers"];
  const findMany = speciesFindManyMock;

  beforeEach(async () => {
    vi.resetModules();
    findMany.mockReset();
    const mod = await import("./resolvers.js");
    resolvers = mod.resolvers;
  });

  it("returns null for an unknown slug", async () => {
    findMany.mockResolvedValue([]);
    const result = await resolvers.Query.order(undefined, { slug: "nonexistentes" });
    expect(result).toBeNull();
  });

  it("returns families sorted by Swedish name with order link", async () => {
    findMany.mockResolvedValue([
      speciesRow({ id: "a", swedishName: "X", scientificName: "Parus major", order: "Tättingar", orderScientific: "Passeriformes", family: "Mesar", familyScientific: "Paridae" }),
      speciesRow({ id: "b", swedishName: "Y", scientificName: "Fringilla coelebs", order: "Tättingar", orderScientific: "Passeriformes", family: "Finkar", familyScientific: "Fringillidae" }),
      speciesRow({ id: "c", swedishName: "Z", scientificName: "Parus ater", order: "Tättingar", orderScientific: "Passeriformes", family: "Mesar", familyScientific: "Paridae" }),
    ]);

    const result = await resolvers.Query.order(undefined, { slug: "passeriformes" });

    expect(result).not.toBeNull();
    expect(result!.order.scientificName).toBe("Passeriformes");
    expect(result!.order.swedishName).toBe("Tättingar");
    expect(result!.families.map((f) => f.scientificName)).toEqual(["Fringillidae", "Paridae"]);
    expect(result!.families[0].order.scientificName).toBe("Passeriformes");
  });

  it("queries families scoped to the matched orderScientific (uses index)", async () => {
    findMany.mockResolvedValue([
      speciesRow({ id: "a", swedishName: "X", scientificName: "Parus major", order: "Tättingar", orderScientific: "Passeriformes", family: "Mesar", familyScientific: "Paridae" }),
    ]);

    await resolvers.Query.order(undefined, { slug: "passeriformes" });

    // Step 2 call must scope by the resolved scientific order, not scan all rows
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          orderScientific: "Passeriformes",
          familyScientific: { not: null },
        },
        select: { family: true, familyScientific: true },
      }),
    );
  });
});

describe("family(slug) resolver", () => {
  let resolvers: typeof import("./resolvers.js")["resolvers"];
  const findMany = speciesFindManyMock;

  beforeEach(async () => {
    vi.resetModules();
    findMany.mockReset();
    const mod = await import("./resolvers.js");
    resolvers = mod.resolvers;
  });

  it("returns null for an unknown slug", async () => {
    findMany.mockResolvedValue([]);
    const result = await resolvers.Query.family(undefined, { slug: "unknownidae" });
    expect(result).toBeNull();
  });

  it("returns species sorted by Swedish name with family + parent order", async () => {
    findMany.mockResolvedValue([
      speciesRow({ id: "a", swedishName: "Talgoxe", scientificName: "Parus major", order: "Tättingar", orderScientific: "Passeriformes", family: "Mesar", familyScientific: "Paridae" }),
      speciesRow({ id: "b", swedishName: "Blåmes", scientificName: "Cyanistes caeruleus", order: "Tättingar", orderScientific: "Passeriformes", family: "Mesar", familyScientific: "Paridae" }),
      speciesRow({ id: "c", swedishName: "Entita", scientificName: "Poecile palustris", order: "Tättingar", orderScientific: "Passeriformes", family: "Mesar", familyScientific: "Paridae" }),
    ]);

    const result = await resolvers.Query.family(undefined, { slug: "paridae" });

    expect(result).not.toBeNull();
    expect(result!.family.scientificName).toBe("Paridae");
    expect(result!.family.swedishName).toBe("Mesar");
    expect(result!.family.order.scientificName).toBe("Passeriformes");
    expect(result!.species.map((s) => s.swedishName)).toEqual(["Blåmes", "Entita", "Talgoxe"]);
  });

  it("queries species scoped to the matched familyScientific (uses index)", async () => {
    findMany.mockResolvedValue([
      speciesRow({ id: "a", swedishName: "Talgoxe", scientificName: "Parus major", order: "Tättingar", orderScientific: "Passeriformes", family: "Mesar", familyScientific: "Paridae" }),
    ]);

    await resolvers.Query.family(undefined, { slug: "paridae" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyScientific: "Paridae" },
      }),
    );
  });

  it("prefers non-null Swedish family + order names when rows collide", async () => {
    findMany.mockResolvedValue([
      speciesRow({ id: "a", swedishName: "Talgoxe", scientificName: "Parus major", order: null, orderScientific: "Passeriformes", family: null, familyScientific: "Paridae" }),
      speciesRow({ id: "b", swedishName: "Blåmes", scientificName: "Cyanistes caeruleus", order: "Tättingar", orderScientific: "Passeriformes", family: "Mesar", familyScientific: "Paridae" }),
    ]);

    const result = await resolvers.Query.family(undefined, { slug: "paridae" });

    expect(result!.family.swedishName).toBe("Mesar");
    expect(result!.family.order.swedishName).toBe("Tättingar");
  });
});

describe("speciesSearch resolver", () => {
  let resolvers: typeof import("./resolvers.js")["resolvers"];
  const findMany = speciesFindManyMock;

  beforeEach(async () => {
    vi.resetModules();
    findMany.mockReset();
    const mod = await import("./resolvers.js");
    resolvers = mod.resolvers;
  });

  it("returns [] for empty query", async () => {
    const result = await resolvers.Query.speciesSearch(undefined, { query: "" });
    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns [] for whitespace-only query", async () => {
    const result = await resolvers.Query.speciesSearch(undefined, { query: "   " });
    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns Blåmes when searching 'blåmes'", async () => {
    const blamesRow = speciesRow({ id: "a", swedishName: "Blåmes", scientificName: "Cyanistes caeruleus" });
    findMany.mockImplementation(async ({ where }: { where: { OR?: unknown[] } }) => {
      // First call: coarse ILIKE with OR clauses
      if (where?.OR) return [blamesRow];
      return [];
    });

    const result = await resolvers.Query.speciesSearch(undefined, { query: "blåmes" });
    expect(result.map((r) => r.swedishName)).toContain("Blåmes");
  });

  it("returns Blåmes when searching 'blames' (accent-stripped fallback)", async () => {
    const blamesRow = speciesRow({ id: "a", swedishName: "Blåmes", scientificName: "Cyanistes caeruleus" });
    const otherRow = speciesRow({ id: "b", swedishName: "Talgoxe", scientificName: "Parus major" });

    findMany.mockImplementation(async ({ where }: { where: { OR?: unknown[] } }) => {
      // Coarse fetch: 0 matches for "blames" (Postgres ILIKE doesn't strip diacritics)
      if (where?.OR) return [];
      // Fallback: all species loaded and JS-filtered
      return [blamesRow, otherRow];
    });

    const result = await resolvers.Query.speciesSearch(undefined, { query: "blames" });
    expect(result.map((r) => r.swedishName)).toContain("Blåmes");
    expect(result.map((r) => r.swedishName)).not.toContain("Talgoxe");
  });

  it("limits results to 100", async () => {
    const rows = Array.from({ length: 150 }, (_, i) =>
      speciesRow({ id: `id-${i}`, swedishName: `Bird ${i}`, scientificName: `Sci ${i}` }),
    );
    findMany.mockImplementation(async ({ where }: { where: { OR?: unknown[] } }) => {
      if (where?.OR) return rows;
      return rows;
    });
    const result = await resolvers.Query.speciesSearch(undefined, { query: "Bird" });
    expect(result.length).toBe(100);
  });

  it("narrows the fallback findMany select to id + swedishName + scientificName", async () => {
    findMany.mockImplementation(async ({ where }: { where?: { OR?: unknown[] } }) => {
      if (where?.OR) return []; // force fallback path
      return [];
    });
    await resolvers.Query.speciesSearch(undefined, { query: "zzz" });
    // Second call is the fallback — must include a narrow select, no full row shape
    expect(findMany).toHaveBeenCalledWith({
      select: { id: true, swedishName: true, scientificName: true },
    });
  });
});
