#!/usr/bin/env node
/**
 * Audit Russian (content.ru) across question JSON corpora.
 * Usage: node scripts/audit_ru_all.cjs [--json]
 */
const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot } = require('./paths.cjs');

const jsonOut = process.argv.includes('--json');

const TARGETS = [
  '600.json',
  'barcha.json',
  'data/variants',
  'mavzuli2',
];

const CHECKS = [
  { id: 'semicolon_comma', re: /; /, desc: 'Semicolon used instead of comma' },
  { id: 'latin_o', re: /Толькo|толькo|cтоп|Cтоп/, desc: 'Latin o in Cyrillic words' },
  { id: 'merged_roundabout', re: /перекрестокимеют|средствамдвижущиеся/, desc: 'Merged words (roundabout)' },
  { id: 'стрелкам', re: /стрелкам разрешено|обозначенных стрелкам\b/, desc: 'Wrong case: стрелкам' },
  { id: 'технические_средства', re: /технические средства/, desc: 'Should be транспортные средства' },
  { id: 'bad_mt', re: /укусить|на голову|обойти и укусить/, desc: 'Bad machine translation' },
  { id: 'typo_ru', re: /увелечением|пользуеться|преимушеств|припятств|дорогуъ/, desc: 'Common Russian typos' },
  { id: 'grammar_transport', re: /Какие транспортного средства/, desc: 'Grammar: транспортного' },
  { id: 'остановится', re: /\bостановится\b(?!ь)/, desc: 'Infinitive: остановиться' },
  { id: 'направлени ', re: /направлени разрешено/, desc: 'Missing letter: направлении' },
  { id: 'оборудования', re: /оборудования огородительным/, desc: 'Awkward wording' },
  { id: 'что_без_о_том', re: /движения что[,;]/, desc: 'Missing «о том»' },
  { id: 'полосу_без_запятой', re: /полосу предназначенную/, desc: 'Missing comma before participle' },
  { id: 'населен', re: /населен(?!ё|и)/, desc: 'Should use ё in «населённый пункт»' },
  { id: 'перекрест', re: /перекрест(?!ё)/, desc: 'Should be перекрёст' },
];

function collectJsonFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      collectJsonFiles(full, list);
    } else if (name.endsWith('.json') && !name.includes('.bak') && !name.includes('.pending-fix')) {
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

function auditFile(filePath) {
  const rel = path.relative(publicRoot, filePath).replace(/\\/g, '/');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return { rel, error: e.message };
  }
  if (!Array.isArray(data)) return { rel, skipped: true };

  const hits = [];
  let ruBlocks = 0;

  for (const q of data) {
    const ru = q.content?.ru;
    if (!ru) continue;
    ruBlocks += 1;
    const id = q.task_info?.global_id || '?';
    const parts = [
      ['text', ru.text],
      ...(ru.options || []).map((o) => [`opt_${o.id}`, o.text]),
    ];
    for (const [key, text] of parts) {
      if (!text) continue;
      for (const check of CHECKS) {
        if (check.re.test(text)) {
          hits.push({
            id,
            key,
            pattern: check.id,
            sample: text.slice(0, 140).replace(/\s+/g, ' '),
          });
        }
      }
    }
  }

  const byPattern = {};
  for (const h of hits) {
    byPattern[h.pattern] = (byPattern[h.pattern] || 0) + 1;
  }

  return {
    rel,
    questions: data.length,
    ruBlocks,
    issueCount: hits.length,
    byPattern,
    hits: hits.slice(0, 30),
  };
}

const files = collectTargets();
const results = files.map(auditFile);
const withIssues = results.filter((r) => r.issueCount > 0 && !r.error);

const summary = {
  filesScanned: files.length,
  filesWithRuIssues: withIssues.length,
  totalIssues: withIssues.reduce((s, r) => s + r.issueCount, 0),
  byPattern: {},
  byFile: withIssues.map((r) => ({
    file: r.rel,
    issues: r.issueCount,
    patterns: r.byPattern,
  })),
};

for (const r of withIssues) {
  for (const [p, c] of Object.entries(r.byPattern || {})) {
    summary.byPattern[p] = (summary.byPattern[p] || 0) + c;
  }
}

if (jsonOut) {
  const outPath = path.join(__dirname, 'ru_all_audit.json');
  fs.writeFileSync(outPath, JSON.stringify({ summary, results }, null, 2));
}

if (jsonOut) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`Scanned ${summary.filesScanned} files`);
  console.log(`Files with Russian issues: ${summary.filesWithRuIssues}`);
  console.log(`Total issue hits: ${summary.totalIssues}`);
  console.log('\nBy pattern:');
  for (const [p, c] of Object.entries(summary.byPattern).sort((a, b) => b[1] - a[1])) {
    const desc = CHECKS.find((x) => x.id === p)?.desc || p;
    console.log(`  ${p}: ${c} — ${desc}`);
  }
  console.log('\nTop files:');
  for (const f of summary.byFile.sort((a, b) => b.issues - a.issues).slice(0, 15)) {
    console.log(`  ${f.file}: ${f.issues}`);
  }
  if (jsonOut) {
    console.log(`\nFull report: ${path.join(__dirname, 'ru_all_audit.json')}`);
  }
}
