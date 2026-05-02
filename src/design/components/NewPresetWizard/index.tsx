import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import { colors, spacing, radius } from '../../tokens';
import * as presetsDb from '../../../db/presets';
import { DEFAULT_SETTINGS } from '../../../ble/types';
import { BANGERS, findBanger, type Banger } from '../../../data/bangers';
import {
  findConcentrate,
  isDabbable,
  type Concentrate,
} from '../../../data/concentrates';
import { SENSORS, findSensor, type Sensor } from '../../../data/sensors';
import {
  WALL_THICKNESSES,
  findWallThickness,
  type WallThickness,
  type WallThicknessId,
} from '../../../data/wallThicknesses';
import { computeDisplayedTarget, coldStartAvailable } from '../../../utils/calibration';
import { useDabPreferencesStore } from '../../../state/dabPreferencesStore';
import { BlockedConcentrateExplainer } from '../BlockedConcentrateExplainer';

import { GEM_COLORS, STEP_COUNT, STEP_TITLES } from './constants';
import { styles } from './styles';
import type { NewPresetWizardProps } from './types';
import { StepBanger } from './StepBanger';
import { StepSensor } from './StepSensor';
import { StepWall } from './StepWall';
import { StepConcentrate } from './StepConcentrate';
import { StepTune } from './StepTune';
import { StepSave } from './StepSave';

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
// Orchestrator
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

  const coldStartCompatible =
    banger && concentrate && !concentrateIsBlocked
      ? coldStartAvailable(concentrate, banger)
      : false;

  useEffect(() => {
    if (coldStartTouched) return;
    setUseColdStart(coldStartCompatible && coldStartByDefault);
  }, [coldStartCompatible, coldStartByDefault, coldStartTouched]);

  useEffect(() => {
    if (!coldStartCompatible && useColdStart) {
      setUseColdStart(false);
    }
  }, [coldStartCompatible, useColdStart]);

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

  const handleConcentrateSelect = useCallback(
    (id: string) => {
      const c = findConcentrate(id);
      if (!c) return;
      if (!isDabbable(c)) {
        setBlockedModalId(id);
        setConcentrateId(null);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConcentrateId(id);
    },
    [],
  );

  const stepTitle = STEP_TITLES[step] ?? '';
  const ctaLabel = step === STEP_COUNT - 1 ? 'Save preset' : 'Continue →';

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <WizardHeader title={stepTitle} onBack={goBack} onClose={goClose} />
        <StepIndicator step={step} />

        <Animated.View style={[styles.body, stepStyle]}>
          {step === 0 && <StepBanger bangerId={bangerId} onSelect={setBangerId} />}
          {step === 1 && (
            <StepSensor
              sensorId={sensorId}
              onSelect={setSensorId}
              banger={banger}
              sensor={sensor}
            />
          )}
          {step === 2 && <StepWall wallId={wallId} onSelect={setWallId} />}
          {step === 3 && (
            <StepConcentrate
              concentrateId={concentrateId}
              onSelect={handleConcentrateSelect}
            />
          )}
          {step === 4 && (
            <StepTune
              calibration={calibration}
              tempOffset={tuneOffset}
              onChangeOffset={setTuneOffset}
            />
          )}
          {step === 5 && (
            <StepSave
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

export default NewPresetWizard;
