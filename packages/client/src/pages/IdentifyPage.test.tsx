import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import IdentifyPage from "./IdentifyPage";

const mockRefetch = vi.fn();

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
}));

vi.mock("lucide-react", () => ({
  BirdIcon: () => <svg data-testid="bird-icon" />,
  CameraIcon: () => <svg />,
  MapPinIcon: () => <svg />,
  PlusIcon: () => <svg />,
  WandSparklesIcon: () => <svg />,
  RefreshCw: ({ className }: { className?: string }) => (
    <svg data-testid="refresh-icon" className={className} />
  ),
}));

vi.mock("@/graphql/queries", () => ({
  NEARBY_BIRDS: "NEARBY_BIRDS_QUERY",
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import { useQuery } from "@apollo/client";
const mockUseQuery = vi.mocked(useQuery);

const HERO_BIRD = {
  scientificName: "Sitta europaea",
  vernacularName: "nötväcka",
  imageUrl: null,
  observationCount: 3,
};

const LOADED_DATA = {
  nearbyBirds: {
    hero: HERO_BIRD,
    common: [
      { scientificName: "Parus major", vernacularName: "talgoxe", imageUrl: null, observationCount: 50 },
    ],
    uncommon: [],
  },
};

function setup(useQueryResult: object) {
  mockUseQuery.mockReturnValue(useQueryResult as ReturnType<typeof useQuery>);

  Object.defineProperty(navigator, "geolocation", {
    value: {
      getCurrentPosition: (success: PositionCallback) =>
        success({ coords: { latitude: 59.3, longitude: 18.0 } } as GeolocationPosition),
    },
    writable: true,
    configurable: true,
  });

  return render(
    <MemoryRouter>
      <IdentifyPage />
    </MemoryRouter>,
  );
}

describe("IdentifyPage", () => {
  beforeEach(() => {
    mockRefetch.mockReset();
  });

  it("renders 'obs senaste 30 dagarna' in the hero card", () => {
    setup({
      data: LOADED_DATA,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    expect(screen.getByText(/obs senaste 30 dagarna/)).toBeInTheDocument();
    expect(screen.queryByText(/obs denna månad/)).not.toBeInTheDocument();
  });

  it("shows a refresh button with correct aria-label when birds are loaded", () => {
    setup({
      data: LOADED_DATA,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    expect(
      screen.getByRole("button", { name: "Uppdatera fåglar nära dig" }),
    ).toBeInTheDocument();
  });

  it("calls refetch with force: true when refresh button is clicked", async () => {
    const user = userEvent.setup();
    setup({
      data: LOADED_DATA,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    await user.click(screen.getByRole("button", { name: "Uppdatera fåglar nära dig" }));
    expect(mockRefetch).toHaveBeenCalledWith({ force: true });
  });

  it("disables the refresh button and spins the icon while loading", () => {
    setup({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: mockRefetch,
    });

    const btn = screen.getByRole("button", { name: "Uppdatera fåglar nära dig" });
    expect(btn).toBeDisabled();

    const icon = screen.getByTestId("refresh-icon");
    expect(icon.getAttribute("class")).toContain("animate-spin");
  });
});
