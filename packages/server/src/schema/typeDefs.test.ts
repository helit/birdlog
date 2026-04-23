import { describe, it, expect } from "vitest";
import { buildASTSchema, graphql, getIntrospectionQuery, IntrospectionQuery } from "graphql";
import { typeDefs } from "./typeDefs.js";

async function introspect(): Promise<IntrospectionQuery> {
  const schema = buildASTSchema(typeDefs);
  const result = await graphql({ schema, source: getIntrospectionQuery() });
  return result.data as unknown as IntrospectionQuery;
}

describe("Fågelbok GraphQL schema", () => {
  it("defines the Order, Family, OrderDetail, FamilyDetail types", async () => {
    const data = await introspect();
    const typeNames = data.__schema.types.map((t) => t.name);
    expect(typeNames).toContain("Order");
    expect(typeNames).toContain("Family");
    expect(typeNames).toContain("OrderDetail");
    expect(typeNames).toContain("FamilyDetail");
  });

  it("defines allOrders, order(slug), family(slug), speciesSearch on Query", async () => {
    const data = await introspect();
    const queryType = data.__schema.types.find((t) => t.name === "Query");
    expect(queryType).toBeDefined();
    const fieldNames = (queryType as unknown as { fields: Array<{ name: string }> }).fields.map(
      (f) => f.name,
    );
    expect(fieldNames).toContain("allOrders");
    expect(fieldNames).toContain("order");
    expect(fieldNames).toContain("family");
    expect(fieldNames).toContain("speciesSearch");
  });

  it("Family.order links to Order", async () => {
    const data = await introspect();
    const familyType = data.__schema.types.find((t) => t.name === "Family") as unknown as {
      fields: Array<{ name: string; type: { kind: string; ofType?: { name: string } } }>;
    };
    const orderField = familyType.fields.find((f) => f.name === "order");
    expect(orderField).toBeDefined();
    expect(orderField!.type.ofType?.name).toBe("Order");
  });
});
