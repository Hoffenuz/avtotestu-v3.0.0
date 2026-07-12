#!/usr/bin/env node
/**
 * Compare mavzuli2/*.json against variant files and barcha.json.
 * Reports wrong global_id, text/media drift, phantom media, duplicate gids.
 */
const fs = require('fs');
const path = require('path');
const { publicRoot } = require('./paths.cjs');

function loadJson(fp) {
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function normText(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[''`ʻʼ]/g, "'")
    .replace(/harakatlanishga/g, 'harakat')
    .replace(/to'g'riga|tugriga/g, 'togri')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function optionsKey(block) {
  return JSON.stringify((block?.options || []).map((o) => ({
    id: o.id,
    text: o.text,
    is_correct: !!o.is_correct,
  })));
}

function buildGidIndex(corpus, label) {
  const byGid = new Map();
  const dupes = [];
  for (const q of corpus) {
    const gid = q.task_info?.global_id;
    if (!gid) continue;
    if (byGid.has(gid)) dupes.push({ gid, label, count: 2 });
    else byGid.set(gid, q);
  }
  return { byGid, dupes };
}

function buildMediaIndex(corpus) {
  const byMedia = new Map();
  for (const q of corpus) {
    const media = (q.media_url || '').trim();
    if (!media) continue;
    if (!byMedia.has(media)) byMedia.set(media, []);
    byMedia.get(media).push(q);
  }
  return byMedia;
}

function loadVariants() {
  const dir = path.join(publicRoot, 'data', 'variants');
  const byGid = new Map();
  const all = [];
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    for (const q of loadJson(path.join(dir, name))) {
      const gid = q.task_info?.global_id;
      if (gid && !byGid.has(gid)) byGid.set(gid, q);
      all.push(q);
    }
  }
  return { byGid, all };
}

const barcha = loadJson(path.join(publicRoot, 'barcha.json'));
const barchaIdx = buildGidIndex(barcha, 'barcha');
const variantIdx = loadVariants();
const mediaInVariants = buildMediaIndex(variantIdx.all);
const mediaInBarcha = buildMediaIndex(barcha);

const issues = {
  gidNotInVariants: [],
  textMismatchVsVariant: [],
  mediaMismatchVsVariant: [],
  gidNotInBarcha: [],
  phantomMedia: [],
  gidContentMismatchBarcha: [],
};

const mavzuliDir = path.join(publicRoot, 'mavzuli2');
const files = fs.readdirSync(mavzuliDir).filter((n) => n.endsWith('.json')).sort();

let total = 0;
for (const name of files) {
  const data = loadJson(path.join(mavzuliDir, name));
  for (const q of data) {
    total += 1;
    const gid = q.task_info?.global_id;
    const media = (q.media_url || '').trim();
    const text = q.content?.uz_lat?.text || '';

    if (media && !mediaInVariants.has(media) && !mediaInBarcha.has(media)) {
      issues.phantomMedia.push({ file: name, order: q.task_info?.order, gid, media });
    }

    const variant = gid ? variantIdx.byGid.get(gid) : null;
    const barchaQ = gid ? barchaIdx.byGid.get(gid) : null;

    if (!variant) {
      issues.gidNotInVariants.push({ file: name, order: q.task_info?.order, gid, text: text.slice(0, 60) });
      continue;
    }

    const vText = variant.content?.uz_lat?.text || '';
    if (normText(text) !== normText(vText)) {
      issues.textMismatchVsVariant.push({
        file: name,
        order: q.task_info?.order,
        gid,
        mavzuli: text.slice(0, 70),
        variant: vText.slice(0, 70),
        mavzuliMedia: media,
        variantMedia: variant.media_url || '',
      });
    } else if ((media || '') !== (variant.media_url || '')) {
      issues.mediaMismatchVsVariant.push({
        file: name,
        order: q.task_info?.order,
        gid,
        mavzuliMedia: media,
        variantMedia: variant.media_url || '',
      });
    }

    if (barchaQ) {
      const bText = barchaQ.content?.uz_lat?.text || '';
      if (normText(text) !== normText(bText) && normText(text) === normText(vText)) {
        issues.gidContentMismatchBarcha.push({
          file: name,
          order: q.task_info?.order,
          gid,
          note: 'matches variant but not barcha gid entry',
        });
      }
    }
  }
}

console.log('=== Mavzuli audit vs variants/barcha ===');
console.log(`Files: ${files.length}, Questions: ${total}`);
console.log(`Barcha duplicate global_ids: ${barchaIdx.dupes.length}`);
console.log('');
console.log('gid not in variants:', issues.gidNotInVariants.length);
console.log('text mismatch vs variant:', issues.textMismatchVsVariant.length);
console.log('media mismatch vs variant (text ok):', issues.mediaMismatchVsVariant.length);
console.log('phantom media (not in variants/barcha):', issues.phantomMedia.length);
console.log('matches variant but wrong barcha gid entry:', issues.gidContentMismatchBarcha.length);

function printSamples(title, list, limit = 12) {
  if (!list.length) return;
  console.log(`\n--- ${title} (first ${Math.min(limit, list.length)}) ---`);
  for (const item of list.slice(0, limit)) {
    console.log(JSON.stringify(item));
  }
}

printSamples('Text mismatch vs variant', issues.textMismatchVsVariant);
printSamples('Media mismatch vs variant', issues.mediaMismatchVsVariant);
printSamples('Phantom media', issues.phantomMedia);
printSamples('GID not in variants', issues.gidNotInVariants);

const hasErrors =
  issues.gidNotInVariants.length
  || issues.textMismatchVsVariant.length
  || issues.phantomMedia.length;

process.exit(hasErrors ? 1 : 0);
