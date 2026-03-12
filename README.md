# BirdLog — Setup Guide

## 1. Copy the project to your projects folder

```bash
cp -r ~/path/to/birdlog ~/code/projects/birdlog
cd ~/code/projects/birdlog
```

## 2. Start the database

Make sure Docker Desktop is running (check the menu bar icon), then:

```bash
docker compose up -d
```

This starts PostgreSQL + PostGIS in the background. The `-d` flag means it runs detached (you get your terminal back). The database persists between restarts thanks to the Docker volume.

To check it's running: `docker compose ps`
To stop it later: `docker compose down`

## 3. Install dependencies

From the project root:

```bash
npm install
```

This installs dependencies for all three packages (client, server, shared) thanks to npm workspaces.

## 4. Set up the database schema

```bash
cd packages/server
npx prisma migrate dev --name init
```

This creates the database tables from the Prisma schema. Prisma will ask you to name the migration — "init" is fine for the first one.

## 5. Seed the database with Swedish birds

```bash
npx prisma db seed
```

This populates the Species table with 55 common Swedish birds.

## 6. Start the dev servers

Go back to the project root and run:

```bash
cd ../..
npm run dev
```

This starts both:
- **GraphQL server** at http://localhost:4000/graphql
- **React client** at http://localhost:5173

## 7. Verify it works

Open http://localhost:5173 in your browser. You should see "BirdLog" with a search bar and a list of Swedish bird species. Try searching for "mes" or "hackspett".

You can also open http://localhost:4000/graphql to access Apollo Server's GraphQL playground and run queries manually.

## Useful commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start both client and server |
| `npm run dev:server` | Start only the server |
| `npm run dev:client` | Start only the client |
| `npm run db:studio` | Open Prisma Studio (visual database browser) |
| `npm run db:migrate` | Run pending database migrations |
| `npm run db:seed` | Re-seed the database |
| `docker compose up -d` | Start the database |
| `docker compose down` | Stop the database |
