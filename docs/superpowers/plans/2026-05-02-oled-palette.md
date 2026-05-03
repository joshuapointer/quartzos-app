# OLED · White-Hot Neon Edge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the app palette from warm-obsidian to OLED black + white-hot neon edge, preserving the cool quartz-cyan accent for dunk states. No more orange anywhere.

**Architecture:** Token-rebind strategy — most components consume design tokens by name, so changing the *values* of tokens (`emberBright`, `firedAmber`, `warmBone`, etc.) does the bulk of the work. The remaining ~10 files contain hardcoded hex literals that need patching to use tokens. Two parallel palette files (`src/design/tokens.ts` and `src/flow/theme.ts`) are kept in lockstep.

**Tech Stack:** TypeScript, React Native (Expo SDK 54), react-native-reanimated, expo-linear-gradient, react-native-svg.

**Spec:** `docs/superpowers/specs/2026-05-02-oled-palette-design.md`

**Test framework:** None configured. Verification is per-task: (a) `npx tsc --noEmit` compiles, (b) grep confirms retired literals removed within scope of the task, (c) end-of-plan manual screen audit on iOS simulator.

**Branch:** Work on `feature/oled-white-hot` cut from `develop`.

---

## File Plan (what gets touched)

**Palette definition files (full rewrites):**
- `src/design/tokens.ts` — primary palette
- `src/design/themes.ts` — theme contract
- `src/flow/theme.ts` — flow subsystem palette

**Component rewrites (substantive):**
- `src/design/components/QBackground.tsx` — animated backdrop
- `src/design/components/SurfaceCard.tsx` — adds `glow` prop, neon-edge variants
- `src/design/components/TempDial.tsx` — PALETTE table + warm-bone RGBA cleanup

**Hex-literal patches (small, mechanical):**
- `src/design/components/QWordmark.tsx`
- `src/design/components/SessionWalkthrough/styles.ts`
- `src/design/components/SessionWalkthrough/StepIcons.tsx`
- `src/design/components/SessionWalkthrough/TorchTimer.tsx`
- `src/flow/stages/ConcChooser.tsx`
- `src/flow/data/display.ts`
- `src/flow/components/PresetRow.tsx`
- `src/flow/stages/SessionStage.tsx`

**Verification:** end-of-plan task with grep, typecheck, and manual screen audit checklist.

---

## Task 0: Branch setup

**Files:** none modified

- [ ] **Step 1: Create feature branch from develop**

```bash
git checkout develop
git pull --ff-only
git checkout -b feature/oled-white-hot
```

