import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "./RegisterPage";

vi.mock("@apollo/client", () => ({
  useMutation: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
}));

vi.mock("../graphql/mutations.js", () => ({
  REGISTER_MUTATION: "REGISTER_MUTATION",
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

const USER = { id: "1", email: "ny@exempel.se", name: "Ny Användare" };

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
      <RegisterPage />
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

describe("RegisterPage", () => {
  it("calls login() with token and user after successful registration", async () => {
    const user = userEvent.setup();
    const mutationFn = mockMutation(
      { loading: false, error: undefined },
      vi.fn().mockResolvedValue({ data: { register: { token: "t", user: USER } } }),
    );

    setup();

    await user.type(screen.getByLabelText("Namn"), "Ny Användare");
    await user.type(screen.getByLabelText("E-post"), "ny@exempel.se");
    await user.type(screen.getByLabelText("Lösenord"), "hemligt");
    await user.click(screen.getByRole("button", { name: "Registrera" }));

    expect(mutationFn).toHaveBeenCalledWith({
      variables: { name: "Ny Användare", email: "ny@exempel.se", password: "hemligt" },
    });
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("t", USER));
  });

  it("renders the mutation error message", () => {
    mockMutation({ loading: false, error: { message: "E-post upptagen" } });

    setup();

    expect(screen.getByText("E-post upptagen")).toBeInTheDocument();
  });

  it("disables the submit button and shows 'Registrerar...' while loading", () => {
    mockMutation({ loading: true, error: undefined });

    setup();

    const btn = screen.getByRole("button", { name: "Registrerar..." });
    expect(btn).toBeDisabled();
  });
});
