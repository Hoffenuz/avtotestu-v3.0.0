/**
 * Audit: every question in barcha* + mavzuli2 must have izoh matching variants.
 *   node scripts/audit-izoh-vs-variants.cjs
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Reuse matcher by requiring sync script's dry-run is already 0;
 // this audit does independent by-id for barcha and media/text for mavzuli via running sync report.
const report = path.join(__dirname, "_sync-dryrun-report.json");
spawnSync(process.execPath, [path.join(__dirname, "sync-izoh-to-all-tests.cjs")], {
  cwd: path.join(__dirname, ".."),
  stdio: "ignore",
});
const j = JSON.parse(fs.readFileSync(report, "utf8"));
const dirty = j.files.filter((f) => (f.updated || 0) > 0 || (f.unmatched || 0) > 0);
const ok = dirty.length === 0 && j.totals.unmatched === 0 && j.totals.updated === 0;

// Extra: spot-check the 19 previously corrected IDs in barcha
const IDS = [
  "t_2_q_17",
  "t_10_q_19",
  "t_1_q_1",
  "t_54_q_13",
  "t_48_q_20",
  "t_56_q_7",
  "t_15_q_17",
  "t_51_q_18",
  "t_23_q_17",
  "t_1_q_2",
  "t_17_q_9",
  "t_25_q_18",
  "t_46_q_6",
  "t_14_q_7",
  "t_51_q_7",
  "t_24_q_3",
  "t_14_q_6",
  "t_19_q_15",
  "t_43_q_19",
];
const barcha = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "public", "barcha.json"), "utf8"));
const byId = new Map(barcha.map((q) => [q.task_info.global_id, q]));
const variants = new Map();
for (let i = 1; i <= 63; i++) {
  for (const q of JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "public", "data", "variants", `v${i}.json`), "utf8")
  )) {
    variants.set(q.task_info.global_id, q);
  }
}
const mismatches19 = [];
for (const id of IDS) {
  const b = byId.get(id);
  const v = variants.get(id);
  if (!b || !v) {
    mismatches19.push({ id, err: "missing" });
    continue;
  }
  if ((b.izoh?.uz_lat || "").trim() !== (v.izoh?.uz_lat || "").trim()) {
    mismatches19.push({ id, err: "izoh-diff" });
  }
}

console.log(
  JSON.stringify(
    {
      ok,
      totals: j.totals,
      dirtyFiles: dirty.map((f) => f.label),
      check19: { ok: mismatches19.length === 0, mismatches19 },
      note600: "600.json has no izoh (free Test ishlash)",
    },
    null,
    2
  )
);
process.exit(ok && mismatches19.length === 0 ? 0 : 1);
