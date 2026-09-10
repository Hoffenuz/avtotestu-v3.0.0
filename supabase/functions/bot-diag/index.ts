// Vaqtinchalik tashxis funksiyasi ISHLATILMAYDI.
//
// U 2026-09-05 da bir marta ishlatildi: bot jim turgan edi va sabab
// `ADMIN_BOT_TOKEN` siriga token o'rniga o'rin egallovchi matn
// yozilgani ekan. Sir "bor" edi, lekin Telegram 404 qaytarardi.
//
// Funksiya o'chirilmagan (MCP da o'chirish yo'q), lekin zararsizlantirilgan:
// hech qanday sirni ko'rsatmaydi. Supabase panelidan butunlay o'chirsangiz
// bo'ladi.
Deno.serve(() =>
  new Response("Gone", { status: 410 })
);
