/**
 * guestResultNudge — yangi kelgan mehmonga taklif birinchi testdan keyin
 * CHIQMASLIGI SHART (egasining talabi). Hisob buzilsa taklif yo birinchi
 * testdayoq, yo umuman chiqmay qoladi — ikkalasini ham build ushlamaydi.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { recordGuestTestDone, shouldNudgeAt } from "./guestResultNudge";

describe("guestResultNudge", () => {
  beforeEach(() => localStorage.clear());

  it("1-testda yo'q, 2-testda bor, keyin har 3-testda", () => {
    const natija = Array.from({ length: 11 }, () => recordGuestTestDone());
    // indeks 0 → 1-test
    expect(natija).toEqual([false, true, false, false, true, false, false, true, false, false, true]);
  });

  it("shouldNudgeAt: 0 va 1 da hech qachon", () => {
    expect(shouldNudgeAt(0)).toBe(false);
    expect(shouldNudgeAt(1)).toBe(false);
    expect(shouldNudgeAt(2)).toBe(true);
    expect(shouldNudgeAt(3)).toBe(false);
  });

  it("buzilgan qiymat — hisob noldan boshlanadi", () => {
    localStorage.setItem("avtosmart-guest-tests-done", "abc");
    expect(recordGuestTestDone()).toBe(false); // 1-test
    expect(recordGuestTestDone()).toBe(true); // 2-test
  });
});
