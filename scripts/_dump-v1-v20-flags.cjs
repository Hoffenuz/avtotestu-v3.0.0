const fs = require("fs");
const report = JSON.parse(fs.readFileSync("scripts/_review-batch-v1-v20.json", "utf8"));
const DST = "public/data/variants";

function soft(s) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

const details = [];
for (const item of report.items) {
  const ticket = item.id.split("_")[1];
  const q = JSON.parse(fs.readFileSync(`${DST}/v${ticket}.json`, "utf8")).find(
    (x) => x.task_info.global_id === item.id
  );
  const d = {
    id: item.id,
    flags: item.flags,
    q: q.content.uz_lat.text,
    latAns: q.content.uz_lat.options.find((o) => o.is_correct)?.text,
    izLat: q.izoh.uz_lat,
    izRu: q.izoh.ru,
    langs: {},
  };
  for (const lang of ["uz_lat", "uz_cyr", "ru"]) {
    const opts = q.content[lang].options;
    const texts = opts.map((o) => soft(o.text));
    const dups = [];
    texts.forEach((t, i) => {
      if (t && texts.indexOf(t) !== i) dups.push({ i: i + 1, id: opts[i].id, text: opts[i].text });
    });
    d.langs[lang] = {
      correctId: opts.find((o) => o.is_correct)?.id,
      options: opts.map((o) => ({ id: o.id, c: !!o.is_correct, t: o.text })),
      dups,
    };
  }
  details.push(d);
}
fs.writeFileSync("scripts/_review-v1-v20-details.json", JSON.stringify(details, null, 2));
console.log("details", details.length);
for (const d of details) {
  console.log("\n====", d.id, d.flags.map((f) => f.type).join(","), "====");
  console.log("Q:", d.q.slice(0, 100));
  for (const lang of ["uz_lat", "ru"]) {
    if (d.langs[lang].dups.length) {
      console.log(lang, "DUPS:", d.langs[lang].dups);
      console.log(
        lang,
        "ALL:",
        d.langs[lang].options.map((o) => `${o.c ? "X" : " "} ${o.id}:${o.t.slice(0, 50)}`)
      );
    }
  }
  if (d.flags.some((f) => f.type === "short-izoh-ru")) {
    console.log("izRu len", (d.izRu || "").length, d.izRu);
    console.log("izLat", d.izLat.slice(0, 200));
  }
}
