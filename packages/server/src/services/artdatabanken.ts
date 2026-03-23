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
