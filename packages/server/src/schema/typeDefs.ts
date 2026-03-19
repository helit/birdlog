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

  type BirdOfTheDay {
    scientificName: String!
    vernacularName: String!
    imageUrl: String
    observationCount: Int!
  }

  type Query {
    species: [Species!]!
    speciesById(id: ID!): Species
    searchSpecies(query: String!): [Species!]!
    me: User
    mySightings: [Sighting!]!
    mySightingsBySpecies(speciesId: ID!): [Sighting!]!
    myLifeList: [LifeListEntry!]!
    birdOfTheDay(latitude: Float!, longitude: Float!): BirdOfTheDay
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
