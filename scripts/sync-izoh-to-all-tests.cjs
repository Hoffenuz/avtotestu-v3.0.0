/**
 * Sync corrected izoh from public/data/variants → barcha + language splits + mavzuli2.
 *
 * Matching:
 *   - barcha*: by global_id (same 1250 set as variants)
 *   - mavzuli2: media-first, then soft text + option permutation (never trust global_id alone)
 *
 *   node scripts/sync-izoh-to-all-tests.cjs
 *   node scripts/sync-izoh-to-all-tests.cjs --apply
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VARIANTS_DIR = path.join(ROOT, "public", "data", "variants");
const MAVZULI_DIR = path.join(ROOT, "public", "mavzuli2");
const APPLY = process.argv.includes("--apply");
const APOS = /[\u2018\u2019\u02BB\u02BC'\u00AB\u00BB\u201C\u201D]/g;

function softNorm(s) {
  return (s || "")
    .replace(APOS, "")
    .replace(/[«»""„]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/yetarli/g, "etarli")
    .replace(/xavfsiz/g, "havfsiz")
    .replace(/nechinchi/g, "nechanchi")
    .replace(/yo['']nalish/g, "yonalish")
    .replace(/yunalish/g, "yonalish")
    .replace(/yynalish/g, "yonalish")
    .replace(/ruxsat/g, "rusat")
    .replace(/chorraxa/g, "chorraha")
    .replace(/hisoplanadimi/g, "hisoblanadimi")
    .replace(/hisoplanadi/g, "hisoblanadi")
    .replace(/boshiangich/g, "boshlangich")
    .replace(/balanligi/g, "balandligi")
    .replace(/ornatilganyuk/g, "ornatilgan yuk")
    .replace(/yukhonasida/g, "yukxonasida")
    .replace(/yukhonasi/g, "yukxonasi")
    .replace(/ahborot/g, "axborot")
    .replace(/vaktinchalik/g, "vaqtincha")
    .replace(/vaqtinchalik/g, "vaqtincha")
    .replace(/marno/g, "mano")
    .replace(/jixatidan/g, "jihatidan")
    .replace(/kurinish/g, "korinish")
    .replace(/yotik/g, "yotiq")
    .replace(/gurux/g, "guruh")
    .replace(/yukori/g, "yuqori")
    .replace(/urnatiladi/g, "ornatiladi")
    .replace(/taniklik/g, "taniqlilik")
    .replace(/taniqlik/g, "taniqlilik")
    .replace(/xuquq/g, "huquq")
    .replace(/orgatyotgan/g, "orgatayotgan")
    .replace(/koeffisient/g, "koeffitsient")
    .replace(/km\/s\b/g, "km/soat")
    .replace(/km\/soatdan/g, "km/soat dan")
    .replace(/amal kil/g, "amal qil")
    .replace(/iul belgisiga/g, "yol belgisiga")
    .replace(/bir birini/g, "birbirini")
    .replace(/inkor etganda/g, "inkor etganda")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/chiziqi/g, "chizigi")
    .replace(/qoplamasini/g, "qoplamasi")
    .replace(/bor\s+yoq/g, "boryoq")
    .replace(/etmasdan/g, "yetmasdan")
    .replace(/traektoriya/g, "trayektoriya")
    .replace(/siyqalanib/g, "siqilib")
    .replace(/tamirlash/g, "tamirlash")
    .replace(/kismlariga/g, "qismlariga")
    .replace(/\s+/g, " ")
    .trim();
}

function compactNorm(s) {
  return softNorm(s).replace(/\s+/g, "");
}

function mediaKey(m) {
  return path
    .basename(String(m || ""))
    .toLowerCase()
    .replace(/\.(webp|png|jpg|jpeg)$/i, "");
}

function resolveImage(name) {
  const base = mediaKey(name);
  if (!base) return null;
  const dir = path.join(ROOT, "public", "images");
  for (const ext of [".webp", ".png", ".jpg", ".jpeg"]) {
    const p = path.join(dir, base + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function izohEqual(a, b) {
  return softNorm(a || "") === softNorm(b || "");
}

function normalizeIzoh(iz) {
  if (!iz || typeof iz !== "object") return null;
  const uz_lat = (iz.uz_lat || "").trim();
  if (!uz_lat) return null;
  return {
    uz_lat,
    uz_cyr: (iz.uz_cyr || "").trim(),
    ru: (iz.ru || "").trim(),
  };
}

function optsSoft(q) {
  return (q.content?.uz_lat?.options || [])
    .map((o) => softNorm(o.text))
    .filter(Boolean)
    .sort();
}

function optsPerm(a, b) {
  const A = optsSoft(a);
  const B = optsSoft(b);
  return A.length > 0 && A.length === B.length && A.every((t, i) => t === B[i]);
}

function optsOverlap(a, b) {
  const A = new Set(optsSoft(a));
  const B = optsSoft(b);
  if (!A.size || A.size !== B.length) return 0;
  let hit = 0;
  for (const t of B) if (A.has(t)) hit++;
  return hit / A.size;
}

function tokenJaccard(a, b) {
  const A = new Set(
    softNorm(a)
      .split(" ")
      .filter((w) => w.length > 2)
  );
  const B = softNorm(b)
    .split(" ")
    .filter((w) => w.length > 2);
  if (!A.size || !B.length) return 0;
  let inter = 0;
  const Bset = new Set(B);
  for (const w of A) if (Bset.has(w)) inter++;
  return inter / (A.size + Bset.size - inter);
}

/** If several candidates share the same izoh text, any is fine. */
function pickIfSameIzoh(list) {
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  const key = softNorm(list[0].iz?.uz_lat || "");
  if (key && list.every((e) => softNorm(e.iz?.uz_lat || "") === key)) return list[0];
  return null;
}

