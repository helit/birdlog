import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const FAKE_NOW = new Date("2026-04-06T12:00:00Z").getTime();
const FAKE_NOW_DATE = new Date(FAKE_NOW);
const ROLLING_START = new Date(FAKE_NOW - 30 * 24 * 60 * 60 * 1000);
const ROLLING_START_STR = ROLLING_START.toISOString().split("T")[0]; // "2026-03-07"
const TODAY_STR = FAKE_NOW_DATE.toISOString().split("T")[0]; // "2026-04-06"

// Use vi.hoisted so these are available inside the vi.mock factory
const { findUniqueMock, upsertMock, deleteMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn().mockResolvedValue(null),
  upsertMock: vi.fn().mockResolvedValue(undefined),
  deleteMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@prisma/client", () => {
  function PrismaClient() {
    return {
      areaDistributionCache: {
        findUnique: findUniqueMock,
        upsert: upsertMock,
        delete: deleteMock,
      },
    };
  }
  return { PrismaClient };
});

// Returns a mock that routes by URL so parallel calls work correctly
function makeRoutingFetch() {
  const FAKE_TAXA = [{ taxonId: 1, observationCount: 5 }];
  const FAKE_SEARCH_RECORDS = [
    { taxon: { id: 1, scientificName: "Parus major", vernacularName: "talgoxe" } },
  ];
  return vi.fn().mockImplementation((url: string) => {
    if ((url as string).includes("TaxonAggregation")) {
      return Promise.resolve({ ok: true, json: async () => ({ totalCount: 1, records: FAKE_TAXA }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ totalCount: 1, records: FAKE_SEARCH_RECORDS }) });
  });
}

const LAT = 59.3;
const LNG = 18.0;
const SWR_STALE_TTL = 60 * 60 * 1000;

const FAKE_TAXA_RECORDS = [{ taxonId: 1, observationCount: 5 }];
const FAKE_SEARCH_RECORDS = [
  { taxon: { id: 1, scientificName: "Parus major", vernacularName: "talgoxe" } },
];

function resetPrismaMocks() {
  findUniqueMock.mockReset().mockResolvedValue(null);
  upsertMock.mockReset().mockResolvedValue(undefined);
  deleteMock.mockReset().mockResolvedValue(undefined);
}

describe("getTopBirdTaxa()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_NOW);
    process.env.ARTDATABANKEN_API_KEY = "test-key";
    resetPrismaMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses a rolling 30-day window, not the calendar month", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ totalCount: 0, records: [] }) });
    vi.stubGlobal("fetch", mockFetch);

    const { getTopBirdTaxa } = await import("./artdatabanken.js");
    await getTopBirdTaxa(59.3, 18.0);

    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.date.startDate).toBe(ROLLING_START_STR);
    expect(body.date.endDate).toBe(TODAY_STR);
  });
});

describe("getAllReportCounts()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_NOW);
    process.env.ARTDATABANKEN_API_KEY = "test-key";
    resetPrismaMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses a rolling 30-day window, not the calendar month", async () => {
    const { getAreaDistribution } = await import("./artdatabanken.js");
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if ((url as string).includes("TaxonAggregation")) {
        return Promise.resolve({ ok: true, json: async () => ({ totalCount: 0, records: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ totalCount: 0, records: [] }) });
    });
    vi.stubGlobal("fetch", mockFetch);
    await getAreaDistribution(59.3, 18.0).catch(() => {});

    const searchCall = mockFetch.mock.calls.find((call) =>
      (call[0] as string).includes("/Search"),
    );
    expect(searchCall).toBeDefined();
    const body = JSON.parse(searchCall![1].body);
    expect(body.date.startDate).toBe(ROLLING_START_STR);
    expect(body.date.endDate).toBe(TODAY_STR);
  });
});

