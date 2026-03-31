import { PrismaClient } from "@prisma/client";
import { getWikimediaImage } from "./artdatabanken.js";

interface BirdCandidate {
  swedishName: string;
  scientificName: string;
}

export async function enrichBirdCandidates(
  candidates: BirdCandidate[],
  prisma: PrismaClient,
) {
  return Promise.all(
    candidates.map(async (bird) => {
      const imageUrl = await getWikimediaImage(bird.scientificName);

      const species = await prisma.species.upsert({
        where: { scientificName: bird.scientificName },
        update: {
          imageUrl: imageUrl ?? undefined,
        },
        create: {
          swedishName: bird.swedishName,
          scientificName: bird.scientificName,
          imageUrl,
        },
      });

      return {
        ...bird,
        speciesId: species.id,
        imageUrl: species.imageUrl ?? imageUrl,
      };
    }),
  );
}
