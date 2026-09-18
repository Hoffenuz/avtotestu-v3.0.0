/**
 * Qo'llanmadagi ekran surati yoki video.
 *
 * NEGA ALOHIDA KOMPONENT:
 *   Ekran suratlari keyinroq qo'shiladi. Oddiy `<img>` qo'yilsa, fayl hali
 *   yo'q paytda brauzer singan rasm belgisini chizadi — bu "sayt buzuq"
 *   degan taassurot beradi. Bu komponent fayl yuklanmasa O'ZINI butunlay
 *   olib tashlaydi: qadam matni bilan bemalol ishlayveradi.
 *
 * FAYL QO'SHISH:
 *   Rasmni `public/qollanma/` ga qo'ying (masalan `1-test-ishlash.webp`) va
 *   `qollanmaQadamlar.ts` da `media` ni ko'rsating. Boshqa hech narsa
 *   kerak emas.
 */
import { useState } from "react";

export interface GuideMediaSource {
  type: "image" | "video";
  /** `public/` ga nisbatan yo'l, masalan "/qollanma/1-test.webp". */
  src: string;
  /** Rasm uchun muqova (video uchun `poster`). */
  poster?: string;
}

interface GuideMediaProps {
  media: GuideMediaSource | undefined;
  /** Ekran o'quvchilar uchun tavsif — qadam sarlavhasidan olinadi. */
  alt: string;
}

export function GuideMedia({ media, alt }: GuideMediaProps) {
  const [broken, setBroken] = useState(false);

  if (!media || broken) return null;

  if (media.type === "video") {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-muted">
        <video
          src={media.src}
          poster={media.poster}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
          className="aspect-video w-full"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  return (
    <img
      src={media.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className="w-full rounded-xl border border-border bg-muted object-cover"
    />
  );
}
