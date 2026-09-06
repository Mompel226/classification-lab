/* ============================================================
   Life on Earth Hub — the tree register
   ------------------------------------------------------------
   The tree is the content of Topic 1, so drawing it teaches it.
   Everything the map shows comes from here: the groups and their
   features in the syllabus's words, the story of the first cells,
   and the credit for every silhouette.

   groups   in the order they sit round the rim. Each one:
     id        unique key
     kind      "kingdom" | "group" | "tip"  — only tips carry a silhouette
     parent    "root" for a kingdom, otherwise the id of the branch above
     label     what the student reads
     ring      a name written along the ring, for branches that fan out again
     shift     nudge that ring label along the ring, in degrees (optional)
     feats     what puts an organism here — the exam's words, one per line
     eg        examples
     real      the reality after the exam answer, if it differs (optional)
     sil       the silhouette: file in assets/silhouettes/, the organism, who drew it, licence, page
     img       the photograph under the group's name: base name in assets/photos/ (900 and 1400 wide, JPEG + WebP), alt, caption, credit, page
   viruses  off the tree, on purpose
   story    the five steps from the vent to the first cell
   img      the picture on a step: base name in assets/photos/ (900 and 1400 wide, JPEG + WebP), alt, caption, credit, page
     book    true on a step that shows the book card
     evidence  for and against each idea, one line and one source per item; evidenceNote closes it
   book     the book itself: title, author, year, one line, where it lives
   ============================================================ */
