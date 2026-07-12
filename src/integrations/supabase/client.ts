import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

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
});