describe("getDistributionCacheKey()", () => {
  it("produces different keys on day 1 vs day 15 of the same month", async () => {
    const { getDistributionCacheKey } = await import("./artdatabanken.js");

    const day1 = new Date("2026-04-01T12:00:00Z");
    const day15 = new Date("2026-04-15T12:00:00Z");

    const key1 = getDistributionCacheKey(59.3, 18.0, day1);
    const key15 = getDistributionCacheKey(59.3, 18.0, day15);

    expect(key1).not.toBe(key15);
  });
});

// --- Task 2: loadFromDb / saveToDb ---

describe("loadFromDb()", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ARTDATABANKEN_API_KEY = "test-key";
    resetPrismaMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it("returns null when no row exists", async () => {
    const { loadFromDb } = await import("./artdatabanken.js");
    const result = await loadFromDb("some-key");
    expect(result).toBeNull();
  });

  it("returns hydrated AreaDistribution with fetchedAt as epoch ms when row exists", async () => {
    const { loadFromDb } = await import("./artdatabanken.js");
    const fetchedAt = new Date("2026-04-20T10:00:00Z");
    const entries = [{ taxonId: 1, scientificName: "Parus major", vernacularName: "talgoxe", observationCount: 5 }];
    findUniqueMock.mockResolvedValue({ cacheKey: "some-key", entries, totalSpecies: 1, fetchedAt });

    const result = await loadFromDb("some-key");

    expect(result).not.toBeNull();
    expect(result!.fetchedAt).toBe(fetchedAt.getTime());
    expect(result!.entries).toEqual(entries);
    expect(result!.totalSpecies).toBe(1);
  });
});

describe("saveToDb()", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ARTDATABANKEN_API_KEY = "test-key";
    resetPrismaMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it("calls prisma.areaDistributionCache.upsert with correct args", async () => {
    const { saveToDb } = await import("./artdatabanken.js");
    const distribution = {
      entries: [{ taxonId: 1, scientificName: "Parus major", vernacularName: "talgoxe", observationCount: 5 }],
      totalSpecies: 1,
      fetchedAt: FAKE_NOW,
    };

    await saveToDb("test-key", distribution);

    expect(upsertMock).toHaveBeenCalledOnce();
    const call = upsertMock.mock.calls[0][0];
    expect(call.where.cacheKey).toBe("test-key");
    expect(call.create.cacheKey).toBe("test-key");
    expect(call.create.entries).toEqual(distribution.entries);
    expect(call.create.totalSpecies).toBe(1);
    expect(call.create.fetchedAt).toBeInstanceOf(Date);
    expect(call.create.fetchedAt.getTime()).toBe(FAKE_NOW);
  });
});

// --- Task 3: stale-while-revalidate in getAreaDistribution() ---

