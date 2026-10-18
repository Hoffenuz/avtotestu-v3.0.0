import { afterEach, describe, expect, it } from "vitest";
import {
  clearCheckoutBaseline,
  exceedsProLimit,
  formatProDate,
  isPaymentConfirmed,
  projectedProEnd,
  readCheckoutBaseline,
  saveCheckoutBaseline,
} from "./proRenewal";

const DAY = 24 * 60 * 60 * 1000;
// 2026-10-18 12:00 Toshkent = 07:00 UTC
const NOW = Date.UTC(2026, 9, 18, 7, 0, 0);

afterEach(() => {
  sessionStorage.clear();
});

describe("projectedProEnd — server qoidasi bilan bir xil", () => {
  it("PRO yo'q: bugundan +30 kun, kun oxiri 23:59:59 (Toshkent)", () => {
    // 2026-11-17 23:59:59 Toshkent = 18:59:59 UTC (bazadagi sinov natijasi bilan bir xil)
    expect(projectedProEnd(null, 30, NOW).toISOString()).toBe("2026-11-17T18:59:59.000Z");
  });

  it("faol PRO: kunlar tugash sanasidan keyin qo'shiladi", () => {
    const end = new Date("2026-11-17T18:59:59.000Z");
    expect(projectedProEnd(end, 7, NOW).toISOString()).toBe("2026-11-24T18:59:59.000Z");
  });

  it("muddati o'tgan PRO: bugundan boshlanadi", () => {
    const past = new Date(NOW - 3 * DAY);
    expect(projectedProEnd(past, 7, NOW).toISOString()).toBe("2026-10-25T18:59:59.000Z");
  });
});

describe("exceedsProLimit — 400 kun", () => {
  it("360 kun qolgan + haftalik — mumkin", () => {
    expect(exceedsProLimit(new Date(NOW + 360 * DAY), 7, NOW)).toBe(false);
  });

  it("360 kun qolgan + choraklik — chegara", () => {
    expect(exceedsProLimit(new Date(NOW + 360 * DAY), 90, NOW)).toBe(true);
  });

  it("PRO yo'q — har qanday tarif mumkin", () => {
    expect(exceedsProLimit(null, 90, NOW)).toBe(false);
  });
});

describe("formatProDate", () => {
  it("Toshkent sanasi: 18:59:59 UTC hali o'sha kun", () => {
    expect(formatProDate(new Date("2026-11-17T18:59:59.000Z"))).toBe("17.11.2026");
  });

  it("19:00 UTC — Toshkentda ertangi kun", () => {
    expect(formatProDate(new Date("2026-11-17T19:00:00.000Z"))).toBe("18.11.2026");
  });
});

describe("to'lov tasdig'i", () => {
  it("PRO yo'q edi: PRO faol bo'lishi yetarli", () => {
    saveCheckoutBaseline(null);
    expect(readCheckoutBaseline()).toBeNull();
    expect(isPaymentConfirmed(true, new Date(NOW + 30 * DAY), null)).toBe(true);
    expect(isPaymentConfirmed(false, null, null)).toBe(false);
  });

  it("uzaytirish: muddat surilmaguncha tasdiqlanmaydi", () => {
    const before = new Date(NOW + 5 * DAY);
    saveCheckoutBaseline(before);
    const baseline = readCheckoutBaseline();
    expect(baseline).toBe(before.getTime());
    expect(isPaymentConfirmed(true, before, baseline)).toBe(false);
    expect(isPaymentConfirmed(true, new Date(before.getTime() + 7 * DAY), baseline)).toBe(true);
  });

  it("tozalangandan keyin baseline yo'q", () => {
    saveCheckoutBaseline(new Date(NOW));
    clearCheckoutBaseline();
    expect(readCheckoutBaseline()).toBeNull();
  });
});