- [ ] **Step 2: Verify clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean`. If untracked files from prior work appear, stash or commit them on a separate branch first.

---

## Task 1: Rewrite `src/design/tokens.ts`

**Files:**
- Modify: `src/design/tokens.ts`

This file is the single source of truth for the design system. The `colors` object, `gradients` object, and `shadow.orb.shadowColor` all change. Spacing/radius/fonts/motion are unchanged.

- [ ] **Step 1: Replace the `colors` block (lines 12–158)**

Replace the entire `export const colors = { … };` block with the OLED palette below. Keep keys identical (so consumers don't break); only values change.

```ts
export const colors = {
  // ── Core backgrounds (OLED — pure black) ──
  background:              '#000000',
  surface:                 '#000000',
  surfaceDim:              '#000000',

  // ── Surface container ramp (graphite scale) ──
  surfaceContainerLowest:  '#000000',
  surfaceContainerLow:     '#0a0a0a',
  surfaceContainer:        '#111111',
  surfaceContainerHigh:    '#181818',
  surfaceContainerHighest: '#1f1f1f',
  surfaceVariant:          '#1f1f1f',

  // ── Numeric ramp (legacy aliases) ──
  bgDeep:        '#000000',
  surface1:      '#000000',
  surface2:      '#0a0a0a',
  surface3:      '#111111',
  surface4:      '#181818',
  surface5:      '#1f1f1f',
  surface6:      '#262626',
  surfaceBright: '#262626',

  // ── Typography on dark surfaces (white grayscale ramp) ──
  onBackground:      '#ffffff',
  onSurface:         '#ffffff',
  onSurfaceVariant:  '#a0a0a0',

  // ── Bone (warm-neutral typography ramp — now neutral grayscale) ──
  bone100: '#ffffff',
  bone90:  '#d4d4d4',
  bone70:  '#a0a0a0',
  bone50:  '#666666',
  bone35:  '#444444',
  bone20:  '#222222',

  // ── Primary (white-hot — heat is intensity, not hue) ──
  primary:                '#ffffff',
  onPrimary:              '#000000',
  primaryContainer:       '#e6e6e6',
  onPrimaryContainer:     '#000000',
  primaryFixed:           '#ffffff',
  primaryFixedDim:        '#ffffff',
  onPrimaryFixed:         '#000000',
  onPrimaryFixedVariant:  '#222222',

  // ── Secondary (muted cool grey-blue, unchanged) ──
  secondary:                '#c1c6d5',
  onSecondary:              '#2b313c',
  secondaryContainer:       '#414753',
  onSecondaryContainer:     '#b0b5c3',
  secondaryFixed:           '#dde2f1',
  secondaryFixedDim:        '#c1c6d5',
  onSecondaryFixed:         '#161c26',
  onSecondaryFixedVariant:  '#414753',

  // ── Tertiary (Quartz / cool blue, unchanged) ──
  tertiary:                '#95ccff',
  onTertiary:              '#003352',
  tertiaryContainer:       '#00a8ff',
  onTertiaryContainer:     '#003a5c',
  tertiaryFixed:           '#cde5ff',
  tertiaryFixedDim:        '#95ccff',
  onTertiaryFixed:         '#001d32',
  onTertiaryFixedVariant:  '#004a75',

  // ── Outlines & error ──
  outline:           '#666666',
  outlineVariant:    '#222222',
  error:             '#ff5252',
  onError:           '#000000',
  errorContainer:    '#330000',
  onErrorContainer:  '#ffd6d6',

  // ── Ember semantic ramp (heat states — now white intensity ramp) ──
  emberBright:  '#ffffff',
  ember:        '#e6e6e6',
  emberDeep:    '#1a1a1a',
  emberMid:     '#888888',
  emberCool:    '#5fa8d4',

  // ── Quartz semantic ramp (unchanged) ──
  quartzBright: '#95ccff',
  quartz:       '#00a8ff',
  quartzDeep:   '#004a75',
  quartzDim:    '#3884b8',

  // ── Brass (custom preset accent — non-orange olive-gold, retained) ──
  brass: '#C4AC54',

  // ── amberGold rebound to white (was BangerAnatomy active fill) ──
  amberGold: '#ffffff',

  // ── Inner lens colors (TempDial) ──
  lensIdle:    '#0a0a0a',
  lensHeating: '#1a1a1a',
  lensTarget:  '#2a2a2a',
  lensCooling: '#0a1218',
  lensDunk:    '#0c2640',

  // ── Semantic ──
  warning: '#ffd60a',
  success: '#7EC8A0',

  // ── Backward-compat aliases (rebound to OLED palette) ──
  inversePrimary:    '#000000',
  glassFill:         'rgba(0,0,0,0.6)',
  glassBorder:       'rgba(255,255,255,0.10)',
  heatIdle:          '#95ccff',
  heatAmber:         '#e6e6e6',
  heatGlow:          '#ffffff',
  heatCyan:          '#00a8ff',
  heatCooling:       '#5fa8d4',
  ruby:      '#ff5252',
  amethyst:  '#95ccff',
  emerald:   '#7EC8A0',
  sapphire:  '#00a8ff',
  citrine:   '#C4AC54',
  idleDeep:      '#000000',
  textPrimary:   '#ffffff',
  textSecondary: '#a0a0a0',
  textDim:       '#444444',
  crystalEdge:   'rgba(255,255,255,0.10)',
  glassDeep:     'rgba(0,0,0,0.6)',
  activeAmber:   '#ffffff',
  activeGlow:    '#ffffff',
  activeDark:    '#1a1a1a',

  // ── Semantic aliases (camelCase versions) ──
  voidObsidian:  '#000000',
  surfaceDeep:   '#000000',
  surfaceMid:    '#0a0a0a',
  surfaceRaised: '#181818',
  surfaceMuted:  '#1f1f1f',
  warmBone:      '#ffffff',
  boneMid:       '#d4d4d4',
  boneDim:       '#666666',
  boneGhost:     '#444444',
  firedAmber:    '#ffffff',
  emberGlow:     '#ffffff',
  coldSlate:     '#95ccff',
  quartzMid:     '#00a8ff',
};
```

- [ ] **Step 2: Replace the `gradients` block (lines 160–177)**

```ts
export const gradients = {
  background:  ['#000000', '#000000', '#000000'] as const,
  ember:       ['#ffffff', '#cccccc', '#222222'] as const,
  quartz:      ['#95ccff', '#00a8ff', '#004a75'] as const,
  heatCore:    ['rgba(255,255,255,0)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.45)'] as const,
  cardActive:   ['#1a1a1a', '#000000'] as const,
  cardInactive: ['#0a0a0a', '#000000'] as const,
  cardNeutral:  ['#0a0a0a', '#000000'] as const,
  amethyst:    ['#95ccff', '#00a8ff', '#004a75'] as const,
  primary:     ['#ffffff', '#cccccc', '#222222'] as const,
  secondary:   ['#95ccff', '#00a8ff', '#004a75'] as const,
  wordmark:    ['#ffffff', '#d4d4d4'] as const,
  crystal:     ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0)'] as const,
  gloss:       ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)'] as const,
};
```

- [ ] **Step 3: Update `SHADOW_COLOR` and `shadow.orb`**

Find:
```ts
const SHADOW_COLOR = '#080503';
```
Replace with:
```ts
const SHADOW_COLOR = '#000000';
```

Find:
```ts
  orb: {
    shadowColor: '#ff7a00',
```
Replace with:
```ts
  orb: {
    shadowColor: '#ffffff',
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes with no errors. (No structural changes; just value swaps.)

- [ ] **Step 5: Grep-verify no retired warm hex remain in `tokens.ts`**

```bash
grep -nE "(#0e0905|#080503|#ff7a00|#ffb68b|#f6ded2|#a78b7c|#5c2800|#522300|#321200|#a04e00|#753400|#b86838|#2a1a10|#1c110a|#1f130c|#251912|#291d16|#35271f|#40322a|#45362e|#584235|#7a5c4b|#e0c0af|#ecceb9|#ffdbc8|#ffb4ab|#ffdad6|#690005|#93000a|#1a2740|#3a1a08|#3e2212|#e89240)" src/design/tokens.ts
```

Expected: zero matches.

- [ ] **Step 6: Commit**

```bash
git add src/design/tokens.ts
git commit -m "feat(palette): rebind tokens.ts to OLED white-hot ramp"
```

---

## Task 2: Rewrite `src/design/themes.ts`

**Files:**
- Modify: `src/design/themes.ts`

The `obsidian` theme exposes a small subset of tokens through a typed contract. Rebind to OLED values.

- [ ] **Step 1: Replace the `obsidian` theme object**

Find the `themes` object and replace its `obsidian` entry:

```ts
export const themes: Record<ThemeName, ThemeColors> = {
  obsidian: {
    bgDeep:           '#000000',
    surface1:         '#000000',
    surface3:         '#111111',
    surface6:         '#262626',
    surfaceBright:    '#262626',
    glassFill:        'rgba(0,0,0,0.6)',
    glassBorder:      'rgba(255,255,255,0.10)',
    primary:          '#ffffff',
    primaryContainer: '#e6e6e6',
    onSurface:        '#ffffff',
    onSurfaceVariant: '#a0a0a0',
    outline:          '#666666',
  },
};
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/design/themes.ts
git commit -m "feat(palette): rebind obsidian theme contract to OLED values"
```

---

## Task 3: Rewrite `src/flow/theme.ts`

**Files:**
- Modify: `src/flow/theme.ts`

Parallel palette for the linear flow subsystem. Same rebind strategy — keep all key names, change values. Also patches two `TYPE` entries that hardcode `'#a78b7c'`.

- [ ] **Step 1: Replace the header comment (lines 1–7)**

Find:
```ts
/**
 * src/flow/theme.ts
 * Design tokens for the linear flow.
 * Aligned to /design.md (apr 2026) — Quartzie warm obsidian palette.
 * Key naming retained (`navy`, `bone`, `ember`, `quartz`) for back-compat;
 * values now resolve to the warm-espresso/ember/quartz tokens.
 */
```
Replace with:
```ts
/**
 * src/flow/theme.ts
 * Design tokens for the linear flow.
 * Aligned to /design.md (may 2026) — OLED · white-hot neon edge.
 * Key naming retained (`navy`, `bone`, `ember`, `quartz`) for back-compat;
 * values resolve to pure-black surfaces, white-intensity heat ramp,
 * and the unchanged quartz cyan cool ramp.
 */
```

- [ ] **Step 2: Replace the `THEME` constant (lines 11–53)**

```ts
export const THEME = {
  // "navy" key kept for back-compat — values are pure-black ramp on OLED.
  navy: {
    0: '#000000',  // surface-container-lowest (the void)
    1: '#000000',  // background
    2: '#0a0a0a',  // surface-container-low
    3: '#111111',  // surface-container
    4: '#1f1f1f',  // surface-container-highest
    5: '#262626',  // surface-bright
  },
  bone: {
    100: '#ffffff',  // on-surface
    90:  '#d4d4d4',
    70:  '#a0a0a0',  // on-surface-variant
    50:  '#666666',  // outline
    35:  '#444444',
    20:  '#222222',  // outline-variant
    warm04: 'rgba(255, 255, 255, 0.04)',
    warm08: 'rgba(255, 255, 255, 0.08)',
    warm10: 'rgba(255, 255, 255, 0.10)',
    warm18: 'rgba(255, 255, 255, 0.18)',
  },
  ember: {
    bright: '#ffffff',                     // primary (white-hot at-target)
    base:   '#e6e6e6',                     // primary-container (heating-dim)
    deep:   '#222222',                     // on-primary-container
    glow:   'rgba(255, 255, 255, 0.45)',   // primary-container at 45% alpha
  },
  quartz: {
    bright: '#95ccff',
    base:   '#00a8ff',
    deep:   '#004a75',
    glow:   'rgba(0, 168, 255, 0.30)',
  },
  danger: {
    base:  '#ff5252',
    deep:  '#c44444',
  },
  // Warning amber-yellow — the one warm hue that survives, distinct from
  // the (now white) ember at-target signal.
  warn:    '#ffd60a',
  success: '#7ec8a0',
} as const;
```

- [ ] **Step 3: Patch `TYPE.bodyDim` (line 74)**

Find:
```ts
  bodyDim:    { fontFamily: 'Geist_400Regular',  color: '#a78b7c' },
```
Replace with:
```ts
  bodyDim:    { fontFamily: 'Geist_400Regular',  color: '#666666' },
```

- [ ] **Step 4: Patch `TYPE.eyebrow.color` (line 82)**

Find:
```ts
    color:          '#a78b7c',
```
Replace with:
```ts
    color:          '#666666',
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 6: Grep-verify no retired warm hex in `flow/theme.ts`**

```bash
grep -nE "(#0e0905|#080503|#ff7a00|#ffb68b|#ffa45c|#f6ded2|#a78b7c|#5c2800|#251912|#291d16|#40322a|#45362e|#584235|#7a5c4b|#e0c0af|#ecceb9|#ffb4ab|246, 222, 210|255, 122, 0)" src/flow/theme.ts
```

Expected: zero matches.

- [ ] **Step 7: Commit**

```bash
git add src/flow/theme.ts
git commit -m "feat(palette): rebind flow/theme.ts THEME to OLED white-hot"
```

---

## Task 4: Rewrite `src/design/components/QBackground.tsx`

**Files:**
- Modify: `src/design/components/QBackground.tsx`

The background animates two breathing radials: a warm orange and a cool blue, over `voidObsidian`. New version: pure-black fill, faint white radial, faint cyan radial, lower opacity caps so the background never competes with neon-edge components.

- [ ] **Step 1: Replace the entire file**

```tsx
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../tokens';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function QBackground() {
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  // White radial — peaks at ~10% opacity, never higher
  const whiteStyle = useAnimatedStyle(() => ({
    opacity: 0.04 + breathe.value * 0.06,
  }));

  // Cyan radial — peaks at ~8% opacity, opposite phase
  const cyanStyle = useAnimatedStyle(() => ({
    opacity: 0.03 + (1 - breathe.value) * 0.05,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.voidObsidian }]} />
      <Animated.View style={[StyleSheet.absoluteFill, whiteStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, cyanStyle]}>
        <LinearGradient
          colors={['rgba(0,168,255,0.45)', 'transparent']}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/design/components/QBackground.tsx
git commit -m "feat(palette): QBackground breathes white + cyan on pure black"
```

---

## Task 5: Rewrite `src/design/components/SurfaceCard.tsx`

**Files:**
- Modify: `src/design/components/SurfaceCard.tsx`

Preserves existing API. Adds optional `glow` prop. Variants reinterpreted as neon-edge surfaces.

- [ ] **Step 1: Replace the entire file**

```tsx
import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, radius, colors } from '../tokens';

export type SurfaceCardVariant = 'active' | 'inactive' | 'neutral';
export type SurfaceCardGlow = 'hot' | 'cool' | 'none';

interface Props {
  children: React.ReactNode;
  variant?: SurfaceCardVariant;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Elevation shadow — defaults true */
  elevated?: boolean;
  /** Optional neon outer glow. Overrides variant border + adds shadow. */
  glow?: SurfaceCardGlow;
}

const GRADIENT_MAP: Record<SurfaceCardVariant, readonly [string, string]> = {
  active:   gradients.cardActive,
  inactive: gradients.cardInactive,
  neutral:  gradients.cardNeutral,
};

const VARIANT_BORDER: Record<SurfaceCardVariant, string> = {
  active:   'rgba(255,255,255,0.20)',
  inactive: 'rgba(255,255,255,0.06)',
  neutral:  'rgba(255,255,255,0.08)',
};

const GLOW_BORDER: Record<Exclude<SurfaceCardGlow, 'none'>, string> = {
  hot:  'rgba(255,255,255,0.55)',
  cool: '#00a8ff',
};

const GLOW_SHADOW: Record<Exclude<SurfaceCardGlow, 'none'>, string> = {
  hot:  '#ffffff',
  cool: '#00a8ff',
};

export function SurfaceCard({
  children,
  variant = 'neutral',
  borderRadius = radius.lg,
  style,
  contentStyle,
  elevated = true,
  glow = 'none',
}: Props) {
  const borderColor = glow !== 'none' ? GLOW_BORDER[glow] : VARIANT_BORDER[variant];
  const glowShadow = glow !== 'none'
    ? {
        shadowColor: GLOW_SHADOW[glow],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 10,
      }
    : null;

  return (
    <View style={[elevated && styles.shadow, glowShadow, style]}>
      <LinearGradient
        colors={GRADIENT_MAP[variant]}
        style={[styles.card, { borderRadius }]}
      >
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.border,
            { borderRadius, borderColor },
          ]}
          pointerEvents="none"
        />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: colors.voidObsidian,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    overflow: 'hidden',
  },
  border: {
    borderWidth: 1,
  },
  content: {
    // padding set by consumer
  },
});
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes. (Adding optional prop — no breaking changes.)

