/**
 * create-user Edge Function
 * Auth: Bearer JWT + admin role check (no x-admin-secret needed)
 * verify_jwt: false — JWT is checked manually inside the function
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://avtotestu-admin-3-0-0.pages.dev',
  'https://admin.avtotestu.uz',
  'https://www.avtotestu.uz',
  'https://avtotestu.uz',
  'http://localhost:5173',
  'http://localhost:3000',
];

const extraOrigin = Deno.env.get('ALLOWED_ORIGIN');
if (extraOrigin && !ALLOWED_ORIGINS.includes(extraOrigin)) {
  ALLOWED_ORIGINS.push(extraOrigin);
}

function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status = 200, cors: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: cors });

  if (req.method !== 'POST')
    return json({ error: 'Method not allowed' }, 405, cors);

  // 1. JWT tekshiruvi
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer '))
    return json({ error: 'Yaroqsiz sessiya' }, 401, cors);

  const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user)
    return json({ error: 'Yaroqsiz sessiya' }, 401, cors);

  // 2. Admin role tekshiruvi
  const { data: isAdmin } = await userClient.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin',
  });
  if (!isAdmin)
    return json({ error: 'Faqat adminlar foydalanuvchi yarata oladi' }, 403, cors);

  // 3. Body parse
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "So'rov tanasi noto'g'ri JSON" }, 400, cors);
  }

  const email      = String(body.email ?? '').toLowerCase().trim();
  const password   = String(body.password ?? '');
  const full_name  = body.full_name ? String(body.full_name).trim() : null;
  const tariff_days = Number(body.tariff_days ?? 0);

  // 4. Validatsiya
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email))
    return json({ error: 'Yaroqli email kiriting' }, 400, cors);
  if (!password || password.length < 6)
    return json({ error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" }, 400, cors);
  if (!Number.isInteger(tariff_days) || tariff_days < 0 || tariff_days > 366)
    return json({ error: "tariff_days 0-366 oraliqda bo'lishi kerak" }, 400, cors);

  // 5. Foydalanuvchi yaratish (service role)
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authErr) {
    const msg = authErr.message.toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists'))
      return json({ error: "Bu email allaqachon ro'yxatdan o'tgan" }, 409, cors);
    console.error('create-user authErr:', authErr);
    return json({ error: 'Foydalanuvchi yaratishda xatolik yuz berdi' }, 500, cors);
  }

  const newUserId = authData.user.id;

  // 6. Profile yangilash (trigger ishlagandek kutamiz)
  await new Promise(r => setTimeout(r, 600));

  if (tariff_days > 0 || full_name) {
    const updates: Record<string, unknown> = {};
    if (full_name) updates.full_name = full_name;
    if (tariff_days > 0) {
      updates.tariff_days = tariff_days;
      updates.tariff_start_date = new Date().toISOString();
    }
    await admin.from('profiles').update(updates).eq('id', newUserId);
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, full_name, tariff_days, tariff_end_date, created_at')
    .eq('id', newUserId)
    .single();

  return json({ success: true, user_id: newUserId, profile }, 200, cors);
});
