/* ============================================================
   terms.js — the colour language of the Learn tab, for Topic 1.

   · The seven characteristics are the spine of 1.1, so each wears a chip carrying
     its letter of MRS GREN. One ink for all seven: the letter, not the hue, tells
     them apart, and a student who cannot separate colours still reads M R S G R E N.
   · A group name is coloured by its kingdom, the same five the tree lights, so the
     colour on the paper is the colour on the water. Viruses stay grey: no kingdom.
   · Words about naming — species, genus, binomial — are one more ink.
   · Green is the app's own colour and means nothing in the text.
   · A word with a definition but no colour of its own carries the quiet dotted rule.
   Same API as the Digestion Lab's terms.js, so app.js is the same code.
   ============================================================ */
(function (global) {
  'use strict';

  var CATS = {
    movement:     { n:'M', label:'Movement',     chip:true },
    respiration:  { n:'R', label:'Respiration',  chip:true },
    sensitivity:  { n:'S', label:'Sensitivity',  chip:true },
    growth:       { n:'G', label:'Growth',       chip:true },
    reproduction: { n:'R', label:'Reproduction', chip:true },
    excretion:    { n:'E', label:'Excretion',    chip:true },
    nutrition:    { n:'N', label:'Nutrition',    chip:true },
    animals:      { n:'', label:'Animals',      chip:false },
    plants:       { n:'', label:'Plants',       chip:false },
    fungi:        { n:'', label:'Fungi',        chip:false },
    prokaryotes:  { n:'', label:'Prokaryotes',  chip:false },
    protoctists:  { n:'', label:'Protoctists',  chip:false },
    viruses:      { n:'', label:'Viruses — no kingdom', chip:false },
    naming:       { n:'', label:'Naming and grouping', chip:false },
    plain:        { n:'', label:'Words used across the labs', chip:false }
  };

  /* only the seven nouns wear a chip; "moves" or "growing" in a sentence stay plain */
  var CHIP_WORDS = {
    movement:['movement'], respiration:['respiration'], sensitivity:['sensitivity'], growth:['growth'],
    reproduction:['reproduction'], excretion:['excretion'], nutrition:['nutrition']
  };

  var PLAIN_WORDS = {
    animals: ['animal','animals','animal kingdom','vertebrate','vertebrates','arthropod','arthropods','mammal','mammals','bird','birds',
              'reptile','reptiles','amphibian','amphibians','fish','fishes','myriapod','myriapods','insect','insects','arachnid','arachnids',
              'crustacean','crustaceans','centipede','centipedes','millipede','millipedes','spider','spiders','crab','crabs'],
    plants:  ['plant','plants','plant kingdom','fern','ferns','flowering plant','flowering plants','monocotyledon','monocotyledons','monocot','monocots',
              'dicotyledon','dicotyledons','dicot','dicots','cotyledon','cotyledons','frond','fronds'],
    fungi:   ['fungus','fungi','fungal','hypha','hyphae','mycelium','yeast','mould','moulds','mushroom','mushrooms','saprophyte','saprophytes','saprotroph','saprotrophs'],
    prokaryotes: ['prokaryote','prokaryotes','prokaryotic','bacterium','bacteria','bacterial','plasmid','plasmids','circular dna'],
    protoctists: ['protoctist','protoctists','amoeba','paramecium','alga','algae','plasmodium','seaweed','seaweeds'],
    viruses: ['virus','viruses','protein coat','host cell','host cells'],
    naming:  ['species','genus','genera','binomial system','binomial','binomial name','binomial names','scientific name','scientific names',
              'classification','classification system','classification systems','classify','classified','classifying',
              'dichotomous key','dichotomous keys','kingdom','kingdoms','taxonomy','taxon','taxa','phylum','phyla','class','order','family',
              'evolutionary relationships','evolutionary relationship','common ancestor','ancestor','ancestry','linnaeus','dna','base sequence','base sequences','bases',
              'five kingdoms','fertile offspring','interbreed'],
    plain:   ['cell wall','cell walls','nucleus','nuclei','chloroplast','chloroplasts','cellulose','chitin','photosynthesis','morphology','anatomy',
              'autotrophic nutrition','heterotrophic nutrition','saprotrophic nutrition','parasitic nutrition','autotrophic','heterotrophic','saprotrophic','autotroph','autotrophs','heterotroph','heterotrophs',
              'spore','spores','magnification','specimen','specimens','metabolism','dry mass','stimulus','stimuli','organism','organisms',
              'feature','features','characteristic','characteristics','exoskeleton','backbone','antenna','antennae','compound eye','compound eyes',
              'cephalothorax','abdomen','thorax','scales','feathers','fins','gills','lungs','moist skin','lateral line','segment','segments','segmented',
              'jointed legs','jointed limbs','wings','cilia','flagellum','flagella','habitat','xylem','phloem','sporangium','sporangia','fiddlehead',
              'parallel veins','network of veins','net-like veins','waterproof','internal fertilisation','external fertilisation','warm-blooded','cold-blooded',
              'mammary glands','milk','multicellular','unicellular','single-celled','parasite','parasites','pathogen','pathogens']
  };

  /* --------- what happens when you click a term ---------
     peek : a small picture appears where you clicked — for a feature you need to SEE
     jump : go to the station where the word is properly explained
     A term does one or the other, never both. The pictures are the tree's own photographs,
     credited from js/tree.js, so a feature word opens the group that shows it. */
  var TREE = global.TREE || { groups:[] };
  var IMG = {};
  (TREE.groups || []).concat(TREE.viruses ? [TREE.viruses] : []).forEach(function (g) { if (g.img) IMG[g.id] = g; });
  function pic(gid, note) {
    var g = IMG[gid]; if (!g) return null;
    return [gid + '-900.jpg', note, g.img.credit];
  }
  var PEEK = {};
  [
    ['frond', 'ferns', '<b>Fronds</b>: the leaves of a fern. Spores are made in sporangia on the underside.'],
    ['fronds', 'ferns', '<b>Fronds</b>: the leaves of a fern. Spores are made in sporangia on the underside.'],
    ['fiddlehead', 'ferns', 'A young frond, still unrolling: the <b>fiddlehead</b>.'],
    ['exoskeleton', 'arthropods', 'The <b>exoskeleton</b>: a hard skeleton on the outside, jointed so the animal can move. It cannot grow, so an arthropod moults.'],
    ['compound eye', 'insects', '<b>Compound eyes</b>: many small lenses, each pointing a slightly different way. Insects have them; spiders do not.'],
    ['compound eyes', 'insects', '<b>Compound eyes</b>: many small lenses, each pointing a slightly different way. Insects have them; spiders do not.'],
    ['antennae', 'insects', '<b>Antennae</b>: feelers on the head, for touch and smell. One pair in insects and myriapods, two pairs in crustaceans, none in arachnids.'],
    ['cephalothorax', 'arachnids', 'The <b>cephalothorax</b>: an arachnid’s head and thorax fused into one part, carrying all eight legs. The abdomen is the second part.'],
    ['scales', 'reptiles', 'Dry <b>scales</b>: a waterproof skin, which is why reptiles can live and lay their eggs on dry land.'],
    ['feathers', 'birds', '<b>Feathers</b>, and front limbs that are wings. No other group has feathers.'],
    ['fins', 'fish', '<b>Fins</b> and wet scales; gills for breathing under water.'],
    ['gills', 'fish', '<b>Gills</b> take oxygen from water. Fish keep them all their lives; amphibians only as larvae.'],
    ['moist skin', 'amphibians', 'A smooth, <b>moist skin</b> that also takes in oxygen. It dries out, so amphibians stay near water and lay their eggs in it.'],
    ['hyphae', 'fungi', 'Most fungi are threads called <b>hyphae</b>, growing through what they feed on. The mushroom is the part that makes the spores.'],
    ['mycelium', 'fungi', 'A <b>mycelium</b> is the mass of hyphae that makes up the body of a fungus, mostly hidden in the soil or the food.'],
    ['cilia', 'protoctists', '<b>Cilia</b>: rows of tiny hairs that beat to move a Paramecium through the water.'],
    ['plasmids', 'prokaryotes', 'Small extra rings of DNA in a bacterium: <b>plasmids</b>. The main DNA is one circle, free in the cytoplasm.'],
    ['protein coat', 'viruses', 'A virus is genetic material inside a <b>protein coat</b>, and nothing else. No cytoplasm, no membrane, no cell.']
  ].forEach(function (e) { var p = pic(e[1], e[2]); if (p) PEEK[e[0]] = p; });

  var JUMP = {};
  function jump(list, st) { list.forEach(function (w) { JUMP[w] = st; }); }
  jump(['movement','respiration','sensitivity','growth','reproduction','excretion','nutrition','characteristics','characteristic','metabolism','dry mass','stimulus','stimuli'], 'alive');
  jump(['species','genus','genera','binomial system','binomial','binomial name','binomial names','scientific name','scientific names','classification','classification system',
        'classification systems','classify','classified','classifying','taxonomy','taxon','taxa','phylum','phyla','class','order','family','linnaeus','fertile offspring','interbreed','feature','features','morphology','anatomy'], 'naming');
  jump(['dna','base sequence','base sequences','bases','evolutionary relationships','evolutionary relationship','common ancestor','ancestor','ancestry'], 'dna');
  jump(['dichotomous key','dichotomous keys'], 'keys');
  jump(['kingdom','kingdoms','five kingdoms','animal','animals','animal kingdom','plant kingdom','fungus','fungi','fungal','prokaryote','prokaryotes','prokaryotic','bacterium','bacteria','bacterial',
        'protoctist','protoctists','amoeba','paramecium','alga','algae','plasmodium','saprophyte','saprophytes','saprotroph','saprotrophs','yeast','mould','moulds','mushroom','mushrooms',
        'cell wall','cell walls','nucleus','nuclei','chloroplast','chloroplasts','cellulose','chitin','multicellular','unicellular','single-celled','circular dna',
        'autotrophic nutrition','heterotrophic nutrition','saprotrophic nutrition','parasitic nutrition','autotrophic','heterotrophic','saprotrophic','autotroph','autotrophs','heterotroph','heterotrophs','photosynthesis'], 'kingdoms');
  jump(['vertebrate','vertebrates','mammal','mammals','bird','birds','reptile','reptiles','amphibian','amphibians','fish','fishes','backbone','lungs','warm-blooded','cold-blooded','mammary glands','milk','lateral line','internal fertilisation','external fertilisation'], 'vertebrates');
  jump(['arthropod','arthropods','myriapod','myriapods','insect','insects','arachnid','arachnids','crustacean','crustaceans','centipede','centipedes','millipede','millipedes','spider','spiders','crab','crabs','abdomen','thorax','segment','segments','segmented','jointed legs','jointed limbs','wings'], 'arthropods');
  jump(['plant','plants','fern','ferns','flowering plant','flowering plants','monocotyledon','monocotyledons','monocot','monocots','dicotyledon','dicotyledons','dicot','dicots','cotyledon','cotyledons',
        'spore','spores','sporangium','sporangia','xylem','phloem','parallel veins','network of veins','net-like veins'], 'plants');
  jump(['virus','viruses','host cell','host cells','pathogen','pathogens','parasite','parasites'], 'viruses');
  jump(['magnification','specimen','specimens'], 'drawing');

  /* --------- build one matcher, longest phrase first --------- */
  var ENTRIES = [];
  Object.keys(CHIP_WORDS).forEach(function (cat) { CHIP_WORDS[cat].forEach(function (w) { ENTRIES.push([w, cat, true]); }); });
  Object.keys(PLAIN_WORDS).forEach(function (cat) { PLAIN_WORDS[cat].forEach(function (w) { ENTRIES.push([w, cat, false]); }); });
  ENTRIES.sort(function (a, b) { return b[0].length - a[0].length; });

  var DEFINED = {};
  (global.GLOSSARY || []).forEach(function (e) { DEFINED[e.term.toLowerCase()] = e.term; });

  var KNOWN = {};
  var KNOWN_KEY = 'labs.knownWords.v1';
  try { (JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]') || []).forEach(function (w) { KNOWN[w] = 1; }); } catch (e) {}
  function saveKnown() { try { localStorage.setItem(KNOWN_KEY, JSON.stringify(Object.keys(KNOWN))); } catch (e) {} }
  function setKnown(term, yes) { var low = String(term).toLowerCase(); if (yes) KNOWN[low] = 1; else delete KNOWN[low]; saveKnown(); }
  function isKnown(term) { return !!KNOWN[String(term).toLowerCase()]; }
  function forgetAll() { KNOWN = {}; saveKnown(); }
  function knownCount() { return Object.keys(KNOWN).length; }

  var INFO = {};
  ENTRIES.forEach(function (e) { if (!INFO[e[0].toLowerCase()]) INFO[e[0].toLowerCase()] = e; });

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var RE = new RegExp('(?<![A-Za-z0-9-])(' + ENTRIES.map(function (e) { return escRe(e[0]); }).join('|') + ')(?![A-Za-z0-9-])', 'gi');

  var here = null, seen = null, quiet = false;
  function setStation(id) { here = id; seen = Object.create(null); quiet = false; }
  function setQuiet(v) { quiet = !!v; }

  /* _like this_ underlines a phrase the syllabus wants written; the sentinels keep the
     glossary pass off it, and a term inside it comes out plain */
  var U0 = '\u0001', U1 = '\u0002';
  /* The cap is a guard against a stray underscore swallowing a paragraph, not a length rule:
     it was 90, which silently left the respiration definition (99 characters) with its
     underscores printed on the page. Long syllabus wordings are exactly what this marks. */
  function underlineMarks(escaped) { return escaped.replace(/_([^_\n]{1,240})_/g, U0 + '$1' + U1); }
  function underlineTags(html) {
    return html.replace(new RegExp(U0 + '([\\s\\S]*?)' + U1, 'g'), function (m, inner) {
      return '<u class="syl-u">' + inner.replace(/<i class="tc__n">[^<]*<\/i>/g, '').replace(/<\/?[bi][^>]*>/g, '') + '</u>';
    });
  }

  function mark(text) {
    return underlineTags(underlineMarks(esc(text)).replace(RE, function (m) {
      var low = m.toLowerCase(), e = INFO[low];
      if (!e) return m;
      var cat = e[1], act = '', cls = '';
      var first = !quiet && !(seen && seen[low]);
      if (seen) seen[low] = true;
      if (!first) return m;
      if (PEEK[low]) {
        act = ' data-peek="' + PEEK[low][0] + '" data-note="' + esc(PEEK[low][1]) + '"' +
              (PEEK[low][2] ? ' data-credit="' + esc(PEEK[low][2]) + '"' : '') + ' tabindex="0" role="button"';
        cls = ' is-peek';
      } else if (JUMP[low] === here) {
        /* the station being read is the one that teaches this word: no link, no glossary
           marker — the widget below it is where the definition is learnt */
        return e[2] ? '<b class="tc tc--' + cat + '"><i class="tc__n">' + CATS[cat].n + '</i>' + m + '</b>'
                    : '<b class="t t--' + cat + '">' + m + '</b>';
      } else if (JUMP[low]) {
        act = ' data-jump="' + JUMP[low] + '" tabindex="0" role="button"';
        cls = ' is-jump';
      } else if (DEFINED[low] && !KNOWN[low]) {
        act = ' data-gloss="' + esc(DEFINED[low]) + '" tabindex="0" role="button"';
        cls = ' is-gloss';
      }
      if (e[2]) return '<b class="tc tc--' + cat + cls + '"' + act + '><i class="tc__n">' + CATS[cat].n + '</i>' + m + '</b>';
      return '<b class="t t--' + cat + cls + '"' + act + '>' + m + '</b>';
    }));
  }

  function legend() {
    var out = '<p class="legend__intro">The seven characteristics wear their letter of <b>MRS GREN</b>. ' +
              'A group name is coloured by its kingdom — the same colour the tree lights.</p><div class="legend">';
    ['movement','respiration','sensitivity','growth','reproduction','excretion','nutrition'].forEach(function (c) {
      out += '<span class="legend__i"><b class="tc tc--' + c + '"><i class="tc__n">' + CATS[c].n + '</i>' + CATS[c].label + '</b></span>';
    });
    ['animals','plants','fungi','prokaryotes','protoctists','viruses','naming'].forEach(function (c) {
      out += '<span class="legend__i"><b class="t t--' + c + '">' + CATS[c].label + '</b></span>';
    });
    out += '</div>';
    return out;
  }

  global.Terms = { setKnown:setKnown, isKnown:isKnown, forgetAll:forgetAll, knownCount:knownCount, mark:mark, legend:legend,
                   CATS:CATS, setStation:setStation, setQuiet:setQuiet, PEEK:PEEK, JUMP:JUMP };
})(window);
