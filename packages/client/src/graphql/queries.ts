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
      rarityLevel
      rarityLabel
      rarityDescription
      rarityRank
      rarityObservations
      rarityTotalSpecies
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

export const MY_STATS = gql`
  query MyStats {
    myStats {
      totalSightings
      uniqueSpecies
      memberSince
    }
  }
`;

export const SPECIES_BY_SCIENTIFIC_NAME = gql`
  query SpeciesByScientificName($scientificName: String!, $vernacularName: String) {
    speciesByScientificName(scientificName: $scientificName, vernacularName: $vernacularName) {
      id
      swedishName
      scientificName
      englishName
      family
      description
      imageUrl
    }
  }
`;

export const SPECIES_RARITY = gql`
  query SpeciesRarity($scientificName: String!, $latitude: Float!, $longitude: Float!) {
    speciesRarity(scientificName: $scientificName, latitude: $latitude, longitude: $longitude) {
      level
      label
      description
      observationCount
      totalSpeciesInArea
      rank
    }
  }
`;

export const NEARBY_BIRDS = gql`
  query NearbyBirds($latitude: Float!, $longitude: Float!, $force: Boolean) {
    nearbyBirds(latitude: $latitude, longitude: $longitude, force: $force) {
      hero {
        scientificName
        vernacularName
        imageUrl
        observationCount
      }
      common {
        scientificName
        vernacularName
        imageUrl
        observationCount
      }
      uncommon {
        scientificName
        vernacularName
        imageUrl
        observationCount
      }
    }
  }
`;
