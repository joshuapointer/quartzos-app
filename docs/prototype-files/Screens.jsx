// Screens.jsx — Quartzie screens (Session / Presets / History / Configure)

// ─── Session screen ────────────────────────────────────────────────
function SessionScreen({ state = 'idle', temp = 0, sessionTime = '0:00', peak = 0, unit = '°F', presetName = 'Quartz Recommended', presetDab = 550, targetMin = 530, targetMax = 570 }) {
  // progress around the dial — relative to 700°F max
  const progress = Math.max(0, Math.min(1, temp / 700));

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      paddingTop: 8,
    }}>
      <QWordmark />

      {/* Dial centerpiece */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: -20,
      }}>
        <TempDial
          temp={temp}
          state={state}
          unit={unit}
          size={310}
          targetMin={targetMin}
          targetMax={targetMax}
          progress={progress}
        />
      </div>

      {/* Session strip */}
      <div style={{ padding: '0 22px' }}>
        <div className="hairline" style={{ marginBottom: 18 }} />

        {/* metrics row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 4,
        }}>
          <Metric label="SESSION" value={sessionTime} />
          <Metric label="PEAK" value={`${peak}°`} highlight={state === 'target' || state === 'cooling'} />
          <Metric label="WINDOW" value={`${targetMin}–${targetMax}`} />
        </div>

        {/* preset bar */}
        <div style={{
          marginTop: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderRadius: 18,
          background: 'linear-gradient(180deg, oklch(0.13 0.012 50), oklch(0.08 0.008 50))',
          boxShadow: 'inset 0 0.5px 0 rgba(255,240,220,0.06), 0 1px 0 rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PresetGlyph kind="quartz" size={28} />
            <div>
              <div className="eyebrow" style={{ fontSize: 9, marginBottom: 2 }}>PRESET</div>
              <div style={{ fontSize: 14, color: 'var(--bone-90)', fontWeight: 500 }}>
                {presetName} · <span className="mono" style={{ fontSize: 13, color: 'oklch(0.78 0.18 55)' }}>{presetDab}°</span>
              </div>
            </div>
          </div>
          <button style={{
            fontSize: 11, color: 'var(--bone-50)', letterSpacing: '0.08em',
            textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            Change
            <svg width="6" height="10" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* spacer for tab bar */}
      <div style={{ height: 110 }} />

      <QTabBar active="session" />
    </div>
  );
}

function Metric({ label, value, highlight = false }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 4, minWidth: 0,
    }}>
      <div className="serif" style={{
        fontSize: 22, lineHeight: 1, fontWeight: 400,
        color: highlight ? 'oklch(0.78 0.18 55)' : 'var(--bone-90)',
        letterSpacing: '-0.02em', whiteSpace: 'nowrap',
      }}>{value}</div>
      <div className="eyebrow" style={{ fontSize: 9, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

// Glyph for preset cards — simple shape, no emoji/cannabis iconography
function PresetGlyph({ kind = 'quartz', size = 44 }) {
  const palettes = {
    quartz:  { bg: 'oklch(0.16 0.04 50)',   ring: 'oklch(0.72 0.19 50)',  glyph: 'oklch(0.80 0.20 55)' },
    opaque:  { bg: 'oklch(0.16 0.03 240)',  ring: 'oklch(0.55 0.06 240)', glyph: 'oklch(0.78 0.08 240)' },
    custom:  { bg: 'oklch(0.16 0.03 80)',   ring: 'oklch(0.62 0.10 80)',  glyph: 'oklch(0.78 0.12 80)' },
    low:     { bg: 'oklch(0.16 0.03 220)',  ring: 'oklch(0.55 0.06 220)', glyph: 'oklch(0.74 0.07 220)' },
  };
  const p = palettes[kind] || palettes.quartz;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.30,
      background: `radial-gradient(circle at 30% 25%, ${p.bg}, oklch(0.08 0.02 240))`,
      boxShadow: `inset 0 0 0 0.5px ${p.ring}, inset 0 1px 0 rgba(220, 230, 245, 0.08), 0 0 12px ${kind === 'quartz' ? 'oklch(0.62 0.20 50 / 0.30)' : 'transparent'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {/* simple sigil — diamond / square / triangle / circle */}
      {kind === 'quartz' && (
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 20 20">
          <path d="M10 2 L18 10 L10 18 L2 10 Z" fill={p.glyph} opacity="0.95" />
          <path d="M10 2 L14 10 L10 18 L6 10 Z" fill="rgba(0,0,0,0.25)" />
        </svg>
      )}
      {kind === 'opaque' && (
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" fill={p.glyph} opacity="0.9" />
          <circle cx="10" cy="10" r="3.5" fill="rgba(0,0,0,0.3)" />
        </svg>
      )}
      {kind === 'custom' && (
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 20 20">
          <path d="M10 2 L18 16 L2 16 Z" fill={p.glyph} opacity="0.9" />
        </svg>
      )}
      {kind === 'low' && (
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 20 20">
          <rect x="3" y="3" width="14" height="14" rx="2" fill={p.glyph} opacity="0.9" transform="rotate(45 10 10)" />
        </svg>
      )}
    </div>
  );
}

// ─── Presets screen ────────────────────────────────────────────────
function PresetsScreen({ activePresetId = 'quartz' }) {
  const presets = [
    { id: 'quartz',  name: 'Quartz Recommended', kind: 'quartz', dab: 550, dunk: 250, builtin: true, desc: 'For traditional banger setups.' },
    { id: 'opaque',  name: 'Opaque Recommended', kind: 'opaque', dab: 530, dunk: 275, builtin: true, desc: 'For thicker thermal banger walls.' },
    { id: 'low',     name: 'Low & Slow',         kind: 'low',    dab: 480, dunk: 230, builtin: false, desc: 'Terpene-forward sipping temps.' },
    { id: 'custom',  name: 'Friday Setup',       kind: 'custom', dab: 565, dunk: 260, builtin: false, desc: 'Last edited 2 days ago.' },
  ];

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      paddingTop: 8,
    }}>
      <QWordmark />

      <div style={{ padding: '20px 22px 12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 className="serif" style={{
          margin: 0, fontSize: 32, fontWeight: 400,
          letterSpacing: '-0.02em', color: 'var(--bone-100)',
        }}>Presets</h1>
        <button style={{
          fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase',
          color: 'oklch(0.78 0.18 55)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1, marginTop: -1 }}>+</span> New
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 22px 130px' }} className="no-scrollbar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {presets.map(p => (
            <PresetCard key={p.id} preset={p} active={p.id === activePresetId} />
          ))}
        </div>
      </div>

      <QTabBar active="presets" />
    </div>
  );
}

function PresetCard({ preset, active = false }) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 22,
      padding: 18,
      background: active
        ? 'linear-gradient(180deg, oklch(0.16 0.02 50), oklch(0.10 0.012 50))'
        : 'linear-gradient(180deg, oklch(0.11 0.01 50), oklch(0.075 0.008 50))',
      boxShadow: active
        ? 'inset 0 0 0 0.5px oklch(0.55 0.10 55 / 0.6), inset 0 0.5px 0 rgba(255,240,220,0.08), 0 0 30px oklch(0.55 0.10 55 / 0.15)'
        : 'inset 0 0.5px 0 rgba(255,240,220,0.05), inset 0 0 0 0.5px rgba(255,240,220,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <PresetGlyph kind={preset.kind} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{
              margin: 0, fontSize: 16, fontWeight: 500,
              color: 'var(--bone-100)', letterSpacing: '-0.01em',
            }}>{preset.name}</h3>
            {preset.builtin && (
              <span className="mono" style={{
                fontSize: 8.5, letterSpacing: '0.14em',
                color: 'var(--bone-50)',
                padding: '2px 6px', borderRadius: 4,
                background: 'rgba(255, 240, 220, 0.05)',
              }}>BUILT-IN</span>
            )}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--bone-50)', lineHeight: 1.4,
            marginBottom: 10,
          }}>{preset.desc}</div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <TempPill label="DAB" temp={preset.dab} accent="ember" />
            <TempPill label="DUNK" temp={preset.dunk} accent="quartz" />
          </div>
        </div>
        {active ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 9px', borderRadius: 100,
            background: 'oklch(0.55 0.10 55 / 0.18)',
            boxShadow: 'inset 0 0 0 0.5px oklch(0.78 0.18 55 / 0.4)',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'oklch(0.78 0.18 55)',
              boxShadow: '0 0 4px oklch(0.78 0.18 55 / 0.8)',
            }} />
            <span className="mono" style={{
              fontSize: 9, letterSpacing: '0.14em', color: 'oklch(0.85 0.10 55)',
            }}>ACTIVE</span>
          </div>
        ) : (
          <button style={{
            fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase',
            color: 'var(--bone-70)',
            padding: '6px 10px', borderRadius: 100,
            background: 'rgba(255,240,220,0.04)',
            boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.08)',
          }}>Apply</button>
        )}
      </div>
    </div>
  );
}

function TempPill({ label, temp, accent = 'ember' }) {
  const color = accent === 'ember' ? 'oklch(0.80 0.20 55)' : 'oklch(0.78 0.08 240)';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span className="eyebrow" style={{ fontSize: 9 }}>{label}</span>
      <span className="mono" style={{
        fontSize: 14, color, fontWeight: 500,
        textShadow: accent === 'ember' ? '0 0 12px oklch(0.72 0.20 50 / 0.40)' : 'none',
      }}>{temp}°</span>
    </div>
  );
}

window.SessionScreen = SessionScreen;
window.PresetsScreen = PresetsScreen;
window.PresetCard = PresetCard;
window.PresetGlyph = PresetGlyph;
window.Metric = Metric;
window.TempPill = TempPill;
