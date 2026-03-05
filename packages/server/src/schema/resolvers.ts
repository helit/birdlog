import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    species: () => {
      return prisma.species.findMany({
        orderBy: { swedishName: "asc" },
      });
    },

    speciesById: (_: unknown, { id }: { id: string }) => {
      return prisma.species.findUnique({ where: { id } });
    },

    searchSpecies: (_: unknown, { query }: { query: string }) => {
      return prisma.species.findMany({
        where: {
          OR: [
            { swedishName: { contains: query, mode: "insensitive" } },
            { scientificName: { contains: query, mode: "insensitive" } },
            { englishName: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { swedishName: "asc" },
      });
    },
  },
};
