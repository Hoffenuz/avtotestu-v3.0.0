/**
 * LanguageContext — til almashtirilganda JORIY sahifada qolish.
 *
 * NIMA UCHUN BU TEST BOR: bu yerda haqiqiy xato bo'lgan. `LanguageProvider`
 * `<Routes>` dan YUQORIDA turadi va `useLocation()` ni ishlatmaydi, ya'ni
 * client-side o'tishlarda QAYTA RENDER BO'LMAYDI. Yo'l render vaqtida
 * o'qilgani uchun u sahifa birinchi yuklangan manzilda qotib qolardi:
 * `/profile` da ochilgan sayt keyin boshqa sahifaga o'tsa ham, til
 * almashtirilganda foydalanuvchi akkauntga qaytarib tashlanardi.
 *
 * Bunday xatoni build ham, typecheck ham ushlamaydi — u faqat "sahifa
 * almashdi, provider esa almashmadi" holatini o'ynab ko'rilganda ochiladi.
 */
import { render, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { LanguageProvider, useLanguage, type Language } from "./LanguageContext";

let assignMock: ReturnType<typeof vi.fn>;

/** Brauzer manzilini almashtiradi — client-side o'tish shunday ko'rinadi. */
function manzilQoy(pathname: string, search = "", hash = "") {
  Object.defineProperty(window, "location", {
    value: { pathname, search, hash, assign: assignMock },
    writable: true,
    configurable: true,
  });
}

let almashtir: (lang: Language) => void;

function Sinov() {
  const { setLanguage } = useLanguage();
  almashtir = setLanguage;
  return null;
}

function chiqar() {
  return render(
    <LanguageProvider>
      <Sinov />
    </LanguageProvider>,
  );
}

describe("LanguageContext — til almashtirish", () => {
  beforeEach(() => {
    assignMock = vi.fn();
  });

  it("joriy sahifada qoladi, faqat prefiks qo'shiladi", () => {
    manzilQoy("/belgilar");
    chiqar();
    act(() => almashtir("ru"));
    expect(assignMock).toHaveBeenCalledWith("/ru/belgilar");
  });

  it("kirill uchun /cyr prefiksini qo'yadi", () => {
    manzilQoy("/belgilar");
    chiqar();
    act(() => almashtir("uz"));
    expect(assignMock).toHaveBeenCalledWith("/cyr/belgilar");
  });

  it("prefiksli manzildan asosiy tilga prefikssiz qaytadi", () => {
    manzilQoy("/ru/belgilar");
    chiqar();
    act(() => almashtir("uz-lat"));
    expect(assignMock).toHaveBeenCalledWith("/belgilar");
  });

  it("bosh sahifada ham to'g'ri ishlaydi", () => {
    manzilQoy("/");
    chiqar();
    act(() => almashtir("ru"));
    expect(assignMock).toHaveBeenCalledWith("/ru");
  });

  it("so'rov va hash saqlanadi", () => {
    manzilQoy("/qidirish", "?q=belgi", "#natija");
    chiqar();
    act(() => almashtir("ru"));
    expect(assignMock).toHaveBeenCalledWith("/ru/qidirish?q=belgi#natija");
  });

  /*
    ASOSIY TEST — aynan shu xato yuz bergan edi.

    Provider `/profile` da yaratiladi, keyin foydalanuvchi client-side
    boshqa sahifaga o'tadi. Provider QAYTA RENDER QILINMAYDI (bu yerda
    ataylab qayta chiqarilmaydi ham) — faqat manzil o'zgaradi.
  */
  it("client-side o'tishdan keyin AKKAUNTGA qaytarmaydi", () => {
    manzilQoy("/profile");
    chiqar();

    // Foydalanuvchi `/belgilar` ga o'tdi — provider qayta render bo'lmadi.
    manzilQoy("/belgilar");
    act(() => almashtir("ru"));

    expect(assignMock).toHaveBeenCalledWith("/ru/belgilar");
    expect(assignMock).not.toHaveBeenCalledWith("/ru/profile");
  });

  it("client-side o'tishdan keyin /auth ga ham qaytarmaydi", () => {
    manzilQoy("/auth");
    chiqar();

    manzilQoy("/test-ishlash");
    act(() => almashtir("uz"));

    expect(assignMock).toHaveBeenCalledWith("/cyr/test-ishlash");
    expect(assignMock).not.toHaveBeenCalledWith("/cyr/auth");
  });
});
