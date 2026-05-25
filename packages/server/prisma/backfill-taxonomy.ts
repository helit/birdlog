// Load .env from cwd when present (local runs); no-ops inside the prod
// container where env vars come from Docker's env_file.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  listAllBirdTaxonIds,
  bulkResolveBirdTaxonomy,
} from "../src/services/artdatabanken.js";
import {
  processSpeciesBackfill,
  type StaticFallback,
} from "../src/backfill/taxonomy-core.js";
import fallback from "../src/data/swedish-taxonomy-names.json" with { type: "json" };

const prisma = new PrismaClient();

function parseArgs(argv: string[]): { force: boolean } {
  return { force: argv.includes("--force") };
}

async function run(): Promise<void> {
  const { force } = parseArgs(process.argv.slice(2));

  console.log("[backfill] listing all bird taxonIds from Artdatabanken…");
  const taxonIds = await listAllBirdTaxonIds();
  console.log(`[backfill] ${taxonIds.length} bird taxonIds observed in Sweden`);

  console.log("[backfill] bulk-resolving family/order for each taxonId…");
  const taxonomyMap = await bulkResolveBirdTaxonomy(taxonIds, {
    onProgress: (done, total) => {
      if (done % 200 === 0 || done === total) {
        console.log(`[backfill] resolved ${done}/${total}`);
      }
    },
    onFallbackStart: (missing) => {
      if (missing > 0) {
        console.log(
          `[backfill] ${missing} taxa missing from bulk responses, doing single-id fallback…`,
        );
      }
    },
  });
  console.log(
    `[backfill] taxonomy map built: ${taxonomyMap.size} scientific-name entries`,
  );

  // Lookup is case-insensitive: some seed rows use lowercase scientific names
  // while Artdatabanken returns PascalCase (e.g., "buteo buteo buteo" vs "Buteo buteo buteo").
  const lowerMap = new Map<string, { family: string | null; order: string | null }>();
  for (const [name, entry] of taxonomyMap) {
    lowerMap.set(name.toLowerCase(), { family: entry.family, order: entry.order });
  }

  const where = force ? {} : { orderScientific: null };
  const species = await prisma.species.findMany({
    where,
    select: { id: true, scientificName: true },
    orderBy: { scientificName: "asc" },
  });

  console.log(
    `[backfill] updating ${species.length} species (force=${force})`,
  );

  let resolved = 0;
  let skipped = 0;
  let nullSwedishOrder = 0;

  for (const s of species) {
    const result = await processSpeciesBackfill(s, {
      lookup: (name) => lowerMap.get(name.toLowerCase()),
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
    });
    if (result.resolved) {
      resolved++;
      if (result.order === null) nullSwedishOrder++;
    } else {
      skipped++;
    }
  }

  console.log(
    `[backfill] done — resolved ${resolved}, skipped ${skipped}, ${nullSwedishOrder} without Swedish order name`,
  );
}

run()
  .catch((err) => {
    console.error("[backfill] fatal error:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
