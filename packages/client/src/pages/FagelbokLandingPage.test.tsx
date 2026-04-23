import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { FagelbokLandingPage } from "./FagelbokLandingPage";
import {
  getPersistedGuidebookQuery,
  setPersistedGuidebookQuery,
} from "@/lib/guidebookSearchState";

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
}));

vi.mock("@/graphql/queries", () => ({
  GET_ALL_ORDERS: "GET_ALL_ORDERS_QUERY",
  SPECIES_SEARCH: "SPECIES_SEARCH_QUERY",
}));

import { useQuery } from "@apollo/client";
const mockUseQuery = vi.mocked(useQuery);
type UseQueryReturn = ReturnType<typeof useQuery>;
type UseQueryImpl = (
  query: unknown,
  opts?: { variables?: Record<string, unknown>; skip?: boolean; fetchPolicy?: string },
) => UseQueryReturn;
function setUseQuery(
  impl: (
    query: unknown,
    opts?: { variables?: Record<string, unknown>; skip?: boolean; fetchPolicy?: string },
  ) => { data: unknown; loading: boolean; error: unknown },
) {
  mockUseQuery.mockImplementation(
    ((q: unknown, o?: unknown) => impl(q, o as Parameters<UseQueryImpl>[1])) as unknown as typeof useQuery,
  );
}

function renderPage() {
  return render(
    <MemoryRouter>
      <FagelbokLandingPage />
    </MemoryRouter>,
  );
}

const ORDERS = [
  { slug: "anseriformes", swedishName: "Andfåglar", scientificName: "Anseriformes" },
  { slug: "passeriformes", swedishName: "Tättingar", scientificName: "Passeriformes" },
];

beforeEach(() => {
  mockUseQuery.mockReset();
  setPersistedGuidebookQuery("");
});

afterEach(() => {
  cleanup();
});

