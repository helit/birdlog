import { PrismaClient } from "@prisma/client";

const SOS_BASE_URL = "https://api.artdatabanken.se/species-observation-system/v1";
const BIRDS_TAXON_ID = 4000104;

const prisma = new PrismaClient();

interface TaxonAggregationRecord {
  taxonId: number;
  observationCount: number;
}

interface TaxonAggregationResponse {
  totalCount: number;
  records: TaxonAggregationRecord[];
}

interface ObservationTaxon {
  id: number;
  scientificName: string;
  vernacularName: string;
}

interface Observation {
  taxon: ObservationTaxon;
  event?: { startDate?: string; endDate?: string };
  location?: { locality?: string; municipality?: { name?: string }; decimalLatitude?: number; decimalLongitude?: number };
}

interface ObservationSearchResponse {
  totalCount: number;
  records: Observation[];
}

// --- Area distribution cache ---

export interface DistributionEntry {
  taxonId: number;
  scientificName: string;
  vernacularName: string;
  observationCount: number;
}

export interface AreaDistribution {
  entries: DistributionEntry[];
  totalSpecies: number;
  fetchedAt: number;
}

const distributionCache = new Map<string, AreaDistribution>();
const inflightRequests = new Map<string, Promise<AreaDistribution>>();
const SWR_STALE_TTL = 60 * 60 * 1000; // 1 hour

export function getDistributionCacheKey(lat: number, lng: number, date: Date): string {
  // Round to ~22km grid cells (0.2°) so nearby coordinates share cache.
  // Include rolling start date so the key advances daily as the window moves.
  const rollingStart = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startStr = rollingStart.toISOString().split("T")[0];
  return `${Math.round(lat * 5)}_${Math.round(lng * 5)}_${startStr}`;
}

export async function loadFromDb(key: string): Promise<AreaDistribution | null> {
  const row = await prisma.areaDistributionCache.findUnique({ where: { cacheKey: key } });
  if (!row) return null;
  return {
    entries: row.entries as unknown as DistributionEntry[],
    totalSpecies: row.totalSpecies,
    fetchedAt: row.fetchedAt.getTime(),
  };
}

export async function saveToDb(key: string, distribution: AreaDistribution): Promise<void> {
  const entries = distribution.entries as unknown as import("@prisma/client").Prisma.InputJsonValue;
  await prisma.areaDistributionCache.upsert({
    where: { cacheKey: key },
    create: {
      cacheKey: key,
      entries,
      totalSpecies: distribution.totalSpecies,
      fetchedAt: new Date(distribution.fetchedAt),
    },
    update: {
      entries,
      totalSpecies: distribution.totalSpecies,
      fetchedAt: new Date(distribution.fetchedAt),
    },
  });
}

export async function clearDistributionCache(lat: number, lng: number): Promise<void> {
  const key = getDistributionCacheKey(lat, lng, new Date());
  distributionCache.delete(key);
  inflightRequests.delete(key);
  await prisma.areaDistributionCache.delete({ where: { cacheKey: key } }).catch(() => {});
}

// Persistent in-memory cache for taxonId → name mappings (never expires — names don't change)
const taxonNameCache = new Map<number, { scientificName: string; vernacularName: string }>();

function getApiKey(): string {
  const key = process.env.ARTDATABANKEN_API_KEY;
  if (!key) throw new Error("ARTDATABANKEN_API_KEY not set");
  return key;
}

