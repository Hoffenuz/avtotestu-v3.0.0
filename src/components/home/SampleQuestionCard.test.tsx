/**
 * SampleQuestionCard — bosh sahifadagi namunaviy savol.
 *
 * NIMA UCHUN BU TEST BOR: karta haqiqiy savol va haqiqiy javobni
 * ko'rsatadi. Noto'g'ri indeks yoki til xaritasi xatosi build/typecheck dan
 * o'tib ketadi, lekin foydalanuvchiga NOTO'G'RI javobni "to'g'ri" deb
 * ko'rsatadi — bu ishonchni birinchi soniyada yo'qotadi.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { HOME_SAMPLE_QUESTIONS } from "@/data/homeSampleQuestions";

let joriyTil: "oz" | "uz" | "ru" = "oz";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (k: string) => (k === "home.sampleWrong" ? "NOTOGRI:{answer}" : k),
    questionLang: joriyTil,
  }),
}));

const trackEvent = vi.fn();
vi.mock("@/lib/track", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { SampleQuestionCard, SAMPLE_DONE_KEY } from "./SampleQuestionCard";

function chiqar() {
  return render(
    <MemoryRouter>
      <SampleQuestionCard />
    </MemoryRouter>,
  );
}

const birinchi = HOME_SAMPLE_QUESTIONS[0];
/** Tugma nomi = variant matni (F1/F2 yorlig'i va ikonkalar `aria-hidden`). */
const variantTugmasi = (matn: string) => screen.getByRole("button", { name: matn });

describe("SampleQuestionCard", () => {
  beforeEach(() => {
    joriyTil = "oz";
    trackEvent.mockClear();
    localStorage.clear();
  });

  it("birinchi savol va uning variantlari ko'rsatiladi, maslahat bor", () => {
    chiqar();
    expect(screen.getByText(birinchi.text.uz_lat)).toBeInTheDocument();
    for (const o of birinchi.options) expect(variantTugmasi(o.uz_lat)).toBeEnabled();
    expect(screen.getByText("home.sampleHint")).toBeInTheDocument();
    expect(screen.getByText(`1 / ${HOME_SAMPLE_QUESTIONS.length}`)).toBeInTheDocument();
  });

  it("to'g'ri javob: 'to'g'ri' xabari, variantlar qulflanadi, GA hodisasi", async () => {
    chiqar();
    await userEvent.click(variantTugmasi(birinchi.options[birinchi.correct].uz_lat));

    expect(screen.getByText("home.sampleCorrect")).toBeInTheDocument();
    for (const o of birinchi.options) expect(variantTugmasi(o.uz_lat)).toBeDisabled();
    expect(trackEvent).toHaveBeenCalledWith("home_sample_answer", { question: birinchi.id, correct: true });
  });

  it("noto'g'ri javob: to'g'ri javob MATNI bilan aytiladi", async () => {
    chiqar();
    const notogriIndeks = birinchi.options.findIndex((_, i) => i !== birinchi.correct);
    await userEvent.click(variantTugmasi(birinchi.options[notogriIndeks].uz_lat));

    expect(screen.getByText(`NOTOGRI:${birinchi.options[birinchi.correct].uz_lat}`)).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith("home_sample_answer", { question: birinchi.id, correct: false });
  });

  it("'Keyingi savol' — ikkinchi savol, holat tozalanadi", async () => {
    chiqar();
    await userEvent.click(variantTugmasi(birinchi.options[0].uz_lat));
    await userEvent.click(screen.getByRole("button", { name: /home\.sampleNext/ }));

    const ikkinchi = HOME_SAMPLE_QUESTIONS[1];
    expect(screen.getByText(ikkinchi.text.uz_lat)).toBeInTheDocument();
    expect(screen.getByText("home.sampleHint")).toBeInTheDocument();
    for (const o of ikkinchi.options) expect(variantTugmasi(o.uz_lat)).toBeEnabled();
  });

  it("rus tilida savol ruscha chiqadi", () => {
    joriyTil = "ru";
    chiqar();
    expect(screen.getByText(birinchi.text.ru)).toBeInTheDocument();
  });

  it("ma'lumot to'g'ri: har savolda to'g'ri indeks variantlar ichida, 3 tilda matn bor", () => {
    for (const q of HOME_SAMPLE_QUESTIONS) {
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
      for (const k of ["uz_lat", "uz_cyr", "ru"] as const) {
        expect(q.text[k].length).toBeGreaterThan(5);
        for (const o of q.options) expect(o[k].length).toBeGreaterThan(0);
      }
    }
  });
  it("5 ta savoldan keyin natija, 'Yakunlash' — karta yopiladi va eslab qolinadi", async () => {
    const { container } = chiqar();
    // Juft tartibdagi savollarga to'g'ri, toqlariga noto'g'ri javob beramiz.
    const togri = Math.ceil(HOME_SAMPLE_QUESTIONS.length / 2);
    for (let i = 0; i < HOME_SAMPLE_QUESTIONS.length; i++) {
      const q = HOME_SAMPLE_QUESTIONS[i];
      const tanlov = i % 2 === 0 ? q.correct : (q.correct + 1) % q.options.length;
      await userEvent.click(variantTugmasi(q.options[tanlov].uz_lat));
      if (i < HOME_SAMPLE_QUESTIONS.length - 1) {
        await userEvent.click(screen.getByRole("button", { name: /home\.sampleNext/ }));
      }
    }

    // Oxirgi savolda: natija va "Yakunlash"
    expect(screen.getByText("home.sampleScore")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "home.sampleFinish" }));

    expect(container).toBeEmptyDOMElement();
    expect(localStorage.getItem(SAMPLE_DONE_KEY)).toBe("1");
    expect(trackEvent).toHaveBeenCalledWith("home_sample_done", { score: togri, total: HOME_SAMPLE_QUESTIONS.length });
  });

  it("avval yakunlangan bo'lsa karta umuman chizilmaydi", () => {
    localStorage.setItem(SAMPLE_DONE_KEY, "1");
    const { container } = chiqar();
    expect(container).toBeEmptyDOMElement();
  });
});
