import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { FagelbokFamilyPage } from "./FagelbokFamilyPage";

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
}));

vi.mock("@/graphql/queries", () => ({
  GET_FAMILY_BY_SLUG: "GET_FAMILY_BY_SLUG_QUERY",
}));

import { useQuery } from "@apollo/client";
const mockUseQuery = vi.mocked(useQuery);

function renderPage(path = "/guidebook/family/paridae") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/guidebook/family/:familySlug" element={<FagelbokFamilyPage />} />
        <Route path="/bird/:scientificName" element={<div data-testid="bird-page" />} />
        <Route path="/guidebook" element={<div data-testid="guidebook" />} />
      </Routes>
    </MemoryRouter>,
  );
}

const FAMILY_DATA = {
  family: {
    slug: "paridae",
    swedishName: "Mesar",
    scientificName: "Paridae",
    order: { slug: "passeriformes", swedishName: "Tättingar", scientificName: "Passeriformes" },
  },
  species: [
    { id: "a", swedishName: "Talgoxe", scientificName: "Parus major" },
    { id: "b", swedishName: "Blåmes", scientificName: "Cyanistes caeruleus" },
  ],
};

beforeEach(() => mockUseQuery.mockReset());
afterEach(() => cleanup());

describe("FagelbokFamilyPage", () => {
  it("renders family header and species list", () => {
    mockUseQuery.mockReturnValue({
      data: { family: FAMILY_DATA },
      loading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useQuery>);

    renderPage();

    expect(screen.getByRole("heading", { name: /Mesar/ })).toBeInTheDocument();
    expect(screen.getByText("Paridae")).toBeInTheDocument();
    expect(screen.getByText("Talgoxe")).toBeInTheDocument();
    expect(screen.getByText("Blåmes")).toBeInTheDocument();
  });

  it("renders 404 card when family is unknown", () => {
    mockUseQuery.mockReturnValue({
      data: { family: null },
      loading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useQuery>);

    renderPage();

    expect(screen.getByText("Familjen finns inte.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Till Fågelboken/ })).toHaveAttribute(
      "href",
      "/guidebook",
    );
  });

  it("navigates to /bird/:scientificName when a species row is tapped", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: { family: FAMILY_DATA },
      loading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useQuery>);

    renderPage();
    await user.click(screen.getByText("Talgoxe"));
    expect(screen.getByTestId("bird-page")).toBeInTheDocument();
  });
});