export async function getTopBirdTaxa(
  latitude: number,
  longitude: number,
  take = 20,
  forDate: Date = new Date(),
): Promise<TaxonAggregationRecord[]> {
  const startDate = new Date(forDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const endDate = forDate.toISOString().split("T")[0];

  const res = await fetch(
    `${SOS_BASE_URL}/Observations/TaxonAggregation?skip=0&take=${take}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": getApiKey(),
      },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        taxon: { ids: [BIRDS_TAXON_ID], includeUnderlyingTaxa: true },
        date: {
          startDate,
          endDate,
          dateFilterType: "BetweenStartDateAndEndDate",
        },
        geographics: {
          geometries: [
            { type: "point", coordinates: [longitude, latitude] },
          ],
          maxDistanceFromPoint: 15000,
        },
      }),
    },
  );

  if (!res.ok) throw new Error(`Artdatabanken API error: ${res.status}`);

  const data: TaxonAggregationResponse = await res.json();
  return data.records;
}

// Paginate through Search endpoint to count reports per taxon (not individual birds)
async function getAllReportCounts(
  latitude: number,
  longitude: number,
  forDate: Date = new Date(),
): Promise<Map<number, number>> {
  const startDate = new Date(forDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const endDate = forDate.toISOString().split("T")[0];

  const counts = new Map<number, number>();
  const PAGE_SIZE = 1000;
  let skip = 0;
  let totalCount = Infinity;

  while (skip < totalCount) {
    const res = await fetch(
      `${SOS_BASE_URL}/Observations/Search?skip=${skip}&take=${PAGE_SIZE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": getApiKey(),
        },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          taxon: { ids: [BIRDS_TAXON_ID], includeUnderlyingTaxa: true },
          date: {
            startDate,
            endDate,
            dateFilterType: "BetweenStartDateAndEndDate",
          },
          geographics: {
            geometries: [
              { type: "point", coordinates: [longitude, latitude] },
            ],
            maxDistanceFromPoint: 15000,
          },
          output: { fieldSet: "Minimum" },
        }),
      },
    );

    if (!res.ok) break;
    const data: ObservationSearchResponse = await res.json();
    totalCount = data.totalCount;

    for (const record of data.records) {
      counts.set(record.taxon.id, (counts.get(record.taxon.id) ?? 0) + 1);
    }

    skip += PAGE_SIZE;
  }

  console.log(`[getAllReportCounts] Counted ${counts.size} species from ${skip} records (total: ${totalCount})`);
  return counts;
}

export async function getTaxonName(
  taxonId: number,
): Promise<{ scientificName: string; vernacularName: string } | null> {
  const cached = taxonNameCache.get(taxonId);
  if (cached) return cached;

  const res = await fetch(
    `${SOS_BASE_URL}/Observations/Search?skip=0&take=1`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": getApiKey(),
      },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        taxon: { ids: [taxonId] },
        output: { fieldSet: "Minimum" },
      }),
    },
  );

  if (!res.ok) return null;

  const data: ObservationSearchResponse = await res.json();
  if (data.records.length === 0) return null;

  const result = {
    scientificName: data.records[0].taxon.scientificName,
    vernacularName: data.records[0].taxon.vernacularName,
  };
  taxonNameCache.set(taxonId, result);
  return result;
}