- [ ] **Step 3: Commit**

```bash
git add src/design/components/SurfaceCard.tsx
git commit -m "feat(palette): SurfaceCard neon-edge variants + optional glow prop"
```

---

## Task 6: Update `src/design/components/TempDial.tsx`

**Files:**
- Modify: `src/design/components/TempDial.tsx`

Patches the `PALETTE` table (replace two hardcoded hex literals with tokens) and two warm-bone RGBA literals further down. The `RING_COLORS` array at line 52 stays as-is — it pulls from `colors.*` which auto-rebind to the white-intensity ramp.

**Deviation from spec section 4.3:** The spec proposed adding `glow` + `glowOpacity` keys to a renamed `STATE_LOOK` table. On inspection, the existing `glowStyle` already interpolates `shadowColor` from `colorProgress` across `RING_COLORS` (line 165). Once `RING_COLORS` rebinds via tokens, the glow color naturally transitions through the white → cyan ramp per state — no new keys needed. YAGNI: keep the simpler structure.

- [ ] **Step 1: Replace `PALETTE` lines 31–37**

Find:
```ts
const PALETTE: Record<DialState, { ring: string; text: string; lensTop: string; lensBottom: string }> = {
  idle:    { ring: colors.quartzDim,    text: colors.bone90,  lensTop: colors.lensIdle,    lensBottom: colors.surface1 },
  heating: { ring: colors.emberMid,     text: colors.bone100, lensTop: colors.lensHeating, lensBottom: colors.surface1 },
  target:  { ring: colors.emberBright,  text: '#f6ded2',      lensTop: colors.lensTarget,  lensBottom: colors.surface2 },
  cooling: { ring: colors.emberCool,    text: colors.bone90,  lensTop: colors.lensCooling, lensBottom: colors.surface1 },
  dunk:    { ring: colors.quartzBright, text: '#cde5ff',      lensTop: colors.lensDunk,    lensBottom: colors.surface1 },
};
```
Replace with:
```ts
const PALETTE: Record<DialState, { ring: string; text: string; lensTop: string; lensBottom: string }> = {
  idle:    { ring: colors.quartzDim,    text: colors.bone90,        lensTop: colors.lensIdle,    lensBottom: colors.surface1 },
  heating: { ring: colors.emberMid,     text: colors.bone100,       lensTop: colors.lensHeating, lensBottom: colors.surface1 },
  target:  { ring: colors.emberBright,  text: colors.bone100,       lensTop: colors.lensTarget,  lensBottom: colors.surface2 },
  cooling: { ring: colors.emberCool,    text: colors.bone90,        lensTop: colors.lensCooling, lensBottom: colors.surface1 },
  dunk:    { ring: colors.quartzBright, text: colors.tertiaryFixed, lensTop: colors.lensDunk,    lensBottom: colors.surface1 },
};
```

