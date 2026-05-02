// ─── Public API ──────────────────────────────────────────────────────────────

export type OrbState =
  | 'idle'
  | 'searching'
  | 'standby'
  | 'heat'
  | 'heat-reheat'
  | 'cool'
  | 'cool-fast-drop'
  | 'cool-in-window'
  | 'dab'
  | 'dunk'
  | 'clean'
  | 'complete';

export type OrbProps = {
  state: OrbState;
  /** Override / current size in points. Has a per-state default. */
  size?: number;
  label?: string;
  /** Live °F for cool / dunk / clean states. */
  temp?: number;
  /** Dab window low °F. */
  low?: number;
  /** Dab window high °F. */
  high?: number;
  /** 0..1 progress for torch ring. */
  heatProgress?: number;
  /** Total torch seconds — drives the "30s TOTAL" caption. */
  heatTotalSeconds?: number;
  /** Hide the temp readout (dab phase). */
  noReading?: boolean;
  /**
   * When set, the body renders a countdown ("0:25" → "0:00") instead of the
   * temperature readout. Used by timed-mode cool phase to count down to the
   * estimated dab temperature without showing a synthetic temp number.
   */
  countdownMs?: number;
  /**
   * When true, the body breathe animation runs at half rate (4s per half cycle
   * vs 2s) for a calmer "idle" feel. Default false.
   */
  idleBreathe?: boolean;
};

// ─── Internal prop interfaces ─────────────────────────────────────────────────

export interface TorchRingProps {
  size: number;
  heatProgress: number;
  heatTotalSeconds: number;
  reheat: boolean;
  label: string;
}

export interface TempDialProps {
  size: number;
  state: OrbState;
  label: string;
  temp?: number;
  countdownMs?: number;
  noReading: boolean;
  inWindow: boolean;
  fastDrop: boolean;
  idleBreathe: boolean;
  reduced: boolean;
}
