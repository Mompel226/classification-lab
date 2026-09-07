/* ============================================================
   build.mjs — turns the master content into what the site ships.

     node tools/build.mjs [password]

   Reads   ../classification-lab-source/stations.master.js   (has the answers)
   Writes  js/data/stations.js    presentation + salted hashes, NO answers
           js/data/glossary.js    the shared definitions
           js/engine.js, js/marking.js         copied from labs-shared/engine/
           js/tree.js, js/tree-draw.js         copied from labs-shared/tree/
           assets/silhouettes/                 copied from labs-shared/tree/silhouettes/
           index.html             the silhouettes inlined as <symbol>s, and every ?v= stamped

   The hashes let the page mark an answer right or wrong without the answer
   existing anywhere in the download. Nothing in the site can say what the
   answer is, because nothing in the site has it.

   Pass --vault to also write js/data/keys.enc.js, an AES-GCM encrypted copy
   of the answers for your own checking. The site never loads it, .gitignore
   keeps it out of the repo, and it is not published.
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { webcrypto as crypto, createHash } from 'node:crypto';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const MASTER = resolve(REPO, '../classification-lab-source/stations.master.js');
const ITER = 250000;

const password = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'Biology2026';
if (!existsSync(MASTER)) {
  console.error('Cannot find the master content at:\n  ' + MASTER +
    '\nIt must stay outside the published repo. See README.');
  process.exit(1);
}
const { STATIONS } = await import(pathToFileURL(MASTER).href);

/* ---------- the shared folder ----------
   labs-shared/ is an ancestor of this repo. It holds the glossary every lab prints from,
   the activity engine and marking module every lab runs, and the tree of life this lab
   shares with the Life on Earth Hub. Edit them there; a build copies them in. */
function findShared(from) {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    const p = resolve(dir, 'labs-shared');
    if (existsSync(resolve(p, 'glossary.master.js'))) return p;
    const up = resolve(dir, '..');
    if (up === dir) break;
    dir = up;
  }
  return null;
}
const SHARED = findShared(REPO);
if (!SHARED) {
  console.error('Cannot find labs-shared/ above:\n  ' + REPO + '\nIt holds the glossary, the engine and the tree every lab shares. See README.');
  process.exit(1);
}
for (const [from, to] of [['engine/engine.js', 'js/engine.js'], ['engine/marking.js', 'js/marking.js'],
                          ['tree/tree.js', 'js/tree.js'], ['tree/tree-draw.js', 'js/tree-draw.js']]) {
  copyFileSync(resolve(SHARED, from), resolve(REPO, to));
}
mkdirSync(resolve(REPO, 'assets/silhouettes'), { recursive: true });
for (const f of readdirSync(resolve(SHARED, 'tree/silhouettes'))) {
  copyFileSync(resolve(SHARED, 'tree/silhouettes', f), resolve(REPO, 'assets/silhouettes', f));
}

/* ---------- the shared glossary ----------
   One definition per term, for every lab. A station names the terms it introduces; the
   wording is looked up here, and a term a station names but the glossary does not define
   stops the build. */
const { GLOSSARY } = await import(pathToFileURL(resolve(SHARED, 'glossary.master.js')).href);
const DEF = new Map(GLOSSARY.map(e => [e.term.toLowerCase(), e]));
const missing = [], clash = [];
for (const st of STATIONS) {
  st.keywords = (st.keywords || []).map(k => {
    const term = typeof k === 'string' ? k : k.term;
    const e = DEF.get(String(term).toLowerCase());
    if (!e) { missing.push(st.id + ' -> ' + term); return { term, def: '' }; }
    if (typeof k === 'object' && k.def && k.def !== e.def) clash.push(st.id + ' -> ' + term);
    return { term: e.term, def: e.def };
  });
}
if (missing.length || clash.length) {
  if (missing.length) console.error('Terms named by a station but not in the glossary:\n  ' + missing.join('\n  '));
  if (clash.length) console.error('Terms whose station wording differs from the glossary:\n  ' + clash.join('\n  '));
  process.exit(1);
}

