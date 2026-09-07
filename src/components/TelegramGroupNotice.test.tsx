/**
 * TelegramGroupNotice — "bitta foydalanuvchiga bir marta" kafolati.
 *
 * NIMA UCHUN BU TEST BOR: bu yerda haqiqiy xato bo'lgan. Xabarnoma
 * hisobda yopilgach, foydalanuvchi chiqib ketsa QAYTA chiqib qolardi —
 * chunki `user?.id` yo'qolib, tekshiruv mehmon kalitiga o'tib ketardi va
 * o'sha kalit yozilmagan bo'lardi. Bunday xato build, lint va typecheck
 * dan bemalol o'tadi; uni faqat holat almashuvini o'ynab ko'rish ochadi.
 */
import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

/** Joriy foydalanuvchi — har testda almashtiriladi. */
let joriyUser: { id: string } | null = null;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: joriyUser }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

import { TelegramGroupNotice } from "./TelegramGroupNotice";

function chiqar() {
  return render(
    <MemoryRouter>
      <TelegramGroupNotice />
    </MemoryRouter>,
  );
}

/** Xabarnoma ekrandami. */
function korinyaptimi(): boolean {
  return screen.queryByText("tgGroup.title") !== null;
}

describe("TelegramGroupNotice — bir marta ko'rsatish", () => {
  beforeEach(() => {
    localStorage.clear();
    joriyUser = null;
  });

  it("mehmonga birinchi kirishda ko'rinadi", () => {
    chiqar();
    expect(korinyaptimi()).toBe(true);
  });

  it("yopilgach o'sha zahoti yo'qoladi", async () => {
    const user = userEvent.setup();
    chiqar();
    await user.click(screen.getByRole("button", { name: "tgGroup.close" }));
    expect(korinyaptimi()).toBe(false);
  });

  it("yopilgandan keyin qayta render qilinganda chiqmaydi", async () => {
    const user = userEvent.setup();
    const { unmount } = chiqar();
    await user.click(screen.getByRole("button", { name: "tgGroup.close" }));
    unmount();

    chiqar();
    expect(korinyaptimi()).toBe(false);
  });

  /*
    ASOSIY TEST — aynan shu xato bo'lgan edi.
  */
  it("hisobda yopilgach, CHIQIB KETGANDA ham qaytib chiqmaydi", async () => {
    const user = userEvent.setup();

    // 1. Foydalanuvchi kirgan va xabarnomani yopadi
    joriyUser = { id: "user-abc" };
    const { unmount } = chiqar();
    expect(korinyaptimi()).toBe(true);
    await user.click(screen.getByRole("button", { name: "tgGroup.close" }));
    unmount();

    // 2. Hisobdan chiqadi — endi mehmon
    joriyUser = null;
    chiqar();

    expect(korinyaptimi()).toBe(false);
  });

  it("mehmonligida yopilgach, KIRGANDA ham qaytib chiqmaydi", async () => {
    const user = userEvent.setup();

    joriyUser = null;
    const { unmount } = chiqar();
    await user.click(screen.getByRole("button", { name: "tgGroup.close" }));
    unmount();

    joriyUser = { id: "user-xyz" };
    chiqar();

    expect(korinyaptimi()).toBe(false);
  });

  it("hisob almashganda ham qaytib chiqmaydi", async () => {
    const user = userEvent.setup();

    joriyUser = { id: "user-1" };
    const { unmount } = chiqar();
    await user.click(screen.getByRole("button", { name: "tgGroup.close" }));
    unmount();

    joriyUser = { id: "user-2" };
    chiqar();

    expect(korinyaptimi()).toBe(false);
  });

  it("ochiq turgan xabarnoma hisob aniqlangach o'chib qolmaydi", async () => {
    // Hech narsa yopilmagan: kirish holati o'zgarsa ham ko'rinib turishi kerak
    joriyUser = null;
    const { rerender } = chiqar();
    expect(korinyaptimi()).toBe(true);

    joriyUser = { id: "user-yangi" };
    await act(async () => {
      rerender(
        <MemoryRouter>
          <TelegramGroupNotice />
        </MemoryRouter>,
      );
    });

    expect(korinyaptimi()).toBe(true);
  });

  it("localStorage ishlamasa umuman ko'rsatilmaydi", () => {
    const asl = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("maxfiy rejim");
    };
    try {
      chiqar();
      expect(korinyaptimi()).toBe(false);
    } finally {
      Storage.prototype.getItem = asl;
    }
  });

  it("guruh havolasi bosilganda ham yopilgan deb belgilanadi", async () => {
    const user = userEvent.setup();
    const { unmount } = chiqar();

    await user.click(screen.getByRole("link", { name: /tgGroup\.join/ }));
    unmount();

    chiqar();
    expect(korinyaptimi()).toBe(false);
  });
});
