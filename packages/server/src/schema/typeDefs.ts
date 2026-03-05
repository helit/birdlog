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

  type Query {
    species: [Species!]!
    speciesById(id: ID!): Species
    searchSpecies(query: String!): [Species!]!
  }
`;
