const SOS_BASE_URL = "https://api.artdatabanken.se/species-observation-system/v1";
const BIRDS_TAXON_ID = 4000104;

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

interface AreaDistribution {
  entries: DistributionEntry[];
  totalSpecies: number;
  fetchedAt: number;
}

const distributionCache = new Map<string, AreaDistribution>();
const inflightRequests = new Map<string, Promise<AreaDistribution>>();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

function getDistributionCacheKey(lat: number, lng: number, date: Date): string {
  // Round to ~22km grid cells (0.2°) so nearby coordinates share cache
  return `${Math.round(lat * 5)}_${Math.round(lng * 5)}_${date.getFullYear()}-${date.getMonth()}`;
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
  const startDate = new Date(forDate.getFullYear(), forDate.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(forDate.getFullYear(), forDate.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const res = await fetch(
    `${SOS_BASE_URL}/Observations/TaxonAggregation?skip=0&take=${take}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": getApiKey(),
      },
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
  const startDate = new Date(forDate.getFullYear(), forDate.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(forDate.getFullYear(), forDate.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

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
      { headers: { "User-Agent": "BirdLog/1.0 (henrik@henlit.se)" } },
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
    { headers: { "User-Agent": "BirdLog/1.0 (henrik@henlit.se)" } },
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

export async function getAreaDistribution(
  latitude: number,
  longitude: number,
  options?: { date?: Date; thorough?: boolean },
): Promise<AreaDistribution> {
  const date = options?.date ?? new Date();
  const thorough = options?.thorough ?? false;
  const key = getDistributionCacheKey(latitude, longitude, date);
  const cached = distributionCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached;

  // Deduplicate in-flight requests — if another caller is already fetching
  // the same area, reuse that promise instead of making duplicate API calls
  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

  const promise = fetchAreaDistribution(latitude, longitude, date, thorough, key);
  inflightRequests.set(key, promise);
  promise.finally(() => inflightRequests.delete(key)).catch(() => {});
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
  // Fetch species list from TaxonAggregation (for species discovery + name resolution)
  const taxa = await getTopBirdTaxa(latitude, longitude, 200, date);

  // Fetch actual report counts per species (not individual bird counts)
  const reportCounts = await getAllReportCounts(latitude, longitude, date);

  // Resolve names — thorough mode uses individual fallbacks for full coverage
  const taxonIds = taxa.map((t) => t.taxonId);
  const nameMap = await bulkResolveTaxonNames(taxonIds, thorough);

  const entries: DistributionEntry[] = taxa
    .map((t) => {
      const names = nameMap.get(t.taxonId);
      if (!names) return null;
      return {
        taxonId: t.taxonId,
        scientificName: names.scientificName,
        vernacularName: names.vernacularName,
        observationCount: reportCounts.get(t.taxonId) ?? 0,
      };
    })
    .filter((e): e is DistributionEntry => e !== null)
    .filter((e) => ![...EXCLUDED_SPECIES].some((ex) => e.scientificName.toLowerCase().includes(ex)));

  const distribution: AreaDistribution = {
    entries,
    totalSpecies: taxa.length,
    fetchedAt: Date.now(),
  };

  distributionCache.set(cacheKey, distribution);
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
