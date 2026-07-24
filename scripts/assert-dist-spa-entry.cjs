/** postbuild: yangi deploy haqiqatan lucide/eager fix bilan chiqqanini tekshiradi */
const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "dist", "index.html");
if (!fs.existsSync(htmlPath)) {
  console.error("FATAL: dist/index.html yo'q");
  process.exit(1);
}
const h = fs.readFileSync(htmlPath, "utf8");
const checks = [
  ["data-cfasync", h.includes("data-cfasync")],
  ["x-avtotestu-build", h.includes("x-avtotestu-build")],
  ["vendor-lucide", h.includes("vendor-lucide")],
  ["type=module script", /data-cfasync="false"\s+type="module"/.test(h)],
];
let ok = true;
for (const [name, pass] of checks) {
  console.log(pass ? "OK" : "FAIL", name);
  if (!pass) ok = false;
}
const idx = h.match(/assets\/(index-[^"']+\.js)/);
console.log("entry", idx ? idx[1] : "(none)");
if (!ok) process.exit(1);
