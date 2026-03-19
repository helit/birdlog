import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { getContextUser, GraphQLContext } from "./middleware/auth.js";
import { identifyBird } from "./services/claude.js";

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
    const { imageData } = req.body as { imageData: string };

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
      const results = await identifyBird(base64Data, mediaType);
      console.log("Identification results:", JSON.stringify(results, null, 2));
      res.json({ results });
    } catch (error) {
      console.error("Identification failed:", error);
      res.status(500).json({ error: "Identification failed" });
    }
  },
);

app.listen(port, () => {
  console.log(`🐦 BirdLog server running at http://localhost:${port}/graphql`);
});
