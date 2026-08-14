import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Ro'yxatdan o'tgandan beri necha kun o'tganini qaytaradi.
 *
 * ILGARI: bu hook `profiles` jadvalidan `created_at` ni ALOHIDA so'rov bilan
 * o'qirdi. Lekin AuthContext o'sha profilni (created_at bilan birga)
 * allaqachon yuklagan bo'ladi — ya'ni bu /profile sahifasidagi uchinchi
 * ortiqcha `profiles` so'rovi edi. O'zbekistondan Germaniyadagi bazagacha
 * har bir so'rov ~100-200 ms, mobil tarmoqda undan ham ko'p — shuning uchun
 * keraksiz so'rovlar sahifa ochilishini sezilarli sekinlashtirardi.
 *
 * Endi tarmoqqa umuman chiqmaydi: mavjud profildan hisoblab beradi.
 */
export const useRegistrationAge = (): number | null => {
  const { profile } = useAuth();

  return useMemo(() => {
    if (!profile?.created_at) return null;

    const createdAt = new Date(profile.created_at);
    if (Number.isNaN(createdAt.getTime())) return null;

    const diffMs = Date.now() - createdAt.getTime();
    if (diffMs < 0) return 0;

    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [profile?.created_at]);
};
