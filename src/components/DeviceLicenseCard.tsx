import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  KeyRound,
  Copy,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  requestLicense,
  refreshLicense,
  fetchMyLicense,
  licenseErrorText,
  canRefreshLicense,
  type LicenseResponse,
  type StoredLicense,
} from '@/lib/deviceLicense';

function formatDate(iso?: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
}

function remainingDays(expiresAt?: string | null): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function truncateLicenseKey(key: string, head = 12, tail = 8): string {
  if (key.length <= head + tail + 3) return key;
  return `${key.slice(0, head)}...${key.slice(-tail)}`;
}

/** Faqat raqam, "0000 0000 0007 1365" ko'rinishida (4 tadan guruh, jami 16 ta raqam). */
function formatDeviceIdInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

interface Props {
  isPremium: boolean;
  subscriptionExpiresAt: Date | null;
  className?: string;
}

function LicenseDisplay({
  licenseKey,
  deviceId,
  issuedAt,
  expiresAt,
  remainingDaysCount,
  statusLabel,
  statusHint,
  onCopy,
}: {
  licenseKey: string;
  deviceId?: string;
  issuedAt?: string;
  expiresAt?: string;
  remainingDaysCount?: number;
  statusLabel: string;
  statusHint?: string;
  onCopy: (text: string, label: string) => void;
}) {
  const [showFullKey, setShowFullKey] = useState(false);
  const days = remainingDaysCount ?? remainingDays(expiresAt);
  const canTruncate = licenseKey.length > 24;
  const isExpired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/30">
      <div className="flex items-center gap-2 mb-3">
        {isExpired ? (
          <AlertCircle className="w-5 h-5 text-amber-600" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        )}
        <span className="font-semibold text-foreground">{statusLabel}</span>
      </div>

      {statusHint && (
        <p className="text-xs text-muted-foreground mb-3">{statusHint}</p>
      )}

      <div className="space-y-3">
        {deviceId && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bog&apos;langan qurilma ID</p>
            <p className="text-sm font-mono text-foreground truncate" title={deviceId}>
              {truncateLicenseKey(deviceId, 8, 6)}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-1">Aktivatsiya kaliti</p>
          <div className="flex items-center gap-2">
            <code
              className={`flex-1 min-w-0 text-sm font-mono bg-background/60 rounded-md px-3 py-2 border border-border ${
                showFullKey ? 'break-all' : 'truncate'
              }`}
              title={showFullKey ? undefined : licenseKey}
            >
              {showFullKey || !canTruncate ? licenseKey : truncateLicenseKey(licenseKey)}
            </code>
            {canTruncate && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 shrink-0"
                onClick={() => setShowFullKey((v) => !v)}
                title={showFullKey ? "Qisqartirish" : "To'liq ko'rish"}
              >
                {showFullKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2 shrink-0"
              onClick={() => onCopy(licenseKey, 'Kalit')}
              title="Nusxalash"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Yaratilgan</p>
              <p className="text-sm font-medium text-foreground">{formatDate(issuedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tugaydi</p>
              <p className={`text-sm font-medium ${isExpired ? 'text-amber-600' : 'text-foreground'}`}>
                {formatDate(expiresAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Qolgan muddat</p>
              <p className={`text-sm font-bold ${isExpired ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isExpired ? 'Tugagan' : `${days} kun`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeviceLicenseCard({
  isPremium,
  subscriptionExpiresAt,
  className,
}: Props) {
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LicenseResponse | null>(null);
  const [existing, setExisting] = useState<StoredLicense | null>(null);

  const reloadLicense = async () => {
    const lic = await fetchMyLicense();
    setExisting(lic);
    return lic;
  };

  useEffect(() => {
    reloadLicense()
      .catch(() => setExisting(null))
      .finally(() => setLoading(false));
  }, []);

  const showRefresh = useMemo(
    () => canRefreshLicense(existing, subscriptionExpiresAt, isPremium),
    [existing, subscriptionExpiresAt, isPremium],
  );

  const handleResponse = async (res: LicenseResponse) => {
    if (!res.ok) {
      setError(licenseErrorText(res));
      return;
    }

    setError('');
    setResult(res);
    if (res.refreshed) {
      toast.success('Litsenziya kaliti yangilandi!');
    } else if (res.locked) {
      toast.info('Mavjud litsenziya ko\'rsatildi');
    } else {
      toast.success('Litsenziya kaliti tayyor!');
    }
    await reloadLicense();
  };

  const handleGetLicense = async () => {
    setError('');
    setResult(null);

    const id = deviceId.replace(/\D/g, '');
    if (id.length !== 16) {
      setError("Qurilma ID ni to'g'ri kiriting (16 ta raqam, masalan: 0000 0000 0007 1365).");
      return;
    }

    setSubmitting(true);
    const res = await requestLicense(id);
    setSubmitting(false);
    await handleResponse(res);
  };

  const handleRefreshLicense = async () => {
    if (!existing) return;

    setError('');
    setResult(null);
    setRefreshing(true);
    const res = await refreshLicense(existing.device_id);
    setRefreshing(false);
    await handleResponse(res);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} nusxalandi`);
    } catch {
      toast.error('Nusxalash amalga oshmadi');
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 flex justify-center ${className ?? 'mb-6'}`}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </Card>
    );
  }

  const display = existing ?? (result?.ok ? {
    license_key: result.license_key!,
    device_id: result.device_id!,
    issued_at: result.issued_at!,
    expires_at: result.expires_at!,
    short_code: result.short_code ?? '',
    revoked: false,
  } : null);

  return (
    <Card className={`p-6 h-full ${className ?? 'mb-6'}`}>
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Desktop ilova uchun litsenziya
        </h2>
      </div>

      {!isPremium && !existing && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-sm text-muted-foreground">
            Litsenziya kaliti faqat faol <b>PRO</b> obuna bo&apos;lganda yaratiladi.
          </span>
        </div>
      )}

      {display && (
        <div className="space-y-4 mb-4">
          <LicenseDisplay
            licenseKey={display.license_key}
            deviceId={display.device_id}
            issuedAt={display.issued_at}
            expiresAt={display.expires_at}
            remainingDaysCount={result?.remaining_days}
            statusLabel={
              showRefresh
                ? 'Kalit yangilanishi kerak'
                : result?.refreshed
                  ? 'Kalit yangilandi'
                  : 'Faol litsenziya'
            }
            statusHint={
              showRefresh
                ? 'Obuna yangilangan yoki kalit muddati tugagan. Yangi kalitni olish uchun quyidagi tugmani bosing.'
                : 'Bitta akkaunt — bitta qurilma. Kalit muddatini obuna bilan bir xil saqlaymiz.'
            }
            onCopy={copy}
          />

          {showRefresh && (
            <Button
              onClick={handleRefreshLicense}
              disabled={refreshing || submitting}
              className="w-full gap-2"
              variant="default"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Kalitni yangilash
            </Button>
          )}
        </div>
      )}

      {!existing && (
        <>
          <div className="space-y-2 mb-3">
            <Label htmlFor="deviceId" className="text-sm">
              Qurilma ID (offline ilovadan nusxalang)
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="deviceId"
                placeholder="0000 0000 0007 1365"
                value={deviceId}
                onChange={(e) => setDeviceId(formatDeviceIdInput(e.target.value))}
                disabled={submitting || refreshing}
                className="font-mono text-sm"
                autoComplete="off"
                inputMode="numeric"
                maxLength={19}
              />
              <Button
                onClick={handleGetLicense}
                disabled={submitting || refreshing || !isPremium}
                className="gap-2 shrink-0"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                Litsenziya olish
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Diqqat: bitta akkaunt uchun faqat bitta qurilma. To&apos;g&apos;ri Qurilma ID ni kiriting.
            </p>
          </div>

          {error && (
            <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}
        </>
      )}

      {existing && error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}
    </Card>
  );
}
