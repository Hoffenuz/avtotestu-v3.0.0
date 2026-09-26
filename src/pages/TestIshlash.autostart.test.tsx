/**
 * /test-ishlash — bosh sahifadagi "Testni davom ettirish" dan kelganda
 * boshlash sahifasi KO'RSATILMAY 20 talik test darhol boshlanadi.
 *
 * NIMA UCHUN BU TEST BOR: bu oqim `location.state` ga tayanadi. Holat
 * nomi yoki boshlash sharti buzilsa, tugma jimgina oddiy boshlash
 * sahifasini ochadi — build, typecheck va lint buni ushlamaydi.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/hooks/useAccessState", () => ({
  useAccessState: () => ({ state: "guest", isPremium: false, loading: false, backendConfirmed: false }),
}));
vi.mock("@/hooks/useTestSession", () => ({ useTestSession: () => ({ starting: false, startSession: vi.fn() }) }));
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "uz-lat", setLanguage: vi.fn(), t: (k: string) => k }),
}));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/TestPageSchema", () => ({ TestPageSchema: () => null }));
vi.mock("@/components/ProUpsell", () => ({ ProUpsell: () => null }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/TestInterfaceBase", () => ({
  TestInterfaceBase: (p: { questionCount: number; dataSource: string }) => (
    <p data-testid="test">{`base|${p.questionCount}|${p.dataSource}`}</p>
  ),
}));
vi.mock("@/components/TestInterfaceCombined", () => ({
  TestInterfaceCombined: (p: { questionCount: number }) => <p data-testid="test">{`combined|${p.questionCount}`}</p>,
}));

import TestIshlash from "./TestIshlash";
import { AUTO_START_STATE } from "@/lib/testAutoStart";

function chiqar(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/test-ishlash", state }]}>
      <TestIshlash />
    </MemoryRouter>,
  );
}

describe("TestIshlash — darhol boshlash", () => {
  beforeEach(() => localStorage.clear());

  it("bosh sahifadan kelganda 20 talik test boshlash sahifasisiz boshlanadi", async () => {
    chiqar(AUTO_START_STATE);
    await waitFor(() => expect(screen.getByTestId("test").textContent).toBe("base|20|/free-uz-lat.json"));
    expect(screen.queryByText("test.startTest")).not.toBeInTheDocument();
  });

  it("oddiy kirishda — boshlash sahifasi (savollar sonini tanlash)", () => {
    chiqar();
    expect(screen.getByText("test.startTest")).toBeInTheDocument();
    expect(screen.queryByTestId("test")).not.toBeInTheDocument();
  });

  it("tugallanmagan test bo'lsa — yangisi boshlanmaydi, o'sha ochiladi", () => {
    const stateKey = "testState_combined_/free-uz-lat.json_50_guest";
    localStorage.setItem(stateKey, "{}");
    localStorage.setItem(
      "testIshlash_activeTest_guest",
      JSON.stringify({
        testStarted: true,
        questionCount: 50,
        activeSession: { sessionId: null, isPremium: false, testStateKey: stateKey, dataFile: "free-uz-lat.json" },
      }),
    );
    chiqar(AUTO_START_STATE);
    expect(screen.getByTestId("test").textContent).toBe("combined|50");
  });
});
