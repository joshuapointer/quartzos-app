// flow-data.jsx — Full QuartzOS reference data, sourced from uploads/*.json
// Exhaustive dataset; no abridgements. Drives every decision in the flow.

const QMETA = {
  name: 'QuartzOS Reference Data',
  version: '1.0.0',
  release_date: '2026-04-27',
  temperature_convention:
    'All concentrate.surface_temp_f values are INTERIOR SURFACE temperatures (probe-truth, Terpometer V1 contact). Sensor readings on instruments differ — use the sensor + banger.ir_offset_f + banger.ir_offset_sign math to convert.',
  calibration_formula:
    'displayed_temp = interior_surface_temp + (banger.ir_offset_sign × banger.ir_offset_f) + wall.modifier_f',
};

// ─── Bangers (full set, 14 entries) ────────────────────────────
const BANGERS = [
  { id:'flat-top', name:'Flat Top', category:'classic', geometry:'bucket',
    description:'Universal default. Cylindrical bucket, flat rim. ~80% of bangers in market.',
    surface_range:[500,600], ir_offset_f:35, ir_offset_sign:-1,
    ir_aim:'Center underside of bucket bottom, ½″ away',
    heat_time:'20–40s', heat_seconds:[20,40], cool_seconds:[30,45],
    pattern:'circular_sweep',
    zones:[{anatomy:'bucket bottom', pct:60},{anatomy:'lower walls', pct:40}],
    torch_distance:'1–2″', visual_cue:'Just shy of orange glow',
    cold_start:'OPTIONAL', tags:['CLASSIC'],
    mfrs:['Quave','Toro','Highly Educated','Evan Shore','Honeybee Herb','Pulsar','MJ Arsenal'] },

  { id:'beveled', name:'Beveled Edge', category:'classic', geometry:'bucket',
    description:'Inward-cut bevel for flush bubble cap seal. Better seal lets you target 20–40°F lower than non-beveled flat top.',
    surface_range:[480,580], ir_offset_f:35, ir_offset_sign:-1,
    ir_aim:'Center underside of bucket bottom, ½″ away',
    heat_time:'25–35s', heat_seconds:[25,35], cool_seconds:[35,50],
    pattern:'circular_sweep',
    zones:[{anatomy:'bucket bottom', pct:60},{anatomy:'lower walls', pct:40}],
    torch_distance:'1–2″', visual_cue:'Just barely glowing',
    cold_start:'OPTIONAL', tags:['CLASSIC','BETTER SEAL'],
    mfrs:['Quave','Highly Educated Gavel','Evan Shore','Pulsar','Honeybee Herb'] },

  { id:'opaque', name:'Opaque Bottom', category:'premium', geometry:'bucket',
    description:'Sandblasted/frosted bottom disc. Best IR accuracy of any banger. Use Dab Rite "Opaque Quartz" emissivity preset.',
    surface_range:[480,560], ir_offset_f:25, ir_offset_sign:-1,
    ir_aim:'Center of opaque bottom underside, ½″ away — switch IR to Opaque Quartz preset',
    heat_time:'30–40s', heat_seconds:[30,40], cool_seconds:[45,60],
    pattern:'circular_sweep',
    zones:[{anatomy:'opaque bottom', pct:70},{anatomy:'lower walls', pct:30}],
    torch_distance:'1–2″', visual_cue:'Faint side-wall glow only — opaque hides bottom glow',
    cold_start:'OPTIONAL', tags:['BEST IR ACCURACY'],
    mfrs:['Evan Shore Opaque ESB','Highly Educated Gavel V3','Lavatech XL Opaque','Honeybee Herb Honey & Milk'] },

  { id:'thermal', name:'Thermal (Double Wall)', category:'specialty', geometry:'bucket',
    description:'Air gap between walls insulates inner cup. IR reads cooler than actual oil contact temp because IR sees outer wall — compensate via timing.',
    surface_range:[500,600], ir_offset_f:60, ir_offset_sign:-1,
    ir_aim:'Outer base of bucket, ½″ away (manufacturer-correct aim)',
    heat_time:'30–45s', heat_seconds:[30,45], cool_seconds:[45,60],
    pattern:'circular_sweep_outer_only',
    zones:[{anatomy:'outer side wall', pct:70},{anatomy:'outer bottom', pct:30}],
    torch_distance:'½–1″', visual_cue:'No glow / faint outer corner only',
    cold_start:'YES', tags:['IR READS LOW'],
    mfrs:['AFM Thermal','Pukinbeagle','Pulsar Thermal','Ooze'] },

  { id:'round', name:'Round Bottom', category:'classic', geometry:'bucket',
    description:'Hemispherical interior, no corners. Best shape for terp pearls (rolls freely) and cold start (oil pools center).',
    surface_range:[500,600], ir_offset_f:35, ir_offset_sign:-1,
    ir_aim:'Lowest curve apex (= bottom center), ½″ away',
    heat_time:'30–45s', heat_seconds:[30,45], cool_seconds:[30,50],
    pattern:'circular_sweep',
    zones:[{anatomy:'bottom curve', pct:70},{anatomy:'lower walls', pct:30}],
    torch_distance:'1–2″', visual_cue:'Just before glow on the curve',
    cold_start:'YES', tags:['CLASSIC','COLD-START IDEAL'],
    mfrs:['AFM Round Bottom','Bear Quartz Round V2','VapeBrat Full-Weld','Joel Halen'] },

  { id:'core-reactor', name:'Core Reactor', category:'specialty', geometry:'bucket',
    description:'Central pillar increases surface area + thermal mass. Cold-start compatible per Honeybee Herb.',
    surface_range:[500,580], ir_offset_f:45, ir_offset_sign:-1,
    ir_aim:'Inner bucket floor around pillar, ½″ away',
    heat_time:'25–30s', heat_seconds:[25,30], cool_seconds:[45,60],
    pattern:'circular_sweep_floor',
    zones:[{anatomy:'opaque bottom', pct:70},{anatomy:'lower outer wall', pct:30}],
    torch_distance:'1–2″', visual_cue:'Heat shimmer, no orange glow',
    cold_start:'YES', tags:['HEAT MASS','COLD-START OK'],
    mfrs:['VapeBrat Core Reactor','Yo Dabba Dabba','Honeybee Herb Core Reactor','Termini'] },

  { id:'swing-arm', name:'Swing-Arm Honey Bucket', category:'specialty', geometry:'bucket',
    description:'Legacy form factor — heat dome out of chamber, swing back in. NOT cold-start compatible.',
    surface_range:[500,600], ir_offset_f:40, ir_offset_sign:-1,
    ir_aim:'Outside of dome in heating position, ~1″ away',
    heat_time:'15–30s', heat_seconds:[15,30], cool_seconds:[10,30],
    pattern:'circular_sweep',
    zones:[{anatomy:'swung-out dish bottom', pct:100}],
    torch_distance:'1″', visual_cue:'Slight shimmer, no red',
    cold_start:'NO', tags:['LEGACY','NO COLD-START'],
    mfrs:['Mothership (vintage)','Honeybee Herb OFZ'] },

  { id:'terp-slurper', name:'Terp Slurper', category:'slurper', geometry:'slurper',
    description:'Bottom dish + slotted column + bucket. Marble cap. Hot-start required — vortex needs preheat.',
    surface_range:[420,580], ir_offset_f:20, ir_offset_sign:1,
    ir_aim:'Side of cup ½″ above the dish (column, NOT dish underside) — Dab Rite 2025 spec',
    heat_time:'55–90s', heat_seconds:[55,90], cool_seconds:[35,60],
    pattern:'sequenced',
    heat_breakdown:[
      {stage:'Dish', seconds:40, note:'Heat the bottom dish first.'},
      {stage:'Column', seconds:25, note:'Move flame up the slotted column.'},
      {stage:'Dish return', seconds:15, note:'Back to the dish to even out.'},
    ],
    zones:[{anatomy:'bottom dish', pct:50},{anatomy:'slotted column', pct:31},{anatomy:'dish return', pct:19}],
    torch_distance:'½–1″', visual_cue:'Faint dish glow only',
    cold_start:'NO', tags:['SLURPER-CLASS','NO COLD-START'],
    mfrs:['Toro (originator)','Highly Educated','Evan Shore','MJ Arsenal','Bear Quartz','Campfire Quartz'] },

  { id:'blender', name:'Blender / Vector', category:'slurper', geometry:'slurper',
    description:'Slotted hurricane disc spins pearls automatically. Tighter temp window than slurper.',
    surface_range:[500,580], ir_offset_f:20, ir_offset_sign:1,
    ir_aim:'Side of the tower at mid-height (slurper-class — NOT disc underside)',
    heat_time:'25–35s', heat_seconds:[25,35], cool_seconds:[30,45],
    pattern:'circular_sweep',
    zones:[{anatomy:'under slotted disc', pct:60},{anatomy:'lower wall above slits', pct:40}],
    torch_distance:'½–1″', visual_cue:'Faint red bottom corner',
    cold_start:'OPTIONAL', tags:['SLURPER-CLASS','AUTO-SPIN'],
    mfrs:['Bear Quartz V2 Blender','Pulsar Quartz Blender','Campfire V2','VapeBrat Swirl'] },

  { id:'spinner', name:'Spinner / Tourbillon', category:'slurper', geometry:'slurper',
    description:'Angled airflow holes drive pearl spin via inhale velocity. Pearl spin is airflow-driven, not temperature-driven.',
    surface_range:[500,600], ir_offset_f:20, ir_offset_sign:1,
    ir_aim:'Side of bucket wall mid-height (avoid drilled holes — radial crack risk)',
    heat_time:'25–40s', heat_seconds:[25,40], cool_seconds:[45,60],
    pattern:'circular_sweep',
    zones:[{anatomy:'bucket bottom', pct:65},{anatomy:'wall between holes', pct:35}],
    torch_distance:'½–1″', visual_cue:'Faint glow on the bottom',
    cold_start:'OPTIONAL', tags:['SLURPER-CLASS','AUTO-SPIN'],
    mfrs:['Yo Dabba Dabba','VapeBrat Cyclone','aLeaf','IC Glass'] },

  { id:'control-tower', name:'Control Tower (HE)', category:'slurper', geometry:'slurper',
    description:'Highly Educated proprietary slurper with SE Pillar (Surface Enhanced micro-textured quartz).',
    surface_range:[450,580], ir_offset_f:20, ir_offset_sign:1,
    ir_aim:'Side of the chamber, NOT the dish (Highly Educated FAQ)',
    heat_time:'50–60s', heat_seconds:[50,60], cool_seconds:[30,45],
    pattern:'simultaneous_sweep',
    zones:[{anatomy:'dish + chamber simultaneously', pct:100}],
    torch_distance:'½–1″', visual_cue:'Pillar visibly at temp, faint glow in dim room',
    cold_start:'NO', tags:['MFR SPEC','SE PILLAR'],
    mfr_targets:{ solventless:450, hydrocarbon:550 },
    mfrs:['Highly Educated'] },

  { id:'charmer', name:'Quave Charmer', category:'slurper', geometry:'slurper',
    description:'Quave proprietary slurper-blender hybrid. Outer dish with vortex holes, inner cone, three pearls, marble cap.',
    surface_range:[450,580], ir_offset_f:20, ir_offset_sign:1,
    ir_aim:'Side of the cup wall (slurper-class — inferred)',
    heat_time:'35–50s', heat_seconds:[35,50], cool_seconds:[30,45],
    pattern:'circular_sweep',
    zones:[{anatomy:'bottom skirt with vortex holes', pct:60},{anatomy:'bucket walls', pct:40}],
    torch_distance:'½–1″', visual_cue:'No glow / faint dish only',
    cold_start:'NO', tags:['SLURPER-CLASS'],
    mfrs:['Quave Club Banger'] },

  { id:'insert', name:'Quartz Insert (drop-in)', category:'specialty', geometry:'insert',
    description:'Drop-in cup. Either heat host first then drop insert, or load insert cold and heat host briefly.',
    surface_range:[450,550], ir_offset_f:30, ir_offset_sign:-1,
    ir_aim:'Host banger bottom, ½″ away (read banger temp, not insert directly)',
    heat_time:'25–35s host (or 10–25 cold-start)', heat_seconds:[25,35], cool_seconds:[10,30],
    pattern:'circular_sweep',
    zones:[{anatomy:'host banger bottom', pct:60},{anatomy:'host walls', pct:40}],
    torch_distance:'1–2″ host; never insert directly',
    visual_cue:'Per host banger',
    cold_start:'YES', tags:['COLD-START IDEAL'],
    mfrs:['Eternal Quartz (originator)','Quartz Tech','Halen','Hoyes','Ruby Pearl Co','Pulsar RoK'] },

];

