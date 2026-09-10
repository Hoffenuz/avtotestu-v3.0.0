/** Server-side moliya (src/lib/finance.ts bilan mos) */

const TARIFF_PRICES: Record<number, number> = {
  7: 15_000,
  31: 33_000,
  91: 83_000,
  93: 83_000,
};

export interface PriceInfo {
  days: number;
  price: number;
  label: string;
}

export function getPriceInfo(tariff_days: number): PriceInfo | null {
  if (tariff_days === 7) return { days: 7, price: 15_000, label: "7 kunlik" };
  if (tariff_days === 31) return { days: 31, price: 33_000, label: "31 kunlik" };
  if (tariff_days === 91 || tariff_days === 93) {
    return { days: tariff_days, price: 83_000, label: `${tariff_days} kunlik` };
  }
  return null;
}

function startOfLocalDay(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function computeGrantDateFromEnd(tariffEndDate: string, tariffDays: number): Date {
  const endDay = startOfLocalDay(tariffEndDate);
  const start = new Date(endDay);
  start.setDate(start.getDate() - tariffDays);
  return start;
}

function sameEndDay(a: string, b: string): boolean {
  const da = startOfLocalDay(a);
  const db = startOfLocalDay(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function pickCurrentPaidSubscription(user: RawUser, subscriptions: RawSub[]): RawSub | null {
  const userSubs = subscriptions.filter(
    (s) => s.user_id === user.id && !s.is_trial && (s.tariff_days ?? 0) > 0
  );
  if (!userSubs.length) return null;

  const profileDays = user.tariff_days ?? 0;
  const profileEnd = user.tariff_end_date;
  const matched =
    profileDays > 0 && profileEnd
      ? userSubs.filter(
          (s) =>
            (s.tariff_days ?? 0) === profileDays &&
            !!s.expires_at &&
            sameEndDay(s.expires_at, profileEnd)
        )
      : [];
  const pool = matched.length > 0 ? matched : userSubs;

  let best: RawSub | null = null;
  let bestAt = 0;
  for (const s of pool) {
    const raw = s.started_at;
    if (!raw) continue;
    const t = new Date(raw).getTime();
    if (!best || t >= bestAt) {
      bestAt = t;
      best = s;
    }
  }
  return best ?? pool[0] ?? null;
}

function resolveSubscriptionGrantDate(sub: RawSub, user: RawUser): string {
  const days = sub.tariff_days ?? user.tariff_days ?? 0;
  if (sub.started_at) return startOfLocalDay(sub.started_at).toISOString();
  if (user.tariff_start_date) return startOfLocalDay(user.tariff_start_date).toISOString();
  const end = sub.expires_at ?? user.tariff_end_date;
  if (end && days > 0) return computeGrantDateFromEnd(end, days).toISOString();
  return new Date(0).toISOString();
}

function resolveProfileGrantDate(user: RawUser): string {
  const days = user.tariff_days ?? 0;
  if (user.tariff_start_date) return startOfLocalDay(user.tariff_start_date).toISOString();
  if (user.tariff_end_date && days > 0) {
    return computeGrantDateFromEnd(user.tariff_end_date, days).toISOString();
  }
  if (user.archived_at) return startOfLocalDay(user.archived_at).toISOString();
  return new Date(0).toISOString();
}

function isNaqtPaymentType(userPaymentType: unknown): boolean {
  if (!userPaymentType) return false;
  const rows = Array.isArray(userPaymentType) ? userPaymentType : [userPaymentType];
  return rows.some((row) => {
    const name = (row as { payment_types?: { name?: string } })?.payment_types?.name;
    if (!name) return false;
    const n = name.trim().toLowerCase();
    return n === "naqt" || n === "naqd" || n === "naqt to'lov" || n === "naqd to'lov";
  });
}

type RawUser = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  tariff_days?: number | null;
  tariff_end_date?: string | null;
  tariff_start_date?: string | null;
  created_at?: string | null;
  archived_at?: string | null;
  user_payment_type?: unknown;
};

type RawSub = {
  id: string;
  user_id: string;
  tariff_days?: number | null;
  started_at?: string | null;
  expires_at?: string | null;
  is_trial?: boolean | null;
};

function sameCalendarDay(a: string, b: Date): boolean {
  const da = new Date(a);
  return (
    da.getFullYear() === b.getFullYear() &&
    da.getMonth() === b.getMonth() &&
    da.getDate() === b.getDate()
  );
}

export function buildFinancePayload(
  active: RawUser[],
  archived: RawUser[],
  subscriptions: RawSub[] = [],
  naqtOnly = true
) {
  const now = new Date();
  const nowIso = now.toISOString();
  const archivedIds = new Set(archived.map((u) => u.id));
  const events: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const passes = (u: RawUser) =>
    !naqtOnly || isNaqtPaymentType(u.user_payment_type);

  for (const u of [...active, ...archived]) {
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    if (!passes(u)) continue;

    const td = u.tariff_days ?? 0;
    const priceInfo = getPriceInfo(td);
    if (!priceInfo) continue;

    const sub = pickCurrentPaidSubscription(u, subscriptions);
    const paymentDate = sub
      ? resolveSubscriptionGrantDate(sub, u)
      : resolveProfileGrantDate(u);
    if (new Date(paymentDate).getTime() <= 0) continue;

    const source = sub ? "subscription" : archivedIds.has(u.id) ? "archive" : "active";
    events.push({
      id: sub ? `sub-${sub.id}` : `profile-${u.id}-${paymentDate}-${td}`,
      user_id: u.id,
      email: u.email || "—",
      full_name: u.full_name ?? null,
      tariff_days: td,
      tariff_start_date: paymentDate,
      tariff_end_date: sub?.expires_at ?? u.tariff_end_date ?? null,
      priceInfo,
      source,
    });
  }

  const proUsers = [...events].sort(
    (a, b) =>
      new Date(b.tariff_start_date as string).getTime() -
      new Date(a.tariff_start_date as string).getTime()
  );

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let today = 0;
  let weekly = 0;
  let monthly = 0;
  let total = 0;
  let todayCount = 0;
  const todayBreakdown: Record<number, { count: number; sum: number }> = {};

  for (const u of proUsers) {
    const d = new Date(u.tariff_start_date as string);
    const price = (u.priceInfo as PriceInfo).price;
    const td = (u.priceInfo as PriceInfo).days;
    total += price;
    if (d >= monthStart) monthly += price;
    if (d >= weekAgo) weekly += price;
    if (d >= todayStart) {
      today += price;
      todayCount += 1;
      const key = td === 91 || td === 93 ? 91 : td;
      if (!todayBreakdown[key]) todayBreakdown[key] = { count: 0, sum: 0 };
      todayBreakdown[key].count += 1;
      todayBreakdown[key].sum += price;
    }
  }

  const dailyData: {
    date: string;
    daromad: number;
    count7: number;
    count31: number;
    count91: number;
  }[] = [];

  for (let i = 13; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    let count7 = 0;
    let count31 = 0;
    let count91 = 0;
    let revenue = 0;
    for (const u of proUsers) {
      if (!sameCalendarDay(u.tariff_start_date as string, day)) continue;
      revenue += (u.priceInfo as PriceInfo).price;
      const td = (u.priceInfo as PriceInfo).days;
      if (td === 7) count7++;
      else if (td === 31) count31++;
      else count91++;
    }
    const dd = String(day.getDate()).padStart(2, "0");
    const mm = String(day.getMonth() + 1).padStart(2, "0");
    dailyData.push({ date: `${dd}/${mm}`, daromad: revenue, count7, count31, count91 });
  }

  const currentUsersTotal = active.reduce((sum, profile) => {
    const days = profile.tariff_days ?? 0;
    const pi = getPriceInfo(days);
    if (!pi) return sum;
    if (!profile.tariff_end_date || profile.tariff_end_date <= nowIso) return sum;
    if (naqtOnly && !isNaqtPaymentType(profile.user_payment_type)) return sum;
    return sum + pi.price;
  }, 0);

  const counts: Record<string, number> = {
    "7 kunlik": 0,
    "31 kunlik": 0,
    "93 kunlik": 0,
    "91 kunlik": 0,
  };
  for (const u of proUsers) {
    const label = (u.priceInfo as PriceInfo).label;
    if (counts[label] !== undefined) counts[label]++;
  }
  const pieData = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return {
    today,
    weekly,
    monthly,
    total,
    todayCount,
    todayBreakdown: Object.entries(todayBreakdown).map(([days, v]) => ({
      days: Number(days),
      count: v.count,
      sum: v.sum,
    })),
    currentUsersTotal,
    proUsers,
    dailyData,
    pieData,
    plan7Count: proUsers.filter((u) => (u.priceInfo as PriceInfo).days === 7).length,
    plan31Count: proUsers.filter((u) => (u.priceInfo as PriceInfo).days === 31).length,
    plan93Count: proUsers.filter((u) => {
      const d = (u.priceInfo as PriceInfo).days;
      return d === 93 || d === 91;
    }).length,
  };
}
