// flow-shell.jsx — Quartzie single-flow shell
// Renders the persistent orb + the active stage's content, with smooth transitions.

const { useState: useStateF, useEffect: useEffectF, useRef: useRefF, useMemo: useMemoF } = React;

// ── Compute orb size/state based on stage ──
function computeOrbProps({ stage, phaseIdx, phaseProgress, targets, calibration, builderStep, banger, concentrate, windowState, windowSecondsLeft, coolTemp, heatTimeFactor, heatReason }) {
  // Accept either `targets` or `calibration` (which is the new shape from flow-app).
  if (!targets && calibration) {
    targets = { display: calibration.displayed, dunk: calibration.dunk, low: calibration.low, high: calibration.high };
  }
  targets = targets || { display: 550, dunk: 250, low: 535, high: 565 };
  if (stage === 'connect') {
    return { temp: 0, state: 'idle', size: 200, progress: 0, label: 'NO DEVICE', dimmed: true };
  }
  if (stage === 'choose') {
    return { temp: 78, state: 'idle', size: 160, progress: 0, label: 'STANDBY', dimmed: false };
  }
  if (stage === 'build') {
    // grow as user makes choices
    const sizes = [140, 150, 160, 170];
    return { temp: 78, state: 'idle', size: sizes[builderStep] || 140, progress: 0, label: 'CONFIGURING', dimmed: false };
  }
  if (stage === 'session') {
    const target = targets.display || 550;
    const dunk = targets.dunk || 250;
    // Phase order matches flow-app PHASES: heat → cool → dab → dunk → clean
    const phaseKey = ['heat','cool','dab','dunk','clean'][phaseIdx];
    if (phaseKey === 'heat') {
      // Torch timer — banger is OFF the DabRite (in user's hand getting torched).
      // Orb is a countdown ring; no IR reading.
      const factor = heatTimeFactor || 1;
      const hs = banger?.heat_seconds || [25, 35];
      const totalSec = ((hs[0] + hs[1]) / 2) * factor;
      const secLeft = Math.max(0, Math.ceil(totalSec * (1 - phaseProgress)));
      const isReheat = factor < 1;
      return {
        temp: 0, state: 'heating', size: 290,
        progress: phaseProgress, label: isReheat ? 'REHEAT · HALF TIME' : 'TORCH',
        noReading: true,
        torchSecondsLeft: secLeft,
        torchTotalSec: totalSec,
        isReheat,
        heatReason: heatReason || 'normal',
      };
    }
    if (phaseKey === 'cool') {
      // Banger is back on the DabRite. Use the live coolTemp from the
      // app-level monitor. Falls back to the deterministic curve if absent.
      const peak = target + 80;
      const floor = target - 10;
      const fallback = Math.round(peak - (peak - floor) * phaseProgress);
      const t = Math.round(coolTemp || fallback);
      const inWindow = t <= (targets.high || target + 15) && t >= (targets.low || target - 15);
      return {
        temp: t, state: 'cooling', size: 290,
        progress: t / 700,
        label: inWindow ? 'IN WINDOW · LIFT TO DAB' : 'COOLING TO TARGET',
      };
    }
    if (phaseKey === 'dab') {
      // Banger lifted off the IR — sensor sees ambient, we show DABBING.
      return { temp: 0, state: 'cooling', size: 240, progress: 0, label: 'DABBING', noReading: true, dimmed: true };
    }
    if (phaseKey === 'dunk') {
      const t = Math.round(target - (target - dunk) * phaseProgress);
      return { temp: t, state: 'dunk', size: 220, progress: t / 700, label: 'DUNK READY' };
    }
    if (phaseKey === 'clean') {
      const t = Math.round(dunk - 80 * phaseProgress);
      return { temp: Math.max(78, t), state: 'idle', size: 170, progress: 0, label: 'CLEAN UP' };
    }
  }
  if (stage === 'complete') {
    return { temp: 78, state: 'idle', size: 150, progress: 0, label: 'COMPLETE' };
  }
  return { temp: 78, state: 'idle', size: 180, progress: 0, label: 'STANDBY' };
}
window.computeOrbProps = computeOrbProps;

