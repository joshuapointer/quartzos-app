import React from 'react';
import { AmbientBg } from './AmbientBg';
import { HeatFillBg } from './HeatFillBg';
import { VaporBg } from './VaporBg';
import { WaterBg } from './WaterBg';
import { SudsBg } from './SudsBg';
import { CompleteBg } from './CompleteBg';
import { DabBg } from './DabBg';

export type DwmPhase =
  | 'cold' | 'connecting' | 'connected'
  | 'presets' | 'banger' | 'concentrate' | 'wall' | 'review' | 'ready'
  | 'heating' | 'window' | 'dabbing' | 'swab' | 'dunk' | 'complete';

export interface PhaseBackgroundProps {
  phase: DwmPhase;
  /** 0..1 — drives HeatFill bg height while heating */
  heatProgress?: number;
  /** 0..1 — drives torch-on intensity multiplier on flame embers */
  torchOn?: number;
}

export function PhaseBackground({ phase, heatProgress = 0, torchOn = 0 }: PhaseBackgroundProps) {
  switch (phase) {
    case 'heating':
      return <HeatFillBg progress={heatProgress} torchOn={torchOn} />;
    case 'window':
      return <VaporBg />;
    case 'dunk':
      return <WaterBg />;
    case 'swab':
      return <SudsBg />;
    case 'dabbing':
      return <DabBg />;
    case 'complete':
      return <CompleteBg />;
    default:
      return <AmbientBg />;
  }
}