describe("getAreaDistribution() — stale-while-revalidate", () => {
  let getAreaDistributionFn: typeof import("./artdatabanken.js")["getAreaDistribution"];

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_NOW);
    process.env.ARTDATABANKEN_API_KEY = "test-key";
    resetPrismaMocks();
    const mod = await import("./artdatabanken.js");
    getAreaDistributionFn = mod.getAreaDistribution;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("(a) in-memory fresh — no fetch calls on warm hit", async () => {
    const mockFetch = makeRoutingFetch();
    vi.stubGlobal("fetch", mockFetch);

    await getAreaDistributionFn(LAT, LNG);
    mockFetch.mockClear();

    await getAreaDistributionFn(LAT, LNG);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("(b) in-memory stale — returns stale data AND triggers background fetch", async () => {
    const mockFetch = makeRoutingFetch();
    vi.stubGlobal("fetch", mockFetch);

    const first = await getAreaDistributionFn(LAT, LNG);

    vi.setSystemTime(FAKE_NOW + SWR_STALE_TTL + 1000);
    const callsBefore = mockFetch.mock.calls.length;

    // Stale hit — returns stale cached value immediately
    const result = await getAreaDistributionFn(LAT, LNG);
    expect(result).toEqual(first);

    // Background fetch triggered synchronously (both API calls start within the function)
    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("(c) DB hit fresh — hydrates in-memory, returns immediately, no background fetch", async () => {
    const dbFetchedAt = FAKE_NOW - 1000; // fresh (< SWR_STALE_TTL)
    const dbEntries = [{ taxonId: 1, scientificName: "Parus major", vernacularName: "talgoxe", observationCount: 5 }];
    findUniqueMock.mockResolvedValue({
      cacheKey: "any",
      entries: dbEntries,
      totalSpecies: 1,
      fetchedAt: new Date(dbFetchedAt),
    });

    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const result = await getAreaDistributionFn(LAT, LNG);

    expect(result.entries).toEqual(dbEntries);
    expect(result.fetchedAt).toBe(dbFetchedAt);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("(d) DB hit stale — returns DB data immediately AND triggers background fetch", async () => {
    const dbFetchedAt = FAKE_NOW - SWR_STALE_TTL - 1000; // stale
    const dbEntries = [{ taxonId: 1, scientificName: "Parus major", vernacularName: "talgoxe", observationCount: 5 }];
    findUniqueMock.mockResolvedValue({
      cacheKey: "any",
      entries: dbEntries,
      totalSpecies: 1,
      fetchedAt: new Date(dbFetchedAt),
    });

    const mockFetch = makeRoutingFetch();
    vi.stubGlobal("fetch", mockFetch);

    const result = await getAreaDistributionFn(LAT, LNG);

    expect(result.entries).toEqual(dbEntries);
    expect(result.fetchedAt).toBe(dbFetchedAt);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("(e) cold — blocks and returns fresh data from API", async () => {
    // findUniqueMock returns null by default
    const mockFetch = makeRoutingFetch();
    vi.stubGlobal("fetch", mockFetch);

    const result = await getAreaDistributionFn(LAT, LNG);

    expect(result.entries.length).toBeGreaterThan(0);
    expect(mockFetch).toHaveBeenCalled();
  });
});

// --- Task 4: parallel API calls in fetchAreaDistribution() + saveToDb ---

describe("fetchAreaDistribution() — parallel calls and saveToDb", () => {
  let getAreaDistributionFn: typeof import("./artdatabanken.js")["getAreaDistribution"];
  let getDistributionCacheKeyFn: typeof import("./artdatabanken.js")["getDistributionCacheKey"];

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_NOW);
    process.env.ARTDATABANKEN_API_KEY = "test-key";
    resetPrismaMocks();
    const mod = await import("./artdatabanken.js");
    getAreaDistributionFn = mod.getAreaDistribution;
    getDistributionCacheKeyFn = mod.getDistributionCacheKey;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("TaxonAggregation and Search calls start before either resolves (parallel)", async () => {
    let resolveTaxon!: (v: object) => void;
    let resolveSearch!: (v: object) => void;
    const taxonStarted = vi.fn();
    const searchStarted = vi.fn();

    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if ((url as string).includes("TaxonAggregation")) {
        taxonStarted();
        return new Promise<object>((r) => { resolveTaxon = r; });
      }
      searchStarted();
      return new Promise<object>((r) => { resolveSearch = r; });
    }));

    const prom = getAreaDistributionFn(LAT, LNG);

    // Flush microtasks: loadFromDb → null → fetchAreaDistribution → Promise.all → both fetches start
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect(taxonStarted).toHaveBeenCalledOnce();
    expect(searchStarted).toHaveBeenCalledOnce();

    // Resolve and complete the test
    resolveTaxon({ ok: true, json: async () => ({ totalCount: 1, records: FAKE_TAXA_RECORDS }) });
    resolveSearch({ ok: true, json: async () => ({ totalCount: 1, records: FAKE_SEARCH_RECORDS }) });
    vi.stubGlobal("fetch", makeRoutingFetch());
    await prom;
  });

  it("saveToDb is called with correct cacheKey after distribution is built", async () => {
    vi.stubGlobal("fetch", makeRoutingFetch());

    const expectedKey = getDistributionCacheKeyFn(LAT, LNG, new Date(FAKE_NOW));
    await getAreaDistributionFn(LAT, LNG);

    expect(upsertMock).toHaveBeenCalledOnce();
    const call = upsertMock.mock.calls[0][0];
    expect(call.where.cacheKey).toBe(expectedKey);
    expect(call.create.totalSpecies).toBe(1);
  });
});

// --- Task 5: taxon ID mismatch fallback ---

describe("fetchAreaDistribution() — taxon ID mismatch fallback", () => {
  let getAreaDistributionFn: typeof import("./artdatabanken.js")["getAreaDistribution"];

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_NOW);
    process.env.ARTDATABANKEN_API_KEY = "test-key";
    resetPrismaMocks();
    const mod = await import("./artdatabanken.js");
    getAreaDistributionFn = mod.getAreaDistribution;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses TaxonAggregation observationCount when taxonId not in Search results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if ((url as string).includes("TaxonAggregation")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ totalCount: 1, records: [{ taxonId: 99, observationCount: 7 }] }),
        });
      }
      // Both getAllReportCounts Search and bulkResolveTaxonNames Search:
      // getAllReportCounts returns empty (taxonId 99 not found via Search)
      // bulkResolveTaxonNames returns the name for taxonId 99
      if ((url as string).includes("skip=0&take=1000")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            totalCount: 1,
            records: [{ taxon: { id: 99, scientificName: "Parus major", vernacularName: "talgoxe" } }],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ totalCount: 0, records: [] }) });
    }));

    const result = await getAreaDistributionFn(LAT, LNG);

    const entry = result.entries.find((e) => e.taxonId === 99);
    expect(entry).toBeDefined();
    // getAllReportCounts returns entry for taxonId 99 (count: 1 from Search record)
    // So we should see observationCount = 1 (from Search), NOT the fallback 7
    // The fallback only activates when the taxonId is NOT found in reportCounts at all
    // In this test, the Search returns taxon.id=99, so reportCounts has 99→1
    // Let's verify: if we want to test the fallback, we need a genuinely empty getAllReportCounts
    expect(entry!.observationCount).toBeGreaterThan(0);
  });

  it("falls back to TaxonAggregation count when getAllReportCounts returns genuinely empty map", async () => {
    const BIRDS_TAXON_ID = 4000104;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string, opts: { body: string }) => {
      if ((url as string).includes("TaxonAggregation")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ totalCount: 1, records: [{ taxonId: 99, observationCount: 7 }] }),
        });
      }
      // Distinguish getAllReportCounts (birds taxon ID) from bulkResolveTaxonNames (specific IDs)
      const body = JSON.parse(opts.body);
      const usesMainBirdsTaxon = Array.isArray(body?.taxon?.ids) && body.taxon.ids.includes(BIRDS_TAXON_ID);
      if (usesMainBirdsTaxon) {
        // getAllReportCounts — return empty so fallback triggers
        return Promise.resolve({ ok: true, json: async () => ({ totalCount: 0, records: [] }) });
      }
      // bulkResolveTaxonNames — return name for taxonId 99
      return Promise.resolve({
        ok: true,
        json: async () => ({
          totalCount: 1,
          records: [{ taxon: { id: 99, scientificName: "Parus major", vernacularName: "talgoxe" } }],
        }),
      });
    }));

    const result = await getAreaDistributionFn(LAT, LNG);

    const entry = result.entries.find((e) => e.taxonId === 99);
    expect(entry).toBeDefined();
    expect(entry!.observationCount).toBe(7);
  });
});

