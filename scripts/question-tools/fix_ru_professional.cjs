#!/usr/bin/env node
/**
 * Professional Russian copy-editing for question JSON.
 * Usage:
 *   node scripts/fix_ru_professional.cjs 600.json
 *   node scripts/fix_ru_professional.cjs barcha.json
 *   node scripts/fix_ru_professional.cjs data/variants
 *   node scripts/fix_ru_professional.cjs mavzuli2
 *   node scripts/fix_ru_professional.cjs all
 */
const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot } = require('./paths.cjs');

const arg = (process.argv[2] || '600.json').replace(/\\/g, '/');

const BATCH_TARGETS = {
  all: ['600.json', 'barcha.json', 'data/variants', 'mavzuli2'],
  variants: ['data/variants'],
  mavzuli2: ['mavzuli2'],
};

/** Exact replacements (wrong → professional Russian) */
const exactRu = [
  [
    'Транспортные средства въезжающий на перекрестокимеют приоритет (преимущество) по отношению к транспортным средствамдвижущиеся на перекрестке',
    'Транспортные средства, въезжающие на перекресток, имеют приоритет (преимущество) по отношению к транспортным средствам, движущимся на перекрестке',
  ],
  [
    'В каких направлениях, обозначенных стрелкам разрешено движение?',
    'В каких направлениях, обозначенных стрелками, разрешено движение?',
  ],
  [
    'Не изменяя направление движения; зажечь сигнал экстренной остановки и остановится на месте',
    'Не изменяя направление движения, зажечь аварийную сигнализацию и остановиться на месте',
  ],
  [
    'Минимально допускаемое Правилами значение остаточной высоты рисунка протектора шин автотранспортных средств категории N2; N3; 03; 04 составляет:',
    'Минимально допустимое по Правилам значение остаточной высоты рисунка протектора шин автотранспортных средств категорий N2, N3, O3, O4 составляет:',
  ],
  [
    'Как должен поступить водитель при проезде мимо трамвая попутного направления; стоящего на обозначенной остановке; расположений на середине дороги?',
    'Как должен поступить водитель при проезде мимо трамвая попутного направления, стоящего на обозначенной остановке, расположенной на середине дороги?',
  ],
  [
    'Не выпускать на линию технические средства; не зарегистрированные в установленном порядке',
    'Не выпускать на линию транспортные средства, не зарегистрированные в установленном порядке',
  ],
  [
    'Перевязать неповрежденную ногу снизу на верх; поставить шину, как при переломе Дать выпить стакан чая с пищевой содой. Отправить в больницу',
    'Перевязать неповреждённую ногу снизу вверх, наложить шину, как при переломе. Дать выпить стакан чая с пищевой содой. Отправить в больницу',
  ],
  [
    'Снизить скорость до предела; обеспечивающего при необходимости немедленную остановку; и продолжать движение\n',
    'Снизить скорость до предела, обеспечивающего при необходимости немедленную остановку, и продолжить движение',
  ],
  [
    'Водитель какого транспортного средства нарушает правила поворота с дороги; на которой есть полоса торможения?',
    'Водитель какого транспортного средства нарушает правила поворота с дороги, на которой есть полоса торможения?',
  ],
  [
    'В каком ответе правильно названы все транспортные средства; которым разрешено движение?',
    'В каком ответе правильно названы все транспортные средства, которым разрешено движение?',
  ],
  [
    'С какой максимальной скоростью разрешено движение водителю легкового автомобиля; буксирующего прицеп вне населенного пункта?',
    'С какой максимальной скоростью разрешено движение водителю легкового автомобиля, буксирующего прицеп, вне населённого пункта?',
  ],
  [
    'Какой знак предупреждает водителя об оборудовании огородительным устройством железнодорожного переезда?',
    'Какой знак предупреждает водителя об оборудовании железнодорожного переезда ограждением?',
  ],
  [
    'Кому должен уступить дорогу водитель транспортного средства, движущийся на зеленый сигнал дополнительной секции одновременно с красным или желтым сигналом светофора?',
    'Кому должен уступить дорогу водитель транспортного средства, движущийся на зелёный сигнал дополнительной секции одновременно с красным или жёлтым сигналом светофора?',
  ],
  [
    'В каком направлени разрешено движение?',
    'В каком направлении разрешено движение?',
  ],
  [
    'Толькo прямо и направо',
    'Только прямо и направо',
  ],
  [
    'Толькo прямо',
    'Только прямо',
  ],
  [
    'Какой из указанных знаков информирует участников движения что, на данном участке дороги установлены специальные технические средства автоматизированные фото и видео фиксации?',
    'Какой из указанных знаков информирует участников движения о том, что на данном участке дороги установлены средства автоматической фото- и видеофиксации?',
  ],
  [
    'Какой из указанных знаков информирует участников движения что; на данном участке дороги установлены специальные технические средства автоматизированные фото и видео фиксации?',
    'Какой из указанных знаков информирует участников движения о том, что на данном участке дороги установлены средства автоматической фото- и видеофиксации?',
  ],
  [
    'Должностные лица, ответственные за эксплуатацию и техническое состояние транспортных средств обязаны:',
    'Должностные лица, ответственные за эксплуатацию и техническое состояние транспортных средств, обязаны:',
  ],
];

