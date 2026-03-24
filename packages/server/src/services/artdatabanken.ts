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

function getDistributionCacheKey(lat: number, lng: number): string {
  // Round to ~22km grid cells (0.2°) so nearby coordinates share cache
  return `${Math.round(lat * 5)}_${Math.round(lng * 5)}_${new Date().getMonth()}`;
}

function getApiKey(): string {
  const key = process.env.ARTDATABANKEN_API_KEY;
  if (!key) throw new Error("ARTDATABANKEN_API_KEY not set");
  return key;
}

export async function getTopBirdTaxa(
  latitude: number,
  longitude: number,
  take = 20,
): Promise<TaxonAggregationRecord[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endDate = now.toISOString().split("T")[0];

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

export async function getTaxonName(
  taxonId: number,
): Promise<{ scientificName: string; vernacularName: string } | null> {
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

  return {
    scientificName: data.records[0].taxon.scientificName,
    vernacularName: data.records[0].taxon.vernacularName,
  };
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
): Promise<Map<number, { scientificName: string; vernacularName: string }>> {
  const nameMap = new Map<number, { scientificName: string; vernacularName: string }>();
  if (taxonIds.length === 0) return nameMap;

  // Try to resolve many names in one bulk search call
  const res = await fetch(
    `${SOS_BASE_URL}/Observations/Search?skip=0&take=1000`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": getApiKey(),
      },
      body: JSON.stringify({
        taxon: { ids: taxonIds, includeUnderlyingTaxa: false },
        output: { fieldSet: "Minimum" },
      }),
    },
  );

  if (res.ok) {
    const data: ObservationSearchResponse = await res.json();
    console.log(`[bulkResolve] Requested ${taxonIds.length} taxa, got ${data.records.length} observations`);
    for (const record of data.records) {
      if (!nameMap.has(record.taxon.id)) {
        nameMap.set(record.taxon.id, {
          scientificName: record.taxon.scientificName,
          vernacularName: record.taxon.vernacularName,
        });
      }
    }
    console.log(`[bulkResolve] Resolved ${nameMap.size} unique taxa out of ${taxonIds.length}`);
  } else {
    console.error(`[bulkResolve] API error: ${res.status}`);
  }

  // Skip individual fallback calls to avoid rate limiting.
  // The bulk call covers most species — any missing ones just won't appear in the distribution.

  return nameMap;
}

export async function getAreaDistribution(
  latitude: number,
  longitude: number,
): Promise<AreaDistribution> {
  const key = getDistributionCacheKey(latitude, longitude);
  const cached = distributionCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached;

  // Deduplicate in-flight requests — if another caller is already fetching
  // the same area, reuse that promise instead of making duplicate API calls
  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

  const promise = fetchAreaDistribution(latitude, longitude, key);
  inflightRequests.set(key, promise);
  promise.finally(() => inflightRequests.delete(key));
  return promise;
}

async function fetchAreaDistribution(
  latitude: number,
  longitude: number,
  cacheKey: string,
): Promise<AreaDistribution> {
  // Fetch top 200 taxa for the area (current month, 15km radius)
  const taxa = await getTopBirdTaxa(latitude, longitude, 200);

  // Resolve all names in a single bulk API call
  const taxonIds = taxa.map((t) => t.taxonId);
  const nameMap = await bulkResolveTaxonNames(taxonIds);

  const entries: DistributionEntry[] = taxa
    .map((t) => {
      const names = nameMap.get(t.taxonId);
      if (!names) return null;
      return {
        taxonId: t.taxonId,
        scientificName: names.scientificName,
        vernacularName: names.vernacularName,
        observationCount: t.observationCount,
      };
    })
    .filter((e): e is DistributionEntry => e !== null);

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

export function calculateSpeciesRarity(
  scientificName: string,
  distribution: AreaDistribution,
): SpeciesRarityResult {
  const entries = distribution.entries;
  const index = entries.findIndex(
    (e) => e.scientificName.toLowerCase() === scientificName.toLowerCase(),
  );

  if (index === -1) {
    return {
      level: "not_observed",
      label: "Ej observerad",
      description: "Arten har inte observerats i detta område den här månaden.",
      observationCount: null,
      totalSpeciesInArea: distribution.totalSpecies,
      rank: null,
    };
  }

  const entry = entries[index];
  const rank = index + 1;
  const percentile = rank / entries.length;

  let level: string;
  let label: string;
  let description: string;

  if (percentile <= 0.1) {
    level = "very_common";
    label = "Mycket vanlig";
    description = `En av de mest observerade arterna i området just nu, med ${entry.observationCount} observationer den här månaden.`;
  } else if (percentile <= 0.35) {
    level = "common";
    label = "Vanlig";
    description = `Observeras regelbundet i området, med ${entry.observationCount} observationer den här månaden.`;
  } else if (percentile <= 0.7) {
    level = "uncommon";
    label = "Mindre vanlig";
    description = `Förekommer i området men observeras inte lika ofta, med ${entry.observationCount} observationer den här månaden.`;
  } else {
    level = "rare";
    label = "Sällsynt";
    description = `Ovanlig i området just nu, med bara ${entry.observationCount} observationer den här månaden.`;
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
