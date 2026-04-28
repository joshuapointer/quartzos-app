// app.jsx — Quartzie hi-fi canvas

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showState": "all",
  "unit": "F",
  "theme": "warm",
  "ritualMode": false
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const showState = tweaks.showState;
  const unit = tweaks.unit === 'F' ? '°F' : '°C';

  // helpers
  const toUnit = (f) => tweaks.unit === 'C' ? Math.round((f - 32) * 5 / 9) : f;

  // Frame configurations to display
  const frames = [
    {
      id: 'session-idle',
      label: '01 · Session — Standby',
      sub: 'Connected, no heat. Cool ambient.',
      content: (
        <SessionScreen
          state="idle"
          temp={toUnit(72)}
          unit={unit}
          sessionTime="0:00"
          peak={0}
          presetName="Quartz Recommended"
          presetDab={toUnit(550)}
          targetMin={toUnit(530)} targetMax={toUnit(570)}
        />
      ),
    },
    {
      id: 'session-heating',
      label: '02 · Session — Heating',
      sub: 'Climbing toward target. Amber edge bleed.',
      content: (
        <SessionScreen
          state="heating"
          temp={toUnit(412)}
          unit={unit}
          sessionTime="0:38"
          peak={toUnit(412)}
          presetName="Quartz Recommended"
          presetDab={toUnit(550)}
          targetMin={toUnit(530)} targetMax={toUnit(570)}
        />
      ),
    },
    {
      id: 'session-target',
      label: '03 · Session — At Target',
      sub: 'Window hit. Lens fully saturates amber.',
      content: (
        <SessionScreen
          state="target"
          temp={toUnit(552)}
          unit={unit}
          sessionTime="1:14"
          peak={toUnit(552)}
          presetName="Quartz Recommended"
          presetDab={toUnit(550)}
          targetMin={toUnit(530)} targetMax={toUnit(570)}
        />
      ),
    },
    {
      id: 'session-cooling',
      label: '04 · Session — Dab Window',
      sub: 'Falling through cooldown. Drop now.',
      content: (
        <SessionScreen
          state="cooling"
          temp={toUnit(478)}
          unit={unit}
          sessionTime="2:02"
          peak={toUnit(552)}
          presetName="Quartz Recommended"
          presetDab={toUnit(550)}
          targetMin={toUnit(530)} targetMax={toUnit(570)}
        />
      ),
    },
    {
      id: 'session-dunk',
      label: '05 · Session — Dunk Ready',
      sub: 'Cool side of the cycle. Quartz blue ambient.',
      content: (
        <SessionScreen
          state="dunk"
          temp={toUnit(252)}
          unit={unit}
          sessionTime="3:30"
          peak={toUnit(552)}
          presetName="Quartz Recommended"
          presetDab={toUnit(550)}
          targetMin={toUnit(240)} targetMax={toUnit(260)}
        />
      ),
    },
    {
      id: 'presets',
      label: '06 · Presets',
      sub: 'Saved configurations. Quartz active.',
      content: <PresetsScreen activePresetId="quartz" />,
    },
    {
      id: 'history',
      label: '07 · History',
      sub: 'Sessions with mini-waveforms.',
      content: <HistoryScreen />,
    },
    {
      id: 'configure',
      label: '08 · Configure',
      sub: 'Thresholds, device, sound, appearance.',
      content: <ConfigureScreen />,
    },
  ];

  const filtered = showState === 'all'
    ? frames
    : frames.filter(f => f.id === showState);

  return (
    <>
      {/* Canvas header */}
      <div style={{
        textAlign: 'center', padding: '20px 16px 8px',
        maxWidth: 720, margin: '0 auto',
      }}>
        <div className="eyebrow" style={{ fontSize: 10, color: 'var(--bone-35)', marginBottom: 12 }}>
          QUARTZIE · COMPANION FOR DAB RITE PRO v2.2
        </div>
        <h1 className="serif" style={{
          fontSize: 56, fontWeight: 400, lineHeight: 1.0,
          letterSpacing: '-0.025em', margin: '0 0 14px',
          color: 'var(--bone-100)',
        }}>
          Tactile, ceremonial, precise.
        </h1>
        <p style={{
          fontSize: 13, lineHeight: 1.6, color: 'var(--bone-50)',
          maxWidth: 540, margin: '0 auto',
          letterSpacing: '0.005em',
        }}>
          The companion app should feel like ordering a craft cocktail at a dim, near-future bar — unhurried,
          deliberate, material. Color does the heavy lifting; numbers confirm. Below: eight screens across
          the session lifecycle and supporting tabs.
        </p>
      </div>

      {/* Canvas */}
      <div className="canvas">
        {filtered.map(f => (
          <div key={f.id} className="frame-wrap">
            <QPhone>{f.content}</QPhone>
            <div style={{ textAlign: 'center', maxWidth: 360 }}>
              <div className="label" style={{ marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'var(--bone-50)' }}>{f.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '60px 16px 30px',
        fontSize: 11, color: 'var(--bone-35)', letterSpacing: '0.04em',
      }}>
        Toggle Tweaks (top toolbar) to change unit, focus a single state, or cycle themes.
      </div>

      <TweaksUI tweaks={tweaks} setTweak={setTweak} />
    </>
  );
}

function TweaksUI({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Quartzie">
      <TweakSection title="View">
        <TweakSelect
          label="Show"
          value={tweaks.showState}
          onChange={(v) => setTweak('showState', v)}
          options={[
            { value: 'all', label: 'All screens' },
            { value: 'session-idle', label: '01 · Standby' },
            { value: 'session-heating', label: '02 · Heating' },
            { value: 'session-target', label: '03 · At Target' },
            { value: 'session-cooling', label: '04 · Dab Window' },
            { value: 'session-dunk', label: '05 · Dunk Ready' },
            { value: 'presets', label: '06 · Presets' },
            { value: 'history', label: '07 · History' },
            { value: 'configure', label: '08 · Configure' },
          ]}
        />
      </TweakSection>
      <TweakSection title="Display">
        <TweakRadio
          label="Unit"
          value={tweaks.unit}
          onChange={(v) => setTweak('unit', v)}
          options={[
            { value: 'F', label: '°F' },
            { value: 'C', label: '°C' },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
