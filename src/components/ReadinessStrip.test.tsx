/**
 * ReadinessStrip + useReadiness — bosh sahifa tasmasi.
 *
 * Nima uchun test kerak: tasma ilgari faqat ma'lumot KELGANDA chizilardi va
 * hero'ni 55px pastga surardi; test ishlamagan foydalanuvchida esa umuman
 * chiqmasdi. Endi har holatda joy egallashi va bosh sahifadagi ikki
 * iste'molchi (tasma + karta) bitta RPC ni bo'lishishi shart.
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const rpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

const mockAuth = { user: null as { id: string } | null };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

import { ReadinessStrip } from './ReadinessStrip';
import { useReadiness } from '@/hooks/useReadiness';
import { LanguageProvider } from '@/contexts/LanguageContext';

const ROW = {
  readiness_percent: 11, accuracy_percent: 60, coverage_percent: 10, variants_percent: 5,
  mastery_percent: 3, tests_percent: 10, tests_total: 4, tests_today: 1, tests_target: 3,
  questions_seen: 80, questions_total: 1275, questions_mastered: 10, questions_to_review: 2,
  variants_passed: 1, variants_attempted: 2, variants_total: 64, level_index: 1,
  level_min_percent: 0, level_next_percent: 30, percent_to_next: 19, exam_date: null,
  days_to_exam: null, streak_days: 3, has_data: true,
};

/** Modul darajasidagi kesh foydalanuvchi bo'yicha — har test o'z id si bilan. */
let seq = 0;
const nextUser = () => ({ id: `00000000-0000-0000-0000-${String(++seq).padStart(12, '0')}` });

/** Bosh sahifadagi karta o'rnida — xuddi shu hookni ishlatuvchi ikkinchi komponent. */
function SecondConsumer() {
  const { data } = useReadiness();
  return <span data-testid="second">{data ? data.readinessPercent : '-'}</span>;
}

function renderStrip(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  rpc.mockReset();
  mockAuth.user = null;
});

describe('ReadinessStrip', () => {
  it('sessiya kutilayotganda skelet chizadi (joy zahiralanadi, havola yo\'q)', () => {
    const { container } = renderStrip(<ReadinessStrip pending />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('a')).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('ma\'lumot kelguncha skelet, kelgach daraja va xato savollar', async () => {
    mockAuth.user = nextUser();
    let resolve: (v: unknown) => void = () => {};
    rpc.mockReturnValue(new Promise((r) => { resolve = r; }));

    const { container } = renderStrip(<ReadinessStrip />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');

    await act(async () => resolve({ data: [ROW], error: null }));

    await waitFor(() => expect(screen.getByText("Boshlang'ich")).toBeTruthy());
    const mistakes = container.querySelector('a[href="/xatolarim"]');
    expect(mistakes?.textContent).toContain('2');
  });

  it('hali test ishlanmagan bo\'lsa — test boshlash taklifi (yo\'qolib qolmaydi)', async () => {
    mockAuth.user = nextUser();
    rpc.mockResolvedValue({ data: [{ ...ROW, has_data: false, readiness_percent: 0 }], error: null });

    const { container } = renderStrip(<ReadinessStrip />);
    await waitFor(() => expect(container.querySelector('a[href="/test-ishlash"]')).not.toBeNull());
  });

  it('so\'rov xato bilan tugasa ham tasma qoladi (profilga havola)', async () => {
    mockAuth.user = nextUser();
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const { container } = renderStrip(<ReadinessStrip />);
    await waitFor(() => expect(container.querySelector('a[href="/profile"]')).not.toBeNull());
  });

  it('bir sahifadagi ikki iste\'molchi bitta RPC ni bo\'lishadi', async () => {
    mockAuth.user = nextUser();
    rpc.mockResolvedValue({ data: [ROW], error: null });

    renderStrip(
      <>
        <ReadinessStrip />
        <SecondConsumer />
      </>,
    );

    await waitFor(() => expect(screen.getByTestId('second').textContent).toBe('11'));
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('get_user_readiness');
  });
});
