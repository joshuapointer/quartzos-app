// flow-build.jsx — Builder with full QuartzOS data integration

const { useState: useStateB } = React;

// ── Step definitions: banger → concentrate → wall → review ──
// Sensor is fixed to DabRite IR (the only supported tool).
const BUILD_STEPS = [
  { key:'banger',      label:'BANGER',      title:'Pick your vessel.' },
  { key:'concentrate', label:'HASH',        title:'What are you dabbing?' },
  { key:'wall',        label:'WALL',        title:'Wall thickness?' },
  { key:'review',      label:'REVIEW',      title:'Calibration locked.' },
];

function BuildStage(props) {
  const { step, bangerId, setBangerId, concId, setConcId, sensorId, setSensorId, wallId, setWallId,
          coldStart, setColdStart, coldStartInfo,
          banger, concentrate, sensor, wall, calibration, next, back } = props;

  const ready = (() => {
    if (step === 0) return !!bangerId;
    if (step === 1) return !!concId && !concentrate?.blocked;
    if (step === 2) return !!wallId;
    return true;
  })();

  const cur = BUILD_STEPS[step];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 22px 22px', overflow: 'hidden', minHeight: 0 }}>
      {/* progress strip */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {BUILD_STEPS.map((s, i) => (
          <div key={s.key} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < step ? 'oklch(0.78 0.20 55)'
                     : i === step ? 'oklch(0.62 0.18 50)'
                     : 'rgba(180, 200, 230, 0.10)',
            boxShadow: i === step ? '0 0 10px oklch(0.78 0.20 55 / 0.6)' : 'none',
            transition: 'background 400ms ease',
          }} />
        ))}
      </div>

      <div className="q-stagger" style={{ display: 'contents' }}>
        <div style={{ '--i': 0, marginBottom: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            STEP {step + 1}/{BUILD_STEPS.length} · {cur.label}
          </div>
          <h1 className="display" style={{
            margin: 0, fontSize: 26, color: 'var(--bone-100)',
          }}>{cur.title}</h1>
        </div>

        <div key={cur.key} className="q-view-enter no-scrollbar" style={{ flex: 1, overflow: 'auto', '--i': 1, minHeight: 0, display: 'flex', flexDirection: 'column' }} >
          {step === 0 && <BangerChooser value={bangerId} onChange={setBangerId} />}
          {step === 1 && <ConcChooser value={concId} onChange={setConcId} banger={banger} />}
          {step === 2 && <WallChooser value={wallId} onChange={setWallId} calibration={calibration} />}
          {step === 3 && <ReviewStep banger={banger} concentrate={concentrate} sensor={sensor} wall={wall} calibration={calibration}
                                     coldStart={coldStart} setColdStart={setColdStart} coldStartInfo={coldStartInfo} />}
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 14, '--i': 2 }}>
          <button onClick={back} style={{
            padding: '12px 18px', borderRadius: 100,
            background: 'transparent', color: 'var(--bone-70)',
            fontSize: 12, letterSpacing: '0.04em', fontWeight: 500,
            boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.10)',
          }}>← Back</button>
          <button onClick={next} disabled={!ready}
            style={{
              flex: 1, padding: '12px 18px', borderRadius: 100,
              background: ready ? 'linear-gradient(180deg, oklch(0.72 0.19 50), oklch(0.55 0.17 45))'
                                : 'rgba(180, 200, 230, 0.06)',
              color: ready ? '#fff' : 'var(--bone-35)',
              fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em',
              boxShadow: ready ? 'inset 0 0.5px 0 rgba(255,255,255,0.28), 0 6px 22px oklch(0.62 0.20 50 / 0.40)'
                               : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.10)',
            }}>
            {step === BUILD_STEPS.length - 1 ? 'Start sesh →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChooserCard({ active, onClick, title, sub, right, disabled, subColor, blockedReason }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      width: '100%', padding: '12px 14px', borderRadius: 14, textAlign: 'left',
      background: active ? 'linear-gradient(180deg, oklch(0.20 0.06 240), oklch(0.12 0.03 240))'
                : disabled ? 'rgba(80,30,30,0.10)'
                : 'rgba(180, 200, 230, 0.04)',
      boxShadow: active ? 'inset 0 0 0 0.5px oklch(0.72 0.19 50 / 0.6), 0 0 22px oklch(0.62 0.20 50 / 0.20)'
                : disabled ? 'inset 0 0 0 0.5px oklch(0.45 0.10 25 / 0.4)'
                : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.08)',
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'background 280ms ease, box-shadow 280ms ease',
      opacity: disabled ? 0.65 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: active ? 'var(--bone-100)' : disabled ? 'var(--bone-50)' : 'var(--bone-90)', fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 2 }}>
          {title}
          {disabled && <span className="mono" style={{ marginLeft: 8, fontSize: 9, letterSpacing: '0.14em', color: 'oklch(0.65 0.12 25)' }}>BLOCKED</span>}
        </div>
        {sub && <div style={{ fontSize: 11, color: subColor || 'var(--bone-50)', lineHeight: 1.4 }}>{sub}</div>}
        {blockedReason && <div style={{ fontSize: 10.5, color: 'oklch(0.70 0.10 25)', lineHeight: 1.4, marginTop: 4, fontStyle: 'italic' }}>{blockedReason}</div>}
      </div>
      {right || (active && (
        <svg width="14" height="14" viewBox="0 0 14 14">
          <circle cx="7" cy="7" r="6.5" fill="oklch(0.80 0.20 55)" />
          <path d="M3.5 7l2.5 2.5L10.5 4.5" stroke="#1a1208" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ))}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Visual signatures: each banger / concentrate gets a distinctive
// procedural artwork. These are PLACEHOLDERS — a separate agent
// will replace each with bespoke generated graphics, but the color
// + geometry vocabulary here defines the slot they occupy.
// ─────────────────────────────────────────────────────────────────

