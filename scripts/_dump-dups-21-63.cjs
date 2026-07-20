const fs = require("fs");
const path = require("path");

function soft(s) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}
function hasDup(opts) {
  const t = (opts || []).map((o) => soft(o.text));
  return t.some((x, i) => x && t.indexOf(x) !== i);
}

const ids = [];
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    // dump questions that were in the fixed list OR still look MT-bad
    ids.push(q.task_info.global_id);
  }
}

const fixedList = [
  "t_21_q_3", "t_23_q_2", "t_23_q_10", "t_25_q_5", "t_25_q_20", "t_27_q_20",
  "t_29_q_13", "t_30_q_4", "t_30_q_6", "t_31_q_19", "t_32_q_8", "t_32_q_10",
  "t_32_q_20", "t_33_q_4", "t_35_q_1", "t_35_q_6", "t_35_q_20", "t_37_q_3",
  "t_37_q_9", "t_37_q_16", "t_38_q_11", "t_39_q_11", "t_39_q_14", "t_42_q_10",
  "t_42_q_20", "t_43_q_2", "t_43_q_11", "t_44_q_3", "t_46_q_5", "t_46_q_18",
  "t_47_q_2", "t_47_q_11", "t_47_q_18", "t_48_q_11", "t_48_q_14", "t_48_q_16",
  "t_48_q_19", "t_49_q_1", "t_49_q_19", "t_52_q_17", "t_53_q_4", "t_53_q_9",
  "t_53_q_14", "t_53_q_16", "t_53_q_19", "t_54_q_3", "t_54_q_15", "t_55_q_3",
  "t_55_q_10", "t_55_q_17", "t_57_q_15", "t_57_q_17", "t_57_q_19", "t_58_q_15",
  "t_58_q_20", "t_59_q_5", "t_59_q_10", "t_60_q_1",
];

const out = {};
for (const id of fixedList) {
  const m = id.match(/t_(\d+)_q_/);
  const arr = JSON.parse(fs.readFileSync(path.join("public/data/variants", `v${m[1]}.json`), "utf8"));
  const q = arr.find((x) => x.task_info.global_id === id);
  out[id] = {
    q_lat: q.content.uz_lat.text,
    q_ru: q.content.ru.text,
    opts: q.content.uz_lat.options.map((o, i) => ({
      id: o.id,
      lat: o.text,
      ru: q.content.ru.options[i]?.text,
      c: !!o.is_correct,
      c_ru: !!q.content.ru.options[i]?.is_correct,
    })),
    iz_lat: q.izoh.uz_lat,
    iz_ru: q.izoh.ru,
    stillDup: hasDup(q.content.ru.options),
  };
}
fs.writeFileSync("scripts/_dump-ru-dups-21-63.json", JSON.stringify(out, null, 2), "utf8");
console.log("dumped", Object.keys(out).length, "stillDup", Object.values(out).filter((x) => x.stillDup).length);