// ── Persistent orb with smooth size morph ──
function PersistentOrb({ orbProps, targets }) {
  const { temp, state, size, progress, label, dimmed, noReading, hidden, estimated, countdown, torchSecondsLeft, torchTotalSec, isReheat, heatReason } = orbProps;
  const targetMin = (targets && targets.low) || 530;
  const targetMax = (targets && targets.high) || 570;

  // Torch-timer mode: a glowing molten orb where the rim sweeps a countdown.
  if (torchSecondsLeft != null) {
    const hue = isReheat ? 25 : 50;
    const ringHi  = `oklch(0.86 0.20 ${hue + 5})`;
    const ringLo  = `oklch(0.55 0.20 ${hue - 5})`;
    const glow    = `oklch(0.62 0.22 ${hue} / 0.85)`;
    const coreCol = `oklch(0.50 0.20 ${hue})`;
    const eyebrowColor = ringHi;
    const eyebrow = isReheat
      ? (heatReason === 'missed' ? 'REHEAT · MISSED WINDOW' : 'REHEAT · HALF TIME')
      : 'TORCH';
    const orbSize = 300;
    return (
      <div style={{
        position: 'relative',
        transition: 'transform 700ms cubic-bezier(.22,1,.36,1), opacity 600ms ease',
        transform: `scale(${hidden ? 0 : size / 300})`,
        transformOrigin: 'center',
        opacity: hidden ? 0 : 1,
        width: orbSize, height: orbSize,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'q-orb-breathe 7s ease-in-out infinite',
      }}>
        {/* Far ambient bloom */}
        <div style={{
          position: 'absolute', inset: -orbSize * 0.55,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glow}, transparent 62%)`,
          filter: 'blur(40px)', opacity: 0.95,
          animation: 'q-orb-pulse 2.4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        {/* Mid bloom */}
        <div style={{
          position: 'absolute', inset: -orbSize * 0.20,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glow}, transparent 55%)`,
          filter: 'blur(18px)', opacity: 1,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }} />
        {/* Outer hairline */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          boxShadow: `
            0 0 0 0.5px rgba(255, 240, 220, 0.22),
            0 0 0 1.5px rgba(0, 0, 0, 0.30),
            inset 0 0.5px 0 rgba(255, 255, 255, 0.18),
            inset 0 -0.5px 0 rgba(0, 0, 0, 0.55),
            0 40px 80px rgba(0,0,0,0.55),
            0 12px 32px rgba(0,0,0,0.40)
          `,
          pointerEvents: 'none',
        }} />
        {/* Glass body — molten core */}
        <div style={{
          position: 'absolute', inset: 2,
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 32% 22%,
              rgba(255, 255, 255, 0.18) 0%,
              rgba(255, 240, 220, 0.06) 18%,
              transparent 38%),
            radial-gradient(circle at 65% 78%,
              ${coreCol} 0%,
              oklch(0.16 0.10 ${hue}) 65%,
              #0c0604 100%)
          `,
          boxShadow: `
            inset 0 2px 6px rgba(255, 255, 255, 0.05),
            inset 0 -8px 20px rgba(0,0,0,0.65),
            inset 0 0 24px rgba(0,0,0,0.45)
          `,
        }} />
        {/* Refraction streak */}
        <div style={{
          position: 'absolute',
          top: '6%', left: '18%', right: '18%', height: '34%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.32), rgba(255,255,255,0.06) 40%, transparent 70%)',
          filter: 'blur(6px)', opacity: 0.85,
          pointerEvents: 'none',
        }} />
        {/* Hot emissive core */}
        <div style={{
          position: 'absolute',
          width: orbSize * 0.48, height: orbSize * 0.48,
          top: '52%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glow}, transparent 65%)`,
          filter: 'blur(14px)',
          mixBlendMode: 'screen',
          animation: 'q-orb-pulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        {/* Countdown rim */}
        <svg width={orbSize} height={orbSize} viewBox={`0 0 ${orbSize} ${orbSize}`}
             style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
          <defs>
            <linearGradient id={`torch-${hue}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={ringHi} stopOpacity="1" />
              <stop offset="100%" stopColor={ringLo} stopOpacity="0.6" />
            </linearGradient>
            <filter id={`torch-glow-${hue}`}>
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {/* etched track */}
          <circle cx="150" cy="150" r="138" fill="none"
                  stroke="rgba(255, 240, 220, 0.06)" strokeWidth="0.5" />
          {/* glow halo behind progress */}
          <circle cx="150" cy="150" r="138" fill="none"
                  stroke={ringHi} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 138}`}
                  strokeDashoffset={`${2 * Math.PI * 138 * (1 - (progress || 0))}`}
                  filter={`url(#torch-glow-${hue})`}
                  style={{ opacity: 0.7, transition: 'stroke-dashoffset 200ms linear' }} />
          {/* sharp progress arc */}
          <circle cx="150" cy="150" r="138" fill="none"
                  stroke={`url(#torch-${hue})`} strokeWidth="1.5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 138}`}
                  strokeDashoffset={`${2 * Math.PI * 138 * (1 - (progress || 0))}`}
                  style={{ transition: 'stroke-dashoffset 200ms linear' }} />
        </svg>
        {/* etched ticks */}
        <svg width={orbSize} height={orbSize} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg - 90) * Math.PI / 180;
            const r1 = orbSize * 0.475;
            const r2 = orbSize * 0.495;
            const x1 = 150 + Math.cos(rad) * r1;
            const y1 = 150 + Math.sin(rad) * r1;
            const x2 = 150 + Math.cos(rad) * r2;
            const y2 = 150 + Math.sin(rad) * r2;
            return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                         stroke="rgba(255, 240, 220, 0.30)" strokeWidth="0.5" />;
          })}
        </svg>
        {/* projected readout */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textShadow: `0 0 28px ${glow}, 0 0 56px ${glow}`,
        }}>
          <div className="eyebrow" style={{ fontSize: 9, color: eyebrowColor, marginBottom: 8, letterSpacing: '0.32em' }}>
            {eyebrow}
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 108, fontWeight: 300, color: '#fff5e8', letterSpacing: '-0.07em', lineHeight: 0.88, fontVariantNumeric: 'tabular-nums' }}>
            {torchSecondsLeft}
          </div>
          <div className="mono" style={{ fontSize: 9.5, color: 'rgba(220, 230, 245, 0.42)', marginTop: 14, letterSpacing: '0.20em', fontWeight: 500 }}>
            SECONDS · {Math.round(torchTotalSec || 0)}s TOTAL
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      transition: 'transform 700ms cubic-bezier(.22,1,.36,1), opacity 600ms ease',
      transform: `scale(${hidden ? 0 : size / 300})`,
      transformOrigin: 'center',
      opacity: hidden ? 0 : (dimmed ? 0.35 : 1),
      filter: dimmed ? 'saturate(0.4)' : 'none',
      width: 300, height: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: hidden ? 'none' : 'auto',
    }}>
      <TempDial
        temp={temp}
        state={state}
        unit="°F"
        size={300}
        targetMin={targetMin}
        targetMax={targetMax}
        progress={progress}
        noReading={noReading}
        estimated={estimated}
        countdown={countdown}
      />
    </div>
  );
}