const CONC_SIGNATURE = {
  // Solventless — pale buttery → amber, smooth gradients
  'live-rosin':       { hue: 70,  l: 0.78, c: 0.16, mode: 'wash' },
  'cold-cure':        { hue: 75,  l: 0.80, c: 0.13, mode: 'wash' },
  'fresh-press':      { hue: 78,  l: 0.82, c: 0.12, mode: 'wash' },
  'rosin-jam':        { hue: 60,  l: 0.74, c: 0.17, mode: 'specks' },
  'rosin-badder':     { hue: 72,  l: 0.76, c: 0.14, mode: 'whip' },
  'hot-cure':         { hue: 55,  l: 0.68, c: 0.18, mode: 'wash' },
  'hash-rosin-coin':  { hue: 65,  l: 0.74, c: 0.16, mode: 'wash' },
  'persy-rosin':      { hue: 68,  l: 0.76, c: 0.16, mode: 'wash' },
  'high-melt-rosin':  { hue: 72,  l: 0.78, c: 0.16, mode: 'wash' },
  // Hash — earthier browns / oranges
  'bubble-6star':     { hue: 50,  l: 0.66, c: 0.16, mode: 'specks' },
  'bubble-half-melt': { hue: 45,  l: 0.58, c: 0.13, mode: 'specks' },
  'dry-sift':         { hue: 60,  l: 0.72, c: 0.14, mode: 'specks' },
  'temple-ball':      { hue: 35,  l: 0.42, c: 0.10, mode: 'sphere' },
  'pressed-hash':     { hue: 30,  l: 0.38, c: 0.08, mode: 'slab' },
  // Hydrocarbon — saturated amber / orange
  'live-resin':       { hue: 50,  l: 0.66, c: 0.20, mode: 'wash' },
  'cured-resin':      { hue: 42,  l: 0.58, c: 0.18, mode: 'wash' },
  'shatter':          { hue: 55,  l: 0.70, c: 0.18, mode: 'shard' },
  'wax-budder':       { hue: 65,  l: 0.74, c: 0.16, mode: 'whip' },
  'crumble':          { hue: 70,  l: 0.78, c: 0.14, mode: 'crumble' },
  'sugar':            { hue: 60,  l: 0.74, c: 0.18, mode: 'specks' },
  'sauce-htfse':      { hue: 50,  l: 0.68, c: 0.20, mode: 'sauce' },
  'thca-diamonds':    { hue: 250, l: 0.86, c: 0.04, mode: 'crystal' },
  'diamonds-sauce':   { hue: 55,  l: 0.72, c: 0.18, mode: 'sauce' },
  'crystalline':      { hue: 250, l: 0.92, c: 0.02, mode: 'crystal' },
  'liquid-diamonds':  { hue: 58,  l: 0.74, c: 0.18, mode: 'sauce' },
  // Distillate — pale gold / clear
  'co2-oil':          { hue: 75,  l: 0.78, c: 0.13, mode: 'wash' },
  'thc-distillate':   { hue: 80,  l: 0.86, c: 0.10, mode: 'wash' },
  'cbn-distillate':   { hue: 38,  l: 0.62, c: 0.14, mode: 'wash' },
  'cbg-distillate':   { hue: 90,  l: 0.78, c: 0.10, mode: 'wash' },
  'thcv-distillate':  { hue: 95,  l: 0.78, c: 0.10, mode: 'wash' },
  // Novel
  'infused-diamonds': { hue: 320, l: 0.72, c: 0.18, mode: 'crystal' },
  'thcp':             { hue: 290, l: 0.70, c: 0.16, mode: 'wash' },
  // Blocked — desaturated cool grey, indicates "not for dab"
  'hash-holes':       { hue: 30,  l: 0.40, c: 0.05, mode: 'forbidden' },
  'kief':             { hue: 75,  l: 0.65, c: 0.06, mode: 'forbidden' },
  'rso':              { hue: 30,  l: 0.30, c: 0.08, mode: 'forbidden' },
  'bubble-1-2':       { hue: 50,  l: 0.45, c: 0.06, mode: 'forbidden' },
};

