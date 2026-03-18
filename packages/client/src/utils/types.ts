export interface Species {
  id: string;
  swedishName: string;
  scientificName: string;
  englishName?: string | null;
  family?: string | null;
  description?: string | null;
}

export interface Sighting {
  id: string;
  latitude: number;
  longitude: number;
  location?: string | null;
  notes?: string | null;
  date: string;
  species: Species;
  createdAt: string;
}

export interface SightingBySpecies {
  id: string;
  latitude: number;
  longitude: number;
  location?: string | null;
  notes?: string | null;
  date: string;
  createdAt: string;
}

export interface MyLifeList {
  species: Species;
  sightingCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  months: number[];
}
