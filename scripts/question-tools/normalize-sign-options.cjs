#!/usr/bin/env node
/**
 * Reorder sign-picker options: id 1 = label "1", id 2 = "2", etc. (keeps is_correct on right sign).
 *
 * Usage:
 *   node normalize-sign-options.cjs 600.json           # apply
 *   node normalize-sign-options.cjs 600.json --dry-run # preview only
 *   node normalize-sign-options.cjs barcha.json
 */
const fs = require('fs');
const path = require('path');
const { publicRoot } = require('./paths.cjs');
const { analyzeOptions, needsNormalize, normalizeQuestionContent } = require('./lib/sign-option-order.cjs');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.find((a) => !a.startsWith('--')) || '600.json';
const file = path.join(publicRoot, fileArg.replace(/\\/g, '/'));

if (!fs.existsSync(file)) {
  console.error('File not found:', file);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const changes = [];

for (const q of data) {
  if (!q.media_url?.trim()) continue;
  const before = analyzeOptions(q.content?.uz_lat?.options || []);
  if (!before || !needsNormalize(before)) continue;

  const after = analyzeOptions(before.normalized);
  changes.push({
    gid: q.task_info?.global_id,
    media: q.media_url,
    kind: before.kind,
    correct: before.correctText,
    from: before.idTextMap,
    to: after?.idTextMap,
  });

  if (!dryRun) normalizeQuestionContent(q.content);
}

console.log(dryRun ? '[DRY RUN] ' : '', `File: ${fileArg}`);
console.log(`Questions to normalize: ${changes.length}\n`);

for (const c of changes) {
  console.log(`${c.gid} (${c.kind}) correct="${c.correct}"  ${c.media}`);
  console.log(`  before: ${c.from}`);
  console.log(`  after:  ${c.to}`);
  console.log('');
}

if (!dryRun && changes.length > 0) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 4)}\n`, 'utf8');
  console.log(`Saved ${fileArg}`);
}

if (changes.length > 0 && dryRun) process.exit(1);
