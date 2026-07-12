#!/usr/bin/env node
/**
 * Apply typo fixes to all question JSON corpora:
 * - public/600.json
 * - public/barcha.json (if present)
 * - public/data/variants/
 * - public/mavzuli2/
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot } = require('./paths.cjs');

const root = projectRoot;
const script = path.join(__dirname, 'tmp_fix_600_typos.cjs');
const node = process.execPath;

const targets = [
  '600.json',
  'barcha.json',
  'data/variants',
  'mavzuli2',
];

let failed = 0;
let skipped = 0;

for (const target of targets) {
  const full = path.join(root, 'public', target);
  if (!fs.existsSync(full)) {
    console.log(`SKIP (not found): public/${target}`);
    skipped += 1;
    continue;
  }

  console.log(`\n=== Applying: public/${target} ===\n`);
  const result = spawnSync(node, [script, 'apply', target], {
    cwd: root,
    stdio: 'inherit',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    console.error(`FAILED: public/${target} (exit ${result.status})`);
    failed += 1;
    continue;
  }

}

console.log('\n=== Typo pattern scan ===\n');
const verify = spawnSync(node, [path.join(__dirname, 'verify_typos.cjs')], {
  cwd: root,
  stdio: 'inherit',
});

console.log('\n=== JSON structure validation ===\n');
const validate = spawnSync(node, [path.join(__dirname, 'validate_question_json.cjs')], {
  cwd: root,
  stdio: 'inherit',
});

if (failed > 0) process.exit(1);
if (verify.status !== 0) {
  console.error('\nVerification found remaining typo patterns.');
  process.exit(1);
}
if (validate.status !== 0) {
  console.error('\nJSON structure validation failed.');
  process.exit(1);
}

console.log('\nAll targets processed: typos clean, JSON valid, structure OK.');
process.exit(0);
