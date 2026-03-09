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

  type Query {
    species: [Species!]!
    speciesById(id: ID!): Species
    searchSpecies(query: String!): [Species!]!
    me: User
  }

  type Mutation {
    register(email: String!, name: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
  }
`;