function polishRussian(text) {
  if (!text || typeof text !== 'string') return text;
  let v = text;

  for (const [from, to] of exactRu) {
    if (v.includes(from)) v = v.split(from).join(to);
  }

  v = v.replace(/; /g, ', ');

  v = v.replace(/\bN2, N3, 03, 04\b/g, 'N2, N3, O3, O4');
  v = v.replace(/\bN2, N3, 03\b/g, 'N2, N3, O3');
  v = v.replace(/\bN2; N3\b/g, 'N2, N3');
  v = v.replace(/\bМ1; М2\b/g, 'М1, М2');
  v = v.replace(/\bМ2;М3\b/g, 'М2, М3');

  v = v.replace(/\bостановится\b/g, 'остановиться');
  v = v.replace(/\bобозначенных стрелкам\b/g, 'обозначенных стрелками');
  v = v.replace(/\bстрелкам разрешено\b/g, 'стрелками разрешено');
  v = v.replace(/поле зрение\b/g, 'поле зрения');
  v = v.replace(/населен(?!ё|и)/g, 'населён');
  v = v.replace(/\bзеленый\b/g, 'зелёный');
  v = v.replace(/\bзеленого\b/g, 'зелёного');
  v = v.replace(/\bжелтым\b/g, 'жёлтым');
  v = v.replace(/\bжелтого\b/g, 'жёлтого');
  v = v.replace(/перекрест/g, 'перекрёст');
  v = v.replace(/перекрёёст/g, 'перекрёст');
  v = v.replace(/технические средства/g, 'транспортные средства');
  v = v.replace(/не отвечают требованиям/g, 'не соответствуют требованиям');
  v = v.replace(/полосу предназначенную/g, 'полосу, предназначенную');
  v = v.replace(/участников движения что;/g, 'участников движения о том, что,');
  v = v.replace(/участников движения что,/g, 'участников движения о том, что,');
  v = v.replace(/сигнал экстренной остановки/g, 'аварийную сигнализацию');
  v = v.replace(/\bувелечением\b/g, 'увеличением');
  v = v.replace(/\bпользуеться\b/g, 'пользуется');
  v = v.replace(/\bпреимушеств\b/g, 'преимущество');
  v = v.replace(/\bприпятств\b/g, 'препятств');
  v = v.replace(/дорогуъ/g, 'дорогу');

  v = v.replace(/, ,/g, ', ');
  v = v.replace(/  +/g, ' ');
  v = v.replace(/\n+$/g, '');
  return v.trim();
}

function polishRuBlock(ru, stats) {
  if (!ru) return;
  if (typeof ru.text === 'string') {
    const next = polishRussian(ru.text);
    if (next !== ru.text) {
      stats.text += 1;
      ru.text = next;
    }
  }
  if (Array.isArray(ru.options)) {
    for (const opt of ru.options) {
      if (typeof opt.text === 'string') {
        const next = polishRussian(opt.text);
        if (next !== opt.text) {
          stats.options += 1;
          opt.text = next;
        }
      }
    }
  }
}

function walkQuestions(data, stats) {
  if (!Array.isArray(data)) return;
  for (const item of data) {
    polishRuBlock(item.content?.ru, stats);
  }
}

function collectJsonFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      collectJsonFiles(full, list);
    } else if (name.endsWith('.json') && !name.includes('.bak') && !name.includes('.pending-fix')) {
      list.push(full);
    }
  }
  return list;
}

function resolveTargetFiles(target) {
  const full = path.resolve(publicRoot, target);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile() && target.endsWith('.json')) return [full];
  if (fs.statSync(full).isDirectory()) return collectJsonFiles(full);
  return [];
}

function processFile(filePath) {
  const rel = path.relative(publicRoot, filePath).replace(/\\/g, '/');
  const source = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(source);
  } catch (e) {
    console.error(`SKIP (parse error): ${rel} — ${e.message}`);
    return null;
  }
  if (!Array.isArray(data)) {
    console.log(`SKIP (not question array): ${rel}`);
    return null;
  }

  const stats = { text: 0, options: 0 };
  walkQuestions(data, stats);
  const out = `${JSON.stringify(data, null, 4)}\n`;

  if (out === source) {
    return { rel, changed: false, stats };
  }

  fs.writeFileSync(filePath, out, 'utf8');
  return { rel, changed: true, stats };
}

function runOnTarget(target) {
  const files = resolveTargetFiles(target);
  if (files.length === 0) {
    console.error(`No files for: public/${target}`);
    return { files: 0, changed: 0 };
  }

  let changed = 0;
  let totalText = 0;
  let totalOpts = 0;

  for (const fp of files) {
    const r = processFile(fp);
    if (!r) continue;
    if (r.changed) {
      changed += 1;
      totalText += r.stats.text;
      totalOpts += r.stats.options;
      console.log(`  ${r.rel}: texts ${r.stats.text}, options ${r.stats.options}`);
    }
  }

  console.log(
    `public/${target}: ${files.length} file(s), ${changed} updated, ${totalText} texts, ${totalOpts} options`,
  );
  return { files: files.length, changed, totalText, totalOpts };
}

const targets = BATCH_TARGETS[arg] || [arg];
let grand = { files: 0, changed: 0, totalText: 0, totalOpts: 0 };

console.log(`Russian professional fix — target(s): ${targets.join(', ')}\n`);

for (const t of targets) {
  const r = runOnTarget(t);
  grand.files += r.files;
  grand.changed += r.changed;
  grand.totalText += r.totalText;
  grand.totalOpts += r.totalOpts;
}

console.log(
  `\nTotal: ${grand.files} files, ${grand.changed} changed, ${grand.totalText} question texts, ${grand.totalOpts} options`,
);
