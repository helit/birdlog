import { PrismaClient } from "@prisma/client";
import { generateToken, GraphQLContext, requireAuth } from "../middleware/auth.js";
import { GraphQLError } from "graphql";
import bcrypt from "bcrypt";
import {
  getWikimediaImage,
  getWikipediaSummary,
  getAreaDistribution,
  calculateSpeciesRarity,
} from "../services/artdatabanken.js";

const prisma = new PrismaClient();

interface RegisterArgs {
  email: string;
  name: string;
  password: string;
}

interface LoginArgs {
  email: string;
  password: string;
}

interface CreateSightingArgs {
  speciesId: string;
  latitude: number;
  longitude: number;
  location: string | null;
  notes: string | null;
  date: string;
}

interface UpdateSightingArgs {
  id: string;
  speciesId?: string;
  latitude?: number;
  longitude?: number;
  location?: string | null;
  notes?: string | null;
  date?: string;
}

// Cache nearby birds results for 24h per area grid cell
const NEARBY_BIRDS_TTL = 24 * 60 * 60 * 1000;
const nearbyBirdsCache = new Map<string, { result: unknown; fetchedAt: number }>();

export const resolvers = {
  Species: {
    description: async (species: { id: string; scientificName: string; description: string | null }) => {
      if (species.description) return species.description;

      const summary = await getWikipediaSummary(species.scientificName);
      if (!summary) return null;

      prisma.species
        .update({ where: { id: species.id }, data: { description: summary } })
        .catch(() => {});

      return summary;
    },
    imageUrl: async (species: { id: string; scientificName: string; imageUrl: string | null }) => {
      // Return cached URL if already stored
      if (species.imageUrl) return species.imageUrl;

      // Fetch from Wikipedia and cache in DB
      const wikimediaUrl = await getWikimediaImage(species.scientificName);
      if (!wikimediaUrl) return null;

      const imageUrl = wikimediaUrl;

      // Cache asynchronously — don't block the response
      prisma.species
        .update({ where: { id: species.id }, data: { imageUrl } })
        .catch(() => {});

      return imageUrl;
    },
  },

  Sighting: {
    date: (sighting: { date: Date }) => sighting.date.toISOString(),
    createdAt: (sighting: { createdAt: Date }) => sighting.createdAt.toISOString(),
  },

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

    me: (_: unknown, __: unknown, context: GraphQLContext) => {
      return context.user;
    },

    mySightings: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context.user);

      return await prisma.sighting.findMany({
        where: { userId: user.id },
        include: { species: true },
        orderBy: [{ date: "desc" }, { id: "desc" }],
      });
    },

    mySightingsBySpecies: async (
      _: unknown,
      { speciesId }: { speciesId: string },
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context.user);

      return await prisma.sighting.findMany({
        where: { userId: user.id, speciesId },
        include: { species: true },
        orderBy: [{ date: "desc" }, { id: "desc" }],
      });
    },

    nearbyBirds: async (
      _: unknown,
      { latitude, longitude }: { latitude: number; longitude: number },
    ) => {
      // Check cache first (24h per ~22km grid cell)
      const cacheKey = `nearby_${Math.round(latitude * 5)}_${Math.round(longitude * 5)}`;
      const cached = nearbyBirdsCache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < NEARBY_BIRDS_TTL) {
        return cached.result;
      }

      // Use distribution which now has accurate report counts
      const distribution = await getAreaDistribution(latitude, longitude);
      const entries = [...distribution.entries].sort(
        (a, b) => b.observationCount - a.observationCount,
      );
      if (entries.length === 0) return { hero: null, common: [], uncommon: [] };

      // Common: top 3 most reported
      const commonEntries = entries.slice(0, 3);
      // Uncommon: least reported, but require at least 3 reports for credibility
      const MIN_REPORTS = 3;
      const credible = entries.filter((e) => e.observationCount >= MIN_REPORTS);
      // Hero: least reported credible bird
      const heroEntry = credible[credible.length - 1];
      // Uncommon: next 3 least reported credible, excluding hero
      const uncommonEntries = credible
        .slice(-4, -1)
        .reverse()
        .filter((e) => e.taxonId !== heroEntry.taxonId);

      // Deduplicate and resolve images for the 7 selected birds
      const allEntries = [...commonEntries, ...uncommonEntries, heroEntry];
      const uniqueEntries = [...new Map(allEntries.map((e) => [e.taxonId, e])).values()];

      const resolved = await Promise.all(
        uniqueEntries.map(async (e) => {
          const imageUrl = await getWikimediaImage(e.scientificName);
          return {
            taxonId: e.taxonId,
            scientificName: e.scientificName,
            vernacularName: e.vernacularName,
            imageUrl,
            observationCount: e.observationCount,
          };
        }),
      );

      const byTaxon = new Map(
        resolved.filter((b) => b !== null).map((b) => [b.taxonId, b]),
      );

      const hero = byTaxon.get(heroEntry.taxonId) ?? null;
      const common = commonEntries
        .map((e) => byTaxon.get(e.taxonId))
        .filter((b) => b !== undefined);
      const uncommon = uncommonEntries
        .map((e) => byTaxon.get(e.taxonId))
        .filter((b) => b !== undefined);

      const result = { hero, common, uncommon };
      nearbyBirdsCache.set(cacheKey, { result, fetchedAt: Date.now() });
      return result;
    },

    speciesByScientificName: async (
      _: unknown,
      { scientificName, vernacularName }: { scientificName: string; vernacularName?: string },
    ) => {
      // Try to find existing species (case-insensitive)
      const existing = await prisma.species.findFirst({
        where: { scientificName: { equals: scientificName, mode: "insensitive" } },
      });
      if (existing) return existing;

      // Upsert if we have a vernacular name (e.g. from nearby birds)
      if (vernacularName) {
        return await prisma.species.create({
          data: { scientificName, swedishName: vernacularName },
        });
      }

      return null;
    },

    speciesRarity: async (
      _: unknown,
      { scientificName, latitude, longitude }: { scientificName: string; latitude: number; longitude: number },
    ) => {
      const distribution = await getAreaDistribution(latitude, longitude);
      return calculateSpeciesRarity(scientificName, distribution);
    },

    myLifeList: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context.user);

      const grouped = await prisma.sighting.groupBy({
        where: { userId: user.id },
        by: ["speciesId"],
        _count: {
          speciesId: true,
        },
        _min: {
          date: true,
        },
        _max: {
          date: true,
        },
      });

      const speciesIds = grouped.map((g) => g.speciesId);
      const speciesList = await prisma.species.findMany({
        where: { id: { in: speciesIds } },
      });

      const sightingsList = await prisma.sighting.findMany({
        where: { userId: user.id },
        select: { speciesId: true, date: true },
      });

      return grouped.map((g) => {
        const species = speciesList.find((s) => s.id === g.speciesId);
        const months = [
          ...new Set(
            sightingsList
              .filter((s) => s.speciesId === g.speciesId)
              .map((s) => s.date.getMonth() + 1),
          ),
        ];

        return {
          species,
          sightingCount: g._count.speciesId,
          firstSeenAt: g._min.date?.toISOString(),
          lastSeenAt: g._max.date?.toISOString(),
          months,
        };
      });
    },
  },

  Mutation: {
    register: async (_: unknown, { email, name, password }: RegisterArgs) => {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new GraphQLError("Email already in use");

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: { email, name, password: hashedPassword },
      });

      return { token: generateToken(user), user };
    },
    login: async (_: unknown, { email, password }: LoginArgs) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new GraphQLError("Invalid credentials");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new GraphQLError("Invalid credentials");

      return { token: generateToken(user), user };
    },
    createSighting: async (
      _: unknown,
      { speciesId, latitude, longitude, location, notes, date }: CreateSightingArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context.user);

      // Look up the species to get its scientificName for rarity calculation
      const species = await prisma.species.findUnique({ where: { id: speciesId } });

      // Compute rarity at creation time — snapshot of how rare this bird is here right now
      let rarityData: Record<string, unknown> = {};
      if (species) {
        try {
          const distribution = await getAreaDistribution(latitude, longitude);
          const rarity = calculateSpeciesRarity(species.scientificName, distribution);
          rarityData = {
            rarityLevel: rarity.level,
            rarityLabel: rarity.label,
            rarityDescription: rarity.description,
            rarityRank: rarity.rank,
            rarityObservations: rarity.observationCount,
            rarityTotalSpecies: rarity.totalSpeciesInArea,
          };
        } catch {
          // If rarity calculation fails (API down, rate limited), save sighting without it
        }
      }

      return await prisma.sighting.create({
        data: {
          speciesId,
          latitude,
          longitude,
          location,
          notes,
          date: new Date(date),
          userId: user.id,
          ...rarityData,
        },
        include: { species: true },
      });
    },
    updateSighting: async (
      _: unknown,
      { id, speciesId, latitude, longitude, location, notes, date }: UpdateSightingArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuth(context.user);
      const sighting = await prisma.sighting.findUnique({
        where: { id },
      });

      if (!sighting) throw new GraphQLError("Sighting not found.");

      if (sighting.userId !== user.id)
        throw new GraphQLError("Not authorized", {
          extensions: { code: "FORBIDDEN" },
        });

      const data: Record<string, unknown> = {};
      if (speciesId !== undefined) data.speciesId = speciesId;
      if (latitude !== undefined) data.latitude = latitude;
      if (longitude !== undefined) data.longitude = longitude;
      if (location !== undefined) data.location = location;
      if (notes !== undefined) data.notes = notes;
      if (date !== undefined) data.date = new Date(date);

      return await prisma.sighting.update({ where: { id }, data, include: { species: true } });
    },
    deleteSighting: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const user = requireAuth(context.user);
      const sighting = await prisma.sighting.findUnique({ where: { id } });

      if (!sighting) throw new GraphQLError("Sighting not found.");

      if (sighting.userId !== user.id)
        throw new GraphQLError("Not authorized", {
          extensions: { code: "FORBIDDEN" },
        });

      await prisma.sighting.delete({ where: { id } });

      return true;
    },
  },
};
