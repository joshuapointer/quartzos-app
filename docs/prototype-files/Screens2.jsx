// Screens2.jsx — History + Configure screens

// ─── History screen ────────────────────────────────────────────────
function HistoryScreen() {
  const sessions = [
    { id: 1, date: 'TODAY · 22:07', duration: '4:18', peak: 552, target: 550, kind: 'quartz', curve: [0,40,140,280,420,520,548,552,550,540,510,470,420,360,300,240,180,140,110,90] },
    { id: 2, date: 'TODAY · 19:42', duration: '3:52', peak: 568, target: 565, kind: 'custom', curve: [0,60,180,320,470,560,568,565,558,540,500,450,380,310,250,200,160,130] },
    { id: 3, date: 'YESTERDAY · 23:14', duration: '5:01', peak: 545, target: 550, kind: 'quartz', curve: [0,30,120,260,400,500,540,545,540,530,500,460,410,350,290,230,180,140,110,95,80,70] },
    { id: 4, date: 'YESTERDAY · 20:50', duration: '4:35', peak: 528, target: 530, kind: 'opaque', curve: [0,40,150,290,420,500,525,528,525,515,490,450,400,340,280,220,170,135,105,85] },
    { id: 5, date: 'APR 23 · 22:38', duration: '6:12', peak: 482, target: 480, kind: 'low', curve: [0,30,110,230,350,440,475,482,480,470,450,420,380,330,280,230,190,160,130,110,95,82,72,65] },
  ];

  const [filter, setFilter] = React.useState('all');

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      paddingTop: 8,
    }}>
      <QWordmark />

      <div style={{ padding: '20px 22px 8px' }}>
        <h1 className="serif" style={{
          margin: 0, fontSize: 32, fontWeight: 400,
          letterSpacing: '-0.02em', color: 'var(--bone-100)',
        }}>History</h1>
        <div style={{
          marginTop: 4, fontSize: 12, color: 'var(--bone-50)',
        }}>
          <span className="mono">{sessions.length}</span> sessions · last 7 days
        </div>
      </div>

      {/* filter chips */}
      <div style={{
        display: 'flex', gap: 6, padding: '14px 22px 12px',
        overflowX: 'auto',
      }} className="no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'high', label: 'High · 540°+' },
          { id: 'mid', label: 'Mid · 500–540°' },
          { id: 'low', label: 'Low · <500°' },
        ].map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            style={{
              padding: '7px 13px',
              borderRadius: 100,
              fontSize: 11, letterSpacing: '0.04em',
              color: filter === c.id ? 'var(--bone-100)' : 'var(--bone-50)',
              background: filter === c.id ? 'oklch(0.18 0.02 50)' : 'transparent',
              boxShadow: filter === c.id
                ? 'inset 0 0 0 0.5px oklch(0.55 0.10 55 / 0.5), inset 0 0.5px 0 rgba(255,240,220,0.06)'
                : 'inset 0 0 0 0.5px rgba(255,240,220,0.08)',
              flexShrink: 0,
            }}
          >{c.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 22px 130px' }} className="no-scrollbar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map(s => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      </div>

      <QTabBar active="history" />
    </div>
  );
}

function SessionCard({ session }) {
  const targetMatched = Math.abs(session.peak - session.target) <= 5;
  return (
    <div style={{
      borderRadius: 18,
      padding: '14px 16px 12px',
      background: 'linear-gradient(180deg, oklch(0.10 0.01 50), oklch(0.075 0.008 50))',
      boxShadow: 'inset 0 0.5px 0 rgba(255,240,220,0.05), inset 0 0 0 0.5px rgba(255,240,220,0.03)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div className="mono" style={{
            fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--bone-35)',
          }}>{session.date}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span className="serif" style={{
              fontSize: 24, lineHeight: 1, color: 'var(--bone-100)',
              letterSpacing: '-0.02em',
            }}>{session.peak}<span style={{ fontSize: 14, opacity: 0.5 }}>°</span></span>
            <span style={{ fontSize: 11, color: 'var(--bone-50)' }}>peak</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{
            fontSize: 13, color: 'var(--bone-90)', fontWeight: 500,
          }}>{session.duration}</div>
          <div className="eyebrow" style={{ fontSize: 9, marginTop: 2 }}>{session.kind.toUpperCase()}</div>
        </div>
      </div>
      {/* waveform */}
      <Waveform data={session.curve} target={session.target} matched={targetMatched} />
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 6,
        fontSize: 10, color: 'var(--bone-35)',
      }}>
        <span className="mono">0:00</span>
        <span className="mono">{session.duration}</span>
      </div>
    </div>
  );
}

