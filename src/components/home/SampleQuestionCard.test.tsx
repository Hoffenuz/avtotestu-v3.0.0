/**
 * SampleQuestionCard — bosh sahifadagi namunaviy savol.
 *
 * NIMA UCHUN BU TEST BOR: karta haqiqiy savol va haqiqiy javobni
 * ko'rsatadi. Noto'g'ri indeks yoki til xaritasi xatosi build/typecheck dan
 * o'tib ketadi, lekin foydalanuvchiga NOTO'G'RI javobni "to'g'ri" deb
 * ko'rsatadi — bu ishonchni birinchi soniyada yo'qotadi.
 *
 * Ko'rsatish qoidasi (egasi, 2026-09-27) ham shu yerda: mehmonga 5 ta
 * savol BIR MARTA, kirganga har kuni hovuzdan boshqa 5 ta; yechilgan savol
 * qayta chiqmaydi.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { HOME_SAMPLE_QUESTIONS, type HomeSampleQuestion } from "@/data/homeSampleQuestions";
import { HOME_SAMPLE_POOL } from "@/data/homeSamplePool";

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
import { dailySet, localDay, saveProgress } from "@/lib/sampleVisibility";

const USER = { id: "u-1" };
const BUGUN = localDay();
const BUGUNGI = dailySet(HOME_SAMPLE_POOL, BUGUN);

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

/** `savollar` ning `dan`-indeksidan boshlab `gacha` tasiga javob beradi (oxirgisida "Keyingi" bosilmaydi). */
async function javobBer(savollar: readonly HomeSampleQuestion[], dan: number, gacha: number, togri = true) {
  for (let i = dan; i < gacha; i++) {
    const q = savollar[i];
    const tanlov = togri ? q.correct : (q.correct + 1) % q.options.length;
    await userEvent.click(variantTugmasi(q.options[tanlov].uz_lat));
    if (i < savollar.length - 1) await userEvent.click(screen.getByRole("button", { name: /home\.sampleNext/ }));
  }
}

beforeEach(() => {
  joriyTil = "oz";
  joriyUser = null;
  authYuklanmoqda = false;
  trackEvent.mockClear();
  localStorage.clear();
});

describe("SampleQuestionCard — savol va javob", () => {
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
    await javobBer(HOME_SAMPLE_QUESTIONS, 0, 1);

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

  it("5 ta savoldan keyin natija, 'Yakunlash' — karta yopiladi", async () => {
    const { container } = chiqar();
    // Juft tartibdagi savollarga to'g'ri, toqlariga noto'g'ri javob beramiz.
    for (let i = 0; i < HOME_SAMPLE_QUESTIONS.length; i++) await javobBer(HOME_SAMPLE_QUESTIONS, i, i + 1, i % 2 === 0);
    const togri = Math.ceil(HOME_SAMPLE_QUESTIONS.length / 2);

    expect(screen.getByText("home.sampleScore")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "home.sampleFinish" }));

    expect(container).toBeEmptyDOMElement();
    expect(trackEvent).toHaveBeenCalledWith("home_sample_done", { score: togri, total: HOME_SAMPLE_QUESTIONS.length });
  });
});

describe("SampleQuestionCard — ma'lumot", () => {
  const tekshir = (savollar: readonly HomeSampleQuestion[]) => {
    for (const q of savollar) {
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
      for (const k of ["uz_lat", "uz_cyr", "ru"] as const) {
        expect(q.text[k].length).toBeGreaterThan(5);
        for (const o of q.options) expect(o[k].length).toBeGreaterThan(0);
      }
    }
  };

  it("mehmon savollari: to'g'ri indeks variantlar ichida, 3 tilda matn bor", () => {
    expect(HOME_SAMPLE_QUESTIONS).toHaveLength(5);
    tekshir(HOME_SAMPLE_QUESTIONS);
  });

  it("kunlik hovuz: to'liq 5 taliklar, takrorsiz, mehmon savollari yo'q", () => {
    expect(HOME_SAMPLE_POOL.length).toBeGreaterThanOrEqual(10);
    expect(HOME_SAMPLE_POOL.length % 5).toBe(0);
    tekshir(HOME_SAMPLE_POOL);
    const ids = HOME_SAMPLE_POOL.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of HOME_SAMPLE_QUESTIONS) expect(ids).not.toContain(q.id);
  });
});

