/**
 * Scan variants for A/B/C vs V / Cyrillic letter mismatches in uz_lat options.
 */
const fs = require("fs");
const path = require("path");

const dir = path.join("public", "data", "variants");
const issues = [];

for (let i = 1; i <= 63; i++) {
  const f = path.join(dir, `v${i}.json`);
  if (!fs.existsSync(f)) continue;
  const arr = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const q of arr) {
    const id = q.task_info?.global_id;
    const media = q.media_url || null;
    const L = q.content?.uz_lat;
    if (!L) continue;
    const opts = L.options || [];
    const texts = opts.map((o) => o.text);
    const joined = texts.join(" | ");
    const flags = [];

    // Latin V as vehicle/sign letter (not category B)
    if (
      /\bV\b|va V|Faqat V|«V»|"V"/.test(joined) &&
      (/\bA\b|va A|Faqat A|«A»/.test(joined) || /B va V|V va/.test(joined))
    ) {
      flags.push("LAT_V: V harfi (rasmda odatda B)");
    }
    if (/B va V|V va B/.test(joined)) flags.push("LAT_V: B va V birga");

    // Cyrillic А/Б/В/Г inside uz_lat options
    const cyrHits = texts.filter((t) => /[АБВГД]/.test(t) && /«[АБВГД]»/.test(t));
    if (cyrHits.length) {
      flags.push("CYR_IN_LAT: " + cyrHits.slice(0, 4).join("; "));
    }

    // Mix Latin B with Cyrillic letters
    const hasLatB = /\bB\b|«B»|"B"|va B|Faqat B/.test(joined);
    const hasCyrLetter = /«[АБВГ]»/.test(joined);
    if (hasLatB && hasCyrLetter) {
      flags.push("MIX: Latin B + kirill «А/Б/В»");
    }

    if (!flags.length) continue;

    const correct = opts.find((o) => o.is_correct);
    issues.push({
      id,
      media,
      q: (L.text || "").slice(0, 100),
      opts: texts,
      ans: correct?.text || "",
      flags,
    });
  }
}

function printGroup(title, pred) {
  const list = issues.filter(pred);
  console.log("\n### " + title + " (" + list.length + ")");
  for (const x of list) {
    console.log("- " + x.id + " | media: " + (x.media || "—"));
    console.log("  Q: " + x.q);
    console.log("  OPT: " + x.opts.join(" || "));
    console.log("  ANS: " + x.ans);
    console.log("  FLAGS: " + x.flags.join("; "));
  }
}

console.log("TOTAL flagged:", issues.length);
printGroup(
  "1) Latin V (rasm A/B/C bilan chalkash)",
  (x) => x.flags.some((f) => f.startsWith("LAT_V"))
);
printGroup(
  "2) Aralash Latin B + kirill",
  (x) => x.flags.some((f) => f.startsWith("MIX"))
);
printGroup(
  "3) uz_lat ichida kirill «А/Б/В/Г» (media bilan)",
  (x) => x.flags.some((f) => f.startsWith("CYR_IN_LAT")) && x.media
);
printGroup(
  "4) uz_lat ichida kirill (media yo‘q)",
  (x) => x.flags.some((f) => f.startsWith("CYR_IN_LAT")) && !x.media
);

fs.writeFileSync(
  path.join("scripts", "_letter-mismatch-report.json"),
  JSON.stringify(issues, null, 2)
);
console.log("\nWrote scripts/_letter-mismatch-report.json");