// ─── Concentrates (full set, 38 entries incl. blocked) ────────
const CONCENTRATES = [
  // Solventless
  { id:'live-rosin', name:'Live Rosin', cat:'Solventless',
    description:'Fresh-frozen pressed solventless. Glossy amber, sappy.',
    surface_range:[445,520], surface_optimal:480, terps:'high', cold_start_good:true,
    notes:['Cold start GOLD STANDARD','710 Labs anchor: 400–450°F surface','Above 520°F = generic dab taste'],
    confidence:'BRAND+COMMUNITY', tags:['SOLVENTLESS','COLD-START'] },
  { id:'cold-cure', name:'Cold Cure Rosin', cat:'Solventless',
    description:'Live rosin nucleated to creamy badder. Most popular 2026 rosin format.',
    surface_range:[375,510], surface_optimal:460, terps:'high', cold_start_good:true,
    notes:['Cold start STRONGLY recommended','Mood/Puffco anchor: 375–450°F surface','Pushing past 500°F defeats the cure'],
    confidence:'BRAND+MFR', tags:['SOLVENTLESS','COLD-START','2026 DOMINANT'] },
  { id:'fresh-press', name:'Fresh Press Rosin', cat:'Solventless',
    description:'Un-cured rosin. Most volatile-rich, terps not yet homogenized.',
    surface_range:[440,510], surface_optimal:470, terps:'high', cold_start_good:true,
    notes:['Cold start strongly recommended','Gentle ramp protects pinene + ocimene'],
    confidence:'BRAND+COMMUNITY', tags:['SOLVENTLESS','COLD-START'] },
  { id:'rosin-jam', name:'Rosin Jam', cat:'Solventless',
    description:'THCa diamonds in terpene-rich rosin sauce. Heterogeneous.',
    surface_range:[490,545], surface_optimal:510, terps:'high', cold_start_good:true,
    notes:['Slurper preferred — separates phases dynamically','Crystals need ≥480°F to melt cleanly'],
    confidence:'COMMUNITY+BRAND', tags:['SOLVENTLESS','BLEND'] },
  { id:'rosin-badder', name:'Rosin Badder', cat:'Solventless',
    description:'Whipped/agitated rosin. Hashwriter avg 520°F Terpometer interior.',
    surface_range:[480,540], surface_optimal:510, terps:'high', cold_start_good:false,
    notes:['Cold start optional'], confidence:'COMMUNITY', tags:['SOLVENTLESS'] },
  { id:'hot-cure', name:'Hot Cure Rosin', cat:'Solventless',
    description:'Whipped/cured at 90–225°F. Profile shifts to heavier sesquiterpenes.',
    surface_range:[480,545], surface_optimal:510, terps:'med', cold_start_good:false,
    notes:['Cold start optional','Caryophyllene dominant — needs more heat than fresh'],
    confidence:'BRAND+COMMUNITY', tags:['SOLVENTLESS'] },
  { id:'hash-rosin-coin', name:'Hash Rosin Coin', cat:'Solventless',
    description:'Pressed disk from 5–6 star bubble. Premium fresh-frozen input.',
    surface_range:[450,520], surface_optimal:475, terps:'high', cold_start_good:true,
    notes:['Cold start YES','Flatten coin into hash flag for even melt'],
    confidence:'BRAND+COMMUNITY', tags:['SOLVENTLESS','COLD-START'] },
  { id:'persy-rosin', name:'Persy Hash Rosin', cat:'Solventless',
    description:'710 Labs originated. 6-star 90-micron first-wash bubble pressed to rosin.',
    surface_range:[445,520], surface_optimal:480, terps:'high', cold_start_good:true,
    notes:['Treat like live rosin','Genericized term in 2026'],
    confidence:'BRAND', tags:['SOLVENTLESS','PREMIUM'] },
  { id:'high-melt-rosin', name:'High-Melt / Nug-Run Rosin', cat:'Solventless',
    description:'Premium hash rosin from highest-grade nugs. Connoisseur tier 2025–26.',
    surface_range:[445,510], surface_optimal:475, terps:'high', cold_start_good:true,
    notes:['Treat like live rosin','710 Labs Tier 3, Papa\'s Select top tier'],
    confidence:'BRAND', tags:['SOLVENTLESS','PREMIUM'] },

  // Hash
  { id:'bubble-6star', name:'Bubble · 6-Star (Full Melt)', cat:'Hash',
    description:'Ice water hash, full-melt grade. Hashwriter avg 477.5°F Terpometer interior.',
    surface_range:[450,510], surface_optimal:490, terps:'high', cold_start_good:true,
    notes:['Cold start YES','Above 500°F starts charring even 6-star'],
    confidence:'BRAND+COMMUNITY', tags:['HASH','COLD-START'] },
  { id:'bubble-half-melt', name:'Bubble · 3–4 Star (Half Melt)', cat:'Hash',
    description:'Half-melt bubble. Field consensus: don\'t dab — press to rosin.',
    surface_range:[470,520], surface_optimal:495, terps:'med', cold_start_good:false,
    warning:'Better pressed than dabbed.',
    notes:['NOT IDEAL for dabbing','Better used as rosin starter material'],
    confidence:'COMMUNITY', tags:['HASH','NOT IDEAL'] },
  { id:'dry-sift', name:'Dry Sift (Full Melt)', cat:'Hash',
    description:'Mechanically separated trichomes via 45–160µm screens.',
    surface_range:[450,520], surface_optimal:490, terps:'high', cold_start_good:true,
    notes:['Cold start YES','Treat like ice water hash'],
    confidence:'BRAND+COMMUNITY', tags:['HASH','COLD-START'] },
  { id:'temple-ball', name:'Temple Ball', cat:'Hash',
    description:'Hand-rolled spherical hash, Nepalese-style. Frenchy Cannoli legacy.',
    surface_range:[350,450], surface_optimal:400, terps:'high', cold_start_good:true,
    notes:['Press Club: 350°F surface (NOT same as rosin 450°F)','Often a smoke-first product','Cold start strongly recommended'],
    confidence:'BRAND', tags:['HASH','LOW TEMP'] },
  { id:'pressed-hash', name:'Pressed Hashish', cat:'Hash',
    description:'Traditional Moroccan/Afghan/Charas. Will char on most bangers.',
    surface_range:[500,550], surface_optimal:525, terps:'low', cold_start_good:false,
    warning:'Will leave significant residue. Better in pipe or hot knife.',
    notes:['NOT OPTIMAL for dabbing — expect residue'],
    confidence:'BRAND', tags:['HASH','NOT IDEAL'] },

  // Hydrocarbon
  { id:'live-resin', name:'Live Resin', cat:'Hydrocarbon',
    description:'Fresh-frozen hydrocarbon BHO. ~34% of concentrate sales.',
    surface_range:[480,545], surface_optimal:510, terps:'high', cold_start_good:false,
    notes:['Cold start optional','Stay ≤545°F surface to preserve linalool + humulene','Most popular hydrocarbon format'],
    confidence:'MFR+BRAND+COMMUNITY', tags:['HYDROCARBON','POPULAR'] },
  { id:'cured-resin', name:'Cured Resin', cat:'Hydrocarbon',
    description:'BHO from cured flower. Sesquiterpene-heavy.',
    surface_range:[520,580], surface_optimal:545, terps:'low', cold_start_good:false,
    notes:['Cold start NOT typical','Sesquiterpene-heavy — takes more heat'],
    confidence:'BRAND+COMMUNITY', tags:['HYDROCARBON'] },
  { id:'shatter', name:'Shatter', cat:'Hydrocarbon',
    description:'Glassy BHO. Once dominant, now legacy/budget tier.',
    surface_range:[510,580], surface_optimal:545, terps:'low', cold_start_good:false,
    notes:['Cold start NOT typical','Most volatile terps already lost in process'],
    confidence:'COMMUNITY', tags:['HYDROCARBON','LEGACY'] },
  { id:'wax-budder', name:'Wax / Budder / Badder', cat:'Hydrocarbon',
    description:'Whipped BHO. Stable mid-tier across menus.',
    surface_range:[480,540], surface_optimal:510, terps:'med', cold_start_good:false,
    notes:['Cold start optional/popular'], confidence:'COMMUNITY', tags:['HYDROCARBON'] },
  { id:'crumble', name:'Crumble / Honeycomb', cat:'Hydrocarbon',
    description:'Dry powdery BHO. Lower moisture vaporizes easily.',
    surface_range:[480,550], surface_optimal:510, terps:'med', cold_start_good:false,
    notes:['Pearls essential to distribute','Cold start useful'],
    confidence:'COMMUNITY', tags:['HYDROCARBON'] },
  { id:'sugar', name:'Sugar Wax', cat:'Hydrocarbon',
    description:'Small THCa crystals in terpene matrix.',
    surface_range:[480,545], surface_optimal:510, terps:'high', cold_start_good:true,
    notes:['Cold start LOVED for this texture'],
    confidence:'COMMUNITY', tags:['HYDROCARBON','COLD-START'] },
  { id:'sauce-htfse', name:'Sauce (HTFSE)', cat:'Hydrocarbon',
    description:'High-terpene full-spectrum extract. ~50% terpenes.',
    surface_range:[500,580], surface_optimal:530, terps:'high', cold_start_good:true,
    notes:['Cold start recommended for HTFSE','Slurper geometry designed for this'],
    confidence:'BRAND+COMMUNITY', tags:['HYDROCARBON','COLD-START'] },
  { id:'thca-diamonds', name:'THCa Diamonds (alone)', cat:'Hydrocarbon',
    description:'Discrete crystalline gemstones, 95–99% THCa, near-zero terpenes.',
    surface_range:[500,600], surface_optimal:545, terps:'none', cold_start_good:false,
    notes:['Pearls essential','Cold start useful','Sensor-driven temp choice'],
    confidence:'MFR+BRAND', tags:['HYDROCARBON','PURE'] },
  { id:'diamonds-sauce', name:'Diamonds & Sauce', cat:'Hydrocarbon',
    description:'Crystals in terpene-rich sauce.',
    surface_range:[510,570], surface_optimal:530, terps:'high', cold_start_good:true,
    notes:['Slurper preferred','Cold start: sauce volatilizes first, then crystals'],
    confidence:'MFR+BRAND', tags:['HYDROCARBON','COLD-START','BLEND'] },
  { id:'crystalline', name:'THCa Crystalline / Isolate', cat:'Hydrocarbon',
    description:'Pure powder, >99% THCa. Zero terpenes.',
    surface_range:[525,600], surface_optimal:560, terps:'none', cold_start_good:false,
    notes:['Use sticky binder (live resin) for cold start','Just needs full vaporization of THC'],
    confidence:'COMMUNITY', tags:['HYDROCARBON','PURE','NICHE'] },
  { id:'liquid-diamonds', name:'Liquid Diamonds (jar)', cat:'Hydrocarbon',
    description:'Live resin + THCa diamonds. If dabbing jar form: treat like diamonds & sauce.',
    surface_range:[500,570], surface_optimal:530, terps:'high', cold_start_good:false,
    notes:['Mostly vaped not dabbed','If dabbing jar form: treat like diamonds & sauce'],
    confidence:'BRAND', tags:['HYDROCARBON','TRENDING'] },

  // Distillate
  { id:'co2-oil', name:'CO₂ Oil', cat:'Distillate',
    description:'Supercritical CO₂ extraction. Most volatile terps lost in process.',
    surface_range:[520,600], surface_optimal:560, terps:'low', cold_start_good:false,
    notes:['Cold start optional','Fading in dab market — common in carts'],
    confidence:'BRAND', tags:['DISTILLATE'] },
  { id:'thc-distillate', name:'THC Distillate', cat:'Distillate',
    description:'~99% pure, viscous, terpene-stripped.',
    surface_range:[540,620], surface_optimal:580, terps:'none', cold_start_good:false,
    warning:'No flavor — rarely dabbed alone.',
    notes:['Cold start NOT recommended','Hemper 400–500°F (smooth) vs Zen Leaf 600–650°F (cloud)','Rarely dabbed alone'],
    confidence:'BRAND', tags:['DISTILLATE'] },
  { id:'cbn-distillate', name:'CBN Distillate', cat:'Distillate',
    description:'CBN-focused, often blended with sleep terpenes.',
    surface_range:[490,570], surface_optimal:525, terps:'low', cold_start_good:false,
    notes:['CBN boiling: 365°F at 1 atm','Often blended for synergy'],
    confidence:'SCIENCE+BRAND', tags:['DISTILLATE','NICHE'] },
  { id:'cbg-distillate', name:'CBG Distillate', cat:'Distillate',
    description:'CBG-focused. Springer study: degradation begins ~608°F.',
    surface_range:[480,560], surface_optimal:520, terps:'low', cold_start_good:false,
    notes:['CBG boiling: 126°F (very low) — needs gentle heat'],
    confidence:'SCIENCE+BRAND', tags:['DISTILLATE','NICHE'] },
  { id:'thcv-distillate', name:'THCV Distillate', cat:'Distillate',
    description:'THCV boiling 428°F (highest of common cannabinoids), but matrix needs more.',
    surface_range:[540,610], surface_optimal:570, terps:'low', cold_start_good:false,
    notes:['Anecdotal practice — sparse data'],
    confidence:'SCIENCE+ANECDOTAL', tags:['DISTILLATE','NICHE','NOVEL'] },

  // Novel
  { id:'infused-diamonds', name:'Infused Diamonds', cat:'Novel',
    description:'Strain-specific or terpene-infused diamonds.',
    surface_range:[510,570], surface_optimal:530, terps:'high', cold_start_good:true,
    notes:['Cold start YES','Treat as diamonds & sauce'],
    confidence:'BRAND', tags:['NOVEL','COLD-START'] },
  { id:'thcp', name:'THCP Concentrates', cat:'Novel',
    description:'Hemp-derived. Very small % since extremely potent (~33× CB1 binding).',
    surface_range:[510,580], surface_optimal:540, terps:'low', cold_start_good:false,
    warning:'Regulatory uncertainty — Nov 2026 federal hemp ban.',
    notes:['REGULATORY FLAG: H.R. 5371 (Nov 2026)','State bans growing','Treat as distillate-style'],
    confidence:'ANECDOTAL', tags:['NOVEL','GRAY MARKET'] },

  // Blocked (cannot be dabbed)
  { id:'hash-holes', name:'Hash Holes / Donut Joints', cat:'Novel',
    description:'Pre-roll with central rosin/bubble hash worm.',
    surface_range:null, surface_optimal:null, terps:'high', cold_start_good:false,
    blocked:'This is a pre-roll format. Light it and smoke it — don\'t put it on a banger.',
    confidence:'N/A', tags:['SMOKE ONLY'] },
  { id:'kief', name:'Kief / Static', cat:'Hash',
    description:'Loose unrefined trichome powder. Dust, low-melt.',
    surface_range:null, surface_optimal:null, terps:'med', cold_start_good:false,
    blocked:'Kief is too dusty for direct dabs and will combust unevenly. Press it to rosin first, or use as bowl topper.',
    confidence:'N/A', tags:['NOT FOR DAB'] },
  { id:'rso', name:'RSO / FECO', cat:'Distillate',
    description:'Rick Simpson Oil / Full Extract Cannabis Oil.',
    surface_range:null, surface_optimal:null, terps:'low', cold_start_good:false,
    blocked:'RSO is meant for oral or topical use. Dabbing is harsh due to chlorophyll, waxes, and residual solvents.',
    confidence:'N/A', tags:['ORAL/TOPICAL'] },
  { id:'bubble-1-2', name:'Bubble · 1–2 Star', cat:'Hash',
    description:'Cooking-grade ice water hash.',
    surface_range:null, surface_optimal:null, terps:'low', cold_start_good:false,
    blocked:'1–2 star bubble has too much plant matter. Use it for edibles or press multiple grades together to rosin.',
    confidence:'N/A', tags:['NOT FOR DAB'] },
];

