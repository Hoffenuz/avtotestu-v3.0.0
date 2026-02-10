import { useState } from "react";
import { MessageCircle, Clock, ChevronDown, Shield } from "lucide-react";

const contactLinks = [
  {
    icon: MessageCircle,
    label: "Telegram",
    value: "@avtotestu_ad2",
    href: "https://t.me/avtotestu_ad2",
  },
  {
    icon: MessageCircle,
    label: "Bot",
    value: "@Avtotesturganchbot",
    href: "https://t.me/Avtotesturganchbot",
  },
  {
    icon: MessageCircle,
    label: "Bot",
    value: "@maktabavtobot",
    href: "https://t.me/avtotest5bot",
  },
];

export function QuickContactLinks() {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">
        Bizning Ma'lumotlar
      </h2>

      {/* Contact Links */}
      <div className="space-y-4">
        {contactLinks.map((item, index) => {
          const Icon = item.icon;
          return (
            <a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 group"
            >
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {item.label}
                </p>
                <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                  {item.value}
                </p>
              </div>
            </a>
          );
        })}

        {/* Working Hours */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Ish vaqti
            </p>
            <p className="font-semibold text-foreground text-sm">
              Dush - Shan: 09:00 - 18:00
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Terms */}
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowTerms(!showTerms)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <span className="text-sm font-medium text-foreground">
            Platforma bilan bog'lanish shartlari
          </span>
          <ChevronDown 
            className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
              showTerms ? "rotate-180" : ""
            }`} 
          />
        </button>
        
        <div 
          className={`overflow-hidden transition-all duration-300 ${
            showTerms ? "max-h-[300px]" : "max-h-0"
          }`}
        >
          <div className="px-5 pb-4 space-y-2 text-muted-foreground text-sm leading-relaxed border-t border-border/50 pt-3">
            <p>
              Yuborilgan barcha ma'lumotlar maxfiy tarzda ko'rib chiqiladi.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Xabarlar platforma ma'muriyatiga yetib boradi</li>
              <li>Ma'lumotlaringiz uchinchi shaxslarga oshkor qilinmaydi</li>
              <li>So'rovingiz imkon qadar tezroq ko'rib chiqiladi</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