function loadVariantsIndex() {
  const byId = new Map();
  const byMedia = new Map();
  const bySoft = new Map();
  const byCompact = new Map();
  const bySize = new Map();
  const all = [];
  let n = 0;
  let withIz = 0;

  for (let i = 1; i <= 63; i++) {
    const p = path.join(VARIANTS_DIR, `v${i}.json`);
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const q of arr) {
      n++;
      const iz = normalizeIzoh(q.izoh);
      if (iz) withIz++;
      const id = q.task_info?.global_id;
      const soft = softNorm(q.content?.uz_lat?.text);
      const compact = compactNorm(q.content?.uz_lat?.text);
      const mk = mediaKey(q.media_url);
      const img = resolveImage(q.media_url);
      const size = img ? fs.statSync(img).size : 0;
      const entry = { q, iz, id, soft, compact, media: mk, size };
      all.push(entry);
      if (id) byId.set(id, entry);
      if (mk) {
        if (!byMedia.has(mk)) byMedia.set(mk, []);
        byMedia.get(mk).push(entry);
      }
      if (soft) {
        if (!bySoft.has(soft)) bySoft.set(soft, []);
        bySoft.get(soft).push(entry);
      }
      if (compact) {
        if (!byCompact.has(compact)) byCompact.set(compact, []);
        byCompact.get(compact).push(entry);
      }
      if (size) {
        if (!bySize.has(size)) bySize.set(size, []);
        bySize.get(size).push(entry);
      }
    }
  }
  return { byId, byMedia, bySoft, byCompact, bySize, all, n, withIz };
}

