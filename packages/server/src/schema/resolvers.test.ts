import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock artdatabanken module before importing resolvers
vi.mock("../services/artdatabanken.js", () => ({
  getAreaDistribution: vi.fn(),
  calculateSpeciesRarity: vi.fn(),
  getWikipediaSummary: vi.fn(),
  getWikimediaImage: vi.fn().mockResolvedValue(null),
  clearDistributionCache: vi.fn(),
}));

// Mock Prisma
vi.mock("@prisma/client", () => {
  function PrismaClient() {
    return {
      species: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
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
    clearDistributionCache.mockImplementation(() => {});

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
    clearDistributionCache.mockImplementation(() => { callOrder.push("clear"); });
    getAreaDistribution.mockImplementation(async () => { callOrder.push("fetch"); return FAKE_DISTRIBUTION; });

    await resolvers.Query.nearbyBirds(undefined, { ...COORDS, force: true });

    expect(callOrder).toEqual(["clear", "fetch"]);
  });
});
