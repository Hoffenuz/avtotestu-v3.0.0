const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "..", "src", "locales");

const map = {
  "uz-lat.json": "Mavzular",
  "uz.json": "Мавзулар",
  "ru.json": "Темы",
};

for (const [f, btn] of Object.entries(map)) {
  const p = path.join(DIR, f);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.home.btnMavzuli = btn;
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log(f, btn);
}
