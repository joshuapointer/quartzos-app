// Dial.jsx — Quartzie refractive quartz orb
// A hand-blown glass object with caustics, multi-layer refraction, and emissive heat.
// States: idle | heating | target | cooling | dunk

const DIAL_PALETTE = {
  idle:    { core: 'oklch(0.32 0.06 240)',  glow: 'oklch(0.45 0.10 240 / 0.45)', ring: 'oklch(0.55 0.04 240)',  text: 'var(--bone-90)',  hue: 240 },
  heating: { core: 'oklch(0.55 0.20 50)',   glow: 'oklch(0.62 0.22 50 / 0.85)',  ring: 'oklch(0.78 0.20 55)',   text: '#fff5e8',         hue: 50 },
  target:  { core: 'oklch(0.68 0.22 55)',   glow: 'oklch(0.78 0.24 55 / 0.95)',  ring: 'oklch(0.86 0.22 60)',   text: '#fff5e8',         hue: 55 },
  cooling: { core: 'oklch(0.45 0.18 50)',   glow: 'oklch(0.62 0.20 50 / 0.65)',  ring: 'oklch(0.74 0.20 55)',   text: 'var(--bone-90)',  hue: 50 },
  dunk:    { core: 'oklch(0.40 0.10 240)',  glow: 'oklch(0.62 0.10 240 / 0.55)', ring: 'oklch(0.78 0.08 240)',  text: '#e6effa',         hue: 240 },
};

