/**
 * attribution — Instagram reklamasi samaradorligi shu aniqlashga tayanadi.
 * Xato bo'lsa reklamadan kelganlar "direct" yoki boshqa manbaga yozilib,
 * hisobot reklamani foydasiz deb ko'rsatadi — buni build ham ushlamaydi.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { captureAttribution, detectAttribution, readAttribution, sourceFromHost } from "./attribution";

const CHROME = "Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36";
const IG = "Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36 Instagram 300.0.0.0 Android";

const d = (o: Partial<{ search: string; referrer: string; userAgent: string; pathname: string }>) =>
  detectAttribution({ search: "", referrer: "", userAgent: CHROME, pathname: "/", now: 1000, ...o });

describe("detectAttribution", () => {
  it("UTM havola — eng ustun", () => {
    const a = d({ search: "?utm_source=Instagram&utm_medium=paid&utm_campaign=okt_1&utm_content=video", userAgent: IG });
    expect(a).toMatchObject({ source: "instagram", medium: "paid", campaign: "okt_1", content: "video" });
  });

  it("Instagram ichki brauzeri, UTM siz (bio havola)", () => {
    expect(d({ userAgent: IG })).toMatchObject({ source: "instagram", medium: "social" });
    expect(d({ userAgent: IG, search: "?fbclid=abc" })).toMatchObject({ source: "instagram", fbclid: true });
  });

  it("referrer bo'yicha", () => {
    expect(d({ referrer: "https://l.instagram.com/" })?.source).toBe("instagram");
    expect(d({ referrer: "android-app://com.instagram.android/" })?.source).toBe("instagram");
    expect(d({ referrer: "https://t.me/" })?.source).toBe("telegram");
    expect(d({ referrer: "https://www.google.com/" })).toMatchObject({ source: "google", medium: "organic" });
  });

  it("fbclid, boshqa belgisiz — meta", () => {
    expect(d({ search: "?fbclid=x" })).toMatchObject({ source: "meta", fbclid: true });
  });

  it("to'g'ridan-to'g'ri va o'z saytidan o'tish — manba yo'q (eskisi saqlanadi)", () => {
    expect(d({})).toBeNull();
    expect(d({ referrer: "https://www.avtotestu.uz/variant" })).toBeNull();
  });

  it("sourceFromHost: noma'lum sayt — referral", () => {
    expect(sourceFromHost("kun.uz")).toEqual({ source: "kun.uz", medium: "referral" });
    expect(sourceFromHost("avtotestu.uz")).toBeNull();
  });

  it("kirish (OAuth) va to'lovdan qaytish — manba almashmaydi", () => {
    for (const h of ["accounts.google.com", "oauth.telegram.org", "lvdndseuobzbgzrarygu.supabase.co", "checkout.paycom.uz", "my.click.uz"]) {
      expect(sourceFromHost(h)).toBeNull();
    }
  });
});

describe("captureAttribution — oxirgi tashqi manba", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(document, "referrer", { value: "", configurable: true });
  });

  function tashrif(url: string, referrer = "") {
    window.history.replaceState(null, "", url);
    Object.defineProperty(document, "referrer", { value: referrer, configurable: true });
    captureAttribution();
  }

  it("Instagram reklamadan kelib, keyin to'g'ridan-to'g'ri qaytsa — instagram qoladi", () => {
    tashrif("/?utm_source=instagram&utm_medium=paid&utm_campaign=okt_1");
    tashrif("/");
    expect(readAttribution()).toMatchObject({ source: "instagram", campaign: "okt_1" });
  });

  it("yangi tashqi manba eskisini almashtiradi", () => {
    tashrif("/?utm_source=instagram");
    tashrif("/", "https://t.me/");
    expect(readAttribution()?.source).toBe("telegram");
  });

  it("30 kundan eski manba hisobga olinmaydi", () => {
    tashrif("/?utm_source=instagram");
    expect(readAttribution(Date.now() + 31 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});
