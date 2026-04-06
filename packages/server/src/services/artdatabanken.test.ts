import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test the exported functions that construct date ranges.
// fetch is mocked to capture the request body so we can assert on the dates sent.

const FAKE_NOW = new Date("2026-04-06T12:00:00Z").getTime();
const FAKE_NOW_DATE = new Date(FAKE_NOW);
const ROLLING_START = new Date(FAKE_NOW - 30 * 24 * 60 * 60 * 1000);
const ROLLING_START_STR = ROLLING_START.toISOString().split("T")[0]; // "2026-03-07"
const TODAY_STR = FAKE_NOW_DATE.toISOString().split("T")[0]; // "2026-04-06"

function makeFetchOk(body: object) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  });
}

describe("getTopBirdTaxa()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_NOW);
    process.env.ARTDATABANKEN_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses a rolling 30-day window, not the calendar month", async () => {
    const mockFetch = makeFetchOk({ totalCount: 0, records: [] });
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
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses a rolling 30-day window, not the calendar month", async () => {
    // getAllReportCounts is not exported — test via getAreaDistribution which calls it.
    // Instead, we expose it indirectly by intercepting fetch and checking the Search body.
    const mockFetch = vi.fn()
      // First call: TaxonAggregation (from getTopBirdTaxa via fetchAreaDistribution)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalCount: 0, records: [] }) })
      // Second call: Search pagination (from getAllReportCounts)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalCount: 0, records: [] }) });

    vi.stubGlobal("fetch", mockFetch);

    // Import fresh to avoid module cache contamination
    const { getAreaDistribution } = await import("./artdatabanken.js");
    await getAreaDistribution(59.3, 18.0).catch(() => {});

    // The second fetch call is getAllReportCounts's Search request
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
