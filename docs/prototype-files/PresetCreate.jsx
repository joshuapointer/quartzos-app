// PresetCreate.jsx — Quartzie preset creation wizard
// 4 steps: Banger (carousel) → Extract (swatch grid) → Tune (dial-as-input) → Save
// Lives in a full-screen overlay inside the iOS frame.

const BANGERS = [
  {
    id: 'classic',
    name: 'Classic Bucket',
    glyph: 'quartz',
    modifier: 0,
    note: 'Standard heat retention. IR sensor reads the bottom perfectly.',
    spec: 'Flat 25mm bottom · Quartz · 4mm wall',
  },
  {
    id: 'opaque',
    name: 'Opaque Bottom',
    glyph: 'opaque',
    modifier: 10,
    note: 'Porous base speeds nucleation. Loses heat slightly faster.',
    spec: 'Sandblasted base · Quartz · 4mm wall',
  },
  {
    id: 'thick',
    name: 'Thick Bottom',
    glyph: 'low',
    modifier: -10,
    note: 'Massive thermal mass. Resists cooling during heavy draws.',
    spec: '8mm base · Quartz · 4mm wall',
  },
  {
    id: 'slurper',
    name: 'Terp Slurper',
    glyph: 'custom',
    modifier: 35,
    note: 'Oil travels up cooler column. Dish requires temp bump.',
    spec: 'Slotted dish · 3-tier · Quartz',
  },
  {
    id: 'controlTower',
    name: 'Control Tower',
    glyph: 'custom',
    modifier: 45,
    note: 'Maximum travel distance. Requires hottest dish reading.',
    spec: 'Multi-channel · Vertical · Quartz',
  },
];

const EXTRACTS = [
  { id: 'freshPress', name: 'Fresh Press',  type: 'Solventless',   baseTemp: 470, swatch: ['oklch(0.85 0.12 80)',  'oklch(0.65 0.12 70)'] },
  { id: 'coldCure',   name: 'Cold Cure',    type: 'Solventless',   baseTemp: 485, swatch: ['oklch(0.78 0.10 75)',  'oklch(0.55 0.10 65)'] },
  { id: 'fullMelt',   name: '6-Star Melt',  type: 'Solventless',   baseTemp: 450, swatch: ['oklch(0.92 0.06 80)',  'oklch(0.75 0.10 75)'] },
  { id: 'liveResin',  name: 'Live Resin',   type: 'Hydrocarbon',   baseTemp: 505, swatch: ['oklch(0.70 0.16 60)',  'oklch(0.45 0.12 50)'] },
  { id: 'shatter',    name: 'Shatter',      type: 'Hydrocarbon',   baseTemp: 515, swatch: ['oklch(0.62 0.14 55)',  'oklch(0.40 0.10 45)'] },
  { id: 'diamonds',   name: 'Diamonds',     type: 'Isolate',       baseTemp: 530, swatch: ['oklch(0.92 0.04 240)', 'oklch(0.75 0.06 230)'] },
];

const STRAIN_LIBRARY = [
  'GMO Cookies', 'Tropicana Cherry', 'Zkittlez', 'Rainbow Belts',
  'Apples & Bananas', 'Gelato 41', 'Wedding Cake', 'Runtz',
  'Blueberry Muffin', 'Sour Diesel', 'Chemdog', 'Papaya Punch',
  'Lemon Cherry Gelato', 'Mac 1', 'Garlic Cocktail', 'Cereal Milk',
];

