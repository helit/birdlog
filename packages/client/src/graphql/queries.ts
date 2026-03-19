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

export const MY_SIGHTINGS = gql`
  query MySightings {
    mySightings {
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

export const MY_SIGHTINGS_BY_SPECIES = gql`
  query MySightingsBySpecies($speciesId: ID!) {
    mySightingsBySpecies(speciesId: $speciesId) {
      id
      latitude
      longitude
      location
      notes
      date
      createdAt
    }
  }
`;

export const MY_LIFE_LIST = gql`
  query MyLifeList {
    myLifeList {
      species {
        id
        swedishName
        scientificName
        englishName
        family
        description
        imageUrl
      }
      sightingCount
      firstSeenAt
      lastSeenAt
      months
    }
  }
`;

export const NEARBY_BIRDS = gql`
  query NearbyBirds($latitude: Float!, $longitude: Float!) {
    nearbyBirds(latitude: $latitude, longitude: $longitude) {
      common {
        scientificName
        vernacularName
        imageUrl
        observationCount
      }
      rare {
        scientificName
        vernacularName
        imageUrl
        observationCount
      }
    }
  }
`;