function Waveform({ data = [], target = 550, matched = false }) {
  const w = 320;
  const h = 50;
  const max = 700;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  const targetY = h - (target / max) * h;
  const accent = matched ? 'oklch(0.78 0.18 55)' : 'oklch(0.65 0.10 55)';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 50, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`wf-fill-${target}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* target line */}
      <line x1="0" y1={targetY} x2={w} y2={targetY} stroke="rgba(255, 240, 220, 0.12)" strokeWidth="0.5" strokeDasharray="2 3" />
      {/* fill */}
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#wf-fill-${target})`} />
      {/* line */}
      <polyline points={points} fill="none" stroke={accent} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Configure screen ──────────────────────────────────────────────
function ConfigureScreen() {
  const [dabAlarm, setDabAlarm] = React.useState(550);
  const [dunkAlarm, setDunkAlarm] = React.useState(250);
  const [unitC, setUnitC] = React.useState(false);
  const [opaque, setOpaque] = React.useState(false);
  const [sound, setSound] = React.useState(true);
  const [light, setLight] = React.useState(true);
  const [led, setLed] = React.useState(true);
  const [night, setNight] = React.useState(false);

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      paddingTop: 8,
    }}>
      <QWordmark />

      <div style={{ padding: '20px 22px 12px' }}>
        <h1 className="serif" style={{
          margin: 0, fontSize: 32, fontWeight: 400,
          letterSpacing: '-0.02em', color: 'var(--bone-100)',
        }}>Configure</h1>
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--bone-50)' }}>
          <span style={{ color: 'oklch(0.78 0.18 55)' }}>●</span> Dab Rite PRO · <span className="mono">v2.2</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 22px 130px' }} className="no-scrollbar">
        {/* Temperatures */}
        <ConfigSection title="Thresholds">
          <TempSlider label="Dab alarm" value={dabAlarm} min={400} max={700} accent="ember" onChange={setDabAlarm} />
          <div style={{ height: 14 }} />
          <TempSlider label="Dunk alarm" value={dunkAlarm} min={150} max={400} accent="quartz" onChange={setDunkAlarm} />
          <div style={{ height: 18 }} />
          <ConfigRow label="Display in °C">
            <Toggle on={unitC} onChange={() => setUnitC(!unitC)} />
          </ConfigRow>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <DefaultButton label="Quartz defaults" onClick={() => { setDabAlarm(550); setDunkAlarm(250); }} />
            <DefaultButton label="Opaque defaults" onClick={() => { setDabAlarm(530); setDunkAlarm(275); }} />
          </div>
        </ConfigSection>

        {/* Device */}
        <ConfigSection title="Device">
          <ConfigRow label="Opaque mode" sub="For thick-walled bangers"><Toggle on={opaque} onChange={() => setOpaque(!opaque)} /></ConfigRow>
          <Divider />
          <ConfigRow label="Sound alert"><Toggle on={sound} onChange={() => setSound(!sound)} /></ConfigRow>
          <Divider />
          <ConfigRow label="Light alert"><Toggle on={light} onChange={() => setLight(!light)} /></ConfigRow>
          <Divider />
          <ConfigRow label="LED guide"><Toggle on={led} onChange={() => setLed(!led)} /></ConfigRow>
          <Divider />
          <ConfigRow label="Night mode" sub="Dim display & soften alerts"><Toggle on={night} onChange={() => setNight(!night)} /></ConfigRow>
        </ConfigSection>

        {/* Sound */}
        <ConfigSection title="Sound">
          <ConfigRow label="Volume" detail="Level 3">
            <div style={{ width: 90 }}>
              <SimpleSlider value={3} max={5} />
            </div>
          </ConfigRow>
          <Divider />
          <SoundRow label="Key tone" options={['None', 'Arcade', 'Calypso', 'Classic']} active="None" />
          <Divider />
          <SoundRow label="Dab sound" options={['—', 'Cloud9', 'Codex', 'Excalibur']} active="Cloud9" />
          <Divider />
          <SoundRow label="Dunk sound" options={['—', 'Blocks', 'Codex', 'Excalibur']} active="Blocks" />
        </ConfigSection>

        {/* Appearance */}
        <ConfigSection title="Appearance">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <ThemeSwatch name="Warm Mineral" pal={['#1a1410', '#3a2818', 'oklch(0.72 0.10 65)']} />
            <ThemeSwatch name="Smoke" pal={['#0d0d12', '#1a1722', 'oklch(0.65 0.08 280)']} />
            <ThemeSwatch name="Cool Shell" pal={['#0a0d12', '#162028', 'oklch(0.78 0.07 240)']} active />
          </div>
        </ConfigSection>

        {/* Save bar */}
        <div style={{
          marginTop: 18,
          display: 'flex', gap: 10, alignItems: 'center',
          padding: '14px 16px',
          borderRadius: 18,
          background: 'linear-gradient(180deg, oklch(0.13 0.02 50), oklch(0.08 0.012 50))',
          boxShadow: 'inset 0 0.5px 0 rgba(255,240,220,0.06)',
        }}>
          <button style={{
            flex: 1,
            padding: '13px 0',
            borderRadius: 12,
            background: 'linear-gradient(180deg, oklch(0.55 0.10 55), oklch(0.45 0.08 50))',
            color: '#fff',
            fontSize: 13, fontWeight: 500, letterSpacing: '0.03em',
            boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.2), 0 4px 12px oklch(0.55 0.10 55 / 0.3)',
          }}>Save to device</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="oklch(0.78 0.12 150)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.10em', color: 'oklch(0.72 0.10 150)' }}>SYNCED</span>
          </div>
        </div>
      </div>

      <QTabBar active="configure" />
    </div>
  );
}

function ConfigSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="eyebrow" style={{
        marginBottom: 10, paddingLeft: 4,
      }}>{title}</div>
      <div style={{
        borderRadius: 20,
        padding: '16px',
        background: 'linear-gradient(180deg, oklch(0.10 0.01 50), oklch(0.075 0.008 50))',
        boxShadow: 'inset 0 0.5px 0 rgba(255,240,220,0.05), inset 0 0 0 0.5px rgba(255,240,220,0.03)',
      }}>{children}</div>
    </div>
  );
}

function ConfigRow({ label, sub, detail, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, minHeight: 36,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: 'var(--bone-90)', fontWeight: 400, whiteSpace: 'nowrap' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--bone-35)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {detail && <span className="mono" style={{ fontSize: 12, color: 'var(--bone-50)' }}>{detail}</span>}
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 0.5, background: 'rgba(255, 240, 220, 0.06)', margin: '12px 0' }} />;
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange} style={{
      width: 42, height: 25, borderRadius: 100,
      background: on ? 'oklch(0.55 0.10 55)' : 'oklch(0.18 0.01 50)',
      boxShadow: on
        ? 'inset 0 0.5px 0 rgba(255,240,220,0.15), 0 0 12px oklch(0.55 0.10 55 / 0.4)'
        : 'inset 0 0.5px 1px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(255,240,220,0.06)',
      position: 'relative',
      transition: 'background 200ms ease',
    }}>
      <div style={{
        position: 'absolute', top: 2.5, left: on ? 19 : 2.5,
        width: 20, height: 20, borderRadius: '50%',
        background: 'linear-gradient(180deg, #f4ede4, #d8cfc2)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.6)',
        transition: 'left 200ms ease',
      }} />
    </button>
  );
}