// ─── Sensors ─────────────────────────────────────────────
// DabRite IR is the only supported sensor in Quartzie.
const SENSORS = [
  { id:'ir', name:'DabRite IR',
    short:'DabRite Pro · non-contact infrared',
    method:'ir',
    description:'Non-contact infrared. Aim per banger geometry — bucket vs slurper read differently.',
    calibration:'Apply banger.ir_offset_sign × banger.ir_offset_f. Bucket-class subtracts, slurper-class adds.',
  },
];

// ─── Wall thicknesses ────────────────────────────────────
const WALLS = [
  { id:'thin', name:'Thin', thickness:'1.5–2.5 mm', mod:-8,
    description:'Light flat tops. Faster heat, faster cool.' },
  { id:'standard', name:'Standard', thickness:'3–4 mm', mod:0,
    description:'Typical premium banger. Default.' },
  { id:'thick', name:'Thick', thickness:'5–6 mm', mod:12,
    description:'Heavy reactor / opaque. More retention.' },
  { id:'unknown', name:'Don\'t know', thickness:'—', mod:0,
    description:'Defaults to standard.' },
];

// ─── Calibration math ────────────────────────────────────
// displayed = surface + (sign × |offset|) + wall.mod
// For e-nail: PID setpoint = surface + 50°F (or surface directly if MiniNail-on-MiniNail)
function computeCalibration(banger, concentrate, sensor, wall) {
  if (!banger || !concentrate || !sensor || !wall) {
    return { surface:0, displayed:0, low:0, high:0, dunk:0, wallMod:0,
             irOffset:0, irSign:0, formula:'', branch:'none' };
  }
  // Manufacturer override (e.g. Control Tower 450 solventless / 550 hydrocarbon)
  let surface = concentrate.surface_optimal || 510;
  let mfrNote = null;
  if (banger.mfr_targets) {
    const isSolventless = concentrate.cat === 'Solventless' || concentrate.cat === 'Hash';
    if (isSolventless && banger.mfr_targets.solventless) {
      surface = banger.mfr_targets.solventless;
      mfrNote = `Override: HE Control Tower spec for solventless = ${surface}°F.`;
    } else if (!isSolventless && banger.mfr_targets.hydrocarbon) {
      surface = banger.mfr_targets.hydrocarbon;
      mfrNote = `Override: HE Control Tower spec for hydrocarbon = ${surface}°F.`;
    }
  }

  const wallMod = wall.mod || 0;

  if (false) { /* deprecated: e-nail branch removed */
    const setpoint = surface + 50; // PID midpoint
    return {
      surface, displayed: setpoint,
      low: setpoint - 10, high: setpoint + 10,
      dunk: surface - 250, wallMod, irOffset: 0, irSign: 0,
      formula: `${surface}° (surface) + 50° (PID coil offset) = ${setpoint}° setpoint`,
      branch: 'enail', mfrNote,
    };
  }

  if (false) { /* deprecated: contact-probe branch removed */
    const displayed = surface + wallMod;
    return {
      surface, displayed,
      low: displayed - 15, high: displayed + 15,
      dunk: displayed - 280, wallMod, irOffset: 0, irSign: 0,
      formula: `${surface}° (surface) ${wallMod >= 0 ? '+' : '−'} ${Math.abs(wallMod)}° (wall) = ${displayed}° on probe`,
      branch: 'contact', mfrNote,
    };
  }

  // IR & visual both use the IR offset math
  const irOffset = banger.ir_offset_f || 0;
  const irSign = banger.ir_offset_sign || 0;
  const irDelta = irSign * irOffset;
  const displayed = surface + irDelta + wallMod;
  const formula =
    `${surface}° (surface) ${irDelta >= 0 ? '+' : '−'} ${Math.abs(irDelta)}° (${banger.geometry}-class IR) ` +
    `${wallMod >= 0 ? '+' : '−'} ${Math.abs(wallMod)}° (wall) = ${displayed}°`;
  return {
    surface, displayed,
    low: displayed - 15, high: displayed + 15,
    dunk: displayed - 280, wallMod, irOffset, irSign,
    formula, branch: sensor.method, mfrNote,
  };
}

