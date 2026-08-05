/**
 * useUserValidation regressiya testlari.
 *
 * Bu hook — himoyalangan sahifalardagi yagona joy, u foydalanuvchini
 * hisobidan CHIQARIB YUBORA oladi. Shuning uchun uning "yolg'on ijobiy"
 * holatlari eng og'ir shikoyatlarga (akkauntdan chiqib ketish, PRO
 * yo'qolishi) olib kelgan. Har bir test — o'sha xatolarning oldini oladi.
 */
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  getSession: vi.fn(),
  maybeSingle: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  navigate: vi.fn(),
  authState: { isLoading: false, user: null as { id: string } | null },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: h.getSession, signOut: h.signOut },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: h.maybeSingle }) }),
    }),
  },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => h.navigate }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => h.authState }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

import { useUserValidation } from './useUserValidation';

function Protected() {
  useUserValidation('/auth');
  return <div>himoyalangan sahifa</div>;
}

const USER = { id: '11111111-2222-3333-4444-555555555555' };
const sessionFor = (id: string) => ({ data: { session: { user: { id } } } });

beforeEach(() => {
  h.navigate.mockClear();
  h.authState.isLoading = false;
  h.authState.user = null;
});

describe('useUserValidation', () => {
  it('sessiya haqiqatan yo\'q bo\'lsa /auth ga yuboradi', async () => {
    h.getSession.mockResolvedValue({ data: { session: null } });

    render(<Protected />);

    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/auth', { replace: true }));
  });

  it(
    'sessiya BOR, lekin kontekst uni hali qo\'llamagan bo\'lsa CHIQARIB YUBORMAYDI',
    async () => {
      // getSession sekin tarmoqda timeout bo'lgan, INITIAL_SESSION hali kelmagan:
      // AuthContext isLoading=false qilgan, user esa hali null.
      h.getSession.mockResolvedValue(sessionFor(USER.id));

      render(<Protected />);

      // Biroz kutamiz — bu vaqt ichida ham yo'naltirish bo'lmasligi kerak
      await new Promise((r) => setTimeout(r, 50));
      expect(h.navigate).not.toHaveBeenCalled();
    },
  );

  it('getSession osilib qolsa ham chiqarib yubormaydi (shubhada qoldiradi)', async () => {
    h.getSession.mockImplementation(() => new Promise(() => { /* hech qachon tugamaydi */ }));

    render(<Protected />);

    await new Promise((r) => setTimeout(r, 50));
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('profil topilmasa ham, sessiya tasdiqlanmasa chiqarib yubormaydi', async () => {
    h.authState.user = USER;
    h.maybeSingle.mockResolvedValue({ data: null, error: null });   // profil yo'q
    h.getSession.mockResolvedValue({ data: { session: null } });     // sessiya tasdiqlanmadi

    render(<Protected />);

    await new Promise((r) => setTimeout(r, 100));
    expect(h.signOut).not.toHaveBeenCalled();
  });

  it('profil mavjud bo\'lsa hech narsa qilmaydi', async () => {
    h.authState.user = USER;
    h.maybeSingle.mockResolvedValue({ data: { id: USER.id }, error: null });

    render(<Protected />);

    await new Promise((r) => setTimeout(r, 50));
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.signOut).not.toHaveBeenCalled();
  });
});