- [ ] **Step 2: Replace warm-bone RGBA gloss gradient (line ~316)**

Find:
```tsx
        <LinearGradient
          colors={['rgba(255,240,220,0.07)', 'rgba(255,240,220,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: lensSize / 2 }]}
        />
```
Replace with:
```tsx
        <LinearGradient
          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: lensSize / 2 }]}
        />
```

- [ ] **Step 3: Replace warm-bone RGBA mid-line (line ~328)**

Find:
```tsx
            backgroundColor: 'rgba(255,240,220,0.08)',
```
Replace with:
```tsx
            backgroundColor: 'rgba(255,255,255,0.08)',
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 5: Grep-verify TempDial is clean**

```bash
grep -nE "(#f6ded2|#cde5ff|255,240,220|255, 240, 220|#ff7a00|#ffb68b)" src/design/components/TempDial.tsx
```

Expected: zero matches.

- [ ] **Step 6: Commit**

```bash
git add src/design/components/TempDial.tsx
git commit -m "fix(palette): TempDial token references + white gloss tints"
```

---

## Task 7: Patch `src/design/components/QWordmark.tsx`

**Files:**
- Modify: `src/design/components/QWordmark.tsx`

Five hardcoded hex literals (lines 64, 66, 67, 69, 114) → tokens. Verify `colors` is imported; if not, add the import.

- [ ] **Step 1: Verify the `colors` import**

Run:
```bash
grep -n "from '../tokens'" src/design/components/QWordmark.tsx
```

Expected: a line like `import { colors } from '../tokens';` (or a multi-name import that includes `colors`). If absent, add:
```tsx
import { colors } from '../tokens';
```
near the other imports at the top of the file.

- [ ] **Step 2: Replace the `dotColor` block (lines ~60–67)**

Find:
```tsx
  // Dot color: hidden when offline; bone35 when idle-connected; ember/quartz when active
  const dotColor = !connected
    ? 'transparent'
    : state === 'dunk'
    ? '#95ccff'  // quartzBright
    : state === 'heating' || state === 'target'
    ? '#ffb68b'  // emberBright
    : '#a78b7c'; // outline — static idle