window.TREE = {

  groups: [
    /* ---- Animals ---- */
    { id:'animals', kind:'kingdom', parent:'root', label:'Animals', ring:'Animals',
      img:{ base:'assets/photos/animals', alt:'A lion in the Serengeti', caption:'A lion in the Serengeti', credit:'Ankit Gita from Mumbai, Maharashtra, India, India · CC BY 2.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ALion%2C_Serengeti_National_Park_%2848788336273%29.jpg' },
      feats:['Many cells, each with a nucleus and no cell wall.',
             'Feed on other organisms.',
             'Most move from place to place, and have nerves.'],
      eg:'everything on the two branches above, and also snails, worms, starfish and jellyfish',
      real:'Animals and fungi are closer to each other than either is to plants. The syllabus asks only about vertebrates and arthropods, but a snail is just as much an animal.' },

    { id:'vertebrates', kind:'group', parent:'animals', label:'Vertebrates', ring:'Vertebrates',
      img:{ base:'assets/photos/vertebrates', alt:'A snake skeleton: the backbone, bone by bone', caption:'A snake skeleton: the backbone, bone by bone', credit:'dbking · CC BY 2.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ASnake_skeleton.jpg' },
      feats:['A backbone, and an internal skeleton of bone or cartilage.'],
      eg:'mammals, birds, reptiles, amphibians, fish' },

    { id:'mammals', kind:'tip', parent:'vertebrates', label:'Mammals',
      img:{ base:'assets/photos/mammals', alt:'African bush elephant', caption:'African bush elephant', credit:'Hobbyfotowiki · CC0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AAfrican_bush_elephant_%28Loxodonta_africana%29%2C_Masai_Mara.jpg' },
      feats:['Hair or fur.', 'Lungs.', 'Internal fertilisation; young born live and fed on milk.', 'Constant body temperature.'],
      eg:'elephant, dolphin, bat, human',
      real:'A few lay eggs: the platypus and the echidnas.',
      sil:{ file:'mammals', name:'Elephas maximus, Asian elephant', by:'Andy Wilson', licence:'CC0 1.0', url:'https://www.phylopic.org/images/db278f3b-d8c1-47e9-afce-0478980f5875' } },

    { id:'birds', kind:'tip', parent:'vertebrates', label:'Birds',
      img:{ base:'assets/photos/birds', alt:'Bald eagle', caption:'Bald eagle', credit:'Andy Morffew from Itchen Abbas, Hampshire, UK · CC BY 2.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ABald_eagle_in_Alaska_2016-3.jpg' },
      feats:['Feathers; the front limbs are wings.', 'A beak, no teeth.', 'Lungs.', 'Hard-shelled eggs.', 'Constant body temperature.'],
      eg:'pigeon, eagle, penguin, ostrich',
      sil:{ file:'birds', name:'Columba livia, rock pigeon', by:'Andy Wilson', licence:'CC0 1.0', url:'https://www.phylopic.org/images/cbe76bdb-5a89-4577-8472-6af7c2052d70' } },

    { id:'reptiles', kind:'tip', parent:'vertebrates', label:'Reptiles',
      img:{ base:'assets/photos/reptiles', alt:'Green iguana', caption:'Green iguana', credit:'Wilfredor · CC0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AEndangered_species_Iguana_Iguana_from_Margarita_Island.jpg' },
      feats:['Dry scales.', 'Lungs.', 'Internal fertilisation; eggs with a leathery, waterproof shell, laid on land.', 'Body temperature follows the surroundings.'],
      eg:'lizard, snake, tortoise, crocodile',
      sil:{ file:'reptiles', name:'Iguana iguana, green iguana', by:'Jack Mayer Wood', licence:'CC0 1.0', url:'https://www.phylopic.org/images/5dec03d9-66a2-4033-b1a9-6dbb3485199f' } },

    { id:'amphibians', kind:'tip', parent:'vertebrates', label:'Amphibians',
      img:{ base:'assets/photos/amphibians', alt:'Red-eyed tree frog', caption:'Red-eyed tree frog', credit:'Careyjamesbalboa (Carey James Balboa) · Public domain · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ARed_eyed_tree_frog_edit2.jpg' },
      feats:['Smooth, moist skin.', 'Lungs on land; the skin, and gills when young, in water.', 'External fertilisation; soft eggs laid in water.', 'Body temperature follows the surroundings.'],
      eg:'frog, toad, newt',
      sil:{ file:'amphibians', name:'Rana temporaria, common frog', by:'Beth Reinke', licence:'CC0 1.0', url:'https://www.phylopic.org/images/e73c5c1c-7727-4687-bf0b-3957343edfc3' } },

    { id:'fish', kind:'tip', parent:'vertebrates', label:'Fish',
      img:{ base:'assets/photos/fish', alt:'Clownfish in an anemone', caption:'Clownfish in an anemone', credit:'Janderk · Public domain · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ACommon_clownfish.jpg' },
      feats:['Wet scales; fins.', 'Gills.', 'External fertilisation; soft eggs laid in water.', 'A lateral line that senses movement in the water.'],
      eg:'perch, salmon, shark, goldfish',
      sil:{ file:'fish', name:'Perca fluviatilis, perch', by:'Ando', licence:'Public Domain Mark 1.0', url:'https://www.phylopic.org/images/bbc78f09-18e1-4e4d-9e77-c6f9daee33c1' } },

    { id:'arthropods', kind:'group', parent:'animals', label:'Arthropods', ring:'Arthropods',
      img:{ base:'assets/photos/arthropods', alt:'Stag beetle', caption:'Stag beetle', credit:'Flocci Nivis · CC BY 4.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3A20200529_Lucanus_cervus_02.jpg' },
      feats:['Jointed legs.', 'A body in segments.', 'A hard outer skeleton, the exoskeleton.'],
      eg:'myriapods, insects, arachnids, crustaceans' },

    { id:'myriapods', kind:'tip', parent:'arthropods', label:'Myriapods',
      img:{ base:'assets/photos/myriapods', alt:'Tiger centipede', caption:'Tiger centipede', credit:'Jbjensen1 · CC0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ATiger_centipede_%28Scolopendra_polymorpha%29.jpg' },
      feats:['Many segments, each with jointed legs.', 'One pair of legs on each segment in centipedes; two pairs in millipedes.', 'One pair of antennae.', 'No wings.'],
      eg:'centipede, millipede',
      sil:{ file:'myriapods', name:'Lithobius forficatus, brown centipede', by:'Tatiana Miroliubova', licence:'CC0 1.0', url:'https://www.phylopic.org/images/b09c0ec3-c56f-4ab9-a4e2-6b36e53f86d8' } },

    { id:'insects', kind:'tip', parent:'arthropods', label:'Insects',
      img:{ base:'assets/photos/insects', alt:'Honey bee on a flower', caption:'Honey bee on a flower', credit:'Swallowtail Garden Seeds from Santa Rosa, California, United States · CC BY 2.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AHoney_Bee_on_Gaillardia_Flower_-_Flickr_-_Swallowtail_Garden_Seeds.jpg' },
      feats:['Three body parts: head, thorax, abdomen.', 'Three pairs of legs; usually two pairs of wings.', 'One pair of antennae.', 'Compound eyes.'],
      eg:'bee, butterfly, ant, beetle',
      sil:{ file:'insects', name:'Apis mellifera, honeybee', by:'Lubna Maherally', licence:'CC0 1.0', url:'https://www.phylopic.org/images/f551f54e-1e17-4b0e-985c-74d34a53cb63' } },

    { id:'arachnids', kind:'tip', parent:'arthropods', label:'Arachnids',
      img:{ base:'assets/photos/arachnids', alt:'Jumping spider', caption:'Jumping spider', credit:'Nosferattus · CC0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3APhidippus_regius_female_01.jpg' },
      feats:['Two body parts: cephalothorax and abdomen.', 'Four pairs of legs.', 'No antennae; no wings.', 'Simple eyes.'],
      eg:'spider, scorpion, tick',
      sil:{ file:'arachnids', name:'Araneus diadematus, garden spider', by:'Amy Beauvois', licence:'CC0 1.0', url:'https://www.phylopic.org/images/2f7145fc-002c-40e8-9b35-16f95b05f0e3' } },

    { id:'crustaceans', kind:'tip', parent:'arthropods', label:'Crustaceans',
      img:{ base:'assets/photos/crustaceans', alt:'Shore crab, from above', caption:'Shore crab, from above', credit:'Josh Boe · CC BY 4.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ACarcinus_maenas_265985977.jpg' },
      feats:['Two body parts.', 'More than four pairs of legs.', 'Two pairs of antennae.', 'Gills; most live in water.'],
      eg:'crab, lobster, shrimp, woodlouse',
      sil:{ file:'crustaceans', name:'Carcinus maenas, shore crab', by:'Caleb M. Gordon', licence:'CC0 1.0', url:'https://www.phylopic.org/images/a34e9df9-d549-4ba2-a648-7785a84206e5' } },

    /* ---- Plants ---- */
    { id:'plants', kind:'kingdom', parent:'root', label:'Plants', ring:'Plants', shift:-8,
      img:{ base:'assets/photos/plants', alt:'Rainforest trees, seen from the ground', caption:'Rainforest trees, seen from the ground', credit:'Rohitjahnavi · CC0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ACanopy_shyness_Malaysian_rainforest_Dryabalonops_aromatica_IMG20250930121416_Canopy_Shyness_01.jpg' },
      feats:['Many cells, each with a nucleus, a cell wall made of cellulose, and chloroplasts.',
             'Make their own food by photosynthesis.',
             'Stay in one place.'],
      eg:'ferns and flowering plants, and also mosses and conifers',
      real:'Mosses and conifers are plants too; the syllabus names only ferns and flowering plants.' },

    { id:'ferns', kind:'tip', parent:'plants', label:'Ferns',
      img:{ base:'assets/photos/ferns', alt:'Fern fronds in sunlight', caption:'Fern fronds in sunlight', credit:'USFWS/Southeast · Public domain · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AFern_fronds_at_Riverbend_CPA_%2826611537224%29.jpg' },
      feats:['Leaves called fronds.', 'No flowers; reproduce by spores, made on the underside of the fronds.', 'Xylem and phloem.'],
      eg:'bracken, male fern, tree ferns',
      sil:{ file:'ferns', name:'Polypodium vulgare, common polypody', by:'Guillaume Dera', licence:'CC0 1.0', url:'https://www.phylopic.org/images/ee243ea1-c311-4fa2-b730-928b80117515' } },

    { id:'flowering', kind:'group', parent:'plants', label:'Flowering plants', ring:'Flowering plants', shift:6,
      img:{ base:'assets/photos/flowering', alt:'Wildflowers', caption:'Wildflowers', credit:'Peter Cooper Jr. · CC0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ABlanket_flowers%2C_Cathleen_Kuehl_Memorial_Wildflower_Meadow_2026-08-01.jpg' },
      feats:['Reproduce by flowers; the seeds form inside an ovary.'],
      eg:'monocotyledons and dicotyledons' },

    { id:'monocots', kind:'tip', parent:'flowering', label:'Monocotyledons',
      img:{ base:'assets/photos/monocots', alt:'Rice terraces, Bali', caption:'Rice terraces, Bali', credit:'Vyacheslav Argenberg · CC BY 4.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ARice_terraces%2C_Bali.jpg' },
      feats:['One cotyledon in the seed.', 'Long, strap-like leaves with parallel veins.', 'Flower parts in threes.'],
      eg:'rice, maize, grasses, lilies, orchids',
      sil:{ file:'monocots', name:'Oryza sativa, rice', by:'Mason McNair', licence:'CC0 1.0', url:'https://www.phylopic.org/images/bdae8ff7-6c00-4af9-8464-a44b3e6c65f9' } },

    { id:'dicots', kind:'tip', parent:'flowering', label:'Dicotyledons',
      img:{ base:'assets/photos/dicots', alt:'Sunflowers', caption:'Sunflowers', credit:'Wenchieh Yang · CC0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3ASunflower_Fields.jpg' },
      feats:['Two cotyledons in the seed.', 'Broad leaves with a network of veins.', 'Flower parts in fours or fives.'],
      eg:'sunflower, bean, rose, most trees',
      sil:{ file:'dicots', name:'Helianthus annuus, sunflower', by:'Mason McNair', licence:'CC0 1.0', url:'https://www.phylopic.org/images/40b91c6c-4ef8-4a5a-9b90-85fb50d74c5b' } },

    /* ---- the three kingdoms that are one branch each ---- */
    { id:'fungi', kind:'tip', parent:'root', label:'Fungi',
      img:{ base:'assets/photos/fungi', alt:'Fly agaric', caption:'Fly agaric', credit:'George Chernilevsky · Public domain · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AAmanita_muscaria_2018_G10.jpg' },
      feats:['A nucleus; a cell wall not made of cellulose.', 'No chloroplasts, so no photosynthesis.',
             'Feed by digesting food outside the body with enzymes and absorbing it: saprophytes or parasites.',
             'Most are threads called hyphae; yeast is a single cell.'],
      eg:'mushroom, mould, yeast',
      real:'The wall is made of chitin, the same material as an insect skeleton.',
      sil:{ file:'fungi', name:'Amanita muscaria, fly agaric', by:'Mason McNair', licence:'CC0 1.0', url:'https://www.phylopic.org/images/237a0fb1-7b73-43ec-b0a5-eff95e7237df' } },

    { id:'protoctists', kind:'tip', parent:'root', label:'Protoctists',
      img:{ base:'assets/photos/protoctists', alt:'Paramecium, under the microscope', caption:'Paramecium, under the microscope', credit:'MTadey · CC BY 4.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AParam%C3%A9cium_caud%C3%A1tum.jpg' },
      feats:['One cell, or a few; a nucleus.', 'Some have chloroplasts and feed like plants: the algae.', 'Some feed like animals: Amoeba.'],
      eg:'Amoeba, Paramecium, Plasmodium, seaweeds',
      real:'Everything with a nucleus that is not a plant, an animal or a fungus. It is a drawer for what is left over, not one family.',
      sil:{ file:'protoctists', name:'Amoeba proteus', by:'Carlo De Rito', licence:'CC0 1.0', url:'https://www.phylopic.org/images/4227f7b5-b1e5-4af6-99cc-af68795f5855' } },

    { id:'prokaryotes', kind:'tip', parent:'root', label:'Prokaryotes',
      img:{ base:'assets/photos/prokaryotes', alt:'Escherichia coli, electron microscope, coloured', caption:'Escherichia coli, electron microscope, coloured', credit:'NIAID · CC BY 2.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AE._coli_Bacteria_%2816578744517%29.jpg' },
      feats:['One cell; no nucleus.', 'The DNA lies free in the cytoplasm as a circle, often with plasmids.', 'A cell wall not made of cellulose.', 'No mitochondria.'],
      eg:'Escherichia coli, Salmonella, the cyanobacteria',
      real:'Bacteria, and the archaea, which look like bacteria but are a separate line as old as they are. The branch nearest the middle: the first cells were prokaryotes.',
      sil:{ file:'prokaryotes', name:'Escherichia coli', by:'Arcadia Science', licence:'CC0 1.0', url:'https://www.phylopic.org/images/27d35deb-98bb-4833-8121-8750f35cd09b' } }
  ],

  /* off the tree, on purpose */
  viruses: { id:'viruses', kind:'tip', label:'Viruses', sub:'not on the tree', path:'In no kingdom', angle:344, r:190,
    img:{ base:'assets/photos/viruses', alt:'Influenza A virus, electron microscope, coloured', caption:'Influenza A virus, electron microscope, coloured', credit:'NIH Image Gallery · Public domain · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AInfluenza_A_Virus_%28H1N1%29-1.jpg' },
    feats:['A protein coat around genetic material, DNA or RNA.', 'No cell.', 'Reproduce only inside a host cell.'],
    eg:'influenza, HIV, the tobacco mosaic virus',
    real:'On their own they show none of the seven characteristics, so they are not counted as living. That is why they float here, off the tree.',
    sil:{ file:'viruses', name:'Influenza A virus', by:'Ian Shin', licence:'CC0 1.0', url:'https://www.phylopic.org/images/3813d3bb-8bad-469c-99b6-fcea358b1d49' } },

  /* the five steps from the vent to the first cell. Exam words first, reality after. */
  story: [
    { n:1, title:'The vent', chip:'Water · the medium for life',
      icon:'<path d="M-5 8 L-2 -7 L2 -7 L5 8 Z"/><path d="M0 -9 c0 -3 2 -4 2 -7 M-3 -10 c0 -2 1 -3 1 -5"/>',
      text:'Four billion years ago the sea floor leaks warm water through rock full of tiny holes. It is warm, not boiling; alkaline, not acidic; and rich in hydrogen, made below the sea floor where seawater reacts with the rock and carried up by the vent. Nothing is alive yet.',
      real:'Lost City, in the Atlantic, is the living example: white chimneys 800 metres down, still venting today. The reaction that makes the hydrogen is called serpentinisation: iron in the rock takes the oxygen from water and leaves H₂. The evidence for and against this idea, and the rival one, is on step 5.',
      img:{ base:'assets/photos/lost-city', alt:'White carbonate chimneys of the Lost City vent field, lit by a submersible in the dark',
            caption:'Lost City vent field, 750–900 m down', credit:'Ifremer, ROV Victor 6000, 2005 · CC BY 4.0',
            url:'https://commons.wikimedia.org/wiki/File:Massif_de_chemin%C3%A9es_carbonat%C3%A9es_(Ifremer_00569-68094_-_25275).jpg' },
      book:true,
      reads:[ { t:'Lost City, the vent field itself', url:'https://en.wikipedia.org/wiki/Lost_City_Hydrothermal_Field' },
              { t:'The hydrothermal vent hypothesis, Understanding Evolution', url:'https://evolution.berkeley.edu/the-origin-of-life/the-hydrothermal-vent-hypothesis/' } ] },

    { n:2, title:'The building blocks', chip:'Amino acids, sugars, fatty acids · Topic 4',
      icon:'<circle cx="-5" cy="3" r="3"/><circle cx="5" cy="3" r="3"/><circle cx="0" cy="-5" r="3"/><path d="M-3 1 L-1 -3 M3 1 L1 -3"/>',
      text:'Carbon dioxide in the seawater meets hydrogen rising from the rock below. Metal minerals in the walls speed the reaction, the job enzymes do in you. Small carbon molecules form: the pieces of the carbohydrates, fats and proteins you meet in Topic 4.',
      real:'In 2025 a laboratory made the first of these molecules from CO₂ and H₂ on iron–sulfur minerals, with no enzymes at all.',
      img:{ base:'assets/photos/glycine', alt:'A ball-and-stick model of glycine, the simplest amino acid', caption:'Glycine, the simplest amino acid: carbon black, oxygen red, nitrogen blue, hydrogen white', credit:'Ben Mills · Public domain · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AGlycine-neutral-Ipttt-conformer-3D-bs-17.png' },
      reads:[ { t:'CO₂ to formate and acetate on iron–sulfur minerals, 2025', url:'https://phys.org/news/2025-10-underwater-thermal-vents-molecular-precursors.html' } ] },

    { n:3, title:'The bag', chip:'Fats · Topic 4',
      icon:'<circle cx="0" cy="0" r="8"/><circle cx="0" cy="0" r="4.5" stroke-dasharray="1.6 1.6"/>',
      text:'A fatty acid has a head that likes water and a tail that does not. In water they line up and close into a bubble. That bubble is a membrane, and inside it chemistry stays together.',
      real:'Shown in the laboratory in hot, alkaline, salty water in 2019. The membranes in every cell today use the same trick, with two tails on each molecule.',
      img:{ base:'assets/photos/liposome', alt:'A liposome drawn in cross-section: a hollow ball whose wall is two layers of molecules with round heads pointing out and tails pointing in', caption:'A liposome: a bubble made of a double layer of fat-like molecules, heads out, tails in', credit:'Mariana Ruiz Villarreal (LadyofHats) · Public domain · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File:Phospholipids_aqueous_solution_structures.svg' },
      reads:[ { t:'Vesicles form under vent conditions, Jordan et al. 2019', url:'https://www.nature.com/articles/s41559-019-1015-y' } ] },

    { n:4, title:'The copier', chip:'DNA · Topic 4, Supplement',
      icon:'<path d="M-8 -6 C -4 -6, -4 6, 0 6 S 4 -6, 8 -6"/><path d="M-8 6 C -4 6, -4 -6, 0 -6 S 4 6, 8 6"/>',
      text:'Something has to copy itself. The best candidate is RNA, which both stores information and speeds up reactions. Later DNA takes over the storing: two strands, A with T and C with G, the same code in every living thing.',
      real:'Nobody has yet made an RNA that copies itself unaided. The closest, published in 2026, copies its partner strand and then itself in two separate steps.',
      img:{ base:'assets/photos/rna', alt:'A textbook illustration comparing RNA, one strand of bases, with DNA, two strands wound together', caption:'RNA is one strand of bases; DNA is two', credit:'explorebiology · CC BY 4.0 · Wikimedia Commons', url:'https://commons.wikimedia.org/wiki/File%3AXBio_illustration_%E2%80%93_RNA.png' },
      reads:[ { t:'A ribozyme that copies and evolves, Salk Institute 2024', url:'https://www.salk.edu/news-release/modeling-the-origins-of-life-new-evidence-for-an-rna-world/' },
              { t:'QT45, the closest yet to self-copying RNA, 2026', url:'https://www.sciencealert.com/this-rna-almost-self-replicates-which-could-explain-lifes-origins' } ] },

    { n:5, title:'The first cell', chip:'The seven characteristics · 1.1',
      icon:'<circle cx="0" cy="0" r="8"/><path d="M-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0"/><circle cx="-4.5" cy="-3" r=".9" fill="currentColor"/><circle cx="4" cy="3.5" r=".9" fill="currentColor"/>',
      text:'Every living thing descends from one population of cells, LUCA, about 4.2 billion years ago. It lived on hydrogen and carbon dioxide, with DNA, proteins and a membrane. It fed, respired, grew, reproduced, excreted and responded: alive by the seven tests of 1.1.',
      real:'This is one of two leading ideas, not a settled fact. The vent idea starts from biology; the rival idea, pools on land that dry out and refill in sunlight, starts from chemistry. The evidence for and against each is below. Everyone agrees on this much: life began in water, chemistry came before cells, and every organism shares the DNA code. That shared code is why differences in DNA show how closely two groups are related, which is what the branches of this tree mean.',
      img:{ base:'assets/photos/first-cell', alt:'A painting of the last universal common ancestor: a cell with a membrane, DNA being pulled apart as it divides, and proteins',
            caption:'LUCA, dividing: a membrane, DNA, proteins', credit:'Illustration by David S. Goodsell, RCSB Protein Data Bank · CC BY 4.0',
            url:'https://pdb101.rcsb.org/sci-art/goodsell-gallery/last-universal-common-ancestor' },
      book:true,
      evidence:[
        { side:'Deep-sea alkaline vents',
          for:[
            { t:'The oldest cells we can reconstruct lived on hydrogen and carbon dioxide with no oxygen: a vent\'s diet.', s:'Moody et al., Nature Ecology & Evolution 2024', url:'https://www.nature.com/articles/s41559-024-02474-w' },
            { t:'In a reactor with a vent\'s gradients, CO₂ turned into formate and acetate on iron–sulfur minerals, with no enzymes.', s:'Ferreira et al., JACS 2025', url:'https://phys.org/news/2025-10-underwater-thermal-vents-molecular-precursors.html' },
            { t:'Fatty acids close into vesicles in hot, alkaline, salty water.', s:'Jordan et al., Nature Ecology & Evolution 2019', url:'https://www.nature.com/articles/s41559-019-1015-y' },
            { t:'Rust chimneys grown in the laboratory pull RNA out of the water and hold it a thousand times more concentrated.', s:'Helmbrecht et al., Geobiology 2023', url:'https://onlinelibrary.wiley.com/doi/10.1111/gbi.12572' } ],
          against:[
            { t:'Lost City\'s water is only strongly alkaline once it has cooled; at depth its pH is close to seawater, so the gradient the idea runs on is weaker than claimed.', s:'Tutolo, Goldschmidt 2025', url:'https://goldschmidtabstracts.info/2025/30191.pdf' },
            { t:'Modelled, the gradient across a chimney wall is too small and too short-lived to power anything.', s:'Jackson, J. Mol. Evol. 2016', url:'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4999464/' },
            { t:'Nobody has yet made the parts of RNA under vent conditions, and the two camps disagree on whether it can be done.', s:'Knowable Magazine 2020, both sides', url:'https://knowablemagazine.org/content/article/physical-world/2020/searching-high-and-low-origins-life' } ] },
        { side:'Pools on land that dry out and refill',
          for:[
            { t:'One network of cyanide chemistry, driven by sunlight, makes the parts of RNA, proteins and lipids together, in shallow water.', s:'Patel et al., Nature Chemistry 2015', url:'https://www.nature.com/articles/nchem.2202' },
            { t:'Drying joins RNA\'s parts into chains and packs them into vesicles; refilling sets them free. A hot spring does this every day.', s:'Damer & Deamer, Astrobiology 2020', url:'https://doi.org/10.1089/ast.2019.2045' },
            { t:'Sparks between droplets in a spray of water make the bases of RNA from simple gases; no lightning needed.', s:'Zare lab, Science Advances 2025', url:'https://www.science.org/doi/10.1126/sciadv.adt8979' },
            { t:'A 2026 special issue puts the case for whole landscapes of springs, lakes and crater pools.', s:'Astrobiology, May 2026', url:'https://news.ucsc.edu/2026/05/special-issue-of-astrobiology/' } ],
          against:[
            { t:'Pools need land, and the early Earth may have been almost all ocean: 3.2 billion years ago the continents were largely under water.', s:'Johnson & Wing, Nature Geoscience 2020', url:'https://www.nature.com/articles/s41561-020-0538-9' },
            { t:'The sunlight that drives the chemistry also breaks RNA, and a pool dilutes and washes away what it makes.', s:'Knowable Magazine 2020, both sides', url:'https://knowablemagazine.org/content/article/physical-world/2020/searching-high-and-low-origins-life' },
            { t:'The oldest cells look like vent dwellers, not pool dwellers: they lived on hydrogen and carbon dioxide in the dark.', s:'Weiss et al., Nature Microbiology 2016', url:'https://www.nature.com/articles/nmicrobiol2016116' } ] } ],
      evidenceNote:'A hot spring is a hydrothermal system on land, with the rock, the heat and the gradients of a vent and the drying of a pool. The two ideas may meet there.',
      reads:[ { t:'The parts of RNA from cyanide chemistry in sunlight, Sutherland lab 2015', url:'https://www.nature.com/articles/nchem.2202' },
              { t:'LUCA at 4.2 billion years, Moody et al. 2024', url:'https://www.nature.com/articles/s41559-024-02474-w' } ] }
  ],

  /* the book behind the story — a typeset card, not the cover, which is the publisher's */
  book: { title:'The Vital Question', author:'Nick Lane', year:2015,
          text:'The case for this story, told properly: why life needs a flow of energy, why a vent supplies it, and why complex cells took two billion more years. Dr Mompel recommends it.',
          url:'https://nick-lane.net/books/the-vital-question/',
          cover:'assets/photos/vital-question-cover', coverCredit:'Cover: Profile Books' }
};
