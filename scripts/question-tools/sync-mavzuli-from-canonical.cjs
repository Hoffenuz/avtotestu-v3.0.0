#!/usr/bin/env node
/**
 * Sync mavzuli2/*.json questions from canonical barcha.json.
 * Fixes wrong global_id / content drift (e.g. mavzuli2/6.json t_54_q_12 vs v544uz).
 *
 * Match priority:
 * 1) media_url (unique in barcha)
 * 2) normalized uz_lat question text (unique in barcha)
 *
 * Preserves mavzuli task_info.order.
 */
const fs = require('fs');
const path = require('path');
const { publicRoot } = require('./paths.cjs');

function loadJson(fp) {
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function saveJson(fp, data) {
  fs.writeFileSync(fp, `${JSON.stringify(data, null, 4)}\n`, 'utf8');
}

function normText(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[''`ʻʼ]/g, "'")
    .replace(/yo'nalish|yunalish|iunalish/g, 'yonalish')
    .replace(/harakatlanishga/g, 'harakat')
    .replace(/to'g'riga|tugriga/g, 'togri')
    .replace(/o'ngga|ungga/g, 'ong')
    .replace(/yo'nalishlarga|iunalishlarga/g, 'yonalish')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyTextMatch(a, b) {
  const na = normText(a);
  const nb = normText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length > 20 && nb.length > 20 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}

function optionsKey(block) {
  return JSON.stringify((block?.options || []).map((o) => ({
    id: o.id,
    text: o.text,
    is_correct: !!o.is_correct,
  })));
}

function sameQuestion(a, b) {
  const aUz = a.content?.uz_lat;
  const bUz = b.content?.uz_lat;
  if (!aUz || !bUz) return false;
  return normText(aUz.text) === normText(bUz.text) && optionsKey(aUz) === optionsKey(bUz);
}

function patchQuestion(target, source, keepOrder) {
  target.content = JSON.parse(JSON.stringify(source.content));
  target.media_url = source.media_url || '';
  if (source.task_info) {
    target.task_info = {
      ...JSON.parse(JSON.stringify(source.task_info)),
      order: keepOrder ?? target.task_info?.order,
    };
  }
}

function buildCanonicalIndex(corpus) {
  const byMedia = new Map();
  const byText = new Map();
  const byGid = new Map();
  const all = [];

  for (const q of corpus) {
    const gid = q.task_info?.global_id;
    const media = (q.media_url || '').trim();
    const text = normText(q.content?.uz_lat?.text);

    all.push(q);
    if (gid) byGid.set(gid, q);
    if (media) {
      if (!byMedia.has(media)) byMedia.set(media, []);
      byMedia.get(media).push(q);
    }
    if (text) {
      if (!byText.has(text)) byText.set(text, []);
      byText.get(text).push(q);
    }
  }

  return { byMedia, byText, byGid, all };
}

function resolveCanonical(q, index) {
  const media = (q.media_url || '').trim();
  const text = normText(q.content?.uz_lat?.text);
  const gid = q.task_info?.global_id;

  if (media) {
    const list = index.byMedia.get(media) || [];
    if (list.length === 1) return { source: list[0], via: 'media' };
    if (list.length > 1) {
      const exact = list.find((c) => sameQuestion(q, c));
      if (exact) return { source: exact, via: 'media+content' };
    }
  }

  if (text) {
    const list = index.byText.get(text) || [];
    if (list.length === 1) return { source: list[0], via: 'text' };
    if (list.length > 1) {
      const byOpts = list.find((c) => optionsKey(q.content?.uz_lat) === optionsKey(c.content?.uz_lat));
      if (byOpts) return { source: byOpts, via: 'text+options' };
    }
  }

  const rawText = q.content?.uz_lat?.text || '';
  if (rawText) {
    const fuzzy = index.all.filter((c) => fuzzyTextMatch(rawText, c.content?.uz_lat?.text));
    if (fuzzy.length === 1) return { source: fuzzy[0], via: 'fuzzy-text' };
    if (fuzzy.length > 1) {
      const byOpts = fuzzy.find((c) => {
        const qOpts = (q.content?.uz_lat?.options || []).map((o) => normText(o.text)).sort().join('|');
        const cOpts = (c.content?.uz_lat?.options || []).map((o) => normText(o.text)).sort().join('|');
        return qOpts === cOpts;
      });
      if (byOpts) return { source: byOpts, via: 'fuzzy-text+options' };
      return { source: fuzzy[0], via: 'fuzzy-text-first' };
    }
  }

  if (gid) {
    const canon = index.byGid.get(gid);
    if (canon && sameQuestion(q, canon)) return { source: canon, via: 'gid' };
  }

  return null;
}

function contentMatchesGid(q, index) {
  const gid = q.task_info?.global_id;
  if (!gid) return true;
  const canon = index.byGid.get(gid);
  if (!canon) return true;
  const uz = q.content?.uz_lat?.text || '';
  const cuz = canon.content?.uz_lat?.text || '';
  return normText(uz) === normText(cuz);
}

const corpus = loadJson(path.join(publicRoot, 'barcha.json'));
const index = buildCanonicalIndex(corpus);
const mavzuliDir = path.join(publicRoot, 'mavzuli2');

const files = fs
  .readdirSync(mavzuliDir)
  .filter((name) => name.endsWith('.json'))
  .sort();

const summary = {
  files: 0,
  questions: 0,
  synced: 0,
  alreadyOk: 0,
  unresolved: 0,
};

const unresolvedSamples = [];

for (const name of files) {
  const fp = path.join(mavzuliDir, name);
  const data = loadJson(fp);
  if (!Array.isArray(data) || data.length === 0) continue;

  summary.files += 1;
  let changed = 0;

  for (const q of data) {
    summary.questions += 1;
    const keepOrder = q.task_info?.order;

    // Re-resolve when global_id does not match actual question body
    const needsRematch = !contentMatchesGid(q, index);
    const resolved = needsRematch ? resolveCanonical(q, index) : { source: q, via: 'ok' };

    if (!resolved || resolved.via === 'ok') {
      if (!needsRematch) summary.alreadyOk += 1;
      else summary.unresolved += 1;
      continue;
    }

    if (sameQuestion(q, resolved.source)
      && (q.media_url || '') === (resolved.source.media_url || '')
      && q.task_info?.global_id === resolved.source.task_info?.global_id) {
      summary.alreadyOk += 1;
      continue;
    }

    patchQuestion(q, resolved.source, keepOrder);
    changed += 1;
    summary.synced += 1;
  }

  if (changed > 0) {
    saveJson(fp, data);
    console.log(`${name}: synced ${changed} question(s)`);
  }
}

console.log('\nSummary:', summary);
if (unresolvedSamples.length) {
  console.log('\nUnresolved samples:');
  for (const s of unresolvedSamples) {
    console.log(`  ${s.file} #${s.order} gid=${s.gid} media=${s.media} :: ${s.text}`);
  }
}

process.exit(summary.unresolved > 0 ? 0 : 0);
