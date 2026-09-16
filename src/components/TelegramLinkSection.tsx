/**
 * TelegramLinkSection — "Profil ma'lumotlari" kartasi ichidagi ixcham
 * Telegram bo'limi (PasswordSection bilan bir xil andozada).
 *
 * Ikki holat:
 *  1. Bog'lanmagan — yopiq qator, bosilganda tushuntirish va Telegram
 *     tugmasi ochiladi. Sahifa cho'zilmasin uchun yopiq turadi.
 *  2. Bog'langan — @username va yashil belgi, ochish shart emas.
 *
 * Bog'lash SERVERDA amalga oshiriladi (`telegram-login` Edge Function,
 * `mode: "link"`): imzo tekshirilmasdan hech qanday bog'lam yozilmaydi.
 * Bazada trigger ham bor — mijoz `telegram_id` ni o'zi yoza olmaydi.
 */
import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { TelegramLoginButton, TelegramLogo } from '@/components/TelegramLoginButton';
import { isTelegramLoginConfigured } from '@/lib/telegramLogin';

export function TelegramLinkSection() {
  const { profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  // Sozlanmagan bo'lsa butun bo'lim ko'rsatilmaydi — yarim ishlaydigan,
  // bosib bo'lmaydigan holat qolmasin.
  if (!isTelegramLoginConfigured()) return null;

  const linked = profile?.telegram_id != null;
  const handle = profile?.telegram_username;

  const handleSuccess = async (telegramUsername?: string | null) => {
    setError('');
    setOpen(false);
    await refreshProfile();
    toast.success(
      telegramUsername
        ? `Telegram bog'landi: @${telegramUsername}`
        : "Telegram hisobingiz bog'landi!",
    );
  };

  if (linked) {
    return (
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <TelegramLogo className="h-4 w-4 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">Telegram</span>
              {handle && (
                <span className="block truncate text-xs text-muted-foreground">@{handle}</span>
              )}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            Bog'langan
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <TelegramLogo className="h-4 w-4" />
          <span className="font-medium text-foreground">Telegramni bog'lash</span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
        )}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-[#2AABEE]/25 bg-[#2AABEE]/[0.06] p-3">
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Bog'lagandan keyin parolsiz, bir bosishda kira olasiz. Joriy
            kirish usulingiz o'z kuchida qoladi.
          </p>
          <TelegramLoginButton
            mode="link"
            onSuccess={handleSuccess}
            onError={(message) => setError(message)}
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default TelegramLinkSection;
