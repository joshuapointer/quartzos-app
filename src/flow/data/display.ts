import type { Concentrate, Banger, OrbStage, OrbPhase, SessionState, OrbProps } from './types';
import { THEME } from '@/flow/theme';

// ─── coldStartFit ────────────────────────────────────────────────────────────
// PRD §5.3.4 decision matrix.

export function coldStartFit(
  c: Concentrate,
  b: Banger,
): 'IDEAL' | 'RECOMMENDED' | 'OPTIONAL' | 'NOT AVAILABLE' {
  if (b.cold_start === 'NO') return 'NOT AVAILABLE';
  if (c.cold_start_good && b.cold_start === 'YES') return 'IDEAL';
  if (c.cold_start_good && b.cold_start === 'OPTIONAL') return 'RECOMMENDED';
  return 'OPTIONAL';
}

// ─── computeOrbProps ─────────────────────────────────────────────────────────
// Returns visual orb state for each stage/phase of the dab session.

export function computeOrbProps(
  stage: OrbStage,
  phase: OrbPhase,
  sessionState: SessionState,
): OrbProps {
  const calib = sessionState.calibration;
  const currentTemp = sessionState.currentTemp ?? null;

  // Default fallback
  const defaults: OrbProps = {
    color: THEME.bone[50],
    glowColor: 'rgba(102,102,102,0.3)',
    pulseScale: 1.0,
    label: '—',
    sublabel: '',
    showTemp: false,
  };

  if (stage === 'idle') {
    return {
      ...defaults,
      color: THEME.bone[35],
      glowColor: 'rgba(68,68,68,0.2)',
      pulseScale: 0.9,
      label: 'Ready',
      sublabel: 'Select your setup',
    };
  }

  if (stage === 'heat') {
    const tempLabel = currentTemp != null ? `${Math.round(currentTemp)}°` : '—';
    return {
      color: THEME.ember.bright,
      glowColor: 'rgba(255,255,255,0.5)',
      pulseScale: phase === 'active' ? 1.15 : 1.0,
      label: 'Heating',
      sublabel: tempLabel,
      showTemp: true,
    };
  }

  if (stage === 'cool') {
    const target = calib?.displayed ?? null;
    const tempLabel = currentTemp != null ? `${Math.round(currentTemp)}°` : '—';
    const atTemp = target != null && currentTemp != null && currentTemp <= target + 15;
    return {
      color: atTemp ? THEME.success : THEME.ember.bright,
      glowColor: atTemp ? 'rgba(126,200,160,0.45)' : 'rgba(255,255,255,0.4)',
      pulseScale: atTemp ? 1.1 : 1.0,
      label: atTemp ? 'At Temp' : 'Cooling',
      sublabel: tempLabel,
      showTemp: true,
    };
  }

  if (stage === 'ready') {
    return {
      color: THEME.success,
      glowColor: 'rgba(126,200,160,0.6)',
      pulseScale: 1.12,
      label: 'Dab!',
      sublabel: calib ? `${calib.low}–${calib.high}°` : '',
      showTemp: false,
    };
  }

  if (stage === 'dab') {
    const tempLabel = currentTemp != null ? `${Math.round(currentTemp)}°` : '—';
    return {
      color: '#95ccff',
      glowColor: 'rgba(149,204,255,0.5)',
      pulseScale: phase === 'active' ? 1.08 : 1.0,
      label: 'Dabbing',
      sublabel: tempLabel,
      showTemp: true,
    };
  }

  if (stage === 'done') {
    return {
      color: THEME.bone[35],
      glowColor: 'rgba(68,68,68,0.2)',
      pulseScale: 0.95,
      label: 'Done',
      sublabel: 'Nice one',
      showTemp: false,
    };
  }

  return defaults;
}
