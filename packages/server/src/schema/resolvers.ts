import { PrismaClient } from "@prisma/client";
import { generateToken, GraphQLContext, requireAuth } from "../middleware/auth.js";
import { GraphQLError } from "graphql";
import bcrypt from "bcrypt";

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

export const resolvers = {
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

      return await prisma.sighting.create({
        data: {
          speciesId,
          latitude,
          longitude,
          location,
          notes,
          date: new Date(date),
          userId: user.id,
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