/* ---------- helpers shared with the runtime (must stay identical to marking.js) ---------- */
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
function norm(s) {
  return String(s ?? '').toLowerCase().trim()
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ').replace(/[.,;:!?]+$/, '').replace(/^(the|a|an)\s+/, '');
}
const SALT = hex(crypto.getRandomValues(new Uint8Array(16)));
async function H(parts) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(SALT + '|' + parts.join('|')));
  return hex(d).slice(0, 32);
}
/* deterministic shuffle so ordering tasks never ship in the right order */
function scramble(arr, seed) {
  const a = arr.slice();
  let s = 0; for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.join('|') === arr.join('|') && a.length > 1 ? scramble(arr, seed + '.') : a;
}

/* ---------- transform ---------- */
const vault = {};
const pub = [];
let nAct = 0;
/* things a question may show that are not its answer: a picture, a table, a DNA alignment,
   a printed key, a drawing */
const SHOW = ['table', 'img', 'imgCap', 'seq', 'key', 'svg', 'credit'];

for (const st of STATIONS) {
  const s = { ...st, activities: [] };
  for (let i = 0; i < (st.activities || []).length; i++) {
    const a = st.activities[i], id = st.id + ':' + i, t = a.type;
    const p = { type: t, prompt: a.prompt };
    for (const k of SHOW) if (a[k] != null) p[k] = a[k];
    const v = {};
    nAct++;

    if (t === 'blank') {
      p.text = a.text;
      p.hints = {}; p.k = {};
      for (const [g, spec] of Object.entries(a.answers)) {
        p.hints[g] = spec.hint;
        p.k[g] = await Promise.all(spec.accept.map(x => H([id, 'g' + g, norm(x)])));
      }
      v.answers = Object.fromEntries(Object.entries(a.answers).map(([g, sp]) => [g, sp.accept[0]]));

    } else if (t === 'mcq') {
      p.options = a.options;
      p.multi = a.correct.length > 1;
      p.k = await H([id, 'mcq', a.correct.slice().sort((x, y) => x - y).join(',')]);
      v.correct = a.correct; v.why = a.why;

    } else if (t === 'order') {
      p.items = scramble(a.items, id);
      p.k = await H([id, 'order', a.items.join('~')]);
      v.items = a.items;

    } else if (t === 'match') {
      p.left = a.left; p.right = a.right;
      p.leftHead = a.leftHead; p.rightHead = a.rightHead;
      if (a.leftNotes) p.leftNotes = a.leftNotes;
      p.k = await H([id, 'match', a.pairs.map(x => x.join('-')).sort().join(',')]);
      v.pairs = a.pairs;

    } else if (t === 'sort') {
      p.bins = a.bins;
      p.items = scramble(a.items.map(x => x.text), id);
      p.k = await H([id, 'sort', a.items.map(x => norm(x.text) + '=' + x.bin).sort().join(',')]);
      v.items = a.items;

    } else if (t === 'drag') {
      p.tokens = a.tokens; p.distractors = a.distractors || [];
      p.slots = a.slots.map(s2 => ({ label: s2.label }));
      p.k = await H([id, 'drag', a.slots.map((s2, j) => j + '=' + norm(s2.accept)).join(',')]);
      v.slots = a.slots.map(s2 => s2.accept);

    } else if (t === 'grid') {
      /* rows of things, columns of characteristics; the student ticks. Marked row by row,
         the way the gaps of a cloze are, so a wrong row is named but never corrected. */
      p.rows = a.rows.map(r => (typeof r === 'string' ? { label: r } : { label: r.label, note: r.note }));
      p.cols = a.cols;
      p.k = {};
      for (let r = 0; r < a.rows.length; r++) {
        const ticked = (a.ticks[r] || []).slice().sort((x, y) => x - y).join(',');
        p.k[r] = await H([id, 'grid', String(r), ticked]);
      }
      v.ticks = a.ticks;

    } else if (t === 'hotspot') {
      /* regions on a picture; the answer is the set of regions that should be clicked.
         Labels stay in the vault: a region called "antenna" would answer the question. */
      p.regions = a.regions.map(r => ({ id: r.id, x: r.x, y: r.y, r: r.r || 7 }));
      p.need = a.correct.length;
      p.k = await H([id, 'hotspot', a.correct.slice().sort().join(',')]);
      v.correct = a.correct; v.labels = Object.fromEntries(a.regions.map(r => [r.id, r.label || '']));

    } else {
      throw new Error(id + ': unknown activity type ' + t);
    }

    vault[id] = v;
    s.activities.push(p);
  }
  pub.push(s);
}

