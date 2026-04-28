// Chrome.jsx — Quartzie-themed app shell pieces

// Cool-tinted status bar (matches navy + bone-100 palette)
function QStatusBar({ time = '9:41' }) {
  const c = '#f4f6fa';
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '21px 36px 0',
      pointerEvents: 'none',
    }}>
      <span style={{
        fontFamily: '-apple-system, "SF Pro", system-ui',
        fontWeight: 600, fontSize: 17, lineHeight: '22px', color: c,
      }}>{time}</span>
      <div style={{ width: 126 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 1 }}>
        <svg width="18" height="11" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c}/>
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c}/>
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c}/>
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c}/>
        </svg>
        <svg width="16" height="11" viewBox="0 0 17 12">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill={c}/>
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill={c}/>
          <circle cx="8.5" cy="10.5" r="1.5" fill={c}/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.4" fill="none"/>
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c}/>
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

// Wordmark — modern geometric sans, set TIGHT and bold (matches QuartzOS marketing).
// Right side renders EITHER the connected status pill (when not interactive)
// OR a Disconnect button (when `onDisconnect` is provided). They never stack.
function QWordmark({ connected = true, label = 'CONNECTED', dotColor = 'oklch(0.78 0.20 55)', onDisconnect = null }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 22px 0',
    }}>
      <div style={{
        fontFamily: 'var(--sans)', fontWeight: 700,
        fontSize: 19, color: 'var(--bone-100)',
        letterSpacing: '-0.025em',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {/* tiny app-icon glyph: refractive quartz sphere */}
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: `
            radial-gradient(circle at 32% 26%, rgba(255,255,255,0.40), transparent 36%),
            radial-gradient(circle at 65% 75%, oklch(0.78 0.20 55) 0%, oklch(0.42 0.16 40) 50%, #02060e 100%)
          `,
          boxShadow: 'inset 0 0.5px 0 rgba(255, 240, 220, 0.40), inset 0 0 0 0.5px oklch(0.78 0.20 55 / 0.30), 0 0 14px oklch(0.72 0.20 50 / 0.55), 0 0 28px oklch(0.62 0.20 50 / 0.20)',
          flexShrink: 0,
        }} />
        Quartzie
      </div>
      {onDisconnect ? (
        <button onClick={onDisconnect} style={{
          fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--bone-50)', fontFamily: 'var(--mono)',
          padding: '4px 10px', borderRadius: 100,
          boxShadow: 'inset 0 0 0 0.5px rgba(180, 200, 230, 0.10)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 8px ${dotColor}`,
          }} />
          Disconnect
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: connected ? dotColor : 'var(--bone-35)',
              boxShadow: connected ? `0 0 8px ${dotColor}` : 'none',
              transition: 'background 400ms ease, box-shadow 400ms ease',
          }} />
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--bone-50)' }}>
            {connected ? label : 'OFFLINE'}
          </span>
        </div>
      )}
    </div>
  );
}

// Bottom tab nav — three tabs as a thin pill
function QTabBar({ active = 'session', onChange = () => {} }) {
  const tabs = [
    { id: 'session', label: 'Session' },
    { id: 'presets', label: 'Presets' },
    { id: 'history', label: 'History' },
    { id: 'configure', label: 'Configure' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 28, left: 16, right: 16, zIndex: 30,
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex', gap: 2, padding: 4,
        borderRadius: 100,
        background: 'rgba(12, 26, 48, 0.72)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        boxShadow: `
          inset 0 0.5px 0 rgba(180, 200, 230, 0.10),
          inset 0 -0.5px 0 rgba(0,0,0,0.4),
          0 8px 24px rgba(0,0,0,0.5),
          0 0 0 0.5px rgba(180, 200, 230, 0.08)
        `,
      }}>
        {tabs.map(t => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              style={{
                padding: '10px 16px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: isActive ? 500 : 400,
                letterSpacing: '0.04em',
                color: isActive ? 'var(--bone-100)' : 'var(--bone-50)',
                background: isActive
                  ? 'linear-gradient(180deg, oklch(0.28 0.04 240), oklch(0.18 0.03 240))'
                  : 'transparent',
                boxShadow: isActive
                  ? 'inset 0 0.5px 0 rgba(180, 200, 230, 0.18), 0 1px 2px rgba(0,0,0,0.4)'
                  : 'none',
                transition: 'all 200ms ease',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Home indicator (light)
function QHomeIndicator() {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
      height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      paddingBottom: 8, pointerEvents: 'none',
    }}>
      <div style={{
        width: 139, height: 5, borderRadius: 100,
        background: 'rgba(244, 246, 250, 0.4)',
      }} />
    </div>
  );
}

// Phone shell — wraps content, no built-in nav
function QPhone({ children, width = 390, height = 844 }) {
  return (
    <div style={{
      width, height, borderRadius: 54, overflow: 'hidden',
      position: 'relative',
      background: 'var(--navy-1)',
      boxShadow: `
        0 50px 100px rgba(0,0,0,0.55),
        0 0 0 1.5px #16243a,
        0 0 0 2px rgba(0,0,0,0.85),
        0 0 0 8px #081224,
        0 0 0 9.5px #1a3052
      `,
      fontFamily: 'var(--sans)',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50,
      }} />
      <QStatusBar />
      <div style={{
        position: 'absolute', inset: 0,
        paddingTop: 54,
      }} className="no-scrollbar">
        {children}
      </div>
      <QHomeIndicator />
    </div>
  );
}

window.QPhone = QPhone;
window.QStatusBar = QStatusBar;
window.QWordmark = QWordmark;
window.QTabBar = QTabBar;
window.QHomeIndicator = QHomeIndicator;
