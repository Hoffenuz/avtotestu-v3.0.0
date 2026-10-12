import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createClockSkewSafeFetch } from '@/lib/clockSkewSafeFetch';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function assertSupabaseEnv(): void {
  if (!SUPABASE_URL?.trim() || !SUPABASE_PUBLISHABLE_KEY?.trim()) {
    throw new Error(
      '[Supabase] VITE_SUPABASE_URL va VITE_SUPABASE_PUBLISHABLE_KEY kerak. ' +
        '.env.example dan nusxa olib .env.local yarating.'
    );
  }
}

// JWT anon key: service_role frontendga tushmasin (faqat JWT formatida tekshiramiz).
if (!import.meta.env.PROD && SUPABASE_PUBLISHABLE_KEY?.startsWith('eyJ')) {
  try {
    const payload = JSON.parse(atob(SUPABASE_PUBLISHABLE_KEY.split('.')[1]));
    if (payload?.role === 'service_role') {
      throw new Error(
        '[SECURITY] service_role key detected in frontend! ' +
          'Use only anon / publishable key (VITE_SUPABASE_PUBLISHABLE_KEY).'
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('[SECURITY]')) throw e;
  }
}

assertSupabaseEnv();

/**
 * Vite SPA client — sessiya localStorage + autoRefreshToken.
 * @supabase/ssr Next.js middleware uchun; bu loyihada server yo'q.
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // Qurilma soati noto'g'ri bo'lsa ham sessiya cheksiz yangilanmasin va
  // muddati o'tgan token bilan qotib qolmasin (sabab — clockSkewSafeFetch.ts).
  global: { fetch: createClockSkewSafeFetch(undefined, { onJwtExpired: forceRefreshOnExpiredJwt }) },
});

/**
 * Server "JWT expired" desa — sessiyani majburan yangilash. 30 s da ko'pi
 * bilan bir marta (bir vaqtda ketgan 5–10 so'rov bitta refresh qiladi va
 * refresh tokeni yaroqsiz bo'lsa ham limitga urilmaydi). setTimeout — fetch
 * auth lock ichida bo'lishi mumkin, refresh esa o'sha lock ni kutadi.
 */
const FORCED_REFRESH_MIN_INTERVAL_MS = 30_000;
let lastForcedRefreshAt = 0;
function forceRefreshOnExpiredJwt(): void {
  const now = Date.now();
  if (Math.abs(now - lastForcedRefreshAt) < FORCED_REFRESH_MIN_INTERVAL_MS) return;
  lastForcedRefreshAt = now;
  setTimeout(() => {
    void supabase.auth.refreshSession().catch(() => {});
  }, 0);
}
