import { afterEach, describe, expect, it } from "vitest";
import {
  getInitialTimeRemaining,
  getSavedTestState,
  isTestStateExpired,
} from "./testPersistence";

const KEY = "testState_base_/barcha-uz-lat.json_20_guest";

afterEach(() => {
  localStorage.clear();
});

describe("isTestStateExpired", () => {
  it("endsAt o'tgan bo'lsa — tugagan", () => {
    expect(isTestStateExpired({ endsAt: 1000 }, 2000)).toBe(true);
    expect(isTestStateExpired({ endsAt: 2000 }, 2000)).toBe(true);
  });

  it("endsAt kelajakda bo'lsa — davom etadi", () => {
    expect(isTestStateExpired({ endsAt: 3000 }, 2000)).toBe(false);
  });

  it("eski format: timeRemaining 0 — tugagan", () => {
    expect(isTestStateExpired({ timeRemaining: 0 })).toBe(true);
    expect(isTestStateExpired({ timeRemaining: 120 })).toBe(false);
  });

  it("taymersiz holat (mavzuli) hech qachon tugamaydi", () => {
    expect(isTestStateExpired({ startedAt: 1 })).toBe(false);
  });
});

describe("getSavedTestState", () => {
  it("chiqib ketilgan va vaqti tugagan test o'chiriladi va tiklanmaydi", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ selectedAnswers: { 0: 1 }, endsAt: Date.now() - 60_000, startedAt: Date.now() - 26 * 60_000 }),
    );
    expect(getSavedTestState(KEY)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
    // Yangi test to'liq vaqt bilan boshlanadi, 0 bilan emas
    expect(getInitialTimeRemaining(KEY, 25 * 60)).toBe(25 * 60);
  });

  it("vaqti qolgan test (sahifa yangilangan) tiklanadi", () => {
    const endsAt = Date.now() + 10 * 60_000;
    localStorage.setItem(KEY, JSON.stringify({ currentQuestion: 4, endsAt }));
    expect(getSavedTestState(KEY)?.currentQuestion).toBe(4);
    expect(getInitialTimeRemaining(KEY, 25 * 60)).toBeGreaterThan(9 * 60);
  });

  it("buzuq JSON — null, xato tashlamaydi", () => {
    localStorage.setItem(KEY, "{oops");
    expect(getSavedTestState(KEY)).toBeNull();
  });
});
