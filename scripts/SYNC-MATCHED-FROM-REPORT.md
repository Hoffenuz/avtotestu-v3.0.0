# Sync / restore hisobot

## Joriy holat (variants bo‘limi)

**62 × 20 + 63 × 10 = 1250** — qayta tiklandi.

- `public/data/variants/v1.json` … `v62.json` — har biri **20** savol
- `v63.json` — **10** savol
- `v64+` yo‘q
- UI: `TOTAL_VARIANTS = 63`
- `barcha*`, `600.json`, `mavzuli2` — shu tartibga sinxron (mavzuli fail: 0)

Kontent saqlangan; `task_info.remapped_from` — izohlar/yangi tartibdagi ID (tarix).

Qayta tiklash: `node scripts/restore-variants-63x20.cjs`
