/**
 * click.ts — to'lov havolasi testlari.
 *
 * Summa formati ("N.NN") va buyurtma ID si havolada aynan server kutgandek
 * bo'lishi shart: CLICK imzoni `amount` va `merchant_trans_id` ning xom
 * qiymati bilan hisoblaydi, farq bo'lsa to'lov -2 / -5 bilan rad etiladi.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const ORDER_ID = "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b";

async function loadClick(env: {
  service?: string;
  merchant?: string;
  merchantUser?: string;
}) {
  vi.resetModules();
  vi.stubEnv("VITE_CLICK_SERVICE_ID", env.service ?? "");
  vi.stubEnv("VITE_CLICK_MERCHANT_ID", env.merchant ?? "");
  vi.stubEnv("VITE_CLICK_MERCHANT_USER_ID", env.merchantUser ?? "");
  return await import("./click");
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("formatTiyinForClick", () => {
  it("tiyinni N.NN formatiga o'giradi", async () => {
    const { formatTiyinForClick } = await loadClick({ service: "1", merchant: "2" });
    expect(formatTiyinForClick(3500000)).toBe("35000.00");
    expect(formatTiyinForClick(1500050)).toBe("15000.50");
    expect(formatTiyinForClick(1)).toBe("0.01");
  });
});

describe("buildClickPayUrl", () => {
  it("hujjatdagi parametrlar bilan havola yasaydi", async () => {
    const { buildClickPayUrl } = await loadClick({
      service: "112576",
      merchant: "57313",
      merchantUser: "91937",
    });

    const url = buildClickPayUrl({
      orderId: ORDER_ID,
      amountTiyin: 3500000,
      returnUrl: "https://www.avtotestu.uz/profile?from=click",
    });
    expect(url).not.toBeNull();

    const parsed = new URL(url as string);
    expect(parsed.origin + parsed.pathname).toBe("https://my.click.uz/services/pay");
    expect(parsed.searchParams.get("service_id")).toBe("112576");
    expect(parsed.searchParams.get("merchant_id")).toBe("57313");
    expect(parsed.searchParams.get("merchant_user_id")).toBe("91937");
    expect(parsed.searchParams.get("amount")).toBe("35000.00");
    expect(parsed.searchParams.get("transaction_param")).toBe(ORDER_ID);
    // return_url ichidagi "?" va "=" kodlangan bo'lishi kerak — aks holda
    // `from=click` CLICK havolasining o'z parametriga aylanib qolardi.
    expect(parsed.searchParams.get("return_url")).toBe(
      "https://www.avtotestu.uz/profile?from=click",
    );
  });

  it("merchant_user_id berilmasa uni qo'shmaydi", async () => {
    const { buildClickPayUrl } = await loadClick({ service: "112576", merchant: "57313" });
    const url = buildClickPayUrl({ orderId: ORDER_ID, amountTiyin: 100, returnUrl: "https://x.uz" });
    expect(new URL(url as string).searchParams.has("merchant_user_id")).toBe(false);
  });

  it("sozlanmagan bo'lsa null qaytaradi va isClickConfigured false", async () => {
    const { buildClickPayUrl, isClickConfigured } = await loadClick({});
    expect(isClickConfigured()).toBe(false);
    expect(
      buildClickPayUrl({ orderId: ORDER_ID, amountTiyin: 100, returnUrl: "https://x.uz" }),
    ).toBeNull();
  });

  it("noto'g'ri buyurtma ID yoki summani rad etadi", async () => {
    const { buildClickPayUrl } = await loadClick({ service: "112576", merchant: "57313" });
    const base = { returnUrl: "https://x.uz" };
    expect(buildClickPayUrl({ ...base, orderId: "123", amountTiyin: 100 })).toBeNull();
    expect(buildClickPayUrl({ ...base, orderId: ORDER_ID, amountTiyin: 0 })).toBeNull();
    expect(buildClickPayUrl({ ...base, orderId: ORDER_ID, amountTiyin: 10.5 })).toBeNull();
  });
});