function TempDial({
  temp = 0,
  state = 'idle',
  unit = '°F',
  size = 320,
  targetMin = 530,
  targetMax = 570,
  progress = 0,
  noReading = false,
  estimated = false,
  countdown = null,
}) {
  const p = DIAL_PALETTE[state];
  const tempStr = noReading ? '——' : String(Math.round(temp));
  const numSize = tempStr.length >= 3 ? size * 0.42 : size * 0.50;

  // Ring geometry
  const r = size * 0.46;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, progress)) * circumference;

  // Unique IDs for SVG defs (avoid collisions if multiple orbs ever mount)
  const uid = React.useMemo(() => 'orb-' + Math.random().toString(36).slice(2, 8), []);

  return (
    <div style={{
      width: size, height: size, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      // Faint rotation of the whole orb for "alive" feel
      animation: 'q-orb-breathe 7s ease-in-out infinite',
    }}>
      {/* ─── Far ambient bloom — heat radiating into the room ─── */}
      <div style={{
        position: 'absolute', inset: -size * 0.55,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p.glow}, transparent 62%)`,
        filter: 'blur(40px)',
        opacity: state === 'idle' ? 0.35 : 0.95,
        transition: 'all 900ms cubic-bezier(.22,1,.36,1)',
        pointerEvents: 'none',
        animation: state === 'heating' || state === 'target' ? 'q-orb-pulse 2.4s ease-in-out infinite' : 'none',
      }} />

      {/* ─── Mid bloom — closer hot halo ─── */}
      <div style={{
        position: 'absolute', inset: -size * 0.20,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p.glow}, transparent 55%)`,
        filter: 'blur(18px)',
        opacity: state === 'idle' ? 0.5 : 1,
        mixBlendMode: 'screen',
        transition: 'all 800ms ease',
        pointerEvents: 'none',
      }} />

      {/* ─── Caustic light pattern (rotates slowly) ─── */}
      <svg
        width={size * 1.4} height={size * 1.4}
        viewBox="0 0 400 400"
        style={{
          position: 'absolute',
          opacity: state === 'idle' ? 0.10 : 0.30,
          mixBlendMode: 'screen',
          transition: 'opacity 1s ease',
          animation: 'q-caustic-rotate 22s linear infinite',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <radialGradient id={`${uid}-caustic`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.ring} stopOpacity="0.0" />
            <stop offset="40%" stopColor={p.ring} stopOpacity="0.45" />
            <stop offset="60%" stopColor={p.ring} stopOpacity="0.20" />
            <stop offset="100%" stopColor={p.ring} stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-caustic-blur`}>
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        <g filter={`url(#${uid}-caustic-blur)`}>
          {/* Caustic ribbons — overlapping curves that look like refracted light on glass */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <ellipse
              key={deg}
              cx="200" cy="200"
              rx={140 + (i % 2) * 18}
              ry={6 + (i % 3) * 2}
              fill="none"
              stroke={`url(#${uid}-caustic)`}
              strokeWidth="2"
              transform={`rotate(${deg} 200 200)`}
              opacity={0.6}
            />
          ))}
        </g>
      </svg>

      {/* ─── Outer hairline ring (light-catching edge) ─── */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: 'transparent',
        boxShadow: `
          0 0 0 0.5px rgba(220, 230, 245, 0.18),
          0 0 0 1.5px rgba(0, 0, 0, 0.30),
          inset 0 0.5px 0 rgba(255, 255, 255, 0.16),
          inset 0 -0.5px 0 rgba(0, 0, 0, 0.55),
          0 40px 80px rgba(0,0,0,0.55),
          0 12px 32px rgba(0,0,0,0.40)
        `,
        pointerEvents: 'none',
      }} />

      {/* ─── Glass body — multi-stop refraction gradient ─── */}
      <div style={{
        position: 'absolute', inset: 2,
        borderRadius: '50%',
        background: `
          radial-gradient(circle at 32% 22%,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(220, 230, 245, 0.06) 18%,
            transparent 38%),
          radial-gradient(circle at 65% 78%,
            ${p.core} 0%,
            oklch(0.10 0.03 ${p.hue}) 70%,
            #02060e 100%)
        `,
        boxShadow: `
          inset 0 2px 6px rgba(255, 255, 255, 0.05),
          inset 0 -8px 20px rgba(0,0,0,0.65),
          inset 0 0 24px rgba(0,0,0,0.45)
        `,
        transition: 'background 800ms ease',
      }} />

      {/* ─── Refraction streak (top highlight) ─── */}
      <div style={{
        position: 'absolute',
        top: '6%', left: '18%', right: '18%', height: '34%',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.32), rgba(255,255,255,0.06) 40%, transparent 70%)',
        filter: 'blur(6px)',
        pointerEvents: 'none',
        opacity: 0.85,
      }} />

      {/* ─── Lower refraction crescent ─── */}
      <div style={{
        position: 'absolute',
        bottom: '8%', left: '22%', right: '22%', height: '14%',
        borderRadius: '50%',
        background: `radial-gradient(ellipse at 50% 100%, ${p.glow}, transparent 70%)`,
        filter: 'blur(8px)',
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }} />

      {/* ─── Hot core — emissive center, breathes in heating/target ─── */}
      <div style={{
        position: 'absolute',
        width: size * 0.48, height: size * 0.48,
        top: '52%', left: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p.glow}, transparent 65%)`,
        filter: 'blur(14px)',
        opacity: state === 'idle' ? 0 : (state === 'target' || state === 'heating' ? 0.95 : 0.55),
        mixBlendMode: 'screen',
        transition: 'opacity 800ms ease',
        animation: state === 'target' || state === 'heating' ? 'q-orb-pulse 2s ease-in-out infinite' : 'none',
        pointerEvents: 'none',
      }} />

      {/* ─── Progress arc — etched into the glass ─── */}
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id={`${uid}-arc`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.ring} stopOpacity="1" />
            <stop offset="100%" stopColor={p.ring} stopOpacity="0.55" />
          </linearGradient>
          <filter id={`${uid}-arc-glow`}>
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>
        {/* etched track — barely-there hairline */}
        <circle
          cx={cx} cy={cy} r={r}
          stroke="rgba(220, 230, 245, 0.06)"
          strokeWidth="0.5"
          fill="none"
        />
        {estimated ? (
          <circle
            cx={cx} cy={cy} r={r}
            stroke={p.ring}
            strokeWidth={1}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`1.5 5`}
            style={{ opacity: 0.6 }}
          />
        ) : (
          <>
            {/* glow halo behind arc */}
            <circle
              cx={cx} cy={cy} r={r}
              stroke={p.ring}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${dash} ${circumference}`}
              filter={`url(#${uid}-arc-glow)`}
              style={{ opacity: 0.7, transition: 'stroke 800ms ease' }}
            />
            {/* sharp arc on top */}
            <circle
              cx={cx} cy={cy} r={r}
              stroke={`url(#${uid}-arc)`}
              strokeWidth="1.25"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: 'stroke 800ms ease, stroke-dasharray 600ms ease' }}
            />
          </>
        )}
      </svg>

      {/* ─── Etched tick marks — projected, not painted ─── */}
      <svg
        width={size} height={size}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {[0, 90, 180, 270].map((deg) => {
          const rad = (deg - 90) * Math.PI / 180;
          const r1 = size * 0.475;
          const r2 = size * 0.495;
          const x1 = cx + Math.cos(rad) * r1;
          const y1 = cy + Math.sin(rad) * r1;
          const x2 = cx + Math.cos(rad) * r2;
          const y2 = cy + Math.sin(rad) * r2;
          return (
            <line
              key={deg}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255, 255, 255, 0.28)"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>

      {/* ─── Numeric readout — projected onto the glass ─── */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textShadow: state !== 'idle' ? `0 0 24px ${p.glow}, 0 0 48px ${p.glow}` : 'none',
      }}>
        <div className="eyebrow" style={{
          marginBottom: 14,
          color: estimated ? p.ring : 'rgba(220, 230, 245, 0.55)',
          letterSpacing: '0.32em',
          fontSize: 9.5,
        }}>
          {state === 'idle' && 'STANDBY'}
          {state === 'heating' && (noReading ? 'TORCH ON' : 'HEATING')}
          {state === 'target' && 'AT TARGET'}
          {state === 'cooling' && 'DAB WINDOW'}
          {state === 'dunk' && 'DUNK READY'}
        </div>
        <div style={{
          display: 'flex', alignItems: 'baseline',
          color: p.text,
          transition: 'color 600ms ease',
          opacity: estimated ? 0.85 : 1,
          animation: estimated ? 'estimated-breathe 2.4s ease-in-out infinite' : 'none',
        }}>
          <span style={{
            fontFamily: 'var(--sans)',
            fontSize: numSize, lineHeight: 0.88, fontWeight: 300,
            letterSpacing: '-0.07em',
            fontVariantNumeric: 'lining-nums tabular-nums',
          }}>{tempStr}</span>
          <span className="mono" style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            marginLeft: 8,
            opacity: 0.55,
            alignSelf: 'flex-start',
            marginTop: 10,
            fontWeight: 500,
          }}>{unit.replace('°','')}°</span>
        </div>
        {estimated && countdown != null ? (
          <div className="mono" style={{
            marginTop: 16, fontSize: 10.5, letterSpacing: '0.24em',
            color: p.ring,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {countdown}s REMAINING
          </div>
        ) : state !== 'idle' && (
          <div className="mono" style={{
            marginTop: 16, fontSize: 9.5, letterSpacing: '0.20em',
            color: 'rgba(220, 230, 245, 0.42)',
            fontWeight: 500,
          }}>
            {targetMin}–{targetMax}{unit}
          </div>
        )}
      </div>
    </div>
  );
}

window.TempDial = TempDial;
window.DIAL_PALETTE = DIAL_PALETTE;
