import { gql } from "@apollo/client";

export const GET_ALL_SPECIES = gql`
  query GetAllSpecies {
    species {
      id
      swedishName
      scientificName
      englishName
      family
      description
    }
  }
`;

export const SEARCH_SPECIES = gql`
  query SearchSpecies($query: String!) {
    searchSpecies(query: $query) {
      id
      swedishName
      scientificName
      englishName
      family
      description
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
    }
  }
`;
