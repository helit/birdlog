import { PrismaClient } from "@prisma/client";
import { getAreaDistribution, calculateSpeciesRarity } from "../src/services/artdatabanken.js";

const prisma = new PrismaClient();

async function backfill() {
  const sightings = await prisma.sighting.findMany({
    where: { rarityLevel: null },
    include: { species: true },
    orderBy: { date: "desc" },
  });

  console.log(`Found ${sightings.length} sightings without rarity data`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < sightings.length; i++) {
    const sighting = sightings[i];
    // Delay between sightings to avoid Artdatabanken rate limits
    if (i > 0) await new Promise((r) => setTimeout(r, 2000));
    try {
      // Use the sighting's date and location — rarity is a snapshot in time
      const distribution = await getAreaDistribution(
        sighting.latitude,
        sighting.longitude,
        { date: sighting.date, thorough: true },
      );
      const rarity = calculateSpeciesRarity(sighting.species.scientificName, distribution);

      await prisma.sighting.update({
        where: { id: sighting.id },
        data: {
          rarityLevel: rarity.level,
          rarityLabel: rarity.label,
          rarityDescription: rarity.description,
          rarityRank: rarity.rank,
          rarityObservations: rarity.observationCount,
          rarityTotalSpecies: rarity.totalSpeciesInArea,
        },
      });

      updated++;
      console.log(
        `[${updated}/${sightings.length}] ${sighting.species.swedishName} → ${rarity.label}`,
      );
    } catch (err) {
      failed++;
      console.error(`Failed: ${sighting.species.swedishName} — ${err}`);
    }
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
  await prisma.$disconnect();
}

backfill();
