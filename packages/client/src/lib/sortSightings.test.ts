import { describe, it, expect } from "vitest";
import { sortSightings, isDateSort, SORT_OPTIONS } from "./sortSightings";
import type { Sighting } from "../utils/types";

function makeSighting(overrides: Partial<Sighting> & { id: string }): Sighting {
  return {
    latitude: 59.3,
    longitude: 18.0,
    location: null,
    notes: null,
    date: "2024-06-01",
    species: {
      id: "sp1",
      swedishName: "Koltrast",
      scientificName: "Turdus merula",
    },
    createdAt: "2024-06-01T12:00:00Z",
    ...overrides,
  };
}

describe("SORT_OPTIONS", () => {
  it("contains exactly 4 entries", () => {
    expect(SORT_OPTIONS).toHaveLength(4);
  });

  it("first entry is date-desc", () => {
    expect(SORT_OPTIONS[0].key).toBe("date-desc");
  });

  it("all entries have key and label", () => {
    for (const opt of SORT_OPTIONS) {
      expect(opt).toHaveProperty("key");
      expect(opt).toHaveProperty("label");
    }
  });
});

describe("isDateSort", () => {
  it("returns true for date-desc", () => {
    expect(isDateSort("date-desc")).toBe(true);
  });

  it("returns true for date-asc", () => {
    expect(isDateSort("date-asc")).toBe(true);
  });

  it("returns false for species-asc", () => {
    expect(isDateSort("species-asc")).toBe(false);
  });

  it("returns false for location-asc", () => {
    expect(isDateSort("location-asc")).toBe(false);
  });
});

describe("sortSightings", () => {
  describe("date-desc", () => {
    it("sorts newest first", () => {
      const sightings = [
        makeSighting({ id: "1", date: "2024-01-01" }),
        makeSighting({ id: "2", date: "2024-06-01" }),
        makeSighting({ id: "3", date: "2023-12-01" }),
      ];
      const result = sortSightings(sightings, "date-desc");
      expect(result.map((s) => s.date)).toEqual(["2024-06-01", "2024-01-01", "2023-12-01"]);
    });

    it("breaks date ties by higher id first", () => {
      const sightings = [
        makeSighting({ id: "1", date: "2024-06-01" }),
        makeSighting({ id: "3", date: "2024-06-01" }),
        makeSighting({ id: "2", date: "2024-06-01" }),
      ];
      const result = sortSightings(sightings, "date-desc");
      expect(result.map((s) => s.id)).toEqual(["3", "2", "1"]);
    });

    it("does not mutate the input array", () => {
      const sightings = [
        makeSighting({ id: "2", date: "2024-01-01" }),
        makeSighting({ id: "1", date: "2024-06-01" }),
      ];
      const original = [...sightings];
      sortSightings(sightings, "date-desc");
      expect(sightings).toEqual(original);
    });
  });

  describe("date-asc", () => {
    it("sorts oldest first", () => {
      const sightings = [
        makeSighting({ id: "1", date: "2024-06-01" }),
        makeSighting({ id: "2", date: "2023-01-01" }),
        makeSighting({ id: "3", date: "2024-01-01" }),
      ];
      const result = sortSightings(sightings, "date-asc");
      expect(result.map((s) => s.date)).toEqual(["2023-01-01", "2024-01-01", "2024-06-01"]);
    });
  });

  describe("species-asc", () => {
    it("sorts by Swedish name using Swedish locale (Å/Ä/Ö after Z)", () => {
      const sightings = [
        makeSighting({ id: "1", species: { id: "s1", swedishName: "Ärla", scientificName: "a" } }),
        makeSighting({ id: "2", species: { id: "s2", swedishName: "Björk", scientificName: "b" } }),
        makeSighting({ id: "3", species: { id: "s3", swedishName: "Anka", scientificName: "c" } }),
        makeSighting({ id: "4", species: { id: "s4", swedishName: "Örnök", scientificName: "d" } }),
      ];
      const result = sortSightings(sightings, "species-asc");
      expect(result.map((s) => s.species.swedishName)).toEqual(["Anka", "Björk", "Ärla", "Örnök"]);
    });
  });

  describe("location-asc", () => {
    it("sorts named locations A–Ö using Swedish locale", () => {
      const sightings = [
        makeSighting({ id: "1", location: "Öster", date: "2024-01-01" }),
        makeSighting({ id: "2", location: "Berga", date: "2024-01-02" }),
        makeSighting({ id: "3", location: "Ängby", date: "2024-01-03" }),
      ];
      const result = sortSightings(sightings, "location-asc");
      expect(result.map((s) => s.location)).toEqual(["Berga", "Ängby", "Öster"]);
    });

    it("pushes null locations to the end", () => {
      const sightings = [
        makeSighting({ id: "1", location: null, date: "2024-01-01" }),
        makeSighting({ id: "2", location: "Berga", date: "2024-01-02" }),
      ];
      const result = sortSightings(sightings, "location-asc");
      expect(result.map((s) => s.location)).toEqual(["Berga", null]);
    });

    it("pushes empty string locations to the end", () => {
      const sightings = [
        makeSighting({ id: "1", location: "", date: "2024-01-01" }),
        makeSighting({ id: "2", location: "Berga", date: "2024-01-02" }),
      ];
      const result = sortSightings(sightings, "location-asc");
      expect(result.map((s) => s.location)).toEqual(["Berga", ""]);
    });
  });
});
