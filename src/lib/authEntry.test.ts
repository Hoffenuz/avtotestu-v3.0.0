/**
 * authEntry — /auth qaysi tabda ochiladi va qayerga qaytaradi.
 *
 * NIMA UCHUN: bu yagona qaror nuqtasi. Xato bo'lsa yangi odam yana "Kirish"
 * formasiga tushadi (ro'yxatdan o'tish kamayadi) yoki `returnTo` orqali
 * boshqa saytga yo'naltirish (open redirect) ochilib qoladi.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { authState, defaultAuthMode, hasKnownAccount, rememberKnownAccount } from "./authEntry";

describe("authEntry", () => {
  beforeEach(() => localStorage.clear());

  it("yangi qurilma — ro'yxatdan o'tish; kirilgandan keyin — kirish", () => {
    expect(hasKnownAccount()).toBe(false);
    expect(defaultAuthMode()).toBe("signup");
    rememberKnownAccount();
    expect(defaultAuthMode()).toBe("login");
  });

  it("saqlangan sessiya bo'lsa ham — kirish", () => {
    localStorage.setItem("sb-lvdndseuobzbgzrarygu-auth-token", JSON.stringify({ access_token: "x" }));
    expect(defaultAuthMode()).toBe("login");
  });

  it("returnTo: faqat sayt ichidagi yo'l, /auth ning o'zi emas", () => {
    expect(authState("/pro")).toEqual({ returnTo: "/pro" });
    expect(authState("/xatolarim?x=1", "signup")).toEqual({ returnTo: "/xatolarim?x=1", mode: "signup" });
    expect(authState("//evil.com")).toEqual({});
    expect(authState("https://evil.com")).toEqual({});
    expect(authState("/auth")).toEqual({});
    expect(authState(undefined)).toEqual({});
  });
});
