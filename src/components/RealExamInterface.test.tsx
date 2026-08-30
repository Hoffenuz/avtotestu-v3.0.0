/**
 * Real imtihon ekrani — render va asosiy oqim testi.
 *
 * NIMA UCHUN: imtihon ekrani rasmiy dastur ko'rinishini takrorlaydi va
 * unda saytning odatdagi qismlaridan farqli qoidalar bor (izoh yo'q, til
 * tanlash yo'q, javob berilgach o'zgartirib bo'lmaydi). Bunday qoidalar
 * build/lint/typecheck dan bemalol o'tib ketadi — faqat render paytida
 * tekshirsa bo'ladi.
 */
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

/**
 * Ikkita savol — biri rasmli, biri rasmsiz.
 *
 * `vi.hoisted` SHART: `vi.mock` fayl boshiga ko'chiriladi, oddiy `const`
 * esa undan keyin e'lon qilinadi va fabrika ichida hali mavjud bo'lmaydi.
 */
const { POOL } = vi.hoisted(() => {
  const q = (n: number, text: string, a: string, b: string, correct: 1 | 2, image?: string) => ({
    task_info: { global_id: `t_1_q_${n}` },
    content: {
      uz_lat: {
        text,
        options: [
          { id: 1, text: a, is_correct: correct === 1 },
          { id: 2, text: b, is_correct: correct === 2 },
        ],
      },
    },
    media_url: image,
    izoh: { uz_lat: 'BU IZOH KORINMASLIGI KERAK' },
  });

  return {
    POOL: [
      q(1, 'Birinchi savol matni', 'Javob A', 'Javob B', 1, 'a.png'),
      q(2, 'Ikkinchi savol matni', 'Javob C', 'Javob D', 2),
    ],
  };
});

vi.mock('@/lib/fetchQuestionJson', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/fetchQuestionJson')>();
  return { ...actual, fetchQuestionJson: vi.fn() };
});

vi.mock('@/lib/questionState', () => ({ recordQuestionAnswers: vi.fn() }));

import { RealExamInterface } from './RealExamInterface';
import { fetchQuestionJson } from '@/lib/fetchQuestionJson';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

async function renderExam(onExit = vi.fn()) {
  await act(async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LanguageProvider>
            <RealExamInterface
              onExit={onExit}
              dataSource="/test-pool.json"
              questionCount={2}
              timeLimit={25 * 60}
              variant={97}
            />
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
  });
  return { onExit };
}

describe('RealExamInterface', () => {
  beforeEach(() => {
    localStorage.clear();
    /**
     * Implementatsiya HAR TESTDA qayta beriladi: vitest config da
     * `restoreMocks: true` — u har testdan oldin mock larni tozalaydi va
     * modul fabrikasida berilgan qiymat yo'qolib, `undefined` qaytardi.
     */
    vi.mocked(fetchQuestionJson).mockResolvedValue(POOL);
  });

  it('savol va javoblarni ko\'rsatadi', async () => {
    await renderExam();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/savol matni/i);
    expect(screen.getAllByRole('button', { pressed: false }).length).toBeGreaterThan(0);
  });

  it('IZOH ko\'rsatilmaydi', async () => {
    await renderExam();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.queryByText(/BU IZOH KORINMASLIGI KERAK/)).toBeNull();
    expect(screen.queryByText(/^Izoh$/i)).toBeNull();
  });

  it('javob tanlangach uni o\'zgartirib bo\'lmaydi', async () => {
    const user = userEvent.setup();
    await renderExam();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    /**
     * Savollar TASODIFIY tartibda chiqadi, shuning uchun aniq matnga
     * (`Javob A`) bog'lanib bo'lmaydi — javob tugmalari `aria-pressed`
     * bilan ajratiladi.
     */
    const answerButtons = () =>
      screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));

    const before = answerButtons();
    expect(before.length).toBe(2);
    for (const b of before) expect(b).toBeEnabled();

    await user.click(before[0]);

    const after = answerButtons();
    expect(after.length).toBe(2);
    for (const b of after) expect(b).toBeDisabled();
  });

  it('savol raqamlari va taymer ko\'rinadi', async () => {
    await renderExam();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    // Raqamlar bo'yicha o'tish tugmalari
    expect(screen.getByRole('button', { name: /1$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2$/ })).toBeInTheDocument();

    // Taymer S:MM:SS ko'rinishida
    expect(screen.getByText(/^\d:\d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it('javobdan keyin keyingi savolga O\'ZI o\'tadi', async () => {
    const user = userEvent.setup();
    await renderExam();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    const savol = () => screen.getByRole('heading', { level: 1 }).textContent ?? '';
    const birinchi = savol();

    const answers = screen
      .getAllByRole('button')
      .filter((b) => b.hasAttribute('aria-pressed'));
    await user.click(answers[0]);

    // ~900 ms kechikishdan keyin ikkinchi savolga o'tishi kerak
    await waitFor(() => expect(savol()).not.toBe(birinchi), { timeout: 3000 });
  });

  it('til tanlash tugmalari YO\'Q', async () => {
    await renderExam();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    for (const label of ['Lotin', 'Кирилл', 'Русский', "O'zbekcha"]) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });
});
