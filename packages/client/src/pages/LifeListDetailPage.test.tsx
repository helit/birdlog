import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LifeListDetailPage from "./LifeListDetailPage";

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
}));

vi.mock("@/components/SightingMap", () => ({
  default: () => <div data-testid="sighting-map" />,
}));

import { useQuery } from "@apollo/client";
const mockUseQuery = vi.mocked(useQuery);

const LIFE_LIST_ENTRY = {
  species: {
    id: "s1",
    swedishName: "Talgoxe",
    scientificName: "Parus major",
    englishName: "Great Tit",
    family: "Mesar",
    description: "Talgoxen är en liten tätting i familjen mesar.",
    imageUrl: null,
  },
  sightingCount: 3,
  firstSeenAt: "2025-01-01T00:00:00.000Z",
  lastSeenAt: "2025-06-01T00:00:00.000Z",
  months: [1, 6],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/life-list/s1", state: { lifeList: LIFE_LIST_ENTRY } }]}>
      <Routes>
        <Route path="/life-list/:speciesId" element={<LifeListDetailPage />} />
        <Route path="/bird/:scientificName" element={<div data-testid="bird-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockUseQuery.mockReturnValue({
    data: { mySightingsBySpecies: [] },
    loading: false,
    error: undefined,
  } as unknown as ReturnType<typeof useQuery>);
});

afterEach(() => cleanup());

describe("LifeListDetailPage", () => {
  it("does NOT render the species description paragraph", () => {
    renderPage();
    expect(
      screen.queryByText(/Talgoxen är en liten tätting/),
    ).not.toBeInTheDocument();
  });

  it("renders the species image in an aspect-[4/3] container", () => {
    renderPage();
    const container = document.querySelector('[data-testid="species-image-container"]');
    expect(container).not.toBeNull();
    expect(container!.className).toContain("aspect-[4/3]");
  });

  it("renders a 'Mer om arten' button linking to /bird/:scientificName", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /mer om arten/i });
    expect(link).toHaveAttribute("href", "/bird/Parus%20major");
  });
});