/* ---------- the answer vault (only with --vault; never loaded by the site) ---------- */
const kSalt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: kSalt, iterations: ITER, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(vault)));
const b64 = Buffer.from(new Uint8Array(ct)).toString('base64');

writeFileSync(resolve(REPO, 'js/data/glossary.js'),
  '/* GENERATED by tools/build.mjs from labs-shared/glossary.master.js — do not edit.\n' +
  '   The definitions every Biology Lab shares. */\n' +
  'window.GLOSSARY = ' + JSON.stringify(GLOSSARY, null, 1) + ';\n');

writeFileSync(resolve(REPO, 'js/data/stations.js'),
  '/* GENERATED by tools/build.mjs — do not edit.\n' +
  '   Presentation only. The answers are not in this file: each question carries\n' +
  '   a salted hash, which is enough to mark an answer but not to read it. */\n' +
  'window.ANSWER_SALT = ' + JSON.stringify(SALT) + ';\n' +
  'window.STATIONS = ' + JSON.stringify(pub, null, 1) + ';\n');

if (process.argv.includes('--vault')) {
  writeFileSync(resolve(REPO, 'js/data/keys.enc.js'),
    '/* GENERATED by tools/build.mjs --vault — do not edit, and do not add it to index.html. */\n' +
    'window.ANSWER_VAULT = ' + JSON.stringify({ v: 1, iter: ITER, salt: Buffer.from(kSalt).toString('hex'),
      iv: Buffer.from(iv).toString('hex'), ct: b64 }) + ';\n');
}

/* ---------- the size of every photograph ----------
   A picture with no width and height attributes has no height until it arrives, so the
   pins on it pile up in the corner and the page jumps when it loads. The build measures
   each JPEG and ships the sizes, so the browser reserves the right box from the first paint. */
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
      return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}
const SIZES = {};
for (const f of readdirSync(resolve(REPO, 'assets/photos'))) {
  if (!/\.jpg$/.test(f)) continue;
  const wh = jpegSize(readFileSync(resolve(REPO, 'assets/photos', f)));
  if (!wh) continue;
  SIZES[f] = wh;                                   /* keyed by the whole filename: what
                                                      js/engine-ext.js's hotspot pictures use */
  const m = /^(.+)-900\.jpg$/.exec(f);
  if (m) SIZES[m[1]] = wh;                         /* and by the bare base: what picture() uses */
}

/* ---------- every photograph must have all four variants ----------
   <picture> does NOT fall back on a 404. A <source> is chosen on its type and media alone,
   and once chosen a missing file is simply a broken image. So the build refuses to ship a
   base whose .webp or -1400 twin is absent, rather than letting one turn up blank in a lesson.
   Scoped to the bases picture() can actually emit: linnaeus-900.jpg is a peek card only
   (js/terms.js) and has no -1400 and no .webp by design. */
{
  const bases = new Set();
  /* picture() takes its base either from a station's own "img" (no extension) or from a tree
     group that carries a photograph, so ask both sources rather than guessing from filenames. */
  const scope = {};
  new Function('window', readFileSync(resolve(REPO, 'js/tree.js'), 'utf8')).call(scope, scope);
  for (const g of (scope.TREE && scope.TREE.groups) || []) if (g && g.img) bases.add(g.id);
  const st = readFileSync(resolve(REPO, 'js/data/stations.js'), 'utf8');
  for (const m of st.matchAll(/"(?:img|group)"\s*:\s*"([^"]+)"/g)) if (!/\./.test(m[1])) bases.add(m[1]);
  bases.delete('');
  const missing = [];
  for (const b of bases) {
    if (!existsSync(resolve(REPO, 'assets/photos', b + '-900.jpg'))) continue;   /* not a picture() base */
    for (const v of ['-900.jpg', '-1400.jpg', '-900.webp', '-1400.webp'])
      if (!existsSync(resolve(REPO, 'assets/photos', b + v))) missing.push(b + v);
  }
  if (missing.length) throw new Error('these picture variants are missing, and <picture> cannot fall back to a 404:\n  ' + missing.join('\n  '));
  console.log(`  every one of ${bases.size} photograph bases has all four variants`);
}
writeFileSync(resolve(REPO, 'js/data/photos.js'),
  '/* GENERATED by tools/build.mjs — the pixel size of every photograph, so a picture\n' +
  '   reserves its box before it loads and the pins on it never pile up. */\n' +
  'window.PHOTO_SIZE = ' + JSON.stringify(SIZES) + ';\n');

