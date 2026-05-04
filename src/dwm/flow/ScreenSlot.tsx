import React from 'react';
import type { DwmPhase } from '../backgrounds/PhaseBackground';
import type { DwmSelections } from './useDwmPhase';
import type { Preset } from '../../db/presets';
import type { MoltenRecent } from '../../db/moltenRecents';
import type { Banger } from '../../data/bangers';
import type { Concentrate } from '../../data/concentrates';
import type { WallThickness } from '../../data/wallThicknesses';

import ConnectScreen from '../screens/ConnectScreen';
import ConnectingScreen from '../screens/ConnectingScreen';
import ConnectedScreen from '../screens/ConnectedScreen';
import ChooseScreen from '../screens/ChooseScreen';
import BangerScreen from '../screens/BangerScreen';
import ConcentrateScreen from '../screens/ConcentrateScreen';
import WallScreen from '../screens/WallScreen';
import ReviewScreen from '../screens/ReviewScreen';
import HeatScreen from '../screens/HeatScreen';
import WindowScreen from '../screens/WindowScreen';
import DabScreen from '../screens/DabScreen';
import SwabScreen from '../screens/SwabScreen';
import DunkScreen from '../screens/DunkScreen';
import CompleteScreen from '../screens/CompleteScreen';

export interface ScreenSlotProps {
  phase: DwmPhase;
  selections: DwmSelections;
  presets: ReadonlyArray<Preset>;
  recents: ReadonlyArray<MoltenRecent>;
  // resolved entities (null-safe — flow root guards before passing)
  banger: Banger | null;
  concentrate: Concentrate | null;
  wall: WallThickness | null;
  // heat phase
  heatSecondsLeft: number;
  heatSecondsTotal: number;
  torchOn: boolean;
  showHeatFallback: boolean;
  // window phase
  liveTempF: number;
  targetF: number;
  useCelsius: boolean;
  showWindowFallback: boolean;
  // complete phase
  peakF: number;
  windowDurationLabel: string | null;
  // callbacks
  onHoldComplete: () => void;
  onCancelScan: () => void;
  onPickPreset: (id: string) => void;
  onPickRecent: (id: string) => void;
  onBuildFresh: () => void;
  onSelectBanger: (id: string) => void;
  onSelectConcentrate: (id: string) => void;
  onSelectWall: (id: string) => void;
  onSkipHeat: () => void;
  onForceAdvanceHeat: () => void;
  onForceAdvanceWindow: () => void;
  onAgain: () => void;
  onNew: () => void;
}

export function ScreenSlot({
  phase,
  selections,
  presets,
  recents,
  banger,
  concentrate,
  wall,
  heatSecondsLeft,
  heatSecondsTotal,
  torchOn,
  showHeatFallback,
  liveTempF,
  targetF,
  useCelsius,
  showWindowFallback,
  peakF,
  windowDurationLabel,
  onHoldComplete,
  onCancelScan,
  onPickPreset,
  onPickRecent,
  onBuildFresh,
  onSelectBanger,
  onSelectConcentrate,
  onSelectWall,
  onSkipHeat,
  onForceAdvanceHeat,
  onForceAdvanceWindow,
  onAgain,
  onNew,
}: ScreenSlotProps) {
  switch (phase) {
    case 'cold':
      return <ConnectScreen onHoldComplete={onHoldComplete} />;

    case 'connecting':
      return <ConnectingScreen onCancelScan={onCancelScan} />;

    case 'connected':
      return <ConnectedScreen />;

    case 'presets':
      return (
        <ChooseScreen
          presets={presets as Preset[]}
          recents={recents as MoltenRecent[]}
          onPickPreset={onPickPreset}
          onPickRecent={onPickRecent}
          onBuildFresh={onBuildFresh}
        />
      );

    case 'banger':
      return (
        <BangerScreen
          selectedId={selections.bangerId}
          onSelect={onSelectBanger}
        />
      );

    case 'concentrate':
      return (
        <ConcentrateScreen
          selectedId={selections.concentrateId}
          onSelect={onSelectConcentrate}
        />
      );

    case 'wall':
      return (
        <WallScreen
          selectedId={selections.wallId}
          onSelect={onSelectWall}
        />
      );

    case 'review':
    case 'ready':
      if (banger != null && concentrate != null && wall != null) {
        return (
          <ReviewScreen
            banger={banger}
            concentrate={concentrate}
            wall={wall}
            onHoldComplete={onHoldComplete}
          />
        );
      }
      return null;

    case 'heating':
      return (
        <HeatScreen
          secondsLeft={heatSecondsLeft}
          secondsTotal={heatSecondsTotal}
          torchOn={torchOn}
          onSkip={onSkipHeat}
          showFallback={showHeatFallback}
          onForceAdvance={onForceAdvanceHeat}
        />
      );

    case 'window':
      return (
        <WindowScreen
          liveTempF={liveTempF}
          targetF={targetF}
          useCelsius={useCelsius}
          showStuckFallback={showWindowFallback}
          onForceAdvance={onForceAdvanceWindow}
        />
      );

    case 'dabbing':
      return <DabScreen />;

    case 'swab':
      return <SwabScreen />;

    case 'dunk':
      return <DunkScreen />;

    case 'complete':
      return (
        <CompleteScreen
          peakF={peakF}
          bangerName={banger?.name ?? 'Banger'}
          durationLabel={windowDurationLabel}
          onAgain={onAgain}
          onNew={onNew}
        />
      );

    default:
      return null;
  }
}
