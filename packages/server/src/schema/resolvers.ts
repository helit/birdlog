import { PrismaClient } from "@prisma/client";
import { generateToken, GraphQLContext } from "../middleware/auth.js";
import { GraphQLError } from "graphql";
import bcrypt from 'bcrypt';

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

    me: (_: unknown, __: unknown, context: GraphQLContext) => {
      return context.user;
    }
  },

  Mutation: {
    register: async (_: unknown, { email, name, password }: RegisterArgs, context: GraphQLContext) => {
      const existing = await prisma.user.findUnique({ where: { email }});
      if (existing) throw new GraphQLError('Email already in use');

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: { email, name, password: hashedPassword },
      })

      return { token: generateToken(user), user }
    },
    login: async (_: unknown, { email, password }: LoginArgs, context: GraphQLContext) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new GraphQLError('Invalid credentials');

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new GraphQLError('Invalid credentials');

      return { token: generateToken(user), user };
    }
  }
};
