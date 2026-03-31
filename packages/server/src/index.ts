import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { getContextUser, GraphQLContext } from "./middleware/auth.js";
import { identifyBird, identifyBirdFromDescription } from "./services/openai.js";
import { enrichBirdCandidates } from "./services/speciesEnrichment.js";
import { classifyIdentifyError } from "./utils/errors.js";
import { PrismaClient } from "@prisma/client";

// Fail fast if required env vars are missing
const REQUIRED_ENV = ["JWT_SECRET", "OPENAI_API_KEY", "ARTDATABANKEN_API_KEY"] as const;
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 4000;

// --- Production hardening middleware ---

// Security headers (disable CSP in dev so Vite HMR works)
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
}));

// Gzip compression
app.use(compression() as unknown as express.RequestHandler);

// Request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// General rate limit: 100 req/min per IP
const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", generalLimiter as unknown as express.RequestHandler);
app.use("/graphql", generalLimiter as unknown as express.RequestHandler);

// Stricter limit for identify endpoints (expensive OpenAI calls)
const identifyLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limit", message: "Too many identification requests. Try again shortly." },
});
app.use("/api/identify", identifyLimiter as unknown as express.RequestHandler);

// Health check (before auth/CORS — always accessible)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://birdlog.henlit.se"]
    : true;

// CORS for all /api routes (handles preflight OPTIONS automatically)
app.use("/api", cors<cors.CorsRequest>({ origin: allowedOrigins as cors.CorsOptions["origin"] }));

app.use(
  "/graphql",
  cors<cors.CorsRequest>({ origin: allowedOrigins }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }): Promise<GraphQLContext> => {
      const token = req.headers.authorization;
      const user = await getContextUser(token);
      return { user };
    },
  }),
);

app.get(
  "/api/image-proxy",
  async (req, res) => {
    const url = req.query.url as string;
    if (!url || !url.startsWith("https://upload.wikimedia.org/")) {
      res.status(400).send("Invalid URL");
      return;
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "BirdLog/1.0 (henrik@henlit.se)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      res.status(response.status).send("Failed to fetch image");
      return;
    }

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  },
);

app.post(
  "/api/identify",
  express.json({ limit: "10mb" }),
  async (req, res) => {
    const { imageData, latitude, longitude } = req.body as {
      imageData: string;
      latitude?: number;
      longitude?: number;
    };

    if (!imageData || !imageData.startsWith("data:image/")) {
      res.status(400).json({ error: "Invalid image data" });
      return;
    }

    // Parse data URL: "data:image/jpeg;base64,/9j/4AAQ..."
    const matches = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ error: "Invalid data URL format" });
      return;
    }

    const mediaType = matches[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    const base64Data = matches[2];

    try {
      console.log(`Identifying bird — mediaType: ${mediaType}, base64 length: ${base64Data.length}`);
      const month = new Date().getMonth() + 1;
      const results = await identifyBird(base64Data, mediaType, { month, latitude, longitude });
      console.log("Identification results:", JSON.stringify(results, null, 2));

      // Enrich results: upsert species so every identified bird gets a DB record
      const enriched = await enrichBirdCandidates(results, prisma);

      res.json({ results: enriched });
    } catch (error) {
      console.error("Identification failed:", error);
      const { status, message } = classifyIdentifyError(error);
      res.status(status).json({ error: message });
    }
  },
);

app.post(
  "/api/identify/guided",
  express.json(),
  async (req, res) => {
    const { size, colors, habitat, notes, latitude, longitude } = req.body as {
      size: string;
      colors: string[];
      habitat: string;
      notes?: string;
      latitude?: number;
      longitude?: number;
    };

    if (!size || !colors?.length || !habitat) {
      res.status(400).json({ error: "Missing required fields: size, colors, habitat" });
      return;
    }

    const month = new Date().getMonth() + 1;

    try {
      const { candidates, tip } = await identifyBirdFromDescription({ size, colors, habitat, notes, month, latitude, longitude });
      console.log("Guided identification results:", JSON.stringify(candidates, null, 2));

      const enriched = await enrichBirdCandidates(candidates, prisma);

      res.json({ results: enriched, tip });
    } catch (error) {
      console.error("Guided identification failed:", error);
      const { status, message } = classifyIdentifyError(error);
      res.status(status).json({ error: message });
    }
  },
);

// In production, serve the client build
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const httpServer = app.listen(port, () => {
  console.log(`🐦 BirdLog server running at http://localhost:${port}/graphql`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully`);
  httpServer.close(() => {
    console.log("HTTP server closed");
  });
  await prisma.$disconnect();
  await server.stop();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
