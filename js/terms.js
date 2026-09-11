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
              'dicotyledon','dicotyledons','dicot','dicots','cotyledon','cotyledons','seed leaf','seed leaves','frond','fronds',
              /* words a student meets here for the first time and will not have seen: every one
                 opens a picture, because a name with no picture behind it is just a noise */
              'stigma','ovary','ovule','ovules','fruit','fruits','seed','seeds','pollen',
              'vascular bundle','vascular bundles','xylem','phloem',
              'tap root','tap roots','fibrous root system','fibrous roots','fibrous root'],
    fungi:   ['fungus','fungi','fungal','hypha','hyphae','mycelium','yeast','mould','moulds','mushroom','mushrooms','saprophyte','saprophytes','saprotroph','saprotrophs'],
    prokaryotes: ['prokaryote','prokaryotes','prokaryotic','bacterium','bacteria','bacterial','plasmid','plasmids','circular dna'],
    protoctists: ['protoctist','protoctists','amoeba','paramecium','alga','algae','plasmodium','seaweed','seaweeds'],
    viruses: ['virus','viruses','protein coat','host cell','host cells'],
    naming:  ['species','genus','genera','binomial system','binomial','binomial name','binomial names','scientific name','scientific names',
              'classification','classification system','classification systems','classify','classified','classifying',
              'dichotomous key','dichotomous keys','kingdom','kingdoms','taxonomy','taxon','taxa','phylum','phyla','class','classes','order','family',
              'evolutionary relationships','evolutionary relationship','common ancestor','common ancestors','ancestor','ancestors','ancestry','linnaeus','carl linnaeus','carolus linnaeus','dna','base sequence','base sequences','bases',
              'five kingdoms','fertile offspring','interbreed'],
    plain:   ['cell wall','cell walls','nucleus','nuclei','chloroplast','chloroplasts','cellulose','chitin','photosynthesis','photosynthesises','morphology','anatomy',
              'autotrophic nutrition','heterotrophic nutrition','saprotrophic nutrition','parasitic nutrition','autotrophic','heterotrophic','saprotrophic','autotroph','autotrophs','heterotroph','heterotrophs',
              'spore','spores','magnification','specimen','specimens','metabolism','dry mass','stimulus','stimuli','organism','organisms',
              'feature','features','characteristic','characteristics','exoskeleton','backbone','antenna','antennae','compound eye','compound eyes',
              'cephalothorax','abdomen','thorax','scales','feathers','fin','fins','gill','gills','lungs','moist skin','lateral line','segment','segments','segmented',
              'jointed leg','jointed legs','jointed limbs','wings','wing','wet scales','dry scales','cilia','flagellum','flagella','habitat','xylem','phloem','sporangium','sporangia','fiddlehead',
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
  /* Every word here opens a CLOSE-UP of the thing it names, not a photograph of the whole
     organism. The group pictures were doing the second: clicking "gills" showed a clownfish,
     which does not show a gill. Each of these is cropped from a picture the lab already
     carries and already credits, at the place a pin on that picture has already been checked.
     Where no photograph in the world would help — a plasmid is inside the cell and far below
     what a school microscope resolves — the card shows one of the lab's own drawings instead. */
  [
    ['frond', 'peek-frond-900.jpg',
     '<b>Fronds</b>: the leaves of a fern. The rows of brown dots on the underside are sori — clusters of spore cases. Ferns make spores, not seeds.',
     'Polypodium glycyrrhiza · Alex Abair · CC BY 4.0 · Wikimedia Commons'],
    ['fronds', 'peek-frond-900.jpg',
     '<b>Fronds</b>: the leaves of a fern. The rows of brown dots on the underside are sori — clusters of spore cases.',
     'Polypodium glycyrrhiza · Alex Abair · CC BY 4.0 · Wikimedia Commons'],
    ['exoskeleton', 'peek-exoskeleton-900.jpg',
     'The <b>exoskeleton</b>, close up: a hard skeleton on the OUTSIDE, here the carapace of a crab. It is jointed so the animal can move, and it cannot grow — an arthropod has to shed it and harden a new one.',
     'Four-toothed shore crab · Museums Victoria · CC BY 4.0 · Wikimedia Commons'],
    ['compound eye', 'peek-compound-eye-900.jpg',
     'A <b>compound eye</b>: not one lens but hundreds packed together, each a tiny eye of its own looking in its own direction. The fine mesh across this fly\u2019s eye is those units \u2014 every insect has a pair, and it is one of the features that puts an animal among the insects.',
     'Big-eyed fly \u00b7 USGS Bee Inventory and Monitoring Lab \u00b7 public domain \u00b7 Wikimedia Commons'],
    ['compound eyes', 'peek-compound-eye-900.jpg',
     '<b>Compound eyes</b>: not one lens but hundreds packed together, each a tiny eye looking in its own direction \u2014 the fine mesh you can see across this fly\u2019s eye. Insects have a pair of them.',
     'Big-eyed fly \u00b7 USGS Bee Inventory and Monitoring Lab \u00b7 public domain \u00b7 Wikimedia Commons'],
    ['antennae', 'peek-antenna-900.jpg',
     '<b>Antennae</b>: feelers on the head, for touch and smell — here one of a centipede\u2019s pair, jointed bead by bead. One pair in insects and myriapods, two pairs in crustaceans, none in arachnids.',
     'Scolopendra canidens · Denis Potanin · CC BY 4.0 · Wikimedia Commons'],
    ['cephalothorax', 'peek-cephalothorax-900.jpg',
     'The <b>cephalothorax</b>: the front body part of an arachnid, head and thorax fused into one, carrying the eyes and all eight legs. The rounded abdomen behind it is the second part \u2014 two body parts in all, where an insect has three.',
     'Wolf spider, Lycosa erythrognatha \u00b7 Jo\u00e3o P. Burini \u00b7 CC BY 4.0 \u00b7 Wikimedia Commons'],
    ['scales', 'peek-scales-900.jpg',
     '<b>Scales</b> come in two kinds. These are a reptile’s: horny, dry and waterproof, which is why it can live away from water. A fish’s are thin, wet and slippery. A reptile’s eggs survive on dry land for a separate reason — they have a waterproof shell of their own.',
     'Green iguana · Wilfredor · CC0 · Wikimedia Commons'],
    ['feathers', 'peek-feathers-900.jpg',
     '<b>Feathers</b>, close up on the wing of a bald eagle: separate, overlapping, and light. No other group has them, and the front limbs they grow on are wings.',
     'Bald eagle · Andy Morffew · CC BY 2.0 · Wikimedia Commons'],
    ['fins', 'peek-fins-900.jpg',
     '<b>Fins</b>: a fan of thin rays in a web of skin — this is the spiny dorsal fin of a perch, ray by ray. Fins move a fish and hold it steady.',
     'Yellow perch, Perca flavescens · USFWS Mountain-Prairie · public domain · Wikimedia Commons'],
    ['gills', 'peek-gills-900.jpg',
     '<b>Gills</b> sit in a chamber on each side of the head, behind the gill cover. This carp was born with a short cover, so its gills are in plain view \u2014 rows of fine red filaments, red because they are packed with blood. Water is taken in at the mouth and pushed out over them, and oxygen passes into the blood as it goes. A fish keeps its gills all its life; an amphibian has them only as a tadpole.',
     'Common carp \u00b7 Guitardude012 \u00b7 CC BY 3.0 \u00b7 Wikimedia Commons'],
    ['moist skin', 'peek-moist-skin-900.jpg',
     'A smooth, <b>moist skin</b>, close up on a tree frog. It takes in oxygen as well as the lungs do, and it dries out — which is why amphibians stay near water and lay their eggs in it.',
     'Red-eyed tree frog · Careyjamesbalboa · public domain · Wikimedia Commons'],
    ['yeast', 'peek-yeast-900.jpg',
     '<b>Yeast</b> is a fungus made of ONE cell — the exception among fungi, which are otherwise threads. Every oval here is a whole organism, and the small bumps growing off some of them are new cells budding. Yeast respires the sugar in dough and gives off carbon dioxide, which is what raises bread; sealed away from oxygen it makes ethanol instead, which is beer and wine. It is grown on purpose for both, and for Marmite and vitamin supplements.',
     'Yeast cells in a wet mount · Ajay Kumar Chaurasiya · CC0 · Wikimedia Commons'],
    ['paramecium', 'peek-paramecium-900.jpg',
     '<b>Paramecium</b>: one cell, shaped like a slipper, that lives in pond water. The fine fringe all round its edge is its cilia, and they beat to drive it along. Everything an organism has to do — feed, respire, excrete, respond, reproduce — this single cell does for itself. About a quarter of a millimetre long, so a school microscope shows it well.',
     'Paramecium caudatum · CC BY 4.0 · Wikimedia Commons'],
    ['amoeba', 'peek-amoeba-900.jpg',
     '<b>Amoeba</b>: one cell with no fixed shape at all. It creeps by pushing out pseudopodia — \u201cfalse feet\u201d — and feeds by flowing around a smaller organism until it has closed over it. Also a protoctist, and also about a third of a millimetre across.',
     'Amoeba proteus · CC0 · Wikimedia Commons'],
    ['plasmodium', 'peek-plasmodium-900.jpg',
     '<b>Plasmodium</b> is a protoctist too, and a parasite: it lives inside another organism at that organism\u2019s expense. The purple ring here is one Plasmodium inside a human red blood cell, which it will destroy. It causes malaria, and mosquitoes carry it from person to person.',
     'Plasmodium vivax in a Giemsa-stained blood film · Chavatte, Tan, Snounou & Lin · CC BY 4.0 · Wikimedia Commons'],
    ['cilia', 'peek-cilia-900.jpg',
     '<b>Cilia</b>: rows of tiny hairs that beat to move a Paramecium through the water. Be honest about what you can see here — at the magnification of a school microscope they show only as a fine fringe along the edge of the cell, which is the blurred rim in this picture. Individual cilia need an electron microscope.',
     'Paramecium · CC BY · Wikimedia Commons'],
    ['plasmids', 'fig:prokaryote',
     '<b>Plasmids</b>: small extra rings of DNA in a bacterium, separate from the one big circular loop that is its chromosome. There is no photograph of them here on purpose — a plasmid is inside the cell and far below what a school microscope can resolve, so a picture of a bacterium from the outside would show you nothing.',
     ''],
    ['plasmid', 'fig:prokaryote',
     'A <b>plasmid</b>: a small extra ring of DNA in a bacterium, separate from the single circular loop that is its chromosome.',
     ''],
    ['protein coat', 'peek-protein-coat-900.jpg',
     'The <b>protein coat</b>: each yellow body here is one virus particle, and the coat is its whole outside. Inside it is the genetic material, and nothing else — no cytoplasm, no organelles, no cell.',
     'HIV-1 particles · NIAID · CC BY 2.0 · Wikimedia Commons'],
    ['hyphae', 'peek-hyphae-900.jpg',
     '<b>Hyphae</b>: the threads a fungus is made of. Look along one — the cross-walls divide it into cells, joined end to end. That is the answer to "how many cells?": many, but in threads rather than in blocks of tissue.',
     'Branching fungal hyphae · Ajay Kumar Chaurasiya · CC BY 4.0 · Wikimedia Commons'],
    ['hypha', 'peek-hyphae-900.jpg',
     '<b>A hypha</b>: one of the threads a fungus is made of, divided by cross-walls into cells joined end to end.',
     'Branching fungal hyphae · Ajay Kumar Chaurasiya · CC BY 4.0 · Wikimedia Commons'],
    ['mycelium', 'peek-mycelium-900.jpg',
     'A <b>mycelium</b> is the whole fungus: a mat of thousands of hyphae spreading out through whatever it is feeding on — here a colony grown across a dish of jelly. One hypha is a single thread; the mycelium is all of them together. A mushroom is only the fruiting body such a mat sends up.',
     'Fungal colony on culture medium · Bjjff · CC0 · Wikimedia Commons'],
    ['cotyledon', 'peek-cotyledon-900.jpg',
     'A <b>cotyledon</b>, or seed leaf: the pale, thick pair on this bean seedling. It was inside the seed, packed with the food that grew the seedling this far, and it is not a true leaf — the darker folded pair above it is the first of those. One cotyledon in the seed means a monocotyledon, two means a dicotyledon.',
     'Bean germination, Phaseolus vulgaris · Victor M. Vicente Selvas · public domain · Wikimedia Commons'],
    ['cotyledons', 'peek-cotyledon-900.jpg',
     '<b>Cotyledons</b>, or seed leaves: the thick pale pair on this bean seedling. They came out of the seed with the food that fed the seedling, and they are not true leaves — the darker folded pair above them is. Two cotyledons makes a dicotyledon; one makes a monocotyledon.',
     'Bean germination, Phaseolus vulgaris · Victor M. Vicente Selvas · public domain · Wikimedia Commons'],
    ['seed leaves', 'peek-cotyledon-900.jpg',
     '<b>Seed leaves</b> are cotyledons: the thick pale pair here, which were inside the bean before it grew and carried the food that got it this far. Count them — one or two is how monocotyledons and dicotyledons are told apart.',
     'Bean germination, Phaseolus vulgaris · Victor M. Vicente Selvas · public domain · Wikimedia Commons'],
    ['stigma', 'peek-stigma-900.jpg',
     'The <b>stigma</b>: the sticky tip of the female part of a flower, where pollen lands. The yellow grains on this dandelion stigma are pollen.',
     'Dandelion flower stigma with pollen · CC BY 4.0 · Wikimedia Commons'],
    ['vascular bundle', 'peek-vascular-900.jpg',
     'A <b>vascular bundle</b>: the plumbing of a plant, seen in a slice across the stem. Each bundle carries xylem, which takes water up, and phloem, which carries food.',
     'Vascular bundle in a monocotyledon stem · CC0 · Wikimedia Commons'],
    ['vascular bundles', 'peek-vascular-900.jpg',
     '<b>Vascular bundles</b>: the plumbing of a plant, seen in a slice across the stem. Scattered through the stem in monocotyledons, in a ring in dicotyledons.',
     'Vascular bundle in a monocotyledon stem · CC0 · Wikimedia Commons']
,
    ['wings', 'peek-wing-insect-900.jpg',
     '<b>Wings</b> are not one structure. In an insect they are thin membranes stiffened by veins, growing from the thorax — this is a wasp’s. In a bird or a bat the wing IS the front limb, with bones inside it. They do the same job and are built quite differently, which is why a shared feature is not by itself evidence of relationship.',
     'Common wasp · bemma · CC BY 4.0 · Wikimedia Commons'],
    ['wing', 'peek-wing-insect-900.jpg',
     'An insect <b>wing</b>: a thin membrane stiffened by veins, growing from the thorax. A bird’s wing is a different thing — the front limb itself, with bones inside.',
     'Common wasp · bemma · CC BY 4.0 · Wikimedia Commons'],
    ['wet scales', 'peek-wet-scales-900.jpg',
     '<b>Wet scales</b>: thin plates in the skin of a fish, overlapping like roof tiles and kept slippery by mucus. Not the same as a reptile’s dry scales, which are horny and waterproof.',
     'Rainbow trout · Ryan Hagerty/USFWS · public domain · Wikimedia Commons'],
    ['dry scales', 'peek-scales-900.jpg',
     '<b>Dry scales</b>: a horny waterproof skin, here on an iguana, which is why a reptile can live away from water. A fish’s scales are wet and slippery instead.',
     'Green iguana · Wilfredor · CC0 · Wikimedia Commons']
  ].forEach(function (e) { PEEK[e[0]] = [e[1], e[2], e[3]]; });

  /* ---------- the same word, different station ----------
     A link that is right in one place can be wrong in another. Clicking "wings" beside the
     eagle sent a reader to the arthropods station, which teaches that a bird's wing is an
     arthropod feature — and this lab spends a whole station saying that a shared feature is
     not evidence of relationship. CONTEXT[station][word] replaces whatever the word would
     otherwise do, and only on that station. */
  var CONTEXT = {
    vertebrates: {
      'wings': ['peek-wing-bird-900.jpg',
        'A bird\u2019s <b>wings</b> ARE its front limbs: the same bones as your arm, carrying feathers. An insect\u2019s wings are something else entirely, thin membranes growing from the thorax, and the animal still has all six of its legs. Same job, different structure.',
        'Bald eagle \u00b7 Andy Morffew \u00b7 CC BY 2.0 \u00b7 Wikimedia Commons'],
      'wing': ['peek-wing-bird-900.jpg',
        'A bird\u2019s <b>wing</b> is its front limb \u2014 the same bones as your arm, carrying feathers.',
        'Bald eagle \u00b7 Andy Morffew \u00b7 CC BY 2.0 \u00b7 Wikimedia Commons']
    },
    naming: {
      /* the sentence here is about a WHALE, and showing a perch's dorsal fin under it is the
         reuse that makes a reader stop looking. A whale's tail is its own picture, and it
         carries the point: held flat, not upright like a fish's. */
      'fins': ['peek-whale-tail-900.jpg',
        'A humpback whale\u2019s tail, lifted clear of the water. It drives the whale exactly as a fish\u2019s tail drives a fish \u2014 and it is held FLAT, while a fish\u2019s tail stands upright. Same job, different animal, different structure: a whale is a mammal that swims, not a fish.',
        'Humpback whale tail flukes \u00b7 Tony Hisgett \u00b7 CC BY 2.0 \u00b7 Wikimedia Commons']
    },
    arthropods: {
      'gills': ['peek-gills-900.jpg',
        '<b>Gills</b> take oxygen from water. These are a FISH\u2019s, in the chamber behind the gill cover \u2014 this carp was born with a short cover, so they show. Crustaceans have gills too, doing the same job, but they are different structures and they sit tucked under the edge of the carapace.',
        'Common carp \u00b7 Guitardude012 \u00b7 CC BY 3.0 \u00b7 Wikimedia Commons']
    }
  };

  /* The people. A scientist named in the text is clickable: their portrait, what they did,
     and why it still shows up in the names students write. */
  var WHO = {
    'linnaeus': ['linnaeus-900.jpg',
      '<b>Carl Linnaeus</b> (1707–1778), Swedish botanist and physician — the <b>Father of Taxonomy</b>. ' +
      'In <i>Systema Naturae</i> he set out the two-part naming system every biologist still uses, and the nested groups ' +
      'from kingdom down to species. He described about 12,000 species himself, and sent students round the world to bring back more. ' +
      'That is why you meet an <b>L.</b> after some names — <i>Bellis perennis</i> L., the daisy: the letter says Linnaeus was the ' +
      'first to describe and name it. The name is the two words; the letter after it only records who named them.',
      'Portrait by Alexander Roslin, 1775 · public domain · Wikimedia Commons']
  };
  Object.keys(WHO).forEach(function (k) { PEEK[k] = WHO[k]; });
  PEEK['carl linnaeus'] = WHO['linnaeus']; PEEK['carolus linnaeus'] = WHO['linnaeus'];

  var JUMP = {};
  function jump(list, st) { list.forEach(function (w) { JUMP[w] = st; }); }
  jump(['movement','respiration','sensitivity','growth','reproduction','excretion','nutrition','characteristics','characteristic','metabolism','dry mass','stimulus','stimuli'], 'alive');
  jump(['species','genus','genera','binomial system','binomial','binomial name','binomial names','scientific name','scientific names','classification','classification system',
        'classification systems','classify','classified','classifying','taxonomy','taxon','taxa','phylum','phyla','class','classes','order','family','linnaeus','fertile offspring','interbreed','feature','features'], 'naming');
  jump(['dna','base sequence','base sequences','bases','evolutionary relationships','evolutionary relationship','common ancestor','common ancestors','ancestor','ancestors','ancestry'], 'dna');
  jump(['dichotomous key','dichotomous keys'], 'keys');
  jump(['kingdom','kingdoms','five kingdoms','animal','animals','animal kingdom','plant kingdom','fungus','fungi','fungal','prokaryote','prokaryotes','prokaryotic','bacterium','bacteria','bacterial',
        'protoctist','protoctists','amoeba','paramecium','alga','algae','plasmodium','saprophyte','saprophytes','saprotroph','saprotrophs','yeast','mould','moulds','mushroom','mushrooms',
        'cell wall','cell walls','nucleus','nuclei','chloroplast','chloroplasts','cellulose','multicellular','unicellular','single-celled','circular dna',
        'autotrophic nutrition','heterotrophic nutrition','saprotrophic nutrition','parasitic nutrition','autotrophic','heterotrophic','saprotrophic','autotroph','autotrophs','heterotroph','heterotrophs','photosynthesis'], 'kingdoms');
  jump(['vertebrate','vertebrates','mammal','mammals','bird','birds','reptile','reptiles','amphibian','amphibians','fish','fishes','backbone','lungs','warm-blooded','cold-blooded','mammary glands','milk','lateral line','internal fertilisation','external fertilisation'], 'vertebrates');
  jump(['arthropod','arthropods','myriapod','myriapods','insect','insects','arachnid','arachnids','crustacean','crustaceans','centipede','centipedes','millipede','millipedes','spider','spiders','crab','crabs','abdomen','thorax','segment','segments','segmented','jointed leg','jointed legs','jointed limbs'], 'arthropods');
  /* 'wings' is deliberately NOT in that list. A bird's wing and a wasp's wing do the same job
     and are not the same structure, and this lab teaches exactly that: similar features are
     not evidence of relationship. The word opens a picture instead, and on the vertebrates
     station it opens a bird's wing. */
  jump(['plant','plants','fern','ferns','flowering plant','flowering plants','monocotyledon','monocotyledons','monocot','monocots','dicotyledon','dicotyledons','dicot','dicots','cotyledon','cotyledons',
        'spore','spores','sporangium','sporangia','xylem','phloem','parallel veins','network of veins','net-like veins'], 'plants');
  jump(['virus','viruses','host cell','host cells'], 'viruses');
  /* NOT pathogen and NOT parasite. Sending a reader from either word to the viruses station
     teaches that pathogens are viruses, and they are not: bacteria, fungi and protoctists
     cause disease too, and most viruses and most bacteria cause none. Both words now open a
     definition that says so. */
  jump(['magnification','specimen','specimens'], 'drawing');

  /* --------- build one matcher, longest phrase first --------- */
  var ENTRIES = [];
  Object.keys(CHIP_WORDS).forEach(function (cat) { CHIP_WORDS[cat].forEach(function (w) { ENTRIES.push([w, cat, true]); }); });
  Object.keys(PLAIN_WORDS).forEach(function (cat) { PLAIN_WORDS[cat].forEach(function (w) { ENTRIES.push([w, cat, false]); }); });
  ENTRIES.sort(function (a, b) { return b[0].length - a[0].length; });

  var DEFINED = {};
  (global.GLOSSARY || []).forEach(function (e) { DEFINED[e.term.toLowerCase()] = e.term; });
  /* a plural, a singular, the verb behind a noun or an alias opens the term's definition: the forms are worked out at build time */
  function defined(low) { if (DEFINED[low]) return DEFINED[low]; var F = global.GLOSSARY_FORMS || {}; return F[low] || null; }

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

  /* ---------- what a mark promises ----------
     Three marks, three different things, and a reader must be able to tell them apart before
     clicking:

       a magnifying glass  a picture opens where you are
       a faint dotted rule the definition opens where you are
       an arrow            you are taken to another station

     So the arrow is only ever used when there is something at the other end worth the journey
     — a table, an activity, a photograph of the thing. A word that only wants explaining gets
     the definition, in place: the back chip fades after a few seconds, and a reader who misses
     it has to find their own way back, which is a poor trade for a sentence they could have
     read without moving.

     These are the words with something at the other end. Everything else that has a
     definition now opens it. */
  var GOES_THERE = {};
  ('animal animals animal kingdom plant plants plant kingdom fungus fungi fungal ' +
   'prokaryote prokaryotes prokaryotic protoctist protoctists bacteria bacterium bacterial ' +
   'kingdom kingdoms five kingdoms ' +
   'vertebrate vertebrates mammal mammals bird birds reptile reptiles amphibian amphibians fish fishes ' +
   'arthropod arthropods insect insects arachnid arachnids crustacean crustaceans myriapod myriapods ' +
   'fern ferns flowering plant flowering plants monocotyledon monocotyledons monocot monocots ' +
   'dicotyledon dicotyledons dicot dicots virus viruses ' +
   'dichotomous key dichotomous keys binomial system dna base sequence base sequences ' +
   'magnification specimen specimens').split(' ').forEach(function (w) { GOES_THERE[w] = true; });
  /* the multi-word ones the split above broke apart */
  ['animal kingdom', 'plant kingdom', 'five kingdoms', 'flowering plant', 'flowering plants',
   'dichotomous key', 'dichotomous keys', 'binomial system', 'base sequence', 'base sequences']
    .forEach(function (w) { GOES_THERE[w] = true; });

  var here = null, seen = null, quiet = false, wentTo = null;
  function setStation(id) { here = id; seen = Object.create(null); quiet = false; wentTo = Object.create(null); }
  /* a widget built afresh (its reset) marks its words as it did the first time: forget what it introduced */
  function unsee(words, jumps) { if (seen) (words || []).forEach(function (w) { delete seen[String(w).toLowerCase()]; }); if (wentTo) (jumps || []).forEach(function (j) { delete wentTo[j]; }); }
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

  /* A word inside a negative is a word about something that is NOT there. Clicking "scales"
     in "smooth, moist skin with no scales" opened a photograph of a reptile's scales — the
     very picture shown two sentences earlier, now offered as if it were the frog's. A word
     that has just been denied gets no picture, no link and no definition: there is nothing
     there to look at. */
  var NEGATED = /(?:^|[\s(\u2014-])(?:no|not|non|never|without|neither|nor|lack|lacks|lacking|nothing)\s+(?:[a-z]+\s+){0,2}$/i;


  /* ---- a word can be a glossary word and still be the wrong word ----
     The glossary matches on spelling, so "the direction of the light SOURCE" was opening the
     definition of a phloem source — "a part of a plant that releases sucrose" — which is not
     what the sentence means at all. Same for a CAPILLARY tube, which is glassware and not the
     smallest blood vessel, and for CONTROL used as a verb rather than as the control in an
     experiment. Found by Daniel on the first of those, and by auditing every first occurrence
     of every glossary word in all three labs for the rest.

     Each rule says: this spelling, in this context, is not the glossary's sense — leave it
     alone. Add to it rather than removing a word from the glossary: the word is right
     elsewhere. */
  var NOT_HERE = {
    'source':     [{ before: /\b(light|energy|heat|power|water|food)\s+$/i },
                   { after: /^\s+of\s+(energy|light|heat|food|protein|carbohydrate|water|income)/i }],
    'sources':    [{ before: /\b(light|energy|heat|power|food)\s+$/i },
                   { after: /^\s+of\s+(energy|light|heat|food)/i }],
    'capillary':  [{ after: /^\s+tube/i }],
    'capillaries':[{ after: /^\s+tube/i }],
    'control':    [{ after: /^\s+(the|it|them|this|these|for|every|all|each)\b/i }]
  };
  function wrongSense(low, before, after) {
    var rules = NOT_HERE[low];
    if (!rules) return false;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.before && r.before.test(before)) return true;
      if (r.after && r.after.test(after)) return true;
    }
    return false;
  }

  function mark(text) {
    return underlineTags(underlineMarks(esc(text)).replace(RE, function (m, _g, at, whole) {
      var low = m.toLowerCase(), e = INFO[low];
      if (!e) return m;
      var before = String(whole).slice(0, at).replace(/<[^>]*>/g, '');
      if (NEGATED.test(before)) return m;
      if (wrongSense(low, before, String(whole).slice(at + m.length).replace(/<[^>]*>/g, ''))) return m;
      var cat = e[1], act = '', cls = '';
      var first = !quiet && !(seen && seen[low]);
      if (seen) seen[low] = true;
      if (!first) return m;
      var ctx = (CONTEXT[here] || {})[low];
      if (ctx || PEEK[low]) {
        var pk = ctx || PEEK[low];
        act = ' data-peek="' + pk[0] + '" data-note="' + esc(pk[1]) + '"' +
              (pk[2] ? ' data-credit="' + esc(pk[2]) + '"' : '') + ' tabindex="0" role="button"';
        cls = ' is-peek';
      } else if (JUMP[low] === here) {
        /* the station being read is the one that teaches this word: no link, no glossary
           marker — the widget below it is where the definition is learnt */
        return e[2] ? '<b class="tc tc--' + cat + '"><i class="tc__n">' + CATS[cat].n + '</i>' + m + '</b>'
                    : '<b class="t t--' + cat + '">' + m + '</b>';
      } else if (JUMP[low] && GOES_THERE[low] && !(wentTo && wentTo[JUMP[low]])) {
        /* Only the FIRST word on a station that leads somewhere carries the arrow there. A
           reader who follows "mammal" to the table, comes back, and finds "milk" takes them to
           the same table has been sent twice to the same page. */
        if (wentTo) wentTo[JUMP[low]] = true;
        act = ' data-jump="' + JUMP[low] + '" tabindex="0" role="button"';
        cls = ' is-jump';
      } else if (defined(low) && !KNOWN[defined(low).toLowerCase()]) {
        act = ' data-gloss="' + esc(defined(low)) + '" tabindex="0" role="button"';
        cls = ' is-gloss';
      } else if (JUMP[low] && !(wentTo && wentTo[JUMP[low]])) {
        /* no definition written for it, so the station that teaches it is the only answer */
        if (wentTo) wentTo[JUMP[low]] = true;
        act = ' data-jump="' + JUMP[low] + '" tabindex="0" role="button"';
        cls = ' is-jump';
      }
      /* A category chip prints its letter inside the same element, so reading the term off
         textContent yields "Nnutrition". Carry the word itself. */
      if (e[2]) return '<b class="tc tc--' + cat + cls + '"' + act + (act ? ' data-term="' + esc(m) + '"' : '') +
        '><i class="tc__n">' + CATS[cat].n + '</i>' + m + '</b>';
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

  global.Terms = { unsee: unsee, setKnown:setKnown, isKnown:isKnown, forgetAll:forgetAll, knownCount:knownCount, mark:mark, legend:legend,
                   CATS:CATS, setStation:setStation, setQuiet:setQuiet, PEEK:PEEK, JUMP:JUMP };
})(window);

/* A number never parts from its unit at a line break — 20 °C, 5 min, 48 mm, 60 %, 4 marks, pH 2 — wherever the page
   writes one: the theory, a question, the bench, a pop-up, the syllabus. The join is made in the text itself as the
   page changes, so nothing that renders text has to remember to do it. */
(function () {
  var UNIT = /(\d)[ \t]+(%|°C|°|mm³\/min|mm\/min|mm³|mm|cm³|cm|dm³|m\b|km\b|µm\b|μm\b|nm\b|min\b|minutes?\b|seconds?\b|s\b|hours?\b|h\b|days?\b|weeks?\b|years?\b|kg\b|mg\b|g\b|ml\b|l\b|kPa\b|kJ\b|J\b|runs?\b|trials?\b|marks?\b|leaves\b|grams?\b|degrees?\b|metres?\b|litres?\b|per cent\b|chews?\b|drops?\b)/g;
  var LEAD = /\b(pH|[Dd]ay|[Tt]ube|Paper|Topic|Question|Stage|Step|Figure|Fig\.)[ \t]+(\d)/g;
  function fix(t) {
    var p = t.parentNode; if (!p || p.nodeType !== 1) return;
    var tag = p.tagName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'OPTION') return;
    var v = t.nodeValue; if (!/\d/.test(v)) return;
    var n = v.replace(UNIT, '$1\u00A0$2').replace(LEAD, '$1\u00A0$2');
    if (n !== v) t.nodeValue = n;
  }
  function join(node) {
    if (!node) return;
    if (node.nodeType === 3) { fix(node); return; }
    if (node.nodeType !== 1 && node.nodeType !== 11) return;
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), t, list = [];
    while ((t = w.nextNode())) list.push(t);
    list.forEach(fix);
  }
  function watch() {
    join(document.body);
    new MutationObserver(function (recs) {
      recs.forEach(function (r) { if (r.type === 'characterData') fix(r.target); else for (var i = 0; i < r.addedNodes.length; i++) join(r.addedNodes[i]); });
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
  window.KeepUnits = { join: join };
})();