```
Replace with:
```tsx
  // Dot color: hidden when offline; outline when idle-connected; ember/quartz when active
  const dotColor = !connected
    ? 'transparent'
    : state === 'dunk'
    ? colors.quartzBright
    : state === 'heating' || state === 'target'
    ? colors.emberBright
    : colors.outline;
```

- [ ] **Step 3: Replace `glowColor` (line ~69)**

Find:
```tsx
  const glowColor = state === 'dunk' ? '#95ccff' : '#ffb68b';
```
Replace with:
```tsx
  const glowColor = state === 'dunk' ? colors.quartzBright : colors.emberBright;
```

- [ ] **Step 4: Replace the wordmark color (line ~114)**

Find:
```tsx
  wordmark: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 22,
    color: '#f6ded2',
    letterSpacing: -0.2,
  },
```
Replace with:
```tsx
  wordmark: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 22,
    color: colors.bone100,
    letterSpacing: -0.2,
  },
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 6: Grep-verify QWordmark is clean**

```bash
grep -nE "(#f6ded2|#ffb68b|#95ccff|#a78b7c)" src/design/components/QWordmark.tsx
```

Expected: zero matches.

- [ ] **Step 7: Commit**

```bash
git add src/design/components/QWordmark.tsx
git commit -m "fix(palette): QWordmark uses tokens (no hardcoded hex)"
```

