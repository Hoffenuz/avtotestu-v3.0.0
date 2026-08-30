/**
 * TelegramGroupCard — rasmiy Telegram guruhiga taklif.
 *
 * Guruh hamma uchun ochiq: foydalanuvchilar tushunmagan savollari yoki
 * testdagi muammolari bo'yicha shu yerda so'rashadi.
 */
import { MessageCircle, Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TELEGRAM_GROUP_URL } from '@/lib/telegram';

interface Props {
  className?: string;
}

export function TelegramGroupCard({ className }: Props) {
  const { t } = useLanguage();

  return (
    <a
      href={TELEGRAM_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent p-5 sm:p-6 transition-all hover:border-sky-500/60 hover:shadow-md ${className ?? ''}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            {t('tgGroup.title')}
            <Users className="w-4 h-4 text-sky-600" />
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {t('tgGroup.desc')}
          </p>

          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 group-hover:gap-2.5 transition-all">
            {t('tgGroup.join')}
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </a>
  );
}

export default TelegramGroupCard;
