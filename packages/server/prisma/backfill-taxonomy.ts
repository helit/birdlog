import { PrismaClient } from "@prisma/client";
import {
  findTaxonIdByScientificName,
  getTaxonParents,
} from "../src/services/artdatabanken.js";
import {
  processSpeciesBackfill,
  type ProcessSpeciesResult,
  type StaticFallback,
} from "../src/backfill/taxonomy-core.js";
import fallback from "../src/data/swedish-taxonomy-names.json" with { type: "json" };

const prisma = new PrismaClient();
const BATCH_SIZE = 5;
const BATCH_PAUSE_MS = 200;

function parseArgs(argv: string[]): { force: boolean } {
  return { force: argv.includes("--force") };
}

async function processBatch(
  species: Array<{ id: string; scientificName: string }>,
): Promise<ProcessSpeciesResult[]> {
  return Promise.all(
    species.map((s) =>
      processSpeciesBackfill(s, {
        findTaxonId: findTaxonIdByScientificName,
        getParents: getTaxonParents,
        fallback: fallback as StaticFallback,
        updateSpecies: async (id, payload) => {
          await prisma.species.update({
            where: { id },
            data: {
              familyScientific: payload.familyScientific,
              orderScientific: payload.orderScientific,
              order: payload.order,
            },
          });
        },
      }),
    ),
  );
}

async function run(): Promise<void> {
  const { force } = parseArgs(process.argv.slice(2));

  const where = force ? {} : { orderScientific: null };
  const species = await prisma.species.findMany({
    where,
    select: { id: true, scientificName: true },
    orderBy: { scientificName: "asc" },
  });

  console.log(
    `[backfill] processing ${species.length} species (force=${force})`,
  );

  let processed = 0;
  let nullOrderCount = 0;

  for (let i = 0; i < species.length; i += BATCH_SIZE) {
    const batch = species.slice(i, i + BATCH_SIZE);
    const results = await processBatch(batch);
    for (const r of results) {
      if (r.resolved && r.order === null) nullOrderCount++;
    }
    processed += batch.length;
    if (processed % 50 === 0 || processed === species.length) {
      console.log(`[backfill] progress: ${processed}/${species.length}`);
    }
    if (i + BATCH_SIZE < species.length) {
      await new Promise((r) => setTimeout(r, BATCH_PAUSE_MS));
    }
  }

  console.log(
    `[backfill] done — processed ${processed} species, ${nullOrderCount} with null Swedish order name`,
  );
}

run()
  .catch((err) => {
    console.error("[backfill] fatal error:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
