/**
 * src/flow/QFlowShell.tsx
 *
 * Persistent shell that wraps every stage of the linear flow.
 * Holds:
 *   - QBackground (full-bleed deep-navy + ember radials)
 *   - QWordmark (top header — sphere + Quartzie + status/disconnect)
 *   - Persistent orb cell (height animates from orbProps.size)
 *   - StageSwitch — cross-fades between stage bodies on stageKey change
 *
 * Height transition uses cubic-bezier(.22,1,.36,1) to match the
 * snappy-but-smooth expo ease-out feel across stage changes.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import Orb from './components/Orb';
import QWordmark from './components/QWordmark';
import QBackground from './QBackground';
import ErrorBoundary from './ErrorBoundary';
import { useFlow, useOrbProps } from './store';

import BuildStage from './stages/BuildStage';
import ChooseStage from './stages/ChooseStage';
import { CompleteStage } from './stages/CompleteStage';
import ConnectStage from './stages/ConnectStage';
import { SessionStage } from './stages/SessionStage';

// ─── StageSwitch ──────────────────────────────────────────────────────────────
// Cross-fade + slight rise on stageKey change. Reanimated keeps the previous
// child mounted briefly while it fades out via re-keying the View.

const STAGE_EASE = Easing.bezier(0.22, 1, 0.36, 1);

type StageSwitchProps = {
  stageKey: string;
  children: React.ReactNode;
};

function StageSwitch({ stageKey, children }: StageSwitchProps) {
  return (
    <Animated.View
      key={stageKey}
      entering={FadeIn.duration(480).easing(STAGE_EASE)}
      style={styles.stageInner}
    >
      {children}
    </Animated.View>
  );
}

// ─── QFlowShell ───────────────────────────────────────────────────────────────

export default function QFlowShell() {
  const stage = useFlow((s) => s.stage);
  const connected = useFlow((s) => s.connected);
  const phaseIdx = useFlow((s) => s.phaseIdx);
  const disconnect = useFlow((s) => s.disconnect);
  const orbProps = useOrbProps();

  // Re-key on session phase boundary so the body cross-fades each phase.
  const stageKey = stage === 'session' ? `session-${phaseIdx}` : stage;

  const targetOrbHeight = (orbProps.size ?? 200) + 30;
  const targetOrbMarginTop = stage === 'connect' ? 80 : 8;

  const orbCellAnimStyle = useAnimatedStyle(() => ({
    height: withTiming(targetOrbHeight, { duration: 700, easing: STAGE_EASE }),
    marginTop: withTiming(targetOrbMarginTop, { duration: 700, easing: STAGE_EASE }),
  }));

  return (
    <ErrorBoundary>
      <QBackground>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <QWordmark
            connected={connected}
            onDisconnect={connected && stage !== 'connect' ? disconnect : undefined}
          />

          {/* Persistent orb cell — height and top margin morph as stage changes. */}
          <Animated.View style={[styles.orbCell, orbCellAnimStyle]}>
            <Orb {...orbProps} />
          </Animated.View>

          {/* Stage content — cross-fades between stages and session phases. */}
          <View style={styles.stageOuter}>
            <StageSwitch stageKey={stageKey}>
              {stage === 'connect' && <ConnectStage />}
              {stage === 'choose' && <ChooseStage />}
              {stage === 'build' && <BuildStage />}
              {stage === 'session' && <SessionStage />}
              {stage === 'complete' && <CompleteStage />}
            </StageSwitch>
          </View>
        </SafeAreaView>
      </QBackground>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  orbCell: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stageOuter: {
    flex: 1,
    position: 'relative',
  },
  stageInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
