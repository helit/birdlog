import { scientificToSlug } from "../utils/slug.js";

export interface StaticFallback {
  orders: Record<string, { sv: string }>;
  families: Record<string, { sv: string }>;
}

export interface TaxonomyPayload {
  familyScientific: string | null;
  orderScientific: string | null;
  order: string | null;
}

export interface TaxonomyEntry {
  family: string | null;
  order: string | null;
}

export function resolveSpeciesTaxonomy(
  entry: TaxonomyEntry | undefined,
  fallback: StaticFallback,
): TaxonomyPayload | null {
  if (!entry) return null;

  const familyScientific = entry.family;
  const orderScientific = entry.order;

  let order: string | null = null;
  if (orderScientific !== null) {
    const slug = scientificToSlug(orderScientific);
    order = fallback.orders[slug]?.sv ?? null;
  }

  return { familyScientific, orderScientific, order };
}

export interface ProcessSpeciesResult {
  id: string;
  order: string | null;
  resolved: boolean;
}

export interface ProcessSpeciesDeps {
  lookup: (scientificName: string) => TaxonomyEntry | undefined;
  fallback: StaticFallback;
  updateSpecies: (id: string, payload: TaxonomyPayload) => Promise<void>;
  logger?: {
    warn: (msg: string) => void;
    error: (msg: string, err: unknown) => void;
  };
}

export async function processSpeciesBackfill(
  species: { id: string; scientificName: string },
  deps: ProcessSpeciesDeps,
): Promise<ProcessSpeciesResult> {
  const logger = deps.logger ?? {
    warn: (msg: string) => console.warn(msg),
    error: (msg: string, err: unknown) => console.error(msg, err),
  };

  try {
    const entry = deps.lookup(species.scientificName);
    const payload = resolveSpeciesTaxonomy(entry, deps.fallback);
    if (payload === null) {
      logger.warn(
        `[backfill] no taxonomy entry for ${species.scientificName} — skipping`,
      );
      return { id: species.id, order: null, resolved: false };
    }
    await deps.updateSpecies(species.id, payload);
    return { id: species.id, order: payload.order, resolved: true };
  } catch (err) {
    logger.error(`[backfill] error for ${species.scientificName}:`, err);
    return { id: species.id, order: null, resolved: false };
  }
}
