/**
 * variantAccess — bepul foydalanuvchiga qaysi variantlar ochiq.
 *
 * NIMA UCHUN BU TEST BOR: qulf faqat saytda (server bepul variant raqamini
 * cheklamaydi). Noto'g'ri qator PRO variantlarni bepul ochib yuboradi yoki
 * bepul "1-variant" ning savollarini jimgina almashtiradi — ikkalasi ham
 * typecheck dan o'tadi.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FREE_VARIANTS_UI,
  getVariantDataId,
  isFreeVariantUi,
  isVariantLocked,
} from "./variantAccess";

const readJson = (rel: string) => JSON.parse(readFileSync(resolve(__dirname, "../../public", rel), "utf8"));

describe("variantAccess", () => {
  it("bepul: 1, 2, 3 ochiq, 4 va undan keyingilari qulf", () => {
    expect(FREE_VARIANTS_UI).toEqual([1, 2, 3]);
    for (const v of [1, 2, 3]) {
      expect(isVariantLocked(v, false)).toBe(false);
      expect(isFreeVariantUi(v, false)).toBe(true);
    }
    for (const v of [4, 10, 64]) expect(isVariantLocked(v, false)).toBe(true);
  });

  it("PRO: hammasi ochiq, hech biri 'bepul' deb belgilanmaydi", () => {
    for (const v of [1, 2, 3, 4, 64]) {
      expect(isVariantLocked(v, true)).toBe(false);
      expect(isFreeVariantUi(v, true)).toBe(false);
    }
  });

  it("fayl: bepul 1-variant — v59 (tarixiy), 2 va 3 — o'z fayli; PRO da hammasi o'z fayli", () => {
    expect(getVariantDataId(1, false)).toBe(59);
    expect(getVariantDataId(2, false)).toBe(2);
    expect(getVariantDataId(3, false)).toBe(3);
    expect(getVariantDataId(1, true)).toBe(1);
  });

  it("bepul 2- va 3-variant savollari to'liq bepul bazada (PRO savollar ochilmaydi)", () => {
    const free = new Set(
      (readJson("free-uz-lat.json") as { task_info: { global_id: string } }[]).map((q) => q.task_info.global_id),
    );
    for (const v of [2, 3]) {
      const ids = (readJson(`data/variants/v${getVariantDataId(v, false)}.json`) as { task_info: { global_id: string } }[])
        .map((q) => q.task_info.global_id);
      expect(ids).toHaveLength(20);
      expect(ids.filter((id) => !free.has(id))).toEqual([]);
    }
  });
});
