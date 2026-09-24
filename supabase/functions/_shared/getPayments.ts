import { createServiceClient } from "./auth.ts";
import { getPriceInfo } from "./financeLogic.ts";

type GetPaymentsParams = {
  page?: number;
  per_page?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  pro_only?: boolean;
  tariff_filter?: number;
};

type ChekRow = Record<string, unknown> & {
  user_id?: string | null;
  profiles?: { tariff_days?: number | null } | { tariff_days?: number | null }[] | null;
};

export async function handleGetPayments(params: GetPaymentsParams) {
  const supabase = createServiceClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(500, Math.max(1, params.per_page ?? 50));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // profiles'ni har doim embed qilamiz — bu tariff_days'ni bitta so'rovda
  // olib beradi va katta .in(userIds) ro'yxati (URL uzunligi limitidan
  // oshib PostgREST 400 qaytarishi mumkin edi) kerak bo'lmaydi.
  const needsMatch = !!(params.pro_only || params.tariff_filter);
  const profilesEmbed = needsMatch
    ? "profiles!chek_user_id_fkey!inner(tariff_days)"
    : "profiles!chek_user_id_fkey(tariff_days)";

  let query = supabase
    .from("chek")
    .select(`*, ${profilesEmbed}`, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.pro_only) query = query.gt("profiles.tariff_days", 0);
  if (params.tariff_filter) query = query.eq("profiles.tariff_days", params.tariff_filter);

  const status = params.status ?? "all";
  if (status === "uploaded") {
    query = query
      .neq("link", "yuklanmagan")
      .not("link", "is", null)
      .neq("link", "");
  } else if (status === "not_uploaded") {
    query = query.eq("link", "yuklanmagan");
  }

  if (params.date_from) query = query.gte("created_at", params.date_from);
  if (params.date_to) query = query.lte("created_at", params.date_to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ChekRow[];

  const tariffMap: Record<string, number> = {};
  for (const row of rows) {
    const uid = row.user_id ?? undefined;
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const td = profile?.tariff_days;
    if (uid && typeof td === "number") tariffMap[uid] = td;
  }

  let stats: Record<string, number> | undefined;
  if (params.pro_only && status === "uploaded" && perPage >= 1000) {
    let count7 = 0;
    let count31 = 0;
    let count93 = 0;
    for (const c of rows) {
      const td = tariffMap[(c.user_id as string) ?? ""];
      if (td === 7) count7++;
      else if (td === 31) count31++;
      else if (td === 93) count93++;
    }
    stats = {
      count7,
      count31,
      count93,
      totalAmount:
        count7 * getPriceInfo(7).price +
        count31 * getPriceInfo(31).price +
        count93 * getPriceInfo(93).price,
    };
  }

  return {
    data: rows.map(({ profiles: _profiles, ...rest }) => rest),
    count: count ?? 0,
    tariff_map: tariffMap,
    ...(stats ? { stats } : {}),
  };
}