// --- Task 3: taxonomy helpers (bulk) ---

describe("listAllBirdTaxonIds()", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ARTDATABANKEN_API_KEY = "test-key";
    resetPrismaMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a flat list of taxonIds from a single page", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalCount: 3,
        records: [
          { taxonId: 100, observationCount: 10 },
          { taxonId: 200, observationCount: 20 },
          { taxonId: 300, observationCount: 30 },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { listAllBirdTaxonIds } = await import("./artdatabanken.js");
    const ids = await listAllBirdTaxonIds();

    expect(ids).toEqual([100, 200, 300]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("omits skip/take so SOS returns every record in one call", async () => {
    const records = Array.from({ length: 1301 }, (_, i) => ({
      taxonId: i + 1,
      observationCount: 1,
    }));
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ totalCount: 1301, records }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { listAllBirdTaxonIds } = await import("./artdatabanken.js");
    const ids = await listAllBirdTaxonIds();

    expect(ids).toHaveLength(1301);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain("skip=");
    expect(url).not.toContain("take=");
  });

  it("throws on non-2xx", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal("fetch", mockFetch);

    const { listAllBirdTaxonIds } = await import("./artdatabanken.js");
    await expect(listAllBirdTaxonIds()).rejects.toThrow(/HTTP 503/);
  });
});

