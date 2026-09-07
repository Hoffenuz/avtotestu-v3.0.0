/**
 * Auth sahifasi render smoke testi.
 *
 * Nima uchun: "sahifa yuklanishida muammo bo'ldi" turidagi xatolar build,
 * lint va typecheck dan bemalol o'tib ketadi — ular faqat render paytida
 * chiqadi. Bu test ikkala rejimni (kirish / ro'yxatdan o'tish) haqiqatan
 * render qilib ko'radi.
 */
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

import Auth from './Auth';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

async function renderAuth() {
  await act(async () => {
    render(
      <MemoryRouter>
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
  it('kirish rejimida xatosiz ochiladi', async () => {
    await renderAuth();
    expect(screen.getByRole('button', { name: /Google bilan davom etish/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefon raqam yoki email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Parol$/i)).toBeInTheDocument();
  });

  /**
   * Kirish maydoni YAGONA bo'lishi kerak: telefon/email tanlash tugmalari
   * olib tashlangan. Ilgari foydalanuvchi noto'g'ri tabda turib "parol xato"
   * degan xabar olardi va sababini tushunmasdi.
   */
  it('kirishda yagona maydon: telefon ham, email ham qabul qilinadi', async () => {
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
    await renderAuth();

    const tabs = screen.getAllByRole('button', { name: /Ro'yxatdan o'tish/i });
    await act(async () => {
      await userEvent.click(tabs[0]);
    });

    expect(screen.getByLabelText(/Parolni takrorlang/i)).toBeInTheDocument();
    // Tugma matni "Hisob yaratish" emas, "Ro'yxatdan o'tish" bo'lishi kerak
    expect(screen.queryByText(/Hisob yaratish/i)).not.toBeInTheDocument();
  });
});
