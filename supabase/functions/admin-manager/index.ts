/**
 * admin-manager v25
 * - super_admin: barcha actionlar
 * - admin: faqat user qo'shish + muddat (tariff) belgilash
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleGetPayments } from '../_shared/getPayments.ts';
import { handleGetFinanceStats } from '../_shared/getFinanceStats.ts';

const ALLOWED_ORIGINS = [
  'https://www.avtotestu.uz',
  'https://avtotestu.uz',
  'https://admin.avtotestu.uz',
  'https://avtotestu-admin-3-0-0.pages.dev',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:8080',
];

/** Oddiy admin uchun ruxsat etilgan actionlar */
const ADMIN_ALLOWED_ACTIONS = new Set([
  'get_user',
  'get_users',
  'create_user',
  'update_tariff',
  'get_payment_types', // faqat ko'rish (UI)
  'get_user_payment_type',
]);

function getCors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.some(a => origin.startsWith(a));
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function res(body: unknown, status = 200, cors: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Toshkent UTC+5 da tariff oxiri
function tariffEnd(startIso: string, days: number): string {
  const TZ = 5 * 3600000;
  const t = new Date(new Date(startIso).getTime() + TZ);
  t.setUTCHours(0, 0, 0, 0);
  t.setUTCDate(t.getUTCDate() + days);
  t.setUTCSeconds(t.getUTCSeconds() - 1);
  return new Date(t.getTime() - TZ).toISOString();
}

// news_posts.slug CHECK: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

async function generateUniqueSlug(
  db: ReturnType<typeof createClient>,
  title: string
): Promise<string> {
  const base = slugify(title) || 'post';
  let candidate = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await db.from('news_posts').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    i++;
    candidate = `${base}-${i}`;
  }
}

async function attachRoles(
  db: ReturnType<typeof createClient>,
  profiles: Array<Record<string, unknown>>
): Promise<Array<Record<string, unknown>>> {
  if (!profiles.length) return profiles;
  // user_roles faqat admin/super_admin/moderator uchun — juda kichik jadval,
  // shuning uchun to'liq o'qiymiz. .in('user_id', ids) bilan filtrlash
  // per_page=1000 bo'lganda URL uzunligi limitidan oshib, PostgREST 400
  // qaytarardi va rollar butunlay tashlab yuborilardi.
  const { data: roles } = await db.from('user_roles').select('user_id, role');
  const map: Record<string, string> = {};
  (roles ?? []).forEach((r: { user_id: string; role: string }) => { map[r.user_id] = r.role; });
  return profiles.map(p => ({
    ...p,
    user_roles: map[p.id as string] ? [{ role: map[p.id as string] }] : [],
  }));
}

