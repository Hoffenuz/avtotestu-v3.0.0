import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QuestionImageBlock } from './QuestionImageBlock';
import imageSizes from '@/data/question-image-sizes.json';

/**
 * ASOSIY TALAB: har bir savol rasmida `width` va `height` BO'LISHI SHART.
 *
 * Ular bo'lmasa brauzer joy zahiralamaydi va rasm yuklanganda javob tugmalari
 * pastga suriladi — foydalanuvchi noto'g'ri javobga bosib yuborishi mumkin.
 */

const sizes = imageSizes as unknown as {
  numbered: Record<string, number[]>;
  other: Record<string, number[]>;
};

function renderImg(src: string, layout: 'mobile' | 'desktop' = 'mobile') {
  const { container } = render(
    <QuestionImageBlock src={src} onZoom={() => {}} layout={layout} />,
  );
  const img = container.querySelector('img');
  if (!img) throw new Error('img topilmadi');
  return img;
}

describe('QuestionImageBlock — o\'lcham zahiralash', () => {
  it("manifestdagi rasm uchun ANIQ o'lcham qo'yiladi", () => {
    const [w, h] = sizes.numbered['1'];
    const img = renderImg('/images/u1uz.webp');
    expect(img.getAttribute('width')).toBe(String(w));
    expect(img.getAttribute('height')).toBe(String(h));
  });

  it("eng tik rasm (u75) to'g'ri nisbat oladi", () => {
    const [w, h] = sizes.numbered['75'];
    const img = renderImg('/images/u75uz.webp');
    expect(img.getAttribute('width')).toBe(String(w));
    expect(img.getAttribute('height')).toBe(String(h));
    expect(w / h).toBeLessThan(1); // haqiqatan tik
  });

  it("eng keng rasm (u176) to'g'ri nisbat oladi", () => {
    const [w, h] = sizes.numbered['176'];
    const img = renderImg('/images/u176uz.webp');
    expect(img.getAttribute('width')).toBe(String(w));
    expect(img.getAttribute('height')).toBe(String(h));
    expect(w / h).toBeGreaterThan(3); // haqiqatan keng
  });

  it("raqamsiz nomli rasm ham manifestdan topiladi", () => {
    const name = Object.keys(sizes.other).find((k) => k.startsWith('u62-'));
    expect(name).toBeTruthy();
    const [w, h] = sizes.other[name!];
    const img = renderImg(`/images/${name}`);
    expect(img.getAttribute('width')).toBe(String(w));
    expect(img.getAttribute('height')).toBe(String(h));
  });

  it("MANIFESTDA YO'Q rasm ham o'lchamsiz qolmaydi (zaxira nisbat)", () => {
    const img = renderImg('/images/umuman-yangi-rasm.webp');
    const w = Number(img.getAttribute('width'));
    const h = Number(img.getAttribute('height'));
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
    // Median nisbatga yaqin bo'lsin
    expect(w / h).toBeGreaterThan(1.4);
    expect(w / h).toBeLessThan(1.9);
  });

  it("so'rov parametri bo'lsa ham fayl nomi to'g'ri ajratiladi", () => {
    const [w, h] = sizes.numbered['1'];
    const img = renderImg('/images/u1uz.webp?v=abc123');
    expect(img.getAttribute('width')).toBe(String(w));
    expect(img.getAttribute('height')).toBe(String(h));
  });

  it('kengaytmasiz eski yo\'l ham o\'lchamli chiqadi', () => {
    const img = renderImg('/images/eski-rasm');
    expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
  });
});

describe('QuestionImageBlock — maket', () => {
  it("desktopda mobildan KATTA max-h beriladi", () => {
    const mobile = renderImg('/images/u1uz.webp', 'mobile');
    const desktop = renderImg('/images/u1uz.webp', 'desktop');
    expect(mobile.className).toContain('max-h-52');
    expect(desktop.className).toContain('max-h-80');
    // Mobil ataylab o'zgarmagan: rasm javoblar ustida turadi
    expect(desktop.className).not.toContain('max-h-52');
  });

  it('object-contain saqlanadi (rasm cho\'zilmasin)', () => {
    const img = renderImg('/images/u75uz.webp');
    expect(img.className).toContain('object-contain');
  });

  it('lazy va async dekodlash saqlanadi', () => {
    const img = renderImg('/images/u1uz.webp');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
  });
});

describe('question-image-sizes.json manifesti', () => {
  it("bo'sh emas va barcha yozuvlar haqiqiy", () => {
    const all = [
      ...Object.entries(sizes.numbered),
      ...Object.entries(sizes.other),
    ];
    expect(all.length).toBeGreaterThan(700);

    for (const [key, value] of all) {
      expect(Array.isArray(value), `${key} massiv emas`).toBe(true);
      expect(value.length, `${key} uzunligi 2 emas`).toBe(2);
      expect(value[0], `${key} eni musbat emas`).toBeGreaterThan(0);
      expect(value[1], `${key} bo'yi musbat emas`).toBeGreaterThan(0);
    }
  });
});
