import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

vi.mock("@apollo/client", () => ({
  useMutation: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
}));

vi.mock("../graphql/mutations.js", () => ({
  LOGIN_MUTATION: "LOGIN_MUTATION",
}));

vi.mock("../context/AuthContext.js", () => ({
  useAuth: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  BirdIcon: () => <svg data-testid="bird-icon" />,
}));

import { useMutation } from "@apollo/client";
import { useAuth } from "../context/AuthContext.js";

const mockUseMutation = vi.mocked(useMutation);
const mockUseAuth = vi.mocked(useAuth);
const mockLogin = vi.fn();

const USER = { id: "1", email: "anna@exempel.se", name: "Anna" };

function mockMutation(result: object, mutationFn = vi.fn()) {
  mockUseMutation.mockReturnValue([
    mutationFn,
    result,
  ] as unknown as ReturnType<typeof useMutation>);
  return mutationFn;
}

function setup() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockLogin.mockReset();
  mockUseAuth.mockReturnValue({ login: mockLogin } as unknown as ReturnType<typeof useAuth>);
});

afterEach(() => {
  cleanup();
});

describe("LoginPage", () => {
  it("calls login() with token and user on successful submit", async () => {
    const user = userEvent.setup();
    const mutationFn = mockMutation(
      { loading: false, error: undefined },
      vi.fn().mockResolvedValue({ data: { login: { token: "t", user: USER } } }),
    );

    setup();

    await user.type(screen.getByLabelText("E-post"), "anna@exempel.se");
    await user.type(screen.getByLabelText("Lösenord"), "hemligt");
    await user.click(screen.getByRole("button", { name: "Logga in" }));

    expect(mutationFn).toHaveBeenCalledWith({
      variables: { email: "anna@exempel.se", password: "hemligt" },
    });
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("t", USER));
  });

  it("renders the mutation error message", () => {
    mockMutation({ loading: false, error: { message: "Fel uppgifter" } });

    setup();

    expect(screen.getByText("Fel uppgifter")).toBeInTheDocument();
  });

  it("disables the submit button and shows 'Loggar in...' while loading", () => {
    mockMutation({ loading: true, error: undefined });

    setup();

    const btn = screen.getByRole("button", { name: "Loggar in..." });
    expect(btn).toBeDisabled();
  });
});
