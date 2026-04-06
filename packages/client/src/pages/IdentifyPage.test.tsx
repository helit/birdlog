import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter } from "react-router-dom";
import IdentifyPage from "./IdentifyPage";

// jsdom doesn't implement navigator.geolocation; install a stub so vi.spyOn works
const mockGetCurrentPosition = vi.fn();
Object.defineProperty(global.navigator, "geolocation", {
  value: { getCurrentPosition: mockGetCurrentPosition },
  configurable: true,
});

// Helper to render IdentifyPage with required providers
function renderIdentifyPage() {
  return render(
    <MemoryRouter>
      <MockedProvider mocks={[]} addTypename={false}>
        <IdentifyPage />
      </MockedProvider>
    </MemoryRouter>,
  );
}

function makeGeoError(code: number): GeolocationPositionError {
  return { code, message: "", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError;
}

beforeEach(() => {
  mockGetCurrentPosition.mockReset();
});

describe("IdentifyPage geolocation error handling", () => {
  it("shows denied message and no retry button when PERMISSION_DENIED (code 1)", () => {
    mockGetCurrentPosition.mockImplementation((_success: unknown, error: (e: GeolocationPositionError) => void) => {
      error(makeGeoError(1));
    });

    renderIdentifyPage();

    expect(screen.getByText("Du måste tillåta platstjänster i din webbläsare")).toBeDefined();
    expect(screen.queryByRole("button", { name: /försök igen/i })).toBeNull();
  });
});
