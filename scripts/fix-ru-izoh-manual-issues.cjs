/**
 * Fix RU izoh corruptions found in manual review:
 *  - "Гражданский кодекс" / "ГК РФ" / "Генеральное соглашение" → ПДД
 *  - fill 3 empty ru izoh
 *  - fix t_2_q_17 duplicate RU options
 *  - clarify M3 lyuft izoh (M2/M3)
 *
 *   node scripts/fix-ru-izoh-manual-issues.cjs
 *   node scripts/fix-ru-izoh-manual-issues.cjs --apply
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DST = path.join(ROOT, "public", "data", "variants");
const APPLY = process.argv.includes("--apply");

function fixRuText(s) {
  if (!s) return s;
  return s
    .replace(/Гражданского кодекса/g, "ПДД")
    .replace(/Гражданскому кодексу/g, "ПДД")
    .replace(/Гражданский кодекс/g, "ПДД")
    .replace(/Гражданским кодексом/g, "ПДД")
    .replace(/ГК РФ/g, "ПДД")
    .replace(/Генеральному соглашению/g, "ПДД")
    .replace(/Генерального соглашения/g, "ПДД")
    .replace(/ПРИЛОЖЕНИЯ 1 к ПДД/g, "приложения 1 к ПДД");
}

const EMPTY_RU = {
  t_3_q_1:
    "Согласно знаку 4.4 «Движение легковых автомобилей» раздела 4 приложения 1 ПДД, разрешается движение легковых автомобилей, автобусов, мотоциклов и грузовых автомобилей с разрешённой максимальной массой менее 3,5 т. Знак дополнительной информации 7.3.3 «Направления действия» применяется с предписывающим знаком перед перекрёстком и указывает направления его действия. Поэтому движение разрешено во всех направлениях.",
  t_26_q_3:
    "Согласно п. 2.1 приложения 3 ПДД, суммарный люфт в рулевом управлении при регламентированных условиях испытаний не должен превышать: для категорий M2 и M3 — 20 градусов.",
  t_44_q_1:
    "Согласно п. 2.1 приложения 3 ПДД, суммарный люфт в рулевом управлении при регламентированных условиях испытаний не должен превышать: для категорий M2 и M3 — 20 градусов.",
};

const LYUFT_LAT =
  "Yo‘l harakati qoidalariga 3-ilova 2.1 bandiga asosan, boshqaruv qurilmasining lyuft yig‘indisi reglament (qat’iy belgilangan) sharoitlardagi sinovlarda quyidagi ko‘rsatkichdan katta bo‘lmasligi kerak: M2 va M3 toifalar uchun — 20 daraja.";

function main() {
  const stats = {
    files: 0,
    gkFixed: 0,
    emptyFilled: 0,
    lyuftFixed: 0,
    optFixed: 0,
    samples: [],
  };

  for (let i = 1; i <= 63; i++) {
    const file = `v${i}.json`;
    const p = path.join(DST, file);
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    let changed = false;

    for (const q of arr) {
      const id = q.task_info?.global_id;
      const before = q.izoh?.ru || "";
      const after = fixRuText(before);
      if (after !== before) {
        stats.gkFixed++;
        changed = true;
        if (APPLY) q.izoh.ru = after;
        if (stats.samples.length < 5) {
          stats.samples.push({ id, before: before.slice(0, 80), after: after.slice(0, 80) });
        }
      }

      if (EMPTY_RU[id] && !(q.izoh?.ru || "").trim()) {
        stats.emptyFilled++;
        changed = true;
        if (APPLY) q.izoh.ru = EMPTY_RU[id];
      }

      // lyuft izoh: question about M3 but text said only M2
      if (
        (id === "t_26_q_3" || id === "t_44_q_1") &&
        (q.izoh?.uz_lat || "").includes("M2 – 20")
      ) {
        stats.lyuftFixed++;
        changed = true;
        if (APPLY) {
          q.izoh.uz_lat = LYUFT_LAT;
          // keep cyr in sync via simple note - leave cyr if long; update if contains M2 only
          if ((q.izoh.uz_cyr || "").includes("М2")) {
            q.izoh.uz_cyr = q.izoh.uz_cyr
              .replace(/М2\s*[–-]\s*20/g, "М2 ва М3 — 20")
              .replace(/M2\s*[–-]\s*20/g, "M2 va M3 — 20");
          }
          if ((q.izoh.ru || "").includes("M2") && !(q.izoh.ru || "").includes("M3")) {
            q.izoh.ru = EMPTY_RU[id];
          }
        }
      }

      // t_2_q_17 RU options duplicated
      if (id === "t_2_q_17") {
        const opts = q.content?.ru?.options || [];
        if (opts.length === 3 && opts[0].text === opts[1].text) {
          stats.optFixed++;
          changed = true;
          if (APPLY) {
            opts[0].text = "Трамвай, красный, синий, зеленый автомобили";
            opts[1].text = "Трамвай, красный, зеленый, синий автомобили";
            opts[2].text = "Красный автомобиль, трамвай, зеленый, синий автомобиль";
            for (const o of opts) o.is_correct = o.id === 2;
          }
        }
      }
    }

    if (APPLY && changed) {
      fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n", "utf8");
      stats.files++;
    } else if (!APPLY && changed) {
      stats.files++;
    }
  }

  // sync barcha if apply
  if (APPLY) {
    for (const name of ["barcha.json", "barcha-ru.json"]) {
      const p = path.join(ROOT, "public", name);
      if (!fs.existsSync(p)) continue;
      const arr = JSON.parse(fs.readFileSync(p, "utf8"));
      let n = 0;
      const byId = new Map();
      for (let i = 1; i <= 63; i++) {
        for (const q of JSON.parse(fs.readFileSync(path.join(DST, `v${i}.json`), "utf8"))) {
          byId.set(q.task_info.global_id, q);
        }
      }
      for (const q of arr) {
        const src = byId.get(q.task_info?.global_id);
        if (!src) continue;
        if (name === "barcha.json") {
          if (JSON.stringify(q.izoh) !== JSON.stringify(src.izoh)) {
            q.izoh = { ...src.izoh };
            n++;
          }
          if (src.content?.ru?.options && q.content?.ru?.options) {
            q.content.ru.options = JSON.parse(JSON.stringify(src.content.ru.options));
          }
        } else {
          const ru = src.izoh?.ru || "";
          if ((q.izoh?.ru || "") !== ru) {
            q.izoh = { ru };
            n++;
          }
          if (src.content?.ru?.options && q.content?.ru?.options) {
            q.content.ru.options = JSON.parse(JSON.stringify(src.content.ru.options));
          }
        }
      }
      fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n", "utf8");
      stats["synced_" + name] = n;
    }
  }

  const report = { mode: APPLY ? "apply" : "dry-run", stats };
  fs.writeFileSync(path.join(__dirname, "_fix-ru-izoh-manual-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main();