// ─── Wizard shell ──────────────────────────────────────────────────
function PresetCreate({ initialStep = 0, initialBangerId = null, initialExtractId = null, variant = 'wizard', onClose = () => {} }) {
  const [step, setStep] = React.useState(initialStep);
  const [bangerId, setBangerId] = React.useState(initialBangerId);
  const [extractId, setExtractId] = React.useState(initialExtractId);
  const [tempOffset, setTempOffset] = React.useState(0);
  const [strain, setStrain] = React.useState('');
  const [terpenes, setTerpenes] = React.useState([]);
  const [presetName, setPresetName] = React.useState('');
  const [presetGlyph, setPresetGlyph] = React.useState('quartz');

  const banger = BANGERS.find(b => b.id === bangerId);
  const extract = EXTRACTS.find(x => x.id === extractId);
  const baseTemp = (banger && extract) ? extract.baseTemp + banger.modifier : 0;
  const finalTemp = baseTemp + tempOffset;

  // default name suggestion
  React.useEffect(() => {
    if (banger && extract && !presetName) {
      setPresetName(`${extract.name} · ${banger.name.split(' ')[0]}`);
    }
  }, [bangerId, extractId]);

  const canAdvance = (
    (step === 0 && bangerId) ||
    (step === 1 && extractId) ||
    (step === 2) ||
    (step === 3 && presetName.trim().length > 0)
  );

  const next = () => canAdvance && setStep(Math.min(3, step + 1));
  const back = () => step > 0 ? setStep(step - 1) : onClose();

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#050403',
      display: 'flex', flexDirection: 'column',
      paddingTop: 8,
      animation: 'pcSlideUp 320ms cubic-bezier(0.2, 0.9, 0.3, 1)',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes pcSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pcFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <PCHeader step={step} onBack={back} onClose={onClose} />
      <PCStepIndicator step={step} />

      {/* Body */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {step === 0 && (
          <BangerStep selected={bangerId} onSelect={setBangerId} />
        )}
        {step === 1 && (
          <ExtractStep selected={extractId} onSelect={setExtractId} banger={banger} />
        )}
        {step === 2 && (
          <TuneStep
            banger={banger} extract={extract}
            baseTemp={baseTemp} finalTemp={finalTemp} tempOffset={tempOffset}
            onOffsetChange={setTempOffset}
            strain={strain} onStrain={setStrain}
            terpenes={terpenes} onTerpenes={setTerpenes}
          />
        )}
        {step === 3 && (
          <SaveStep
            banger={banger} extract={extract}
            finalTemp={finalTemp} strain={strain} terpenes={terpenes}
            name={presetName} onName={setPresetName}
            glyph={presetGlyph} onGlyph={setPresetGlyph}
          />
        )}
      </div>

      {/* CTA bar */}
      <PCFooter
        step={step}
        canAdvance={canAdvance}
        finalTemp={finalTemp}
        onNext={next}
        onSave={onClose}
      />
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────────
function PCHeader({ step, onBack, onClose }) {
  const titles = ['Pick your hardware', 'What are you dabbing?', 'Tune your window', 'Save your preset'];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px 6px',
    }}>
      <button onClick={onBack} style={{
        width: 36, height: 36, borderRadius: 100,
        background: 'rgba(255,240,220,0.04)',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M9 2 L4 7 L9 12" stroke="var(--bone-90)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div className="eyebrow" style={{ fontSize: 9 }}>STEP {step + 1} OF 4</div>
        <div className="serif" style={{ fontSize: 17, color: 'var(--bone-100)', marginTop: 2, letterSpacing: '-0.01em' }}>
          {titles[step]}
        </div>
      </div>
      <button onClick={onClose} style={{
        width: 36, height: 36, borderRadius: 100,
        background: 'rgba(255,240,220,0.04)',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="11" height="11" viewBox="0 0 12 12">
          <path d="M2 2 L10 10 M10 2 L2 10" stroke="var(--bone-50)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function PCStepIndicator({ step }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '12px 22px 0',
      justifyContent: 'center',
    }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          flex: 1, height: 2, borderRadius: 2,
          background: i <= step
            ? 'linear-gradient(90deg, oklch(0.55 0.10 55), oklch(0.78 0.18 55))'
            : 'rgba(255,240,220,0.06)',
          transition: 'background 400ms ease',
          boxShadow: i === step ? '0 0 8px oklch(0.78 0.18 55 / 0.5)' : 'none',
        }}/>
      ))}
    </div>
  );
}

