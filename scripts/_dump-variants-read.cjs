/**
 * Reading aid only — dumps Q + correct answers + izoh for manual review.
 * Also flags: LAT↔RU answer-meaning conflicts (known patterns), bad legal names.
 */
const fs = require("fs");
const vs = process.argv.slice(2).map(Number);

const badNeedles = [
  "ГК",
  "ГПК",
  "Конституция",
  "НПЦ",
  "Общих правил",
  "УК РФ",
  "Украин",
  "ВГК",
  "КПР",
  "роутер",
  "расчетов",
  "под арестом",
  "водяной пруд",
  "км/с",
  "главы 2 УК",
  "главы 5 УК",
  "главы 20 УК",
  "главы 24 УК",
  "статьи 145 главы 24 УК",
  "жилых помещениях",
];

function soft(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[''`ʻʼʹ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function flagTopic(q) {
  const text = soft(q.content.uz_lat.text);
  const ans = soft(q.content.uz_lat.options.find((o) => o.is_correct).text);
  const iz = soft(q.izoh?.uz_lat || "");
  const issues = [];
  if (
    (/staji|2 yil/.test(text) || /taniqlilik/.test(text)) &&
    /uzun o.?lcham|1200x200|20 metr/.test(iz)
  )
    issues.push("novice-vs-long");
  if (/temir yo/.test(text + ans) && /3\.32|xavfli yuk/.test(iz))
    issues.push("rail-vs-dangerous");
  if (/otda yurish|otda harakat/.test(text + ans) && /3\.18/.test(iz))
    issues.push("horse-vs-318");
  if (
    /o.?rganuvchi|rulda/.test(text) &&
    /124|turar joy/.test(iz) &&
    /tomonga|yo.?nalish/.test(text)
  )
    issues.push("learner-dir-vs-124");
  if (/nechta bob|bandidan iborat/.test(text) && /chiziq|2 guruh/.test(iz))
    issues.push("chapters-vs-marking");
  if (
    /xavfli yuk/.test(text) &&
    /81-band|tezlik cheklangan|taniqlik belgisida/.test(iz)
  )
    issues.push("dangerous-vs-speed-plate");
  if (
    /to.?xtash mumkin|bu joyda to.?xtash/.test(text) &&
    /3\.28|to.?xtab turish taqiqlangan/.test(iz) &&
    /taqiql/.test(ans)
  )
    issues.push("stop-park-328");
  if (
    /piyodalarga.*kesib|kesib o.?tishga ruxsat/.test(text) &&
    /taqiql/.test(ans) &&
    /ruxsat etiladi|chiqishlari ruxsat/.test(iz)
  )
    issues.push("ped-cross-forbid-vs-allow-izoh");
  // bus lane vs turn rule
  if (
    /yo.?nalishli.*tasma|5\.9|ajratilgan tasma/.test(text) &&
    /57-band|burilishni shunday|qarama.?qarshi yo.?nalishdagi harakat/.test(iz) &&
    !/132|5\.9|yo.?nalishli/.test(iz)
  )
    issues.push("buslane-vs-turn57");
  // towing cargo body: answer allows but izoh forbids
  if (
    /kuzovida odam|yukxonasida odam/.test(text) &&
    /ruxsat/.test(ans) &&
    /taqiqlanadi/.test(iz) &&
    /143/.test(iz)
  )
    issues.push("tow-body-allow-vs-forbid-izoh");
  // bicycle leave right edge vs only ban text
  if (
    /velosiped.*o.?ng chek|o.?ng chekkasidan chiqish/.test(text) &&
    /taqiqlanadi/.test(iz) &&
    /ruxsat etilgan hollarda/.test(ans)
  )
    issues.push("bike-leave-vs-ban-izoh");
  return issues;
}

function flagAnsMismatch(q) {
  const Lc = q.content.uz_lat.options.find((o) => o.is_correct).text;
  const Rc = q.content.ru.options.find((o) => o.is_correct).text;
  const issues = [];
  if (
    /Har ikkisi buzmadi|Hech kim|ikkisi ham buzmadi/i.test(Lc) &&
    /синий|красный|зелён|зелен|жёлт|желт/i.test(Rc)
  )
    issues.push("ans-LAT-neither-RU-color");
  if (
    /Har ikkisi buzdi|Ikkisi ham buz/i.test(Lc) &&
    /не наруш|оба не/i.test(Rc)
  )
    issues.push("ans-LAT-both-RU-neither");
  // engine brake vs sharp pedal (known false friend swap)
  if (/dvigatel bilan tormoz/i.test(Lc) && /резко нажав|педаль тормоза/i.test(Rc) && !/двигател/i.test(Rc))
    issues.push("ans-engine-vs-pedal");
  if (/maxsus qurilma|ushlab turuvchi/.test(soft(Lc)) && /^Разрешается\.?$/.test(Rc.trim()))
    issues.push("ru-ans-incomplete-childseat");
  return issues;
}

const outPath = process.env.DUMP_OUT || null;
const lines = [];
function out(s) {
  lines.push(s);
  console.log(s);
}

for (const v of vs) {
  const arr = JSON.parse(
    fs.readFileSync(`public/data/variants/v${v}.json`, "utf8")
  );
  out(`\n########## V${v} ##########`);
  for (const q of arr) {
    const id = q.task_info.global_id;
    const L = q.content.uz_lat;
    const R = q.content.ru;
    const Lc = L.options.find((o) => o.is_correct);
    const Rc = R.options.find((o) => o.is_correct);
    out(`==== ${id} m=${q.media_url || "-"}`);
    out(`Q: ${L.text}`);
    out(`A-L: ${Lc.text}`);
    out(`A-R: ${Rc.text}`);
    out(`IZ-L: ${(q.izoh?.uz_lat || "").slice(0, 320)}`);
    out(`IZ-R: ${(q.izoh?.ru || "").slice(0, 320)}`);
    const ru = q.izoh?.ru || "";
    const hits = badNeedles.filter((n) => ru.includes(n));
    const topics = flagTopic(q);
    const am = flagAnsMismatch(q);
    const flags = [];
    if (hits.length) flags.push("BAD-RU:" + hits.join("|"));
    if (topics.length) flags.push("TOPIC:" + topics.join("|"));
    if (am.length) flags.push("ANS:" + am.join("|"));
    if (flags.length) out("!! " + flags.join(" ; "));
    out("");
  }
}
if (outPath) fs.writeFileSync(outPath, lines.join("\n"), "utf8");
