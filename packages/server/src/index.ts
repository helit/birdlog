import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { getContextUser, GraphQLContext } from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 4000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

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
  cors<cors.CorsRequest>({ origin: allowedOrigins }),
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

app.listen(port, () => {
  console.log(`🐦 BirdLog server running at http://localhost:${port}/graphql`);
});
