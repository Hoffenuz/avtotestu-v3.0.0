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
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { HOME_SAMPLE_QUESTIONS } from "@/data/homeSampleQuestions";

let joriyTil: "oz" | "uz" | "ru" = "oz";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (k: string) => (k === "home.sampleWrong" ? "NOTOGRI:{answer}" : k),
    questionLang: joriyTil,
  }),
}));

/** Kirish holati: `null` — mehmon. */
let joriyUser: { id: string } | null = null;
let authYuklanmoqda = false;
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: joriyUser, isLoading: authYuklanmoqda }),
}));

const trackEvent = vi.fn();
vi.mock("@/lib/track", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { SampleQuestionCard } from "./SampleQuestionCard";
import { localDay, sampleDoneKey } from "@/lib/sampleVisibility";

const USER = { id: "u-1" };
const BUGUN = localDay();
/** Kirgan foydalanuvchi uchun yozilgan "bugun tugatdi" belgisi. */
const belgi = () => localStorage.getItem(sampleDoneKey(USER.id));

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
    joriyUser = null;
    authYuklanmoqda = false;
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
  it("kirgan: 5 ta savoldan keyin natija, 'Yakunlash' — karta yopiladi, bugunga eslanadi", async () => {
    joriyUser = USER;
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
    expect(belgi()).toBe(BUGUN);
    expect(trackEvent).toHaveBeenCalledWith("home_sample_done", { score: togri, total: HOME_SAMPLE_QUESTIONS.length });
  });

  it("kirgan: bugun tugatgan bo'lsa karta chizilmaydi", () => {
    joriyUser = USER;
    localStorage.setItem(sampleDoneKey(USER.id), BUGUN);
    const { container } = chiqar();
    expect(container).toBeEmptyDOMElement();
  });

  it("kirgan: kecha tugatgan bo'lsa bugun yana chiqadi", () => {
    joriyUser = USER;
    localStorage.setItem(sampleDoneKey(USER.id), "2000-01-01");
    chiqar();
    expect(screen.getByText(birinchi.text.uz_lat)).toBeInTheDocument();
  });

  it("boshqa akkaunt tugatgani bu foydalanuvchidan yashirmaydi", () => {
    joriyUser = USER;
    localStorage.setItem(sampleDoneKey("boshqa"), BUGUN);
    chiqar();
    expect(screen.getByText(birinchi.text.uz_lat)).toBeInTheDocument();
  });

  it("mehmon: tugatsa ham hech narsa eslanmaydi — keyingi safar yana chiqadi", async () => {
    const birinchiMarta = chiqar();
    for (let i = 0; i < HOME_SAMPLE_QUESTIONS.length; i++) {
      const q = HOME_SAMPLE_QUESTIONS[i];
      await userEvent.click(variantTugmasi(q.options[q.correct].uz_lat));
      if (i < HOME_SAMPLE_QUESTIONS.length - 1) {
        await userEvent.click(screen.getByRole("button", { name: /home\.sampleNext/ }));
      }
    }
    await userEvent.click(screen.getByRole("button", { name: "home.sampleFinish" }));
    expect(birinchiMarta.container).toBeEmptyDOMElement();
    expect(localStorage.length).toBe(0);

    birinchiMarta.unmount();
    chiqar();
    expect(screen.getByText(birinchi.text.uz_lat)).toBeInTheDocument();
  });

  it("kirish holati aniqlanguncha karta chizilmaydi (paydo bo'lib yo'qolmasin)", () => {
    authYuklanmoqda = true;
    const { container } = chiqar();
    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * "Testni davom ettirish" — /test-ishlash ga "darhol 20 talik" holati bilan
 * o'tishi SHART: holat yo'qolsa tugma jimgina oddiy boshlash sahifasini
 * ochadigan bo'lib qoladi (build ham, typecheck ham buni ushlamaydi).
 */
describe("SampleQuestionCard — testni davom ettirish", () => {
  beforeEach(() => {
    joriyTil = "oz";
    trackEvent.mockClear();
    localStorage.clear();
    joriyUser = null;
    authYuklanmoqda = false;
  });

  function QayergaOtdi() {
    const location = useLocation();
    return <p data-testid="manzil">{`${location.pathname}|${JSON.stringify(location.state)}`}</p>;
  }

  function chiqarYollar() {
    return render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<SampleQuestionCard />} />
          <Route path="/test-ishlash" element={<QayergaOtdi />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("javobdan oldin ham bosiladi: /test-ishlash, 20 talik darhol boshlanadi", async () => {
    chiqarYollar();
    await userEvent.click(screen.getByRole("button", { name: /home\.sampleContinue/ }));
    expect(screen.getByTestId("manzil").textContent).toBe('/test-ishlash|{"autoStart":20}');
    expect(trackEvent).toHaveBeenCalledWith("home_sample_continue", { question: 1, answered: false });
    // O'rtada bosilgan — karta keyingi safar yana chiqadi
    expect(localStorage.length).toBe(0);
  });

  it("kirgan: oxirgi savolga javobdan keyin bosilsa — bugunga tugagan deb eslanadi", async () => {
    joriyUser = USER;
    chiqarYollar();
    for (let i = 0; i < HOME_SAMPLE_QUESTIONS.length; i++) {
      const q = HOME_SAMPLE_QUESTIONS[i];
      await userEvent.click(variantTugmasi(q.options[q.correct].uz_lat));
      if (i < HOME_SAMPLE_QUESTIONS.length - 1) {
        await userEvent.click(screen.getByRole("button", { name: /home\.sampleNext/ }));
      }
    }
    await userEvent.click(screen.getByRole("button", { name: /home\.sampleContinue/ }));
    expect(screen.getByTestId("manzil").textContent).toBe('/test-ishlash|{"autoStart":20}');
    expect(belgi()).toBe(BUGUN);
  });
});
