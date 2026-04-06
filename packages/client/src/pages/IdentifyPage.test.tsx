import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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

// jsdom doesn't implement navigator.geolocation; install a stub
const mockGetCurrentPosition = vi.fn();
Object.defineProperty(global.navigator, "geolocation", {
  value: { getCurrentPosition: mockGetCurrentPosition },
  configurable: true,
});

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
  return render(
    <MemoryRouter>
      <IdentifyPage />
    </MemoryRouter>,
  );
}

function makeGeoError(code: number): GeolocationPositionError {
  return { code, message: "", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError;
}

beforeEach(() => {
  mockRefetch.mockReset();
  mockGetCurrentPosition.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("IdentifyPage — refresh button", () => {
  beforeEach(() => {
    mockGetCurrentPosition.mockImplementation((success: PositionCallback) =>
      success({ coords: { latitude: 59.3, longitude: 18.0 } } as GeolocationPosition),
    );
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

describe("IdentifyPage geolocation error handling", () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useQuery>);
  });

  it("shows denied message and no retry button when PERMISSION_DENIED (code 1)", () => {
    mockGetCurrentPosition.mockImplementation((_success: unknown, error: (e: GeolocationPositionError) => void) => {
      error(makeGeoError(1));
    });

    setup({ data: undefined, loading: false, error: undefined, refetch: mockRefetch });

    expect(screen.getByText("Du måste tillåta platstjänster i din webbläsare")).toBeDefined();
    expect(screen.queryByRole("button", { name: /försök igen/i })).toBeNull();
  });

  it("shows Försök igen button when TIMEOUT (code 3)", () => {
    mockGetCurrentPosition.mockImplementation((_success: unknown, error: (e: GeolocationPositionError) => void) => {
      error(makeGeoError(3));
    });

    setup({ data: undefined, loading: false, error: undefined, refetch: mockRefetch });

    expect(screen.getByRole("button", { name: /försök igen/i })).toBeDefined();
  });

  it("passes { timeout: 10000 } as third argument to getCurrentPosition", () => {
    mockGetCurrentPosition.mockImplementation(() => {
      // never calls success or error — we just inspect call args
    });

    setup({ data: undefined, loading: false, error: undefined, refetch: mockRefetch });

    expect(mockGetCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ timeout: 10000 }),
    );
  });

  it("calls getCurrentPosition twice and shows loading state on retry after timeout", async () => {
    const user = userEvent.setup();

    mockGetCurrentPosition
      .mockImplementationOnce((_success: unknown, error: (e: GeolocationPositionError) => void) => {
        error(makeGeoError(3));
      })
      .mockImplementationOnce((success: (pos: GeolocationPosition) => void) => {
        success({
          coords: { latitude: 59.3, longitude: 18.0, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
          timestamp: Date.now(),
        } as GeolocationPosition);
      });

    setup({ data: undefined, loading: false, error: undefined, refetch: mockRefetch });

    const retryBtn = screen.getByRole("button", { name: /försök igen/i });

    await user.click(retryBtn);

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("button", { name: /försök igen/i })).toBeNull();
  });
});