/* ---------- the silhouettes, inlined ----------
   Every PhyloPic vector goes into index.html as a <symbol>, between the SILHOUETTES markers,
   so the tree draws with no extra requests and the page works from a double-click. */
const idxPath = resolve(REPO, 'index.html');
let idx = readFileSync(idxPath, 'utf8');
const manifest = JSON.parse(readFileSync(resolve(REPO, 'assets/silhouettes/manifest.json'), 'utf8'));
/* potrace writes every silhouette at ten times its viewBox size and scales it back down
   with transform="translate(0,H) scale(0.1,-0.1)", so each coordinate carries a decimal
   point's worth of precision that nothing can see: at the 251 px these are drawn, one
   viewBox unit is a fifth of a pixel. Dividing by ten and rounding to whole units takes
   about a third off index.html.

   The one trap: these paths are RELATIVE (l and c), so rounding each delta on its own lets
   the error walk. Every node's position is therefore computed exactly in the original
   coordinates, rounded once, and the delta emitted between ROUNDED positions — so the error
   can never accumulate along a path.

   assets/silhouettes/*.svg are left untouched, so this is always re-runnable and reverting
   these lines is the whole rollback. */
function tidyPath(d) {
  const tok = d.match(/[MmLlCcZz]|-?\d*\.?\d+/g) || [];
  let i = 0, letter = '', out = '', emitted = '';
  let ex = 0, ey = 0;          /* exact position, in the ORIGINAL coordinates */
  let rx = 0, ry = 0;          /* the rounded position we have actually emitted */
  let sx = 0, sy = 0, srx = 0, sry = 0;   /* where the current subpath began */
  const num = () => parseFloat(tok[i++]);
  /* The separator is decided against the WHOLE string so far, never against this command's
     own fragment: a leading positive number after a previous command's trailing number would
     otherwise weld 6 and 7 into 67 and two thirds of a drawing would quietly vanish. A space
     is needed only when the last character is a digit or a dot and this number is positive —
     a minus sign is its own separator, and so is a command letter. */
  const put = (want, list) => {
    if (want !== emitted) { out += want; emitted = (want === 'M' ? 'L' : want === 'm' ? 'l' : want); }
    for (const n of list) {
      if (/[\d.]$/.test(out) && n >= 0) out += ' ';
      out += n;
    }
  };
  /* round an exact original point, emit the delta from where we are, and move */
  const step = (want, pts) => {
    const deltas = [];
    let lrx = rx, lry = ry;
    for (const [px, py] of pts) {
      const nrx = Math.round(px / 10), nry = Math.round(py / 10);
      deltas.push(nrx - lrx, nry - lry);
    }
    const last = pts[pts.length - 1];
    put(want, deltas);
    ex = last[0]; ey = last[1];
    rx = Math.round(ex / 10); ry = Math.round(ey / 10);
  };
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) letter = tok[i++];
    if (i >= tok.length && !/[Zz]/.test(letter)) break;
    switch (letter) {
      case 'M': case 'm': {
        const x = num(), y = num();
        ex = letter === 'm' ? ex + x : x; ey = letter === 'm' ? ey + y : y;
        rx = Math.round(ex / 10); ry = Math.round(ey / 10);
        sx = ex; sy = ey; srx = rx; sry = ry;
        put('M', [rx, ry]);
        letter = letter === 'm' ? 'l' : 'L';
        break;
      }
      case 'L': case 'l': {
        const x = num(), y = num();
        step('l', [[letter === 'l' ? ex + x : x, letter === 'l' ? ey + y : y]]);
        break;
      }
      case 'C': case 'c': {
        const rel = letter === 'c', bx = ex, by = ey, pts = [];
        for (let k = 0; k < 3; k++) { const x = num(), y = num(); pts.push([rel ? bx + x : x, rel ? by + y : y]); }
        step('c', pts);
        break;
      }
      case 'Z': case 'z':
        out += 'z'; emitted = 'z';
        ex = sx; ey = sy; rx = srx; ry = sry;
        break;
      default: i++;             /* a command this lab has never produced: skip it */
    }
  }
  return out;
}
const symbols = Object.keys(manifest).map(name => {
  const svg = readFileSync(resolve(REPO, 'assets/silhouettes', name + '.svg'), 'utf8');
  const vb = /viewBox="([^"]+)"/.exec(svg)[1];
  const [, , vbw, vbh] = vb.trim().split(/[\s,]+/).map(Number);
  const tf = /transform="translate\(([\d.]+),([\d.]+)\) scale\(([\d.-]+),([\d.-]+)\)"/.exec(svg);
  if (!tf || Math.abs(+tf[3] - 0.1) > 1e-9 || Math.abs(+tf[4] + 0.1) > 1e-9)
    throw new Error(name + '.svg is not the potrace shape this build knows how to shrink');
  const ds = [...svg.matchAll(/<path\b[^>]*\sd="([^"]*)"/g)].map(m => m[1]);
  if (!ds.length) throw new Error(name + '.svg has no path data');
  const paths = ds.map(d => '<path d="' + tidyPath(d) + '"/>').join('');
  /* The viewBox is ALREADY in final units — it is the path coordinates that are ten times
     too big, which is what the scale(0.1) in the source undoes. So the viewBox is kept and
     only the numbers inside the paths shrink. */
  return '<symbol id="s-' + name + '" viewBox="0 0 ' + Math.round(vbw) + ' ' + Math.round(vbh) + '">' +
         '<g transform="translate(0,' + Math.round(vbh) + ') scale(1,-1)">' + paths + '</g></symbol>';
});
const block = '<!-- SILHOUETTES:START -->\n' + symbols.join('\n') + '\n<!-- SILHOUETTES:END -->';
if (!/<!-- SILHOUETTES:START -->[\s\S]*?<!-- SILHOUETTES:END -->/.test(idx)) throw new Error('index.html has no SILHOUETTES markers');
idx = idx.replace(/<!-- SILHOUETTES:START -->[\s\S]*?<!-- SILHOUETTES:END -->/, () => block);