describe("SampleQuestionCard — mehmon: 5 ta savol bir marta", () => {
  it("hammasini yechgan mehmonga karta qaytib chiqmaydi", async () => {
    const birinchiMarta = chiqar();
    await javobBer(HOME_SAMPLE_QUESTIONS, 0, HOME_SAMPLE_QUESTIONS.length);
    birinchiMarta.unmount();

    const { container } = chiqar();
    expect(container).toBeEmptyDOMElement();
  });

  it("oxirgi javobdan keyin natija ko'rinib turadi — karta darhol yo'qolmaydi", async () => {
    chiqar();
    await javobBer(HOME_SAMPLE_QUESTIONS, 0, HOME_SAMPLE_QUESTIONS.length);
    expect(screen.getByText("home.sampleScore")).toBeInTheDocument();
  });

  it("o'rtada chiqib ketsa — keyingi safar KEYINGI savoldan davom etadi", async () => {
    const birinchiMarta = chiqar();
    await javobBer(HOME_SAMPLE_QUESTIONS, 0, 2);
    birinchiMarta.unmount();

    chiqar();
    expect(screen.getByText(HOME_SAMPLE_QUESTIONS[2].text.uz_lat)).toBeInTheDocument();
    expect(screen.getByText(`3 / ${HOME_SAMPLE_QUESTIONS.length}`)).toBeInTheDocument();
    expect(screen.queryByText(birinchi.text.uz_lat)).toBeNull();
  });

  it("javob berib, 'Keyingi' ni bosmay chiqib ketsa ham o'sha savol qaytmaydi", async () => {
    const birinchiMarta = chiqar();
    await userEvent.click(variantTugmasi(birinchi.options[birinchi.correct].uz_lat));
    birinchiMarta.unmount();

    chiqar();
    expect(screen.getByText(HOME_SAMPLE_QUESTIONS[1].text.uz_lat)).toBeInTheDocument();
  });

  it("mehmon kunlik hovuzni yuklamaydi — doimiy savollar darhol (sinxron) chiqadi", () => {
    chiqar();
    // `findBy` emas, `getBy`: kutish yo'q — tarmoq so'rovisiz, birinchi renderda.
    expect(screen.getByText(birinchi.text.uz_lat)).toBeInTheDocument();
  });

  it("kirish holati aniqlanguncha karta chizilmaydi (paydo bo'lib yo'qolmasin)", () => {
    authYuklanmoqda = true;
    const { container } = chiqar();
    expect(container).toBeEmptyDOMElement();
  });
});

describe("SampleQuestionCard — kirgan: har kuni boshqa 5 ta", () => {
  beforeEach(() => {
    joriyUser = USER;
  });

  it("bugungi to'plam hovuzdan chiqadi", async () => {
    chiqar();
    expect(await screen.findByText(BUGUNGI[0].text.uz_lat)).toBeInTheDocument();
    expect(screen.queryByText(birinchi.text.uz_lat)).toBeNull();
  });

  it("bugun yechib bo'lgan bo'lsa karta chiqmaydi", async () => {
    saveProgress(USER.id, { next: 5, score: 3 }, BUGUN);
    const { container } = chiqar();
    // Hovuz ham so'ralmaydi — kutsak ham bo'sh qoladi.
    await new Promise((r) => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
  });

  it("kecha yechgan bo'lsa bugun yangi to'plam boshidan chiqadi", async () => {
    saveProgress(USER.id, { next: 5, score: 5 }, "2000-01-01");
    chiqar();
    expect(await screen.findByText(BUGUNGI[0].text.uz_lat)).toBeInTheDocument();
    expect(screen.getByText(`1 / ${BUGUNGI.length}`)).toBeInTheDocument();
  });

  it("boshqa akkaunt yechgani bu foydalanuvchiga ta'sir qilmaydi", async () => {
    saveProgress("boshqa", { next: 5, score: 5 }, BUGUN);
    chiqar();
    expect(await screen.findByText(BUGUNGI[0].text.uz_lat)).toBeInTheDocument();
  });

  it("mehmon sifatida yechgani kirgandan keyingi kunlik to'plamni yopmaydi", async () => {
    saveProgress(null, { next: 5, score: 5 });
    chiqar();
    expect(await screen.findByText(BUGUNGI[0].text.uz_lat)).toBeInTheDocument();
  });

  it("bugun hammasini yechsa — qayta ochilganda chiqmaydi", async () => {
    const birinchiMarta = chiqar();
    await screen.findByText(BUGUNGI[0].text.uz_lat);
    await javobBer(BUGUNGI, 0, BUGUNGI.length);
    birinchiMarta.unmount();

    const { container } = chiqar();
    await new Promise((r) => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
  });
});

describe("kunlik to'plam (dailySet)", () => {
  it("ketma-ket kunlar — turli to'plamlar, hovuz tugagach boshidan", () => {
    const sets = HOME_SAMPLE_POOL.length / 5;
    const kun = (n: number) => localDay(new Date(2026, 0, 1 + n));
    const ids = (n: number) => dailySet(HOME_SAMPLE_POOL, kun(n)).map((q) => q.id).join();

    const korilgan = new Set<string>();
    for (let n = 0; n < sets; n++) korilgan.add(ids(n));
    expect(korilgan.size).toBe(sets); // har kuni boshqa to'plam
    expect(ids(sets)).toBe(ids(0)); // keyin boshidan
    expect(dailySet(HOME_SAMPLE_POOL, kun(3))).toHaveLength(5);
  });
});

/**
 * "Testni davom ettirish" — /test-ishlash ga "darhol 20 talik" holati bilan
 * o'tishi SHART: holat yo'qolsa tugma jimgina oddiy boshlash sahifasini
 * ochadigan bo'lib qoladi (build ham, typecheck ham buni ushlamaydi).
 */
describe("SampleQuestionCard — testni davom ettirish", () => {
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
    // Hech narsa yechilmagan — hech narsa yozilmaydi
    expect(localStorage.length).toBe(0);
  });
});
