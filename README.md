# Classification Lab

An interactive lab on **Cambridge IGCSE Biology 0610, Topic 1 — Characteristics and classification of
living organisms**.

**Live:** https://mompel226.github.io/classification-lab/

**Where it sits:** the first lab behind the [Life on Earth Hub](https://mompel226.github.io/life-on-earth-hub/),
one shelf of the [Biology Hub](https://mompel226.github.io/biology-hub/), the front door to every Biology
app at NLCS Jeju. The "← Life on Earth" button in the header goes back up to the shelf. A group clicked
on the hub's tree opens this lab on that group (`#mammals`, `#insects` …); a station has its own link
too (`#keys`, `#drawing`).

The hub is the introduction; this is the theory. The same tree of life sits on the left, drawn by the
same code, and lights whatever the open station is about. Click any branch and the station that teaches
that group opens, scrolled to it.

---

## What is in it

**10 stations**, in the order the topic is taught: Alive? (the seven characteristics, MRS GREN) ·
Naming and grouping (species, the binomial system, features) · DNA and the tree (Supplement: evolutionary
relationships, base sequences) · Keys (using and building dichotomous keys) · Five kingdoms ·
Vertebrates · Arthropods · Plants (ferns, monocots, dicots) · Viruses · Drawing a specimen (the Paper 6
skill and his assessed arthropod drawing).

**Nothing in Learn is only read.** Between the syllabus sentences sit things to press:

| Widget | What the student does |
|---|---|
| MRS GREN letters | opens each characteristic: an animation, the definition with its key words underlined, and the first word to remember |
| Feature finder | finds the numbered features on a real photograph of the group — feathers, cephalothorax, fronds |
| DNA alignment | a MEGA-style viewer: show identical bases as dots, mark the differences, count them, rank the relatives |
| Key runner | runs a dichotomous key one step at a time on a pictured specimen, beside the same key printed |
| Name builder | types a genus and species and watches the four rules check themselves |
| Kingdom cards | opens a kingdom, which lights on the tree, and shows its four cell questions |
| Drawing pairs | a leaf and a beetle each drawn twice: click the six faults on the one that would not score |

**61 questions** across nine kinds: fill the gaps, multiple choice, put in order, match up, sort into
groups, drag & drop, and two new to this lab — **tick the grid** (Am I alive? · which group has what) and
**find it on the picture** (click the features on a photograph, or the faults on a drawing). A question can
show a DNA alignment, a printed key or a drawing beside its prompt.

Every photograph is public domain, CC0 or CC BY, credited under the picture and in
`assets/photos/CREDITS.md`. The silhouettes are PhyloPic, CC0.

Progress is saved in the browser. **Reset** clears it.

## How it works

Check as often as you like. You are told which parts are wrong, **never the answer**. Keep going until
every question is right, then hand in; a part-way hand-in is recorded as progress. A hand-in is
attributed by Google sign-in and posted to the shared Apps Script (`payload.app = "classification-lab"`,
which needs a row in the script's `LABS` table); everyone gets a completion code (`CL-…`) either way.

## How the answers are kept out of the page

Every question carries a **salted SHA-256 hash** of its correct answer — enough to mark, not to read.
There is no mode that reveals an answer. The grid is hashed row by row, so a wrong row is named but
never corrected; a picture question hashes the set of regions, and the region names stay in the master.

The only file with the answers in plain text is **`../classification-lab-source/stations.master.js`**,
outside this repo. Edit it, then:

```bash
node tools/build.mjs
```

which regenerates `js/data/stations.js` (presentation + hashes) and `js/data/glossary.js`, copies in
the shared files, inlines the silhouettes, and stamps `index.html` and `version.txt` from one value.

## What is shared, and where it lives

| In this repo | The source, edited there and copied in by the build |
|---|---|
| `js/engine.js`, `js/marking.js` | `labs-shared/engine/` — the activity engine and marking every lab runs |
| `js/tree.js`, `js/tree-draw.js`, `assets/silhouettes/` | `labs-shared/tree/` — the tree of life, shared with the Life on Earth Hub |
| `js/data/glossary.js` | `labs-shared/glossary.master.js` — one definition per term, for every lab |

`labs-shared/` must stay an ancestor of this folder with exactly that name, and
`classification-lab-source/` a sibling. Do not edit the copied files here: the next build overwrites them.

This lab's own files: `js/app.js` (wiring, progress, hand-in), `js/plate.js` (the tree as the plate),
`js/learn.js` (the widgets and the drawings), `js/engine-ext.js` (grid, hotspot, and what a question can
show), `js/terms.js` (the colour language), `css/app.css`.

## Local preview

```bash
python3 -m http.server 8753
```

then open http://localhost:8753/. The `.claude/launch.json` starts the same server.

---

Made by **Dr Daniel Mompel Riera**, Biology, NLCS Jeju. Questions or corrections: dmompelriera@nlcsjeju.kr
