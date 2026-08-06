/**
 * Ro'yxatdan o'tib qaytgan foydalanuvchi to'g'ridan-to'g'ri Payme ga
 * o'tkazilishini tekshiradi.
 *
 * Nima uchun test kerak: bu oqim bir necha shartga bog'liq (kirganmi, PRO
 * holati aniqlanganmi, narxlar kelganmi). Bittasi noto'g'ri bo'lsa oqibati
 * og'ir — masalan faol PRO egasi qayta to'lov sahifasiga tushib qolishi
 * yoki foydalanuvchi cheksiz qayta yo'naltirilishi mumkin.
 */
import { render, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const PLANS = [
  { plan_name: 'weekly', amount_tiyin: 1500000, tariff_days: 7 },
];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: () => ({
      select: () => ({
        eq: () => ({ abortSignal: () => Promise.resolve({ data: PLANS, error: null }) }),
      }),
    }),
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('@/components/SEO', () => ({ SEO: () => null }));
vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockAuth = { user: null as { email?: string } | null, isLoading: false };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

const mockAccess = { isPremium: false, loading: false };
vi.mock('@/hooks/useAccessState', () => ({
  useAccessState: () => mockAccess,
}));

const toastCalls: string[] = [];
vi.mock('sonner', () => ({
  toast: {
    info: (m: string) => toastCalls.push(`info:${m}`),
    error: (m: string) => toastCalls.push(`error:${m}`),
    success: (m: string) => toastCalls.push(`success:${m}`),
  },
}));

import Pro from './Pro';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { setPendingPlan, peekPendingPlan } from '@/lib/pendingPlan';

/** window.location.href ga yozilganini ushlab qolamiz. */
let hrefWrites: string[] = [];
const realLocation = window.location;

beforeEach(() => {
  sessionStorage.clear();
  toastCalls.length = 0;
  hrefWrites = [];
  mockAuth.user = null;
  mockAuth.isLoading = false;
  mockAccess.isPremium = false;
  mockAccess.loading = false;

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...realLocation,
      origin: 'https://www.avtotestu.uz',
      set href(v: string) { hrefWrites.push(v); },
      get href() { return 'https://www.avtotestu.uz/pro'; },
    },
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
});

async function renderPro() {
  await act(async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <Pro />
        </LanguageProvider>
      </MemoryRouter>,
    );
  });
}

describe('Pro — ro\'yxatdan o\'tgach to\'lovni davom ettirish', () => {
  it('kirgan, PRO emas, tanlov bor -> Payme ga o\'tkazadi', async () => {
    setPendingPlan('weekly');
    mockAuth.user = { email: '998887928005@pro.com' };

    await renderPro();

    await waitFor(() => expect(hrefWrites.length).toBe(1));
    expect(hrefWrites[0]).toContain('checkout.paycom.uz');

    // Havola ichidagi summa DB dagi narx bilan bir xil bo'lishi shart —
    // farq bo'lsa Payme -31001 (invalid_amount) qaytaradi va to'lov o'tmaydi.
    const payload = atob(hrefWrites[0].split('/').pop() as string);
    expect(payload).toContain('a=1500000');
    expect(payload).toContain('ac.email=998887928005@pro.com');

    // Tanlov iste'mol qilindi — qayta yo'naltirish bo'lmaydi
    expect(peekPendingPlan()).toBeNull();
  });

  it('faol PRO egasini to\'lov sahifasiga YUBORMAYDI', async () => {
    setPendingPlan('weekly');
    mockAuth.user = { email: '998887928005@pro.com' };
    mockAccess.isPremium = true;

    await renderPro();

    await waitFor(() => expect(peekPendingPlan()).toBeNull());
    expect(hrefWrites).toEqual([]);
    expect(toastCalls.some((m) => m.includes('PRO obuna mavjud'))).toBe(true);
  });

  it('PRO holati hali aniqlanmagan bo\'lsa kutadi — erta yo\'naltirmaydi', async () => {
    setPendingPlan('weekly');
    mockAuth.user = { email: '998887928005@pro.com' };
    mockAccess.loading = true;

    await renderPro();

    expect(hrefWrites).toEqual([]);
    // Tanlov saqlanib turadi — holat aniqlangach ishlatiladi
    expect(peekPendingPlan()).toBe('weekly');
  });

  it('mehmonni Payme ga yubormaydi va tanlovni saqlab qoladi', async () => {
    setPendingPlan('weekly');
    mockAuth.user = null;

    await renderPro();

    expect(hrefWrites).toEqual([]);
    expect(peekPendingPlan()).toBe('weekly');
  });

  it('tanlov yo\'q bo\'lsa hech qayerga yo\'naltirmaydi', async () => {
    mockAuth.user = { email: '998887928005@pro.com' };

    await renderPro();

    expect(hrefWrites).toEqual([]);
  });

  it('noma\'lum tarif nomi bo\'lsa tanlovni tozalaydi (cheksiz urinish bo\'lmasin)', async () => {
    setPendingPlan('nonexistent-plan');
    mockAuth.user = { email: '998887928005@pro.com' };

    await renderPro();

    await waitFor(() => expect(peekPendingPlan()).toBeNull());
    expect(hrefWrites).toEqual([]);
  });
});
