#!/usr/bin/env node
/**
 * Fix merged/stuck-together words in question JSON (all locales).
 * Usage: node scripts/fix-merged-words.cjs [600.json|barcha.json|all]
 */
const fs = require('fs');
const path = require('path');
const { publicRoot } = require('./paths.cjs');

/** [wrong, correct] — order matters (longer phrases first) */
const REPLACEMENTS = [
  ['қандайжойларда', 'қандай жойларда'],
  ['учунчизилади', 'учун чизилади'],
  ['хизматкўрсатиш', 'хизмат кўрсатиш'],
  ['таълиммуассасалари', 'таълим муассасалари'],
  ['олишжойларида', 'олиш жойларида'],
  ['қанчаданкам', 'қанчадан кам'],
  ['разметкабело-красного', 'разметка бело-красного'],
  ['дошкольнымиобразовательными', 'дошкольными образовательными'],
  ['коммерческого,культурного', 'коммерческого, культурного'],
  ['qanday,joylarda', 'qanday joylarda'],
  ['uchunchiziladi', 'uchun chiziladi'],
  ['talimmuassasalari', "ta'lim muassasalari"],
  ['olishjoylarida', 'olish joylarida'],
  ['qanchadankam', 'qanchadan kam'],
];

function applyAll(text) {
  if (!text || typeof text !== 'string') return { text, changed: false };
  let v = text;
  let changed = false;
  for (const [from, to] of REPLACEMENTS) {
    if (v.includes(from)) {
      v = v.split(from).join(to);
      changed = true;
    }
  }
  return { text: v, changed };
}

function walk(node, stats) {
  if (typeof node === 'string') {
    const { text, changed } = applyAll(node);
    if (changed) stats.hits += 1;
    return text;
  }
  if (Array.isArray(node)) return node.map((item) => walk(item, stats));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = walk(v, stats);
    return out;
  }
  return node;
}

function collectJsonFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      collectJsonFiles(full, list);
    } else if (name.endsWith('.json') && !name.includes('.pending-fix')) {
      try {
        JSON.parse(fs.readFileSync(full, 'utf8'));
        list.push(full);
      } catch {
        /* skip non-JSON .json paths */
      }
    }
  }
  return list;
}

const arg = process.argv[2] || '600.json';
const files =
  arg === 'all'
    ? collectJsonFiles(publicRoot)
    : [path.join(publicRoot, arg.replace(/\\/g, '/'))];

let totalHits = 0;
for (const file of files) {
  if (!fs.existsSync(file)) {
    console.warn('Skip (missing):', file);
    continue;
  }
  const rel = path.relative(publicRoot, file).replace(/\\/g, '/');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const stats = { hits: 0 };
  const fixed = walk(data, stats);
  if (stats.hits > 0) {
    fs.writeFileSync(file, `${JSON.stringify(fixed, null, 4)}\n`, 'utf8');
    console.log(`${rel}: ${stats.hits} string(s) fixed`);
    totalHits += stats.hits;
  }
}
console.log(`Done. Total strings fixed: ${totalHits}`);
