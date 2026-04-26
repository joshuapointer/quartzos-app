import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import { QuartzBackground } from '../../../src/design';
import { colors, radius, spacing } from '../../../src/design/tokens';
import * as presetsDb from '../../../src/db/presets';
import { DEFAULT_SETTINGS } from '../../../src/ble/types';

// ──────────────────────────────────────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────────────────────────────────────

type BangerId =
  | 'classic'
  | 'opaque'
  | 'thick'
  | 'slurper'
  | 'controlTower'
  | 'blender';

interface Banger {
  id: BangerId;
  name: string;
  modifier: number;
  note: string;
  spec: string;
}

const BANGERS: Banger[] = [
  {
    id: 'classic',
    name: 'Classic Bucket',
    modifier: 0,
    note: 'Standard heat retention. IR sensor reads the bottom perfectly.',
    spec: 'Flat 25mm bottom · Quartz · 4mm wall',
  },
  {
    id: 'opaque',
    name: 'Opaque Bottom',
    modifier: 10,
    note: 'Porous base speeds nucleation. Loses heat slightly faster.',
    spec: 'Sandblasted base · Quartz · 4mm wall',
  },
  {
    id: 'thick',
    name: 'Thick Bottom',
    modifier: -10,
    note: 'Massive thermal mass. Resists cooling during heavy draws.',
    spec: '8mm base · Quartz · 4mm wall',
  },
  {
    id: 'slurper',
    name: 'Terp Slurper',
    modifier: 35,
    note: 'Oil travels up cooler column. Dish requires temp bump.',
    spec: 'Slotted dish · 3-tier · Quartz',
  },
  {
    id: 'controlTower',
    name: 'Control Tower',
    modifier: 45,
    note: 'Maximum travel distance. Requires hottest dish reading.',
    spec: 'Multi-channel · Vertical · Quartz',
  },
  {
    id: 'blender',
    name: 'Blender',
    modifier: 25,
    note: 'Round bottom with spinning carb cap. Wide oil distribution.',
    spec: 'Round bottom · 30mm · Quartz',
  },
];

type ExtractType = 'Solventless' | 'Hydrocarbon' | 'Isolate';

interface Extract {
  id: string;
  name: string;
  type: ExtractType;
  baseTemp: number;
  color1: string;
  color2: string;
}

const EXTRACTS: Extract[] = [
  // Solventless
  { id: 'fullMelt', name: '6-Star Melt', type: 'Solventless', baseTemp: 450, color1: '#E8DEC0', color2: '#C0AC78' },
  { id: 'rosin', name: 'Rosin', type: 'Solventless', baseTemp: 465, color1: '#B8944C', color2: '#7A5C28' },
  { id: 'liveRosin', name: 'Live Rosin', type: 'Solventless', baseTemp: 460, color1: '#C4A860', color2: '#886030' },
  { id: 'hashRosin', name: 'Hash Rosin', type: 'Solventless', baseTemp: 455, color1: '#C09050', color2: '#7C5420' },
  { id: 'freshPress', name: 'Fresh Press', type: 'Solventless', baseTemp: 470, color1: '#D4C278', color2: '#A58C50' },
  { id: 'coldCure', name: 'Cold Cure', type: 'Solventless', baseTemp: 485, color1: '#C4AC74', color2: '#7D6840' },
  // Hydrocarbon
  { id: 'liveResin', name: 'Live Resin', type: 'Hydrocarbon', baseTemp: 505, color1: '#B8782C', color2: '#704820' },
  { id: 'badder', name: 'Badder', type: 'Hydrocarbon', baseTemp: 495, color1: '#CC9038', color2: '#885820' },
  { id: 'terpSauce', name: 'Terp Sauce', type: 'Hydrocarbon', baseTemp: 510, color1: '#A86C24', color2: '#5C3810' },
  { id: 'shatter', name: 'Shatter', type: 'Hydrocarbon', baseTemp: 515, color1: '#A06830', color2: '#604030' },
  { id: 'crumble', name: 'Crumble', type: 'Hydrocarbon', baseTemp: 520, color1: '#946040', color2: '#583828' },
  // Isolate
  { id: 'diamonds', name: 'Diamonds', type: 'Isolate', baseTemp: 530, color1: '#D8E4EC', color2: '#A8C0D4' },
  { id: 'thca', name: 'THCa Powder', type: 'Isolate', baseTemp: 540, color1: '#F0ECD8', color2: '#C8C0A8' },
  { id: 'distillate', name: 'Distillate', type: 'Isolate', baseTemp: 545, color1: '#C8D8E8', color2: '#8898A8' },
];