// ─── Step 0: Banger carousel ────────────────────────────────────────
function BangerStep({ selected, onSelect }) {
  const trackRef = React.useRef(null);
  const cardW = 240, gap = 14;

  // snap to selected on mount
  React.useEffect(() => {
    if (selected && trackRef.current) {
      const idx = BANGERS.findIndex(b => b.id === selected);
      trackRef.current.scrollTo({ left: idx * (cardW + gap), behavior: 'smooth' });
    }
  }, []);

  return (
    <div style={{
      animation: 'pcFadeIn 360ms ease',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '20px 22px 6px', textAlign: 'center' }}>
        <p style={{ fontSize: 12.5, color: 'var(--bone-50)', lineHeight: 1.5, margin: 0, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
          Swipe to find what's on your rig. We'll calculate thermal retention from there.
        </p>
      </div>

      {/* Carousel */}
      <div
        ref={trackRef}
        className="no-scrollbar"
        style={{
          flex: 1,
          display: 'flex', gap, alignItems: 'center',
          padding: '0 calc(50% - 120px)',
          overflowX: 'auto', overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {BANGERS.map(b => (
          <BangerCard key={b.id} banger={b} active={selected === b.id} onClick={() => onSelect(b.id)} />
        ))}
      </div>

      {/* Indicator dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '12px 0 4px' }}>
        {BANGERS.map(b => (
          <div key={b.id} style={{
            width: selected === b.id ? 16 : 5, height: 5, borderRadius: 3,
            background: selected === b.id ? 'oklch(0.78 0.18 55)' : 'rgba(255,240,220,0.15)',
            transition: 'all 200ms ease',
          }}/>
        ))}
      </div>

      {/* Modifier readout */}
      <div style={{ padding: '10px 22px 18px' }}>
        {selected ? (
          <div style={{
            padding: '12px 16px',
            borderRadius: 14,
            background: 'linear-gradient(180deg, oklch(0.11 0.012 50), oklch(0.075 0.008 50))',
            boxShadow: 'inset 0 0.5px 0 rgba(255,240,220,0.05), inset 0 0 0 0.5px rgba(255,240,220,0.04)',
            animation: 'pcFadeIn 240ms ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow" style={{ fontSize: 9 }}>THERMAL MODIFIER</span>
              <span className="mono" style={{
                fontSize: 14,
                color: BANGERS.find(b => b.id === selected).modifier > 0 ? 'oklch(0.78 0.18 55)' :
                       BANGERS.find(b => b.id === selected).modifier < 0 ? 'oklch(0.78 0.08 240)' :
                       'var(--bone-70)',
              }}>
                {BANGERS.find(b => b.id === selected).modifier > 0 ? '+' : ''}{BANGERS.find(b => b.id === selected).modifier}°F
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--bone-50)', marginTop: 6, lineHeight: 1.45 }}>
              {BANGERS.find(b => b.id === selected).note}
            </div>
          </div>
        ) : (
          <div style={{ height: 72 }} />
        )}
      </div>
    </div>
  );
}

function BangerCard({ banger, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        scrollSnapAlign: 'center',
        width: 240, height: 280,
        borderRadius: 22,
        padding: 20,
        background: active
          ? 'linear-gradient(180deg, oklch(0.18 0.025 50), oklch(0.10 0.012 50))'
          : 'linear-gradient(180deg, oklch(0.11 0.01 50), oklch(0.075 0.008 50))',
        boxShadow: active
          ? 'inset 0 0 0 0.5px oklch(0.55 0.10 55 / 0.6), inset 0 0.5px 0 rgba(255,240,220,0.08), 0 0 30px oklch(0.55 0.10 55 / 0.18)'
          : 'inset 0 0.5px 0 rgba(255,240,220,0.05), inset 0 0 0 0.5px rgba(255,240,220,0.04)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 220ms ease',
        transform: active ? 'scale(1.0)' : 'scale(0.94)',
        cursor: 'pointer',
      }}
    >
      {/* Diagram — CSS-shape banger silhouette */}
      <div style={{
        width: 96, height: 110, position: 'relative',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        marginTop: 14,
      }}>
        <BangerDiagram kind={banger.id} active={active} />
      </div>

      <div style={{ textAlign: 'center', width: '100%' }}>
        <div className="serif" style={{
          fontSize: 22, color: active ? 'var(--bone-100)' : 'var(--bone-90)',
          letterSpacing: '-0.01em', lineHeight: 1.05, marginBottom: 4,
        }}>{banger.name}</div>
        <div className="mono" style={{
          fontSize: 9.5, letterSpacing: '0.10em', color: 'var(--bone-35)',
          textTransform: 'uppercase',
        }}>{banger.spec}</div>
      </div>
    </div>
  );
}

// CSS-shape banger silhouettes (no SVG complexity)
function BangerDiagram({ kind, active }) {
  const stroke = active ? 'oklch(0.78 0.18 55)' : 'oklch(0.55 0.012 60)';
  const glow = active ? `0 0 20px oklch(0.78 0.18 55 / 0.3)` : 'none';
  const common = {
    border: `1.5px solid ${stroke}`,
    boxShadow: glow,
    transition: 'all 220ms ease',
  };

  if (kind === 'classic') return (
    <div style={{ ...common, width: 60, height: 70, borderTop: 'none', borderRadius: '0 0 14px 14px' }} />
  );
  if (kind === 'opaque') return (
    <div style={{ ...common, width: 60, height: 70, borderTop: 'none', borderBottom: `5px solid ${stroke}`, borderRadius: '0 0 14px 14px' }} />
  );
  if (kind === 'thick') return (
    <div style={{ ...common, width: 60, height: 70, borderTop: 'none', borderBottom: `10px solid ${stroke}`, borderRadius: '0 0 14px 14px' }} />
  );
  if (kind === 'slurper') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{ width: 28, height: 50, borderLeft: `1.5px solid ${stroke}`, borderRight: `1.5px solid ${stroke}`, boxShadow: glow }} />
      <div style={{ width: 70, height: 18, border: `1.5px solid ${stroke}`, borderRadius: 100, boxShadow: glow }} />
    </div>
  );
  if (kind === 'controlTower') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{ width: 14, height: 70, borderLeft: `1.5px solid ${stroke}`, borderRight: `1.5px solid ${stroke}`, boxShadow: glow }} />
      <div style={{ width: 60, height: 16, border: `1.5px solid ${stroke}`, borderRadius: 100, boxShadow: glow }} />
    </div>
  );
}

