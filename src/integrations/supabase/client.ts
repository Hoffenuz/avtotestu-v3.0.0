import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Safety check: detect accidental service_role key in dev mode.
// service_role JWTs contain "role":"service_role" in their payload.
if (!import.meta.env.PROD && SUPABASE_PUBLISHABLE_KEY) {
  try {
    const payload = JSON.parse(atob(SUPABASE_PUBLISHABLE_KEY.split('.')[1]));
    if (payload?.role === 'service_role') {
      throw new Error(
        '[SECURITY] service_role key detected in frontend Supabase client! ' +
        'Use only the anon key (VITE_SUPABASE_PUBLISHABLE_KEY). ' +
        'Never expose service_role in frontend code.'
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message?.includes('[SECURITY]')) throw e;
    // Non-security parse errors are ignored
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});