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

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View, Switch, Text } from 'react-native';
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
import { useSettingsStore } from '../state/settingsStore';

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

  // Bold #3 — In-Window Climax. When the orb enters cool-in-window, briefly
  // swap QBackground's bloom from ember to quartz to flood the room with cool
  // contrast at the moment of payoff. Returns to ember after 2s.
  const [bgMode, setBgMode] = useState<'ember' | 'quartz'>('ember');
  useEffect(() => {
    if (orbProps.state !== 'cool-in-window') return;
    setBgMode('quartz');
    const t = setTimeout(() => setBgMode('ember'), 2000);
    return () => clearTimeout(t);
  }, [orbProps.state]);

  const mockBleEnabled = useSettingsStore((s) => s.mockBleEnabled);
  const setMockBleEnabled = useSettingsStore((s) => s.setMockBleEnabled);

  // Re-key on session phase boundary so the body cross-fades each phase.
  const stageKey = stage === 'session' ? `session-${phaseIdx}` : stage;

  // Guard the disconnect tap during a live session — the destructive path
  // sits in the persistent header 10pt from the wordmark and a stray thumb
  // mid-dab would drop the rig and lose the session record.
  const handleDisconnect = useCallback(() => {
    if (stage === 'session') {
      Alert.alert(
        'End session?',
        'This will stop tracking and lose the current session.',
        [
          { text: 'Stay connected', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: disconnect },
        ],
      );
      return;
    }
    disconnect();
  }, [stage, disconnect]);

  const targetOrbHeight = (orbProps.size ?? 200) + 30;
  const targetOrbMarginTop = stage === 'connect' ? 80 : 8;
  const targetOrbOpacity = 1;
  const targetOrbScale = 1;

  // The orb is the protagonist on every screen — it stays visible across the
  // chooser steps so the user can read the device state at a glance. Per-step
  // size is set in `useOrbProps` (BuildStage uses a tighter 140–170 ramp).

  const orbCellAnimStyle = useAnimatedStyle(() => ({
    height: withTiming(targetOrbHeight, { duration: 700, easing: STAGE_EASE }),
    marginTop: withTiming(targetOrbMarginTop, { duration: 700, easing: STAGE_EASE }),
    opacity: withTiming(targetOrbOpacity, { duration: 500, easing: STAGE_EASE }),
    transform: [{ scale: withTiming(targetOrbScale, { duration: 700, easing: STAGE_EASE }) }],
  }));

  return (
    <ErrorBoundary>
      <QBackground mode={bgMode}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <QWordmark
            connected={connected}
            onDisconnect={connected && stage !== 'connect' ? handleDisconnect : undefined}
          />

          {/* Persistent orb cell — height and top margin morph as stage changes. */}
          <Animated.View style={[styles.orbCell, orbCellAnimStyle]}>
            <Orb {...orbProps} />
          </Animated.View>

          {__DEV__ && (
            <View style={styles.devMockSwitch}>
              <Text style={styles.devMockText}>Mock BLE</Text>
              <Switch
                value={mockBleEnabled}
                onValueChange={setMockBleEnabled}
                trackColor={{ true: '#6366f1' }}
              />
            </View>
          )}

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
  devMockSwitch: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  devMockText: {
    color: '#fff',
    marginRight: 8,
    fontSize: 14,
    fontFamily: 'Geist-Medium',
  },
});