/** Hard overrides: mavzuli media or soft text → variant global_id (verified manually). */
const MANUAL_BY_MEDIA = {
  v556uz: "t_11_q_1", // taniqlilik belgisi (re-encoded image)
  v571uz: "t_14_q_16", // qizil avtomobil yo'nalishlari
};
const MANUAL_BY_SOFT = {
  // older wording of "chetki chap qator" avtomagistral question
  [softNorm(
    "Yuk avtomobillarining avtomagistrallarda ikkinchi bo'lakdan nariroqda harakatlanishiga ruxsat etiladimi?"
  )]: "t_55_q_8",
  [softNorm(
    "Ishqalanish koeffisientiga shinalarni siyqalanib ketgan protektori qanday ta'sir qiladi?"
  )]: "t_58_q_3",
  [softNorm(
    "Doimiy va vaktinchalik yo'l belgilari marno jixatidan bir birini inkor etganda qaysi biriga amal kilasiz?"
  )]: "t_1_q_16",
};

function findVariant(dstQ, idx) {
  const soft = softNorm(dstQ.content?.uz_lat?.text);
  const compact = compactNorm(dstQ.content?.uz_lat?.text);
  const mk = mediaKey(dstQ.media_url);
  const id = dstQ.task_info?.global_id;
  const img = resolveImage(dstQ.media_url);
  const size = img ? fs.statSync(img).size : 0;

  // 0) manual overrides
  if (mk && MANUAL_BY_MEDIA[mk] && idx.byId.has(MANUAL_BY_MEDIA[mk])) {
    return { entry: idx.byId.get(MANUAL_BY_MEDIA[mk]), how: "manual-media" };
  }
  if (soft && MANUAL_BY_SOFT[soft] && idx.byId.has(MANUAL_BY_SOFT[soft])) {
    return { entry: idx.byId.get(MANUAL_BY_SOFT[soft]), how: "manual-text" };
  }

  // 1) media basename first
  if (mk && idx.byMedia.has(mk)) {
    const list = idx.byMedia.get(mk);
    if (list.length === 1) return { entry: list[0], how: "media-unique" };
    const same = list.filter((e) => e.soft === soft || e.compact === compact);
    if (same.length === 1) return { entry: same[0], how: "media+text" };
    const permut = list.filter((e) => optsPerm(dstQ, e.q));
    if (permut.length === 1) return { entry: permut[0], how: "media+opts" };
    const sameIz = pickIfSameIzoh(list);
    if (sameIz) return { entry: sameIz, how: "media+same-izoh" };
  }

  // 1b) re-encoded images: same size (±2KB) + text/opts
  if (size) {
    const near = [];
    for (const [sz, list] of idx.bySize) {
      if (Math.abs(sz - size) <= 2048) near.push(...list);
    }
    if (near.length) {
      const textHits = near.filter((e) => e.soft === soft || e.compact === compact);
      if (textHits.length === 1) return { entry: textHits[0], how: "size+text" };
      const permut = near.filter(
        (e) =>
          optsPerm(dstQ, e.q) &&
          tokenJaccard(dstQ.content?.uz_lat?.text, e.q.content?.uz_lat?.text) >= 0.35
      );
      if (permut.length === 1) return { entry: permut[0], how: "size+opts" };
      const scored = near
        .map((e) => ({
          e,
          j: tokenJaccard(dstQ.content?.uz_lat?.text, e.q.content?.uz_lat?.text),
          o: optsOverlap(dstQ, e.q),
          d: Math.abs(e.size - size),
        }))
        .filter((x) => (x.j >= 0.72 && x.o >= 0.5) || (x.j >= 0.65 && x.d <= 1500 && x.o >= 0.4))
        .sort((a, b) => b.j + b.o - (a.j + a.o) || a.d - b.d);
      if (scored.length === 1 || (scored.length > 1 && scored[0].j - scored[1].j > 0.08)) {
        return { entry: scored[0].e, how: "size+fuzzy" };
      }
      const byOpts = near
        .map((e) => ({
          e,
          o: optsOverlap(dstQ, e.q),
          d: Math.abs(e.size - size),
        }))
        .filter((x) => x.o >= 0.85 && x.d <= 1500)
        .sort((a, b) => b.o - a.o || a.d - b.d);
      if (
        byOpts.length === 1 ||
        (byOpts.length > 1 && byOpts[0].o > byOpts[1].o && byOpts[0].d <= byOpts[1].d)
      ) {
        return { entry: byOpts[0].e, how: "size+opts-strong" };
      }
      const sameIz = pickIfSameIzoh(scored.map((x) => x.e));
      if (sameIz) return { entry: sameIz, how: "size+same-izoh" };
    }
  }

  // 2) soft text
  if (soft && idx.bySoft.has(soft)) {
    const list = idx.bySoft.get(soft);
    const permut = list.filter((e) => optsPerm(dstQ, e.q));
    if (permut.length === 1) return { entry: permut[0], how: "text+opts" };
    const sameIz = pickIfSameIzoh(permut.length ? permut : list);
    if (sameIz) return { entry: sameIz, how: "text+same-izoh" };
    if (!mk) {
      const noM = list.filter((e) => !e.media);
      if (noM.length === 1) return { entry: noM[0], how: "text" };
      const sameNoM = pickIfSameIzoh(noM);
      if (sameNoM) return { entry: sameNoM, how: "text-nomedia-same-izoh" };
    }
    if (list.length === 1) return { entry: list[0], how: "text-unique" };
    const scored = list
      .map((e) => ({ e, o: optsOverlap(dstQ, e.q) }))
      .filter((x) => x.o >= 0.75)
      .sort((a, b) => b.o - a.o);
    if (scored.length === 1) return { entry: scored[0].e, how: "text+opts-fuzzy" };
    const sameScored = pickIfSameIzoh(scored.map((x) => x.e));
    if (sameScored) return { entry: sameScored, how: "text+opts-fuzzy-same" };
  }

  if (compact && idx.byCompact.has(compact)) {
    const list = idx.byCompact.get(compact);
    const permut = list.filter((e) => optsPerm(dstQ, e.q));
    if (permut.length === 1) return { entry: permut[0], how: "compact+opts" };
    const sameIz = pickIfSameIzoh(permut.length ? permut : list);
    if (sameIz) return { entry: sameIz, how: "compact+same-izoh" };
    if (list.length === 1) return { entry: list[0], how: "compact" };
  }

  // 3) global fuzzy text (last resort)
  {
    const scored = idx.all
      .map((e) => ({
        e,
        j: tokenJaccard(dstQ.content?.uz_lat?.text, e.q.content?.uz_lat?.text),
        o: optsOverlap(dstQ, e.q),
      }))
      .filter((x) => x.j >= 0.82 && (x.o >= 0.5 || !optsSoft(dstQ).length))
      .sort((a, b) => b.j + b.o - (a.j + a.o));
    if (scored.length === 1) return { entry: scored[0].e, how: "fuzzy" };
    if (scored.length > 1 && scored[0].j >= 0.9 && scored[0].j - scored[1].j >= 0.05) {
      return { entry: scored[0].e, how: "fuzzy-top" };
    }
    const sameIz = pickIfSameIzoh(scored.filter((x) => x.j >= 0.88).map((x) => x.e));
    if (sameIz) return { entry: sameIz, how: "fuzzy-same-izoh" };
  }

  // 4) id only if text also matches (mavzuli IDs are often wrong)
  if (id && idx.byId.has(id)) {
    const e = idx.byId.get(id);
    if (e.soft === soft || e.compact === compact) return { entry: e, how: "id" };
  }

  return { entry: null, how: "none" };
}

