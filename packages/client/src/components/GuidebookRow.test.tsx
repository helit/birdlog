import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuidebookRow } from "./GuidebookRow";

describe("GuidebookRow", () => {
  it("renders Swedish name on primary line and scientific italic on secondary", () => {
    render(
      <GuidebookRow
        swedishName="Talgoxe"
        scientificName="Parus major"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("Talgoxe")).toBeInTheDocument();
    const scientific = screen.getByText("Parus major");
    expect(scientific).toBeInTheDocument();
    expect(scientific.className).toMatch(/italic/);
  });

  it("falls back to scientific italic on primary line when swedishName is null", () => {
    render(
      <GuidebookRow
        swedishName={null}
        scientificName="Passeriformes"
        onClick={() => {}}
      />,
    );
    const scientific = screen.getByText("Passeriformes");
    expect(scientific).toBeInTheDocument();
    expect(scientific.className).toMatch(/italic/);
    // No separate Swedish line shown
    expect(screen.queryAllByRole("button")[0].querySelectorAll("p").length).toBe(1);
  });

  it("fires onClick when activated", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <GuidebookRow
        swedishName="Talgoxe"
        scientificName="Parus major"
        onClick={handleClick}
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("activates on Enter key", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <GuidebookRow
        swedishName="Talgoxe"
        scientificName="Parus major"
        onClick={handleClick}
      />,
    );
    const button = screen.getByRole("button");
    button.focus();
    await user.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