/* One stamp, set here, so a deploy cannot ship new JS behind an old ?v=. The stamp in
   index.html IS the cache key: bumping version.txt alone changes nothing a browser fetches. */
const STAMP = String(Math.floor(Date.now() / 1000));
writeFileSync(resolve(REPO, 'version.txt'), STAMP + '\n');
const nStamp = (idx.match(/\.(?:js|css)\?v=\d+/g) || []).length;
if (!nStamp) throw new Error('index.html has no ?v= stamps to bump — cache busting would be silent');
writeFileSync(idxPath, idx.replace(/(\.(?:js|css))\?v=\d+/g, `$1?v=${STAMP}`));

const SW_LAB = 'classification-lab';
const SW_TEMPLATE = resolve(SHARED, 'sw.template.js');

/* ---------- the offline worker ----------
   Its manifest is read back out of the index.html this build has JUST stamped, so a stale
   file behind a new page is impossible by construction: if it is not in the HTML, the worker
   does not precache it, and if the HTML says v=N then so does the worker.

   `node tools/build.mjs --no-sw` leaves sw.js alone, which is what a kill-switch deploy needs
   until every device has loaded the site once. */
if (!process.argv.includes('--no-sw')) {
  const stamped = readFileSync(idxPath, 'utf8');
  const assets = [...stamped.matchAll(/(?:src|href)="([^":]+?\.(?:js|css))\?v=(\d+)"/g)];
  const wrong = assets.filter(m => m[2] !== STAMP);
  if (wrong.length) throw new Error('index.html still carries old stamps: ' + wrong.map(m => m[1] + '?v=' + m[2]).join(', '));
  const PRECACHE = assets.map(m => './' + m[1] + '?v=' + m[2]);
  if (PRECACHE.length < 3) throw new Error('only ' + PRECACHE.length + ' assets found for the worker — the regex has stopped matching');

  /* every picture, keyed by a hash of its own bytes. Video is left out on purpose: it is
     served with Range requests, which the worker never touches. */
  const MEDIA_REV = {};
  let mediaBytes = 0;
  (function walkAssets(dir) {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) { walkAssets(full); continue; }
      if (/\.(mp4|webm|mov|md|json)$/i.test(f)) continue;
      const buf = readFileSync(full);
      MEDIA_REV[relative(resolve(REPO, 'assets'), full).split('\\').join('/')] =
        createHash('sha1').update(buf).digest('hex').slice(0, 8);
      mediaBytes += buf.length;
    }
  })(resolve(REPO, 'assets'));

  const tpl = readFileSync(SW_TEMPLATE, 'utf8')
    .replace('__LAB__', SW_LAB)
    .replace('__VERSION__', STAMP)
    .replace('__PRECACHE__', JSON.stringify(PRECACHE))
    .replace('__MEDIA_REV__', JSON.stringify(MEDIA_REV));
  if (/__[A-Z_]+__/.test(tpl)) throw new Error('sw.template.js has a placeholder this build does not fill: ' + /__[A-Z_]+__/.exec(tpl)[0]);
  writeFileSync(resolve(REPO, 'sw.js'), tpl);
  console.log(`  sw.js                 ${PRECACHE.length} stamped files + ${Object.keys(MEDIA_REV).length} pictures (${(mediaBytes/1024/1024).toFixed(1)} MB), version ${STAMP}`);
} else {
  console.log('  sw.js                 LEFT ALONE (--no-sw)');
}
console.log(`built ${pub.length} stations, ${nAct} activities`);
console.log(`  js/data/stations.js   presentation + hashes (no answers)`);
console.log(`  js/data/glossary.js   ${GLOSSARY.length} shared definitions`);
console.log(`  js/data/photos.js     ${Object.keys(SIZES).length} picture sizes`);
console.log(`  shared engine, marking, tree, tree-draw and ${symbols.length} silhouettes copied in`);
console.log(`  index.html + version.txt  stamped ${STAMP} (${nStamp} assets)`);

/* ---------- the marking gate ----------
   The build writes the answer hashes; js/marking.js hashes what a student does. If those two
   ever disagree — a canonical form edited in one and not the other — every question of that
   type marks wrong, silently, for everybody. So before this build is called finished, run
   every master answer through the SHIPPED marking.js and the stations.js just written, and
   refuse the build if a single one comes back wrong. */
{
  const gate = resolve(SHARED, 'marking-gate.mjs');
  if (existsSync(gate)) {
    try {
      const out = execFileSync('node', [gate, REPO, MASTER], { encoding: 'utf8' }).trim();
      const wrong = Number((out.match(/wrong:\s*(\d+)/) || [])[1] ?? -1);
      if (wrong !== 0) { console.error('\n  MARKING GATE FAILED — ' + out); process.exit(1); }
      console.log('  marking gate           ' + out.replace(/^.*=>\s*/, ''));
    } catch (e) {
      console.error('\n  MARKING GATE FAILED\n' + (e.stdout || '') + (e.stderr || e.message));
      process.exit(1);
    }
  } else {
    console.error('  marking gate MISSING at ' + gate + ' — cannot prove the answers still mark.');
    process.exit(1);
  }
}

