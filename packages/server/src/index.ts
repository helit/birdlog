import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { getContextUser, GraphQLContext } from "./middleware/auth.js";
import { identifyBird, identifyBirdFromDescription } from "./services/openai.js";
import { getWikimediaImage } from "./services/artdatabanken.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 4000;

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
      const enriched = await Promise.all(
        results.map(async (bird) => {
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

      res.json({ results: enriched });
    } catch (error) {
      console.error("Identification failed:", error);
      res.status(500).json({ error: "Identification failed" });
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

      const enriched = await Promise.all(
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

      res.json({ results: enriched, tip });
    } catch (error) {
      console.error("Guided identification failed:", error);
      res.status(500).json({ error: "Identification failed" });
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

app.listen(port, () => {
  console.log(`🐦 BirdLog server running at http://localhost:${port}/graphql`);
});
