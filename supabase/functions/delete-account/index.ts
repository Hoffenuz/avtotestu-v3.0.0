/**
 * delete-account — foydalanuvchi o'z hisobini o'chiradi.
 *
 * Google Play 2023-yildan beri ro'yxatdan o'tish mavjud bo'lgan har bir
 * ilovada hisobni ilova ichidan o'chirish imkonini talab qiladi.
 *
 * Xavfsizlik: chaqiruvchi FAQAT o'z hisobini o'chira oladi. Foydalanuvchi
 * id si so'rov tanasidan emas, Authorization sarlavhasidagi JWT dan olinadi
 * (`auth.getUser` uni imzo bo'yicha tekshiradi), shuning uchun boshqa birovning
 * id sini yuborib bo'lmaydi.
 *
 * verify_jwt = false: tekshiruvni o'zimiz bajaramiz, chunki xato holatlarida
 * platformaning quruq 401 i o'rniga tushunarli javob qaytarishimiz kerak.
 *
 * O'chirilmaydigan narsalar (ataylab):
 *   - payme_transactions — Payme protokoli va buxgalteriya yozuvlari; to'lov
 *     bekor qilinishi keyinroq kelishi mumkin va o'sha qator kerak bo'ladi
 *   - device_licenses    — jadval triggeri o'chirishni umuman taqiqlaydi
 *   - chek / payment_receipts — user_id SET NULL bo'ladi (moliyaviy hujjat
 *     saqlanadi, shaxsga bog'lanish uziladi)
 *   - audit_logs         — audit izi
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Tokenni imzo bo'yicha tekshirib, egasini aniqlaymiz.
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userErr || !user) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  // Tasodifiy chaqiruvdan himoya: ilova aniq tasdiq yuboradi.
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // tanasiz so'rov — quyidagi tekshiruv rad etadi
  }
  if (body.confirm !== true) {
    return json({ ok: false, error: "confirmation_required" }, 400);
  }

  const userId = user.id;

  try {
    // 1. Tashqi kalitsiz jadvallar — qo'lda tozalanadi.
    for (const table of [
      "test_sessions",
      "contact_messages",
      "reviews",
      "user_roles",
    ]) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) {
        console.error(`[delete-account] ${table}: ${error.message}`);
        return json({ ok: false, error: "cleanup_failed" }, 500);
      }
    }

    // 2. Profil — bu subscriptions / test_results / user_payment_type ni
    //    kaskad o'chiradi va chek / payment_receipts da user_id ni NULL qiladi.
    //    Tarifi bo'lgan hisoblar uchun archive_pro_user_on_delete triggeri
    //    ishlaydi (obuna tarixi buxgalteriya uchun qoladi).
    const { error: profileErr } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileErr) {
      console.error(`[delete-account] profiles: ${profileErr.message}`);
      return json({ ok: false, error: "cleanup_failed" }, 500);
    }

    // 3. Auth hisobi — shundan keyin kirish mumkin emas.
    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error(`[delete-account] auth: ${authErr.message}`);
      return json({ ok: false, error: "auth_delete_failed" }, 500);
    }

    console.log(`[delete-account] deleted ${userId}`);
    return json({ ok: true });
  } catch (err) {
    console.error("[delete-account] unexpected:", err);
    return json({ ok: false, error: "internal_error" }, 500);
  }
});
