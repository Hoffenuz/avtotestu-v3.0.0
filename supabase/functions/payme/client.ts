// ============================================================================
// Umumiy service-role Supabase klienti.
// ============================================================================
// Barcha Payme biznes qoidalari SECURITY DEFINER SQL funksiyalarida —
// holat o'zgarishlari atomar bo'lishi uchun. Bu klient faqat transport.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