const EXTRACT_TYPES: ExtractType[] = ['Solventless', 'Hydrocarbon', 'Isolate'];

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
const STEP_COUNT = 4;
const TEMP_RANGE = 30;
const PX_PER_DEGREE = 4;

// ──────────────────────────────────────────────────────────────────────────────
// Screen
// ──────────────────────────────────────────────────────────────────────────────

export default function NewPresetWizardScreen() {
  const [step, setStep] = useState(0);
  const [bangerId, setBangerId] = useState<BangerId | null>(null);
  const [extractId, setExtractId] = useState<string | null>(null);
  const [tempOffset, setTempOffset] = useState(0);
  const [presetName, setPresetName] = useState('');
  const [gemColor, setGemColor] = useState<string>(GEM_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const banger = useMemo(
    () => (bangerId ? BANGERS.find((b) => b.id === bangerId) ?? null : null),
    [bangerId]
  );
  const extract = useMemo(
    () => (extractId ? EXTRACTS.find((e) => e.id === extractId) ?? null : null),
    [extractId]
  );

  const baseTemp = banger && extract ? extract.baseTemp + banger.modifier : 0;
  const finalTemp = baseTemp + tempOffset;
  const dunkTemp = Math.max(200, Math.min(320, finalTemp - 280));

  // Auto-name when banger + extract chosen the first time
  useEffect(() => {
    if (banger && extract && !presetName) {
      setPresetName(`${extract.name} · ${banger.name.split(' ')[0]}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bangerId, extractId]);

  const canAdvance = useMemo(() => {
    if (step === 0) return bangerId !== null;
    if (step === 1) return extractId !== null;
    if (step === 2) return true;
    if (step === 3) return presetName.trim().length > 0;
    return false;
  }, [step, bangerId, extractId, presetName]);

  const stepOpacity = useSharedValue(1);
  const stepStyle = useAnimatedStyle(() => ({ opacity: stepOpacity.value }));

  const goBack = useCallback(() => {
    if (step === 0) {
      router.back();
      return;
    }
    const prevStep = Math.max(0, step - 1);
    stepOpacity.value = withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }, (done) => {
      if (done) runOnJS(setStep)(prevStep);
    });
  }, [step, stepOpacity]);

  const goClose = useCallback(() => {
    router.back();
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = presetName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const settings = {
        ...DEFAULT_SETTINGS,
        dabAlarmF: finalTemp,
        dunkAlarmF: dunkTemp,
        opaqueMode: bangerId === 'opaque',
      };
      const saved = await presetsDb.create(trimmed, settings);
      const gemIdx = GEM_COLORS.indexOf(gemColor);
      if (gemIdx >= 0) {
        await presetsDb.update(saved.id, { iconSlot: gemIdx });
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Save failed', 'Could not save preset. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [presetName, finalTemp, dunkTemp, bangerId, gemColor]);

  const goNext = useCallback(() => {
    if (!canAdvance) return;
    if (step === STEP_COUNT - 1) {
      void handleSave();
      return;
    }
    const nextStep = Math.min(STEP_COUNT - 1, step + 1);
    stepOpacity.value = withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }, (done) => {
      if (done) runOnJS(setStep)(nextStep);
    });
  }, [canAdvance, step, handleSave, stepOpacity]);

  useEffect(() => {
    stepOpacity.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
  }, [step, stepOpacity]);

  const stepTitle = ['Pick your hardware', 'What are you dabbing?', 'Tune your window', 'Save your preset'][step];
  const ctaLabel = step === STEP_COUNT - 1 ? 'Save preset' : 'Continue →';

  return (
    <QuartzBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <WizardHeader
            title={stepTitle}
            onBack={goBack}
            onClose={goClose}
          />
          <StepIndicator step={step} />

          <Animated.View style={[styles.body, stepStyle]}>
            {step === 0 && (
              <BangerStep bangerId={bangerId} onSelect={setBangerId} />
            )}
            {step === 1 && (
              <ExtractStep extractId={extractId} onSelect={setExtractId} />
            )}
            {step === 2 && (
              <TuneStep
                banger={banger}
                extract={extract}
                tempOffset={tempOffset}
                onChangeOffset={setTempOffset}
                finalTemp={finalTemp}
              />
            )}
            {step === 3 && (
              <SaveStep
                presetName={presetName}
                onChangeName={setPresetName}
                banger={banger}
                extract={extract}
                finalTemp={finalTemp}
                dunkTemp={dunkTemp}
                gemColor={gemColor}
                onSelectGem={setGemColor}
              />
            )}
          </Animated.View>

          <WizardFooter
            label={ctaLabel}
            disabled={!canAdvance || saving}
            loading={saving}
            onPress={goNext}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </QuartzBackground>
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
              style={[
                styles.stepSegment,
                active && styles.stepSegmentActive,
              ]}
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
        <Text
          style={[
            styles.ctaLabel,
            disabled && styles.ctaLabelDisabled,
          ]}
        >
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
  bangerId: BangerId | null;
  onSelect: (id: BangerId) => void;
}

function BangerStep({ bangerId, onSelect }: BangerStepProps) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const stride = CARD_W + CARD_GAP;
  const sidePad = (windowWidth - CARD_W) / 2;

  const activeIndex = useMemo(() => {
    const idx = BANGERS.findIndex((b) => b.id === bangerId);
    return idx === -1 ? 0 : idx;
  }, [bangerId]);

  // Auto-scroll to selection when it changes via tap
  useEffect(() => {
    if (!bangerId) return;
    scrollRef.current?.scrollTo({ x: activeIndex * stride, animated: true });
  }, [bangerId, activeIndex, stride]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / stride);
    const clamped = Math.max(0, Math.min(BANGERS.length - 1, index));
    const target = BANGERS[clamped];
    if (target && target.id !== bangerId) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(target.id);
    }
  };

  const banger = BANGERS.find((b) => b.id === bangerId) ?? null;

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
        {BANGERS.map((b) => {
          const active = b.id === bangerId;
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
              <View style={styles.bangerDiagramFrame}>
                <BangerDiagram id={b.id} active={active} />
              </View>
              <Text style={styles.bangerName} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={styles.bangerSpec} numberOfLines={2}>
                {b.spec}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.dotRow}>
        {BANGERS.map((b, i) => (
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
        <Text style={styles.labelCaps}>Thermal modifier</Text>
        {banger ? (
          <>
            <Text style={styles.thermalValue}>
              {banger.modifier > 0 ? '+' : ''}
              {banger.modifier}°F
            </Text>
            <Text style={styles.thermalNote}>{banger.note}</Text>
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

// Simple View-based diagram of the banger shape
function BangerDiagram({ id, active }: { id: BangerId; active: boolean }) {
  const stroke = active ? colors.emberBright : colors.bone35;
  const glow = active
    ? {
        shadowColor: colors.emberBright,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      }
    : null;

  if (id === 'classic') {
    return (
      <View style={[styles.diagBox, glow]}>
        <View
          style={{
            width: 80,
            height: 60,
            borderColor: stroke,
            borderWidth: 0,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderBottomWidth: 4,
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
          }}
        />
      </View>
    );
  }
  if (id === 'opaque') {
    return (
      <View style={[styles.diagBox, glow]}>
        <View
          style={{
            width: 80,
            height: 60,
            borderColor: stroke,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderBottomWidth: 6,
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />
      </View>
    );
  }
  if (id === 'thick') {
    return (
      <View style={[styles.diagBox, glow]}>
        <View
          style={{
            width: 80,
            height: 60,
            borderColor: stroke,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderBottomWidth: 10,
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
          }}
        />
      </View>
    );
  }
  if (id === 'slurper') {
    return (
      <View style={[styles.diagBox, glow]}>
        <View
          style={{
            width: 18,
            height: 50,
            borderColor: stroke,
            borderWidth: 2,
            borderRadius: 4,
            marginBottom: 4,
          }}
        />
        <View
          style={{
            width: 70,
            height: 14,
            borderColor: stroke,
            borderWidth: 2,
            borderRadius: 8,
          }}
        />
      </View>
    );
  }
  if (id === 'controlTower') {
    return (
      <View style={[styles.diagBox, glow]}>
        <View
          style={{
            width: 10,
            height: 56,
            borderColor: stroke,
            borderWidth: 2,
            borderRadius: 3,
            marginBottom: 4,
          }}
        />
        <View
          style={{
            width: 60,
            height: 12,
            borderColor: stroke,
            borderWidth: 2,
            borderRadius: 6,
          }}
        />
      </View>
    );
  }
  // blender
  return (
    <View style={[styles.diagBox, glow]}>
      <View
        style={{
          width: 12,
          height: 28,
          borderColor: stroke,
          borderWidth: 2,
          borderRadius: 3,
          marginBottom: 2,
        }}
      />
      <View
        style={{
          width: 60,
          height: 60,
          borderColor: stroke,
          borderWidth: 2,
          borderRadius: 30,
        }}
      />
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 1 — Extract
// ──────────────────────────────────────────────────────────────────────────────

interface ExtractStepProps {
  extractId: string | null;
  onSelect: (id: string) => void;
}

function ExtractStep({ extractId, onSelect }: ExtractStepProps) {
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
      {EXTRACT_TYPES.map((type) => {
        const items = EXTRACTS.filter((e) => e.type === type);
        return (
          <View key={type} style={{ gap: spacing.sm }}>
            <Text style={styles.labelCaps}>{type}</Text>
            <View style={styles.swatchGrid}>
              {items.map((e) => {
                const active = e.id === extractId;
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onSelect(e.id);
                    }}
                    style={[styles.swatch, active && styles.swatchActive]}
                  >
                    <LinearGradient
                      colors={[e.color1, e.color2]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.swatchGradient}
                    />
                    <View style={styles.swatchTextWrap}>
                      <Text style={styles.swatchName} numberOfLines={1}>
                        {e.name}
                      </Text>
                      <Text style={styles.swatchTemp}>{e.baseTemp}°F</Text>
                    </View>
                    {active ? (
                      <View style={styles.checkBadge}>
                        <MaterialIcons name="check" size={14} color={colors.bgDeep} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 2 — Tune
// ──────────────────────────────────────────────────────────────────────────────

interface TuneStepProps {
  banger: Banger | null;
  extract: Extract | null;
  tempOffset: number;
  onChangeOffset: (n: number) => void;
  finalTemp: number;
}

function TuneStep({
  banger,
  extract,
  tempOffset,
  onChangeOffset,
  finalTemp,
}: TuneStepProps) {
  const startOffsetRef = useRef(0);
  const lastDegRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startOffsetRef.current = lastDegRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        // drag up (negative dy) → warmer
        const delta = -Math.round(gesture.dy / PX_PER_DEGREE);
        const next = Math.max(
          -TEMP_RANGE,
          Math.min(TEMP_RANGE, startOffsetRef.current + delta)
        );
        if (next !== lastDegRef.current) {
          lastDegRef.current = next;
          onChangeOffset(next);
        }
      },
      onPanResponderRelease: () => {
        startOffsetRef.current = lastDegRef.current;
      },
    })
  ).current;

  // Keep refs synced if outer state changes (e.g. step re-entry)
  useEffect(() => {
    lastDegRef.current = tempOffset;
    startOffsetRef.current = tempOffset;
  }, [tempOffset]);

  const baseTemp = banger && extract ? extract.baseTemp + banger.modifier : 0;

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
        <Text style={styles.tempValue}>{finalTemp}°</Text>
        <Text style={styles.tempHint}>DRAG UP WARMER · DOWN COOLER</Text>
      </View>

      <View style={styles.thermalPanel}>
        <Text style={styles.labelCaps}>Thermal logic</Text>
        <Text style={styles.logicLine}>
          Extract base{' '}
          <Text style={styles.logicNum}>{extract ? `${extract.baseTemp}°` : '—'}</Text>
          {' · '}Banger modifier{' '}
          <Text style={styles.logicNum}>
            {banger
              ? `${banger.modifier > 0 ? '+' : ''}${banger.modifier}°`
              : '—'}
          </Text>
          {' · '}your tune{' '}
          <Text style={styles.logicNum}>
            {tempOffset > 0 ? '+' : ''}
            {tempOffset}°
          </Text>
          {' = '}
          <Text style={styles.logicTotal}>{finalTemp}°F</Text>
        </Text>
        {baseTemp > 0 ? (
          <Text style={styles.logicSub}>Computed base before tune: {baseTemp}°F</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 3 — Save
// ──────────────────────────────────────────────────────────────────────────────

interface SaveStepProps {
  presetName: string;
  onChangeName: (s: string) => void;
  banger: Banger | null;
  extract: Extract | null;
  finalTemp: number;
  dunkTemp: number;
  gemColor: string;
  onSelectGem: (c: string) => void;
}

function SaveStep({
  presetName,
  onChangeName,
  banger,
  extract,
  finalTemp,
  dunkTemp,
  gemColor,
  onSelectGem,
}: SaveStepProps) {
  const iconName = GEM_ICONS[gemColor] ?? 'diamond';

  const orbScale = useSharedValue(1);
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  useEffect(() => {
    orbScale.value = withSequence(
      withSpring(1.1, { damping: 10, stiffness: 300, mass: 0.5 }),
      withSpring(1, { damping: 12, stiffness: 280, mass: 0.5 }),
    );
  }, [gemColor, orbScale]);

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
        <Animated.View style={[styles.heroOrb, { backgroundColor: gemColor, shadowColor: gemColor }, orbStyle]}>
          <MaterialIcons name={iconName} size={36} color={colors.bgDeep} />
        </Animated.View>
        <Text style={styles.heroSummary}>
          {extract?.name ?? '—'} · {banger?.name ?? '—'}
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
                style={[
                  styles.gemRing,
                  active && styles.gemRingActive,
                ]}
              >
                <View style={[styles.gemDot, { backgroundColor: c }]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
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
  safe: { flex: 1 },
  kav: { flex: 1 },

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
  diagBox: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 90,
  },
  bangerName: {
    color: colors.bone100,
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.sm,
  },
  bangerSpec: {
    color: colors.bone50,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  dotRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginVertical: spacing.sm,
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
  thermalValue: {
    color: colors.emberBright,
    fontSize: 28,
    fontWeight: '300',
  },
  thermalNote: {
    color: colors.bone70,
    fontSize: 13,
    lineHeight: 18,
  },

  // Extract step
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
    height: 72,
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
  swatchGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  swatchTextWrap: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  swatchName: {
    color: colors.bone100,
    fontSize: 14,
    fontWeight: '500',
  },
  swatchTemp: {
    color: colors.bone90,
    fontSize: 12,
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
  logicLine: {
    color: colors.bone70,
    fontSize: 13,
    lineHeight: 19,
  },
  logicNum: {
    color: colors.bone100,
    fontWeight: '500',
  },
  logicTotal: {
    color: colors.emberBright,
    fontWeight: '600',
  },
  logicSub: {
    color: colors.bone50,
    fontSize: 11,
    marginTop: 2,
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
});
