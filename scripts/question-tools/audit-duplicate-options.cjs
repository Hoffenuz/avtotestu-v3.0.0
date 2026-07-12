#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { publicRoot } = require('./paths.cjs');

function norm(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[«»"'‘’]/g, '')
    .replace(/\s+/g, ' ');
}

function scanFile(fp) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const issues = [];
  for (const q of data) {
    const gid = q.task_info?.global_id || '?';
    for (const loc of ['uz_lat', 'uz_cyr', 'ru']) {
      const opts = q.content?.[loc]?.options || [];
      for (let i = 0; i < opts.length; i++) {
        for (let j = i + 1; j < opts.length; j++) {
          if (opts[i].text.trim() === opts[j].text.trim()) {
            issues.push({
              type: 'exact',
              file: fp,
              gid,
              loc,
              text: opts[i].text,
              ids: [opts[i].id, opts[j].id],
            });
          } else if (norm(opts[i].text) === norm(opts[j].text)) {
            issues.push({
              type: 'normalized',
              file: fp,
              gid,
              loc,
              a: opts[i].text,
              b: opts[j].text,
              ids: [opts[i].id, opts[j].id],
            });
          }
        }
      }
    }
    const qt = q.content?.uz_lat?.text;
    if (qt) {
      issues._qtext = issues._qtext || [];
    }
  }
  return issues;
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.json')) acc.push(p);
  }
  return acc;
}

const files = [
  ...walk(path.join(publicRoot, 'mavzuli2')),
  ...walk(path.join(publicRoot, 'data', 'variants')),
  path.join(publicRoot, '600.json'),
  path.join(publicRoot, 'barcha.json'),
];

const all = [];
for (const fp of files) all.push(...scanFile(fp));

console.log(`Duplicate options found: ${all.length}`);
for (const x of all) {
  console.log(JSON.stringify(x));
}
if (all.length > 0) process.exit(1);

// duplicate question texts per mavzuli file
const f3 = path.join(publicRoot, 'mavzuli2', '3.json');
const data = JSON.parse(fs.readFileSync(f3, 'utf8'));
const byText = new Map();
for (const q of data) {
  const t = q.content?.uz_lat?.text;
  if (!t) continue;
  if (!byText.has(t)) byText.set(t, []);
  byText.get(t).push(q.task_info?.global_id);
}
console.log('\nDuplicate question texts in 3.json:');
for (const [t, gids] of byText) {
  if (gids.length > 1) console.log(gids.join(', '), '::', t.slice(0, 80));
}
