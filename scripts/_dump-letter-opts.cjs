const fs = require("fs");
const ids = [
  "t_4_q_1",
  "t_20_q_4",
  "t_26_q_15",
  "t_46_q_4",
  "t_52_q_3",
  "t_9_q_19",
  "t_44_q_20",
  "t_38_q_19",
  "t_16_q_6",
  "t_24_q_16",
  "t_13_q_12",
  "t_2_q_19",
  "t_11_q_16",
  "t_28_q_11",
  "t_57_q_10",
  "t_52_q_20",
];
function load(id) {
  const m = id.match(/^t_(\d+)/);
  return JSON.parse(
    fs.readFileSync(`public/data/variants/v${m[1]}.json`, "utf8")
  ).find((x) => x.task_info.global_id === id);
}
for (const id of ids) {
  const q = load(id);
  console.log("\n" + id, q.media_url);
  for (const L of ["uz_lat", "uz_cyr", "ru"]) {
    console.log(
      L,
      q.content[L].options.map((o) => (o.is_correct ? "*" : "") + o.text).join(" | ")
    );
  }
}
