#!/usr/bin/env node
/**
 * Verify professional fix corpora: uz patterns + ru audit patterns.
 */
const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot, isQuestionJsonFile } = require('./paths.cjs');

const TARGETS = ['600.json', 'barcha.json', 'data/variants', 'mavzuli2'];

const UZ_PATTERNS = [
  { id: 'kiygiz', re: /kiygiziladi|кийгизилади/i },
  { id: 'baravar', re: /\bbaravar\b|\bбаравар\b/i },
  { id: 'sogiga', re: /sog'iga kiydir|соғига кийдири/i },
  { id: 'tushama', re: /tushamada|тушамада/i },
  { id: 'Jaroxatlangan', re: /Jaroxatlangan|Жарохатланган/i },
  { id: 'hotiraning', re: /\bhotiraning\b/i },
  { id: 'hotiraning_cyr_ha', re: /ҳотиранинг/ },
  { id: 'taminlaydi', re: /\btaminlaydi\b|таминлайди/i },
  { id: 'to_tib', re: /to'tib turish|тўтиб туриш/i },
  { id: 'chovgacha', re: /chovgacha|човгача/i },
  { id: 'sirpanchiq_wrong', re: /katta bo'lmagan sirpanchiq|катта бўлмаган сирпанчиқ/i },
  { id: 'sirpanishva', re: /sirpanishva|сирпанишва/i },
  { id: 'asfalt_dash', re: /asfalt –beton|асфалт –бетон/i },
  { id: 'dot_Yurgizgich', re: /\. Yurgizgich|\. Юргизгич/i },
  { id: 'chanqoq_naqs', re: /chanqoqlik naqas|чанқоқлик нақас/i },
  { id: 'Haydovchiniig', re: /Haydovchiniig|Ҳайдовчинииг/i },
  { id: 'ag_anab', re: /ag'anab|ағанаб/i },
  { id: 'qichadi', re: /oqib qichadi|оқиб қичади/i },
  { id: 'engil_avtomobil', re: /\b[Ee]ngil avtomobil/i },
  { id: 'qaerda', re: /\bqaerda\b|\bqaerdan\b/i },
  { id: 'qaerda_cyr', re: /\bқаерда\b|\bқаердан\b/ },
  { id: 'kanday', re: /\bkanday\b/i },
  { id: 'ruhsat', re: /\bruhsat\b/i },
  { id: 'qaraama', re: /qaraama-qarshi|қараама-қарши/ },
  { id: 'etishimumkin', re: /etishimumkin|етишимумкин/ },
  { id: 'voisitalar', re: /voisitalar/i },
  { id: 'eng_yukori', re: /eng yukori tezlik/i },
];

const RU_PATTERNS = [
  { id: 'ru_semicolon', re: /; / },
  { id: 'ru_merged', re: /перекрестокимеют|средствамдвижущиеся/ },
  { id: 'ru_strelkam', re: /стрелкам разрешено/ },
  { id: 'ru_uksit', re: /укусить/ },
  { id: 'ru_naselen', re: /населен(?!ё|и)/ },
];

function collectJsonFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) collectJsonFiles(full, list);
    else if (isQuestionJsonFile(name)) {
      list.push(full);
    }
  }
  return list;
}

function collectTargets() {
  const files = [];
  for (const t of TARGETS) {
    const full = path.join(publicRoot, t);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isFile()) files.push(full);
    else collectJsonFiles(full, files);
  }
  return files.sort();
}

function scanFile(filePath) {
  const rel = path.relative(publicRoot, filePath).replace(/\\/g, '/');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return { rel, parseError: e.message };
  }
  if (!Array.isArray(data)) return { rel, skipped: true };

  const hits = [];
  for (const q of data) {
    const id = q.task_info?.global_id || '?';
    for (const lang of ['uz_lat', 'uz_cyr', 'ru']) {
      const block = q.content?.[lang];
      if (!block) continue;
      const patterns = lang === 'ru' ? RU_PATTERNS : UZ_PATTERNS;
      const parts = [
        ['text', block.text],
        ...(block.options || []).map((o) => [`opt_${o.id}`, o.text]),
      ];
      for (const [key, text] of parts) {
        if (!text) continue;
        for (const p of patterns) {
          if (p.re.test(text)) {
            hits.push({
              rel,
              id,
              lang,
              key,
              pattern: p.id,
              sample: text.slice(0, 100).replace(/\s+/g, ' '),
            });
          }
        }
      }
    }
  }
  return { rel, hits };
}

const files = collectTargets();
const allHits = [];
for (const f of files) {
  const r = scanFile(f);
  if (r.hits?.length) allHits.push(...r.hits);
}

console.log(`Verified ${files.length} files in: ${TARGETS.join(', ')}\n`);

if (allHits.length === 0) {
  console.log('OK: No known uz/ru professional-fix patterns remain.');
  process.exit(0);
}

const byPattern = {};
const byFile = {};
for (const h of allHits) {
  byPattern[h.pattern] = (byPattern[h.pattern] || 0) + 1;
  byFile[h.rel] = (byFile[h.rel] || 0) + 1;
}

console.log(`FAIL: ${allHits.length} hit(s)\n`);
console.log('By pattern:', byPattern);
console.log('By file:', byFile);
console.log('\nSamples:');
for (const h of allHits.slice(0, 15)) {
  console.log(`  ${h.rel} ${h.id} ${h.lang} [${h.pattern}]: ${h.sample}`);
}
process.exit(1);
