import { scientificToSlug } from "../utils/slug.js";
import type { TaxonParents } from "../services/artdatabanken.js";

export interface StaticFallback {
  orders: Record<string, { sv: string }>;
  families: Record<string, { sv: string }>;
}

export interface TaxonomyPayload {
  familyScientific: string | null;
  orderScientific: string | null;
  order: string | null;
}

export interface TaxonomyDeps {
  findTaxonId: (scientificName: string) => Promise<number | null>;
  getParents: (taxonId: number) => Promise<TaxonParents>;
  fallback: StaticFallback;
}

export async function resolveSpeciesTaxonomy(
  scientificName: string,
  deps: TaxonomyDeps,
): Promise<TaxonomyPayload | null> {
  const taxonId = await deps.findTaxonId(scientificName);
  if (taxonId === null) return null;

  const parents = await deps.getParents(taxonId);

  const familyScientific = parents.family?.scientificName ?? null;
  const orderScientific = parents.order?.scientificName ?? null;

  let order = parents.order?.vernacularName ?? null;
  if (order === null && orderScientific !== null) {
    const slug = scientificToSlug(orderScientific);
    order = deps.fallback.orders[slug]?.sv ?? null;
  }

  return { familyScientific, orderScientific, order };
}

export interface ProcessSpeciesResult {
  id: string;
  order: string | null;
  resolved: boolean;
}

export interface ProcessSpeciesDeps extends TaxonomyDeps {
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
    const payload = await resolveSpeciesTaxonomy(species.scientificName, deps);
    if (payload === null) {
      logger.warn(`[backfill] no taxonId found for ${species.scientificName} — skipping`);
      return { id: species.id, order: null, resolved: false };
    }
    await deps.updateSpecies(species.id, payload);
    return { id: species.id, order: payload.order, resolved: true };
  } catch (err) {
    logger.error(`[backfill] error for ${species.scientificName}:`, err);
    return { id: species.id, order: null, resolved: false };
  }
}
