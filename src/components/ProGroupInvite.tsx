/**
 * ProGroupInvite — PRO obuna olgan foydalanuvchiga Telegram guruhi haqida
 * BIR MARTALIK taklif.
 *
 * Yopilgach qaytib chiqmaydi: belgi localStorage da har foydalanuvchi
 * uchun alohida saqlanadi. Modal emas — kartochka, chunki modal
 * foydalanuvchini majburlab to'xtatadi va bezovta qiladi.
 */
import { useEffect, useState } from 'react';
import { MessageCircle, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccessState } from '@/hooks/useAccessState';
import { TELEGRAM_GROUP_URL, proGroupInviteKey } from '@/lib/telegram';

export function ProGroupInvite() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isPremium } = useAccessState();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.id || !isPremium) {
      setShow(false);
      return;
    }
    try {
      setShow(localStorage.getItem(proGroupInviteKey(user.id)) !== '1');
    } catch {
      // localStorage yo'q (private rejim) — taklifni ko'rsatmaymiz,
      // aks holda u har safar qaytaverardi.
      setShow(false);
    }
  }, [user?.id, isPremium]);

  const dismiss = () => {
    setShow(false);
    try {
      if (user?.id) localStorage.setItem(proGroupInviteKey(user.id), '1');
    } catch { /* ignore */ }
  };

  if (!show) return null;

  return (
    <div className="relative rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent p-4 sm:p-5 mb-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('tgGroup.close')}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 sm:gap-4 pr-6">
        <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-foreground">
            {t('tgGroup.proTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {t('tgGroup.proDesc')}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <a
              href={TELEGRAM_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors"
            >
              {t('tgGroup.join')}
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {t('tgGroup.later')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProGroupInvite;