// ── Main shell ──
function QFlowShell(props) {
  const {
    stage, connected, connect, disconnect,
    startBuilder, applyPreset, SAVED_PRESETS, activePresetId,
    builderStep, builderNext, builderBack,
    bangerId, setBangerId, concId, setConcId, sensorId, setSensorId, wallId, setWallId,
    coldStart, setColdStart, coldStartInfo,
    banger, concentrate, sensor, wall, targets, calibration,
    phaseIdx, phaseProgress, advancePhase, liftToDab, placeBack,
    heatReason, heatTimeFactor, coolTemp, coolDropRate,
    sessionSeconds, orbProps, reset, tweaks,
  } = props;

  // The orb area collapses/expands depending on stage. We use a flex layout with
  // a top "orb cell" that grows or shrinks via flex-basis.
  const orbHeight = orbProps.size + 30;

  const stageKey = stage === 'session' ? `session-${phaseIdx}` : stage;

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      paddingTop: 8,
      overflow: 'hidden',
    }}>
      <QWordmark
        connected={connected}
        onDisconnect={connected && stage !== 'connect' ? disconnect : null}
      />

      {/* Persistent orb cell — always mounted */}
      <div style={{
        height: orbHeight,
        transition: 'height 700ms cubic-bezier(.22,1,.36,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        marginTop: stage === 'connect' ? 80 : 8,
      }}>
        <PersistentOrb orbProps={orbProps} targets={targets} />
      </div>

      {/* Stage content — animates in/out */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <StageSwitch stageKey={stageKey}>
          {stage === 'connect' && <ConnectStage connected={connected} connect={connect} />}
          {stage === 'choose' && <ChooseStage SAVED_PRESETS={SAVED_PRESETS} applyPreset={applyPreset} startBuilder={startBuilder} />}
          {stage === 'build' && (
            <BuildStage
              step={builderStep}
              bangerId={bangerId} setBangerId={setBangerId}
              concId={concId} setConcId={setConcId}
              sensorId={sensorId} setSensorId={setSensorId}
              wallId={wallId} setWallId={setWallId}
              coldStart={coldStart} setColdStart={setColdStart}
              coldStartInfo={coldStartInfo}
              banger={banger} concentrate={concentrate} sensor={sensor} wall={wall}
              calibration={calibration}
              next={builderNext} back={builderBack}
            />
          )}
          {stage === 'session' && (
            <SessionStage
              phaseIdx={phaseIdx}
              phaseProgress={phaseProgress}
              liftToDab={liftToDab}
              placeBack={placeBack}
              banger={banger} concentrate={concentrate} sensor={sensor} wall={wall}
              targets={targets}
              activePresetId={activePresetId}
              SAVED_PRESETS={SAVED_PRESETS}
              sessionSeconds={sessionSeconds}
              heatReason={heatReason}
              heatTimeFactor={heatTimeFactor}
              coolTemp={coolTemp}
              coolDropRate={coolDropRate}
            />
          )}
          {stage === 'complete' && (
            <CompleteStage sessionSeconds={sessionSeconds} targets={targets} reset={reset} />
          )}
        </StageSwitch>
      </div>
    </div>
  );
}

