import { describe, it, expect } from "vitest";
import {
  GET_ALL_ORDERS,
  GET_ORDER_BY_SLUG,
  GET_FAMILY_BY_SLUG,
  SPECIES_SEARCH,
} from "./queries";

function printQuery(doc: { loc?: { source: { body: string } } }): string {
  return doc.loc?.source.body ?? "";
}

describe("Fågelbok GraphQL queries", () => {
  it("GET_ALL_ORDERS compiles and selects only slug + names", () => {
    const src = printQuery(GET_ALL_ORDERS);
    expect(src).toContain("allOrders");
    expect(src).toContain("slug");
    expect(src).toContain("swedishName");
    expect(src).toContain("scientificName");
  });

  it("GET_ORDER_BY_SLUG compiles with slug argument", () => {
    const src = printQuery(GET_ORDER_BY_SLUG);
    expect(src).toContain("order(slug:");
    expect(src).toContain("families");
  });

  it("GET_FAMILY_BY_SLUG compiles and requests species with minimal fields", () => {
    const src = printQuery(GET_FAMILY_BY_SLUG);
    expect(src).toContain("family(slug:");
    expect(src).toContain("species");
    expect(src).toContain("swedishName");
    expect(src).toContain("scientificName");
    // must NOT select imageUrl or description (browse path never triggers Wikipedia/Wikimedia)
    expect(src).not.toContain("imageUrl");
    expect(src).not.toContain("description");
  });

  it("SPECIES_SEARCH compiles and selects only id + names on Species", () => {
    const src = printQuery(SPECIES_SEARCH);
    expect(src).toContain("speciesSearch(query:");
    expect(src).toContain("swedishName");
    expect(src).toContain("scientificName");
    expect(src).not.toContain("imageUrl");
    expect(src).not.toContain("description");
  });
});