export async function getWikipediaSummary(
  scientificName: string,
): Promise<string | null> {
  // Try Swedish Wikipedia first, fall back to English
  for (const lang of ["sv", "en"]) {
    const slug = scientificName.replace(/ /g, "_");
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`,
      { headers: { "User-Agent": "BirdLog/1.0 (henrik@henlit.se)" }, signal: AbortSignal.timeout(10_000) },
    );

    if (!res.ok) continue;

    const data = await res.json();
    if (data.extract) return data.extract;
  }
  return null;
}

export async function getWikimediaImage(
  scientificName: string,
  widthPx = 200,
): Promise<string | null> {
  const slug = scientificName.replace(/ /g, "_");
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
    { headers: { "User-Agent": "BirdLog/1.0 (henrik@henlit.se)" }, signal: AbortSignal.timeout(10_000) },
  );

  if (!res.ok) return null;

  const data = await res.json();
  const thumbnail = data.thumbnail?.source as string | undefined;
  if (thumbnail) {
    return thumbnail.replace(/\/(\d+px-)/, `/${widthPx}px-`);
  }
  return null;
}

// --- Area distribution & rarity ---

async function bulkResolveTaxonNames(
  taxonIds: number[],
  thorough = false,
): Promise<Map<number, { scientificName: string; vernacularName: string }>> {
  const nameMap = new Map<number, { scientificName: string; vernacularName: string }>();
  if (taxonIds.length === 0) return nameMap;

  // Check in-memory cache first
  const uncached: number[] = [];
  for (const id of taxonIds) {
    const cached = taxonNameCache.get(id);
    if (cached) {
      nameMap.set(id, cached);
    } else {
      uncached.push(id);
    }
  }
  if (uncached.length === 0) return nameMap;

  // Try to resolve remaining names in one bulk search call
  const res = await fetch(
    `${SOS_BASE_URL}/Observations/Search?skip=0&take=1000`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": getApiKey(),
      },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        taxon: { ids: uncached, includeUnderlyingTaxa: false },
        output: { fieldSet: "Minimum" },
      }),
    },
  );

  if (res.ok) {
    const data: ObservationSearchResponse = await res.json();
    for (const record of data.records) {
      if (!nameMap.has(record.taxon.id)) {
        const names = {
          scientificName: record.taxon.scientificName,
          vernacularName: record.taxon.vernacularName,
        };
        nameMap.set(record.taxon.id, names);
        taxonNameCache.set(record.taxon.id, names);
      }
    }
  }

  // In thorough mode (backfill), resolve missing taxa individually with delays
  // getTaxonName already caches results in taxonNameCache
  if (thorough) {
    const missing = taxonIds.filter((id) => !nameMap.has(id));
    if (missing.length > 0) {
      console.log(`[bulkResolve] Resolving ${missing.length} remaining taxa individually...`);
      const BATCH_SIZE = 5;
      for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        if (i > 0) await new Promise((r) => setTimeout(r, 1000));
        const batch = missing.slice(i, i + BATCH_SIZE);
        const resolved = await Promise.all(
          batch.map(async (id) => {
            const names = await getTaxonName(id);
            return names ? { id, ...names } : null;
          }),
        );
        for (const r of resolved) {
          if (r) nameMap.set(r.id, { scientificName: r.scientificName, vernacularName: r.vernacularName });
        }
      }
    }
  }

  console.log(`[bulkResolve] Resolved ${nameMap.size}/${taxonIds.length} taxa${thorough ? " (thorough)" : ""}`);
  return nameMap;
}

function triggerBackgroundRefresh(
  key: string,
  latitude: number,
  longitude: number,
  date: Date,
  thorough: boolean,
): void {
  if (inflightRequests.has(key)) return;
  const promise = fetchAreaDistribution(latitude, longitude, date, thorough, key);
  inflightRequests.set(key, promise);
  promise
    .finally(() => inflightRequests.delete(key))
    .catch((e) => console.error("Background area distribution refresh failed:", e));
}

export async function getAreaDistribution(
  latitude: number,
  longitude: number,
  options?: { date?: Date; thorough?: boolean },
): Promise<AreaDistribution> {
  const date = options?.date ?? new Date();
  const thorough = options?.thorough ?? false;
  const key = getDistributionCacheKey(latitude, longitude, date);

  // Tier 1 & 2: In-memory hit
  const cached = distributionCache.get(key);
  if (cached) {
    if (Date.now() - cached.fetchedAt < SWR_STALE_TTL) {
      // Tier 1: fresh
      return cached;
    }
    // Tier 2: stale — return immediately, refresh in background
    triggerBackgroundRefresh(key, latitude, longitude, date, thorough);
    return cached;
  }

  // Tier 3: DB hit
  const dbEntry = await loadFromDb(key);
  if (dbEntry) {
    distributionCache.set(key, dbEntry);
    if (Date.now() - dbEntry.fetchedAt >= SWR_STALE_TTL) {
      triggerBackgroundRefresh(key, latitude, longitude, date, thorough);
    }
    return dbEntry;
  }

  // Tier 4: Cold — block until fetch completes
  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

  const promise = fetchAreaDistribution(latitude, longitude, date, thorough, key);
  inflightRequests.set(key, promise);
  promise.finally(() => inflightRequests.delete(key)).catch((e) => console.error("Failed to fetch area distribution:", e));
  return promise;
}

// Species to exclude from all results (domesticated, non-wild populations)
const EXCLUDED_SPECIES = new Set([
  "columba livia", // Tamduva (Rock Dove / feral pigeon)
]);

async function fetchAreaDistribution(
  latitude: number,
  longitude: number,
  date: Date,
  thorough: boolean,
  cacheKey: string,
): Promise<AreaDistribution> {
  const [taxa, reportCounts] = await Promise.all([
    getTopBirdTaxa(latitude, longitude, 200, date),
    getAllReportCounts(latitude, longitude, date),
  ]);

  // Resolve names — thorough mode uses individual fallbacks for full coverage
  const taxonIds = taxa.map((t) => t.taxonId);
  const nameMap = await bulkResolveTaxonNames(taxonIds, thorough);

  let fallbackCount = 0;
  const entries: DistributionEntry[] = taxa
    .map((t) => {
      const names = nameMap.get(t.taxonId);
      if (!names) return null;
      const fromSearch = reportCounts.get(t.taxonId);
      if (fromSearch === undefined) fallbackCount++;
      return {
        taxonId: t.taxonId,
        scientificName: names.scientificName,
        vernacularName: names.vernacularName,
        observationCount: fromSearch ?? t.observationCount,
      };
    })
    .filter((e): e is DistributionEntry => e !== null)
    .filter((e) => ![...EXCLUDED_SPECIES].some((ex) => e.scientificName.toLowerCase().includes(ex)));

  if (fallbackCount > 0) {
    console.log(`[fetchAreaDistribution] ${fallbackCount} entries fell back to TaxonAggregation count`);
  }

  const distribution: AreaDistribution = {
    entries,
    totalSpecies: taxa.length,
    fetchedAt: Date.now(),
  };

  distributionCache.set(cacheKey, distribution);
  saveToDb(cacheKey, distribution).catch((e) => console.error("Failed to save distribution to DB:", e));
  return distribution;
}

export interface SpeciesRarityResult {
  level: string;
  label: string;
  description: string;
  observationCount: number | null;
  totalSpeciesInArea: number;
  rank: number | null;
}

const SWEDISH_MONTHS = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];

interface RarityOptions {
  /** "present" for live data (nearby birds, bird info), "past" for stored sightings */
  tense?: "present" | "past";
  /** Month of the observation (0-11), used for contextual descriptions */
  month?: number;
}

export function calculateSpeciesRarity(
  scientificName: string,
  distribution: AreaDistribution,
  options: RarityOptions = {},
): SpeciesRarityResult {
  const { tense = "present", month } = options;
  const monthName = month !== undefined ? SWEDISH_MONTHS[month] : undefined;
  const entries = distribution.entries;
  const index = entries.findIndex(
    (e) => e.scientificName.toLowerCase() === scientificName.toLowerCase(),
  );

  if (index === -1) {
    const description = tense === "past"
      ? `Ingen annan hade rapporterat arten i området${monthName ? ` under ${monthName}` : ""} — ett unikt fynd!`
      : `Arten har inte rapporterats i området${monthName ? ` under ${monthName}` : ""} — ett unikt fynd!`;
    return {
      level: "not_observed",
      label: "Unikt fynd",
      description,
      observationCount: null,
      totalSpeciesInArea: distribution.totalSpecies,
      rank: null,
    };
  }

  const entry = entries[index];
  const rank = index + 1;
  const percentile = rank / entries.length;
  const count = entry.observationCount;
  const monthCtx = monthName ? ` i ${monthName}` : "";

  let level: string;
  let label: string;
  let description: string;

  if (percentile <= 0.1) {
    level = "very_common";
    label = "Mycket vanlig";
    description = tense === "past"
      ? `En av de mest observerade arterna i området${monthCtx}, med ${count} rapporter.`
      : `En av de mest observerade arterna i området just nu, med ${count} rapporter${monthCtx}.`;
  } else if (percentile <= 0.35) {
    level = "common";
    label = "Vanlig";
    description = tense === "past"
      ? `Observerades regelbundet i området${monthCtx}, med ${count} rapporter.`
      : `Observeras regelbundet i området, med ${count} rapporter${monthCtx}.`;
  } else if (percentile <= 0.7) {
    level = "uncommon";
    label = "Mindre vanlig";
    description = tense === "past"
      ? `Förekom i området men observerades inte ofta${monthCtx} — bara ${count} rapporter bland ${distribution.totalSpecies} arter.`
      : `Förekommer i området men observeras inte lika ofta, med ${count} rapporter${monthCtx}.`;
  } else {
    level = "rare";
    label = "Sällsynt";
    description = tense === "past"
      ? `Ovanlig i området${monthCtx} — bara ${count} rapporter bland ${distribution.totalSpecies} arter. Få observatörer hade sett arten här vid den tidpunkten.`
      : `Ovanlig i området just nu, med bara ${count} rapporter${monthCtx}.`;
  }

  return {
    level,
    label,
    description,
    observationCount: entry.observationCount,
    totalSpeciesInArea: distribution.totalSpecies,
    rank,
  };
}

// --- Taxonomy helpers ---
//
// SOS does not support filtering Observations/Search by scientificName — that filter
// is silently ignored and the endpoint returns arbitrary records. What works:
//   - TaxonAggregation with `taxon.ids: [BIRDS_TAXON_ID], includeUnderlyingTaxa: true`
//     returns distinct taxonIds for every bird taxon observed in Sweden (no names).
//   - Observations/Search with `taxon.ids: [chunk], fieldSet: "All"` returns records
//     whose taxon object exposes family and order as plain scientific-name strings.
// The pair below is the one-time backfill path: list all bird taxonIds, then bulk-resolve
// (scientificName, family, order) tuples and collect them into a Map keyed by name.

export interface BirdTaxonomyRecord {
  taxonId: number;
  scientificName: string;
  family: string | null;
  order: string | null;
}

export async function listAllBirdTaxonIds(): Promise<number[]> {
  // SOS TaxonAggregation caps skip+take at 1000 but returns every record when
  // skip/take are omitted — the API doc's "set to null to retrieve all" path.
  const res = await fetch(
    `${SOS_BASE_URL}/Observations/TaxonAggregation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": getApiKey(),
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        taxon: { ids: [BIRDS_TAXON_ID], includeUnderlyingTaxa: true },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Artdatabanken listAllBirdTaxonIds failed: HTTP ${res.status}`,
    );
  }
  const data = (await res.json()) as {
    records?: Array<{ taxonId?: number }>;
  };
  const ids: number[] = [];
  for (const r of data.records ?? []) {
    if (typeof r.taxonId === "number") ids.push(r.taxonId);
  }
  return ids;
}

async function fetchTaxonomyBatch(
  ids: number[],
  take: number,
): Promise<BirdTaxonomyRecord[]> {
  const MAX_ATTEMPTS = 5;
  const BASE_DELAY_MS = 2000;
  const TIMEOUT_MS = 30000;
  let attempt = 0;
  let res: Response | null = null;
  for (;;) {
    try {
      res = await fetch(
        `${SOS_BASE_URL}/Observations/Search?skip=0&take=${take}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": getApiKey(),
          },
          signal: AbortSignal.timeout(TIMEOUT_MS),
          body: JSON.stringify({
            taxon: { ids, includeUnderlyingTaxa: false },
            output: { fieldSet: "All" },
          }),
        },
      );
      if (res.status !== 429) break;
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS - 1) throw err;
    }
    if (attempt >= MAX_ATTEMPTS - 1) break;
    const delay = BASE_DELAY_MS * 2 ** attempt + Math.random() * 500;
    await new Promise((r) => setTimeout(r, delay));
    attempt++;
  }
  if (!res || !res.ok) {
    throw new Error(
      `Artdatabanken fetchTaxonomyBatch failed: HTTP ${res?.status ?? "network"} for ${ids.length} ids`,
    );
  }
  const data = (await res.json()) as {
    records?: Array<{
      taxon?: {
        id?: number;
        scientificName?: string;
        family?: string | null;
        order?: string | null;
      };
    }>;
  };
  const seen = new Set<number>();
  const out: BirdTaxonomyRecord[] = [];
  for (const rec of data.records ?? []) {
    const t = rec.taxon;
    if (!t || typeof t.id !== "number" || typeof t.scientificName !== "string") continue;
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push({
      taxonId: t.id,
      scientificName: t.scientificName,
      family: typeof t.family === "string" && t.family.length > 0 ? t.family : null,
      order: typeof t.order === "string" && t.order.length > 0 ? t.order : null,
    });
  }
  return out;
}