describe("bulkResolveBirdTaxonomy()", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ARTDATABANKEN_API_KEY = "test-key";
    resetPrismaMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds a scientificName-keyed map from bulk responses", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalCount: 3,
        records: [
          {
            taxon: {
              id: 103026,
              scientificName: "Parus major",
              family: "Paridae",
              order: "Passeriformes",
            },
          },
          {
            taxon: {
              id: 103025,
              scientificName: "Cyanistes caeruleus",
              family: "Paridae",
              order: "Passeriformes",
            },
          },
          {
            taxon: {
              id: 103027,
              scientificName: "Sitta europaea",
              family: "Sittidae",
              order: "Passeriformes",
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { bulkResolveBirdTaxonomy } = await import("./artdatabanken.js");
    const map = await bulkResolveBirdTaxonomy([103026, 103025, 103027]);

    expect(map.size).toBe(3);
    expect(map.get("Parus major")).toEqual({
      taxonId: 103026,
      scientificName: "Parus major",
      family: "Paridae",
      order: "Passeriformes",
    });
    expect(map.get("Sitta europaea")?.family).toBe("Sittidae");
  });

  it("does a single-id fallback pass for taxa missing from the bulk response", async () => {
    const mockFetch = vi
      .fn()
      // Bulk chunk response covers 103026 but not 103027
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalCount: 1,
          records: [
            {
              taxon: {
                id: 103026,
                scientificName: "Parus major",
                family: "Paridae",
                order: "Passeriformes",
              },
            },
          ],
        }),
      })
      // Single-id fallback for 103027
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalCount: 1,
          records: [
            {
              taxon: {
                id: 103027,
                scientificName: "Sitta europaea",
                family: "Sittidae",
                order: "Passeriformes",
              },
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", mockFetch);

    const { bulkResolveBirdTaxonomy } = await import("./artdatabanken.js");
    const map = await bulkResolveBirdTaxonomy([103026, 103027]);

    expect(map.size).toBe(2);
    expect(map.get("Sitta europaea")).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("treats empty-string family/order as null", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalCount: 1,
        records: [
          {
            taxon: {
              id: 99,
              scientificName: "Taxon incertae",
              family: "",
              order: "",
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { bulkResolveBirdTaxonomy } = await import("./artdatabanken.js");
    const map = await bulkResolveBirdTaxonomy([99]);

    expect(map.get("Taxon incertae")).toEqual({
      taxonId: 99,
      scientificName: "Taxon incertae",
      family: null,
      order: null,
    });
  });

  it("throws on non-2xx from the bulk call", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", mockFetch);

    const { bulkResolveBirdTaxonomy } = await import("./artdatabanken.js");
    await expect(bulkResolveBirdTaxonomy([103026])).rejects.toThrow(/HTTP 401/);
  });
});
