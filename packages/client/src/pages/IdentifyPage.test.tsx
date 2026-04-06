import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, cleanup } from "@testing-library/react";
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

afterEach(() => {
  cleanup();
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

  it("shows Försök igen button when TIMEOUT (code 3)", () => {
    mockGetCurrentPosition.mockImplementation((_success: unknown, error: (e: GeolocationPositionError) => void) => {
      error(makeGeoError(3));
    });

    renderIdentifyPage();

    expect(screen.getByRole("button", { name: /försök igen/i })).toBeDefined();
  });

  it("calls getCurrentPosition twice and shows loading state on retry after timeout", async () => {
    const user = userEvent.setup();

    // First call: timeout; second call: success with a valid position
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

    renderIdentifyPage();

    // After first call the retry button should appear
    const retryBtn = screen.getByRole("button", { name: /försök igen/i });

    await user.click(retryBtn);

    // getCurrentPosition must have been called twice
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(2);
    // After retry with success, the retry button should no longer be visible
    expect(screen.queryByRole("button", { name: /försök igen/i })).toBeNull();
  });
});