// ─── Step 1: Extract swatch grid ────────────────────────────────────
function ExtractStep({ selected, onSelect, banger }) {
  const groups = [
    { type: 'Solventless', items: EXTRACTS.filter(e => e.type === 'Solventless') },
    { type: 'Hydrocarbon', items: EXTRACTS.filter(e => e.type === 'Hydrocarbon') },
    { type: 'Isolate', items: EXTRACTS.filter(e => e.type === 'Isolate') },
  ];

  return (
    <div style={{
      animation: 'pcFadeIn 360ms ease',
      height: '100%', overflow: 'auto', padding: '20px 22px 12px',
    }} className="no-scrollbar">
      <p style={{ fontSize: 12.5, color: 'var(--bone-50)', lineHeight: 1.5, margin: '0 0 18px', textAlign: 'center' }}>
        Each material has a different volatility window.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {groups.map(g => (
          <div key={g.type}>
            <div className="eyebrow" style={{ fontSize: 9, marginBottom: 8, paddingLeft: 4 }}>{g.type}</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: g.items.length === 1 ? '1fr' : 'repeat(2, 1fr)',
              gap: 8,
            }}>
              {g.items.map(e => (
                <ExtractSwatch key={e.id} extract={e} active={selected === e.id} onClick={() => onSelect(e.id)} banger={banger} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExtractSwatch({ extract, active, onClick, banger }) {
  const projectedTemp = banger ? extract.baseTemp + banger.modifier : extract.baseTemp;
  return (
    <button onClick={onClick} style={{
      position: 'relative',
      borderRadius: 16,
      padding: 0,
      background: 'transparent',
      boxShadow: active
        ? 'inset 0 0 0 1px oklch(0.78 0.18 55 / 0.7), 0 0 20px oklch(0.55 0.10 55 / 0.25)'
        : 'inset 0 0 0 0.5px rgba(255,240,220,0.06)',
      overflow: 'hidden',
      transition: 'all 200ms ease',
      textAlign: 'left',
      cursor: 'pointer',
    }}>
      {/* Texture swatch */}
      <div style={{
        position: 'relative',
        height: 78,
        background: `radial-gradient(ellipse at 35% 30%, ${extract.swatch[0]}, ${extract.swatch[1]} 75%)`,
        boxShadow: 'inset 0 -2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}>
        {/* texture overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: extract.id === 'shatter' ? 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.18) 31%, transparent 32%, transparent 60%, rgba(255,255,255,0.12) 61%, transparent 62%)' :
                      extract.id === 'diamonds' ? 'linear-gradient(45deg, rgba(255,255,255,0.20) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.10) 25%, transparent 25%)' :
                      extract.id === 'fullMelt' ? 'radial-gradient(circle at 30% 60%, rgba(255,255,255,0.18) 0%, transparent 18%), radial-gradient(circle at 70% 40%, rgba(255,255,255,0.14) 0%, transparent 20%)' :
                      extract.id === 'liveResin' ? 'radial-gradient(ellipse at 50% 80%, rgba(0,0,0,0.3) 0%, transparent 50%)' :
                      'none',
          backgroundSize: extract.id === 'diamonds' ? '8px 8px' : 'auto',
          mixBlendMode: 'overlay',
        }}/>
        {active && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 18, height: 18, borderRadius: '50%',
            background: 'oklch(0.78 0.18 55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px oklch(0.78 0.18 55 / 0.7)',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5 L4 7 L8 3" stroke="#1a0f08" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}
      </div>
      <div style={{
        padding: '10px 12px 12px',
        background: active ? 'oklch(0.13 0.02 50)' : 'oklch(0.085 0.01 50)',
      }}>
        <div style={{
          fontSize: 13, color: active ? 'var(--bone-100)' : 'var(--bone-90)',
          fontWeight: 500, letterSpacing: '-0.005em',
        }}>{extract.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.10em', color: 'var(--bone-35)', textTransform: 'uppercase' }}>BASE</span>
          <span className="mono" style={{ fontSize: 11, color: active ? 'oklch(0.78 0.18 55)' : 'var(--bone-50)' }}>{projectedTemp}°F</span>
        </div>
      </div>
    </button>
  );
}

// ─── Step 2: Tune (dial-as-input) ───────────────────────────────────
function TuneStep({ banger, extract, baseTemp, finalTemp, tempOffset, onOffsetChange, strain, onStrain, terpenes, onTerpenes }) {
  const dialRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  // drag the temperature with vertical pan on the dial
  const onPointerDown = (e) => {
    setDragging(true);
    const startY = e.clientY;
    const startOffset = tempOffset;
    const move = (ev) => {
      const dy = startY - ev.clientY; // up = warmer
      const newOffset = Math.max(-30, Math.min(30, Math.round(startOffset + dy / 4)));
      onOffsetChange(newOffset);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // strain autocomplete
  const [strainFocused, setStrainFocused] = React.useState(false);
  const matches = strain.length > 0
    ? STRAIN_LIBRARY.filter(s => s.toLowerCase().includes(strain.toLowerCase())).slice(0, 4)
    : [];

  const TERPENES = ['Limonene', 'Caryophyllene', 'Myrcene', 'Pinene', 'Linalool', 'Terpinolene', 'Humulene', 'Ocimene'];

  // Determine dial state based on temp
  const dialState = finalTemp >= 540 ? 'target' : finalTemp >= 490 ? 'heating' : 'dunk';

  return (
    <div style={{
      animation: 'pcFadeIn 360ms ease',
      height: '100%', overflow: 'auto', padding: '14px 22px 12px',
    }} className="no-scrollbar">

      {/* Interactive Dial */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        marginBottom: 8,
        userSelect: 'none', touchAction: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
      }} onPointerDown={onPointerDown} ref={dialRef}>
        <TempDial
          temp={finalTemp}
          state={dialState}
          unit="°F"
          size={230}
          targetMin={finalTemp - 10}
          targetMax={finalTemp + 10}
          progress={Math.max(0, Math.min(1, finalTemp / 700))}
        />
      </div>

      {/* drag hint */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--bone-35)', textTransform: 'uppercase' }}>
          {dragging ? '◆ DRAG TO TUNE ◆' : 'DRAG DIAL · UP WARMER · DOWN COOLER'}
        </span>
      </div>

      {/* Logic note */}
      <div style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: 'linear-gradient(180deg, oklch(0.10 0.012 50), oklch(0.075 0.008 50))',
        boxShadow: 'inset 0 0.5px 0 rgba(255,240,220,0.05), inset 0 0 0 0.5px rgba(255,240,220,0.04)',
        marginBottom: 16,
      }}>
        <div className="eyebrow" style={{ fontSize: 9, marginBottom: 6 }}>THERMAL LOGIC</div>
        <div style={{ fontSize: 11.5, color: 'var(--bone-70)', lineHeight: 1.5 }}>
          <span style={{ color: 'var(--bone-100)' }}>{extract?.name}</span> base{' '}
          <span className="mono" style={{ color: 'var(--bone-90)' }}>{extract?.baseTemp}°</span>
          {' '}· {banger?.name} modifier{' '}
          <span className="mono" style={{ color: banger?.modifier > 0 ? 'oklch(0.78 0.18 55)' : banger?.modifier < 0 ? 'oklch(0.78 0.08 240)' : 'var(--bone-90)' }}>
            {banger?.modifier > 0 ? '+' : ''}{banger?.modifier}°
          </span>
          {tempOffset !== 0 && (
            <>
              {' '}· your tune{' '}
              <span className="mono" style={{ color: tempOffset > 0 ? 'oklch(0.78 0.18 55)' : 'oklch(0.78 0.08 240)' }}>
                {tempOffset > 0 ? '+' : ''}{tempOffset}°
              </span>
            </>
          )}
          {' '}={' '}
          <span className="mono" style={{ color: 'oklch(0.78 0.18 55)', fontWeight: 500 }}>{finalTemp}°F</span>
        </div>
      </div>

      {/* Strain (optional) */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, paddingLeft: 4 }}>
          <span className="eyebrow" style={{ fontSize: 9 }}>STRAIN <span style={{ color: 'var(--bone-35)' }}>(OPTIONAL)</span></span>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            value={strain}
            onChange={(e) => onStrain(e.target.value)}
            onFocus={() => setStrainFocused(true)}
            onBlur={() => setTimeout(() => setStrainFocused(false), 200)}
            placeholder="Search strains…"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              background: 'oklch(0.075 0.008 50)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6), inset 0 0 0 0.5px rgba(255,240,220,0.06)',
              border: 'none', outline: 'none',
              color: 'var(--bone-100)', fontSize: 13,
              fontFamily: 'var(--sans)',
            }}
          />
          {strainFocused && matches.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              borderRadius: 12, padding: 4,
              background: 'oklch(0.10 0.012 50)',
              boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.08), 0 12px 30px rgba(0,0,0,0.5)',
              zIndex: 20,
            }}>
              {matches.map(m => (
                <button
                  key={m}
                  onMouseDown={() => { onStrain(m); setStrainFocused(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', borderRadius: 8,
                    fontSize: 12.5, color: 'var(--bone-90)',
                    background: 'transparent',
                  }}
                >{m}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Terpene chips */}
      <div style={{ marginBottom: 22 }}>
        <div className="eyebrow" style={{ fontSize: 9, marginBottom: 8, paddingLeft: 4 }}>
          DOMINANT TERPENES <span style={{ color: 'var(--bone-35)' }}>(SELECT TO BIAS TUNE)</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TERPENES.map(t => {
            const on = terpenes.includes(t);
            return (
              <button
                key={t}
                onClick={() => onTerpenes(on ? terpenes.filter(x => x !== t) : [...terpenes, t])}
                style={{
                  padding: '7px 11px',
                  borderRadius: 100,
                  fontSize: 11, letterSpacing: '0.02em',
                  color: on ? 'var(--bone-100)' : 'var(--bone-50)',
                  background: on ? 'oklch(0.18 0.02 50)' : 'transparent',
                  boxShadow: on
                    ? 'inset 0 0 0 0.5px oklch(0.55 0.10 55 / 0.7), 0 0 12px oklch(0.55 0.10 55 / 0.2)'
                    : 'inset 0 0 0 0.5px rgba(255,240,220,0.10)',
                  transition: 'all 180ms ease',
                  cursor: 'pointer',
                }}
              >
                {on && <span style={{ marginRight: 4, color: 'oklch(0.78 0.18 55)' }}>●</span>}
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Save ───────────────────────────────────────────────────
function SaveStep({ banger, extract, finalTemp, strain, terpenes, name, onName, glyph, onGlyph }) {
  const glyphs = ['quartz', 'opaque', 'low', 'custom'];
  const dunkTemp = Math.max(180, Math.min(320, finalTemp - 290));

  return (
    <div style={{
      animation: 'pcFadeIn 360ms ease',
      height: '100%', overflow: 'auto', padding: '14px 22px 12px',
    }} className="no-scrollbar">

      {/* Hero card preview */}
      <div style={{
        position: 'relative',
        borderRadius: 22, padding: 22,
        background: 'linear-gradient(180deg, oklch(0.16 0.02 50), oklch(0.10 0.012 50))',
        boxShadow: 'inset 0 0 0 0.5px oklch(0.55 0.10 55 / 0.5), inset 0 0.5px 0 rgba(255,240,220,0.08), 0 0 30px oklch(0.55 0.10 55 / 0.18)',
        marginBottom: 18, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: 'oklch(0.78 0.18 55 / 0.10)',
          filter: 'blur(40px)',
        }}/>

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14, position: 'relative' }}>
          <PresetGlyph kind={glyph} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>YOUR PRESET</div>
            <div className="serif" style={{ fontSize: 22, color: 'var(--bone-100)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {name || 'Untitled Preset'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
          <div>
            <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>DAB</div>
            <div className="serif" style={{ fontSize: 30, color: 'oklch(0.78 0.18 55)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {finalTemp}<span style={{ fontSize: 16, opacity: 0.6 }}>°</span>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>DUNK</div>
            <div className="serif" style={{ fontSize: 30, color: 'oklch(0.78 0.08 240)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {dunkTemp}<span style={{ fontSize: 16, opacity: 0.6 }}>°</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--bone-50)', lineHeight: 1.5, position: 'relative' }}>
          {extract?.name} · {banger?.name}
          {strain && ` · ${strain}`}
          {terpenes.length > 0 && ` · ${terpenes.slice(0, 2).join(', ')}${terpenes.length > 2 ? '…' : ''}`}
        </div>
      </div>

      {/* Name */}
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ fontSize: 9, marginBottom: 8, paddingLeft: 4 }}>NAME</div>
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Friday Night Setup"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            background: 'oklch(0.075 0.008 50)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6), inset 0 0 0 0.5px rgba(255,240,220,0.06)',
            border: 'none', outline: 'none',
            color: 'var(--bone-100)', fontSize: 13,
            fontFamily: 'var(--sans)',
          }}
        />
      </div>

      {/* Glyph picker */}
      <div style={{ marginBottom: 22 }}>
        <div className="eyebrow" style={{ fontSize: 9, marginBottom: 8, paddingLeft: 4 }}>SIGIL</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {glyphs.map(g => (
            <button
              key={g}
              onClick={() => onGlyph(g)}
              style={{
                padding: 4, borderRadius: 14,
                background: 'transparent',
                boxShadow: glyph === g
                  ? 'inset 0 0 0 1px oklch(0.78 0.18 55 / 0.7), 0 0 14px oklch(0.55 0.10 55 / 0.3)'
                  : 'inset 0 0 0 0.5px rgba(255,240,220,0.06)',
                transition: 'all 180ms ease',
                cursor: 'pointer',
              }}
            >
              <PresetGlyph kind={g} size={48} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Footer CTA ─────────────────────────────────────────────────────
function PCFooter({ step, canAdvance, finalTemp, onNext, onSave }) {
  const isFinal = step === 3;
  const labels = ['Continue', 'Continue', 'Continue', 'Save preset'];
  return (
    <div style={{
      padding: '12px 22px 22px',
      borderTop: '0.5px solid rgba(255,240,220,0.05)',
      background: 'linear-gradient(180deg, transparent, oklch(0.06 0.005 50))',
    }}>
      <button
        onClick={isFinal ? onSave : onNext}
        disabled={!canAdvance}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 14,
          background: canAdvance
            ? 'linear-gradient(180deg, oklch(0.62 0.14 55), oklch(0.45 0.10 50))'
            : 'oklch(0.13 0.012 50)',
          color: canAdvance ? '#fff' : 'var(--bone-35)',
          fontSize: 14, fontWeight: 500, letterSpacing: '0.02em',
          boxShadow: canAdvance
            ? 'inset 0 0.5px 0 rgba(255,255,255,0.25), 0 8px 24px oklch(0.55 0.10 55 / 0.35)'
            : 'inset 0 0 0 0.5px rgba(255,240,220,0.06)',
          transition: 'all 200ms ease',
          cursor: canAdvance ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {labels[step]}
        {!isFinal && canAdvance && (
          <svg width="11" height="11" viewBox="0 0 12 12">
            <path d="M2 6h8 M7 2 L11 6 L7 10" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}

Object.assign(window, { PresetCreate, BANGERS, EXTRACTS, STRAIN_LIBRARY });
