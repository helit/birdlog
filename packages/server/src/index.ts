import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";

const app = express();
const port = process.env.PORT || 4000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  "/graphql",
  cors<cors.CorsRequest>({
    origin: ["http://localhost:5173", "http://localhost:3000"],
  }),
  express.json(),
  expressMiddleware(server)
);

app.listen(port, () => {
  console.log(`🐦 BirdLog server running at http://localhost:${port}/graphql`);
});