function ConcSwatch({ id, blocked }) {
  const sig = CONC_SIGNATURE[id] || { hue: 50, l: 0.65, c: 0.16, mode: 'wash' };
  const { hue, l, c, mode } = sig;
  const base = `oklch(${l} ${c} ${hue})`;
  const deep = `oklch(${Math.max(0.08, l - 0.45)} ${c * 0.4} ${hue})`;
  const light = `oklch(${Math.min(0.96, l + 0.10)} ${c * 0.7} ${hue})`;
  const accent = `oklch(${l + 0.05} ${c} ${hue})`;

  // A radial wash + procedural overlay per "mode"
  const wash = {
    background: `
      radial-gradient(ellipse 90% 70% at 30% 35%, ${light} 0%, ${base} 38%, ${deep} 100%),
      ${deep}
    `,
  };

  let overlay = null;
  if (mode === 'specks') {
    overlay = (
      <div aria-hidden style={{
        position: 'absolute', inset: 0, opacity: 0.55,
        backgroundImage: `
          radial-gradient(circle at 22% 60%, ${accent} 0.5px, transparent 1.6px),
          radial-gradient(circle at 65% 30%, ${accent} 0.5px, transparent 1.6px),
          radial-gradient(circle at 80% 70%, ${accent} 0.5px, transparent 1.6px),
          radial-gradient(circle at 40% 80%, ${accent} 0.5px, transparent 1.4px)
        `,
        backgroundSize: '40px 40px, 55px 55px, 70px 70px, 35px 35px',
      }} />
    );
  } else if (mode === 'whip') {
    overlay = (
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(115deg, transparent 0px, ${accent} 0.5px, transparent 2px, transparent 9px)`,
        opacity: 0.18, mixBlendMode: 'screen',
      }} />
    );
  } else if (mode === 'sphere') {
    overlay = (
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 55%, ${light} 0%, ${base} 26%, ${deep} 60%, transparent 70%)`,
        mixBlendMode: 'normal',
      }} />
    );
  } else if (mode === 'slab') {
    overlay = (
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(95deg, transparent 30%, ${accent} 30.5%, ${accent} 31%, transparent 31.5%, transparent 65%, ${accent} 65.3%, ${accent} 65.7%, transparent 66%)`,
        opacity: 0.4,
      }} />
    );
  } else if (mode === 'shard') {
    overlay = (
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)`,
      }} />
    );
  } else if (mode === 'sauce') {
    overlay = (
      <>
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(circle at 30% 50%, rgba(255,255,255,0.45) 1px, transparent 2.5px),
            radial-gradient(circle at 70% 35%, rgba(255,255,255,0.4) 0.8px, transparent 2.2px),
            radial-gradient(circle at 55% 75%, rgba(255,255,255,0.5) 1.2px, transparent 3px)
          `,
          backgroundSize: '60px 60px, 80px 80px, 50px 50px',
          opacity: 0.7,
        }} />
      </>
    );
  } else if (mode === 'crystal') {
    overlay = (
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: `
          conic-gradient(from 30deg at 35% 50%, transparent 0deg, rgba(255,255,255,0.2) 30deg, transparent 60deg, rgba(255,255,255,0.15) 120deg, transparent 180deg, rgba(255,255,255,0.18) 240deg, transparent 300deg)
        `,
        mixBlendMode: 'screen', opacity: 0.6,
      }} />
    );
  } else if (mode === 'crumble') {
    overlay = (
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 30%, ${deep} 1.5px, transparent 2.5px),
          radial-gradient(circle at 60% 60%, ${deep} 1px, transparent 2px),
          radial-gradient(circle at 80% 20%, ${deep} 1.2px, transparent 2.2px)
        `,
        backgroundSize: '32px 32px, 26px 26px, 40px 40px',
        opacity: 0.5,
      }} />
    );
  } else if (mode === 'forbidden') {
    overlay = (
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(45deg, transparent 0px, transparent 7px, rgba(0,0,0,0.45) 7px, rgba(0,0,0,0.45) 8px)`,
      }} />
    );
  }

  return (
    <div className="conc-swatch" style={{
      position: 'absolute', inset: 0,
      ...wash,
      filter: blocked ? 'grayscale(0.7) brightness(0.55)' : 'none',
    }}>
      {overlay}
      {/* glossy top highlight — gives the "lit from above" feel */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.10), transparent 35%, transparent 70%, rgba(0,0,0,0.30))',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

const CONC_FAMILIES = [
  { id: 'All',          name: 'All',          sub: 'Everything',
    hue: null,
    test: () => true },
  { id: 'Solventless',  name: 'Solventless',  sub: 'Rosin · Hash·rosin',
    hue: 75,  // golden honey
    test: (c) => c.cat === 'Solventless' },
  { id: 'Hash',         name: 'Hash',         sub: 'Bubble · Sift',
    hue: 35,  // earthy chestnut
    test: (c) => c.cat === 'Hash' },
  { id: 'Hydrocarbon',  name: 'Hydrocarbon',  sub: 'BHO · Diamonds',
    hue: 55,  // saturated amber
    test: (c) => c.cat === 'Hydrocarbon' },
  { id: 'Distillate',   name: 'Distillate',   sub: 'THC · CBN · CBG',
    hue: 95,  // pale gold-green
    test: (c) => c.cat === 'Distillate' },
  { id: 'Novel',        name: 'Novel',        sub: 'THCP · Infused',
    hue: 285, // violet
    test: (c) => c.cat === 'Novel' },
];

function ConcFamilyGlyph({ hue, glow }) {
  if (hue == null) {
    // "All" — radial spectrum
    return (
      <svg viewBox="0 0 56 56" width="56" height="56">
        <defs>
          <radialGradient id="all-grad" cx="50%" cy="50%">
            <stop offset="0%"  stopColor={glow ? 'oklch(0.92 0.18 55)' : 'oklch(0.70 0.12 55 / 0.9)'}/>
            <stop offset="50%" stopColor={glow ? 'oklch(0.78 0.20 35)' : 'oklch(0.55 0.14 35 / 0.7)'}/>
            <stop offset="100%" stopColor={glow ? 'oklch(0.42 0.16 285 / 0.85)' : 'oklch(0.32 0.10 285 / 0.6)'}/>
          </radialGradient>
        </defs>
        <circle cx="28" cy="28" r="20" fill="url(#all-grad)"
                style={{ filter: glow ? 'drop-shadow(0 0 10px oklch(0.78 0.20 55 / 0.7))' : 'none' }}/>
        <circle cx="28" cy="28" r="20" fill="none"
                stroke={glow ? 'oklch(0.85 0.18 55 / 0.6)' : 'oklch(0.55 0.14 55 / 0.35)'}
                strokeWidth="1"/>
      </svg>
    );
  }
  const id = `cf-grad-${hue}-${glow ? 'g' : 'd'}`;
  const c1 = glow ? `oklch(0.92 0.18 ${hue})` : `oklch(0.70 0.14 ${hue} / 0.85)`;
  const c2 = glow ? `oklch(0.62 0.20 ${hue})` : `oklch(0.42 0.14 ${hue} / 0.75)`;
  const c3 = glow ? `oklch(0.30 0.10 ${hue} / 0.85)` : `oklch(0.20 0.06 ${hue} / 0.55)`;
  return (
    <svg viewBox="0 0 56 56" width="56" height="56">
      <defs>
        <radialGradient id={id} cx="40%" cy="35%">
          <stop offset="0%"   stopColor={c1}/>
          <stop offset="55%"  stopColor={c2}/>
          <stop offset="100%" stopColor={c3}/>
        </radialGradient>
      </defs>
      {/* Specimen blob — soft organic shape, like a drop of concentrate */}
      <path d="M28 8 C40 8 48 18 48 30 C48 40 40 48 28 48 C16 48 8 40 8 30 C8 18 16 8 28 8 Z"
            fill={`url(#${id})`}
            style={{ filter: glow ? `drop-shadow(0 0 10px oklch(0.78 0.20 ${hue} / 0.7))` : 'none' }}/>
      {/* Highlight */}
      <ellipse cx="22" cy="18" rx="6" ry="3" fill="white" opacity={glow ? 0.32 : 0.18}/>
      {/* Outline */}
      <path d="M28 8 C40 8 48 18 48 30 C48 40 40 48 28 48 C16 48 8 40 8 30 C8 18 16 8 28 8 Z"
            fill="none"
            stroke={glow ? `oklch(0.85 0.18 ${hue} / 0.7)` : `oklch(0.55 0.14 ${hue} / 0.35)`}
            strokeWidth="1"/>
    </svg>
  );
}

function ConcFamilyTabs({ families, value, onChange, counts }) {
  return (
    <div className="no-scrollbar" style={{
      display: 'flex', gap: 8,
      overflowX: 'auto',
      marginLeft: -22, marginRight: -22,
      paddingLeft: 22, paddingRight: 22,
      paddingBottom: 4, paddingTop: 2,
      scrollSnapType: 'x mandatory',
    }}>
      {families.map(f => {
        const active = f.id === value;
        return (
          <button key={f.id} onClick={() => onChange(f.id)} style={{
            flexShrink: 0,
            scrollSnapAlign: 'start',
            width: 92,
            padding: '10px 6px 9px',
            borderRadius: 14,
            background: active
              ? 'radial-gradient(ellipse at 50% 35%, oklch(0.20 0.10 50 / 0.55), oklch(0.08 0.03 30 / 0.85) 75%)'
              : 'rgba(8, 10, 16, 0.55)',
            boxShadow: active
              ? 'inset 0 0 0 1px oklch(0.78 0.20 55 / 0.55), 0 0 22px oklch(0.62 0.20 50 / 0.28), 0 6px 16px rgba(0,0,0,0.4)'
              : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.10)',
            cursor: 'pointer',
            transition: 'background 320ms ease, box-shadow 320ms ease, transform 280ms cubic-bezier(.22,1,.36,1)',
            transform: active ? 'translateY(-1px)' : 'translateY(0)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <div style={{
              transition: 'filter 320ms ease',
            }}>
              <ConcFamilyGlyph hue={f.hue} glow={active} />
            </div>
            <div className="display" style={{
              fontSize: 12, letterSpacing: '-0.01em',
              color: active ? 'var(--bone-100)' : 'var(--bone-70)',
              textShadow: active ? '0 0 12px oklch(0.78 0.20 55 / 0.4)' : 'none',
              lineHeight: 1.1,
              marginTop: 1,
              textAlign: 'center',
            }}>{f.name}</div>
            <div className="mono" style={{
              fontSize: 7.5, letterSpacing: '0.16em',
              color: active ? 'oklch(0.78 0.16 55)' : 'var(--bone-35)',
            }}>
              <span style={{
                padding: '1px 5px', borderRadius: 100,
                background: active ? 'oklch(0.20 0.08 50 / 0.7)' : 'rgba(220, 230, 245, 0.05)',
              }}>{counts[f.id]}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ConcChooser({ value, onChange, banger }) {
  const [filter, setFilter] = useStateB('All');
  const all = window.CONCENTRATES;
  const items = filter === 'All' ? all : all.filter(c => c.cat === filter);
  const counts = React.useMemo(
    () => Object.fromEntries(CONC_FAMILIES.map(f => [f.id, all.filter(f.test).length])),
    []
  );
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      flex: 1, minHeight: 0,
    }}>
      <div style={{ fontSize: 11.5, color: 'var(--bone-50)', lineHeight: 1.45, marginTop: -4 }}>
        Each material has its own volatility window.
      </div>
      <ConcFamilyTabs families={CONC_FAMILIES} value={filter} onChange={setFilter} counts={counts} />
      <div className="no-scrollbar" style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gridAutoRows: 'min-content',
        gap: 12, paddingTop: 4, paddingBottom: 4,
        alignContent: 'start',
      }}>
        {items.map(c => (
          <ConcCard key={c.id} c={c} active={value === c.id}
            onClick={() => !c.blocked && onChange(c.id)} />
        ))}
      </div>
    </div>
  );
}

function ConcCard({ c, active, onClick }) {
  const blocked = !!c.blocked;
  return (
    <button onClick={blocked ? undefined : onClick} style={{
      position: 'relative', textAlign: 'left',
      borderRadius: 14, overflow: 'hidden',
      padding: 0,
      background: 'transparent',
      cursor: blocked ? 'not-allowed' : 'pointer',
      transition: 'transform 280ms cubic-bezier(.22,1,.36,1), box-shadow 280ms ease',
      transform: active ? 'translateY(-2px)' : 'translateY(0)',
      boxShadow: active
        ? '0 0 0 1px oklch(0.80 0.20 55 / 0.85), 0 12px 32px oklch(0.62 0.20 50 / 0.40), 0 0 38px oklch(0.72 0.20 50 / 0.35)'
        : blocked
          ? 'inset 0 0 0 0.5px rgba(120, 100, 100, 0.20)'
          : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.10)',
    }}>
      {/* Swatch — luminous gradient field, ~98px tall */}
      <div style={{
        position: 'relative', width: '100%', height: 98,
        overflow: 'hidden',
        borderTopLeftRadius: 14, borderTopRightRadius: 14,
      }}>
        <ConcSwatch id={c.id} blocked={blocked} />
        {blocked && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            padding: '3px 7px', borderRadius: 100,
            background: 'rgba(0,0,0,0.55)',
            fontFamily: 'var(--mono)', fontSize: 8.5,
            letterSpacing: '0.16em', color: 'oklch(0.78 0.10 25)',
          }}>NOT FOR DAB</div>
        )}
        {active && !blocked && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 18, height: 18, borderRadius: '50%',
            background: 'oklch(0.86 0.18 55)',
            boxShadow: '0 0 14px oklch(0.78 0.20 55 / 0.8), inset 0 0.5px 0 rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="10" height="10" viewBox="0 0 14 14"><path d="M3.5 7l2.5 2.5L10.5 4.5" stroke="#1a1208" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}
      </div>

      {/* Caption — name + base temp */}
      <div style={{
        padding: '11px 12px 13px',
        background: active
          ? 'linear-gradient(180deg, rgba(20,12,6,0.90), rgba(10,7,4,0.95))'
          : 'rgba(8, 10, 16, 0.85)',
      }}>
        <div style={{
          fontSize: 13, lineHeight: 1.2,
          color: blocked ? 'var(--bone-50)' : 'var(--bone-100)',
          fontWeight: 500, letterSpacing: '-0.01em',
          marginBottom: 6,
          textWrap: 'pretty',
        }}>{c.name}</div>
        <div style={{
          display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', gap: 8,
        }}>
          <span className="mono" style={{
            fontSize: 9, letterSpacing: '0.18em',
            color: blocked ? 'oklch(0.55 0.08 25)' : 'var(--bone-50)',
          }}>{blocked ? 'BLOCKED' : 'BASE'}</span>
          {c.surface_optimal ? (
            <span className="mono" style={{
              fontSize: 11, color: blocked ? 'var(--bone-35)' : 'var(--bone-90)',
              fontWeight: 500, letterSpacing: '-0.01em',
            }}>{c.surface_optimal}°F</span>
          ) : (
            <span className="mono" style={{ fontSize: 10, color: 'var(--bone-35)' }}>—</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Banger — swipeable carousel of large illustrated cards.
// Each card shows a luminous outline silhouette of the geometry,
// the name in display type, and a spec line below.
// ─────────────────────────────────────────────────────────────────

function BangerSilhouette({ geometry, glow }) {
  const stroke = glow ? 'oklch(0.82 0.20 55)' : 'oklch(0.55 0.16 50 / 0.55)';
  const fill = glow ? 'oklch(0.78 0.20 55 / 0.06)' : 'transparent';
  const filter = glow ? 'drop-shadow(0 0 12px oklch(0.78 0.20 55 / 0.85)) drop-shadow(0 0 28px oklch(0.62 0.20 50 / 0.35))' : 'none';

  if (geometry === 'slurper') {
    // bottom dish + slotted column + bucket
    return (
      <svg viewBox="0 0 120 130" width="120" height="130" style={{ filter }}>
        {/* dish */}
        <ellipse cx="60" cy="118" rx="36" ry="6" fill="none" stroke={stroke} strokeWidth="1.5" />
        <path d="M24 118 Q60 134 96 118" fill={fill} stroke={stroke} strokeWidth="1.5" />
        {/* column */}
        <line x1="50" y1="118" x2="50" y2="78" stroke={stroke} strokeWidth="1.5" />
        <line x1="70" y1="118" x2="70" y2="78" stroke={stroke} strokeWidth="1.5" />
        {/* slits */}
        <line x1="50" y1="92" x2="70" y2="92" stroke={stroke} strokeWidth="0.8" opacity="0.5"/>
        <line x1="50" y1="100" x2="70" y2="100" stroke={stroke} strokeWidth="0.8" opacity="0.5"/>
        <line x1="50" y1="108" x2="70" y2="108" stroke={stroke} strokeWidth="0.8" opacity="0.5"/>
        {/* bucket */}
        <rect x="38" y="40" width="44" height="42" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5"/>
      </svg>
    );
  }
  if (geometry === 'insert') {
    return (
      <svg viewBox="0 0 120 130" width="120" height="130" style={{ filter }}>
        {/* host banger */}
        <path d="M22 50 L22 110 Q22 122 34 122 L86 122 Q98 122 98 110 L98 50" fill={fill} stroke={stroke} strokeWidth="1.5"/>
        <ellipse cx="60" cy="50" rx="38" ry="5" fill="none" stroke={stroke} strokeWidth="1.5"/>
        {/* drop-in cup */}
        <path d="M40 60 L40 102 Q40 110 48 110 L72 110 Q80 110 80 102 L80 60 Z" fill={glow ? 'oklch(0.78 0.20 55 / 0.14)' : 'oklch(0.55 0.16 50 / 0.06)'} stroke={stroke} strokeWidth="1.5" strokeDasharray="3 3"/>
      </svg>
    );
  }
  // bucket — classic / round / opaque / thermal / core / swing-arm
  return (
    <svg viewBox="0 0 120 130" width="120" height="130" style={{ filter }}>
      {/* bucket body */}
      <path d="M28 48 L28 108 Q28 122 42 122 L78 122 Q92 122 92 108 L92 48" fill={fill} stroke={stroke} strokeWidth="1.5"/>
      {/* rim */}
      <ellipse cx="60" cy="48" rx="32" ry="5" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <ellipse cx="60" cy="48" rx="32" ry="5" fill={glow ? 'oklch(0.78 0.20 55 / 0.18)' : 'rgba(0,0,0,0.4)'} />
    </svg>
  );
}

function bangerSpec(b) {
  if (!b) return '';
  const cls = b.geometry === 'slurper' ? 'SLURPER'
            : b.geometry === 'insert'   ? 'INSERT'
            : b.category === 'premium'  ? 'PREMIUM'
            : 'BUCKET';
  const heat = `${b.heat_seconds[0]}–${b.heat_seconds[1]}S HEAT`;
  return `${cls}  ·  QUARTZ  ·  ${heat}`;
}

function FamilyGlyph({ id, glow }) {
  const stroke = glow ? 'oklch(0.84 0.20 55)' : 'oklch(0.55 0.14 55 / 0.55)';
  const accent = glow ? 'oklch(0.78 0.20 55 / 0.20)' : 'oklch(0.55 0.14 55 / 0.06)';
  const sw = 1.6;

  if (id === 'slurper') {
    return (
      <svg viewBox="0 0 56 56" width="56" height="56">
        <path d="M10 44 Q10 50 16 50 L40 50 Q46 50 46 44" fill={accent} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        <path d="M16 16 L16 44 L40 44 L40 16" fill={accent} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        <ellipse cx="28" cy="16" rx="12" ry="2.6" fill="none" stroke={stroke} strokeWidth={sw}/>
        <line x1="28" y1="22" x2="28" y2="42" stroke={stroke} strokeWidth={sw} strokeDasharray="2 2.5"/>
      </svg>
    );
  }

  if (id === 'insert') {
    return (
      <svg viewBox="0 0 56 56" width="56" height="56">
        <path d="M10 16 L10 44 Q10 50 16 50 L40 50 Q46 50 46 44 L46 16" fill={accent} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        <ellipse cx="28" cy="16" rx="18" ry="3" fill="none" stroke={stroke} strokeWidth={sw}/>
        <path d="M17 22 L17 42 Q17 46 21 46 L35 46 Q39 46 39 42 L39 22" fill="none" stroke={stroke} strokeWidth={sw - 0.3} strokeLinejoin="round" opacity="0.85"/>
        <ellipse cx="28" cy="22" rx="11" ry="2" fill="none" stroke={stroke} strokeWidth={sw - 0.3} opacity="0.85"/>
      </svg>
    );
  }

  // bucket
  return (
    <svg viewBox="0 0 56 56" width="56" height="56">
      <path d="M12 16 L12 44 Q12 50 18 50 L38 50 Q44 50 44 44 L44 16" fill={accent} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <ellipse cx="28" cy="16" rx="16" ry="3" fill="none" stroke={stroke} strokeWidth={sw}/>
    </svg>
  );
}

function BangerFamilyTabs({ families, value, onChange, counts }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${families.length}, 1fr)`,
      gap: 8,
    }}>
      {families.map(f => {
        const active = f.id === value;
        return (
          <button key={f.id} onClick={() => onChange(f.id)} style={{
            position: 'relative',
            padding: '12px 8px 10px',
            borderRadius: 14,
            background: active
              ? 'radial-gradient(ellipse at 50% 35%, oklch(0.20 0.10 50 / 0.55), oklch(0.08 0.03 30 / 0.85) 75%)'
              : 'rgba(8, 10, 16, 0.55)',
            boxShadow: active
              ? 'inset 0 0 0 1px oklch(0.78 0.20 55 / 0.55), 0 0 28px oklch(0.62 0.20 50 / 0.30), 0 6px 18px rgba(0,0,0,0.4)'
              : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.10)',
            cursor: 'pointer',
            transition: 'background 320ms ease, box-shadow 320ms ease, transform 280ms cubic-bezier(.22,1,.36,1)',
            transform: active ? 'translateY(-1px)' : 'translateY(0)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{
              filter: active ? 'drop-shadow(0 0 10px oklch(0.78 0.20 55 / 0.7))' : 'none',
              transition: 'filter 320ms ease',
            }}>
              <FamilyGlyph id={f.id} glow={active} />
            </div>
            <div className="display" style={{
              fontSize: 13, letterSpacing: '-0.01em',
              color: active ? 'var(--bone-100)' : 'var(--bone-70)',
              textShadow: active ? '0 0 12px oklch(0.78 0.20 55 / 0.4)' : 'none',
              marginTop: 2,
            }}>{f.name}</div>
            <div className="mono" style={{
              fontSize: 8, letterSpacing: '0.18em',
              color: active ? 'oklch(0.78 0.16 55)' : 'var(--bone-35)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>{f.sub.toUpperCase()}</span>
              <span style={{
                padding: '1px 5px', borderRadius: 100,
                background: active ? 'oklch(0.20 0.08 50 / 0.7)' : 'rgba(220, 230, 245, 0.05)',
                fontSize: 8,
              }}>{counts[f.id]}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const BANGER_FAMILIES = [
  { id: 'bucket', name: 'Bucket', sub: 'Cup-shape',
    test: (b) => b.geometry === 'bucket' },
  { id: 'slurper', name: 'Slurper', sub: 'Vortex',
    test: (b) => b.geometry === 'slurper' },
  { id: 'insert', name: 'Insert', sub: 'Drop-in',
    test: (b) => b.geometry === 'insert' },
];

function BangerChooser({ value, onChange }) {
  const allItems = window.BANGERS;

  // Determine the family of the current value, default to 'bucket'
  const valueFamily = React.useMemo(() => {
    const cur = allItems.find(b => b.id === value);
    if (!cur) return 'bucket';
    return BANGER_FAMILIES.find(f => f.test(cur))?.id || 'bucket';
  }, [value]);

  const [family, setFamily] = useStateB(valueFamily);

  // Items filtered by family
  const items = React.useMemo(
    () => allItems.filter(BANGER_FAMILIES.find(f => f.id === family).test),
    [family]
  );

  // Pick a default index — current selection or 0
  const initialIdx = Math.max(0, items.findIndex(b => b.id === value));
  const [idx, setIdx] = useStateB(initialIdx === -1 ? 0 : initialIdx);

  // Keep idx synced when value changes externally (e.g. preset apply)
  React.useEffect(() => {
    const i = items.findIndex(b => b.id === value);
    if (i >= 0 && i !== idx) setIdx(i);
  }, [value, items]);

  // When family changes, reset idx and propagate the first banger of that family
  const onFamilyChange = (fid) => {
    if (fid === family) return;
    setFamily(fid);
    const newItems = allItems.filter(BANGER_FAMILIES.find(f => f.id === fid).test);
    setIdx(0);
    onChange(newItems[0].id);
  };

  const go = (delta) => {
    const next = Math.max(0, Math.min(items.length - 1, idx + delta));
    setIdx(next);
    onChange(items[next].id);
  };
  const pick = (i) => {
    setIdx(i);
    onChange(items[i].id);
  };

  // Touch swipe support
  const startX = React.useRef(null);
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  const cardW = 220;
  const gap = 14;
  const step = cardW + gap;

  const active = items[idx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4, flex: 1, minHeight: 0 }}>
      <div style={{ fontSize: 11.5, color: 'var(--bone-50)', lineHeight: 1.45, marginTop: -4 }}>
        Swipe to find what's on your rig.
      </div>

      {/* Family selector */}
      <BangerFamilyTabs
        families={BANGER_FAMILIES}
        value={family}
        onChange={onFamilyChange}
        counts={Object.fromEntries(BANGER_FAMILIES.map(f => [f.id, allItems.filter(f.test).length]))}
      />

      {/* Carousel viewport — flexes to fill remaining vertical space */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          flex: 1, minHeight: 240,
          overflow: 'visible',
          marginLeft: -22, marginRight: -22, // bleed past parent padding
          paddingLeft: 22, paddingRight: 22,
          display: 'flex', alignItems: 'center',
        }}
      >
        {/* Track */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          height: '100%',
          maxHeight: 360,
          display: 'flex', gap, alignItems: 'center',
          transform: `translate(calc(-${idx * step}px - ${cardW / 2}px), -50%)`,
          transition: 'transform 480ms cubic-bezier(.22,1,.36,1)',
        }}>
          {items.map((b, i) => {
            const isActive = i === idx;
            const distance = Math.abs(i - idx);
            return (
              <button key={b.id} onClick={() => pick(i)} style={{
                width: cardW, flexShrink: 0,
                height: '100%', maxHeight: 340, minHeight: 240,
                padding: 0, borderRadius: 22,
                background: 'transparent',
                position: 'relative',
                opacity: isActive ? 1 : Math.max(0.30, 1 - distance * 0.28),
                transform: isActive ? 'scale(1)' : 'scale(0.93)',
                transition: 'opacity 380ms ease, transform 480ms cubic-bezier(.22,1,.36,1)',
                cursor: 'pointer',
              }}>
                <BangerCardBody b={b} active={isActive} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6,
      }}>
        {items.map((b, i) => (
          <button key={b.id} onClick={() => pick(i)} style={{
            width: i === idx ? 18 : 5, height: 5, borderRadius: 100,
            background: i === idx ? 'oklch(0.80 0.20 55)' : 'rgba(220, 230, 245, 0.20)',
            boxShadow: i === idx ? '0 0 8px oklch(0.72 0.20 50 / 0.7)' : 'none',
            transition: 'width 320ms cubic-bezier(.22,1,.36,1), background 240ms ease',
          }} />
        ))}
      </div>

      {/* Spec readout for active banger */}
      <div style={{
        padding: '10px 14px', borderRadius: 12,
        background: 'rgba(8, 10, 16, 0.55)',
        boxShadow: 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--bone-50)' }}>
            IR OFFSET
          </span>
          <span className="mono" style={{
            fontSize: 11, color: active.geometry === 'slurper' ? 'oklch(0.78 0.10 200)' : 'oklch(0.78 0.18 55)',
            fontWeight: 500,
          }}>
            {active.geometry === 'slurper' ? `+${active.ir_offset_f}°F` :
             active.geometry === 'insert' ? 'INSERT' :
             `−${active.ir_offset_f}°F`}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--bone-70)', lineHeight: 1.45 }}>
          {active.description}
        </div>
      </div>
    </div>
  );
}

function BangerCardBody({ b, active }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      borderRadius: 22, padding: 18,
      display: 'flex', flexDirection: 'column',
      background: active
        ? 'radial-gradient(ellipse at 50% 30%, oklch(0.22 0.10 50 / 0.50), oklch(0.10 0.04 30 / 0.95) 70%)'
        : 'radial-gradient(ellipse at 50% 30%, oklch(0.16 0.04 240 / 0.40), oklch(0.06 0.02 240 / 0.95) 70%)',
      boxShadow: active
        ? 'inset 0 0 0 1px oklch(0.80 0.20 55 / 0.65), 0 0 0 1px oklch(0.40 0.16 45 / 0.40), 0 18px 48px rgba(0,0,0,0.65), 0 0 60px oklch(0.62 0.20 50 / 0.30)'
        : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.10), 0 6px 18px rgba(0,0,0,0.4)',
      position: 'relative', overflow: 'hidden',
      transition: 'box-shadow 380ms ease, background 380ms ease',
    }}>
      {/* Tag chip */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        {b.tags && b.tags[0] && (
          <span className="mono" style={{
            fontSize: 8.5, letterSpacing: '0.18em',
            color: active ? 'oklch(0.85 0.16 55)' : 'var(--bone-50)',
            padding: '3px 8px', borderRadius: 100,
            background: active ? 'oklch(0.20 0.08 50 / 0.7)' : 'rgba(220, 230, 245, 0.06)',
            boxShadow: active ? 'inset 0 0 0 0.5px oklch(0.65 0.16 50 / 0.4)' : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.08)',
          }}>{b.tags[0]}</span>
        )}
      </div>

      {/* Silhouette stage */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
        <BangerSilhouette geometry={b.geometry} glow={active} />
      </div>

      {/* Caption */}
      <div style={{ textAlign: 'center' }}>
        <div className="display" style={{
          fontSize: 19, fontWeight: 400,
          color: active ? 'var(--bone-100)' : 'var(--bone-70)',
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          marginBottom: 6,
          textShadow: active ? '0 0 18px oklch(0.78 0.20 55 / 0.35)' : 'none',
        }}>{b.name}</div>
        <div className="mono" style={{
          fontSize: 8.5, letterSpacing: '0.18em',
          color: active ? 'var(--bone-50)' : 'var(--bone-35)',
        }}>{bangerSpec(b)}</div>
      </div>
    </div>
  );
}

function WallSilhouette({ wallId, glow }) {
  const stroke = glow ? 'oklch(0.82 0.20 55)' : 'oklch(0.55 0.16 50 / 0.55)';
  const fill = glow ? 'oklch(0.78 0.20 55 / 0.06)' : 'transparent';
  const innerGlow = glow ? 'oklch(0.78 0.20 55 / 0.18)' : 'oklch(0.55 0.16 50 / 0.05)';
  const filter = glow ? 'drop-shadow(0 0 12px oklch(0.78 0.20 55 / 0.85)) drop-shadow(0 0 28px oklch(0.62 0.20 50 / 0.35))' : 'none';

  if (wallId === 'unknown') {
    // Question mark glyph in a dashed banger outline
    return (
      <svg viewBox="0 0 120 130" width="120" height="130" style={{ filter }}>
        <path d="M30 48 L30 108 Q30 122 44 122 L76 122 Q90 122 90 108 L90 48"
              fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray="4 4"/>
        <ellipse cx="60" cy="48" rx="30" ry="5" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="4 4"/>
        <text x="60" y="92" textAnchor="middle"
              fontFamily="var(--sans), system-ui" fontSize="34" fontWeight="300"
              fill={stroke} letterSpacing="-0.04em">?</text>
      </svg>
    );
  }

  // Cross-section view: outer outline + inner outline showing wall thickness.
  // thin = 4 unit gap, standard = 7 unit, thick = 11 unit
  const w = wallId === 'thin' ? 4 : wallId === 'thick' ? 11 : 7;

  // Outer banger silhouette
  const ox1 = 22, ox2 = 98;       // outer left/right at top
  const oy1 = 36, oy2 = 116;      // outer top/bottom-curve start
  const oyB = 124;                // outer bottom apex
  // Inner cup (oil cavity)
  const ix1 = ox1 + w, ix2 = ox2 - w;
  const iy1 = oy1 + 6;            // inner rim is just below outer rim
  const iyB = oyB - w;            // inner bottom

  return (
    <svg viewBox="0 0 120 140" width="120" height="140" style={{ filter }}>
      {/* Outer body (cross-section) */}
      <path d={`M${ox1} ${oy1} L${ox1} ${oy2} Q${ox1} ${oyB} ${ox1+12} ${oyB} L${ox2-12} ${oyB} Q${ox2} ${oyB} ${ox2} ${oy2} L${ox2} ${oy1} Z`}
            fill={fill} stroke={stroke} strokeWidth="1.5"/>

      {/* Inner cavity — the oil pool */}
      <path d={`M${ix1} ${iy1} L${ix1} ${oy2-2} Q${ix1} ${iyB} ${ix1+8} ${iyB} L${ix2-8} ${iyB} Q${ix2} ${iyB} ${ix2} ${oy2-2} L${ix2} ${iy1} Z`}
            fill={innerGlow} stroke={stroke} strokeWidth="1"/>

      {/* Top rim — connect outer/inner */}
      <line x1={ox1} y1={oy1} x2={ix1} y2={iy1} stroke={stroke} strokeWidth="1"/>
      <line x1={ox2} y1={oy1} x2={ix2} y2={iy1} stroke={stroke} strokeWidth="1"/>

      {/* Wall measurement annotation — small bracket on left wall */}
      <g opacity={glow ? 0.7 : 0.45}>
        <line x1={ox1-4} y1={75} x2={ix1} y2={75} stroke={stroke} strokeWidth="0.8"/>
        <line x1={ox1-2} y1={71} x2={ox1-2} y2={79} stroke={stroke} strokeWidth="0.8"/>
        <line x1={ix1-2} y1={71} x2={ix1-2} y2={79} stroke={stroke} strokeWidth="0.8"/>
      </g>
    </svg>
  );
}

function wallSpec(w) {
  if (!w) return '';
  if (w.id === 'unknown') return 'DEFAULTS · STANDARD CALIBRATION';
  const dir = w.mod > 0 ? 'RETAINS HEAT' : w.mod < 0 ? 'FAST RESPONSE' : 'BALANCED';
  return `${w.thickness.toUpperCase()}  ·  ${dir}`;
}

function WallChooser({ value, onChange, calibration }) {
  const items = window.WALLS;
  const initialIdx = Math.max(0, items.findIndex(w => w.id === value));
  const [idx, setIdx] = useStateB(initialIdx === -1 ? 1 : initialIdx);

  React.useEffect(() => {
    const i = items.findIndex(w => w.id === value);
    if (i >= 0 && i !== idx) setIdx(i);
  }, [value]);

  const go = (delta) => {
    const next = Math.max(0, Math.min(items.length - 1, idx + delta));
    setIdx(next);
    onChange(items[next].id);
  };
  const pick = (i) => {
    setIdx(i);
    onChange(items[i].id);
  };

  const startX = React.useRef(null);
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  const cardW = 220;
  const gap = 14;
  const step = cardW + gap;

  const active = items[idx];
  const modColor = active.mod > 0 ? 'oklch(0.78 0.18 55)'
                 : active.mod < 0 ? 'oklch(0.78 0.10 200)'
                 : 'var(--bone-70)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4, flex: 1, minHeight: 0 }}>
      <div style={{ fontSize: 11.5, color: 'var(--bone-50)', lineHeight: 1.45, marginTop: -4 }}>
        Thicker walls hold heat longer. Thinner walls respond faster.
      </div>

      {/* Carousel viewport */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          flex: 1, minHeight: 240,
          overflow: 'visible',
          marginLeft: -22, marginRight: -22,
          paddingLeft: 22, paddingRight: 22,
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          height: '100%',
          maxHeight: 360,
          display: 'flex', gap, alignItems: 'center',
          transform: `translate(calc(-${idx * step}px - ${cardW / 2}px), -50%)`,
          transition: 'transform 480ms cubic-bezier(.22,1,.36,1)',
        }}>
          {items.map((w, i) => {
            const isActive = i === idx;
            const distance = Math.abs(i - idx);
            return (
              <button key={w.id} onClick={() => pick(i)} style={{
                width: cardW, flexShrink: 0,
                height: '100%', maxHeight: 340, minHeight: 240,
                padding: 0, borderRadius: 22,
                background: 'transparent',
                position: 'relative',
                opacity: isActive ? 1 : Math.max(0.30, 1 - distance * 0.28),
                transform: isActive ? 'scale(1)' : 'scale(0.93)',
                transition: 'opacity 380ms ease, transform 480ms cubic-bezier(.22,1,.36,1)',
                cursor: 'pointer',
              }}>
                <WallCardBody w={w} active={isActive} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
        {items.map((w, i) => (
          <button key={w.id} onClick={() => pick(i)} style={{
            width: i === idx ? 18 : 5, height: 5, borderRadius: 100,
            background: i === idx ? 'oklch(0.80 0.20 55)' : 'rgba(220, 230, 245, 0.20)',
            boxShadow: i === idx ? '0 0 8px oklch(0.72 0.20 50 / 0.7)' : 'none',
            transition: 'width 320ms cubic-bezier(.22,1,.36,1), background 240ms ease',
          }} />
        ))}
      </div>

      {/* Spec readout */}
      <div style={{
        padding: '10px 14px', borderRadius: 12,
        background: 'rgba(8, 10, 16, 0.55)',
        boxShadow: 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--bone-50)' }}>
            THERMAL MODIFIER
          </span>
          <span className="mono" style={{
            fontSize: 11, color: modColor, fontWeight: 500,
          }}>
            {active.mod > 0 ? '+' : ''}{active.mod}°F
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--bone-70)', lineHeight: 1.45 }}>
          {active.description}
        </div>
      </div>
    </div>
  );
}

function WallCardBody({ w, active }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      borderRadius: 22, padding: 18,
      display: 'flex', flexDirection: 'column',
      background: active
        ? 'radial-gradient(ellipse at 50% 30%, oklch(0.22 0.10 50 / 0.50), oklch(0.10 0.04 30 / 0.95) 70%)'
        : 'radial-gradient(ellipse at 50% 30%, oklch(0.16 0.04 240 / 0.40), oklch(0.06 0.02 240 / 0.95) 70%)',
      boxShadow: active
        ? 'inset 0 0 0 1px oklch(0.80 0.20 55 / 0.65), 0 0 0 1px oklch(0.40 0.16 45 / 0.40), 0 18px 48px rgba(0,0,0,0.65), 0 0 60px oklch(0.62 0.20 50 / 0.30)'
        : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.10), 0 6px 18px rgba(0,0,0,0.4)',
      position: 'relative', overflow: 'hidden',
      transition: 'box-shadow 380ms ease, background 380ms ease',
    }}>
      {/* Tag chip — thickness measurement */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <span className="mono" style={{
          fontSize: 8.5, letterSpacing: '0.18em',
          color: active ? 'oklch(0.85 0.16 55)' : 'var(--bone-50)',
          padding: '3px 8px', borderRadius: 100,
          background: active ? 'oklch(0.20 0.08 50 / 0.7)' : 'rgba(220, 230, 245, 0.06)',
          boxShadow: active ? 'inset 0 0 0 0.5px oklch(0.65 0.16 50 / 0.4)' : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.08)',
        }}>{w.id === 'unknown' ? 'UNSURE' : w.thickness}</span>
      </div>

      {/* Cross-section silhouette */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
        <WallSilhouette wallId={w.id} glow={active} />
      </div>

      {/* Caption */}
      <div style={{ textAlign: 'center' }}>
        <div className="display" style={{
          fontSize: 19, fontWeight: 400,
          color: active ? 'var(--bone-100)' : 'var(--bone-70)',
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          marginBottom: 6,
          textShadow: active ? '0 0 18px oklch(0.78 0.20 55 / 0.35)' : 'none',
        }}>{w.name}</div>
        <div className="mono" style={{
          fontSize: 8.5, letterSpacing: '0.18em',
          color: active ? 'var(--bone-50)' : 'var(--bone-35)',
        }}>{wallSpec(w)}</div>
      </div>
    </div>
  );
}

function FilterChips({ items, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 4, overflowX: 'auto' }} className="no-scrollbar">
      {items.map(c => (
        <button key={c} onClick={() => onChange(c)} style={{
          padding: '6px 12px', borderRadius: 100, fontSize: 11, letterSpacing: '0.04em',
          color: value === c ? 'var(--bone-100)' : 'var(--bone-50)',
          background: value === c ? 'oklch(0.18 0.02 50)' : 'transparent',
          boxShadow: value === c ? 'inset 0 0 0 0.5px oklch(0.55 0.10 55 / 0.5)' : 'inset 0 0 0 0.5px rgba(255,240,220,0.08)',
          flexShrink: 0,
        }}>{c}</button>
      ))}
    </div>
  );
}

// ─── Review step — slim calibration + cold-start + save preset ─────────
function ReviewStep({ banger, concentrate, sensor, wall, calibration, coldStart, setColdStart, coldStartInfo }) {
  if (!banger || !concentrate || !sensor || !wall) return null;

  const [savingPreset, setSavingPreset] = useStateB(false);
  const [presetName, setPresetName] = useStateB('');
  const [savedAs, setSavedAs] = useStateB(null);

  // Suggested name once the user opens the save panel
  React.useEffect(() => {
    if (savingPreset && !presetName) {
      setPresetName(`${concentrate.name} · ${banger.name.split(' ')[0]}`);
    }
  }, [savingPreset]);

  const commitSave = () => {
    const trimmed = presetName.trim();
    if (!trimmed) return;
    // Persist on window so the rest of the app can pick it up if it wants
    window.QUARTZIE_USER_PRESETS = window.QUARTZIE_USER_PRESETS || [];
    window.QUARTZIE_USER_PRESETS.push({
      id: 'user-' + Date.now(),
      name: trimmed,
      banger: banger.id, concentrate: concentrate.id, sensor: sensor.id, wall: wall.id,
      coldStart, savedAt: Date.now(),
    });
    setSavedAs(trimmed);
    setSavingPreset(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Calibration headline — just the number that matters ── */}
      <div style={{
        padding: '18px 18px 16px', borderRadius: 16,
        background: 'linear-gradient(180deg, oklch(0.16 0.04 240), oklch(0.10 0.025 240))',
        boxShadow: 'inset 0 0.5px 0 rgba(220, 230, 245, 0.10), inset 0 0 0 0.5px oklch(0.78 0.20 55 / 0.32), 0 0 28px oklch(0.62 0.20 50 / 0.10)',
      }}>
        <div className="eyebrow" style={{ fontSize: 9, marginBottom: 12, color: 'oklch(0.80 0.20 55)' }}>
          {sensor.method === 'enail' ? 'PID SETPOINT' : 'DABRITE WILL READ'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <div style={{
            fontFamily: 'var(--sans)', fontSize: 56, color: 'oklch(0.80 0.20 55)',
            fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95,
            textShadow: '0 0 28px oklch(0.72 0.20 50 / 0.55)',
          }}>
            {calibration.displayed}°
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--bone-70)', letterSpacing: '0.10em' }}>
              {calibration.low}–{calibration.high}°
            </div>
            <div style={{ fontSize: 10, color: 'var(--bone-35)', marginTop: 2, letterSpacing: '0.10em', textTransform: 'uppercase' }}>window</div>
          </div>
        </div>
      </div>

      {/* ── One-line setup recap ── */}
      <div style={{
        padding: '12px 14px', borderRadius: 12,
        background: 'rgba(255,240,220,0.025)',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.06)',
        fontSize: 12.5, color: 'var(--bone-90)', lineHeight: 1.5,
      }}>
        <span style={{ color: 'var(--bone-100)' }}>{banger.name}</span>
        <span style={{ color: 'var(--bone-35)' }}> · </span>
        <span>{concentrate.name}</span>
        <span style={{ color: 'var(--bone-35)' }}> · </span>
        <span style={{ color: 'var(--bone-70)' }}>{wall.name.toLowerCase()} wall</span>
      </div>

      {/* ── Warning (only if present) ── */}
      {concentrate.warning && (
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'oklch(0.20 0.10 70 / 0.35)',
          boxShadow: 'inset 0 0 0 0.5px oklch(0.65 0.12 70 / 0.5)',
          fontSize: 11.5, color: 'oklch(0.88 0.12 80)', lineHeight: 1.45,
        }}>⚠ {concentrate.warning}</div>
      )}

      {/* ── Cold-start fork ── */}
      <ColdStartToggle banger={banger} concentrate={concentrate} coldStart={coldStart} setColdStart={setColdStart} info={coldStartInfo} />

      {/* ── Save as preset ── */}
      <SavePresetRow
        savingPreset={savingPreset} setSavingPreset={setSavingPreset}
        presetName={presetName} setPresetName={setPresetName}
        savedAs={savedAs} commitSave={commitSave}
      />
    </div>
  );
}

function SavePresetRow({ savingPreset, setSavingPreset, presetName, setPresetName, savedAs, commitSave }) {
  // Saved confirmation pill
  if (savedAs) {
    return (
      <div style={{
        padding: '12px 14px', borderRadius: 12,
        background: 'oklch(0.20 0.06 200 / 0.30)',
        boxShadow: 'inset 0 0 0 0.5px oklch(0.55 0.08 200 / 0.50)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 12, color: 'var(--bone-90)',
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'oklch(0.55 0.08 200)', color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700,
        }}>✓</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--bone-100)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Saved “{savedAs}”
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--bone-50)', letterSpacing: '0.04em' }}>
            Lives in your presets list
          </div>
        </div>
      </div>
    );
  }

  // Inline form
  if (savingPreset) {
    return (
      <div style={{
        padding: 14, borderRadius: 14,
        background: 'rgba(255,240,220,0.025)',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.10)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div className="eyebrow" style={{ fontSize: 9 }}>SAVE THIS SESSION</div>
        <input
          autoFocus
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commitSave(); if (e.key === 'Escape') setSavingPreset(false); }}
          placeholder="Preset name"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            background: 'rgba(0,0,0,0.25)',
            boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.18)',
            color: 'var(--bone-100)', fontSize: 13.5,
            fontFamily: 'var(--sans)', letterSpacing: '-0.005em',
            outline: 'none', border: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSavingPreset(false)} style={{
            padding: '8px 14px', borderRadius: 100,
            background: 'transparent', color: 'var(--bone-70)',
            fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em',
            boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.10)',
          }}>Cancel</button>
          <button onClick={commitSave} disabled={!presetName.trim()} style={{
            flex: 1, padding: '8px 14px', borderRadius: 100,
            background: presetName.trim()
              ? 'linear-gradient(180deg, oklch(0.72 0.19 50), oklch(0.55 0.17 45))'
              : 'rgba(180, 200, 230, 0.06)',
            color: presetName.trim() ? '#fff' : 'var(--bone-35)',
            fontSize: 11.5, fontWeight: 600, letterSpacing: '0.02em',
            boxShadow: presetName.trim()
              ? 'inset 0 0.5px 0 rgba(255,255,255,0.28), 0 4px 16px oklch(0.62 0.20 50 / 0.35)'
              : 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.10)',
          }}>Save preset</button>
        </div>
      </div>
    );
  }

  // Default ghost button
  return (
    <button onClick={() => setSavingPreset(true)} style={{
      padding: '11px 14px', borderRadius: 12,
      background: 'transparent',
      boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.14)',
      display: 'flex', alignItems: 'center', gap: 10,
      color: 'var(--bone-90)', fontSize: 12.5, fontWeight: 500, textAlign: 'left',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.30)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: 'var(--bone-70)', lineHeight: 1,
      }}>+</span>
      <span style={{ flex: 1 }}>Save as preset</span>
      <span className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--bone-35)' }}>OPTIONAL</span>
    </button>
  );
}

function SummaryLine({ k, v, dim }) {
  return (<>
    <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--bone-50)', textTransform: 'uppercase', alignSelf: 'baseline' }}>{k}</div>
    <div style={{ fontSize: 12, color: dim ? 'var(--bone-70)' : 'var(--bone-90)', lineHeight: 1.45 }}>{v}</div>
  </>);
}

function ColdStartToggle({ banger, concentrate, coldStart, setColdStart, info }) {
  if (!banger || !concentrate) return null;
  if (banger.geometry === 'enail') return null; // n/a for e-nail
  const blocked = info.level === 'banger-blocks';

  let copy = '';
  let badge = '';
  if (blocked) {
    copy = `${banger.name} is not cold-start compatible. Hot-start required.`;
    badge = 'NOT AVAILABLE';
  } else if (info.level === 'ideal') {
    copy = 'Both banger and concentrate are cold-start ideal. Strongly recommended for terpene preservation.';
    badge = 'IDEAL';
  } else if (info.level === 'good') {
    copy = 'Concentrate prefers cold-start. Banger supports it.';
    badge = 'RECOMMENDED';
  } else {
    copy = 'Available, but hot-start is the typical workflow for this combination.';
    badge = 'OPTIONAL';
  }

  return (
    <div style={{
      padding: 14, borderRadius: 14,
      background: coldStart && !blocked
        ? 'linear-gradient(180deg, oklch(0.20 0.06 200), oklch(0.12 0.03 200))'
        : 'rgba(255,240,220,0.025)',
      boxShadow: coldStart && !blocked
        ? 'inset 0 0 0 0.5px oklch(0.55 0.08 200 / 0.6), 0 0 22px oklch(0.55 0.08 200 / 0.15)'
        : 'inset 0 0 0 0.5px rgba(255,240,220,0.06)',
      transition: 'all 280ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: 'var(--bone-100)', fontWeight: 500 }}>Cold start</div>
        <span className="mono" style={{
          fontSize: 8.5, letterSpacing: '0.14em',
          color: blocked ? 'oklch(0.65 0.12 25)' : info.level === 'ideal' ? 'oklch(0.78 0.10 200)' : 'var(--bone-50)',
          padding: '2px 6px', borderRadius: 4,
          background: 'rgba(255, 240, 220, 0.05)',
        }}>{badge}</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => !blocked && setColdStart(!coldStart)} disabled={blocked} style={{
          width: 36, height: 20, borderRadius: 100,
          background: coldStart && !blocked ? 'oklch(0.55 0.08 200)' : 'rgba(255,240,220,0.08)',
          position: 'relative', transition: 'background 240ms ease',
          opacity: blocked ? 0.4 : 1,
        }}>
          <div style={{
            position: 'absolute', top: 2, left: coldStart && !blocked ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 240ms ease',
          }} />
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--bone-70)', lineHeight: 1.45 }}>{copy}</div>
    </div>
  );
}

window.BuildStage = BuildStage;
