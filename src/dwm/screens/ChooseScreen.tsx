import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { palette, fontStack, layout } from '../tokens';
import { Card } from '../primitives/Card';
import { Pill } from '../primitives/Pill';
import { PHASE_COPY } from '../flow/copy';
import type { Preset } from '../../db/presets';
import type { MoltenRecent } from '../../db/moltenRecents';
import { findBanger } from '../../data/bangers';
import { findConcentrate } from '../../data/concentrates';
import { getBangerIllustration } from '../illustrations';

export interface ChooseScreenProps {
  presets: Preset[];
  recents: MoltenRecent[];
  onPickPreset: (id: string) => void;
  onPickRecent: (id: string) => void;
  onBuildFresh: () => void;
}

function timeAgoLabel(completedAt: number): string {
  const delta = Date.now() - completedAt;
  if (delta < 2 * 60 * 1000) return 'just now';
  if (delta < 60 * 60 * 1000) return 'today';
  if (delta < 48 * 60 * 60 * 1000) return 'yesterday';
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(completedAt)).toLowerCase();
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerRule} />
      <Text style={styles.dividerLabel}>{label.toUpperCase()}</Text>
      <View style={styles.dividerRule} />
    </View>
  );
}

export default function ChooseScreen({ presets, recents, onPickPreset, onPickRecent, onBuildFresh }: ChooseScreenProps) {
  const copy = PHASE_COPY.presets;
  const hasSeshes = recents.length > 0 || presets.length > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.copyBlock}>
        <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
        <Text style={styles.headline}>{copy.headline}</Text>
        {copy.sub.length > 0 && <Text style={styles.sub}>{copy.sub}</Text>}
      </View>

      <View style={styles.cardList}>
        {/* Fresh sesh — always first, peach glyph */}
        <Card
          glyph={{ tint: 'peach', icon: <PlusIcon color={palette.fg} /> }}
          title="a fresh sesh"
          sub="tell me your banger and what you're dabbing."
          chevron
          onPress={onBuildFresh}
        />

        {hasSeshes && <Divider label="your saved seshes" />}

        {recents.slice(0, 4).map((r) => {
          const banger = findBanger(r.bangerId);
          const concentrate = findConcentrate(r.concentrateId);
          if (!banger || !concentrate) return null;
          const Illustration = getBangerIllustration(r.bangerId);
          return (
            <Card
              key={r.id}
              glyph={
                Illustration
                  ? { tint: 'mint', icon: <Illustration size={32} accent={palette.fg} /> }
                  : undefined
              }
              title={banger.name}
              sub={
                <View style={styles.subRow}>
                  <Text style={styles.subText}>{concentrate.name}</Text>
                  <Pill label={timeAgoLabel(r.completedAt)} variant="neutral" />
                </View>
              }
              chevron
              onPress={() => onPickRecent(r.id)}
            />
          );
        })}

        {presets.map((p) => (
          <Card
            key={p.id}
            glyph={{ tint: 'lilac', icon: <PlusIcon color={palette.fg} /> }}
            title={p.name}
            chevron
            onPress={() => onPickPreset(p.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: 24,
    gap: 16,
  },
  copyBlock: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  eyebrow: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    letterSpacing: 0.24 * 10,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 28,
    letterSpacing: -0.035 * 28,
    color: palette.fg,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fontStack.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  cardList: {
    gap: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  dividerRule: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
  },
  dividerLabel: {
    fontFamily: fontStack.mono,
    fontSize: 9.5,
    letterSpacing: 0.18 * 9.5,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  subText: {
    fontFamily: fontStack.body,
    fontSize: 12.5,
    color: palette.muted,
  },
});