---

## Task 8: Patch `src/design/components/SessionWalkthrough/styles.ts`

**Files:**
- Modify: `src/design/components/SessionWalkthrough/styles.ts`

One literal at line 293.

- [ ] **Step 1: Verify the `colors` import**

```bash
grep -n "tokens" src/design/components/SessionWalkthrough/styles.ts
```

If `colors` isn't imported, add at the top of the file (the project supports `@/` path aliases — see `src/flow/theme.ts` line 9 for an example):
```ts
import { colors } from '@/design/tokens';
```

- [ ] **Step 2: Replace the `ctaBtnText.color` (line ~293)**

Find:
```ts
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#f6ded2',
  },
```
Replace with:
```ts
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.bone100,
  },
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/design/components/SessionWalkthrough/styles.ts
git commit -m "fix(palette): SessionWalkthrough styles uses bone100 token"
```

---

## Task 9: Patch `src/design/components/SessionWalkthrough/StepIcons.tsx`

**Files:**
- Modify: `src/design/components/SessionWalkthrough/StepIcons.tsx`

Three hex literals at lines 53, 59, 60.

- [ ] **Step 1: Replace the `flamGrad` first stop (line ~53)**

Find:
```tsx
            <Stop offset="0%" stopColor="#f6ded2" stopOpacity={0.9} />
```
Replace with:
```tsx
            <Stop offset="0%" stopColor={colors.bone100} stopOpacity={0.9} />
```

- [ ] **Step 2: Replace the `innerFlam` first stop (line ~59)**

Find:
```tsx
            <Stop offset="0%" stopColor="#f6ded2" stopOpacity={0.95} />
```
Replace with:
```tsx
            <Stop offset="0%" stopColor={colors.bone100} stopOpacity={0.95} />
```

- [ ] **Step 3: Replace the `innerFlam` mid stop (line ~60)**

Find:
```tsx
            <Stop offset="60%" stopColor="#ffb68b" stopOpacity={0.8} />
```
Replace with:
```tsx
            <Stop offset="60%" stopColor={colors.emberBright} stopOpacity={0.8} />
```

- [ ] **Step 4: Verify colors import**

```bash
grep -n "from.*tokens" src/design/components/SessionWalkthrough/StepIcons.tsx
```

If `colors` isn't already imported, add it.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add src/design/components/SessionWalkthrough/StepIcons.tsx
git commit -m "fix(palette): StepIcons gradient stops via tokens"
```

---

## Task 10: Patch `src/design/components/SessionWalkthrough/TorchTimer.tsx`

**Files:**
- Modify: `src/design/components/SessionWalkthrough/TorchTimer.tsx`

One literal at line 104.

- [ ] **Step 1: Replace the `progressGrad` second stop (line ~104)**

Find:
```tsx
            <Stop offset="100%" stopColor="#ffb68b" />
```
Replace with:
```tsx
            <Stop offset="100%" stopColor={colors.emberBright} />
```

- [ ] **Step 2: Verify `colors` is imported (it likely already is — line 98 references `colors.emberBright`)**

```bash
grep -n "from.*tokens" src/design/components/SessionWalkthrough/TorchTimer.tsx
```

Expected: an existing import. If not, add it.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/design/components/SessionWalkthrough/TorchTimer.tsx
git commit -m "fix(palette): TorchTimer progress gradient via tokens"
```

---

## Task 11: Patch `src/flow/stages/ConcChooser.tsx`

**Files:**
- Modify: `src/flow/stages/ConcChooser.tsx`

`ORB_PALETTE` rows for `Hash` and `Hydrocarbon` contain warm/orange hex. Replace with monochrome and white-intensity respectively.

- [ ] **Step 1: Replace the `ORB_PALETTE` block (lines 75–82)**

