import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// payme_transactions jadvalida state 2 (Paid) ga o'zgarganda,
// Postgres trigger (pg_net) shu funksiyani chaqiradi va admin(lar)ga
// Telegram orqali darhol xabar yuboradi.

const PLAN_LABELS: Record<string, string> = {
  weekly: "Haftalik",
  monthly: "Oylik",
  quarterly: "3 oylik",
};

function formatSom(amountTiyin: number): string {
  const som = Math.round(amountTiyin / 100);
  return som.toLocaleString("ru-RU").replace(/,/g, " ");
}

function formatTashkentTime(epochMs: number | null): string {
  const date = epochMs ? new Date(epochMs) : new Date();
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    const record = payload.record ?? payload.new ?? payload;

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    // Bir nechta admin bo'lishi mumkin — vergul bilan ajratilgan chat_id ro'yxati
    const adminChatIdsRaw = Deno.env.get("ADMIN_CHAT_ID");

    if (!botToken || !adminChatIdsRaw) {
      console.error("TELEGRAM_BOT_TOKEN yoki ADMIN_CHAT_ID sozlanmagan");
      return new Response("Server misconfigured", { status: 500 });
    }

    const adminChatIds = adminChatIdsRaw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const plan = PLAN_LABELS[record.plan_name as string] ?? record.plan_name ?? "—";
    const amount = formatSom(Number(record.amount_tiyin ?? 0));
    const when = formatTashkentTime(
      record.perform_time ? Number(record.perform_time) : null,
    );

    const text =
      `✅ Yangi to'lov!\n` +
      `📧 ${record.account_email ?? "—"}\n` +
      `💳 Tarif: ${plan} (${amount} so'm)\n` +
      `🕐 Vaqt: ${when}`;

    let anyFailed = false;
    for (const chatId of adminChatIds) {
      const tgResp = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
        },
      );
      if (!tgResp.ok) {
        anyFailed = true;
        console.error(`Telegram xatoligi (chat_id=${chatId}):`, await tgResp.text());
      }
    }

    if (anyFailed) {
      return new Response("Some Telegram sends failed", { status: 502 });
    }
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("telegram-payment-notify xatolik:", err);
    return new Response("Internal error", { status: 500 });
  }
});
