const fs = require("fs");
const KEEP = [
  "t_28_q_8",
  "t_14_q_9",
  "t_46_q_8",
  "t_57_q_5",
  "t_54_q_9",
  "t_28_q_14",
];
function load(id) {
  const m = id.match(/^t_(\d+)/);
  return JSON.parse(
    fs.readFileSync(`public/data/variants/v${m[1]}.json`, "utf8")
  ).find((x) => x.task_info.global_id === id);
}
for (const id of KEEP) {
  const q = load(id);
  console.log("\n" + id);
  for (const L of ["uz_lat", "uz_cyr", "ru"]) {
    console.log(
      L + ":",
      q.content[L].options.map((o) => (o.is_correct ? "*" : "") + o.text).join(" | ")
    );
  }
}
// spot-check one reverted
const r = load("t_2_q_19");
console.log("\nreverted sample t_2_q_19");
for (const L of ["uz_lat", "uz_cyr", "ru"]) {
  console.log(
    L + ":",
    r.content[L].options.map((o) => (o.is_correct ? "*" : "") + o.text).join(" | ")
  );
}
