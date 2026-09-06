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
import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, mkdirSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

/* ---------- the silhouettes, inlined ----------
   Every PhyloPic vector goes into index.html as a <symbol>, between the SILHOUETTES markers,
   so the tree draws with no extra requests and the page works from a double-click. */
const idxPath = resolve(REPO, 'index.html');
let idx = readFileSync(idxPath, 'utf8');
const manifest = JSON.parse(readFileSync(resolve(REPO, 'assets/silhouettes/manifest.json'), 'utf8'));
const symbols = Object.keys(manifest).map(name => {
  const svg = readFileSync(resolve(REPO, 'assets/silhouettes', name + '.svg'), 'utf8');
  const vb = /viewBox="([^"]+)"/.exec(svg)[1];
  let inner = svg.slice(svg.indexOf('<g'), svg.lastIndexOf('</svg>'));
  inner = inner.replace(/<metadata>[\s\S]*?<\/metadata>/g, '').replace(/fill="#000000"/g, '').replace(/stroke="none"/g, '');
  return '<symbol id="s-' + name + '" viewBox="' + vb + '">' + inner.trim() + '</symbol>';
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

console.log(`built ${pub.length} stations, ${nAct} activities`);
console.log(`  js/data/stations.js   presentation + hashes (no answers)`);
console.log(`  js/data/glossary.js   ${GLOSSARY.length} shared definitions`);
console.log(`  shared engine, marking, tree, tree-draw and ${symbols.length} silhouettes copied in`);
console.log(`  index.html + version.txt  stamped ${STAMP} (${nStamp} assets)`);
