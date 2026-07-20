const fs = require("fs");
const path = require("path");
const ids = [
  "t_2_q_19",
  "t_3_q_2",
  "t_3_q_5",
  "t_3_q_8",
  "t_4_q_2",
  "t_4_q_6",
  "t_4_q_8",
  "t_5_q_13",
  "t_6_q_8",
  "t_7_q_6",
  "t_7_q_16",
  "t_8_q_2",
  "t_8_q_10",
  "t_9_q_18",
  "t_12_q_1",
  "t_12_q_10",
  "t_12_q_15",
  "t_14_q_7",
  "t_14_q_17",
  "t_18_q_1",
  "t_18_q_15",
  "t_20_q_9",
];
const out = {};
for (const id of ids) {
  const m = id.match(/t_(\d+)_q_/);
  const qs = JSON.parse(fs.readFileSync(path.join("public/data/variants", `v${m[1]}.json`), "utf8"));
  const q = qs.find((x) => x.task_info.global_id === id);
  out[id] = {
    opts_lat: q.content.uz_lat.options.map((o) => ({ id: o.id, t: o.text, c: !!o.is_correct })),
    opts_ru: q.content.ru.options.map((o) => ({ id: o.id, t: o.text, c: !!o.is_correct })),
    iz_lat: q.izoh.uz_lat,
    iz_ru: q.izoh.ru,
    q_ru: q.content.ru.text,
  };
}
fs.writeFileSync(path.join("scripts", "_v1-v20-for-polish.json"), JSON.stringify(out, null, 2), "utf8");
console.log("ok", Object.keys(out).length);
