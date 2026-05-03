// flow-app.jsx — Quartzie single-flow companion app
// Data-driven by flow-data.jsx (full QuartzOS reference).

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── Session phase model ──────────────────────────────────────────
// idle → heat → cool → dab → dunk → clean → done
// (Prepare phase removed — user is already at the rig with banger in hand.)
const PHASES = ['heat', 'cool', 'dab', 'dunk', 'clean'];
const PHASES_COLD  = ['load', 'heat', 'dab', 'dunk', 'clean'];

// ─── Top-level App ─────────────────────────────────────────────────
function App() {
  const [connected, setConnected] = useState(false);
  const [stage, setStage] = useState('connect');
  const [builderStep, setBuilderStep] = useState(0);
  // Builder steps: banger → concentrate → wall → review (sensor is fixed: DabRite IR)
  const [bangerId, setBangerId] = useState(null);
  const [concId, setConcId] = useState(null);
  const [sensorId, setSensorId] = useState('ir');
  const [wallId, setWallId] = useState('standard');
  const [coldStart, setColdStart] = useState(false);
  const [activePresetId, setActivePresetId] = useState(null);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [windowState, setWindowState] = useState('waiting');
  const [windowSecondsLeft, setWindowSecondsLeft] = useState(30);
  // Heat sub-stage for slurpers (sequenced) — tracks dish/column/dish-return progression
  const [heatStage, setHeatStage] = useState(0);

  // Reheat tracking — when triggered, the next heat phase uses half the torch
  // duration of the original. Resets back to 1.0 on a fresh new-sesh.
  const [heatTimeFactor, setHeatTimeFactor] = useState(1);
  // 'normal' | 'reheat' — drives heat-phase copy/eyebrow.
  const [heatReason, setHeatReason] = useState('normal');
  // Live cool-down telemetry — surfaced to UI and used to trigger kickback.
  const [coolTemp, setCoolTemp] = useState(0);
  const [coolDropRate, setCoolDropRate] = useState(0);

  const banger = window.BANGERS.find(b => b.id === bangerId);
  const concentrate = window.CONCENTRATES.find(c => c.id === concId);
  const sensor = window.SENSORS.find(s => s.id === sensorId);
  const wall = window.WALLS.find(w => w.id === wallId);

  const calibration = useMemo(() => {
    return window.computeCalibration(banger, concentrate, sensor, wall);
  }, [banger, concentrate, sensor, wall]);

  const coldStartInfo = useMemo(() => window.coldStartFit(concentrate, banger), [concentrate, banger]);

  // DabRite IR is fixed — phase track only varies by cold-start vs hot-start.
  const phaseTrack = useMemo(() => {
    if (coldStart) return PHASES_COLD;
    return PHASES;
  }, [coldStart]);

  // ── Phase progression
  // heat:  countdown timer based on banger.heat_seconds × heatTimeFactor → auto-advance to cool
  // cool:  simulated IR temp drop with rate monitoring; auto-kicks back to half-time
  //        heat if temp drops faster than 3°F/s or falls below the dab window low.
  // dab:   waits for user "place back" action (simulated IR spike on return)
  // dunk:  short auto-progress → clean
  // clean: short auto-progress → complete
  useEffect(() => {
    if (stage !== 'session') return;
    const phaseKey = phaseTrack[phaseIdx];
    const startedAt = Date.now();
    let phaseDur = 0;

    if (phaseKey === 'heat') {
      // Use banger's heat_seconds midpoint × heatTimeFactor (1.0 fresh, 0.5 reheat).
      const hs = banger?.heat_seconds || [25, 35];
      phaseDur = ((hs[0] + hs[1]) / 2) * 1000 * heatTimeFactor;
    } else if (phaseKey === 'cool') {
      // Cool runs the temp curve over ~25s but does NOT auto-advance.
      phaseDur = 25000;
    } else if (phaseKey === 'dunk') {
      phaseDur = 4500;
    } else if (phaseKey === 'clean') {
      phaseDur = 5000;
    } else {
      return;
    }

    let tickId;
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const p = Math.min(1, elapsed / phaseDur);
      setPhaseProgress(p);
      if (p >= 1) {
        clearInterval(tickId);
        if (phaseKey === 'heat' || phaseKey === 'dunk' || phaseKey === 'clean') {
          // Auto-advance only for heat (torch done → simulate spike → cool),
          // dunk, and clean.
          setTimeout(() => advancePhase(), 200);
        }
        // For 'cool', stay at progress=1; user must lift the banger to advance.
      }
    };
    tickId = setInterval(tick, 100);
    return () => clearInterval(tickId);
  }, [stage, phaseIdx, phaseTrack, banger, heatTimeFactor]);

  // ── Cool-down rate monitor
  // Models the live IR reading. Ideal: ~2°F/s. If the banger was under-heated
  // (heatTimeFactor < 1, or future tweak knobs), it cools faster (~3.5°F/s).
  // When the live drop rate exceeds 3°F/s sustained, OR the temp falls below
  // the dab-window low, kick the user back to a half-time reheat.
  useEffect(() => {
    if (stage !== 'session') return;
    const phaseKey = phaseTrack[phaseIdx];
    if (phaseKey !== 'cool') {
      setCoolDropRate(0);
      return;
    }
    const targetDisplay = calibration?.displayed || 550;
    const targetLow = calibration?.low || (targetDisplay - 15);

    // Realistic peak just after a torched banger goes back on the IR.
    const peak = targetDisplay + 80;
    // Effective cooling rate — depends on whether the banger was under-heated.
    // 1.0 factor → ideal ~2°F/s. 0.5 reheat → ~3.5°F/s (still kicks back if not enough).
    const ratePerSec = heatTimeFactor >= 1 ? 2.0 : 3.5;
    const startedAt = Date.now();
    let lastTemp = peak;
    let lastSampleAt = startedAt;
    let consecutiveFastDrops = 0;
    setCoolTemp(peak);
    setCoolDropRate(ratePerSec);

    const id = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - startedAt) / 1000;
      const t = Math.max(150, peak - ratePerSec * elapsedSec);
      const dt = (now - lastSampleAt) / 1000;
      const drop = dt > 0 ? (lastTemp - t) / dt : 0;
      lastTemp = t;
      lastSampleAt = now;
      setCoolTemp(Math.round(t));
      setCoolDropRate(drop);

      // Trigger 1 — sustained fast drop (under-heated banger).
      if (drop > 3) {
        consecutiveFastDrops += 1;
      } else {
        consecutiveFastDrops = 0;
      }
      if (consecutiveFastDrops >= 3) {
        clearInterval(id);
        triggerReheat('fast-drop');
        return;
      }

      // Trigger 2 — temp fell below the dab window low without user lifting.
      if (t < targetLow - 5) {
        clearInterval(id);
        triggerReheat('missed-window');
        return;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [stage, phaseIdx, phaseTrack, calibration, heatTimeFactor]);

  const triggerReheat = useCallback((reason) => {
    const heatIdx = phaseTrack.indexOf('heat');
    if (heatIdx < 0) return;
    setHeatTimeFactor(0.5);
    setHeatReason(reason === 'missed-window' ? 'missed' : 'underheated');
    setPhaseProgress(0);
    setHeatStage(0);
    setPhaseIdx(heatIdx);
  }, [phaseTrack]);

  // ── Dab window timer
  useEffect(() => {
    if (stage !== 'session') return;
    if (phaseTrack[phaseIdx] !== 'dab') return;
    if (windowState !== 'waiting') return;
    setWindowSecondsLeft(30);
    const id = setInterval(() => {
      setWindowSecondsLeft(s => {
        if (s <= 1) { setWindowState('missed'); clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, phaseIdx, phaseTrack, windowState]);

  // ── Session timer
  useEffect(() => {
    if (stage !== 'session') return;
    const id = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [stage]);

  const advancePhase = useCallback(() => {
    setPhaseProgress(0);
    setWindowState('waiting');
    setHeatStage(0);
    setPhaseIdx(i => {
      if (i >= phaseTrack.length - 1) { setStage('complete'); return i; }
      return i + 1;
    });
  }, [phaseTrack]);

  const simulateDab = useCallback(() => setWindowState('dabbing'), []);
  const simulateReplace = useCallback(() => {
    setWindowState('waiting');
    const dunkIdx = phaseTrack.indexOf('dunk');
    setPhaseIdx(dunkIdx >= 0 ? dunkIdx : 0);
    setPhaseProgress(0);
  }, [phaseTrack]);
  const reheat = useCallback(() => {
    setWindowState('waiting');
    const heatIdx = phaseTrack.indexOf('heat');
    setPhaseIdx(heatIdx >= 0 ? heatIdx : 0);
    setPhaseProgress(0);
  }, [phaseTrack]);

  // ── DabRite-driven transitions ────────────────────────────────
  // liftToDab: simulates the user pulling the banger off the stand at the
  // right moment; the IR sees a sudden DROP (back to ambient) which we
  // interpret as the dab gesture starting.
  const liftToDab = useCallback(() => {
    const dabIdx = phaseTrack.indexOf('dab');
    if (dabIdx < 0) return;
    setPhaseProgress(0);
    setPhaseIdx(dabIdx);
  }, [phaseTrack]);

  // placeBack: simulates the user placing the banger back in front of the
  // DabRite after dabbing. The IR sees a sudden SPIKE (warm banger returning
  // to view) which we interpret as the dab being done → advance to dunk.
  const placeBack = useCallback(() => {
    const dunkIdx = phaseTrack.indexOf('dunk');
    if (dunkIdx < 0) return;
    setPhaseProgress(0);
    setPhaseIdx(dunkIdx);
  }, [phaseTrack]);

  // For sequenced slurpers — advance heat stage manually
  const advanceHeatStage = useCallback(() => {
    if (!banger?.heat_breakdown) return advancePhase();
    setHeatStage(s => {
      if (s >= banger.heat_breakdown.length - 1) {
        // Done — advance to next phase
        setTimeout(() => advancePhase(), 50);
        return s;
      }
      return s + 1;
    });
  }, [banger, advancePhase]);

  const connect = () => {
    setConnected(true);
    setTimeout(() => setStage('choose'), 800);
  };

  const applyPreset = (presetId) => {
    const p = window.SAVED_PRESETS.find(x => x.id === presetId);
    if (!p) return;
    const c = window.CONCENTRATES.find(x => x.id === p.concentrate);
    setActivePresetId(presetId);
    setBangerId(p.banger);
    setConcId(p.concentrate);
    setSensorId(p.sensor);
    setWallId(p.wall);
    // Auto-pick cold-start if both sides are good
    const b = window.BANGERS.find(x => x.id === p.banger);
    setColdStart(c?.cold_start_good && b?.cold_start === 'YES');
    setStage('session');
    setPhaseIdx(0); setPhaseProgress(0); setSessionSeconds(0);
    setHeatStage(0);
    setHeatTimeFactor(1); setHeatReason('normal');
  };

  const startBuilder = () => {
    setActivePresetId(null);
    setBangerId(null);
    setConcId(null);
    setSensorId('ir');
    setWallId('standard');
    setColdStart(false);
    setBuilderStep(0);
    setStage('build');
  };

  const builderNext = () => {
    if (builderStep < 3) setBuilderStep(builderStep + 1);
    else {
      setStage('session');
      setPhaseIdx(0); setPhaseProgress(0); setSessionSeconds(0); setHeatStage(0);
      setHeatTimeFactor(1); setHeatReason('normal');
    }
  };
  const builderBack = () => {
    if (builderStep > 0) setBuilderStep(builderStep - 1);
    else setStage('choose');
  };

  const reset = () => {
    setStage('choose');
    setPhaseIdx(0); setPhaseProgress(0); setSessionSeconds(0); setHeatStage(0);
    setHeatTimeFactor(1); setHeatReason('normal');
    setActivePresetId(null);
    setBangerId(null); setConcId(null);
  };

  const disconnect = () => {
    setConnected(false);
    setStage('connect');
    setActivePresetId(null);
    setBangerId(null); setConcId(null);
  };

  const orbProps = useMemo(() => {
    return window.computeOrbProps({
      stage, phaseIdx, phaseTrack, phaseProgress, calibration,
      builderStep, banger, concentrate, sensor,
      windowState, windowSecondsLeft, heatStage,
      coolTemp, heatTimeFactor, heatReason,
    });
  }, [stage, phaseIdx, phaseTrack, phaseProgress, calibration, builderStep, banger, concentrate, sensor, windowState, windowSecondsLeft, heatStage, coolTemp, heatTimeFactor, heatReason]);

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "unit": "F",
    "showFormula": true
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <div className="canvas">
        <div className="frame-wrap">
          <QPhone>
            <QFlowShell
              stage={stage}
              connected={connected}
              connect={connect}
              disconnect={disconnect}
              startBuilder={startBuilder}
              applyPreset={applyPreset}
              SAVED_PRESETS={window.SAVED_PRESETS}
              activePresetId={activePresetId}
              builderStep={builderStep}
              builderNext={builderNext}
              builderBack={builderBack}
              bangerId={bangerId} setBangerId={setBangerId}
              concId={concId}     setConcId={setConcId}
              sensorId={sensorId} setSensorId={setSensorId}
              wallId={wallId}     setWallId={setWallId}
              coldStart={coldStart} setColdStart={setColdStart}
              coldStartInfo={coldStartInfo}
              banger={banger} concentrate={concentrate} sensor={sensor} wall={wall}
              calibration={calibration}
              targets={{ display: calibration.displayed, dunk: calibration.dunk, low: calibration.low, high: calibration.high }}
              phaseTrack={phaseTrack}
              phaseIdx={phaseIdx}
              phaseProgress={phaseProgress}
              advancePhase={advancePhase}
              liftToDab={liftToDab}
              placeBack={placeBack}
              advanceHeatStage={advanceHeatStage}
              heatStage={heatStage}
              heatReason={heatReason}
              heatTimeFactor={heatTimeFactor}
              coolTemp={coolTemp}
              coolDropRate={coolDropRate}
              simulateDab={simulateDab}
              simulateReplace={simulateReplace}
              reheat={reheat}
              windowState={windowState}
              windowSecondsLeft={windowSecondsLeft}
              sessionSeconds={sessionSeconds}
              orbProps={orbProps}
              reset={reset}
              tweaks={tweaks}
            />
          </QPhone>
          <div className="label">QUARTZIE · QUARTZ-OS DRIVEN</div>
        </div>
      </div>

      {/* FlowTweaks panel deferred until we wire a richer dev panel. */}
    </>
  );
}

window.QFlowApp = App;
