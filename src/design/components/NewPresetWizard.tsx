import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect as SvgRect } from 'react-native-svg';

import { colors, radius, spacing } from '../tokens';
import * as presetsDb from '../../db/presets';
import { DEFAULT_SETTINGS } from '../../ble/types';
import {
  BANGERS,
  findBanger,
  type Banger,
  type BangerCategory,
} from '../../data/bangers';
import {
  CONCENTRATES,
  findConcentrate,
  isDabbable,
  type Concentrate,
  type ConcentrateCategory,
} from '../../data/concentrates';
import { SENSORS, findSensor, type Sensor, type SensorMethod } from '../../data/sensors';
import {
  WALL_THICKNESSES,
  findWallThickness,
  type WallThickness,
  type WallThicknessId,
} from '../../data/wallThicknesses';
import { computeDisplayedTarget, coldStartAvailable } from '../../utils/calibration';
import { useDabPreferencesStore } from '../../state/dabPreferencesStore';
import { BangerAnatomy } from './BangerAnatomy';
import { IrAimHint } from './IrAimHint';
import { ConcentrateTagChip } from './ConcentrateTagChip';
import { BlockedConcentrateExplainer } from './BlockedConcentrateExplainer';

// ──────────────────────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────────────────────

interface NewPresetWizardProps {
  onClose: () => void;
  onSaved: () => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Static config
// ──────────────────────────────────────────────────────────────────────────────

const BANGER_CATEGORY_ORDER: readonly BangerCategory[] = [
  'classic',
  'slurper',
  'specialty',
  'premium',
];

const BANGER_CATEGORY_LABELS: Readonly<Record<BangerCategory, string>> = {
  classic: 'Classic',
  slurper: 'Slurper Class',
  specialty: 'Specialty',
  premium: 'Premium',
};

const CONCENTRATE_CATEGORY_ORDER: readonly ConcentrateCategory[] = [
  'solventless',
  'hash',
  'hydrocarbon',
  'distillate',
  'novel',
];

const CONCENTRATE_CATEGORY_LABELS: Readonly<Record<ConcentrateCategory, string>> = {
  solventless: 'Solventless',
  hash: 'Hash',
  hydrocarbon: 'Hydrocarbon',
  distillate: 'Distillate',
  novel: 'Novel / 2026',
};

/**
 * Default-ish color pair per concentrate category (for swatch gradient).
 * Keeps the wizard's existing painterly tile look without requiring explicit
 * colors per concentrate.
 */
const CATEGORY_SWATCH_COLORS: Readonly<Record<ConcentrateCategory, readonly [string, string]>> = {
  solventless: ['#C4A860', '#886030'],
  hash: ['#A58860', '#6E5530'],
  hydrocarbon: ['#B8782C', '#704820'],
  distillate: ['#C8D8E8', '#8898A8'],
  novel: ['#D8E4EC', '#A8C0D4'],
};

const SENSOR_ORDER: readonly SensorMethod[] = ['ir', 'contact', 'enail', 'visual'];

const SENSOR_SHORT_LABEL: Readonly<Record<SensorMethod, string>> = {
  ir: 'IR',
  contact: 'Probe',
  enail: 'E-nail',
  visual: 'Visual',
};

const WALL_ORDER: readonly WallThicknessId[] = ['thin', 'standard', 'thick', 'unknown'];

function tempColorFor(offset: number): string {
  const t = offset / TEMP_RANGE;
  if (t > 0.5) return colors.emberBright;
  if (t > 0.15) return colors.ember;
  if (t < -0.5) return colors.quartzBright;
  if (t < -0.15) return colors.quartz;
  return colors.bone100;
}

const GEM_COLORS = [
  colors.sapphire,
  colors.amethyst,
  colors.citrine,
  colors.emerald,
  colors.ruby,
];

const GEM_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  [colors.sapphire]: 'water-drop',
  [colors.amethyst]: 'diamond',
  [colors.citrine]: 'local-fire-department',
  [colors.emerald]: 'eco',
  [colors.ruby]: 'favorite',
};

// ──────────────────────────────────────────────────────────────────────────────
// Layout constants
// ──────────────────────────────────────────────────────────────────────────────

const CARD_W = 240;
const CARD_H = 280;
const CARD_GAP = 16;
const STEP_COUNT = 6;
const TEMP_RANGE = 30;
const PX_PER_DEGREE = 4;

const STEP_TITLES: readonly string[] = [
  'Pick your hardware',
  'How do you measure?',
  'Wall thickness',
  'What are you dabbing?',
  'Tune your window',
  'Save your preset',
];

// ──────────────────────────────────────────────────────────────────────────────
// Banger group ordering — preserves source order within each category.
// ──────────────────────────────────────────────────────────────────────────────

interface BangerGroup {
  readonly category: BangerCategory;
  readonly bangers: readonly Banger[];
}

function buildBangerGroups(): readonly BangerGroup[] {
  return BANGER_CATEGORY_ORDER.map((category) => ({
    category,
    bangers: BANGERS.filter((b) => b.category === category),
  })).filter((g) => g.bangers.length > 0);
}

