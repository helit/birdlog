// Shared types between client and server

export interface SpeciesData {
  id: string;
  swedishName: string;
  scientificName: string;
  englishName?: string | null;
  family?: string | null;
  description?: string | null;
  imageUrl?: string | null;
}

export interface SightingData {
  id: string;
  species: SpeciesData;
  latitude: number;
  longitude: number;
  location?: string | null;
  notes?: string | null;
  date: string;
  createdAt: string;
}
