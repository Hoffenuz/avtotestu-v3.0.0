import { act, render } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const trackPageView = vi.fn();
vi.mock("@/lib/track", () => ({ trackPageView: (...a: unknown[]) => trackPageView(...a) }));

import { RouteTracker } from "./RouteTracker";

let go: (to: string) => void = () => {};
function Nav() {
  go = useNavigate();
  return null;
}

beforeEach(() => {
  vi.useFakeTimers();
  trackPageView.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("RouteTracker — GA page_view", () => {
  it("birinchi sahifani yubormaydi (uni gtag config sanaydi)", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RouteTracker />
      </MemoryRouter>,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(trackPageView).not.toHaveBeenCalled();
  });

  it("keyingi o'tishni sarlavha o'rnashgach bir marta yuboradi", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RouteTracker />
        <Nav />
      </MemoryRouter>,
    );
    act(() => {
      go("/pro");
    });
    document.title = "PRO | AvtoSmart";
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(trackPageView).toHaveBeenCalledTimes(1);
    expect(trackPageView).toHaveBeenCalledWith("/pro", "PRO | AvtoSmart");
  });

  it("tez-tez o'tishda faqat oxirgi sahifa yuboriladi", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <RouteTracker />
        <Nav />
      </MemoryRouter>,
    );
    act(() => {
      go("/variant");
      go("/pro");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(trackPageView).toHaveBeenCalledTimes(1);
    expect(trackPageView.mock.calls[0][0]).toBe("/pro");
  });
});
