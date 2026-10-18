import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackPurchase } from "./track";

const gtag = vi.fn();

beforeEach(() => {
  localStorage.clear();
  gtag.mockClear();
  window.gtag = gtag;
});
afterEach(() => {
  delete window.gtag;
});

describe("trackPurchase — GA4 purchase", () => {
  it("summa, valyuta va tranzaksiya ID bilan yuboradi", () => {
    expect(trackPurchase({ transactionId: "sub-1", valueSom: 15000, plan: "weekly", provider: "payme" })).toBe(true);
    expect(gtag).toHaveBeenCalledWith("event", "purchase", expect.objectContaining({
      transaction_id: "sub-1",
      value: 15000,
      currency: "UZS",
      payment_type: "payme",
    }));
  });

  it("bir ID ikki marta yuborilmaydi (sahifa yangilansa ham)", () => {
    trackPurchase({ transactionId: "sub-2", valueSom: 35000, plan: "monthly", provider: "click" });
    expect(trackPurchase({ transactionId: "sub-2", valueSom: 35000, plan: "monthly", provider: "click" })).toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("buzuq saqlangan ro'yxat — xato tashlamaydi", () => {
    localStorage.setItem("ga-purchase-sent", "{oops");
    expect(trackPurchase({ transactionId: "sub-3", valueSom: 83000, plan: "quarterly", provider: "payme" })).toBe(true);
  });
});