Find:
```ts
const ORB_PALETTE: Record<FilterKey, [string, string, string]> = {
  All: [THEME.ember.bright, THEME.ember.deep, THEME.navy[1]], // warm ember — overall mix
  Solventless: ['#f6e090', '#c0a040', '#3a2a08'], // pale gold
  Hash: ['#d49a5a', '#7a3e1c', '#2a1408'], // amber-brown
  Hydrocarbon: ['#ffb68b', '#ff7a00', '#3d1a00'], // ember
  Distillate: ['#ffe26a', '#c89020', '#3a2406'], // saturated gold
  Novel: ['#e09cf5', '#9a3ec8', '#2a0d36'], // magenta
};
```
Replace with:
```ts
const ORB_PALETTE: Record<FilterKey, [string, string, string]> = {
  All: [THEME.ember.bright, THEME.ember.deep, THEME.navy[1]], // white intensity — overall mix
  Solventless: ['#f6e090', '#c0a040', '#3a2a08'], // pale gold (yellow, not orange — kept)
  Hash: ['#d4d4d4', '#666666', '#0a0a0a'], // cool monochrome (was amber-brown)
  Hydrocarbon: ['#ffffff', '#cccccc', '#222222'], // white intensity (was ember)
  Distillate: ['#ffe26a', '#c89020', '#3a2406'], // saturated gold (yellow, not orange — kept)
  Novel: ['#e09cf5', '#9a3ec8', '#2a0d36'], // magenta (kept)
};
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 3: Grep-verify retired ember orbs are gone**

```bash
grep -nE "(#ff7a00|#ffb68b|#3d1a00|#d49a5a|#7a3e1c|#2a1408)" src/flow/stages/ConcChooser.tsx
```

Expected: zero matches.

- [ ] **Step 4: Commit**

```bash
git add src/flow/stages/ConcChooser.tsx
git commit -m "fix(palette): ConcChooser orb palette de-orange + monochrome Hash"
```

---

## Task 12: Patch `src/flow/data/display.ts`

**Files:**
- Modify: `src/flow/data/display.ts`

Two literals at lines 65 and 66 in the `cool` stage branch.

- [ ] **Step 1: Verify `THEME` is imported**

```bash
grep -n "from.*flow/theme\|from '../theme'" src/flow/data/display.ts
```

Expected: an existing import. If absent, add at top of the file:
```ts
import { THEME } from '@/flow/theme';
```

- [ ] **Step 2: Replace the cool-state color and glow (lines ~65–66)**

Find:
```ts
    return {
      color: atTemp ? '#7EC8A0' : '#ffb68b',
      glowColor: atTemp ? 'rgba(126,200,160,0.45)' : 'rgba(255,182,139,0.4)',
```
Replace with:
```ts
    return {
      color: atTemp ? THEME.success : THEME.ember.bright,
      glowColor: atTemp ? 'rgba(126,200,160,0.45)' : 'rgba(255,255,255,0.4)',
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 4: Grep-verify**

```bash
grep -nE "(#ffb68b|#7EC8A0|255,182,139)" src/flow/data/display.ts
```

Expected: zero matches.

- [ ] **Step 5: Commit**

```bash
git add src/flow/data/display.ts
git commit -m "fix(palette): display.ts cool-stage uses THEME tokens"
```

---

## Task 13: Patch `src/flow/components/PresetRow.tsx`

**Files:**
- Modify: `src/flow/components/PresetRow.tsx`

Three hex stops at lines 62–64 inside the `quartz` gradient definition.

- [ ] **Step 1: Verify `THEME` is imported**

```bash
grep -n "THEME" src/flow/components/PresetRow.tsx | head -3
```

Expected: an existing import. If not, add it.

- [ ] **Step 2: Replace the `quartz` gradient stops (lines ~62–64)**

Find:
```ts
    quartz: {
      cx: '35%', cy: '30%',
      stops: [
        { offset: '0%',   color: '#ffb68b', opacity: 1 },
        { offset: '45%',  color: '#ff7a00', opacity: 1 },
        { offset: '100%', color: '#5c2800', opacity: 1 },
      ],
    },
```
Replace with:
```ts
    quartz: {
      cx: '35%', cy: '30%',
      stops: [
        { offset: '0%',   color: THEME.ember.bright, opacity: 1 },
        { offset: '45%',  color: THEME.ember.base,   opacity: 1 },
        { offset: '100%', color: THEME.ember.deep,   opacity: 1 },
      ],
    },
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 4: Grep-verify**

```bash
grep -nE "(#ff7a00|#ffb68b|#5c2800)" src/flow/components/PresetRow.tsx
```

Expected: zero matches.

- [ ] **Step 5: Commit**

```bash
git add src/flow/components/PresetRow.tsx
git commit -m "fix(palette): PresetRow quartz orb gradient via THEME tokens"
```

---

## Task 14: Patch `src/flow/stages/SessionStage.tsx`

**Files:**
- Modify: `src/flow/stages/SessionStage.tsx`

One warm-bone RGBA at line 496.

- [ ] **Step 1: Replace the `bottomPillHighlight.backgroundColor` (line ~496)**

Find:
```tsx
  bottomPillHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255, 240, 220, 0.45)',
    zIndex: 1,
  },
