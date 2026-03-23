# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/
RUN npm ci

# Stage 2: Build client
FROM deps AS client-build
COPY packages/client/ ./packages/client/
COPY tsconfig.base.json ./
RUN npm run build --workspace=packages/client

# Stage 3: Build server
FROM deps AS server-build
COPY packages/server/ ./packages/server/
COPY tsconfig.base.json ./
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma
RUN npm run build --workspace=packages/server

# Stage 4: Production image
FROM node:20-slim AS production
WORKDIR /app

# Prisma needs OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
RUN npm ci --workspace=packages/server --omit=dev && npm install tsx

# Copy Prisma schema + migrations (for migrate deploy)
COPY packages/server/prisma/ ./packages/server/prisma/
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

# Copy built server
COPY --from=server-build /app/packages/server/dist/ ./packages/server/dist/

# Copy built client
COPY --from=client-build /app/packages/client/dist/ ./packages/client/dist/

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Run migrations then start server
CMD npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma && node packages/server/dist/index.js