const BANGER_GROUPS: readonly BangerGroup[] = buildBangerGroups();

/** Flat ordered list mirroring the visual carousel order (group by category). */
const ORDERED_BANGERS: readonly Banger[] = BANGER_GROUPS.flatMap((g) => g.bangers);

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export function NewPresetWizard({ onClose, onSaved }: NewPresetWizardProps) {
  const preferredSensorMethod = useDabPreferencesStore((s) => s.preferredSensor);
  const preferredWallId = useDabPreferencesStore((s) => s.preferredWall);
  const coldStartByDefault = useDabPreferencesStore((s) => s.coldStartByDefault);

  const [step, setStep] = useState(0);
  const [bangerId, setBangerId] = useState<string | null>(null);
  const [sensorId, setSensorId] = useState<string>(() => {
    const match = SENSORS.find((s) => s.method === preferredSensorMethod);
    return match?.id ?? SENSORS[0].id;
  });
  const [wallId, setWallId] = useState<WallThicknessId>(preferredWallId);
  const [concentrateId, setConcentrateId] = useState<string | null>(null);
  const [tuneOffset, setTuneOffset] = useState(0);
  const [presetName, setPresetName] = useState('');
  const [gemColor, setGemColor] = useState<string>(GEM_COLORS[0]);
  const [useColdStart, setUseColdStart] = useState<boolean>(false);
  const [coldStartTouched, setColdStartTouched] = useState<boolean>(false);
  const [blockedModalId, setBlockedModalId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const banger = useMemo<Banger | null>(
    () => (bangerId ? findBanger(bangerId) ?? null : null),
    [bangerId],
  );
  const sensor = useMemo<Sensor>(() => findSensor(sensorId) ?? SENSORS[0], [sensorId]);
  const wall = useMemo<WallThickness>(
    () => findWallThickness(wallId) ?? WALL_THICKNESSES[1],
    [wallId],
  );
  const concentrate = useMemo<Concentrate | null>(
    () => (concentrateId ? findConcentrate(concentrateId) ?? null : null),
    [concentrateId],
  );

  const blockedModalConcentrate = useMemo<Concentrate | null>(
    () => (blockedModalId ? findConcentrate(blockedModalId) ?? null : null),
    [blockedModalId],
  );

  const concentrateIsBlocked = concentrate != null && !isDabbable(concentrate);

  const calibration = useMemo(() => {
    if (!banger || !concentrate || concentrateIsBlocked) return null;
    try {
      return computeDisplayedTarget({
        concentrate,
        banger,
        sensor,
        wall,
        tuneOffsetF: tuneOffset,
      });
    } catch {
      return null;
    }
  }, [banger, concentrate, concentrateIsBlocked, sensor, wall, tuneOffset]);

  const finalTemp = calibration?.displayedF ?? 0;
  const dunkTemp = calibration?.dunkF ?? 250;

  // Cold-start availability + default management
  const coldStartCompatible =
    banger && concentrate && !concentrateIsBlocked
      ? coldStartAvailable(concentrate, banger)
      : false;

  // Default cold-start toggle when newly compatible & user hasn't touched it.
  useEffect(() => {
    if (coldStartTouched) return;
    setUseColdStart(coldStartCompatible && coldStartByDefault);
  }, [coldStartCompatible, coldStartByDefault, coldStartTouched]);

  // Reset cold-start when no longer compatible.
  useEffect(() => {
    if (!coldStartCompatible && useColdStart) {
      setUseColdStart(false);
    }
  }, [coldStartCompatible, useColdStart]);

  // Auto-name when banger + concentrate chosen the first time
  useEffect(() => {
    if (banger && concentrate && !concentrateIsBlocked && !presetName) {
      setPresetName(`${concentrate.name} · ${banger.name.split(' ')[0]}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bangerId, concentrateId, concentrateIsBlocked]);

  const canAdvance = useMemo(() => {
    if (step === 0) return bangerId !== null;
    if (step === 1) return sensorId.length > 0;
    if (step === 2) return wallId.length > 0;
    if (step === 3) return concentrateId !== null && !concentrateIsBlocked;
    if (step === 4) return true;
    if (step === 5) return presetName.trim().length > 0;
    return false;
  }, [step, bangerId, sensorId, wallId, concentrateId, concentrateIsBlocked, presetName]);

  const stepOpacity = useSharedValue(1);
  const stepSlide = useSharedValue(0);
  const stepStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
    transform: [{ translateX: stepSlide.value }],
  }));

  const goBack = useCallback(() => {
    if (step === 0) {
      onClose();
      return;
    }
    const prevStep = Math.max(0, step - 1);
    stepOpacity.value = withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }, (done) => {
      if (done) {
        stepSlide.value = -36;
        runOnJS(setStep)(prevStep);
      }
    });
  }, [step, stepOpacity, stepSlide, onClose]);

  const goClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    const trimmed = presetName.trim();
    if (!trimmed) return;
    if (!banger || !concentrate || concentrateIsBlocked || !calibration) return;
    setSaving(true);
    try {
      const settings = {
        ...DEFAULT_SETTINGS,
        dabAlarmF: calibration.displayedF,
        dunkAlarmF: calibration.dunkF,
        // Preserve legacy mapping: opaque-bottom bangers turn on the IR opaque mode flag.
        opaqueMode: banger.id === 'opaque-bottom',
      };
      const saved = await presetsDb.create(trimmed, settings);
      const gemIdx = GEM_COLORS.indexOf(gemColor);
      if (gemIdx >= 0) {
        await presetsDb.update(saved.id, { iconSlot: gemIdx });
      }
      // TODO(phase-2d): persist the (banger.id, sensor.id, wall.id, concentrate.id,
      // useColdStart) tuple alongside the preset so SessionWalkthrough can recover
      // banger metadata. We deliberately do NOT extend `DeviceSettings` here, and a
      // marker-in-name hack would corrupt user-visible copy. Phase 2D's walkthrough
      // falls back to default banger metadata when the marker is missing — known gap.
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
      onClose();
    } catch {
      setSaveError('Could not save preset. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    presetName,
    banger,
    concentrate,
    concentrateIsBlocked,
    calibration,
    gemColor,
    onSaved,
    onClose,
  ]);

  const goNext = useCallback(() => {
    if (!canAdvance) return;
    if (step === STEP_COUNT - 1) {
      void handleSave();
      return;
    }
    const nextStep = Math.min(STEP_COUNT - 1, step + 1);
    stepOpacity.value = withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }, (done) => {
      if (done) {
        stepSlide.value = 36;
        runOnJS(setStep)(nextStep);
      }
    });
  }, [canAdvance, step, handleSave, stepOpacity, stepSlide]);

  useEffect(() => {
    stepOpacity.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
    stepSlide.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [step, stepOpacity, stepSlide]);

  const stepTitle = STEP_TITLES[step] ?? '';
  const ctaLabel = step === STEP_COUNT - 1 ? 'Save preset' : 'Continue →';

  const handleConcentrateSelect = useCallback(
    (id: string) => {
      const c = findConcentrate(id);
      if (!c) return;
      if (!isDabbable(c)) {
        setBlockedModalId(id);
        // Don't keep blocked id selected — `extractId` stays null per spec.
        setConcentrateId(null);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConcentrateId(id);
    },
    [],
  );

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <WizardHeader title={stepTitle} onBack={goBack} onClose={goClose} />
        <StepIndicator step={step} />

        <Animated.View style={[styles.body, stepStyle]}>
          {step === 0 && <BangerStep bangerId={bangerId} onSelect={setBangerId} />}
          {step === 1 && (
            <SensorStep
              sensorId={sensorId}
              onSelect={setSensorId}
              banger={banger}
              sensor={sensor}
            />
          )}
          {step === 2 && <WallStep wallId={wallId} onSelect={setWallId} />}
          {step === 3 && (
            <ConcentrateStep
              concentrateId={concentrateId}
              onSelect={handleConcentrateSelect}
            />
          )}
          {step === 4 && (
            <TuneStep
              calibration={calibration}
              tempOffset={tuneOffset}
              onChangeOffset={setTuneOffset}
            />
          )}
          {step === 5 && (
            <SaveStep
              presetName={presetName}
              onChangeName={setPresetName}
              banger={banger}
              concentrate={concentrate}
              finalTemp={finalTemp}
              dunkTemp={dunkTemp}
              gemColor={gemColor}
              onSelectGem={setGemColor}
              coldStartCompatible={coldStartCompatible}
              useColdStart={useColdStart}
              onToggleColdStart={() => {
                setColdStartTouched(true);
                setUseColdStart((v) => !v);
              }}
            />
          )}
        </Animated.View>

        {saveError !== null && (
          <View style={styles.saveErrorToast}>
            <Text style={styles.saveErrorText}>{saveError}</Text>
            <Pressable onPress={() => setSaveError(null)} hitSlop={12}>
              <Text style={styles.saveErrorDismiss}>Dismiss</Text>
            </Pressable>
          </View>
        )}
        <WizardFooter
          label={ctaLabel}
          disabled={!canAdvance || saving}
          loading={saving}
          onPress={goNext}
        />
      </KeyboardAvoidingView>

      {blockedModalConcentrate ? (
        <BlockedConcentrateExplainer
          concentrate={blockedModalConcentrate}
          visible={blockedModalId !== null}
          onClose={() => setBlockedModalId(null)}
        />
      ) : null}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Header / Step Indicator / Footer
// ──────────────────────────────────────────────────────────────────────────────

interface WizardHeaderProps {
  title: string;
  onBack: () => void;
  onClose: () => void;
}

function WizardHeader({ title, onBack, onClose }: WizardHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable hitSlop={14} onPress={onBack} style={styles.headerIcon}>
        <MaterialIcons name="chevron-left" size={28} color={colors.bone70} />
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <Pressable hitSlop={14} onPress={onClose} style={styles.headerIcon}>
        <MaterialIcons name="close" size={24} color={colors.bone70} />
      </Pressable>
    </View>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: STEP_COUNT }).map((_, i) => {
        const filled = i <= step;
        const active = i === step;
        if (filled) {
          return (
            <LinearGradient
              key={i}
              colors={[colors.emberBright, colors.ember]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.stepSegment, active && styles.stepSegmentActive]}
            />
          );
        }
        return <View key={i} style={[styles.stepSegment, styles.stepSegmentEmpty]} />;
      })}
    </View>
  );
}

interface WizardFooterProps {
  label: string;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}

function WizardFooter({ label, disabled, loading, onPress }: WizardFooterProps) {
  return (
    <View style={styles.footer}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.cta,
          disabled && styles.ctaDisabled,
          pressed && !disabled && styles.ctaPressed,
          { transform: [{ scale: pressed && !disabled ? 0.97 : 1 }] },
        ]}
      >
        {!disabled ? (
          <LinearGradient
            colors={[colors.ember, colors.emberDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Text style={[styles.ctaLabel, disabled && styles.ctaLabelDisabled]}>
          {loading ? 'Saving preset…' : label}
        </Text>
      </Pressable>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 0 — Banger
// ──────────────────────────────────────────────────────────────────────────────

interface BangerStepProps {
  bangerId: string | null;
  onSelect: (id: string) => void;
}

function BangerStep({ bangerId, onSelect }: BangerStepProps) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const stride = CARD_W + CARD_GAP;
  const sidePad = (windowWidth - CARD_W) / 2;

  // Build a flat carousel order = ORDERED_BANGERS (already grouped by category).
  // Each card carries a category divider header above the first banger of its group.
  const cards = ORDERED_BANGERS;

  const activeIndex = useMemo(() => {
    const idx = cards.findIndex((b) => b.id === bangerId);
    return idx === -1 ? 0 : idx;
  }, [bangerId, cards]);

  // Auto-scroll to selection when it changes via tap
  useEffect(() => {
    if (!bangerId) return;
    scrollRef.current?.scrollTo({ x: activeIndex * stride, animated: true });
  }, [bangerId, activeIndex, stride]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / stride);
    const clamped = Math.max(0, Math.min(cards.length - 1, index));
    const target = cards[clamped];
    if (target && target.id !== bangerId) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(target.id);
    }
  };

  const banger = bangerId ? findBanger(bangerId) ?? null : null;

  return (
    <View style={styles.stepRoot}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={stride}
        decelerationRate="fast"
        snapToAlignment="center"
        contentContainerStyle={{
          paddingHorizontal: sidePad,
          paddingVertical: spacing.md,
          gap: CARD_GAP,
        }}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {cards.map((b, idx) => {
          const active = b.id === bangerId;
          const prev = idx > 0 ? cards[idx - 1] : null;
          const showCategoryBadge = !prev || prev.category !== b.category;
          return (
            <Pressable
              key={b.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(b.id);
              }}
              style={[
                styles.bangerCard,
                active && styles.bangerCardActive,
                { transform: [{ scale: active ? 1.0 : 0.94 }] },
              ]}
            >
              {showCategoryBadge ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {BANGER_CATEGORY_LABELS[b.category]}
                  </Text>
                </View>
              ) : null}
              <View style={styles.bangerDiagramFrame}>
                <BangerAnatomy banger={b} size={80} />
              </View>
              <Text style={styles.bangerName} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={styles.bangerSpec} numberOfLines={2}>
                {b.geometry} · {b.surface_temp_range_f[0]}–{b.surface_temp_range_f[1]}°F
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.dotRow}>
        {cards.map((b, i) => (
          <View
            key={b.id}
            style={[
              styles.dot,
              i === activeIndex && bangerId !== null && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.thermalPanel}>
        <Text style={styles.labelCaps}>About this banger</Text>
        {banger ? (
          <>
            <Text style={styles.bangerGeometryLine}>
              {banger.geometry.toUpperCase()} · {banger.cold_start_compatible === 'NO'
                ? 'No cold start'
                : banger.cold_start_compatible === 'YES'
                  ? 'Cold start ready'
                  : 'Cold start optional'}
            </Text>
            <Text style={styles.thermalNote}>{banger.description}</Text>
            <View style={styles.bangerSpecRow}>
              <View style={styles.bangerSpecCell}>
                <Text style={styles.labelCaps}>Heat</Text>
                <Text style={styles.bangerSpecValue}>{banger.heat_time_seconds}s</Text>
              </View>
              <View style={styles.bangerSpecCell}>
                <Text style={styles.labelCaps}>Cool</Text>
                <Text style={styles.bangerSpecValue}>{banger.cooldown_seconds}s</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.thermalNote}>
            Swipe a card or tap to select your banger style.
          </Text>
        )}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 1 — Sensor
// ──────────────────────────────────────────────────────────────────────────────

interface SensorStepProps {
  sensorId: string;
  onSelect: (id: string) => void;
  banger: Banger | null;
  sensor: Sensor;
}

function SensorStep({ sensorId, onSelect, banger, sensor }: SensorStepProps) {
  const orderedSensors = useMemo<readonly Sensor[]>(() => {
    return SENSOR_ORDER.map((m) => SENSORS.find((s) => s.method === m)).filter(
      (s): s is Sensor => s !== undefined,
    );
  }, []);

  return (
    <ScrollView
      style={styles.stepRoot}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.chipRow}>
        {orderedSensors.map((s) => {
          const active = s.id === sensorId;
          return (
            <Pressable
              key={s.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(s.id);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {SENSOR_SHORT_LABEL[s.method]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {banger ? (
        <IrAimHint banger={banger} sensor={sensor} />
      ) : (
        <View style={styles.thermalPanel}>
          <Text style={styles.thermalNote}>Pick a banger first to preview IR aim guidance.</Text>
        </View>
      )}

      <View style={styles.thermalPanel}>
        <Text style={styles.labelCaps}>{sensor.name}</Text>
        <Text style={styles.thermalNote}>{sensor.description}</Text>
        <Text style={styles.calibrationNote}>{sensor.calibration_note}</Text>
      </View>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 2 — Wall thickness
// ──────────────────────────────────────────────────────────────────────────────

interface WallStepProps {
  wallId: WallThicknessId;
  onSelect: (id: WallThicknessId) => void;
}

function WallStep({ wallId, onSelect }: WallStepProps) {
  const orderedWalls = useMemo<readonly WallThickness[]>(() => {
    return WALL_ORDER.map((id) => WALL_THICKNESSES.find((w) => w.id === id)).filter(
      (w): w is WallThickness => w !== undefined,
    );
  }, []);

  const active = orderedWalls.find((w) => w.id === wallId) ?? orderedWalls[1];

  return (
    <ScrollView
      style={styles.stepRoot}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.chipRow}>
        {orderedWalls.map((w) => {
          const isActive = w.id === wallId;
          return (
            <Pressable
              key={w.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(w.id);
              }}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {w.id === 'unknown' ? '?' : w.id.charAt(0).toUpperCase() + w.id.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.wallStripPanel}>
        <ThermalStrip thickness={active.id} />
        <View style={styles.wallStripText}>
          <Text style={styles.wallStripTitle}>{active.name}</Text>
          <Text style={styles.wallStripModifier}>
            {active.modifier_f === 0 ? '0' : active.modifier_f > 0 ? `+${active.modifier_f}` : active.modifier_f}°F modifier
          </Text>
        </View>
      </View>

      <View style={styles.thermalPanel}>
        <Text style={styles.thermalNote}>{active.description}</Text>
        {active.thickness_mm_range ? (
          <Text style={styles.calibrationNote}>Range: {active.thickness_mm_range} mm</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

// Visual quartz strip that gets thicker as the wall grows — pure SVG.
function ThermalStrip({ thickness }: { thickness: WallThicknessId }) {
  // Map each id to a stroke width visually.
  const strokeMap: Record<WallThicknessId, number> = {
    thin: 4,
    standard: 8,
    thick: 14,
    unknown: 8,
  };
  const w = strokeMap[thickness];
  return (
    <Svg width={88} height={56} viewBox="0 0 88 56">
      <SvgRect
        x={(88 - w) / 2}
        y={6}
        width={w}
        height={44}
        rx={2}
        fill={colors.surface5}
        stroke={colors.bone35}
        strokeWidth={1}
      />
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 3 — Concentrate
// ──────────────────────────────────────────────────────────────────────────────

interface ConcentrateStepProps {
  concentrateId: string | null;
  onSelect: (id: string) => void;
}

function ConcentrateStep({ concentrateId, onSelect }: ConcentrateStepProps) {
  const groups = useMemo(() => {
    return CONCENTRATE_CATEGORY_ORDER.map((category) => ({
      category,
      items: CONCENTRATES.filter((c) => c.category === category),
    })).filter((g) => g.items.length > 0);
  }, []);

  return (
    <ScrollView
      style={styles.stepRoot}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {groups.map((g) => (
        <View key={g.category} style={{ gap: spacing.sm }}>
          <Text style={styles.labelCaps}>{CONCENTRATE_CATEGORY_LABELS[g.category]}</Text>
          <View style={styles.swatchGrid}>
            {g.items.map((c) => (
              <ConcentrateSwatch
                key={c.id}
                concentrate={c}
                active={c.id === concentrateId}
                onSelect={onSelect}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

interface ConcentrateSwatchProps {
  concentrate: Concentrate;
  active: boolean;
  onSelect: (id: string) => void;
}

function ConcentrateSwatch({ concentrate, active, onSelect }: ConcentrateSwatchProps) {
  const dabbable = isDabbable(concentrate);
  const [color1, color2] = CATEGORY_SWATCH_COLORS[concentrate.category];
  const hasWarning = concentrate.warning != null;
  const topTags = concentrate.tags.slice(0, 2);

  return (
    <Pressable
      onPress={() => onSelect(concentrate.id)}
      style={[
        styles.swatch,
        active && dabbable && styles.swatchActive,
        !dabbable && styles.swatchBlocked,
      ]}
    >
      <LinearGradient
        colors={[color1, color2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.swatchGradient, !dabbable && styles.swatchGradientBlocked]}
      />
      <View style={styles.swatchTextWrap}>
        <Text
          style={[styles.swatchName, !dabbable && styles.swatchNameBlocked]}
          numberOfLines={2}
        >
          {concentrate.name}
        </Text>
        {dabbable && concentrate.surface_temp_optimal_f != null ? (
          <Text style={styles.swatchTemp}>{concentrate.surface_temp_optimal_f}°F</Text>
        ) : (
          <Text style={[styles.swatchTemp, styles.swatchTempBlocked]}>Not dabbable</Text>
        )}
        {dabbable && topTags.length > 0 ? (
          <View style={styles.swatchTagRow}>
            {topTags.map((t) => (
              <ConcentrateTagChip key={t} tag={t} />
            ))}
          </View>
        ) : null}
      </View>
      {active && dabbable ? (
        <View style={styles.checkBadge}>
          <MaterialIcons name="check" size={14} color={colors.bgDeep} />
        </View>
      ) : null}
      {hasWarning && dabbable ? (
        <View style={styles.warnBadge}>
          <Text style={styles.warnBadgeText}>⚠︎</Text>
        </View>
      ) : null}
      {!dabbable ? (
        <View style={styles.blockedBadge}>
          <MaterialIcons name="block" size={14} color={colors.error} />
        </View>
      ) : null}
    </Pressable>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4 — Tune
// ──────────────────────────────────────────────────────────────────────────────

interface TuneStepProps {
  calibration: ReturnType<typeof computeDisplayedTarget> | null;
  tempOffset: number;
  onChangeOffset: (n: number) => void;
}

function TuneStep({ calibration, tempOffset, onChangeOffset }: TuneStepProps) {
  const startOffsetRef = useRef(0);
  const lastDegRef = useRef(0);
  const lastHapticBucketRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startOffsetRef.current = lastDegRef.current;
        lastHapticBucketRef.current = Math.floor(Math.abs(lastDegRef.current) / 5);
      },
      onPanResponderMove: (_, gesture) => {
        // drag up (negative dy) → warmer
        const delta = -Math.round(gesture.dy / PX_PER_DEGREE);
        const next = Math.max(
          -TEMP_RANGE,
          Math.min(TEMP_RANGE, startOffsetRef.current + delta),
        );
        if (next !== lastDegRef.current) {
          const bucket = Math.floor(Math.abs(next) / 5);
          if (bucket !== lastHapticBucketRef.current) {
            lastHapticBucketRef.current = bucket;
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          lastDegRef.current = next;
          onChangeOffset(next);
        }
      },
      onPanResponderRelease: () => {
        startOffsetRef.current = lastDegRef.current;
      },
    }),
  ).current;

  // Keep refs synced if outer state changes (e.g. step re-entry)
  useEffect(() => {
    lastDegRef.current = tempOffset;
    startOffsetRef.current = tempOffset;
  }, [tempOffset]);

  const finalTemp = calibration?.displayedF ?? 0;
  const trace = calibration?.trace ?? [];

  return (
    <ScrollView
      style={styles.stepRoot}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.tempBlock} {...panResponder.panHandlers}>
        <Text style={[styles.tempValue, { color: tempColorFor(tempOffset) }]}>
          {finalTemp}°
        </Text>
        <Text style={styles.tempHint}>Drag to fine-tune</Text>
        <ThermalGauge offset={tempOffset} />
      </View>

      <View style={styles.thermalPanel}>
        <Text style={styles.labelCaps}>Calibration breakdown</Text>
        {trace.length > 0 ? (
          trace.map((line, idx) => (
            <Text key={idx} style={styles.traceLine}>
              {line}
            </Text>
          ))
        ) : (
          <Text style={styles.thermalNote}>
            Pick a banger and concentrate to see the displayed-target math.
          </Text>
        )}
        {calibration && calibration.warnings.length > 0 ? (
          <View style={styles.warningBlock}>
            {calibration.warnings.map((w, idx) => (
              <Text key={idx} style={styles.warningText}>
                ⚠︎ {w}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 5 — Save
// ──────────────────────────────────────────────────────────────────────────────

interface SaveStepProps {
  presetName: string;
  onChangeName: (s: string) => void;
  banger: Banger | null;
  concentrate: Concentrate | null;
  finalTemp: number;
  dunkTemp: number;
  gemColor: string;
  onSelectGem: (c: string) => void;
  coldStartCompatible: boolean;
  useColdStart: boolean;
  onToggleColdStart: () => void;
}

function SaveStep({
  presetName,
  onChangeName,
  banger,
  concentrate,
  finalTemp,
  dunkTemp,
  gemColor,
  onSelectGem,
  coldStartCompatible,
  useColdStart,
  onToggleColdStart,
}: SaveStepProps) {
  const iconName = GEM_ICONS[gemColor] ?? 'diamond';

  const orbScale = useSharedValue(1);
  const orbPulse = useSharedValue(1);
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value * orbPulse.value }],
  }));

  useEffect(() => {
    orbScale.value = withSequence(
      withSpring(1.12, { damping: 8, stiffness: 300, mass: 0.4 }),
      withSpring(1, { damping: 14, stiffness: 280, mass: 0.5 }),
    );
  }, [gemColor, orbScale]);

  useEffect(() => {
    orbPulse.value = withRepeat(
      withSequence(
        withTiming(1.035, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => {
      orbPulse.value = 1;
    };
  }, [orbPulse]);

  return (
    <ScrollView
      style={styles.stepRoot}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroSection}>
        <Animated.View
          style={[
            styles.heroOrb,
            { backgroundColor: gemColor, shadowColor: gemColor },
            orbStyle,
          ]}
        >
          <MaterialIcons name={iconName} size={36} color={colors.bgDeep} />
        </Animated.View>
        <Text style={styles.heroSummary}>
          {concentrate?.name ?? '—'} · {banger?.name ?? '—'}
        </Text>
        <View style={styles.heroTempRow}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.labelCaps}>Dab</Text>
            <Text style={[styles.heroTemp, { color: colors.emberBright }]}>{finalTemp}°</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.labelCaps}>Dunk</Text>
            <Text style={[styles.heroTemp, { color: colors.quartzBright }]}>{dunkTemp}°</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.labelCaps}>Name</Text>
        <TextInput
          style={styles.input}
          value={presetName}
          onChangeText={onChangeName}
          placeholder="Preset name"
          placeholderTextColor={colors.bone35}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.labelCaps}>Gem color</Text>
        <View style={styles.gemRow}>
          {GEM_COLORS.map((c) => {
            const active = c === gemColor;
            return (
              <Pressable
                key={c}
                onPress={() => onSelectGem(c)}
                style={[styles.gemRing, active && styles.gemRingActive]}
              >
                <View style={[styles.gemDot, { backgroundColor: c }]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={coldStartCompatible ? onToggleColdStart : undefined}
        disabled={!coldStartCompatible}
        style={[
          styles.coldStartRow,
          !coldStartCompatible && styles.coldStartRowDisabled,
          useColdStart && coldStartCompatible && styles.coldStartRowActive,
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.coldStartLabel}>Use cold start</Text>
          <Text style={styles.coldStartHint}>
            {coldStartCompatible
              ? 'Load now, heat low — protects terps on this combo.'
              : 'Not compatible with this banger × concentrate.'}
          </Text>
        </View>
        <View
          style={[
            styles.toggle,
            useColdStart && coldStartCompatible && styles.toggleOn,
            !coldStartCompatible && styles.toggleDisabled,
          ]}
        >
          <View
            style={[
              styles.toggleKnob,
              useColdStart && coldStartCompatible && styles.toggleKnobOn,
            ]}
          />
        </View>
      </Pressable>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Thermal Gauge
// ──────────────────────────────────────────────────────────────────────────────

const GAUGE_W = 216;
const GAUGE_PAD = 20;
const GAUGE_TRACK_Y = 14;
const GAUGE_PX_PER_DEG = (GAUGE_W - GAUGE_PAD * 2) / (TEMP_RANGE * 2);

function ThermalGauge({ offset }: { offset: number }) {
  const cx = GAUGE_W / 2;
  const cursorX = cx + offset * GAUGE_PX_PER_DEG;
  const fillLeft = Math.min(cx, cursorX);
  const fillW = Math.abs(offset) * GAUGE_PX_PER_DEG;
  const isWarm = offset > 0;
  const fillColor = isWarm ? colors.ember : colors.quartz;
  const cursorColor = isWarm
    ? colors.emberBright
    : offset < 0
      ? colors.quartzBright
      : colors.bone35;

  return (
    <Svg width={GAUGE_W} height={28} style={{ marginTop: 12 }}>
      {/* Track */}
      <SvgRect
        x={GAUGE_PAD}
        y={GAUGE_TRACK_Y}
        width={GAUGE_W - GAUGE_PAD * 2}
        height={2}
        rx={1}
        fill={colors.surface5}
      />
      {/* Fill */}
      {fillW > 0.5 && (
        <SvgRect
          x={fillLeft}
          y={GAUGE_TRACK_Y}
          width={fillW}
          height={2}
          rx={1}
          fill={fillColor}
          opacity={0.75}
        />
      )}
      {/* Center marker */}
      <SvgRect
        x={cx - 0.75}
        y={GAUGE_TRACK_Y - 4}
        width={1.5}
        height={10}
        rx={0.75}
        fill={colors.bone35}
      />
      {/* Minor ticks at ±10, ±20 */}
      {[-20, -10, 10, 20].map((d) => (
        <SvgRect
          key={d}
          x={cx + d * GAUGE_PX_PER_DEG - 0.5}
          y={GAUGE_TRACK_Y - 2}
          width={1}
          height={6}
          rx={0.5}
          fill={colors.bone20}
        />
      ))}
      {/* Cursor */}
      <SvgRect
        x={cursorX - 1}
        y={GAUGE_TRACK_Y - 6}
        width={2}
        height={14}
        rx={1}
        fill={cursorColor}
      />
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────────

const labelCaps = {
  fontSize: 10,
  fontWeight: '500' as const,
  letterSpacing: 2.2,
  textTransform: 'uppercase' as const,
  color: colors.bone50,
};

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    color: colors.bone100,
    fontSize: 18,
    fontWeight: '400',
    marginTop: 2,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 6,
    marginBottom: spacing.sm,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepSegmentEmpty: {
    backgroundColor: colors.surface2,
  },
  stepSegmentActive: {
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },

  // Body
  body: { flex: 1 },
  stepRoot: { flex: 1 },

  // Footer
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  cta: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaDisabled: {
    backgroundColor: colors.surface2,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    color: colors.bone100,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  ctaLabelDisabled: {
    color: colors.bone35,
  },

  // Banger step
  bangerCard: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: colors.surface3,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.bone35,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bangerCardActive: {
    borderColor: colors.emberBright,
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  bangerDiagramFrame: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bangerName: {
    color: colors.bone100,
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  bangerSpec: {
    color: colors.bone50,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  bangerGeometryLine: {
    color: colors.bone90,
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  bangerSpecRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  bangerSpecCell: {
    gap: 2,
  },
  bangerSpecValue: {
    color: colors.bone100,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface5,
    borderWidth: 0.5,
    borderColor: colors.bone35,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.4,
    color: colors.bone90,
    textTransform: 'uppercase',
  },
  dotRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginVertical: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bone20,
  },
  dotActive: {
    backgroundColor: colors.emberBright,
    width: 18,
  },
  thermalPanel: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface3,
    borderColor: colors.bone35,
    borderWidth: 0.5,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  thermalNote: {
    color: colors.bone70,
    fontSize: 13,
    lineHeight: 18,
  },
  calibrationNote: {
    color: colors.bone50,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },

  // Sensor / Wall chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 0.5,
    borderColor: colors.bone35,
    backgroundColor: colors.surface3,
  },
  chipActive: {
    borderColor: colors.emberBright,
    borderWidth: 1.5,
    backgroundColor: colors.surface4,
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  chipLabel: {
    color: colors.bone70,
    fontSize: 13,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: colors.bone100,
  },

  // Wall strip panel
  wallStripPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.bone35,
  },
  wallStripText: {
    flex: 1,
    gap: 2,
  },
  wallStripTitle: {
    color: colors.bone100,
    fontSize: 16,
    fontWeight: '500',
  },
  wallStripModifier: {
    color: colors.emberBright,
    fontSize: 13,
    fontWeight: '500',
  },

  // Concentrate / extract step
  labelCaps: {
    ...labelCaps,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: '48%',
    minHeight: 96,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.bone35,
    backgroundColor: colors.surface3,
  },
  swatchActive: {
    borderColor: colors.emberBright,
    borderWidth: 1.5,
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  swatchBlocked: {
    borderColor: colors.bone20,
    opacity: 0.55,
  },
  swatchGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  swatchGradientBlocked: {
    opacity: 0.12,
  },
  swatchTextWrap: {
    flex: 1,
    padding: spacing.sm,
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  swatchName: {
    color: colors.bone100,
    fontSize: 13,
    fontWeight: '500',
  },
  swatchNameBlocked: {
    color: colors.bone50,
  },
  swatchTemp: {
    color: colors.bone90,
    fontSize: 12,
  },
  swatchTempBlocked: {
    color: colors.error,
    fontStyle: 'italic',
  },
  swatchTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.emberBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBadgeText: {
    color: colors.bgDeep,
    fontSize: 11,
    fontWeight: '700',
  },
  blockedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface5,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tune step
  tempBlock: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  tempValue: {
    color: colors.bone100,
    fontSize: 120,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Times New Roman', default: 'serif' }),
    letterSpacing: -2,
  },
  tempHint: {
    ...labelCaps,
    marginTop: spacing.sm,
  },
  traceLine: {
    color: colors.bone90,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  warningBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.bone20,
    gap: spacing.xs,
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.bone35,
    backgroundColor: colors.surface3,
    paddingHorizontal: spacing.md,
    color: colors.bone100,
    fontSize: 15,
  },
  // Save step
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  heroOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
  },
  heroTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  heroTemp: {
    fontSize: 32,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Times New Roman', default: 'serif' }),
  },
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.bone20,
  },
  heroSummary: {
    color: colors.bone70,
    fontSize: 13,
    textAlign: 'center',
  },
  gemRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gemRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gemRingActive: {
    borderColor: colors.emberBright,
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  gemDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // Save error toast
  saveErrorToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface4,
    borderWidth: 0.5,
    borderColor: colors.error,
  },
  saveErrorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
  },
  saveErrorDismiss: {
    fontSize: 12,
    color: colors.bone50,
    fontWeight: '500',
    paddingLeft: 12,
  },

  // Cold-start toggle
  coldStartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.bone35,
  },
  coldStartRowDisabled: {
    opacity: 0.55,
  },
  coldStartRowActive: {
    borderColor: colors.emberBright,
  },
  coldStartLabel: {
    color: colors.bone100,
    fontSize: 15,
    fontWeight: '500',
  },
  coldStartHint: {
    color: colors.bone70,
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface5,
    borderWidth: 0.5,
    borderColor: colors.bone35,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: colors.ember,
    borderColor: colors.emberBright,
  },
  toggleDisabled: {
    backgroundColor: colors.surface3,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bone70,
    alignSelf: 'flex-start',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.bone100,
  },
});