```
Replace with:
```tsx
  bottomPillHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    zIndex: 1,
  },
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 3: Grep-verify**

```bash
grep -nE "255, ?240, ?220" src/flow/stages/SessionStage.tsx
```

Expected: zero matches.

- [ ] **Step 4: Commit**

```bash
git add src/flow/stages/SessionStage.tsx
git commit -m "fix(palette): SessionStage bottomPill highlight uses pure white"
```

---

## Task 15: Final verification

**Files:** none modified

This task confirms the OLED rebind is complete and the app runs.

- [ ] **Step 1: Repo-wide grep — all retired warm hex are gone**

```bash
grep -rnE "(#ff7a00|#ffb68b|#ffa45c|#ffdbc8|#e89240|#5c2800|#522300|#321200|#a04e00|#753400|#b86838|#2a1a10|#3d1a00|#1c110a|#1f130c|#251912|#291d16|#35271f|#40322a|#45362e|#a78b7c|#584235|#7a5c4b|#e0c0af|#ecceb9|#f6ded2|#0e0905|#080503|#ffb4ab|#ffdad6|#690005|#93000a|#1a2740|#3a1a08|#3e2212|#d49a5a|#7a3e1c|#2a1408)" src --include="*.ts" --include="*.tsx"
```

Expected: zero matches. If any remain, identify the file and patch the literal to use the appropriate token (most likely `colors.bone100`, `colors.emberBright`, or a `surface*` token).

- [ ] **Step 2: Repo-wide grep — warm-bone RGBAs are gone**

```bash
grep -rnE "rgba\( ?(255, ?240, ?220|246, ?222, ?210|255, ?122, ?0|255, ?182, ?139)" src --include="*.ts" --include="*.tsx"
```

Expected: zero matches.

- [ ] **Step 3: Full typecheck**

```bash
npx tsc --noEmit
```

Expected: passes with no errors.

- [ ] **Step 4: Run on iOS simulator**

```bash
npm run ios
```

Wait for the dev client to boot and the app to load. If it doesn't already, install the simulator app the first time per project README.

- [ ] **Step 5: Manual screen audit (visual QA)**

Walk through every screen below and confirm: (a) background is true black, (b) no orange/warm-brown is visible anywhere, (c) heat-active components render with white border + white outer glow, (d) cool/dunk states render in cyan, (e) text is white/gray, never warm-bone:

- [ ] Splash / wordmark on first launch
- [ ] BangerChooser carousel
- [ ] ConcChooser grid (each category orb — `Hash` should now read as gray, `Hydrocarbon` as white)
- [ ] WallChooser
- [ ] SessionWalkthrough — all states: idle / heating / at-target / cooling / dunk
- [ ] NewPresetWizard — every step
- [ ] MainBottomSheet open + each tab (Reference, Configure, Presets)
- [ ] ErrorBoundary fallback (force an error or check the component in isolation)
- [ ] Toast variants (info, warning, error, success)
- [ ] TempDial state transitions: confirm the heating ring pulses white, at-target glows full white, cooling blends white→cyan, dunk fully cyan

If any screen still shows warm tones, find the offending file (use Cmd-F with the still-warm color), patch it, and append a fix commit before finishing.

- [ ] **Step 6: Capture screenshots for the PR**

For at least the SessionWalkthrough heating + at-target + dunk states, plus the home/banger picker, capture iOS simulator screenshots. Save to `docs/superpowers/screenshots/oled/` (create the dir).

- [ ] **Step 7: Final commit + push**

If any small fixes were committed in step 5, they are part of the branch already. Push:

```bash
git push -u origin feature/oled-white-hot
```

- [ ] **Step 8: Open PR**

```bash
gh pr create --title "OLED · white-hot neon edge palette" --body "$(cat <<'EOF'
## Summary
- Rebinds the design palette from warm-obsidian to OLED black + white-hot neon edge
- Heat is now encoded by white intensity / glow strength; cool/dunk remains quartz cyan
- No more orange anywhere (audited via grep across src/)

## Scope
- Both palette sources rewritten: src/design/tokens.ts + src/flow/theme.ts
- QBackground breathes white + cyan radials on pure black (lower opacity caps)
- SurfaceCard adds optional `glow` prop (`hot` / `cool` / `none`) for neon edges
- 10 component files patched to use tokens instead of hardcoded warm hex

## Spec
docs/superpowers/specs/2026-05-02-oled-palette-design.md

## Test plan
- [ ] Boot on iOS sim — every screen renders without warm tones
- [ ] TempDial pulses white in heating, full white at-target, transitions to cyan in cooling, fully cyan in dunk
- [ ] ErrorBoundary, Toast, ConfidencePill all use white/cyan/yellow accents (no orange)
- [ ] Brass custom-preset accent + amber-yellow warning still visible somewhere
EOF
)"
```

Report the PR URL.

---

## Done

The plan is complete when Task 15 step 8 is done. Total commits: 14 (Tasks 1–14, plus optional fix-commits and the PR).
