# Quick Start — Performance Notes

## Fontlar

Loyiha **faqat system font** ishlatadi (`Segoe UI` birinchi navbatda, qolgan OS lar uchun `system-ui` / `-apple-system` / `BlinkMacSystemFont` / `Helvetica Neue` / `Arial` fallback).

- Google Fonts yo'q
- Self-hosted woff2 yo'q
- `@font-face` yo'q
- `<link rel="preload" as="font">` yo'q

Sabab: woff2 yuklash (1.5 s) LCP ni ushlab turardi. System font darhol render bo'ladi, mobilda ham xuddi shunday.

Yangi font qo'shish kerak bo'lsa:
1. `index.html` da `<link rel="preconnect">` qo'shing
2. `src/index.css` da `body` / `h1–h6` font-family ni yangilang
3. Inline `style={{ fontFamily: ... }}` ham yangilanadi

## Google Analytics

- `gtag/js` foydalanuvchi birinchi `click`/`scroll`/`touch`/`keydown` qilganda yoki `requestIdleCallback` (3 s) orqali yuklanadi
- Birinchi paint ni bloklamaydi

## Code splitting

- `vite.config.ts` da vendor chunklar: `vendor-react`, `vendor-supabase`, `vendor-query`, `vendor-radix`
- Route-based lazy loading `src/App.tsx` da

## Build & preview

```bash
npm run build
npm run preview
```

`http://localhost:4173` — productionga yaqin tezlik.
