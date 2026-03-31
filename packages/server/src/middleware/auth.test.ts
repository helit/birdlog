import { describe, it, expect } from "vitest";
import { GraphQLError } from "graphql";
import { requireAuth, type AuthUser } from "./auth.js";

describe("requireAuth", () => {
  it("returns the user when authenticated", () => {
    const user: AuthUser = { id: "1", email: "test@test.se", name: "Test" };
    expect(requireAuth(user)).toBe(user);
  });

  it("throws UNAUTHENTICATED when user is null", () => {
    expect(() => requireAuth(null)).toThrow(GraphQLError);
    try {
      requireAuth(null);
    } catch (e) {
      expect(e).toBeInstanceOf(GraphQLError);
      expect((e as GraphQLError).extensions.code).toBe("UNAUTHENTICATED");
    }
  });
});
