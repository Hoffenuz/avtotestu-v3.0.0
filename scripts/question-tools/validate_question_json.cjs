#!/usr/bin/env node
/** Validate JSON parse + basic question structure for test corpora. */
const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot, isQuestionJsonFile } = require('./paths.cjs');

const targets = [
  '600.json',
  'barcha.json',
  'data/variants',
  'mavzuli2',
];

function collectJsonFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) collectJsonFiles(full, list);
    else if (isQuestionJsonFile(name)) list.push(full);
  }
  return list;
}

const files = [];
for (const t of targets) {
  const full = path.join(publicRoot, t);
  if (!fs.existsSync(full)) continue;
  if (fs.statSync(full).isFile()) files.push(full);
  else collectJsonFiles(full, files);
}

let errors = 0;
let questions = 0;

for (const file of files.sort()) {
  const rel = path.relative(publicRoot, file).replace(/\\/g, '/');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`PARSE FAIL ${rel}: ${e.message}`);
    errors += 1;
    continue;
  }

  if (!Array.isArray(data)) {
    console.error(`STRUCTURE ${rel}: root is not an array`);
    errors += 1;
    continue;
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    questions += 1;
    if (!item?.content) {
      console.error(`STRUCTURE ${rel}[${i}]: missing content`);
      errors += 1;
      continue;
    }
    for (const lang of ['uz_lat', 'uz_cyr', 'ru']) {
      const block = item.content[lang];
      if (!block) continue;
      if (typeof block.text !== 'string' || !Array.isArray(block.options)) {
        console.error(`STRUCTURE ${rel}[${i}].${lang}: invalid text/options`);
        errors += 1;
      } else if (block.options.length === 0) {
        console.error(`STRUCTURE ${rel}[${i}].${lang}: empty options`);
        errors += 1;
      }
    }
  }
}

console.log(`Validated ${files.length} files, ${questions} question blocks.`);
if (errors) {
  console.error(`${errors} error(s).`);
  process.exit(1);
}
console.log('All files parse and pass structure checks.');
process.exit(0);
