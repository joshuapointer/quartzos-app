import type { Banger } from '../../../data/bangers';
import type { Concentrate } from '../../../data/concentrates';
import type { Sensor } from '../../../data/sensors';

// ─── Step types ───────────────────────────────────────────────────────────────

export type StepId =
  | 'prepare'
  | 'heat'
  | 'cool'
  | 'cold-load'
  | 'cold-heat'
  | 'dab'
  | 'dunk'
  | 'complete';

export interface Step {
  id: StepId;
  supra: string;
  title: string;
  body: string;
  ctaLabel?: string;
  autoAdvance?: boolean;
}

export interface BuildStepsArgs {
  readonly banger: Banger;
  readonly concentrate: Concentrate;
  readonly sensor: Sensor;
  readonly displayedTargetF: number;
  readonly interiorTargetF: number;
  readonly pidSetpointF: number;
  readonly useCelsius: boolean;
  readonly coldStart: boolean;
}

export interface TorchTimerProps {
  durationSeconds: number;
  onComplete: () => void;
  onElapsedChange?: (elapsedSec: number) => void;
}

export interface StepBodyProps {
  step: Step;
  stepIndex: number;
  torchDuration: number;
  onTorchComplete: () => void;
  onCta: () => void;
  dabAlarmF: number;
  dunkAlarmF: number;
  useCelsius: boolean;
  peakF: number;
  walkthroughStartedAt: number;
  banger: Banger;
  concentrate: Concentrate;
  sensor: Sensor;
}