export async function bulkResolveBirdTaxonomy(
  taxonIds: number[],
  options: {
    onProgress?: (done: number, total: number) => void;
    onFallbackStart?: (missing: number) => void;
  } = {},
): Promise<Map<string, BirdTaxonomyRecord>> {
  const CHUNK_SIZE = 50;
  const PAGE_SIZE = 1000;
  const BULK_PAUSE_MS = 300;
  const FALLBACK_PAUSE_MS = 1000;

  const byName = new Map<string, BirdTaxonomyRecord>();
  const seenIds = new Set<number>();

  for (let i = 0; i < taxonIds.length; i += CHUNK_SIZE) {
    const chunk = taxonIds.slice(i, i + CHUNK_SIZE);
    const records = await fetchTaxonomyBatch(chunk, PAGE_SIZE);
    for (const r of records) {
      seenIds.add(r.taxonId);
      if (!byName.has(r.scientificName)) byName.set(r.scientificName, r);
    }
    options.onProgress?.(
      Math.min(i + CHUNK_SIZE, taxonIds.length),
      taxonIds.length,
    );
    if (i + CHUNK_SIZE < taxonIds.length) {
      await new Promise((r) => setTimeout(r, BULK_PAUSE_MS));
    }
  }

  const missing = taxonIds.filter((id) => !seenIds.has(id));
  options.onFallbackStart?.(missing.length);
  for (const id of missing) {
    try {
      const records = await fetchTaxonomyBatch([id], 1);
      for (const r of records) {
        seenIds.add(r.taxonId);
        if (!byName.has(r.scientificName)) byName.set(r.scientificName, r);
      }
    } catch (err) {
      console.warn(
        `[bulkResolveBirdTaxonomy] skipping taxonId=${id}:`,
        err instanceof Error ? err.message : err,
      );
    }
    await new Promise((r) => setTimeout(r, FALLBACK_PAUSE_MS));
  }

  return byName;
}
