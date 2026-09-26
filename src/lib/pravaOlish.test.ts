/**
 * pravaOlish — /prava-olish mazmunining yaxlitligi.
 *
 * NIMA UCHUN: narxlar uch joyda yashaydi — sahifa, FAQ sxemasi va bot uchun
 * statik shablon (`scripts/seo-templates/prava-olish.html`). Narx o'zgarganda
 * bittasini yangilab, ikkinchisini unutish oson — shunda Google boshqa narxni,
 * foydalanuvchi boshqasini ko'radi. Bu test ularni bir-biriga bog'laydi.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ASOSIY_RAQAMLAR, JAMI_B, MUHIM, PRAVA_BOSQICHLAR, PRAVA_FAQ, PRAVA_MAZMUN_SANASI, XARAJATLAR,
} from "./pravaOlish";
import type { Localized } from "./eAvtomaktab";

const shablon = readFileSync(resolve(__dirname, "../../scripts/seo-templates/prava-olish.html"), "utf8");
/** HTML dagi matn (teglar va HTML-kodlashsiz) — shablon `&` ni kodlaydi. */
const shablonMatni = shablon.replace(/&amp;/g, "&").replace(/&quot;/g, '"');

const barchaMatnlar = (): Localized[] => [
  ...ASOSIY_RAQAMLAR.flatMap((r) => [r.qiymat, r.label]),
  ...XARAJATLAR.flatMap((x) => [x.nomi, x.narx, x.izoh]),
  JAMI_B, MUHIM.sarlavha, MUHIM.matn,
  ...PRAVA_BOSQICHLAR.flatMap((b) => [b.nomi, b.matn]),
  ...PRAVA_FAQ.flatMap((f) => [f.savol, f.javob]),
];

describe("pravaOlish mazmuni", () => {
  it("har bir matn uchala tilda bor", () => {
    for (const m of barchaMatnlar()) {
      expect(m.oz.trim().length).toBeGreaterThan(0);
      expect(m.uz.trim().length).toBeGreaterThan(0);
      expect(m.ru.trim().length).toBeGreaterThan(0);
    }
  });

  it("imtihon narxlari hamma joyda bir xil: 1,5 + 1,5, qayta 1,6 mln", () => {
    const narx = (nomi: string) => XARAJATLAR.find((x) => x.nomi.oz === nomi)?.narx.oz;
    expect(narx("Nazariy imtihon")).toBe("1,5 mln so'm");
    expect(narx("Amaliy imtihon")).toBe("1,5 mln so'm");
    expect(narx("Qayta topshirish")).toBe("1,6 mln so'm");
    // Jami = avtomaktab 5,5 + ikki imtihon 3
    expect(JAMI_B.oz).toContain("8,5 mln");
    expect(PRAVA_FAQ[0].javob.oz).toContain("8,5 mln");
  });

  it("bot shabloni sahifa bilan bir xil: har FAQ savol-javobi, narxlar va sana", () => {
    for (const f of PRAVA_FAQ) {
      expect(shablonMatni).toContain(f.savol.oz);
      expect(shablonMatni).toContain(f.javob.oz);
    }
    for (const x of XARAJATLAR) expect(shablonMatni).toContain(x.narx.oz);
    expect(shablonMatni).toContain(PRAVA_MAZMUN_SANASI);
  });

  it("shablondagi FAQ sxemasi (JSON-LD) to'g'ri va to'liq", () => {
    const bloklar = [...shablon.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
      JSON.parse(m[1]),
    );
    const faq = bloklar.find((b) => b["@type"] === "FAQPage");
    expect(faq).toBeTruthy();
    expect(faq.mainEntity).toHaveLength(PRAVA_FAQ.length);
    expect(faq.mainEntity[0].name).toBe(PRAVA_FAQ[0].savol.oz);
  });
});
