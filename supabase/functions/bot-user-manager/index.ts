/**
 * bot-user-manager v5
 * Tuzatishlar:
 *   - calcTariffEnd() admin-manager bilan aynan bir xil qilindi
 *   - profiles.tariff_end_date ham to'g'ri yoziladi
 *   - upsert dan keyin tariff_end_date ni qayta o'qib tekshiradi
 *   - console.log lar bilan debug osonlashtirildi
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Rate limiting ──────────────────────────────────────────────────────────
const ipStore   = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT  = 10;
const IP_WINDOW = 60_000;
let globalCount   = 0;
let globalResetAt = Date.now() + IP_WINDOW;
const GLOBAL_LIMIT = 60;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (now > globalResetAt) { globalCount = 0; globalResetAt = now + IP_WINDOW; }
  globalCount++;
  if (globalCount > GLOBAL_LIMIT)
    return { allowed: false, retryAfter: Math.ceil((globalResetAt - now) / 1000) };
  let entry = ipStore.get(ip);
  if (!entry || now > entry.resetAt) entry = { count: 0, resetAt: now + IP_WINDOW };
  entry.count++;
  ipStore.set(ip, entry);
  if (entry.count > IP_LIMIT)
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  return { allowed: true, retryAfter: 0 };
}

// ── Helpers ────────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin':  'https://www.avtotestu.uz',
  'Access-Control-Allow-Headers': 'content-type, x-bot-secret',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Tariff tugash sanasini hisoblash.
 * admin-manager dagi tariffEnd() bilan AYNAN bir xil mantiq:
 *
 *   1. startIso ni UTC+5 ga o'girish
 *   2. Kun boshiga (00:00:00) qo'yish
 *   3. tariff_days kun qo'shish
 *   4. 1 soniya ayirish (23:59:59 bo'lsin)
 *   5. UTC ga qaytarish
 *
 * Misol: start=2026-04-04, days=7 → 2026-04-10T18:59:59.000Z
 */
function tariffEnd(startIso: string, days: number): string {
  const TZ = 5 * 3_600_000; // UTC+5 milliseconds
  const t   = new Date(new Date(startIso).getTime() + TZ);
  t.setUTCHours(0, 0, 0, 0);           // kun boshiga
  t.setUTCDate(t.getUTCDate() + days); // N kun qo'shish
  t.setUTCSeconds(t.getUTCSeconds() - 1); // 23:59:59
  return new Date(t.getTime() - TZ).toISOString(); // UTC ga qaytarish
}

