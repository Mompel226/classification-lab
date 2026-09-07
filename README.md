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
| Feature finder | finds the numbered pins on a close photograph of the group; a found feature is named in the column beside the picture and joined to its pin by a ruled line, so nothing is written over the animal; the four arthropod groups also carry a labelled diagram of the body plan |
| DNA alignment | a MEGA-style viewer: show identical bases as dots, mark the differences, count them, rank the relatives |
| Key runner | runs a dichotomous key one step at a time on a pictured specimen, beside the same key printed |
| Name builder | the five rules for writing a scientific name, checking themselves as the student types a genus and species |
| Kingdom cards | opens a kingdom, which lights on the tree, and shows its four cell questions |
| Drawings, twice | Dr Mompel's own photographs of an orange slice drawn badly and then well: click the seven faults on the first, read what the second did instead |

**64 questions** across nine kinds: fill the gaps, multiple choice, put in order, match up, sort into
groups, drag & drop, and two new to this lab — **tick the grid** (Am I alive? · which group has what) and
**find it on the picture** (click the features on a photograph, or the faults on a drawing). A question can
show a DNA alignment or a printed key beside its prompt.

Every photograph is public domain, CC0 or CC BY, credited under the picture and in
`assets/photos/CREDITS.md`; the two drawings are his. The silhouettes are PhyloPic, CC0.

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

## How a station knows its saved answers are still valid

A saved answer is filed by the question's POSITION in the station, and positions are not
stable. So each station's record carries a fingerprint of the question set it was made
against — the number of questions and their types, in order. If that changes, the record is
dropped and the station is answered again: losing one station's answers is a far smaller harm
than handing in a score that was never earned.

The fingerprint was once the FIRST LETTER of each type, which could not tell `mcq` from
`match` — five of these ten stations mix them. That is closed: the whole type name is
recorded, and any record still written in the old form no longer matches and is dropped.

## About the pictures

Every photograph ships as four files: `<base>-900.jpg`, `-1400.jpg`, `-900.webp`, `-1400.webp`.
`picture()` in `js/learn.js` wraps them in a `<picture>`, so a browser that can decode WebP
takes about a third off every photograph and one that cannot keeps the JPEG.

**`<picture>` does not fall back on a 404.** A `<source>` is chosen on its type and media
alone; once chosen, a missing file is a broken image. So `tools/build.mjs` refuses to build if
any base is missing one of its four variants. After adding a photograph, make all four.

The silhouettes in `index.html` are generated: `tools/build.mjs` divides potrace's ten-times
coordinates down to whole viewBox units, which takes a third off the HTML. The sources in
`assets/silhouettes/` are never touched, so it is always re-runnable — reverting the six lines
in `build.mjs` is the whole rollback. The sprite lives after the `<script>` tags, not inside
`<svg id="tree">`: in front of them it stood between the browser and the 13 script URLs.

## Offline

`sw.js` is generated by `tools/build.mjs` from `labs-shared/sw.template.js` and registered by
a small inline script at the foot of `index.html`. Its scope is this lab's own folder, so it
can never touch the other labs, the hubs or the sims — which share the origin.

**The HTML document is fetched network-first.** While a student is online they see the live
page exactly as they would with no worker, and a deploy reaches them on their next reload —
verified. The cache is only the fall-back for when the network is not there. That is what
makes this safe on GitHub Pages, where we cannot set response headers and so cannot dig a
browser out of a stale copy. Everything else is cache-first, safely, because every other URL
carries a `?v=` stamp or a content hash and so changes whenever its file does.

If it ever has to go:

```
cp ../../labs-shared/sw-killswitch.js sw.js
git add sw.js && git commit -m "Kill switch" && git push
```

then build with `node tools/build.mjs --no-sw` until every device has loaded the site once.
The switch has been rehearsed at a `/<lab>/` path with both labs registered: it removes only
this lab's caches, unregisters itself, and the lab keeps working without it. Rehearse it at a
subpath, never at a localhost root — the prefix comes from the scope, so at a root it deletes
nothing while appearing to work.

## Local preview

```bash
python3 -m http.server 8753
```

then open http://localhost:8753/. The `.claude/launch.json` starts the same server.

---

Made by **Dr Daniel Mompel Riera**, Biology, NLCS Jeju. Questions or corrections: dmompelriera@nlcsjeju.kr
