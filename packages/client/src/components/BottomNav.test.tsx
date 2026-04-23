import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BottomNav from "./BottomNav";

function renderNav(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe("BottomNav", () => {
  it("renders 5 tabs including Fågelbok", () => {
    renderNav("/");
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(5);
    expect(screen.getByRole("tab", { name: "Fågelbok" })).toBeInTheDocument();
  });

  it("marks Fågelbok as active on /guidebook", () => {
    renderNav("/guidebook");
    const tab = screen.getByRole("tab", { name: "Fågelbok" });
    expect(tab.getAttribute("aria-selected")).toBe("true");
  });

  it("marks Fågelbok as active on /guidebook/order/:slug", () => {
    renderNav("/guidebook/order/passeriformes");
    const tab = screen.getByRole("tab", { name: "Fågelbok" });
    expect(tab.getAttribute("aria-selected")).toBe("true");
  });

  it("marks Fågelbok as active on /guidebook/family/:slug", () => {
    renderNav("/guidebook/family/paridae");
    const tab = screen.getByRole("tab", { name: "Fågelbok" });
    expect(tab.getAttribute("aria-selected")).toBe("true");
  });

  it("does NOT mark Fågelbok as active on unrelated routes", () => {
    renderNav("/sightings");
    const tab = screen.getByRole("tab", { name: "Fågelbok" });
    expect(tab.getAttribute("aria-selected")).toBe("false");
  });
});
