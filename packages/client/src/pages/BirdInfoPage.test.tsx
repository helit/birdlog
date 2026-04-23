import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import BirdInfoPage from "./BirdInfoPage";

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
}));

vi.mock("@/components/RarityBadge", () => ({
  default: () => null,
}));

import { useQuery } from "@apollo/client";
const mockUseQuery = vi.mocked(useQuery);

const SPECIES = {
  id: "s1",
  swedishName: "Talgoxe",
  scientificName: "Parus major",
  englishName: "Great Tit",
  family: "Mesar",
  description: null,
  imageUrl: null,
};

function renderPage() {
  Object.defineProperty(global.navigator, "geolocation", {
    value: { getCurrentPosition: vi.fn() },
    configurable: true,
  });
  return render(
    <MemoryRouter initialEntries={["/bird/Parus%20major"]}>
      <Routes>
        <Route path="/bird/:scientificName" element={<BirdInfoPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockUseQuery.mockReturnValue({
    data: { speciesByScientificName: SPECIES },
    loading: false,
    error: undefined,
  } as unknown as ReturnType<typeof useQuery>);
});

afterEach(cleanup);

describe("BirdInfoPage", () => {
  it("renders the hero image container with aspect-[4/3] and without fixed size-20", () => {
    const { container } = renderPage();
    const hero = container.querySelector('[data-testid="bird-hero-image"]');
    expect(hero).not.toBeNull();
    expect(hero!.className).toContain("aspect-[4/3]");
    expect(hero!.className).not.toContain("size-20");
  });
});