describe("FagelbokLandingPage", () => {
  it("renders the alphabetical Order list from allOrders", () => {
    setUseQuery((query: unknown) => {
      if (query === "GET_ALL_ORDERS_QUERY") {
        return { data: { allOrders: ORDERS }, loading: false, error: undefined };
      }
      return { data: undefined, loading: false, error: undefined };
    });

    renderPage();

    expect(screen.getByText("Andfåglar")).toBeInTheDocument();
    expect(screen.getByText("Tättingar")).toBeInTheDocument();
  });

  it("skips SPECIES_SEARCH when the query is empty", () => {
    setUseQuery((query: unknown, opts?: { skip?: boolean }) => {
      if (query === "GET_ALL_ORDERS_QUERY") {
        return { data: { allOrders: ORDERS }, loading: false, error: undefined };
      }
      if (query === "SPECIES_SEARCH_QUERY") {
        expect((opts as { skip: boolean }).skip).toBe(true);
        return { data: undefined, loading: false, error: undefined };
      }
      return { data: undefined, loading: false, error: undefined };
    });

    renderPage();
  });

  it("swaps to search results when a query is typed", async () => {
    const user = userEvent.setup();
    setUseQuery((query: unknown, opts?: { skip?: boolean }) => {
      if (query === "GET_ALL_ORDERS_QUERY") {
        return { data: { allOrders: ORDERS }, loading: false, error: undefined };
      }
      if (query === "SPECIES_SEARCH_QUERY") {
        if (opts?.skip) return { data: undefined, loading: false, error: undefined };
        return {
          data: {
            speciesSearch: [
              { id: "1", swedishName: "Blåmes", scientificName: "Cyanistes caeruleus" },
            ],
          },
          loading: false,
          error: undefined,
        };
      }
      return { data: undefined, loading: false, error: undefined };
    });

    renderPage();

    const input = screen.getByPlaceholderText("Sök art…");
    await user.type(input, "blåmes");

    await waitFor(() => {
      expect(screen.getByText("Blåmes")).toBeInTheDocument();
    });

    // Order list replaced with results
    expect(screen.queryByText("Andfåglar")).not.toBeInTheDocument();
  });

  it("shows empty-state copy when search returns no matches", async () => {
    const user = userEvent.setup();
    setUseQuery((query: unknown, opts?: { skip?: boolean }) => {
      if (query === "GET_ALL_ORDERS_QUERY") {
        return { data: { allOrders: ORDERS }, loading: false, error: undefined };
      }
      if (query === "SPECIES_SEARCH_QUERY") {
        if (opts?.skip) return { data: undefined, loading: false, error: undefined };
        return { data: { speciesSearch: [] }, loading: false, error: undefined };
      }
      return { data: undefined, loading: false, error: undefined };
    });

    renderPage();
    await user.type(screen.getByPlaceholderText("Sök art…"), "xyz123");

    await waitFor(() => {
      expect(screen.getByText("Inga arter matchar din sökning.")).toBeInTheDocument();
    });
  });

  it("announces match count via visually-hidden aria-live region", async () => {
    const user = userEvent.setup();
    setUseQuery((query: unknown, opts?: { skip?: boolean }) => {
      if (query === "GET_ALL_ORDERS_QUERY") {
        return { data: { allOrders: ORDERS }, loading: false, error: undefined };
      }
      if (query === "SPECIES_SEARCH_QUERY") {
        if (opts?.skip) return { data: undefined, loading: false, error: undefined };
        return {
          data: {
            speciesSearch: [
              { id: "1", swedishName: "Blåmes", scientificName: "Cyanistes caeruleus" },
              { id: "2", swedishName: "Talgoxe", scientificName: "Parus major" },
            ],
          },
          loading: false,
          error: undefined,
        };
      }
      return { data: undefined, loading: false, error: undefined };
    });

    renderPage();
    await user.type(screen.getByPlaceholderText("Sök art…"), "mes");

    await waitFor(() => {
      const status = screen.getByRole("status");
      expect(status.textContent).toContain("2 arter matchar");
    });
  });

  it("clears the persisted search query when the page unmounts", async () => {
    const user = userEvent.setup();
    setUseQuery((query: unknown, opts?: { skip?: boolean }) => {
      if (query === "GET_ALL_ORDERS_QUERY") {
        return { data: { allOrders: ORDERS }, loading: false, error: undefined };
      }
      if (query === "SPECIES_SEARCH_QUERY") {
        if (opts?.skip) return { data: undefined, loading: false, error: undefined };
        return { data: { speciesSearch: [] }, loading: false, error: undefined };
      }
      return { data: undefined, loading: false, error: undefined };
    });

    const { unmount } = renderPage();
    await user.type(screen.getByPlaceholderText("Sök art…"), "mes");
    expect(getPersistedGuidebookQuery()).toBe("mes");

    unmount();

    expect(getPersistedGuidebookQuery()).toBe("");
  });

  it("× clear button restores the Order list", async () => {
    const user = userEvent.setup();
    setUseQuery((query: unknown, opts?: { skip?: boolean }) => {
      if (query === "GET_ALL_ORDERS_QUERY") {
        return { data: { allOrders: ORDERS }, loading: false, error: undefined };
      }
      if (query === "SPECIES_SEARCH_QUERY") {
        if (opts?.skip) return { data: undefined, loading: false, error: undefined };
        return {
          data: {
            speciesSearch: [
              { id: "1", swedishName: "Blåmes", scientificName: "Cyanistes caeruleus" },
            ],
          },
          loading: false,
          error: undefined,
        };
      }
      return { data: undefined, loading: false, error: undefined };
    });

    renderPage();
    await user.type(screen.getByPlaceholderText("Sök art…"), "mes");

    await waitFor(() => expect(screen.getByText("Blåmes")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /rensa sökning/i }));

    expect(screen.getByText("Andfåglar")).toBeInTheDocument();
    expect(screen.queryByText("Blåmes")).not.toBeInTheDocument();
  });
});
