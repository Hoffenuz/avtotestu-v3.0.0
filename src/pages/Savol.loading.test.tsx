/**
 * /savol/:slug — to'liq ro'yxat (public/data/savol-index.json) yuklanmasa
 * sahifa cheksiz spinnerda qolmaydi: xato va "Qayta urinish" ko'rinadi
 * (audit ENG-02). Qayta urinish muvaffaqiyatli bo'lsa savol ochiladi.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import Savol from "./Savol";

/** Bundle'da (variant 59) YO'Q slug — sahifa to'liq ro'yxatni yuklashga majbur. */
const SLUG = "test-savol-bundleda-yoq";

const savol = {
  globalId: "t_test_q_1",
  slug: SLUG,
  order: 1,
  ticketNum: 1,
  text: "Sinov savoli matni",
  options: [
    { id: 1, label: "F1", text: "To'g'ri javob", isCorrect: true },
    { id: 2, label: "F2", text: "Noto'g'ri javob", isCorrect: false },
  ],
  correctId: 1,
  correctText: "To'g'ri javob",
  explanation: "Izoh",
  imageUrl: null,
  topicLabel: "Mavzu",
  topicLink: "/mavzuli-testlar",
  canonicalPath: `/savol/${SLUG}`,
  globalIdPath: "/savol/t_test_q_1",
};

function chiqar() {
  return render(
    <MemoryRouter initialEntries={[`/savol/${SLUG}`]}>
      <Routes>
        <Route path="/savol/:slug" element={<Savol />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Savol sahifasi — ro'yxat yuklanmasa", () => {
  it.each([
    ["HTTP 404", () => Promise.resolve(new Response("", { status: 404 }))],
    ["tarmoq xatosi", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["buzuq JSON", () => Promise.resolve(new Response("<html>", { status: 200 }))],
  ])("%s — xato va 'Qayta urinish' ko'rinadi", async (_nom, javob) => {
    vi.stubGlobal("fetch", vi.fn(javob));
    chiqar();
    expect(await screen.findByText("Savol yuklanmadi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Qayta urinish" })).toBeInTheDocument();
  });

  it("qayta urinish muvaffaqiyatli bo'lsa savol ochiladi", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ questions: [savol] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    chiqar();

    fireEvent.click(await screen.findByRole("button", { name: "Qayta urinish" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Sinov savoli matni" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
