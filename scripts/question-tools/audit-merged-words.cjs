#!/usr/bin/env node
/**
 * Detect known merged-word (stuck together) patterns in question JSON.
 */
const fs = require('fs');
const path = require('path');
const { publicRoot } = require('./paths.cjs');

const PATTERNS = [
  { id: 'қандайжой', re: /қандайжой/gi },
  { id: 'учунчизилади', re: /учунчизилади/gi },
  { id: 'хизматкўрсатиш', re: /хизматкўрсатиш/gi },
  { id: 'таълиммуассас', re: /таълиммуассас/gi },
  { id: 'олишжой', re: /олишжой/gi },
  { id: 'қанчаданкам', re: /қанчаданкам/gi },
  { id: 'разметкабело', re: /разметкабело/gi },
  { id: 'дошкольнымиобразовательными', re: /дошкольнымиобразовательными/gi },
  { id: 'qanday,joy', re: /qanday,joy/gi },
  { id: 'uchunchiziladi', re: /uchunchiziladi/gi },
  { id: 'talimmuassasa', re: /talimmuassasa/gi },
  { id: 'olishjoy', re: /olishjoy/gi },
  { id: 'qanchadankam', re: /qanchadankam/gi },
  { id: 'коммерческого,культурного', re: /коммерческого,культурного/g },
];

function collectJsonFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      collectJsonFiles(full, list);
    } else if (name.endsWith('.json')) list.push(full);
  }
  return list;
}

function walk(node, hits, fileRel) {
  if (typeof node === 'string') {
    for (const p of PATTERNS) {
      if (p.re.test(node)) {
        p.re.lastIndex = 0;
        hits.push({
          file: fileRel,
          pattern: p.id,
          sample: node.slice(0, 140).replace(/\s+/g, ' '),
        });
      }
    }
    return;
  }
  if (Array.isArray(node)) node.forEach((item) => walk(item, hits, fileRel));
  else if (node && typeof node === 'object') Object.values(node).forEach((v) => walk(v, hits, fileRel));
}

const arg = process.argv[2];
const defaultTargets = [
  path.join(publicRoot, '600.json'),
  path.join(publicRoot, 'barcha.json'),
  path.join(publicRoot, 'mavzuli2'),
  path.join(publicRoot, 'data', 'variants'),
];

function resolveFiles() {
  if (arg === 'all') return collectJsonFiles(publicRoot).filter((f) => {
    try {
      JSON.parse(fs.readFileSync(f, 'utf8'));
      return true;
    } catch {
      return false;
    }
  });
  if (arg) {
    const p = path.join(publicRoot, arg.replace(/\\/g, '/'));
    return fs.existsSync(p) && fs.statSync(p).isDirectory() ? collectJsonFiles(p) : [p];
  }
  const files = [];
  for (const t of defaultTargets) {
    if (!fs.existsSync(t)) continue;
    if (fs.statSync(t).isFile()) files.push(t);
    else collectJsonFiles(t, files);
  }
  return files;
}

const files = resolveFiles();

const hits = [];
for (const file of files.sort()) {
  if (!fs.existsSync(file)) continue;
  const rel = path.relative(publicRoot, file).replace(/\\/g, '/');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('Parse error', rel, e.message);
    process.exit(1);
  }
  walk(data, hits, rel);
}

const byPattern = {};
for (const h of hits) {
  byPattern[h.pattern] = (byPattern[h.pattern] || 0) + 1;
}

console.log(`Scanned ${files.length} file(s), ${hits.length} hit(s)\n`);
for (const [p, n] of Object.entries(byPattern).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${p}: ${n}`);
}
for (const h of hits.slice(0, 25)) {
  console.log(`\n[${h.pattern}] ${h.file}`);
  console.log(`  ${h.sample}`);
}
if (hits.length > 25) console.log(`\n... and ${hits.length - 25} more`);

if (hits.length > 0) process.exit(1);
