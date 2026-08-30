/**
 * payme.ts — checkout havolasi testlari.
 *
 * Eng muhimi: base64 kodlash Payme hujjatidagi rasmiy misol bilan bir xil
 * chiqishi. Bu buzilsa to'lov sahifasi ochilmaydi yoki noto'g'ri summa bilan
 * ochiladi, lekin build/lint hech qanday xato bermaydi.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const MERCHANT_ID = "587f72c72cac0d162c722ae2";

/** Modul MERCHANT_ID ni import paytida o'qiydi — har testda toza yuklaymiz. */
async function loadPayme(merchantId: string | undefined) {
  vi.resetModules();
  vi.stubEnv("VITE_PAYME_MERCHANT_ID", merchantId ?? "");
  return await import("./payme");
}

/** Havoladan base64 qismini ochib, asl parametr satrini qaytaradi. */
function decodeCheckout(url: string): string {
  const encoded = url.replace("https://checkout.paycom.uz/", "");
  return atob(encoded);
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildPaymeCheckoutUrl", () => {
  it("Payme hujjatidagi rasmiy misol bilan bir xil base64 beradi", async () => {
    // Docs: m=587f72c72cac0d162c722ae2;ac.order_id=197;a=500
    // → bT01ODdmNzJjNzJjYWMwZDE2MmM3MjJhZTI7YWMub3JkZXJfaWQ9MTk3O2E9NTAw
    // Bizda `ac` maydoni email, shuning uchun kodlashning o'zini tekshiramiz.
    const { buildPaymeCheckoutUrl } = await loadPayme(MERCHANT_ID);

    const url = buildPaymeCheckoutUrl({
      email: "user@example.com",
      amountTiyin: 1_500_000,
      callbackUrl: "https://www.avtotestu.uz/profile",
      language: "uz-lat",
    });

    expect(url).not.toBeNull();
    expect(url).toMatch(/^https:\/\/checkout\.paycom\.uz\//);
    expect(decodeCheckout(url!)).toBe(
      `m=${MERCHANT_ID};ac.email=user@example.com;a=1500000;l=uz;c=https://www.avtotestu.uz/profile`,
    );
  });

  it("summani tiyinda o'zgartirmasdan uzatadi", async () => {
    const { buildPaymeCheckoutUrl } = await loadPayme(MERCHANT_ID);

    const url = buildPaymeCheckoutUrl({
      email: "a@b.uz",
      amountTiyin: 8_300_000,
      callbackUrl: "https://www.avtotestu.uz/profile",
      language: "ru",
    });

    // DB dagi payme_plans.amount_tiyin bilan aynan bir xil bo'lishi shart,
    // aks holda Payme -31001 (invalid_amount) qaytaradi.
    expect(decodeCheckout(url!)).toContain("a=8300000");
  });

  it("tilni Payme kodlariga o'giradi (uz-cyr → uz, ru → ru)", async () => {
    const { buildPaymeCheckoutUrl } = await loadPayme(MERCHANT_ID);

    const base = {
      email: "a@b.uz",
      amountTiyin: 1_500_000,
      callbackUrl: "https://www.avtotestu.uz/profile",
    };

    expect(decodeCheckout(buildPaymeCheckoutUrl({ ...base, language: "uz" })!)).toContain("l=uz");
    expect(decodeCheckout(buildPaymeCheckoutUrl({ ...base, language: "uz-lat" })!)).toContain("l=uz");
    expect(decodeCheckout(buildPaymeCheckoutUrl({ ...base, language: "ru" })!)).toContain("l=ru");
  });

  it("kassa ID sozlanmagan bo'lsa null qaytaradi", async () => {
    const { buildPaymeCheckoutUrl, isPaymeConfigured } = await loadPayme(undefined);

    expect(isPaymeConfigured()).toBe(false);
    expect(
      buildPaymeCheckoutUrl({
        email: "a@b.uz",
        amountTiyin: 1_500_000,
        callbackUrl: "https://www.avtotestu.uz/profile",
        language: "uz",
      }),
    ).toBeNull();
  });

  it("noto'g'ri summa yoki buzuq email uchun havola yasamaydi", async () => {
    const { buildPaymeCheckoutUrl } = await loadPayme(MERCHANT_ID);

    const base = {
      callbackUrl: "https://www.avtotestu.uz/profile",
      language: "uz",
    };

    // Nol/manfiy/kasr summa — Payme `Amount` turi musbat butun son
    expect(buildPaymeCheckoutUrl({ ...base, email: "a@b.uz", amountTiyin: 0 })).toBeNull();
    expect(buildPaymeCheckoutUrl({ ...base, email: "a@b.uz", amountTiyin: -100 })).toBeNull();
    expect(buildPaymeCheckoutUrl({ ...base, email: "a@b.uz", amountTiyin: 1500.5 })).toBeNull();

    // `;` parametr ajratuvchisi — email ichida bo'lsa havola buziladi
    expect(buildPaymeCheckoutUrl({ ...base, email: "a@b.uz;a=1", amountTiyin: 1_500_000 })).toBeNull();
    expect(buildPaymeCheckoutUrl({ ...base, email: "   ", amountTiyin: 1_500_000 })).toBeNull();
  });
});

describe("formatTiyinAsSum", () => {
  it("tiyinni bo'sh joy bilan ajratilgan so'mga aylantiradi", async () => {
    const { formatTiyinAsSum } = await loadPayme(MERCHANT_ID);

    // Joriy tariflar: haftalik / oylik / 3 oylik
    expect(formatTiyinAsSum(1_500_000)).toBe("15 000");
    expect(formatTiyinAsSum(3_500_000)).toBe("35 000");
    expect(formatTiyinAsSum(8_300_000)).toBe("83 000");
  });
});