// ── Main ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // 1. BOT_SECRET tekshirish
  const botSecret = req.headers.get('x-bot-secret');
  if (!botSecret || botSecret !== Deno.env.get('BOT_SECRET'))
    return json({ error: 'Unauthorized' }, 401);

  // 2. Rate limit
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = checkRateLimit(clientIp);
  if (!rl.allowed)
    return new Response(
      JSON.stringify({ error: 'Too many requests', retryAfter: rl.retryAfter }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) } }
    );

  // 3. Service role client
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body   = await req.json();
    const action = body?.action;

    // ══════════════════════════════════════════════════════════════════════
    // create_or_update_user
    // Bot to'lov chekini tasdiqlangach chaqiradi
    // ══════════════════════════════════════════════════════════════════════
    if (action === 'create_or_update_user') {
      const { email, tariff_days } = body;

      // Validatsiya
      if (
        typeof email !== 'string' ||
        !email.includes('@') ||
        email.length > 254 ||
        !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)
      ) return json({ error: 'Invalid email' }, 400);

      if (
        typeof tariff_days !== 'number' ||
        !Number.isInteger(tariff_days) ||
        tariff_days < 1 ||
        tariff_days > 366
      ) return json({ error: 'Invalid tariff_days (1-366)' }, 400);

      const emailLower = email.toLowerCase().trim();
      const password   = emailLower.split('@')[0].slice(0, 20);
      const nowIso     = new Date().toISOString();

      // ── tariff_end_date hisoblash ──────────────────────────────────────
      const endDate = tariffEnd(nowIso, tariff_days);
      console.log(`[bot] tariff calc: start=${nowIso} days=${tariff_days} end=${endDate}`);

      let userId: string | null = null;
      let isNewUser = true;

      // ── QADAM 1: auth.users da user yaratish ──────────────────────────
      const { data: createData, error: createErr } =
        await db.auth.admin.createUser({
          email:         emailLower,
          password,
          email_confirm: true,
        });

      if (!createErr) {
        userId    = createData.user?.id ?? null;
        isNewUser = true;
        console.log(`[bot] Yangi user yaratildi: ${userId}`);
      } else {
        const msg = createErr.message.toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          isNewUser = false;
          console.log(`[bot] Mavjud user: ${emailLower}`);

          // auth.users listidan topish
          const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const authUser = authList?.users?.find(
            (u: { email?: string }) => u.email?.toLowerCase() === emailLower
          );

          if (authUser) {
            userId = authUser.id;
            await db.auth.admin.updateUserById(userId, { password });
            console.log(`[bot] auth.users dan topildi: ${userId}`);
          } else {
            // profiles dan fallback
            const { data: prof } = await db
              .from('profiles').select('id').eq('email', emailLower).single();
            if (prof?.id) {
              userId = prof.id;
              await db.auth.admin.updateUserById(userId, { password });
              console.log(`[bot] profiles dan topildi: ${userId}`);
            } else {
              console.error(`[bot] User topilmadi: ${emailLower}`);
              return json({ error: 'User not found in auth system' }, 404);
            }
          }
        } else {
          throw createErr;
        }
      }

      if (!userId) return json({ error: 'Could not resolve user ID' }, 500);

      // Trigger ishga tushishi uchun kutish
      await new Promise(r => setTimeout(r, 600));

      // ── QADAM 2: profiles upsert ────────────────────────────────────────
      // profiles ustunlari: id, email, tariff_days, tariff_end_date
      // (is_trial_used, tariff_start_date, trial_* — YO'Q)
      const { error: upsertErr } = await db
        .from('profiles')
        .upsert(
          {
            id:              userId,
            email:           emailLower,
            tariff_days,
            tariff_end_date: endDate,
          },
          { onConflict: 'id' }
        );

      if (upsertErr) {
        console.error(`[bot] profiles upsert xatosi:`, JSON.stringify(upsertErr));
        throw upsertErr;
      }

      // ── Tekshiruv: haqiqatda yozildimi? ───────────────────────────────
      const { data: verify } = await db
        .from('profiles')
        .select('tariff_days, tariff_end_date')
        .eq('id', userId)
        .single();

      console.log(`[bot] profiles verify: days=${verify?.tariff_days} end=${verify?.tariff_end_date}`);

      // ── QADAM 3: subscriptions ga yangi PRO yozuv ─────────────────────
      const { error: subErr } = await db
        .from('subscriptions')
        .insert({
          user_id:     userId,
          plan_name:   'basic',
          status:      new Date(endDate) > new Date() ? 'active' : 'expired',
          started_at:  nowIso,
          expires_at:  endDate,
          tariff_days,
          is_trial:    false,
          assigned_by: null,
          note:        "Bot orqali to'lov tasdiqlandi",
        });

      if (subErr) {
        // Subscription yozmasa ham davom etamiz (profiles yangilangan)
        console.error(`[bot] subscriptions insert xatosi (non-fatal):`, JSON.stringify(subErr));
      } else {
        console.log(`[bot] subscription yozildi: ${tariff_days} kun, tugaydi: ${endDate}`);
      }

      return json({
        success:         true,
        is_new_user:     isNewUser,
        user_id:         userId,
        email:           emailLower,
        tariff_days,
        tariff_end_date: endDate,
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // get_user_by_email
    // Userning mavjud tarif holatini tekshirish
    // ══════════════════════════════════════════════════════════════════════
    if (action === 'get_user_by_email') {
      const { email } = body;
      if (typeof email !== 'string' || !email.includes('@'))
        return json({ error: 'email required' }, 400);

      const emailLower = email.toLowerCase().trim();

      const { data: prof } = await db
        .from('profiles')
        .select('id, email, tariff_days, tariff_end_date')
        .eq('email', emailLower)
        .single();

      if (!prof) {
        const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const authUser = authList?.users?.find(
          (u: { email?: string }) => u.email?.toLowerCase() === emailLower
        );
        if (!authUser) return json({ found: false });
        return json({
          found: true,
          user: {
            id:              authUser.id,
            email:           emailLower,
            tariff_days:     0,
            tariff_end_date: null,
            has_trial:       false,
          },
        });
      }

      // subscriptions dan trial holati
      const { data: subs } = await db
        .from('subscriptions')
        .select('plan_name, status, is_trial, expires_at')
        .eq('user_id', prof.id)
        .order('created_at', { ascending: false });

      const now          = new Date().toISOString();
      const activeTrial  = (subs ?? []).find(
        (s: { is_trial: boolean; status: string; expires_at: string }) =>
          s.is_trial && s.status === 'active' && s.expires_at > now
      );
      const hasTrial = (subs ?? []).some((s: { is_trial: boolean }) => s.is_trial);

      return json({
        found: true,
        user: {
          id:              prof.id,
          email:           emailLower,
          tariff_days:     prof.tariff_days,
          tariff_end_date: prof.tariff_end_date,
          has_trial:       hasTrial,
          active_trial:    activeTrial ? { expires_at: activeTrial.expires_at } : null,
          subscriptions:   subs ?? [],
        },
      });
    }

    return json({ error: 'Unknown action' }, 400);

  } catch (err) {
    console.error('[bot] Kritik xato:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
