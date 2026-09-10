import { createServiceClient } from "./auth.ts";
import { buildFinancePayload } from "./financeLogic.ts";

const PROFILE_SELECT =
  "id, email, full_name, tariff_days, tariff_end_date, tariff_start_date, created_at, user_payment_type(payment_types(name))";

const ARCHIVE_SELECT =
  "id, email, full_name, tariff_days, tariff_end_date, tariff_start_date, archived_at, user_payment_type(payment_types(name))";

const SUB_SELECT =
  "id, user_id, tariff_days, started_at, expires_at, is_trial, status";

export async function handleGetFinanceStats(): Promise<Record<string, unknown>> {
  const supabase = createServiceClient();

  const [activeRes, archiveRes, subRes] = await Promise.all([
    supabase.from("profiles").select(PROFILE_SELECT).gt("tariff_days", 0),
    supabase.from("user_archive").select(ARCHIVE_SELECT).gt("tariff_days", 0),
    supabase.from("subscriptions").select(SUB_SELECT).gt("tariff_days", 0),
  ]);

  if (activeRes.error) throw new Error(activeRes.error.message);

  const archived = archiveRes.error ? [] : archiveRes.data ?? [];
  const subscriptions = subRes.error ? [] : subRes.data ?? [];

  return buildFinancePayload(
    activeRes.data ?? [],
    archived,
    subscriptions,
    true
  );
}
