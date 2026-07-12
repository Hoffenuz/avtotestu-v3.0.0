# Supabase — avtotestu.uz (Vite + React)

Bu loyiha **Vite SPA**, Next.js emas. Supabase dashboarddagi Next.js ko'rsatmasidagi `middleware.ts`, `utils/supabase/server.ts` va `NEXT_PUBLIC_*` **ishlatilmaydi**.

## O'zgaruvchilar

| Fayl | Commit |
|------|--------|
| `.env.local` | Yo'q (`.gitignore`) — haqiqiy kalitlar |
| `.env.example` | Ha — shablon |

```env
VITE_SUPABASE_URL=https://lvdndseuobzbgzrarygu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # yoki eski anon JWT
VITE_SUPABASE_PROJECT_ID=lvdndseuobzbgzrarygu
```

Ishga tushirish: `npm run dev` (Vite `.env.local` ni avtomatik o'qiydi).

## Paketlar

- `@supabase/supabase-js` — brauzer client (`src/integrations/supabase/client.ts`)
- `@supabase/ssr` — kelajakda Next.js/SSR ga o'tilsa kerak; hozir SPA da ishlatilmaydi

## Auth redirect (Supabase Dashboard)

**Authentication → URL configuration:**

- Site URL: `https://www.avtotestu.uz`
- Redirect URLs: `https://www.avtotestu.uz/auth/callback`, `http://localhost:5173/auth/callback`

## CLI (migratsiyalar)

```bash
npx supabase login
npx supabase link --project-ref lvdndseuobzbgzrarygu
npx supabase db push   # productionga migratsiya — ehtiyotkorlik bilan
```

## Production (Cloudflare Pages / Vite)

Hosting panelida **Environment variables** ga `VITE_SUPABASE_URL` va `VITE_SUPABASE_PUBLISHABLE_KEY` qo'shing (build vaqtida inject qilinadi).

---

## MCP server (Cursor — AI orqali loyiha)

Loyihada `.cursor/mcp.json` sozlangan:

- **URL:** `https://mcp.supabase.com/mcp?project_ref=lvdndseuobzbgzrarygu`
- Faqat **shu** Supabase loyihasi (avtotestu.uz)

### Ulanish qadamlari

1. **Cursor** → **Settings** → **Tools & MCP**
2. `supabase` serverini yoqing (yoki **Reload**)
3. Brauzerda Supabase ga **login** qiling va MCP ga ruxsat bering (OAuth)
4. Cursor ni qayta ishga tushiring
5. Tekshirish: chatda «MCP orqali jadval ro'yxatini ko'rsat» deb yozing

### Xavfsizlik (tavsiya)

Faqat o'qish rejimi uchun URL ga qo'shing:

`https://mcp.supabase.com/mcp?project_ref=lvdndseuobzbgzrarygu&read_only=true`

Production ma'lumotlar bilan ehtiyotkorlik bilan ishlating — MCP development uchun mo'ljallangan.

### CI / token (brauzersiz)

[Access tokens](https://supabase.com/dashboard/account/tokens) dan PAT oling va (agar client qo'llab-quvvatlasa) header qo'shing — batafsil: [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp).

### Global MCP

Agar barcha loyihalarda kerak bo'lsa, xuddi shu blokni `C:\Users\<user>\.cursor\mcp.json` ichidagi `mcpServers` ga qo'shing (`dart` yoniga).
