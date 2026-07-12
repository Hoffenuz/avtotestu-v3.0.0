#!/usr/bin/env node
/**
 * Fix duplicate answer option texts and sync mavzuli2/3.json from canonical sources.
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

function findByMedia(corpus, media) {
  return corpus.filter((q) => q.media_url === media);
}

function findByGid(corpus, gid) {
  return corpus.find((q) => q.task_info?.global_id === gid);
}

function patchQuestion(target, source, keepOrder) {
  target.content = JSON.parse(JSON.stringify(source.content));
  if (source.task_info?.global_id) {
    target.task_info.global_id = source.task_info.global_id;
    target.task_info.ticket_num = source.task_info.ticket_num;
  }
  if (!keepOrder && source.task_info?.order == null) {
    /* keep mavzuli order */
  }
}

// --- mavzuli2/3.json: sync by media from 600.json ---
const corpus600 = loadJson(path.join(publicRoot, '600.json'));
const file3 = path.join(publicRoot, 'mavzuli2', '3.json');
const m3 = loadJson(file3);

const mediaToCanonicalGid = {
  'u105uz.webp': 't_10_q_6',
  'u311uz.webp': 't_28_q_8',
  'u450uz.webp': 't_39_q_19',
  'u213uz.webp': 't_19_q_8',
};

let synced3 = 0;
for (const q of m3) {
  const media = q.media_url;
  if (!media) continue;
  const canonicalGid = mediaToCanonicalGid[media];
  const source = canonicalGid
    ? findByGid(corpus600, canonicalGid)
    : findByMedia(corpus600, media)[0];
  if (!source) continue;
  const uz3 = JSON.stringify(q.content?.uz_lat?.options?.map((o) => o.text));
  const uzS = JSON.stringify(source.content?.uz_lat?.options?.map((o) => o.text));
  if (uz3 !== uzS || q.task_info?.global_id !== source.task_info?.global_id) {
    const order = q.task_info?.order;
    patchQuestion(q, source, false);
    if (order != null) q.task_info.order = order;
    synced3++;
  }
}

// u585uz from v51
const v51 = loadJson(path.join(publicRoot, 'data', 'variants', 'v51.json'));
const src585 = findByGid(v51, 't_51_q_16');
const q585 = m3.find((q) => q.media_url === 'u585uz.webp');
if (src585 && q585) {
  const order = q585.task_info?.order;
  patchQuestion(q585, src585, false);
  if (order != null) q585.task_info.order = order;
  synced3++;
}

saveJson(file3, m3);
console.log(`3.json: synced ${synced3} question(s) from canonical sources`);

// --- mavzuli2/14.json ---
const file14 = path.join(publicRoot, 'mavzuli2', '14.json');
const m14 = loadJson(file14);
let fixed14 = 0;

const q2116 = m14.find((q) => q.task_info?.global_id === 't_21_q_16');
if (q2116?.content?.ru?.options?.[1]?.text === q2116?.content?.ru?.options?.[0]?.text) {
  q2116.content.ru.options[1].text = 'Водитель красного автомобиля';
  fixed14++;
}

const q3518 = m14.find((q) => q.task_info?.global_id === 't_35_q_18');
if (q3518?.content?.ru?.options?.[1]?.text === q3518?.content?.ru?.options?.[0]?.text) {
  q3518.content.ru.options[1].text = 'Водитель трактора водителю грузового автомобиля';
  fixed14++;
}

saveJson(file14, m14);
console.log(`14.json: fixed ${fixed14} duplicate RU option(s)`);

// --- mavzuli2/7.json ---
const file7 = path.join(publicRoot, 'mavzuli2', '7.json');
const m7 = loadJson(file7);
let fixed7 = 0;

const v50 = loadJson(path.join(publicRoot, 'data', 'variants', 'v50.json'));
const src573 = findByMedia(v50, 'u573uz.webp')[0];
const q233 = m7.find((q) => q.media_url === 'u573uz.webp');
if (src573 && q233) {
  const order = q233.task_info?.order;
  patchQuestion(q233, src573, false);
  if (order != null) q233.task_info.order = order;
  fixed7++;
}

const q368 = m7.find((q) => q.task_info?.global_id === 't_36_q_8');
if (q368?.content?.ru?.options?.[3]?.text === '«Б» и «Г»' && q368?.content?.ru?.options?.[2]?.text === '«Б» и «Г»') {
  q368.content.ru.options[3].text = '«Б» или «В»';
  fixed7++;
}

saveJson(file7, m7);
console.log(`7.json: fixed ${fixed7} issue(s)`);
