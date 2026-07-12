#!/usr/bin/env node
/**
 * Run all question JSON checks (production sanity).
 * Usage: node scripts/question-tools/run-verify.cjs
 */
const { spawnSync } = require('child_process');
const path = require('path');
const { projectRoot } = require('./paths.cjs');

const toolsDir = __dirname;
const node = process.execPath;

const steps = [
  ['validate_question_json.cjs', 'JSON structure'],
  ['verify_typos.cjs', 'Known typo patterns'],
  ['verify_all_fixes.cjs', 'Professional uz/ru patterns'],
  ['audit_ru_all.cjs', 'Russian audit'],
  ['audit-duplicate-options.cjs', 'Duplicate answer options'],
  ['audit-merged-words.cjs', 'Merged / stuck words'],
];

let failed = 0;
for (const [script, label] of steps) {
  console.log(`\n=== ${label} ===\n`);
  const r = spawnSync(node, [path.join(toolsDir, script)], {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error(`FAILED: ${script}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll question JSON checks passed.');
