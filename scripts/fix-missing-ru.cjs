const fs = require("fs");
const path = require("path");
const { translate } = require("google-translate-api-x");

const ROOT = path.join(__dirname, "..");
const norm = (s) =>
  (s || "")
    .replace(/[\u2018\u2019\u02BB\u02BC']/g, "'")
    .replace(/\s+/g, " ")
    .trim();

async function main() {
  const vPath = path.join(ROOT, "public/data/variants/v27.json");
  const v = JSON.parse(fs.readFileSync(vPath, "utf8"));
  const q = v.find((x) => x.task_info.global_id === "t_27_q_19");
  if (!q?.izoh?.uz_lat) throw new Error("not found");

  const index = JSON.parse(fs.readFileSync(path.join(__dirname, "ru-batches/index.json"), "utf8"));
  const nt = norm(q.izoh.uz_lat);
  let best = { s: 0, k: null };
  for (const [k, lat] of Object.entries(index)) {
    const a = norm(lat);
    if (a === nt) {
      best = { s: 1, k };
      break;
    }
  }

  let ru = null;
  if (best.s === 1) {
    for (const f of fs.readdirSync(path.join(__dirname, "ru-batches")).filter((x) => x.startsWith("out-"))) {
      const o = JSON.parse(fs.readFileSync(path.join(__dirname, "ru-batches", f), "utf8"));
      if (o[best.k]) {
        ru = o[best.k];
        break;
      }
    }
  }
  if (!ru) {
    const r = await translate(q.izoh.uz_lat, { from: "uz", to: "ru" });
    ru = (r.text || "").trim();
  }

  q.izoh.ru = ru;
  fs.writeFileSync(vPath, JSON.stringify(v, null, 4) + "\n");

  const barchaPath = path.join(ROOT, "public/barcha.json");
  const barcha = JSON.parse(fs.readFileSync(barchaPath, "utf8"));
  const bq = barcha.find((x) => x.task_info.global_id === "t_27_q_19");
  if (bq?.izoh) bq.izoh.ru = ru;
  fs.writeFileSync(barchaPath, JSON.stringify(barcha, null, 4) + "\n");

  for (const f of fs.readdirSync(path.join(ROOT, "public/mavzuli2")).filter((x) => x.endsWith(".json"))) {
    const p = path.join(ROOT, "public/mavzuli2", f);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(d)) continue;
    let ch = false;
    for (const x of d) {
      if (x.task_info?.global_id === "t_27_q_19" || norm(x.izoh?.uz_lat) === nt) {
        if (x.izoh) {
          x.izoh.ru = ru;
          ch = true;
        }
      }
    }
    if (ch) fs.writeFileSync(p, JSON.stringify(d, null, 4) + "\n");
  }

  const make = (langKey) =>
    barcha.map((item) => {
      const lang = item.content?.[langKey] || item.content?.uz_lat;
      return {
        task_info: item.task_info,
        media_url: item.media_url || "",
        content: {
          [langKey]: { text: lang?.text || "", options: lang?.options || [] },
        },
        izoh: { [langKey]: item.izoh?.[langKey] || item.izoh?.uz_lat || "" },
      };
    });
  fs.writeFileSync(path.join(ROOT, "public/barcha-uz-lat.json"), JSON.stringify(make("uz_lat"), null, 4) + "\n");
  fs.writeFileSync(path.join(ROOT, "public/barcha-uz-cyr.json"), JSON.stringify(make("uz_cyr"), null, 4) + "\n");
  fs.writeFileSync(path.join(ROOT, "public/barcha-ru.json"), JSON.stringify(make("ru"), null, 4) + "\n");

  console.log("fixed t_27_q_19");
  console.log(ru.slice(0, 140));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
