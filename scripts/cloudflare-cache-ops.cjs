/**
 * Cloudflare Cache ops — SPA HTML Bypass + purge.
 *
 * Dashboard (majburiy, API token bo'lmasa):
 *   1) Caching → Configuration → Purge Cache → Purge Everything
 *   2) Caching → Cache Rules → Create rule "Bypass SPA HTML"
 *      Expression: scripts/cloudflare-spa-bypass.expression.txt
 *      Then: Cache eligibility = Bypass cache
 *      Order: Rule 1 (auth) dan keyin; Eligible static (Rule 2) dan OLDIN
 *   3) Rule "botlar Eligible" — o'chirilgan holatda qolsin
 *   4) Rule 2 Eligible: faqat /_seo/, /assets/, /images/, *.json, sitemap, robots
 *
 * API (ixtiyoriy):
 *   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ZONE_ID=... node scripts/cloudflare-cache-ops.cjs purge
 */

const fs = require("fs");
const path = require("path");

const EXPR_FILE = path.join(__dirname, "cloudflare-spa-bypass.expression.txt");

const PURGE_URLS = [
  "https://www.avtotestu.uz/",
  "https://www.avtotestu.uz/mavzuli",
  "https://www.avtotestu.uz/test-ishlash",
  "https://www.avtotestu.uz/belgilar",
  "https://www.avtotestu.uz/variant",
  "https://www.avtotestu.uz/pro",
  "https://www.avtotestu.uz/darslik",
  "https://www.avtotestu.uz/qoshimcha",
  "https://www.avtotestu.uz/contact",
  "https://www.avtotestu.uz/desktop",
  "https://www.avtotestu.uz/auth",
  "https://www.avtotestu.uz/profile",
  "https://www.avtotestu.uz/savol/variant-59",
];

function printDashboard() {
  const expr = fs.readFileSync(EXPR_FILE, "utf-8").trim();
  console.log(`
=== Cloudflare Dashboard (avtotestu.uz) ===

1) Purge Everything
   Caching → Configuration → Purge Cache → Purge Everything

2) Cache Rule: "Bypass SPA HTML"
   If (Custom filter expression):
${expr}

   Then:
     Cache eligibility = Bypass cache
   Place: after "Bypass auth profil", before "Statik SEO JSON kesh"

3) Keep:
   - Bypass auth/profil
   - Eligible: /_seo/, /assets/, /images/, *.json, sitemap, robots
4) Do NOT re-enable "botlar Eligible for cache" on SPA URLs

5) Settings:
   Caching Level = Standard
   Browser Cache TTL = Respect Existing Headers
   Production host = Cloudflare Pages only (no duplicate Worker route)
`);
}

async function purgeViaApi() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) {
    console.error("CLOUDFLARE_API_TOKEN yoki CLOUDFLARE_ZONE_ID yo'q — dashboard purge qiling.");
    printDashboard();
    process.exitCode = 2;
    return;
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purge_everything: true }),
    },
  );
  const json = await res.json();
  if (!json.success) {
    console.error("Purge failed:", JSON.stringify(json.errors || json, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log("✅ Purge Everything OK");
  console.log("Priority URLs (reference):", PURGE_URLS.join("\n  "));
}

const cmd = process.argv[2] || "help";
if (cmd === "purge") {
  purgeViaApi();
} else {
  printDashboard();
}
