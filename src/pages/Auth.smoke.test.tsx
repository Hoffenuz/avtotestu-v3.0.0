/**
 * Auth sahifasi render smoke testi.
 *
 * Nima uchun: "sahifa yuklanishida muammo bo'ldi" turidagi xatolar build,
 * lint va typecheck dan bemalol o'tib ketadi — ular faqat render paytida
 * chiqadi. Bu test ikkala rejimni (kirish / ro'yxatdan o'tish) haqiqatan
 * render qilib ko'radi.
 *
 * Qaysi tab ochilishi `authEntry` ga bog'liq: yangi qurilmada ro'yxatdan
 * o'tish, avval kirilgan qurilmada kirish. Kirish testlari shu sababli
 * "avval kirilgan" belgisini qo'yib boshlanadi.
 */
import { render, screen, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

// SEO react-helmet-async provayderiga tayanadi — bu testda ahamiyatsiz
vi.mock('@/components/SEO', () => ({ SEO: () => null }));

// Cloudflare tekshiruvi jsdom da ishlamaydi — o'chirilgan holat (server
// tomondagi chastota cheklovi) sinaladi.
vi.mock('@/lib/turnstile', () => ({ isTurnstileConfigured: () => false }));
vi.mock('@/components/Turnstile', () => ({ Turnstile: () => null }));

import Auth from './Auth';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

/** Shu qurilmada avval kirilgan — `authEntry` dagi kalit. */
const markKnownDevice = () => localStorage.setItem('avtosmart-known-account', '1');

async function renderAuth(state?: { mode?: 'login' | 'signup' }) {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/auth', state }]}>
        <LanguageProvider>
          <AuthProvider>
            <Auth />
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );
  });
}

describe('Auth sahifasi', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(supabase.functions.invoke).mockReset();
  });

  it('avval kirilgan qurilmada kirish rejimida xatosiz ochiladi', async () => {
    markKnownDevice();
    await renderAuth();
    expect(screen.getByRole('button', { name: /Google bilan davom etish/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefon raqam yoki email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Parol$/i)).toBeInTheDocument();
  });

  it("yangi qurilmada RO'YXATDAN O'TISH tabi ochiladi", async () => {
    await renderAuth();
    expect(screen.getByLabelText(/Parolni takrorlang/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Telefon raqam yoki email/i)).not.toBeInTheDocument();
  });

  it('aniq so\'ralgan rejim qurilma holatidan ustun', async () => {
    await renderAuth({ mode: 'login' });
    expect(screen.getByLabelText(/Telefon raqam yoki email/i)).toBeInTheDocument();
  });

  /**
   * Kirish maydoni YAGONA bo'lishi kerak: telefon/email tanlash tugmalari
   * olib tashlangan. Ilgari foydalanuvchi noto'g'ri tabda turib "parol xato"
   * degan xabar olardi va sababini tushunmasdi.
   */
  it('kirishda yagona maydon: telefon ham, email ham qabul qilinadi', async () => {
    markKnownDevice();
    await renderAuth();

    const field = screen.getByLabelText(/Telefon raqam yoki email/i);
    expect(screen.queryByLabelText(/^Email$/i)).not.toBeInTheDocument();

    // Uch xil shakl — bittaga keltiriladi
    for (const kiritma of ['901234567', '998901234567', '+998901234567']) {
      await act(async () => {
        await userEvent.clear(field);
        await userEvent.type(field, kiritma);
      });
      expect(screen.getByText('+998 90 123 45 67')).toBeInTheDocument();
    }

    // 99 operator kodli raqam (998... bilan boshlanadi) buzilmasligi kerak
    await act(async () => {
      await userEvent.clear(field);
      await userEvent.type(field, '998123456');
    });
    expect(screen.getByText('+998 99 812 34 56')).toBeInTheDocument();

    // Email tegilmaydi
    await act(async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'user@gmail.com');
    });
    expect((field as HTMLInputElement).value).toBe('user@gmail.com');
  });

  it("ro'yxatdan o'tish rejimiga o'tganda ham xatosiz render bo'ladi", async () => {
    markKnownDevice();
    await renderAuth();

    const tabs = screen.getAllByRole('button', { name: /Ro'yxatdan o'tish/i });
    await act(async () => {
      await userEvent.click(tabs[0]);
    });

    expect(screen.getByLabelText(/Parolni takrorlang/i)).toBeInTheDocument();
    // Tugma matni "Hisob yaratish" emas, "Ro'yxatdan o'tish" bo'lishi kerak
    expect(screen.queryByText(/Hisob yaratish/i)).not.toBeInTheDocument();
  });

  /**
   * Raqam band — odamning hisobi BOR. Xato bilan qoldirmay, "Kirish" tabiga
   * o'tkazamiz va raqamni yozib qo'yamiz (faqat parol qoladi).
   */
  it("raqam allaqachon ro'yxatdan o'tgan bo'lsa — kirishga o'tadi, raqam to'ldirilgan", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: { context: { json: async () => ({ ok: false, error: 'phone_taken' }) } },
    } as never);
    await renderAuth();

    await act(async () => {
      await userEvent.type(screen.getByLabelText(/Telefon raqam$/i), '901234567');
      await userEvent.type(screen.getByLabelText(/^Parol$/i), 'parol12345');
      await userEvent.type(screen.getByLabelText(/Parolni takrorlang/i), 'parol12345');
    });
    const buttons = screen.getAllByRole('button', { name: /Ro'yxatdan o'tish/i });
    await act(async () => {
      await userEvent.click(buttons[buttons.length - 1]);
    });

    const loginField = screen.getByLabelText(/Telefon raqam yoki email/i) as HTMLInputElement;
    expect(loginField.value.replace(/\D/g, '')).toBe('998901234567');
    expect(screen.getByText(/Bu raqam ro'yxatdan o'tgan/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Parolni takrorlang/i)).not.toBeInTheDocument();
  });
});
