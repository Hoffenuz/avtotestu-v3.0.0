const fs = require("fs");
const path = require("path");
const ids = ["t_18_q_2", "t_35_q_8", "t_36_q_17", "t_47_q_1", "t_51_q_9"];
for (const id of ids) {
  const m = id.match(/t_(\d+)_q_/);
  const arr = JSON.parse(fs.readFileSync(path.join("public/data/variants", `v${m[1]}.json`), "utf8"));
  const q = arr.find((x) => x.task_info.global_id === id);
  console.log("\n" + id);
  console.log("LAT:", (q.izoh.uz_lat || "").slice(0, 220));
  console.log("RU :", q.izoh.ru);
}
console.log("\n---ALL REMAIN---");
for (let i = 1; i <= 63; i++) {
  for (const q of JSON.parse(fs.readFileSync(path.join("public/data/variants", `v${i}.json`), "utf8"))) {
    const iz = q.izoh.ru || "";
    if (/МПК|Уголовн|Гражданск|гражданском процессе|ООН/i.test(iz)) {
      console.log(q.task_info.global_id, iz.slice(0, 140));
    }
  }
}
