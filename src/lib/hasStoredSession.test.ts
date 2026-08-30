import { describe, it, expect, beforeEach } from 'vitest';
import { hasStoredSession } from './hasStoredSession';

/**
 * Bu funksiya bosh sahifadagi profil paneli uchun joy zahiralanadimi-yo'qmi
 * degan qarorni beradi. Noto'g'ri javob = maket sakrashi (CLS), shuning uchun
 * chegaraviy holatlar qulflab qo'yilgan.
 */
describe('hasStoredSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("bo'sh storage da false", () => {
    expect(hasStoredSession()).toBe(false);
  });

  it('haqiqiy supabase auth kaliti bo\'lsa true', () => {
    localStorage.setItem(
      'sb-lvdndseuobzbgzrarygu-auth-token',
      JSON.stringify({ access_token: 'x', user: { id: '1' } }),
    );
    expect(hasStoredSession()).toBe(true);
  });

  it('boshqa loyiha ref i bilan ham ishlaydi (ref qattiq yozilmagan)', () => {
    localStorage.setItem(
      'sb-boshqaprojectref123-auth-token',
      JSON.stringify({ access_token: 'x' }),
    );
    expect(hasStoredSession()).toBe(true);
  });

  it('"null" qiymat sessiya deb hisoblanmaydi', () => {
    localStorage.setItem('sb-abc-auth-token', 'null');
    expect(hasStoredSession()).toBe(false);
  });

  it("bo'sh qiymat sessiya deb hisoblanmaydi", () => {
    localStorage.setItem('sb-abc-auth-token', '');
    expect(hasStoredSession()).toBe(false);
  });

  it('aloqasiz kalitlar false qaytaradi', () => {
    localStorage.setItem('testState_combined_free_20_guest', '{"a":1}');
    localStorage.setItem('autoAdvance', 'true');
    localStorage.setItem('sb-something-else', 'qiymat');
    expect(hasStoredSession()).toBe(false);
  });

  it('chiqishdan keyin (kalit o\'chirilgan) false', () => {
    localStorage.setItem('sb-abc-auth-token', JSON.stringify({ access_token: 'x' }));
    expect(hasStoredSession()).toBe(true);
    localStorage.removeItem('sb-abc-auth-token');
    expect(hasStoredSession()).toBe(false);
  });
});
