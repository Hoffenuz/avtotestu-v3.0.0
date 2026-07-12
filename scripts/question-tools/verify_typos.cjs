#!/usr/bin/env node
/**
 * Scan question JSON files for known typo patterns left after fix scripts.
 */
const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot, isQuestionJsonFile } = require('./paths.cjs');


const PATTERNS = [
  { id: 'кэрак', re: /кэрак/gi },
  { id: 'бэлг', re: /бэлг/gi },
  { id: 'чизиг(?!иқ)', re: /чизиг(?!иқ)/gi },
  { id: 'бошга ', re: /бошга /g },
  { id: 'бў маган', re: /бў маган/g },
  { id: 'томониама', re: /томониама/g },
  { id: 'о тиш', re: /о тиш/gi },
  { id: 'Кайси ', re: /\bКайси /g },
  { id: 'кайси ', re: /\bкайси /g },
  { id: 'йул ', re: /\bйул /g },
  { id: 'харакакат', re: /харакакат/gi },
  { id: 'траснпорт', re: /траснпорт/gi },
  { id: 'фойнада', re: /фойнада/gi },
  { id: 'pyxcат', re: /pyxcат/gi },
  { id: 'pухсат', re: /pухсат/gi },
  { id: 'xаракат', re: /xаракат/gi },
  { id: 'ўpнати', re: /ўpнати/g },
  { id: 'мэтр', re: /мэтр/gi },
  { id: 'шунингдэк', re: /шунингдэк/g },
  { id: 'ўшашлар', re: /ўшашлар/g },
  { id: 'қисмиари', re: /қисмиари/g },
  { id: 'fakat', re: /\bfakat\b/gi },
  { id: 'tuxtash', re: /\btuxtash/gi },
  { id: 'o tish', re: /o tish/gi },
  { id: "bo' magan", re: /bo' magan/g },
  { id: 'tomoniama', re: /tomoniama/gi },
  { id: 'trasnport', re: /trasnport/gi },
  { id: 'foynada', re: /foynada/gi },
  { id: 'xarakat', re: /\bxarakat/gi },
  { id: 'ogox', re: /ogox/gi },
  { id: 'mumkun', re: /mumkun/gi },
  { id: 'укусить', re: /укусить/g },
  { id: 'на голову', re: /на голову/g },
  { id: 'бўлca', re: /бўлca/g },
  { id: "bo'lca", re: /bo'lca/g },
  { id: 'тўгрри', re: /тўгрри/g },
  { id: 'йў л', re: /йў л/g },
  { id: 'Hаправлении', re: /Hаправлении/g },
  { id: 'қандайжой', re: /қандайжой/gi },
  { id: 'учунчизилади', re: /учунчизилади/gi },
  { id: 'хизматкўрсатиш', re: /хизматкўрсатиш/gi },
  { id: 'таълиммуассас', re: /таълиммуассас/gi },
  { id: 'олишжой', re: /олишжой/gi },
  { id: 'қанчаданкам', re: /қанчаданкам/gi },
  { id: 'разметкабело', re: /разметкабело/gi },
  { id: 'uchunchiziladi', re: /uchunchiziladi/gi },
  { id: 'qanchadankam', re: /qanchadankam/gi },
  { id: 'engil_avtomobil', re: /\b[Ee]ngil avtomobil/gi },
  { id: 'qaerda', re: /\b[Qq]aerda\b|\b[Qq]aerdan\b/g },
  { id: 'kanday', re: /\bkanday\b/gi },
  { id: 'ruhsat', re: /\bruhsat\b/gi },
  { id: 'qaraama', re: /qaraama-qarshi/gi },
  { id: 'etishimumkin', re: /etishimumkin/gi },
  { id: 'voisitalar', re: /voisitalar/gi },
  { id: 'taniklik', re: /\btaniklik\b|\bтаниклик\b/gi },
  { id: 'chizik', re: /\bchizik\b|\bчизик\b/gi },
  { id: 'chiziq_apostrophe', re: /chiziq'/gi },
  { id: 'sidirga_no_apostrophe', re: /\bsidirga chiziq\b|\bсидирга чизиқ\b/gi },
  { id: 'xaqida', re: /\bxaqida\b|\bхақида\b/gi },
  { id: 'xisoblan', re: /\bxisoblan\b|\bхисоблан\b/gi },
  { id: 'jixoz', re: /jixoz|\bжихоз\b/gi },
  { id: 'shlagbaun', re: /shlagbaun/gi },
  { id: 'to_xash', re: /To'xash|to'xash/g },
  { id: 'sarik_line', re: /sarik chiziq|sarik chiroq/gi },
  { id: 'doimim', re: /\bDoimim\b/g },
  { id: 'etarlicha', re: /\betarlicha\b|\bEtarlicha\b/g },
  { id: 'rusat', re: /\brusat\b/gi },
];

function collectJsonFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      collectJsonFiles(full, list);
    } else if (isQuestionJsonFile(name)) {
      list.push(full);
    }
  }
  return list;
}

function walkStrings(node, hits, fileRel) {
  if (typeof node === 'string') {
    for (const p of PATTERNS) {
      const m = node.match(p.re);
      if (m) {
        hits.push({
          file: fileRel,
          pattern: p.id,
          count: m.length,
          sample: node.slice(0, 120).replace(/\s+/g, ' '),
        });
      }
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => walkStrings(item, hits, fileRel));
    return;
  }
  if (node && typeof node === 'object') {
    Object.values(node).forEach((v) => walkStrings(v, hits, fileRel));
  }
}

const targets = [
  path.join(publicRoot, '600.json'),
  path.join(publicRoot, 'barcha.json'),
  path.join(publicRoot, 'mavzuli2'),
  path.join(publicRoot, 'data', 'variants'),
];

const files = [];
for (const t of targets) {
  if (!fs.existsSync(t)) continue;
  if (fs.statSync(t).isFile()) files.push(t);
  else collectJsonFiles(t, files);
}

const parseErrors = [];
const typoHits = [];

for (const file of files.sort()) {
  const rel = path.relative(publicRoot, file).replace(/\\/g, '/');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    parseErrors.push({ file: rel, error: e.message });
    continue;
  }
  walkStrings(data, typoHits, rel);
}

console.log(`Scanned ${files.length} JSON files under public/\n`);

if (parseErrors.length) {
  console.log('JSON PARSE ERRORS:');
  parseErrors.forEach((e) => console.log(`  ${e.file}: ${e.error}`));
  console.log('');
}

if (!typoHits.length) {
  console.log('OK: No known typo patterns found.');
  process.exit(parseErrors.length ? 1 : 0);
}

const byPattern = {};
for (const h of typoHits) {
  byPattern[h.pattern] = (byPattern[h.pattern] || 0) + h.count;
}

console.log(`FOUND ${typoHits.length} issue(s) in ${new Set(typoHits.map((h) => h.file)).size} file(s):\n`);
console.log('By pattern:', byPattern);
console.log('\nDetails (first 40):');
typoHits.slice(0, 40).forEach((h) => {
  console.log(`  [${h.pattern}] x${h.count} ${h.file}`);
  console.log(`    ${h.sample}...`);
});

process.exit(1);