function applyIzoh(q, iz, langMode = "full") {
  // langMode: full | uz_lat | uz_cyr | ru
  if (langMode === "full") {
    q.izoh = {
      uz_lat: iz.uz_lat || "",
      uz_cyr: iz.uz_cyr || q.izoh?.uz_cyr || "",
      ru: iz.ru || q.izoh?.ru || "",
    };
    return;
  }
  const val =
    langMode === "uz_lat"
      ? iz.uz_lat
      : langMode === "uz_cyr"
        ? iz.uz_cyr || iz.uz_lat
        : iz.ru || q.izoh?.[langMode] || "";
  q.izoh = { [langMode]: val || "" };
}

function syncArray(label, arr, idx, opts = {}) {
  const { byId = false, langMode = "full" } = opts;
  const stats = {
    label,
    total: arr.length,
    matched: 0,
    unmatched: 0,
    updated: 0,
    same: 0,
    missingIzohInSrc: 0,
    byHow: {},
    samples: [],
  };

  for (const q of arr) {
    let hit;
    if (byId) {
      const id = q.task_info?.global_id;
      const e = id && idx.byId.get(id);
      hit = e ? { entry: e, how: "id" } : { entry: null, how: "none" };
    } else {
      hit = findVariant(q, idx);
    }

    stats.byHow[hit.how] = (stats.byHow[hit.how] || 0) + 1;
    if (!hit.entry) {
      stats.unmatched++;
      if (stats.samples.filter((s) => s.type === "unmatched").length < 80) {
        stats.samples.push({
          type: "unmatched",
          id: q.task_info?.global_id,
          text: (q.content?.uz_lat?.text || q.content?.uz_cyr?.text || q.content?.ru?.text || "").slice(0, 70),
          media: mediaKey(q.media_url),
        });
      }
      continue;
    }

    stats.matched++;
    const iz = hit.entry.iz;
    if (!iz) {
      stats.missingIzohInSrc++;
      continue;
    }

    const curLat =
      langMode === "full"
        ? q.izoh?.uz_lat
        : langMode === "uz_lat"
          ? q.izoh?.uz_lat
          : langMode === "uz_cyr"
            ? q.izoh?.uz_cyr
            : q.izoh?.ru;
    const nextLat =
      langMode === "full"
        ? iz.uz_lat
        : langMode === "uz_lat"
          ? iz.uz_lat
          : langMode === "uz_cyr"
            ? iz.uz_cyr || iz.uz_lat
            : iz.ru || "";

    const same =
      langMode === "full"
        ? izohEqual(q.izoh?.uz_lat, iz.uz_lat) &&
          (!iz.uz_cyr || izohEqual(q.izoh?.uz_cyr, iz.uz_cyr)) &&
          (!iz.ru || izohEqual(q.izoh?.ru, iz.ru))
        : !nextLat || izohEqual(curLat, nextLat);

    if (same) {
      stats.same++;
    } else {
      stats.updated++;
      if (stats.samples.length < 10) {
        stats.samples.push({
          type: "update",
          id: q.task_info?.global_id,
          how: hit.how,
          before: String(curLat || "").slice(0, 60),
          after: String(nextLat || "").slice(0, 60),
        });
      }
      if (APPLY) applyIzoh(q, iz, langMode);
    }
  }

  return stats;
}