// ── Stage transition wrapper (cross-fade with stagger) ──
function StageSwitch({ stageKey, children }) {
  return (
    <div key={stageKey} className="q-view-enter" style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
    }}>
      {children}
    </div>
  );
}

// ─── 1. CONNECT ─────────────────────────────────────────────────
function ConnectStage({ connected, connect }) {
  const [searching, setSearching] = useStateF(false);
  return (
    <div className="q-stagger" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: '20px 28px 130px', textAlign: 'center',
    }}>
      <div style={{ '--i': 0 }} className="eyebrow">DEVICE NOT FOUND</div>
      <h1 className="display" style={{
        margin: '12px 0 8px', fontSize: 32,
        color: 'var(--bone-100)',
        '--i': 1,
      }}>
        Connect your<br/><span className="accent-amber">Dab Rite</span> to begin.
      </h1>
      <p style={{
        margin: '0 0 30px', fontSize: 13.5, color: 'var(--bone-50)',
        maxWidth: 280, lineHeight: 1.5, '--i': 2,
      }}>
        Quartzie pairs with your IR thermometer over Bluetooth. Power it on and we'll find it automatically.
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 100,
        background: 'rgba(255, 240, 220, 0.04)',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,240,220,0.08)',
        marginBottom: 24, '--i': 3,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: searching ? 'oklch(0.78 0.18 55)' : 'var(--bone-35)',
          boxShadow: searching ? '0 0 8px oklch(0.78 0.18 55 / 0.7)' : 'none',
          animation: searching ? 'q-blink 1.2s ease-in-out infinite' : 'none',
        }} />
        <span className="mono" style={{
          fontSize: 10, letterSpacing: '0.16em',
          color: searching ? 'var(--bone-90)' : 'var(--bone-50)',
        }}>{searching ? 'SCANNING…' : 'AWAITING DEVICE'}</span>
      </div>

      <button onClick={() => { setSearching(true); setTimeout(connect, 1400); }}
        disabled={searching}
        className={searching ? 'q-action q-action--ghost' : 'q-action'}
        style={{ '--i': 4 }}>
        {searching ? 'Searching for Dab Rite…' : 'Connect Dab Rite'}
      </button>

      <div className="mono" style={{
        marginTop: 22, fontSize: 9.5, letterSpacing: '0.18em', color: 'var(--bone-35)',
        '--i': 5,
      }}>NO ADVANCE WITHOUT A DEVICE</div>
      <style>{`
        @keyframes q-blink { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
      `}</style>
    </div>
  );
}