async function auditLog(
  db: ReturnType<typeof createClient>,
  actorId: string,
  action: string,
  tableName: string,
  oldVals: unknown,
  newVals: unknown
) {
  await db.from('audit_logs').insert({
    user_id: actorId === 'system' ? null : actorId,
    action,
    table_name: tableName,
    old_values: oldVals,
    new_values: newVals,
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = getCors(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST')   return res({ error: 'Method not allowed' }, 405, cors);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
  const adminSecret = Deno.env.get('ADMIN_SECRET') ?? '';

  let actorId: string;
  let actorRole: 'super_admin' | 'admin' | 'system' = 'system';
  const db = createClient(supabaseUrl, serviceKey);

  const xAdminSecret = req.headers.get('x-admin-secret');
  const authHeader   = req.headers.get('Authorization');

  if (xAdminSecret) {
    if (!adminSecret || xAdminSecret !== adminSecret)
      return res({ error: 'Yaroqsiz admin kalit' }, 401, cors);
    actorId = 'system';
    actorRole = 'system';
  } else if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !user) return res({ error: 'Yaroqsiz token yoki sessiya tugagan' }, 401, cors);
    const { data: isAdmin, error: roleErr } = await userClient.rpc('is_admin');
    if (roleErr || !isAdmin) return res({ error: 'Faqat adminlar uchun' }, 403, cors);

    const { data: myRole } = await userClient.rpc('get_my_admin_role');
    const resolved = myRole as string | null;
    if (resolved === 'super_admin') actorRole = 'super_admin';
    else if (resolved === 'admin') actorRole = 'admin';
    else return res({ error: 'Admin roli topilmadi' }, 403, cors);

    actorId = user.id;
  } else {
    return res({ error: 'Authorization yoki x-admin-secret header kerak' }, 401, cors);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return res({ error: 'JSON xatosi' }, 400, cors); }
  const { action } = body;

  if (
    typeof action === 'string' &&
    actorRole === 'admin' &&
    !ADMIN_ALLOWED_ACTIONS.has(action)
  ) {
    return res({
      error: 'Ruxsat yo‘q: oddiy admin faqat foydalanuvchi qo‘shishi va muddat belgilashi mumkin',
      code: 'INSUFFICIENT_ROLE',
    }, 403, cors);
  }

  try {

    if (action === 'get_users') {
      const { page = 1, per_page = 50, search = '', status = 'all' } = body;
      const offset = (Number(page) - 1) * Number(per_page);

      let q = db.from('profiles').select(
        `id, email, full_name, username, tariff_days, tariff_end_date,
         created_at, updated_at,
         user_payment_type(payment_type_id, note, payment_types(id, name, sort_order))`,
        { count: 'exact' }
      )
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(per_page) - 1);

      if (search) q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

      const now = new Date().toISOString();
      if (status === 'active_pro')  q = q.gt('tariff_days', 0).gt('tariff_end_date', now);
      if (status === 'expired_pro') q = q.gt('tariff_days', 0).lte('tariff_end_date', now);
      if (status === 'free')        q = q.eq('tariff_days', 0);
      if (status === 'active_trial' || status === 'expired_trial') {
        const isActive = status === 'active_trial';
        const { data: trialSubs } = await db.from('subscriptions')
          .select('user_id, expires_at')
          .eq('is_trial', true)
          .eq('status', isActive ? 'active' : 'expired');
        const trialUserIds = (trialSubs ?? []).map((s: { user_id: string }) => s.user_id);
        if (trialUserIds.length === 0) return res({ success: true, data: [], count: 0, page, per_page }, 200, cors);
        q = q.in('id', trialUserIds).eq('tariff_days', 0);
      }

      const { data, error, count } = await q;
      if (error) throw error;

      const enriched = await attachRoles(db, (data ?? []) as Array<Record<string, unknown>>);
      return res({ success: true, data: enriched, count, page, per_page }, 200, cors);
    }

    if (action === 'get_user') {
      const { user_id } = body;
      if (!user_id) return res({ error: 'user_id kerak' }, 400, cors);

      const { data: profile, error: pErr } = await db.from('profiles').select(
        `id, email, full_name, username, avatar_url,
         tariff_days, tariff_end_date,
         created_at, updated_at,
         user_payment_type(payment_type_id, note, assigned_by, payment_types(id, name, sort_order))`
      ).eq('id', user_id).single();
      if (pErr) throw pErr;

      const [trRes, chkRes, subRes, recRes, roleRes] = await Promise.all([
        db.from('test_results')
          .select('id, variant, correct_answers, total_questions, time_taken_seconds, completed_at')
          .eq('user_id', user_id).order('completed_at', { ascending: false }).limit(20),
        db.from('chek')
          .select('id, email, link, created_at')
          .eq('user_id', user_id).order('created_at', { ascending: false }),
        db.from('subscriptions')
          .select('id, plan_name, status, started_at, expires_at, tariff_days, is_trial, note, created_at')
          .eq('user_id', user_id).order('created_at', { ascending: false }),
        db.from('payment_receipts')
          .select('id, email, receipt_url, amount, currency, payment_method, subscription_id, created_at')
          .eq('user_id', user_id).order('created_at', { ascending: false }),
        db.from('user_roles').select('role').eq('user_id', user_id),
      ]);

      return res({ success: true, data: {
        profile: { ...profile, user_roles: roleRes.data ?? [] },
        test_results:     trRes.data  ?? [],
        cheks:            chkRes.data ?? [],
        subscriptions:    subRes.data ?? [],
        payment_receipts: recRes.data ?? [],
      }}, 200, cors);
    }

    if (action === 'create_user') {
      const { email, password, full_name = null, tariff_days = 0, tariff_start_date = null } = body;
      if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(String(email)))
        return res({ error: 'Yaroqli email kiriting' }, 400, cors);
      if (!password || String(password).length < 6)
        return res({ error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" }, 400, cors);
      if (typeof tariff_days !== 'number' || tariff_days < 0 || tariff_days > 366)
        return res({ error: "tariff_days 0-366 bo'lishi kerak" }, 400, cors);

      const emailLower = String(email).toLowerCase().trim();
      const startDate  = tariff_start_date ? String(tariff_start_date) : new Date().toISOString();
      let userId: string | null = null;
      let isNewUser = true;

      const { data: authData, error: authErr } = await db.auth.admin.createUser({
        email: emailLower, password: String(password),
        email_confirm: true, user_metadata: { full_name },
      });
      if (!authErr) {
        userId = authData.user.id;
      } else {
        const msg = authErr.message.toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          isNewUser = false;
          const { data: listData } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const found = (listData?.users ?? []).find((u: { email?: string }) => u.email?.toLowerCase() === emailLower);
          if (found) {
            userId = found.id;
            await db.auth.admin.updateUserById(userId, { password: String(password) });
          } else {
            const { data: profByEmail } = await db.from('profiles').select('id').eq('email', emailLower).single();
            if (profByEmail?.id) {
              userId = profByEmail.id;
              await db.auth.admin.updateUserById(userId, { password: String(password) });
            } else return res({ error: 'Foydalanuvchi tizimda topilmadi. Emailni tekshiring.' }, 404, cors);
          }
        } else throw authErr;
      }
      if (!userId) return res({ error: 'User ID aniqlanmadi' }, 500, cors);
      await new Promise(r => setTimeout(r, 700));

      const upsertData: Record<string, unknown> = { id: userId, email: emailLower };
      if (full_name) upsertData.full_name = full_name;
      if (tariff_days > 0) {
        const endDate = tariffEnd(startDate, tariff_days);
        upsertData.tariff_days    = tariff_days;
        upsertData.tariff_end_date = endDate;
      }
      const { error: upsertErr } = await db.from('profiles').upsert(upsertData, { onConflict: 'id' });
      if (upsertErr) throw upsertErr;

      if (tariff_days > 0) {
        const endDate = tariffEnd(startDate, tariff_days);
        await db.from('subscriptions').insert({
          user_id:     userId,
          plan_name:   'basic',
          status:      new Date(endDate) > new Date() ? 'active' : 'expired',
          started_at:  startDate,
          expires_at:  endDate,
          tariff_days,
          is_trial:    false,
          assigned_by: actorId === 'system' ? null : actorId,
          note:        actorId === 'system' ? 'Bot orqali yaratildi' : 'Admin tomonidan yaratildi',
        });
      }

      const { data: profile } = await db.from('profiles')
        .select('id, email, full_name, tariff_days, tariff_end_date, created_at')
        .eq('id', userId).single();
      await auditLog(db, actorId, 'create_user', 'profiles', null, profile);
      return res({ success: true, is_new_user: isNewUser, user_id: userId, profile }, 200, cors);
    }

    if (action === 'update_user') {
      const { user_id, tariff_days, tariff_start_date, full_name, email, created_at } = body;
      if (!user_id) return res({ error: 'user_id kerak' }, 400, cors);

      const { data: oldProfile } = await db.from('profiles').select('*').eq('id', user_id).single();
      const updates: Record<string, unknown> = {};

      if (tariff_days !== undefined) {
        if (typeof tariff_days !== 'number' || tariff_days < 0 || tariff_days > 366)
          return res({ error: "tariff_days 0-366 bo'lishi kerak" }, 400, cors);
        updates.tariff_days = tariff_days;
        if (tariff_days > 0) {
          const { data: lastSub } = await db.from('subscriptions')
            .select('started_at').eq('user_id', user_id).eq('is_trial', false)
            .order('created_at', { ascending: false }).limit(1).maybeSingle();
          const startIso = tariff_start_date
            ? String(tariff_start_date)
            : (lastSub?.started_at ?? new Date().toISOString());
          updates.tariff_end_date = tariffEnd(startIso, tariff_days);
        } else {
          updates.tariff_end_date = null;
        }
      }

      if (full_name  !== undefined) updates.full_name = full_name;
      if (email !== undefined) {
        if (!/^[^@]+@[^@]+\.[^@]+$/.test(String(email)))
          return res({ error: 'Email format xato' }, 400, cors);
        updates.email = String(email).toLowerCase().trim();
        await db.auth.admin.updateUserById(String(user_id), { email: String(email).toLowerCase().trim() });
      }
      if (created_at !== undefined) {
        const d = new Date(String(created_at));
        if (isNaN(d.getTime())) return res({ error: 'created_at format xato (ISO 8601)' }, 400, cors);
        updates.created_at = d.toISOString();
      }
      if (Object.keys(updates).length === 0)
        return res({ error: "O'zgartirish ma'lumotlari yo'q" }, 400, cors);

      const { error: uErr } = await db.from('profiles').update(updates).eq('id', user_id);
      if (uErr) throw uErr;
      await auditLog(db, actorId, 'update_user', 'profiles', oldProfile, { ...oldProfile, ...updates });

      const { data: profile } = await db.from('profiles')
        .select('id, email, full_name, tariff_days, tariff_end_date, created_at')
        .eq('id', user_id).single();
      return res({ success: true, profile }, 200, cors);
    }

    if (action === 'update_tariff') {
      const { user_id, tariff_days, tariff_start_date } = body;
      if (!user_id) return res({ error: 'user_id kerak' }, 400, cors);
      if (typeof tariff_days !== 'number' || tariff_days < 0 || tariff_days > 366)
        return res({ error: 'tariff_days 0-366' }, 400, cors);

      const startIso  = tariff_start_date ? String(tariff_start_date) : new Date().toISOString();
      const endDate   = tariff_days > 0 ? tariffEnd(startIso, tariff_days) : null;

      const { error } = await db.from('profiles').update({
        tariff_days,
        tariff_end_date: endDate,
      }).eq('id', user_id);
      if (error) throw error;

      return res({ success: true, tariff_end_date: endDate }, 200, cors);
    }

    if (action === 'delete_user') {
      const { user_id } = body;
      if (!user_id) return res({ error: 'user_id kerak' }, 400, cors);
      if (actorId !== 'system' && String(user_id) === actorId)
        return res({ error: "O'zingizni o'chira olmaysiz" }, 400, cors);
      const { data: oldProfile } = await db.from('profiles').select('email, full_name').eq('id', user_id).single();
      const { error } = await db.auth.admin.deleteUser(String(user_id));
      if (error) throw error;
      await auditLog(db, actorId, 'delete_user', 'profiles', oldProfile, null);
      return res({ success: true }, 200, cors);
    }

    if (action === 'reset_password') {
      const { user_id, new_password } = body;
      if (!user_id) return res({ error: 'user_id kerak' }, 400, cors);
      if (!new_password || String(new_password).length < 6)
        return res({ error: 'Parol kamida 6 ta belgi' }, 400, cors);
      const { error } = await db.auth.admin.updateUserById(String(user_id), { password: String(new_password) });
      if (error) throw error;
      return res({ success: true }, 200, cors);
    }

    if (action === 'update_role') {
      const { user_id, role } = body;
      if (!user_id) return res({ error: 'user_id kerak' }, 400, cors);
      if (actorId !== 'system' && String(user_id) === actorId)
        return res({ error: "O'z rolingizni o'zgartira olmaysiz" }, 400, cors);
      if (!['admin', 'super_admin', 'moderator', 'user'].includes(String(role)))
        return res({ error: 'Rol: super_admin | admin | moderator | user' }, 400, cors);
      await db.from('user_roles').delete().eq('user_id', user_id);
      if (String(role) !== 'user') {
        const { error } = await db.from('user_roles').insert({ user_id, role });
        if (error) throw error;
      }
      await auditLog(db, actorId, 'update_role', 'user_roles', null, { user_id, role });
      return res({ success: true }, 200, cors);
    }

    if (action === 'get_archive') {
      const { page = 1, per_page = 50, search = '' } = body;
      const offset = (Number(page) - 1) * Number(per_page);
      let q = db.from('user_archive')
        .select('id,email,full_name,tariff_days,tariff_start_date,tariff_end_date,is_trial_used,archived_at,deleted_reason', { count: 'exact' })
        .order('archived_at', { ascending: false })
        .range(offset, offset + Number(per_page) - 1);
      if (search) q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      const { data, error, count } = await q;
      if (error) throw error;
      return res({ success: true, data, count }, 200, cors);
    }

    if (action === 'delete_archive') {
      const { archive_id } = body;
      if (!archive_id) return res({ error: 'archive_id kerak' }, 400, cors);
      const { data: existing, error: fetchErr } = await db.from('user_archive')
        .select('id, email, full_name, deleted_reason, archived_at').eq('id', archive_id).single();
      if (fetchErr || !existing) return res({ error: 'Arxiv yozuvi topilmadi' }, 404, cors);
      const { error } = await db.from('user_archive').delete().eq('id', archive_id);
      if (error) throw error;
      await auditLog(db, actorId, 'delete_archive', 'user_archive', existing, null);
      return res({ success: true, deleted: existing }, 200, cors);
    }

    if (action === 'bulk_delete_archive') {
      const { archive_ids } = body;
      if (!Array.isArray(archive_ids) || archive_ids.length === 0)
        return res({ error: 'archive_ids massivi kerak (kamida 1 ta)' }, 400, cors);
      if (archive_ids.length > 100)
        return res({ error: "Bir vaqtda maksimum 100 ta o'chirish mumkin" }, 400, cors);
      const { data: existing } = await db.from('user_archive')
        .select('id, email, full_name, deleted_reason, archived_at').in('id', archive_ids as string[]);
      const foundIds = (existing ?? []).map((r: { id: string }) => r.id);
      if (foundIds.length === 0)
        return res({ error: 'Berilgan IDlar orasida hech qanday arxiv yozuvi topilmadi' }, 404, cors);
      const { error } = await db.from('user_archive').delete().in('id', foundIds);
      if (error) throw error;
      await auditLog(db, actorId, 'bulk_delete_archive', 'user_archive', existing, null);
      return res({ success: true, deleted_count: foundIds.length, not_found_count: archive_ids.length - foundIds.length }, 200, cors);
    }

    if (action === 'update_chek') {
      const { chek_id, link, email, user_id: chekUserId } = body;
      if (!chek_id) return res({ error: 'chek_id kerak' }, 400, cors);
      const { data: existing, error: fetchErr } = await db.from('chek')
        .select('id, link, email, user_id').eq('id', chek_id).single();
      if (fetchErr || !existing) return res({ error: 'Chek topilmadi' }, 404, cors);
      const updates: Record<string, unknown> = {};
      if (link !== undefined) {
        if (typeof link !== 'string' || !link.trim())
          return res({ error: "link bo'sh bo'lishi mumkin emas" }, 400, cors);
        updates.link = String(link).trim();
      }
      if (email !== undefined) {
        if (!/^[^@]+@[^@]+\.[^@]+$/.test(String(email)))
          return res({ error: 'Email format xato' }, 400, cors);
        updates.email = String(email).toLowerCase().trim();
      }
      if (chekUserId !== undefined) updates.user_id = chekUserId ?? null;
      if (Object.keys(updates).length === 0)
        return res({ error: "O'zgartirish ma'lumotlari yo'q" }, 400, cors);
      const { data, error } = await db.from('chek').update(updates).eq('id', chek_id).select().single();
      if (error) throw error;
      await auditLog(db, actorId, 'update_chek', 'chek', existing, { ...existing, ...updates });
      return res({ success: true, data }, 200, cors);
    }

    if (action === 'delete_chek') {
      const { chek_id } = body;
      if (!chek_id) return res({ error: 'chek_id kerak' }, 400, cors);
      const { data: existing } = await db.from('chek').select('id, link, email').eq('id', chek_id).single();
      if (!existing) return res({ error: 'Chek topilmadi' }, 404, cors);
      const { error } = await db.from('chek').delete().eq('id', chek_id);
      if (error) throw error;
      await auditLog(db, actorId, 'delete_chek', 'chek', existing, null);
      return res({ success: true }, 200, cors);
    }

    if (action === 'get_subscriptions') {
      const { page = 1, per_page = 50, user_id: fUid = '', status_filter = 'all', plan_filter = '' } = body;
      const offset = (Number(page) - 1) * Number(per_page);
      let q = db.from('subscriptions').select(
        `id, user_id, plan_name, status, started_at, expires_at,
         tariff_days, is_trial, assigned_by, note, created_at, updated_at,
         profiles!subscriptions_user_id_fkey(email, full_name)`,
        { count: 'exact' }
      ).order('created_at', { ascending: false }).range(offset, offset + Number(per_page) - 1);
      if (fUid)                  q = q.eq('user_id', fUid);
      if (status_filter !== 'all') q = q.eq('status', status_filter);
      if (plan_filter)           q = q.eq('plan_name', plan_filter);
      const { data, error, count } = await q;
      if (error) throw error;
      return res({ success: true, data, count, page, per_page }, 200, cors);
    }

    if (action === 'get_active_subscriptions') {
      const now = new Date().toISOString();
      const { data, error, count } = await db.from('subscriptions').select(
        `id, user_id, plan_name, expires_at, tariff_days, is_trial,
         profiles!subscriptions_user_id_fkey(email, full_name)`,
        { count: 'exact' }
      ).eq('status', 'active').gt('expires_at', now).order('expires_at', { ascending: true });
      if (error) throw error;
      return res({ success: true, data, count }, 200, cors);
    }

    if (action === 'create_subscription') {
      const { user_id: tuid, plan_name = 'basic', tariff_days, started_at = null, is_trial = false, note = null } = body;
      if (!tuid) return res({ error: 'user_id kerak' }, 400, cors);
      if (!tariff_days || typeof tariff_days !== 'number' || tariff_days <= 0)
        return res({ error: "tariff_days musbat son bo'lishi kerak" }, 400, cors);
      const startIso = started_at ? String(started_at) : new Date().toISOString();
      const endIso   = tariffEnd(startIso, tariff_days);
      const { data: sub, error: sErr } = await db.from('subscriptions').insert({
        user_id:     tuid,
        plan_name:   String(plan_name),
        status:      new Date(endIso) > new Date() ? 'active' : 'expired',
        started_at:  startIso,
        expires_at:  endIso,
        tariff_days,
        is_trial:    Boolean(is_trial),
        assigned_by: actorId === 'system' ? null : actorId,
        note,
      }).select().single();
      if (sErr) throw sErr;

      if (!Boolean(is_trial)) {
        await db.from('profiles').update({
          tariff_days,
          tariff_end_date: endIso,
        }).eq('id', tuid);
      }
      return res({ success: true, data: sub }, 200, cors);
    }

    if (action === 'update_subscription') {
      const { subscription_id, status, expires_at, note } = body;
      if (!subscription_id) return res({ error: 'subscription_id kerak' }, 400, cors);
      const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (status !== undefined) {
        if (!['active','expired','cancelled'].includes(String(status)))
          return res({ error: 'status: active | expired | cancelled' }, 400, cors);
        u.status = status;
      }
      if (expires_at !== undefined) u.expires_at = new Date(String(expires_at)).toISOString();
      if (note !== undefined) u.note = note;
      const { data, error } = await db.from('subscriptions').update(u).eq('id', subscription_id).select().single();
      if (error) throw error;
      return res({ success: true, data }, 200, cors);
    }

    if (action === 'cancel_subscription') {
      const { subscription_id } = body;
      if (!subscription_id) return res({ error: 'subscription_id kerak' }, 400, cors);
      const { data, error } = await db.from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', subscription_id).select().single();
      if (error) throw error;
      return res({ success: true, data }, 200, cors);
    }

    if (action === 'get_payment_receipts') {
      const { page = 1, per_page = 50, user_id: fUid = '', search = '' } = body;
      const offset = (Number(page) - 1) * Number(per_page);
      let q = db.from('payment_receipts').select(
        `id, user_id, email, receipt_url, amount, currency,
         payment_method, subscription_id, created_at,
         profiles!payment_receipts_user_id_fkey(email, full_name)`,
        { count: 'exact' }
      ).order('created_at', { ascending: false }).range(offset, offset + Number(per_page) - 1);
      if (fUid)   q = q.eq('user_id', fUid);
      if (search) q = q.ilike('email', `%${search}%`);
      const { data, error, count } = await q;
      if (error) throw error;
      return res({ success: true, data, count, page, per_page }, 200, cors);
    }

    if (action === 'create_payment_receipt') {
      const { user_id: tuid, email, receipt_url, amount = null, currency = 'UZS', payment_method = null, subscription_id = null } = body;
      if (!email || !receipt_url) return res({ error: 'email va receipt_url kerak' }, 400, cors);
      const { data, error } = await db.from('payment_receipts').insert({
        user_id:         tuid ?? null,
        email:           String(email).toLowerCase().trim(),
        receipt_url:     String(receipt_url),
        amount:          amount ? Number(amount) : null,
        currency:        String(currency),
        payment_method:  payment_method ? String(payment_method) : null,
        subscription_id: subscription_id ?? null,
      }).select().single();
      if (error) throw error;
      return res({ success: true, data }, 200, cors);
    }

    if (action === 'link_receipt_to_subscription') {
      const { receipt_id, subscription_id } = body;
      if (!receipt_id || !subscription_id)
        return res({ error: 'receipt_id va subscription_id kerak' }, 400, cors);
      const { data, error } = await db.from('payment_receipts')
        .update({ subscription_id }).eq('id', receipt_id).select().single();
      if (error) throw error;
      return res({ success: true, data }, 200, cors);
    }

    if (action === 'get_stats') {
      const now   = new Date().toISOString();
      const today = new Date(); today.setHours(0, 0, 0, 0);

      const [profs, tr, msgs, chk, arch, subs, recs] = await Promise.all([
        db.from('profiles').select('tariff_days, tariff_end_date, created_at'),
        db.from('test_results').select('id', { count: 'exact', head: true }),
        db.from('contact_messages').select('id', { count: 'exact', head: true }),
        db.from('chek').select('id', { count: 'exact', head: true }),
        db.from('user_archive').select('id', { count: 'exact', head: true }),
        db.from('subscriptions').select('status, is_trial, expires_at'),
        db.from('payment_receipts').select('id', { count: 'exact', head: true }),
      ]);

      const ps = profs.data ?? [];
      const ss = subs.data  ?? [];

      const activeTrialCount  = ss.filter((s: { is_trial: boolean; status: string; expires_at: string }) =>
        s.is_trial && s.status === 'active' && s.expires_at > now).length;
      const expiredTrialCount = ss.filter((s: { is_trial: boolean; status: string }) =>
        s.is_trial && s.status !== 'active').length;

      const days14: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        days14[d.toISOString().split('T')[0]] = 0;
      }
      ps.forEach(p => {
        const day = p.created_at?.split('T')[0];
        if (day && day in days14) days14[day]++;
      });

      return res({ success: true, stats: {
        total_users:          ps.length,
        active_pro:           ps.filter(p => p.tariff_days > 0 && p.tariff_end_date > now).length,
        expired_pro:          ps.filter(p => p.tariff_days > 0 && p.tariff_end_date <= now).length,
        active_trial:         activeTrialCount,
        expired_trial:        expiredTrialCount,
        free:                 ps.filter(p => !p.tariff_days || p.tariff_days === 0).length,
        new_today:            ps.filter(p => p.created_at >= today.toISOString()).length,
        total_subscriptions:  ss.length,
        active_subscriptions: ss.filter((s: { status: string }) => s.status === 'active').length,
        trial_subscriptions:  ss.filter((s: { is_trial: boolean }) => s.is_trial).length,
        total_test_results:   tr.count  ?? 0,
        total_messages:       msgs.count ?? 0,
        total_cheks:          chk.count  ?? 0,
        total_receipts:       recs.count ?? 0,
        archived_users:       arch.count ?? 0,
      }, signups_14d: days14 }, 200, cors);
    }

    if (action === 'get_audit_logs') {
      const { page = 1, per_page = 50, table_filter = '', action_filter = '' } = body;
      const offset = (Number(page) - 1) * Number(per_page);
      let q = db.from('audit_logs')
        .select('id, user_id, action, table_name, old_values, new_values, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(per_page) - 1);
      if (table_filter)  q = q.eq('table_name', table_filter);
      if (action_filter) q = q.eq('action', action_filter);
      const { data, error, count } = await q;
      if (error) throw error;
      return res({ success: true, data, count }, 200, cors);
    }

    if (action === 'get_messages') {
      const { page = 1, per_page = 50, search = '' } = body;
      const offset = (Number(page) - 1) * Number(per_page);
      let q = db.from('contact_messages')
        .select('id, user_id, name, phone, subject, message, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(per_page) - 1);
      if (search) q = q.or(`name.ilike.%${search}%,subject.ilike.%${search}%`);
      const { data, error, count } = await q;
      if (error) throw error;
      return res({ success: true, data, count }, 200, cors);
    }

    if (action === 'delete_message') {
      const { message_id } = body;
      if (!message_id) return res({ error: 'message_id kerak' }, 400, cors);
      const { error } = await db.from('contact_messages').delete().eq('id', message_id);
      if (error) throw error;
      return res({ success: true }, 200, cors);
    }

    if (action === 'get_payments') {
      const result = await handleGetPayments(body as {
        page?: number; per_page?: number; status?: string;
        date_from?: string; date_to?: string; pro_only?: boolean; tariff_filter?: number;
      });
      return res({ success: true, ...result }, 200, cors);
    }

    if (action === 'get_payme_transactions') {
      const {
        page = 1, per_page = 50, state, plan_name = '',
        date_from = '', date_to = '', search = '',
      } = body;
      const offset = (Number(page) - 1) * Number(per_page);
      let q = db.from('payme_transactions')
        .select(
          `id, payme_id, user_id, account_email, amount_tiyin, tariff_days,
           plan_name, state, reason, create_time, perform_time, cancel_time,
           subscription_id, created_at`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(per_page) - 1);

      if (state !== undefined && state !== null && state !== 'all') {
        q = q.eq('state', Number(state));
      }
      if (plan_name) q = q.eq('plan_name', plan_name);
      if (date_from) q = q.gte('created_at', date_from);
      if (date_to) q = q.lte('created_at', date_to);
      if (search) q = q.ilike('account_email', `%${search}%`);

      const { data, error, count } = await q;
      if (error) throw error;
      return res({ success: true, data, count, page, per_page }, 200, cors);
    }

    if (action === 'get_payme_stats') {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const weekAgo = new Date(todayStart); weekAgo.setDate(weekAgo.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 86_400_000).toISOString();

      const [{ data: paid, error: paidErr }, { data: cancelled, error: cancelErr }] = await Promise.all([
        db.from('payme_transactions')
          .select('amount_tiyin, plan_name, perform_time')
          .eq('state', 2),
        db.from('payme_transactions')
          .select('reason')
          .in('state', [-1, -2])
          .gte('created_at', thirtyDaysAgoIso),
      ]);
      if (paidErr) throw paidErr;
      if (cancelErr) throw cancelErr;

      let today = 0, todayCount = 0, weekly = 0, weeklyCount = 0;
      let monthly = 0, monthlyCount = 0, total = 0, totalCount = 0;
      const planCounts: Record<string, { count: number; sum: number }> = {};

      for (const t of paid ?? []) {
        const amount = Number(t.amount_tiyin) / 100;
        total += amount; totalCount++;
        const plan = t.plan_name || 'unknown';
        if (!planCounts[plan]) planCounts[plan] = { count: 0, sum: 0 };
        planCounts[plan].count++;
        planCounts[plan].sum += amount;

        const performMs = Number(t.perform_time) || 0;
        if (performMs > 0) {
          const d = new Date(performMs);
          if (d >= monthStart) { monthly += amount; monthlyCount++; }
          if (d >= weekAgo) { weekly += amount; weeklyCount++; }
          if (d >= todayStart) { today += amount; todayCount++; }
        }
      }

      const reasonCounts: Record<string, number> = {};
      for (const c of cancelled ?? []) {
        const key = String(c.reason ?? 'unknown');
        reasonCounts[key] = (reasonCounts[key] ?? 0) + 1;
      }

      return res({
        success: true,
        data: {
          today, todayCount, weekly, weeklyCount, monthly, monthlyCount, total, totalCount,
          plan_breakdown: Object.entries(planCounts).map(([plan_name, v]) => ({
            plan_name, count: v.count, sum: v.sum,
          })),
          cancelled_count: (cancelled ?? []).length,
          cancelled_by_reason: Object.entries(reasonCounts).map(([reason, count]) => ({
            reason: reason === 'unknown' ? null : Number(reason),
            count,
          })),
        },
      }, 200, cors);
    }

    if (action === 'get_test_results') {
      const { page = 1, per_page = 50, variant_filter = 0, user_id_filter = '' } = body;
      const offset = (Number(page) - 1) * Number(per_page);
      let q = db.from('test_results').select(
        `id, user_id, variant, correct_answers, total_questions, time_taken_seconds, completed_at,
         profiles!test_results_user_id_fkey(email, full_name)`,
        { count: 'exact' }
      ).order('completed_at', { ascending: false }).range(offset, offset + Number(per_page) - 1);
      if (Number(variant_filter) > 0) q = q.eq('variant', variant_filter);
      if (user_id_filter)             q = q.eq('user_id', user_id_filter);
      const { data, error, count } = await q;
      if (error) throw error;
      return res({ success: true, data, count }, 200, cors);
    }

    if (action === 'get_payment_types') {
      const { data, error } = await db.from('payment_types')
        .select('id,name,description,is_active,sort_order,created_at').order('sort_order');
      if (error) throw error;
      return res({ success: true, data }, 200, cors);
    }
    if (action === 'create_payment_type') {
      const { name, description = null, is_active = true, sort_order = 99 } = body;
      if (!String(name ?? '').trim()) return res({ error: 'name kerak' }, 400, cors);
      const { data, error } = await db.from('payment_types')
        .insert({ name: String(name).trim(), description, is_active, sort_order }).select().single();
      if (error) throw error;
      return res({ success: true, data }, 200, cors);
    }
    if (action === 'update_payment_type') {
      const { type_id, name, description, is_active, sort_order } = body;
      if (!type_id) return res({ error: 'type_id kerak' }, 400, cors);
      const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name        !== undefined) u.name        = String(name).trim();
      if (description !== undefined) u.description = description;
      if (is_active   !== undefined) u.is_active   = Boolean(is_active);
      if (sort_order  !== undefined) u.sort_order  = Number(sort_order);
      const { data, error } = await db.from('payment_types').update(u).eq('id', type_id).select().single();
      if (error) throw error;
      return res({ success: true, data }, 200, cors);
    }
    if (action === 'delete_payment_type') {
      const { type_id } = body;
      if (!type_id) return res({ error: 'type_id kerak' }, 400, cors);
      const { count: cnt } = await db.from('user_payment_type')
        .select('id', { count: 'exact', head: true }).eq('payment_type_id', type_id);
      if (cnt && cnt > 0)
        return res({ error: `Bu turda ${cnt} ta user bor. Avval o'tkazing.` }, 400, cors);
      const { error } = await db.from('payment_types').delete().eq('id', type_id);
      if (error) throw error;
      return res({ success: true }, 200, cors);
    }
    if (action === 'assign_payment_type') {
      const { user_id: tuid, payment_type_id, note = null } = body;
      if (!tuid || !payment_type_id)
        return res({ error: 'user_id va payment_type_id kerak' }, 400, cors);
      const { data: pt } = await db.from('payment_types').select('id,is_active').eq('id', payment_type_id).single();
      if (!pt)           return res({ error: "To'lov turi topilmadi" }, 404, cors);
      if (!pt.is_active) return res({ error: 'Bu tur aktiv emas' }, 400, cors);
      const { data, error } = await db.from('user_payment_type').upsert({
        user_id:         tuid,
        payment_type_id,
        note,
        assigned_by:     actorId === 'system' ? null : actorId,
        updated_at:      new Date().toISOString(),
      }, { onConflict: 'user_id' }).select('id,user_id,payment_type_id,note,updated_at,payment_types(id,name)').single();
      if (error) throw error;
      return res({ success: true, data }, 200, cors);
    }
    if (action === 'get_user_payment_type') {
      const { user_id: tuid } = body;
      if (!tuid) return res({ error: 'user_id kerak' }, 400, cors);
      const { data, error } = await db.from('user_payment_type')
        .select('id,user_id,payment_type_id,note,assigned_by,created_at,updated_at,payment_types(id,name,sort_order)')
        .eq('user_id', tuid).single();
      if (error && error.code !== 'PGRST116') throw error;
      return res({ success: true, data: data ?? null }, 200, cors);
    }
    if (action === 'get_payment_type_stats') {
      const { data: pts } = await db.from('payment_types').select('id,name,sort_order,is_active').order('sort_order');
      const { data: upts } = await db.from('user_payment_type').select('payment_type_id');
      const counts: Record<string, number> = {};
      (upts ?? []).forEach((r: { payment_type_id: string }) => { counts[r.payment_type_id] = (counts[r.payment_type_id] ?? 0) + 1; });
      const result = (pts ?? []).map((pt: { id: string; name: string; sort_order: number; is_active: boolean }) => ({
        ...pt, user_count: counts[pt.id] ?? 0,
      }));
      return res({ success: true, data: result }, 200, cors);
    }

    if (action === 'get_finance_stats') {
      const stats = await handleGetFinanceStats();
      return res({ success: true, data: stats }, 200, cors);
    }

    if (action === 'get_news_posts') {
      const { page = 1, per_page = 50, search = '', is_published } = body;
      const offset = (Number(page) - 1) * Number(per_page);
      let q = db.from('news_posts')
        .select(
          `id, slug, title_uz_lat, title_uz_cyr, title_ru,
           cover_image_url, is_published, published_at, created_at, updated_at`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(per_page) - 1);

      if (search) q = q.ilike('title_uz_lat', `%${search}%`);
      if (is_published !== undefined && is_published !== null) {
        q = q.eq('is_published', Boolean(is_published));
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return res({ success: true, data, count, page, per_page }, 200, cors);
    }

    if (action === 'get_news_post') {
      const { id, slug } = body;
      if (!id && !slug) return res({ error: 'id yoki slug kerak' }, 400, cors);
      let q = db.from('news_posts').select('*');
      q = id ? q.eq('id', id) : q.eq('slug', slug);
      const { data, error } = await q.single();
      if (error) throw error;
      return res({ success: true, data }, 200, cors);
    }

    if (action === 'create_news_post') {
      const {
        title_uz_lat, title_uz_cyr = null, title_ru = null,
        excerpt_uz_lat = null, excerpt_uz_cyr = null, excerpt_ru = null,
        body_uz_lat, body_uz_cyr = null, body_ru = null,
        cover_image_url = null,
        meta_description_uz_lat = null, meta_description_uz_cyr = null, meta_description_ru = null,
        is_published = false,
      } = body;

      if (!String(title_uz_lat ?? '').trim() || String(title_uz_lat).trim().length < 3)
        return res({ error: "title_uz_lat kamida 3 belgidan iborat bo'lishi kerak" }, 400, cors);
      if (!String(body_uz_lat ?? '').trim() || String(body_uz_lat).trim().length < 20)
        return res({ error: "body_uz_lat kamida 20 belgidan iborat bo'lishi kerak" }, 400, cors);

      const slug = await generateUniqueSlug(db, String(title_uz_lat));
      const publish = Boolean(is_published);
      const insertData = {
        slug,
        title_uz_lat: String(title_uz_lat).trim(),
        title_uz_cyr, title_ru,
        excerpt_uz_lat, excerpt_uz_cyr, excerpt_ru,
        body_uz_lat: String(body_uz_lat).trim(),
        body_uz_cyr, body_ru,
        cover_image_url,
        meta_description_uz_lat, meta_description_uz_cyr, meta_description_ru,
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
      };
      const { data, error } = await db.from('news_posts').insert(insertData).select().single();
      if (error) throw error;
      await auditLog(db, actorId, 'create_news_post', 'news_posts', null, data);
      return res({ success: true, data }, 200, cors);
    }

    if (action === 'update_news_post') {
      const { id, ...fields } = body as Record<string, unknown> & { id?: string };
      if (!id) return res({ error: 'id kerak' }, 400, cors);
      const { data: existing, error: fetchErr } = await db.from('news_posts').select('*').eq('id', id).single();
      if (fetchErr || !existing) return res({ error: 'Post topilmadi' }, 404, cors);

      const editableFields = [
        'title_uz_lat', 'title_uz_cyr', 'title_ru',
        'excerpt_uz_lat', 'excerpt_uz_cyr', 'excerpt_ru',
        'body_uz_lat', 'body_uz_cyr', 'body_ru',
        'cover_image_url',
        'meta_description_uz_lat', 'meta_description_uz_cyr', 'meta_description_ru',
      ];
      const updates: Record<string, unknown> = {};
      for (const f of editableFields) {
        if (fields[f] !== undefined) updates[f] = fields[f];
      }

      if (updates.title_uz_lat !== undefined) {
        if (!String(updates.title_uz_lat ?? '').trim() || String(updates.title_uz_lat).trim().length < 3)
          return res({ error: "title_uz_lat kamida 3 belgidan iborat bo'lishi kerak" }, 400, cors);
        updates.title_uz_lat = String(updates.title_uz_lat).trim();
      }
      if (updates.body_uz_lat !== undefined) {
        if (!String(updates.body_uz_lat ?? '').trim() || String(updates.body_uz_lat).trim().length < 20)
          return res({ error: "body_uz_lat kamida 20 belgidan iborat bo'lishi kerak" }, 400, cors);
        updates.body_uz_lat = String(updates.body_uz_lat).trim();
      }
      if (fields.is_published !== undefined) {
        const publish = Boolean(fields.is_published);
        updates.is_published = publish;
        if (publish && !existing.published_at) {
          updates.published_at = new Date().toISOString();
        }
      }
      if (Object.keys(updates).length === 0)
        return res({ error: "O'zgartirish ma'lumotlari yo'q" }, 400, cors);
      updates.updated_at = new Date().toISOString();

      const { data, error } = await db.from('news_posts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      await auditLog(db, actorId, 'update_news_post', 'news_posts', existing, data);
      return res({ success: true, data }, 200, cors);
    }

    if (action === 'delete_news_post') {
      const { id } = body;
      if (!id) return res({ error: 'id kerak' }, 400, cors);
      const { data: existing } = await db.from('news_posts').select('*').eq('id', id).single();
      if (!existing) return res({ error: 'Post topilmadi' }, 404, cors);
      const { error } = await db.from('news_posts').delete().eq('id', id);
      if (error) throw error;
      await auditLog(db, actorId, 'delete_news_post', 'news_posts', existing, null);
      return res({ success: true }, 200, cors);
    }

    if (action === 'toggle_publish_news_post') {
      const { id } = body;
      if (!id) return res({ error: 'id kerak' }, 400, cors);
      const { data: existing, error: fetchErr } = await db.from('news_posts').select('*').eq('id', id).single();
      if (fetchErr || !existing) return res({ error: 'Post topilmadi' }, 404, cors);

      const nextPublished = !existing.is_published;
      const updates: Record<string, unknown> = {
        is_published: nextPublished,
        updated_at: new Date().toISOString(),
      };
      if (nextPublished && !existing.published_at) {
        updates.published_at = new Date().toISOString();
      }
      const { data, error } = await db.from('news_posts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      await auditLog(db, actorId, 'toggle_publish_news_post', 'news_posts', existing, data);
      return res({ success: true, data }, 200, cors);
    }

    return res({ error: "Noma'lum action" }, 400, cors);

  } catch (err) {
    console.error('[admin-manager v27]', err);
    return res({ error: 'Server xatosi', detail: String(err) }, 500, cors);
  }
});
