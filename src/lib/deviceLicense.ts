// ============================================================================
// deviceLicense.ts — Edge Function orqali xavfsiz litsenziya olish/yangilash
// ============================================================================

import { supabase } from "@/integrations/supabase/client";

export interface LicenseResponse {
  ok: boolean;
  error?: string;
  message?: string;
  state?: string;
  license_key?: string;
  short_code?: string;
  device_id?: string;
  issued_at?: string;
  expires_at?: string;
  remaining_days?: number;
  /** true = mavjud kalit qaytarildi, yangi yaratilmadi */
  locked?: boolean;
  /** true = obuna yangilangan holda kalit qayta yaratildi */
  refreshed?: boolean;
  /** true = yangilash tugmasi ko'rsatiladi */
  can_refresh?: boolean;
}

export interface StoredLicense {
  device_id: string;
  license_key: string;
  short_code: string;
  issued_at: string;
  expires_at: string;
  revoked: boolean;
  refresh_count?: number;
  last_refreshed_at?: string | null;
}

type InvokeOptions = {
  deviceId?: string;
  action?: "issue" | "refresh";
};

async function invokeLicense(options: InvokeOptions): Promise<LicenseResponse> {
  try {
    const body: Record<string, string> = {};
    if (options.deviceId) body.device_id = options.deviceId.trim();
    if (options.action) body.action = options.action;

    const { data, error } = await supabase.functions.invoke<LicenseResponse>(
      "generate-license",
      { body },
    );

    if (error) {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const parsed = (await ctx.json()) as LicenseResponse;
          if (parsed && typeof parsed.ok === "boolean") return parsed;
        } catch {
          /* ignore */
        }
      }
      if (!import.meta.env.PROD) {
        console.error("[invokeLicense] error:", error);
      }
      return { ok: false, error: "internal_error" };
    }

    return data ?? { ok: false, error: "internal_error" };
  } catch {
    return { ok: false, error: "internal_error" };
  }
}

/** Server xato kodlarini foydalanuvchiga ko'rsatiladigan matnga aylantiradi. */
export function licenseErrorText(res: LicenseResponse): string {
  if (res.message) return res.message;
  switch (res.error) {
    case "not_authenticated":
    case "invalid_token":
      return "Avval tizimga kiring.";
    case "invalid_device_id":
      return "Qurilma ID noto'g'ri. Ilovadagi ID ni to'g'ri nusxalang.";
    case "license_already_issued":
      return "Sizda allaqachon litsenziya mavjud. Bitta akkaunt — bitta qurilma.";
    case "no_active_subscription":
      return "Faol PRO obuna topilmadi. Avval to'lovni amalga oshiring.";
    case "subscription_expired":
      return "Obuna muddati tugagan.";
    case "refresh_required":
      return "Obuna yangilangan yoki kalit muddati tugagan. Kalitni yangilash tugmasini bosing.";
    case "refresh_not_needed":
      return "Kalitingiz hali amal qiladi. Yangilash shart emas.";
    case "no_license_to_refresh":
      return "Avval litsenziya oling, keyin yangilang.";
    case "device_mismatch":
      return "Qurilma ID mavjud litsenziya bilan mos kelmaydi.";
    case "license_revoked":
      return "Litsenziya bekor qilingan. Administrator bilan bog'laning.";
    case "refresh_rate_limited":
      return "Juda tez urinildi. Bir daqiqadan keyin qayta urinib ko'ring.";
    case "signing_not_configured":
      return "Server sozlanmagan. Administrator bilan bog'laning.";
    case "access_check_failed":
      return "Obuna holatini tekshirishda xatolik. Sahifani yangilab qayta urinib ko'ring.";
    case "save_failed":
    case "internal_error":
      return "Server xatosi. Birozdan keyin qayta urinib ko'ring.";
    default:
      return "Litsenziya olishda xatolik yuz berdi.";
  }
}

/** Yangi litsenziya so'raydi (birinchi marta). */
export async function requestLicense(deviceId: string): Promise<LicenseResponse> {
  return invokeLicense({ deviceId, action: "issue" });
}

/** Obuna yangilanganda kalitni qayta yaratadi (server tekshiradi). */
export async function refreshLicense(deviceId?: string): Promise<LicenseResponse> {
  return invokeLicense({ deviceId, action: "refresh" });
}

/** Mavjud kalit yangilanishi kerakmi (UI uchun; yakuniy qaror serverda). */
export function canRefreshLicense(
  license: StoredLicense | null,
  subscriptionExpiresAt: Date | null,
  isPremium: boolean,
): boolean {
  if (!license || !isPremium || !subscriptionExpiresAt || license.revoked) return false;

  const licenseExpiresMs = new Date(license.expires_at).getTime();
  const subscriptionExpiresMs = subscriptionExpiresAt.getTime();
  if (Number.isNaN(licenseExpiresMs) || Number.isNaN(subscriptionExpiresMs)) return false;

  return (
    licenseExpiresMs <= Date.now() ||
    subscriptionExpiresMs > licenseExpiresMs + 60_000
  );
}

/** Foydalanuvchining yagona litsenziyasini o'qiydi (RLS: faqat o'ziniki). */
export async function fetchMyLicense(): Promise<StoredLicense | null> {
  try {
    const { data, error } = await supabase
      .from("device_licenses")
      .select(
        "device_id, license_key, short_code, issued_at, expires_at, revoked, refresh_count, last_refreshed_at",
      )
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
