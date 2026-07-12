#!/usr/bin/env node
/** Usage: node scripts/report_uz_fix.cjs 600.json [barcha.json] */
const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot } = require('./paths.cjs');

const target = (process.argv[2] || '600.json').replace(/\\/g, '/');
const cur = path.join(publicRoot, target);
const bak = `${cur}.uz-fix.bak`;
const useBackup = process.argv.includes('--backup');

if (!useBackup || !fs.existsSync(bak)) {
  if (useBackup) {
    console.log(`No backup at public/${target}.uz-fix.bak (use git diff for comparison).`);
    process.exit(1);
  }
  console.log(`Compare with git: git diff public/${target}`);
  process.exit(0);
}

const patterns = [
  ['kiygiziladi', 'kiydiriladi'],
  ['baravar', 'barobar'],
  ["sog'iga kiydiriladi", "sog' qo'lga kiydiriladi"],
  ['taminlaydi', "ta'minlaydi"],
  ['katta bo\'lmagan sirpanchiq', 'kichik sirpanchiq'],
  ['to\'tib turish', 'to\'xtab turish'],
  ['tushamada', 'taglikda'],
  ['chovgacha', 'songacha'],
  ['Haydovchiniig', 'Haydovchining'],
  ['hotiraning', 'xotiraning'],
  ['Jaroxatlangan', 'Jarohatlangan'],
  ['qichadi', 'chiqadi'],
  ['sirpanishva', 'sirpanish va'],
  ['asfalt –beton', 'asfalt-beton'],
  ['. Yurgizgich', 'Yurgizgich'],
  ['chanqoqlik naqas', 'chanqoqlik, nafas'],
  ['ag\'anab', "ag'darilib"],
  ['oxista ravon', 'ohista ravon'],
  ['terini ishlash', 'terini ishlov berish'],
  ['bazi voqealar', "ba'zi voqealar"],
];

const b = fs.readFileSync(bak, 'utf8');
const c = fs.readFileSync(cur, 'utf8');
console.log(`\n${target} — tuzatishlar (backup vs hozir):\n`);
let totalBefore = 0;
for (const [wrong, right] of patterns) {
  const esc = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bn = (b.match(new RegExp(esc, 'g')) || []).length;
  const cn = (c.match(new RegExp(esc, 'g')) || []).length;
  if (bn > 0) {
    totalBefore += bn;
    console.log(`  ${wrong}`);
    console.log(`    → ${right}`);
    console.log(`    soni: ${bn} → ${cn}\n`);
  }
}
console.log(`Jami noto'g'ri naqsh (oldin): ${totalBefore}`);

// Sample changed lines
const before = JSON.parse(b);
const after = JSON.parse(c);
let samples = 0;
for (let i = 0; i < before.length && samples < 12; i++) {
  const qb = before[i];
  const qa = after[i];
  const id = qb.task_info?.global_id;
  for (const lang of ['uz_lat', 'uz_cyr']) {
    const bb = qb.content?.[lang];
    const aa = qa.content?.[lang];
    if (!bb || !aa) continue;
    const parts = [
      ['savol', bb.text, aa.text],
      ...(bb.options || []).map((o) => {
        const o2 = aa.options?.find((x) => x.id === o.id);
        return [`javob ${o.id}`, o.text, o2?.text];
      }),
    ];
    for (const [label, t1, t2] of parts) {
      if (t1 && t2 && t1 !== t2 && samples < 12) {
        console.log(`--- ${id} (${lang}, ${label}) ---`);
        console.log(`OLDIN: ${t1.slice(0, 200)}${t1.length > 200 ? '…' : ''}`);
        console.log(`KEYIN: ${t2.slice(0, 200)}${t2.length > 200 ? '…' : ''}\n`);
        samples += 1;
      }
    }
  }
}
