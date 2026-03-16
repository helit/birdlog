export interface Species {
  id: string;
  swedishName: string;
  scientificName: string;
  englishName?: string | null;
  family?: string | null;
  description?: string | null;
}

export interface Sighting {
  createdAt: string;
  date: string;
  id: string;
  latitude: number;
  longitude: number;
  location?: string | null;
  notes?: string | null;
  species: Species;
}