function TempSlider({ label, value, min, max, accent = 'ember', onChange }) {
  const pct = (value - min) / (max - min);
  const color = accent === 'ember' ? 'oklch(0.78 0.18 55)' : 'oklch(0.78 0.08 240)';
  const trackGrad = accent === 'ember'
    ? 'linear-gradient(90deg, oklch(0.55 0.10 55 / 0.3), oklch(0.78 0.18 55))'
    : 'linear-gradient(90deg, oklch(0.55 0.06 240 / 0.3), oklch(0.78 0.08 240))';
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 8,
      }}>
        <span className="eyebrow" style={{ fontSize: 9.5 }}>{label}</span>
        <span className="mono" style={{ fontSize: 16, color, fontWeight: 500 }}>{value}°F</span>
      </div>
      <div
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const handler = (ev) => {
            const x = (ev.clientX - rect.left) / rect.width;
            onChange(Math.round(min + Math.max(0, Math.min(1, x)) * (max - min)));
          };
          handler(e);
          const up = () => { window.removeEventListener('mousemove', handler); window.removeEventListener('mouseup', up); };
          window.addEventListener('mousemove', handler);
          window.addEventListener('mouseup', up);
        }}
        style={{
          position: 'relative', height: 6, borderRadius: 100, cursor: 'pointer',
          background: 'rgba(0,0,0,0.5)',
          boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct * 100}%`, borderRadius: 100,
          background: trackGrad,
          boxShadow: `0 0 8px ${color}`,
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${pct * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: 18, height: 18, borderRadius: '50%',
          background: 'linear-gradient(180deg, #f4ede4, #c8bfb2)',
          boxShadow: `0 2px 6px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.7), 0 0 12px ${color}`,
        }} />
      </div>
    </div>
  );
}

function SimpleSlider({ value, max }) {
  const pct = value / max;
  return (
    <div style={{
      position: 'relative', height: 4, borderRadius: 100,
      background: 'rgba(0,0,0,0.5)',
      boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct * 100}%`, borderRadius: 100,
        background: 'oklch(0.78 0.18 55)',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: `${pct * 100}%`,
        transform: 'translate(-50%, -50%)',
        width: 14, height: 14, borderRadius: '50%',
        background: 'linear-gradient(180deg, #f4ede4, #c8bfb2)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
      }} />
    </div>
  );
}

function DefaultButton({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1,
      padding: '10px 10px',
      borderRadius: 12,
      fontSize: 11.5, letterSpacing: '0.04em',
      color: 'var(--bone-90)',
      background: 'rgba(255,240,220,0.04)',
      boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.10), inset 0 0.5px 0 rgba(255,240,220,0.06)',
    }}>{label}</button>
  );
}

function SoundRow({ label, options, active }) {
  return (
    <div>
      <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, overflow: 'auto' }} className="no-scrollbar">
        {options.map(o => (
          <div key={o} style={{
            padding: '6px 11px',
            borderRadius: 100,
            fontSize: 11, letterSpacing: '0.02em',
            color: o === active ? 'var(--bone-100)' : 'var(--bone-50)',
            background: o === active ? 'oklch(0.18 0.02 50)' : 'transparent',
            boxShadow: o === active
              ? 'inset 0 0 0 0.5px oklch(0.55 0.10 55 / 0.5)'
              : 'inset 0 0 0 0.5px rgba(255,240,220,0.08)',
            flexShrink: 0,
          }}>{o}</div>
        ))}
      </div>
    </div>
  );
}

function ThemeSwatch({ name, pal, active = false }) {
  return (
    <div style={{
      borderRadius: 14,
      padding: 8,
      background: pal[0],
      boxShadow: active
        ? 'inset 0 0 0 0.5px oklch(0.55 0.10 55 / 0.5), 0 0 16px oklch(0.55 0.10 55 / 0.2)'
        : 'inset 0 0 0 0.5px rgba(255,240,220,0.06)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        position: 'relative',
        height: 56, borderRadius: 8,
        background: `radial-gradient(circle at 60% 40%, ${pal[2]} 0%, ${pal[1]} 35%, ${pal[0]} 80%)`,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 8, left: 8,
          width: 8, height: 8, borderRadius: '50%',
          background: pal[2], opacity: 0.7,
        }} />
      </div>
      <div className="mono" style={{
        fontSize: 8.5, letterSpacing: '0.12em', color: active ? 'var(--bone-90)' : 'var(--bone-50)',
        textTransform: 'uppercase',
      }}>{name}</div>
    </div>
  );
}

window.HistoryScreen = HistoryScreen;
window.ConfigureScreen = ConfigureScreen;
window.SessionCard = SessionCard;
window.Waveform = Waveform;
