import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $name: String!, $password: String!) {
    register(email: $email, name: $name, password: $password) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export const CREATE_SIGHTING = gql`
  mutation CreateSighting(
    $speciesId: ID!
    $latitude: Float!
    $longitude: Float!
    $date: String!
    $location: String
    $notes: String
  ) {
    createSighting(
      speciesId: $speciesId
      latitude: $latitude
      longitude: $longitude
      date: $date
      location: $location
      notes: $notes
    ) {
      id
      species {
        id
        swedishName
        scientificName
        englishName
        family
        description
        imageUrl
      }
      latitude
      longitude
      location
      notes
      date
      createdAt
    }
  }
`;

export const UPDATE_SIGHTING = gql`
  mutation UpdateSighting(
    $updateSightingId: ID!
    $speciesId: ID
    $latitude: Float
    $longitude: Float
    $location: String
    $notes: String
    $date: String
  ) {
    updateSighting(
      id: $updateSightingId
      speciesId: $speciesId
      latitude: $latitude
      longitude: $longitude
      location: $location
      notes: $notes
      date: $date
    ) {
      id
      species {
        id
        swedishName
        scientificName
        englishName
        family
        description
        imageUrl
      }
      latitude
      longitude
      location
      notes
      date
      createdAt
    }
  }
`;

export const DELETE_SIGHTING = gql`
  mutation DeleteSighting($deleteSightingId: ID!) {
    deleteSighting(id: $deleteSightingId)
  }
`;
