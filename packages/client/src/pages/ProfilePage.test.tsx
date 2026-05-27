import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "./ProfilePage";

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
}));

vi.mock("@/graphql/queries", () => ({
  MY_STATS: "MY_STATS",
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  BinocularsIcon: () => <svg />,
  BirdIcon: () => <svg />,
  CalendarIcon: () => <svg />,
  ChevronRightIcon: () => <svg />,
  KeyRoundIcon: () => <svg />,
  LogOutIcon: () => <svg />,
  UserIcon: () => <svg />,
}));

import { useQuery } from "@apollo/client";
import { useAuth } from "@/context/AuthContext";

const mockUseQuery = vi.mocked(useQuery);
const mockUseAuth = vi.mocked(useAuth);
const mockLogout = vi.fn();

const USER = { id: "1", email: "anna@exempel.se", name: "Anna" };
const STATS = {
  totalSightings: 42,
  uniqueSpecies: 12,
  memberSince: "2024-03-15T00:00:00.000Z",
};

function mockQuery(result: object) {
  mockUseQuery.mockReturnValue(result as unknown as ReturnType<typeof useQuery>);
}

beforeEach(() => {
  mockLogout.mockReset();
  mockUseAuth.mockReturnValue({
    user: USER,
    logout: mockLogout,
  } as unknown as ReturnType<typeof useAuth>);
});

afterEach(() => {
  cleanup();
});

describe("ProfilePage", () => {
  it("renders user name/email and stats from MY_STATS", () => {
    mockQuery({ data: { myStats: STATS }, error: undefined });

    render(<ProfilePage />);

    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.getByText("anna@exempel.se")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Observationer")).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it("shows the error fallback when the stats query errors", () => {
    mockQuery({ data: undefined, error: { message: "boom" } });

    render(<ProfilePage />);

    expect(screen.getByText("Kunde inte hämta statistik.")).toBeInTheDocument();
    expect(screen.queryByText("Observationer")).not.toBeInTheDocument();
  });

  it("renders name/email but no stats grid when there are no stats", () => {
    mockQuery({ data: undefined, error: undefined });

    render(<ProfilePage />);

    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.getByText("anna@exempel.se")).toBeInTheDocument();
    expect(screen.queryByText("Observationer")).not.toBeInTheDocument();
  });

  it("calls logout when the logout button is clicked", async () => {
    const user = userEvent.setup();
    mockQuery({ data: { myStats: STATS }, error: undefined });

    render(<ProfilePage />);

    await user.click(screen.getByRole("button", { name: /Logga ut/ }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