// Helpful: cold-start eligibility combining concentrate × banger
function coldStartFit(concentrate, banger) {
  if (!concentrate || !banger) return { eligible:false, level:'na' };
  if (banger.cold_start === 'NO') return { eligible:false, level:'banger-blocks' };
  if (concentrate.cold_start_good && banger.cold_start === 'YES') return { eligible:true, level:'ideal' };
  if (concentrate.cold_start_good && banger.cold_start === 'OPTIONAL') return { eligible:true, level:'good' };
  return { eligible:true, level:'optional' };
}

// Curated saved presets — built around documented anchor specs
const SAVED_PRESETS = [
  { id:'quartz', name:'Quartz Recommended', kind:'quartz',
    banger:'flat-top', concentrate:'live-resin', sensor:'ir', wall:'standard',
    builtin:true, desc:'Live resin · flat top · IR. Workhorse.' },
  { id:'opaque', name:'Opaque Recommended', kind:'opaque',
    banger:'opaque', concentrate:'live-resin', sensor:'ir', wall:'thick',
    builtin:true, desc:'Best IR accuracy. Switch to Opaque Quartz preset on the IR.' },
  { id:'rosin', name:'710 Labs Solventless', kind:'low',
    banger:'round', concentrate:'live-rosin', sensor:'ir', wall:'standard',
    builtin:true, desc:'480°F surface anchor for fresh-press rosin.' },
  { id:'cold-cure-low', name:'Cold-Cure · Low & Slow', kind:'low',
    banger:'round', concentrate:'cold-cure', sensor:'ir', wall:'standard',
    builtin:false, desc:'Mood/Puffco anchor. 460°F surface, IR-aimed.' },
  { id:'hash-coin', name:'Hash Coin · Cold Start', kind:'custom',
    banger:'insert', concentrate:'hash-rosin-coin', sensor:'ir', wall:'standard',
    builtin:false, desc:'Insert workflow, cold-start ideal.' },
  { id:'slurper-sauce', name:'HTFSE · Terp Slurper', kind:'custom',
    banger:'terp-slurper', concentrate:'sauce-htfse', sensor:'ir', wall:'standard',
    builtin:false, desc:'Sequenced heat. Marble cap.' },
  { id:'temple', name:'Temple Ball · Sip', kind:'low',
    banger:'round', concentrate:'temple-ball', sensor:'ir', wall:'thin',
    builtin:false, desc:'Press Club 350°F surface — low-temp hash.' },
  { id:'diamonds-hot', name:'THCa Diamonds · Hot', kind:'opaque',
    banger:'opaque', concentrate:'thca-diamonds', sensor:'ir', wall:'thick',
    builtin:false, desc:'High-temp hydrocarbon, opaque IR-friendly.' },
];

Object.assign(window, {
  QMETA, BANGERS, CONCENTRATES, SENSORS, WALLS, SAVED_PRESETS,
  computeCalibration, coldStartFit,
});
