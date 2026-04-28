/**
 * src/flow/stages/ReviewStep.tsx
 *
 * Step 3 of the builder — calibration review + cold-start fork.
 * Glass-disc calibration card, 8-line setup grid, optional notes,
 * optional warning strip, cold-start toggle.
 *
 * Tokens: src/flow/theme.ts
 * Reference: /tmp/quartzie-prototype/src/flow-build.jsx ReviewStep + ColdStartToggle
 */

import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import {
  type Banger,
  type CalibResult,
  type Concentrate,
  type Wall,
} from '../data';
import {
  useBanger,
  useCalibration,
  useColdStartFit,
  useConcentrate,
  useFlow,
  useSensor,
  useWall,
} from '../store';
import { THEME, TYPE } from '../theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPattern(p: string): string {
  return p.replace(/_/g, ' ');
}

// ─── CalibrationCard ──────────────────────────────────────────────────────────

type CalibrationCardProps = {
  banger: Banger;
  concentrate: Concentrate;
  calibration: CalibResult;
};

function CalibrationCard({
  banger,
  concentrate,
  calibration,
}: CalibrationCardProps) {
  const { surface, ir, wall, displayed, low, high, override } = calibration;
  const irSign = banger.ir_offset_sign > 0 ? '+' : '−';
  const wallSign = wall >= 0 ? '+' : '−';
  const irAbs = Math.abs(ir);
  const wallAbs = Math.abs(wall);
  const geometryClass =
    banger.geometry === 'slurper'
      ? 'slurper'
      : banger.geometry === 'insert'
        ? 'insert'
        : 'bucket';

  const overrideKind =
    concentrate.cat === 'Solventless' || concentrate.cat === 'Hash'
      ? 'solventless'
      : 'hydrocarbon';

  return (
    <View style={styles.calibCardWrap}>
      <BlurView intensity={22} tint="dark" style={styles.calibBlur}>
        <View pointerEvents="none" style={styles.calibInnerBorder} />
        <LinearGradient
          colors={['rgba(255, 240, 220, 0.04)', 'rgba(0, 0, 0, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <Text style={styles.calibEyebrow}>CALIBRATION · IR BRANCH</Text>

        {override ? (
          <View style={styles.overridePill}>
            <Text style={styles.overrideText}>
              ★ Override: {banger.name} spec for {overrideKind} = {override.surface}
              °F.
            </Text>
          </View>
        ) : null}

        {/* Three values row */}
        <View style={styles.valuesRow}>
          <Text style={styles.displayValue}>{Math.round(displayed)}°</Text>
          <View style={styles.surfaceCol}>
            <Text style={styles.smallEyebrow}>SURFACE</Text>
            <Text style={styles.surfaceValue}>{surface}°</Text>
          </View>
          <View style={styles.windowCol}>
            <Text style={styles.smallEyebrow}>WINDOW</Text>
            <Text style={styles.windowValue}>
              {low}–{high}°F
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.formula}>
          {surface}° (surface) {irSign} {irAbs} ({geometryClass}-class IR){' '}
          {wallSign} {wallAbs}° (wall) = {displayed}°
        </Text>
      </BlurView>
    </View>
  );
}

// ─── Setup grid ───────────────────────────────────────────────────────────────

type SetupGridProps = {
  banger: Banger;
  concentrate: Concentrate;
  sensorName: string;
  wall: Wall;
};

function SetupGrid({
  banger,
  concentrate,
  sensorName,
  wall,
}: SetupGridProps) {
  const rows: Array<{ k: string; v: string }> = [
    { k: 'BANGER', v: banger.name },
    { k: 'CONCENTRATE', v: concentrate.name },
    { k: 'SENSOR', v: sensorName },
    { k: 'WALL', v: wall.name },
    { k: 'IR AIM', v: banger.ir_aim },
    { k: 'HEAT', v: `${banger.heat_time} · ${formatPattern(banger.pattern)}` },
    {
      k: 'COOLDOWN',
      v: `${banger.cool_seconds[0]}–${banger.cool_seconds[1]}s`,
    },
    { k: 'CUE', v: banger.visual_cue },
  ];

  return (
    <View style={styles.gridWrap}>
      {rows.map((row, i) => (
        <View
          key={row.k}
          style={[styles.gridRow, i < rows.length - 1 && styles.gridRowDivider]}
        >
          <Text style={styles.gridKey}>{row.k}</Text>
          <Text style={styles.gridValue}>{row.v}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Notes card ───────────────────────────────────────────────────────────────

type NotesCardProps = {
  notes: string[];
  confidence: string;
};

function NotesCard({ notes, confidence }: NotesCardProps) {
  return (
    <View style={styles.notesCard}>
      <Text style={styles.notesEyebrow}>NOTES · {confidence}</Text>
      <View style={styles.notesList}>
        {notes.map((n, i) => (
          <View key={i} style={styles.noteRow}>
            <View style={styles.noteBullet} />
            <Text style={styles.noteText}>{n}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Warning strip ────────────────────────────────────────────────────────────

function WarningStrip({ message }: { message: string }) {
  return (
    <View style={styles.warningStrip}>
      <Text style={styles.warningStripText}>{message}</Text>
    </View>
  );
}

// ─── Cold-start toggle ────────────────────────────────────────────────────────

type ColdStartCardProps = {
  banger: Banger;
  fit: 'IDEAL' | 'RECOMMENDED' | 'OPTIONAL' | 'NOT AVAILABLE';
  coldStart: boolean;
  setColdStart: (v: boolean) => void;
};

function ColdStartCard({
  banger,
  fit,
  coldStart,
  setColdStart,
}: ColdStartCardProps) {
  const blocked = fit === 'NOT AVAILABLE';
  const enabled = coldStart && !blocked;
  const thumbX = useSharedValue(enabled ? 22 : 2);

  useEffect(() => {
    thumbX.value = withTiming(enabled ? 22 : 2, { duration: 240 });
  }, [enabled, thumbX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const description: string =
    fit === 'IDEAL'
      ? 'Both banger and concentrate are cold-start ideal. Strongly recommended for terpene preservation.'
      : fit === 'RECOMMENDED'
        ? 'Concentrate prefers cold-start. Banger supports it.'
        : fit === 'OPTIONAL'
          ? 'Available, but hot-start is the typical workflow for this combination.'
          : `${banger.name} is not cold-start compatible. Hot-start required.`;

  // Badge palette per state
  const badgeBg =
    fit === 'IDEAL'
      ? 'rgba(170, 197, 224, 0.16)'
      : fit === 'NOT AVAILABLE'
        ? 'rgba(224, 112, 112, 0.16)'
        : fit === 'RECOMMENDED'
          ? 'rgba(180, 200, 230, 0.10)'
          : 'transparent';
  const badgeColor =
    fit === 'IDEAL'
      ? THEME.quartz.bright
      : fit === 'NOT AVAILABLE'
        ? THEME.danger
        : fit === 'RECOMMENDED'
          ? THEME.bone[90]
          : THEME.bone[50];

  function handlePress() {
    if (blocked) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColdStart(!coldStart);
  }

  const trackBg = enabled ? THEME.ember.base : THEME.bone[20];

  return (
    <View style={styles.coldCardWrap}>
      <BlurView intensity={22} tint="dark" style={styles.coldCardBlur}>
        <View pointerEvents="none" style={styles.coldCardBorder} />
        <View style={styles.coldCardInner}>
          <View style={styles.coldHeadingRow}>
            <Text style={styles.coldHeading}>Cold start</Text>
            <View style={[styles.coldBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.coldBadgeText, { color: badgeColor }]}>
                {fit}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={handlePress}
              disabled={blocked}
              style={[
                styles.toggleTrack,
                { backgroundColor: trackBg, opacity: blocked ? 0.4 : 1 },
              ]}
              accessibilityRole="switch"
              accessibilityLabel="Cold start"
              accessibilityState={{ checked: enabled, disabled: blocked }}
            >
              {enabled ? (
                <LinearGradient
                  colors={[THEME.ember.bright, THEME.ember.deep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <Animated.View style={[styles.toggleThumb, thumbStyle]} />
            </Pressable>
          </View>
          <Text style={styles.coldDescription}>{description}</Text>
        </View>
      </BlurView>
    </View>
  );
}

// ─── ReviewStep ───────────────────────────────────────────────────────────────

export default function ReviewStep() {
  const banger = useBanger();
  const concentrate = useConcentrate();
  const wall = useWall();
  const sensor = useSensor();
  const calibration = useCalibration();
  const coldFit = useColdStartFit();
  const coldStart = useFlow((s) => s.coldStart);
  const setColdStart = useFlow((s) => s.setColdStart);

  if (!banger || !concentrate || !calibration) return null;

  const sections: React.ReactNode[] = [];

  sections.push(
    <Animated.View
      key="calib"
      entering={FadeInUp.delay(120).duration(380)}
    >
      <CalibrationCard
        banger={banger}
        concentrate={concentrate}
        calibration={calibration}
      />
    </Animated.View>,
  );

  sections.push(
    <Animated.View
      key="grid"
      entering={FadeInUp.delay(175).duration(380)}
    >
      <SetupGrid
        banger={banger}
        concentrate={concentrate}
        sensorName={sensor.name}
        wall={wall}
      />
    </Animated.View>,
  );

  if (concentrate.notes && concentrate.notes.length > 0) {
    sections.push(
      <Animated.View
        key="notes"
        entering={FadeInUp.delay(230).duration(380)}
      >
        <NotesCard
          notes={concentrate.notes}
          confidence={concentrate.confidence}
        />
      </Animated.View>,
    );
  }

  if (concentrate.warning) {
    sections.push(
      <Animated.View
        key="warning"
        entering={FadeInUp.delay(285).duration(380)}
      >
        <WarningStrip message={concentrate.warning} />
      </Animated.View>,
    );
  }

  sections.push(
    <Animated.View
      key="cold"
      entering={FadeInUp.delay(340).duration(380)}
    >
      <ColdStartCard
        banger={banger}
        fit={coldFit}
        coldStart={coldStart}
        setColdStart={setColdStart}
      />
    </Animated.View>,
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {sections}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    gap: 12,
    paddingBottom: 16,
  },

  // Calibration card
  calibCardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: THEME.ember.base,
    shadowRadius: 28,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  calibBlur: {
    padding: 18,
    borderRadius: 24,
    position: 'relative',
  },
  calibInnerBorder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.10)',
    pointerEvents: 'none',
  } as const,
  calibEyebrow: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.32 * 9,
    color: THEME.ember.base,
    textTransform: 'uppercase',
    marginBottom: 14,
  } as const,
  overridePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(227, 166, 71, 0.10)',
    borderWidth: 0.5,
    borderColor: THEME.warn,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  overrideText: {
    ...(TYPE.mono as object),
    fontSize: 10.5,
    color: THEME.warn,
  } as const,
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  displayValue: {
    fontFamily: 'Geist_300Light',
    fontSize: 32,
    color: THEME.ember.bright,
    letterSpacing: -1.12,
    lineHeight: 32,
  },
  surfaceCol: {
    flexDirection: 'column',
    gap: 2,
  },
  windowCol: {
    flexDirection: 'column',
    gap: 2,
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  smallEyebrow: {
    ...(TYPE.mono as object),
    fontSize: 8,
    letterSpacing: 0.18 * 8,
    color: THEME.bone[50],
    textTransform: 'uppercase',
  } as const,
  surfaceValue: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: THEME.bone[100],
  },
  windowValue: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: THEME.bone[90],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(180, 200, 230, 0.10)',
    marginBottom: 12,
  },
  formula: {
    ...(TYPE.mono as object),
    fontSize: 12,
    color: THEME.bone[70],
    lineHeight: 12 * 1.5,
  } as const,

  // Setup grid
  gridWrap: {
    borderRadius: 14,
    backgroundColor: 'rgba(180, 200, 230, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.08)',
    paddingHorizontal: 14,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 14,
  },
  gridRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(180, 200, 230, 0.08)',
  },
  gridKey: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.18 * 9,
    color: THEME.bone[50],
    textTransform: 'uppercase',
    width: 86,
  } as const,
  gridValue: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: THEME.bone[100],
    flex: 1,
    lineHeight: 13 * 1.4,
  },

  // Notes card
  notesCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(180, 200, 230, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.08)',
    padding: 14,
  },
  notesEyebrow: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.32 * 9,
    color: THEME.ember.base,
    textTransform: 'uppercase',
    marginBottom: 10,
  } as const,
  notesList: {
    gap: 8,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.ember.base,
    marginTop: 8,
  },
  noteText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: THEME.bone[90],
    lineHeight: 12 * 1.5,
    flex: 1,
  },

  // Warning strip
  warningStrip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(227, 166, 71, 0.10)',
    borderWidth: 0.5,
    borderColor: THEME.warn,
  },
  warningStripText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11.5,
    color: THEME.warn,
    lineHeight: 11.5 * 1.45,
  },

  // Cold-start card
  coldCardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  coldCardBlur: {
    borderRadius: 24,
    position: 'relative',
  },
  coldCardBorder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.10)',
    pointerEvents: 'none',
  } as const,
  coldCardInner: {
    padding: 16,
  },
  coldHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  coldHeading: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: THEME.bone[100],
  },
  coldBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  coldBadgeText: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.14 * 9,
    textTransform: 'uppercase',
  } as const,
  toggleTrack: {
    width: 52,
    height: 30,
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    top: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  coldDescription: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: THEME.bone[50],
    lineHeight: 12 * 1.5,
  },
});
