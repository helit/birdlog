import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { FagelbokOrderPage } from "./FagelbokOrderPage";

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
}));

vi.mock("@/graphql/queries", () => ({
  GET_ORDER_BY_SLUG: "GET_ORDER_BY_SLUG_QUERY",
}));

import { useQuery } from "@apollo/client";
const mockUseQuery = vi.mocked(useQuery);

function renderPage(path = "/guidebook/order/passeriformes") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/guidebook/order/:orderSlug" element={<FagelbokOrderPage />} />
        <Route
          path="/guidebook/family/:familySlug"
          element={<div data-testid="family-page" />}
        />
        <Route path="/guidebook" element={<div data-testid="guidebook" />} />
      </Routes>
    </MemoryRouter>,
  );
}

const ORDER_DATA = {
  order: { slug: "passeriformes", swedishName: "Tättingar", scientificName: "Passeriformes" },
  families: [
    { slug: "paridae", swedishName: "Mesar", scientificName: "Paridae" },
    { slug: "fringillidae", swedishName: "Finkar", scientificName: "Fringillidae" },
  ],
};

beforeEach(() => mockUseQuery.mockReset());
afterEach(() => cleanup());

describe("FagelbokOrderPage", () => {
  it("renders the order header and family list", () => {
    mockUseQuery.mockReturnValue({
      data: { order: ORDER_DATA },
      loading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useQuery>);

    renderPage();

    expect(screen.getByRole("heading", { name: /Tättingar/ })).toBeInTheDocument();
    expect(screen.getByText("Passeriformes")).toBeInTheDocument();
    expect(screen.getByText("Mesar")).toBeInTheDocument();
    expect(screen.getByText("Finkar")).toBeInTheDocument();
  });

  it("renders a 404 card with 'Till Fågelboken' link when the slug is unknown", () => {
    mockUseQuery.mockReturnValue({
      data: { order: null },
      loading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useQuery>);

    renderPage();

    expect(screen.getByText("Ordningen finns inte.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Till Fågelboken/ })).toHaveAttribute(
      "href",
      "/guidebook",
    );
  });

  it("navigates to /guidebook/family/:familySlug when a family row is tapped", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: { order: ORDER_DATA },
      loading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useQuery>);

    renderPage();

    await user.click(screen.getByText("Mesar"));
    expect(screen.getByTestId("family-page")).toBeInTheDocument();
  });

  it("renders back chevron that calls navigate(-1)", () => {
    mockUseQuery.mockReturnValue({
      data: { order: ORDER_DATA },
      loading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useQuery>);

    renderPage();
    expect(screen.getByRole("button", { name: /tillbaka/i })).toBeInTheDocument();
  });
});
