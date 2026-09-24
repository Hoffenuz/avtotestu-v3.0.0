# AvtoSmart (avtotestu.uz)

O'zbekistonda haydovchilik guvohnomasi olish uchun YHQ (yo'l harakati
qoidalari) testlariga tayyorgarlik platformasi — <https://www.avtotestu.uz>

Uch tilda ishlaydi: o'zbekcha (lotin), o'zbekcha (kirill) va ruscha.

## Texnologiyalar

| Qatlam | Nima ishlatiladi |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 5, React Router, Tailwind CSS |
| UI | shadcn/ui (faqat haqiqatan ishlatiladigan komponentlar) |
| Backend | Supabase — Postgres, Auth, RLS, RPC, Edge Functions (Deno) |
| Hosting | Cloudflare Pages + Pages Functions (`functions/_middleware.ts`) |
| Testlar | Vitest + Testing Library |

## Ishga tushirish

```sh
npm install
npm run dev          # http://localhost:8080
```

Supabase kalitlari `.env` faylida kutiladi (repozitoriyga kirmaydi).

## Asosiy buyruqlar

```sh
npm run build        # prebuild ham ishlaydi: SEO va savol ma'lumotlari
npm run test:run     # butun test to'plami
npm run typecheck    # tsc -b --force
npm run lint         # eslint
```

## Savollar ma'lumoti

Savollar `public/` ichidagi JSON fayllarda saqlanadi (`barcha.json`,
`free-*.json`, `data/variants/v*.json`, `mavzuli2/*.json`). Ular
CDN da keshlanadi, shuning uchun kesh belgisi fayl MAZMUNIDAN
hisoblanadi — `vite.config.ts` dagi `questionDataVersion()` ga qarang.
JSON o'zgarsa belgi ham o'zgaradi, ya'ni tuzatilgan savol darhol
yetib boradi.

Bir savolning bir necha faylda takrorlanishi ATAYLAB: variantlar,
mavzuli testlar va bepul to'plam bir xil savolni ulashadi.

## SEO

Qidiruv botlari uchun statik suratkashlar `scripts/seo-templates/*.html`
dan `public/_seo/{marshrut}/index.html` ga yaratiladi
(`npm run seo:main`). Haqiqiy foydalanuvchiga har doim SPA beriladi;
botni `functions/_middleware.ts` ajratadi.

`_middleware.ts` dagi `SEO_EXACT` ro'yxati generator dagi `ROUTE_MAP`
bilan mos bo'lishi shart — mos kelmasa `generate-main-pages.cjs`
build ni to'xtatadi.

## Papkalar

```
src/            React ilova
scripts/        SEO, savol va ma'lumot generatorlari
functions/      Cloudflare Pages Functions
supabase/       Edge Functions (Telegram botlar va h.k.)
public/         Savol JSON lari, rasmlar, bot suratkashlari
docs/           Ichki hujjatlar
```

## To'lov tizimlari

PRO obuna Payme yoki Click orqali to'lanadi; PRO ni faqat server beradi.
Click qanday qurilgani, qanday ishlashi va o'zgartirishda nimaga ehtiyot
bo'lish kerakligi: [`docs/CLICK-INTEGRATION.md`](docs/CLICK-INTEGRATION.md).
