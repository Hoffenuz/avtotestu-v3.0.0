#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot } = require('./paths.cjs');
let n = 0;
const samples = [];

function walk(fp) {
  let d;
  try {
    d = JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return;
  }
  if (!Array.isArray(d)) return;
  for (const q of d) {
    const ru = q.content?.ru;
    if (!ru) continue;
    for (const t of [ru.text, ...(ru.options || []).map((o) => o.text)]) {
      if (t && /; /.test(t)) {
        n += 1;
        if (samples.length < 10) samples.push({ f: path.relative(publicRoot, fp), t: t.slice(0, 120) });
      }
    }
  }
}

function collect(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) collect(full, list);
    else if (
      name.endsWith('.json') &&
      !name.includes('.bak') &&
      !name.includes('.pending-fix')
    ) {
      list.push(full);
    }
  }
  return list;
}

for (const f of collect(publicRoot)) walk(f);
console.log('RU strings with semicolon+space:', n);
samples.forEach((s) => console.log(s.f, '|', s.t));
