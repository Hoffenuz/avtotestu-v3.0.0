/**
 * "PRO tugadi" tasmasi (2.4): faqat oxirgi 14 kunda tugaganlarga, yopilsa
 * o'sha sana uchun qaytmaydi, faol PRO egasida profil umuman so'ralmaydi.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const DAY = 24 * 60 * 60 * 1000;

const mockAuth = { user: { id: "u1" } as { id: string } | null, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockAuth }));

const mockAccess = { isPremium: false, expiresAt: null as Date | null, state: "expired_pro" };
vi.mock("@/hooks/useAccessState", () => ({ useAccessState: () => mockAccess }));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (k: string) =>
      ({ "pro.expiredTitle": "PRO {date} da tugadi", "pro.expiredSub": "sub", "pro.expiredCta": "Davom", "pro.renewClose": "x" })[k] ?? k,
  }),
}));
vi.mock("@/components/MobileAppBanner", () => ({ default: () => null }));
vi.mock("@/components/ReadinessStrip", () => ({ default: () => null }));
vi.mock("@/lib/track", () => ({ trackEvent: vi.fn() }));

let profileEnd: string | null = null;
const fromSpy = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      fromSpy(table);
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: { tariff_end_date: profileEnd }, error: null }),
      };
      return chain;
    },
  },
}));

import HomeTopBanner from "./HomeTopBanner";

function renderBanner() {
  return render(
    <MemoryRouter>
      <HomeTopBanner />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  fromSpy.mockClear();
  mockAccess.state = "expired_pro";
  mockAccess.isPremium = false;
  mockAccess.expiresAt = null;
  profileEnd = null;
});

describe("HomeTopBanner — PRO tugadi", () => {
  it("3 kun oldin tugagan — tasma sana bilan chiqadi", async () => {
    profileEnd = new Date(Date.now() - 3 * DAY).toISOString();
    renderBanner();
    expect(await screen.findByText(/da tugadi/)).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/pro");
  });

  it("20 kun oldin tugagan — ko'rinmaydi", async () => {
    profileEnd = new Date(Date.now() - 20 * DAY).toISOString();
    renderBanner();
    await waitFor(() => expect(fromSpy).toHaveBeenCalledWith("profiles"));
    expect(screen.queryByText(/da tugadi/)).toBeNull();
  });

  it("yopilgan bo'lsa o'sha sana uchun qaytmaydi", async () => {
    profileEnd = new Date(Date.now() - 2 * DAY).toISOString();
    localStorage.setItem("pro-renew-banner-dismissed", `expired:${new Date(profileEnd).toISOString()}`);
    renderBanner();
    await waitFor(() => expect(fromSpy).toHaveBeenCalledWith("profiles"));
    expect(screen.queryByText(/da tugadi/)).toBeNull();
  });

  it("faol PRO (tugashiga uzoq) — profil so'ralmaydi", async () => {
    mockAccess.state = "active_pro";
    mockAccess.isPremium = true;
    mockAccess.expiresAt = new Date(Date.now() + 20 * DAY);
    renderBanner();
    await new Promise((r) => setTimeout(r, 20));
    expect(fromSpy).not.toHaveBeenCalled();
    expect(screen.queryByText(/da tugadi/)).toBeNull();
  });
});
