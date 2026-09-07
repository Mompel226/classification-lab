<div align="center">

<h1>🌳 &nbsp;Classification Lab</h1>

**Cambridge IGCSE Biology 0610 · Topic 1 — Characteristics and classification**

[![Open the lab](https://img.shields.io/badge/▶_Open_the_lab-0969DA?style=for-the-badge&logoColor=white)](https://mompel226.github.io/classification-lab/)

![10 stations](https://img.shields.io/badge/10-stations-3D7A54)
![64 questions](https://img.shields.io/badge/64-questions-8F5D09)
![Marks itself](https://img.shields.io/badge/questions-mark_themselves-0B6A8C)
![No sign-up](https://img.shields.io/badge/students-no_sign--up_needed-6FA287)

by **Dr Daniel Mompel Riera** · NLCS Jeju

</div>

![The Classification Lab: the tree of life on the left, a station open on the right](docs/img/screen.jpg)

---

## What a student does

Click a branch of the tree and work through that group: the features that put an organism
there, in the wording the exam wants, and questions that say right or wrong — never the answer.

|  |  |
|---|---|
| 🌳 **10 stations** | alive? · naming and grouping · DNA and the tree · keys · the five kingdoms · vertebrates · arthropods · plants · viruses · the drawings |
| 🔑 **Dichotomous keys** | use one to name an organism, then **build** one — a Paper 6 skill you can practise nowhere else |
| ✍️ **64 questions** | fill the gaps · drag & drop · multiple choice · put in order · match up · sort into groups · **tick a grid** · **click the picture** |
| ✏️ **Biological drawing** | pairs of drawings of the same specimen, one that scores and one that does not — decide which, and why |
| 🐛 **Real organisms** | photographs to look at and count from: limbs, wings, antennae, body sections |
| 📖 **A shared glossary** | one wording per term, the same in every lab |

> [!NOTE]
> **The answers are not in the page — at all.** The lab can tell a student they are wrong, but
> nothing in it knows what *right* is. There is no setting that reveals the answers, because
> there is nothing to reveal. How that works is explained below.

## Where it sits

Behind the [Life on Earth Hub](https://mompel226.github.io/life-on-earth-hub/), one shelf of the
[Biology Hub](https://mompel226.github.io/biology-hub/) — the front door to every Biology app
here. The **← Life on Earth** button goes back up, and a group on that hub's tree opens the
matching station here.

> [!TIP]
> **Want your students' scores in a spreadsheet of your own?**
> Set it up once, for every lab at the same time:
> **[Would you like to see how your students are doing?](https://github.com/Mompel226/biology-hub#-would-you-like-to-see-how-your-students-are-doing)**

<details>
<summary><b>Behind the scenes</b> — how this lab works, in plain English</summary>

<br>

**One tree, two places.** The tree of life is not a picture — it is drawn by the page from a
single written description of the groups: what belongs under what, and the features of each.
That same description is used by the [Life on Earth Hub](https://mompel226.github.io/life-on-earth-hub/),
so both draw exactly the same tree and correcting it once corrects it in both. The little animal
silhouettes come from PhyloPic, are free to use, and are built into the page so it opens without
fetching anything.

**Why the answers are not in the page.** This is the part worth understanding.

Anything a web page can show, a student can find by digging around in it. So the answers are
never sent to the student at all. Instead, each question carries a *scrambled fingerprint* of
its answer. When a student answers, the page scrambles what they did in exactly the same way and
compares the two fingerprints. The same answer always makes the same fingerprint, so a match
means they were right.

Scrambling only works one way — you cannot start from a fingerprint and work back to the answer.
So nothing in the page can say what the right answer is. It can only ever say *not that one*.

The real answers live in one file on my own computer, which is never published.

**Two kinds of question that only this lab has.** Ticking a grid of features, and clicking the
right part of a photograph. The machinery that runs questions is shared with every other lab, so
rather than making a private copy of it (which would then need fixing twice for ever), this lab
*adds* its two new kinds onto the shared machinery when it loads. Any future lab can add its own
the same way.

**What is shared with the other labs.** Drawing a question, handling the dragging, the marking,
the glossary and the tree are all kept in one place and copied in whenever a lab is rebuilt, so
a fix reaches every lab at once. What belongs to this lab alone is its content: the 10 stations,
the 64 questions, and the pictures.

**Rebuilding it** (only needed if you change the content). One command reads the master file
with the answers in it and writes out the published version with only the fingerprints. It
refuses to finish unless every answer still marks correctly.

```
node tools/build.mjs
```

**Copying it for your own school.** Everything the page needs is in this repository, so a copy
runs straight away. You cannot change the questions, because the file with the answers was never
published. If you just want to use the lab, send your students the link — there is nothing to
copy.

Picture credits: [`assets/photos/CREDITS.md`](assets/photos/CREDITS.md) and
[`assets/silhouettes/manifest.json`](assets/silhouettes/manifest.json).

</details>

Made by **Dr Daniel Mompel Riera** · Biology, NLCS Jeju ·
[dmompelriera@nlcsjeju.kr](mailto:dmompelriera@nlcsjeju.kr)
