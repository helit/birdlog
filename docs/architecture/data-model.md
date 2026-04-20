# Data Model — BirdLog

Managed with Prisma ORM. Migrations in `packages/server/prisma/migrations/`.

## Entities

```
User
- id:        String (cuid), primary key
- email:     String, unique
- name:      String
- password:  String (bcrypt hash)
- createdAt: DateTime
- updatedAt: DateTime

Species
- id:             String (cuid), primary key
- swedishName:    String
- scientificName: String, unique
- englishName:    String?
- family:         String?
- description:    String?
- imageUrl:       String? (Wikimedia URL, proxied through /api/image-proxy)

Sighting
- id:                  String (cuid), primary key
- userId:              String → User.id
- speciesId:           String → Species.id
- latitude:            Float
- longitude:           Float
- location:            String?
- notes:               String?
- date:                DateTime
- rarityLevel:         String? (very_common | common | uncommon | rare | not_observed)
- rarityLabel:         String?
- rarityDescription:   String?
- rarityRank:          Int?
- rarityObservations:  Int?
- rarityTotalSpecies:  Int?
- createdAt:           DateTime
- updatedAt:           DateTime
```

## Relationships

```
User    1──* Sighting   (one user has many sightings)
Species 1──* Sighting   (one species appears in many sightings)
```

## Indexes

- `Sighting.userId` — for fetching a user's sighting list
- `Sighting.speciesId` — for species-level queries

## Notes

- Rarity fields on Sighting are snapshotted at time of logging from Artdatabanken data; they are not recomputed retroactively.
- Species images are stored as Wikimedia URLs and proxied server-side via `/api/image-proxy` to handle CORS.
- Species are upserted (not replaced) during the enrichment pipeline to avoid losing manually corrected data.
