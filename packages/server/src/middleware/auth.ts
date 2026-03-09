import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";

const secret = process.env.JWT_SECRET!;
const prisma = new PrismaClient();

export interface AuthUser {
    id: string;
    email: string;
    name: string;
}

export interface GraphQLContext {
    user: AuthUser | null;
}

export const generateToken = (user: AuthUser) => {
    return jwt.sign({
       userId: user.id
    }, secret, { expiresIn: '72h' });
}

export const getContextUser = async (token?: string): Promise<AuthUser | null> => {
    if (!token) {
        return null;
    }

    const rawToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
        const decoded = jwt.verify(rawToken, secret) as {userId: string};
        const user = await prisma.user.findUnique({where: { id: decoded.userId }});

        if (!user) return null;

        return { id: user.id, email: user.email, name: user.name }
    } catch(error) {
        return null;
    }
}

export const requireAuth = (user: AuthUser | null): AuthUser => {
    if (!user) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED'}
        });
    }

    return user;
}