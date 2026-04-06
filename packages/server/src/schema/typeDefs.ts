import gql from "graphql-tag";

export const typeDefs = gql`
  type Species {
    id: ID!
    swedishName: String!
    scientificName: String!
    englishName: String
    family: String
    description: String
    imageUrl: String
  }

  type Sighting {
    id: ID!
    species: Species!
    latitude: Float!
    longitude: Float!
    location: String
    notes: String
    date: String!
    createdAt: String!
    rarityLevel: String
    rarityLabel: String
    rarityDescription: String
    rarityRank: Int
    rarityObservations: Int
    rarityTotalSpecies: Int
  }

  type User {
    id: ID!
    email: String!
    name: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type LifeListEntry {
    species: Species!
    sightingCount: Int!
    firstSeenAt: String!
    lastSeenAt: String!
    months: [Int!]!
  }

  type NearbyBird {
    scientificName: String!
    vernacularName: String!
    imageUrl: String
    observationCount: Int!
  }

  type NearbyBirdsResult {
    hero: NearbyBird
    common: [NearbyBird!]!
    uncommon: [NearbyBird!]!
  }

  type UserStats {
    totalSightings: Int!
    uniqueSpecies: Int!
    memberSince: String!
  }

  type SpeciesRarity {
    level: String!
    label: String!
    description: String!
    observationCount: Int
    totalSpeciesInArea: Int!
    rank: Int
  }

  type Query {
    species: [Species!]!
    speciesById(id: ID!): Species
    searchSpecies(query: String!): [Species!]!
    me: User
    mySightings: [Sighting!]!
    mySightingsBySpecies(speciesId: ID!): [Sighting!]!
    myLifeList: [LifeListEntry!]!
    nearbyBirds(latitude: Float!, longitude: Float!, force: Boolean): NearbyBirdsResult!
    speciesByScientificName(scientificName: String!, vernacularName: String): Species
    myStats: UserStats!
    speciesRarity(scientificName: String!, latitude: Float!, longitude: Float!): SpeciesRarity!
  }

  type Mutation {
    register(email: String!, name: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createSighting(
      speciesId: ID!
      latitude: Float!
      longitude: Float!
      location: String
      notes: String
      date: String!
    ): Sighting!
    updateSighting(
      id: ID!
      speciesId: ID
      latitude: Float
      longitude: Float
      location: String
      notes: String
      date: String
    ): Sighting!
    deleteSighting(id: ID!): Boolean!
  }
`;