// ─── 2. CHOOSE — start a session ───────────────────────────────
function ChooseStage({ SAVED_PRESETS, applyPreset, startBuilder }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 22px 130px', overflow: 'hidden' }}>
      <div className="q-stagger" style={{ display: 'contents' }}>
        <div style={{ '--i': 0, marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>READY</div>
          <h1 className="display" style={{
            margin: 0, fontSize: 28,
            color: 'var(--bone-100)',
          }}>
            Start a <span className="accent-amber">sesh.</span>
          </h1>
        </div>

        <div style={{ flex: 1, overflow: 'auto', '--i': 1 }} className="no-scrollbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="q-stagger">
            {/* Custom-session entry — first-class, equal weight to saved sessions */}
            <button onClick={startBuilder} className="glass-disc-warm" style={{
              padding: 18, borderRadius: 999, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14, '--i': 0,
              border: 'none', cursor: 'pointer',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, oklch(0.86 0.20 60) 0%, oklch(0.55 0.18 45) 45%, oklch(0.12 0.04 30) 100%)',
                boxShadow: 'inset 0 0.5px 0 rgba(255, 240, 220, 0.45), inset 0 0 0 0.5px oklch(0.78 0.20 55 / 0.55), 0 0 18px oklch(0.62 0.20 50 / 0.55), 0 0 36px oklch(0.62 0.20 50 / 0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 20 20">
                  <path d="M10 4v12M4 10h12" stroke="#fff5e8" strokeWidth="1.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(255,240,220,0.6))' }}/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="etched" style={{ fontSize: 15, color: 'var(--bone-100)', fontWeight: 400, letterSpacing: '-0.015em', marginBottom: 3 }}>
                  New sesh
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--bone-50)', lineHeight: 1.4, letterSpacing: '0.01em' }}>
                  Tell us your banger and what you're dabbing.
                </div>
              </div>
              <svg width="7" height="12" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke="var(--bone-50)" strokeWidth="1.25" fill="none" strokeLinecap="round"/></svg>
            </button>

            {/* Divider — quiet, just to group */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 4px 6px',
            }}>
              <div className="hairline" style={{ flex: 1 }} />
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--bone-35)' }}>SAVED</div>
              <div className="hairline" style={{ flex: 1 }} />
            </div>

            {SAVED_PRESETS.map((p, i) => (
              <div key={p.id} style={{ '--i': i + 2 }}>
                <PresetRow preset={p} onApply={() => applyPreset(p.id)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PresetRow({ preset, onApply }) {
  // Compute live calibration for display so the preset row shows real DAB/DUNK numbers.
  const banger = window.BANGERS?.find(b => b.id === preset.banger);
  const conc   = window.CONCENTRATES?.find(c => c.id === preset.concentrate);
  const sensor = window.SENSORS?.find(s => s.id === preset.sensor);
  const wall   = window.WALLS?.find(w => w.id === preset.wall);
  const cal    = (banger && conc && sensor && wall && window.computeCalibration)
    ? window.computeCalibration(banger, conc, sensor, wall)
    : { displayed: preset.dab || 0, dunk: preset.dunk || 0 };
  const dab  = cal.displayed || preset.dab;
  const dunk = cal.dunk || preset.dunk;
  return (
    <button onClick={onApply} className="glass-disc" style={{
      width: '100%', padding: 18, borderRadius: 999, textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 14,
      border: 'none', cursor: 'pointer',
    }}>
      <PresetGlyph kind={preset.kind} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 14.5, color: 'var(--bone-100)', fontWeight: 600, letterSpacing: '-0.015em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            minWidth: 0, flex: '0 1 auto',
          }}>{preset.name}</span>
          {preset.builtin && (
            <span className="mono" style={{
              fontSize: 8, letterSpacing: '0.14em',
              color: 'var(--bone-50)', padding: '2px 5px', borderRadius: 4,
              background: 'rgba(180, 200, 230, 0.06)',
              flexShrink: 0,
            }}>BUILT-IN</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <TempPill label="DAB" temp={dab} accent="ember" />
          <TempPill label="DUNK" temp={dunk} accent="quartz" />
        </div>
      </div>
      <svg width="7" height="12" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke="var(--bone-50)" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
    </button>
  );
}

window.QFlowShell = QFlowShell;
window.PersistentOrb = PersistentOrb;
window.ConnectStage = ConnectStage;
window.ChooseStage = ChooseStage;
window.PresetRow = PresetRow;

// ── Session + Complete stage stubs (richer flows TBD) ─────────────
function SessionStage({ phaseIdx, phaseProgress, liftToDab, placeBack, banger, concentrate, sessionSeconds, targets, heatReason, heatTimeFactor, coolTemp, coolDropRate }) {
  const phases = ['heat','cool','dab','dunk','clean'];
  const cur = phases[phaseIdx] || 'idle';
  const isReheat = (heatTimeFactor || 1) < 1;

  // Per-phase headline + sub copy
  const headlines = {
    heat:  isReheat
      ? (heatReason === 'missed' ? 'Window slipped. Reheat.' : 'Underheated. Top it off.')
      : 'Torch the banger.',
    cool:  'Place back on the DabRite.',
    dab:   'Dab now.',
    dunk:  'Dunk the q-tip.',
    clean: 'Swab the residue.',
  };
  const subs = {
    heat: isReheat
      ? (heatReason === 'missed'
          ? 'Temp fell below the dab window before you lifted. Half-time torch this round.'
          : 'IR saw a fast drop — banger didn\'t soak the heat. Half-time torch to bring it back up.')
      : (banger?.heat_time
          ? `${banger.name} · target ${banger.heat_time}. Torch off when timer ends.`
          : 'Torch with even sweeps. Timer counts down.'),
    cool:  `Cooling toward ${targets?.display}°. Lift the banger when the orb says LIFT TO DAB.`,
    dab:   'Apply the concentrate. Tap done when the banger comes back to the DabRite.',
    dunk:  'Cool enough to dunk and pull cap.',
    clean: 'Q-tip the inside before the puddle hardens.',
  };

  // Action button per phase (auto-advance phases get nothing)
  let action = null;
  if (cur === 'cool') {
    action = (
      <button onClick={liftToDab} className="q-action" style={{ alignSelf: 'stretch' }}>
        Lift to dab →
      </button>
    );
  } else if (cur === 'dab') {
    action = (
      <button onClick={placeBack} className="q-action" style={{ alignSelf: 'stretch' }}>
        Place back on DabRite →
      </button>
    );
  }

  // Live drop-rate readout for cool phase
  const dropRateLine = (cur === 'cool' && coolDropRate != null) ? (
    <div className="mono" style={{
      marginTop: 14, padding: '8px 10px', borderRadius: 8,
      background: coolDropRate > 3 ? 'oklch(0.20 0.06 25 / 0.6)' : 'oklch(0.16 0.02 55 / 0.5)',
      border: `1px solid ${coolDropRate > 3 ? 'oklch(0.35 0.10 25 / 0.6)' : 'oklch(0.22 0.02 55)'}`,
      fontSize: 10.5, lineHeight: 1.5,
      color: coolDropRate > 3 ? 'oklch(0.78 0.16 25)' : 'var(--bone-50)',
      letterSpacing: '0.04em',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.10em', fontSize: 9 }}>
          {coolDropRate > 3 ? 'DROPPING TOO FAST' : 'COOL RATE'}
        </span>
        <span>
          {coolDropRate.toFixed(1)}°/s · ideal 2°/s
        </span>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 22px 130px', overflow: 'hidden' }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        {cur.toUpperCase()}{isReheat && cur === 'heat' ? ' · REHEAT' : ''} · {Math.floor(sessionSeconds/60)}:{String(sessionSeconds%60).padStart(2,'0')}
      </div>
      <h1 className="display" style={{ margin: 0, fontSize: 26, color: 'var(--bone-100)' }}>
        {headlines[cur] || ''}
      </h1>
      <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--bone-50)', lineHeight: 1.5, textWrap: 'pretty' }}>
        {subs[cur]}
      </div>
      {dropRateLine}
      <div style={{ flex: 1 }} />
      {action}
    </div>
  );
}

const actionBtnStyle = {
  padding: '14px 18px', borderRadius: 100,
  background: 'linear-gradient(180deg, oklch(0.72 0.19 50), oklch(0.55 0.17 45))',
  color: '#fff', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em',
  boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.28), 0 6px 22px oklch(0.62 0.20 50 / 0.40)',
  border: 'none', cursor: 'pointer',
};

function CompleteStage({ sessionSeconds, reset }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 22px 130px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>COMPLETE</div>
      <h1 className="display" style={{ margin: 0, fontSize: 32, color: 'var(--bone-100)' }}>Sesh logged.</h1>
      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--bone-50)' }}>{Math.floor(sessionSeconds/60)}:{String(sessionSeconds%60).padStart(2,'0')} elapsed</div>
      <button onClick={reset} className="q-action" style={{ marginTop: 24 }}>New sesh</button>
    </div>
  );
}
window.SessionStage = SessionStage;
window.CompleteStage = CompleteStage;
