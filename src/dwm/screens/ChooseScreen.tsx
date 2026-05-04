import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { Card } from '../primitives/Card';
import { Pill } from '../primitives/Pill';
import { PressableButton } from '../primitives/PressableButton';
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

export default function ChooseScreen({ presets, recents, onPickPreset, onPickRecent, onBuildFresh }: ChooseScreenProps) {
  const copy = PHASE_COPY.presets;
  const hasContent = recents.length > 0 || presets.length > 0;

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

      {recents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'RECENT'}</Text>
          <View style={styles.cardList}>
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
                      ? { tint: 'peach', icon: <Illustration size={32} /> }
                      : undefined
                  }
                  title={banger.name}
                  sub={
                    <View style={styles.recentSubRow}>
                      <Text style={styles.recentSubText}>{concentrate.name}</Text>
                      <Pill label={timeAgoLabel(r.completedAt)} variant="neutral" />
                    </View>
                  }
                  chevron
                  onPress={() => onPickRecent(r.id)}
                />
              );
            })}
          </View>
        </View>
      )}

      {presets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'SAVED'}</Text>
          <View style={styles.cardList}>
            {presets.map((p) => (
              <Card
                key={p.id}
                title={p.name}
                chevron
                onPress={() => onPickPreset(p.id)}
              />
            ))}
          </View>
        </View>
      )}

      {!hasContent && <View style={styles.spacer} />}

      <View style={styles.buildRow}>
        <PressableButton
          label="build a fresh sesh"
          variant="primary"
          showArrow
          onPress={onBuildFresh}
        />
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
    gap: 20,
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
    color: palette.accentDeep,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fontStack.display,
    fontSize: 22,
    letterSpacing: -0.03 * 22,
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
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fontStack.mono,
    fontSize: 9.5,
    letterSpacing: 0.18 * 9.5,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  cardList: {
    gap: 8,
  },
  recentSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  recentSubText: {
    fontFamily: fontStack.body,
    fontSize: 12.5,
    color: palette.muted,
  },
  spacer: {
    height: 16,
  },
  buildRow: {
    marginTop: 4,
  },
});