function splitBarcha(barcha) {
  const make = (langKey) =>
    barcha.map((q) => {
      const lang = q.content?.[langKey] || q.content?.uz_lat;
      const izohText = q.izoh?.[langKey] || q.izoh?.uz_lat || "";
      return {
        task_info: q.task_info,
        media_url: q.media_url || "",
        content: {
          [langKey]: {
            text: lang?.text || "",
            options: lang?.options || [],
          },
        },
        izoh: { [langKey]: izohText },
      };
    });

  return {
    "barcha-uz-lat.json": make("uz_lat"),
    "barcha-uz-cyr.json": make("uz_cyr"),
    "barcha-ru.json": make("ru"),
  };
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 4) + "\n", "utf8");
}

function main() {
  const idx = loadVariantsIndex();
  console.log(`Variants index: ${idx.n} questions, ${idx.withIz} with izoh`);

  const allStats = [];

  // ── barcha.json (by id) ───────────────────────────────────────────
  const barchaPath = path.join(ROOT, "public", "barcha.json");
  const barcha = JSON.parse(fs.readFileSync(barchaPath, "utf8"));
  const stBarcha = syncArray("barcha.json", barcha, idx, { byId: true, langMode: "full" });
  allStats.push(stBarcha);
  if (APPLY) {
    writeJson(barchaPath, barcha);
    console.log("wrote barcha.json");
    const splits = splitBarcha(barcha);
    for (const [name, data] of Object.entries(splits)) {
      writeJson(path.join(ROOT, "public", name), data);
      console.log("wrote", name);
    }
  }

  // ── language files also audited (if not applying split, sync in place) ─
  if (!APPLY) {
    for (const [name, mode] of [
      ["barcha-uz-lat.json", "uz_lat"],
      ["barcha-uz-cyr.json", "uz_cyr"],
      ["barcha-ru.json", "ru"],
    ]) {
      const p = path.join(ROOT, "public", name);
      if (!fs.existsSync(p)) continue;
      const arr = JSON.parse(fs.readFileSync(p, "utf8"));
      allStats.push(syncArray(name, arr, idx, { byId: true, langMode: mode }));
    }
  }

  // ── mavzuli2 (media/text match — NOT by id) ───────────────────────
  let mavzuliUpdatedFiles = 0;
  for (const f of fs.readdirSync(MAVZULI_DIR).filter((x) => x.endsWith(".json")).sort()) {
    const p = path.join(MAVZULI_DIR, f);
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(arr)) continue;
    const st = syncArray(`mavzuli2/${f}`, arr, idx, { byId: false, langMode: "full" });
    allStats.push(st);
    if (APPLY && st.updated > 0) {
      writeJson(p, arr);
      mavzuliUpdatedFiles++;
      console.log("wrote mavzuli2/" + f, "updated", st.updated);
    }
  }

  // ── 600.json: free bank — no izoh field by design; report only ────
  const freePath = path.join(ROOT, "public", "600.json");
  if (fs.existsSync(freePath)) {
    const free = JSON.parse(fs.readFileSync(freePath, "utf8"));
    const withIz = free.filter((q) => q.izoh && (q.izoh.uz_lat || q.izoh.uz_cyr || q.izoh.ru)).length;
    allStats.push({
      label: "600.json",
      total: free.length,
      note: "Free bank: izoh field not used (PRO promo in UI)",
      questionsWithIzoh: withIz,
    });
  }

  // Aggregate
  const agg = {
    mode: APPLY ? "apply" : "dry-run",
    variants: { n: idx.n, withIzoh: idx.withIz },
    mavzuliUpdatedFiles: APPLY ? mavzuliUpdatedFiles : undefined,
    totals: {
      updated: 0,
      same: 0,
      unmatched: 0,
      matched: 0,
    },
    files: allStats,
  };
  for (const s of allStats) {
    if (s.updated != null) agg.totals.updated += s.updated;
    if (s.same != null) agg.totals.same += s.same;
    if (s.unmatched != null) agg.totals.unmatched += s.unmatched;
    if (s.matched != null) agg.totals.matched += s.matched;
  }

  const outPath = path.join(__dirname, APPLY ? "_sync-apply-report.json" : "_sync-dryrun-report.json");
  fs.writeFileSync(outPath, JSON.stringify(agg, null, 2), "utf8");
  console.log("report:", outPath);
  console.log(
    JSON.stringify(
      {
        mode: agg.mode,
        totals: agg.totals,
        needsUpdate: agg.files
          .filter((f) => (f.updated || 0) > 0 || (f.unmatched || 0) > 0 || f.questionsWithIzoh != null)
          .map((f) => ({
            label: f.label,
            total: f.total,
            matched: f.matched,
            updated: f.updated,
            same: f.same,
            unmatched: f.unmatched,
            missingIzohInSrc: f.missingIzohInSrc,
            how: f.byHow,
            note: f.note,
            questionsWithIzoh: f.questionsWithIzoh,
            samples: (f.samples || []).slice(0, 3),
          })),
      },
      null,
      2
    )
  );
}

main();
