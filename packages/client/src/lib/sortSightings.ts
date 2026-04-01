import type { Sighting } from "../utils/types";

export type SortKey = "date-desc" | "date-asc" | "species-asc" | "location-asc";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date-desc", label: "Nyast först" },
  { key: "date-asc", label: "Äldst först" },
  { key: "species-asc", label: "Art (A–Ö)" },
  { key: "location-asc", label: "Plats (A–Ö)" },
];

export function isDateSort(sort: SortKey): boolean {
  return sort === "date-desc" || sort === "date-asc";
}

export function sortSightings(sightings: Sighting[], sort: SortKey): Sighting[] {
  const copy = [...sightings];

  switch (sort) {
    case "date-desc":
      return copy.sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date);
        if (dateDiff !== 0) return dateDiff;
        return Number(b.id) - Number(a.id);
      });

    case "date-asc":
      return copy.sort((a, b) => a.date.localeCompare(b.date));

    case "species-asc":
      return copy.sort((a, b) =>
        a.species.swedishName.localeCompare(b.species.swedishName, "sv")
      );

    case "location-asc":
      return copy.sort((a, b) => {
        const aLoc = a.location ?? "";
        const bLoc = b.location ?? "";
        const aEmpty = aLoc === "";
        const bEmpty = bLoc === "";
        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return 1;
        if (bEmpty) return -1;
        return aLoc.localeCompare(bLoc, "sv");
      });
  }
}
