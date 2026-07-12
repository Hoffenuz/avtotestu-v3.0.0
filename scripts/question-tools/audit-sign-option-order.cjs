#!/usr/bin/env node
/**
 * Find image questions where option id order does not match sign labels (1,2,3 / A,B,C).
 * Usage: node audit-sign-option-order.cjs [600.json|barcha.json]
 */
const fs = require('fs');
const path = require('path');
const { publicRoot } = require('./paths.cjs');
const { analyzeOptions, needsNormalize } = require('./lib/sign-option-order.cjs');

const arg = process.argv[2] || '600.json';
const file = path.join(publicRoot, arg.replace(/\\/g, '/'));
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const issues = [];
for (const q of data) {
  const gid = q.task_info?.global_id;
  const media = q.media_url || '';
  const analysis = analyzeOptions(q.content?.uz_lat?.options || []);
  if (!analysis || !needsNormalize(analysis)) continue;
  issues.push({
    gid,
    media,
    kind: analysis.kind,
    correct: analysis.correctText,
    before: analysis.idTextMap,
  });
}

console.log(`File: ${arg}`);
console.log(`Sign-label questions needing reorder: ${issues.length}\n`);
for (const x of issues) {
  console.log(`${x.gid}  [${x.kind}]  media=${x.media}  correct="${x.correct}"`);
  console.log(`  now: ${x.before}`);
}
if (issues.length > 0) process.exit(1);
