const fs = require("fs");
const path = require("path");

const updates = [
  ["uz-lat.json", "Izoh"],
  ["uz.json", "Изоҳ"],
  ["ru.json", "Пояснение"],
];

for (const [file, label] of updates) {
  const p = path.join(__dirname, "..", "src", "locales", file);
  let s = fs.readFileSync(p, "utf8");
  if (s.includes('"explanation"')) {
    console.log(file, "already has explanation");
    continue;
  }
  // Insert after errorLoadingData value pair start... better: before goBack
  if (s.includes('"goBack"')) {
    s = s.replace('"goBack":', `"explanation":"${label}","goBack":`);
  } else {
    s = s.replace(
      /("errorLoadingData"\s*:\s*"[^"]*")/,
      `$1,"explanation":"${label}"`
    );
  }
  fs.writeFileSync(p, s, "utf8");
  console.log(file, "->", label);
}
