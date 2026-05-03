import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, fonts, gradients, prism } from '../../tokens';

export type RecentEntry = {
  id: string;
  concentrateName: string;
  bangerName: string;
  optimalF: number;
  whenLabel: string;
};

type RecentsRowProps = {
  recents: readonly RecentEntry[];
  onSelect: (id: string) => void;
  onBuildFresh: () => void;
};

// ── BuildFresh tile ────────────────────────────────────────────────────────────

interface BuildFreshTileProps {
  tileWidth: number;
  onPress: () => void;
}

function BuildFreshTile({ tileWidth, onPress }: BuildFreshTileProps) {
  const tileHeight = tileWidth * 1.32;

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Build fresh session"
      style={[
        styles.card,
        {
          width: tileWidth,
          height: tileHeight,
          backgroundColor: colors.glassThin,
          borderColor: colors.glassEdge,
        },
      ]}
    >
      <BlurView
        intensity={18}
        tint="dark"
        style={[StyleSheet.absoluteFill, styles.blurRadius]}
      />
      <View style={styles.buildFreshContent}>
        <Svg width={22} height={22} viewBox="0 0 22 22">
          <Defs>
            <SvgLinearGradient id="plusGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={prism.cyan} stopOpacity="1" />
              <Stop offset="50%" stopColor={prism.magenta} stopOpacity="1" />
              <Stop offset="100%" stopColor={prism.gold} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d="M11 3 L11 19 M3 11 L19 11"
            stroke="url(#plusGrad)"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={styles.buildFreshLabel}>Build fresh</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Preset card ────────────────────────────────────────────────────────────────

interface PresetCardProps {
  entry: RecentEntry;
  tileWidth: number;
  onPress: () => void;
}

function PresetCard({ entry, tileWidth, onPress }: PresetCardProps) {
  const tileHeight = tileWidth * 1.32;
  const topHeight = tileHeight * 0.6;
  const glyph = entry.concentrateName.charAt(0).toUpperCase();

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.concentrateName} on ${entry.bangerName}, optimal ${entry.optimalF} degrees`}
      style={[styles.card, { width: tileWidth, height: tileHeight }]}
    >
      <BlurView
        intensity={18}
        tint="dark"
        style={[StyleSheet.absoluteFill, styles.blurRadius]}
      />
      {/* Top gradient region */}
      <View style={[styles.cardTop, { height: topHeight }]}>
        <LinearGradient
          colors={gradients.presetCardTop}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.glyphText}>{glyph}</Text>
      </View>
      {/* Bottom meta region */}
      <View style={styles.cardMeta}>
        <Text style={styles.metaName} numberOfLines={1}>
          {entry.concentrateName}
        </Text>
        <Text style={styles.metaBanger} numberOfLines={1}>
          {entry.bangerName}
        </Text>
        <Text style={styles.metaTempWhen} numberOfLines={1}>
          {entry.optimalF}°F · {entry.whenLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── RecentsRow ─────────────────────────────────────────────────────────────────

export function RecentsRow({ recents, onSelect, onBuildFresh }: RecentsRowProps) {
  const { width: screenWidth } = useWindowDimensions();
  const H_PAD = 18;
  const GAP = 8;
  const tileCount = recents.length + 1;
  const totalGaps = recents.length * GAP; // gaps between tiles
  const tileWidth = (screenWidth - 2 * H_PAD - totalGaps) / tileCount;

  return (
    <View>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Pick up where you left off</Text>
        <Text style={styles.headerMeta}>{recents.length} saved</Text>
      </View>
      {/* Eyebrow hint row */}
      <View style={styles.hintRow}>
        <Text style={styles.hintLabel}>Recents</Text>
        <Text style={styles.hintSep}>·</Text>
        <Text style={styles.hintSub}>tap one · or build fresh</Text>
      </View>
      {/* Card row */}
      <View style={styles.cardRow}>
        {recents.map((entry) => (
          <PresetCard
            key={entry.id}
            entry={entry}
            tileWidth={tileWidth}
            onPress={() => onSelect(entry.id)}
          />
        ))}
        <BuildFreshTile tileWidth={tileWidth} onPress={onBuildFresh} />
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 26,
    paddingBottom: 8,
  },
  headerTitle: {
    ...fonts.serifHeadline,
    color: colors.bone100,
    flex: 1,
  },
  headerMeta: {
    ...fonts.monoEyebrow,
    color: colors.bone40,
    marginLeft: 8,
  },
  // Hint
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 10,
    gap: 6,
  },
  hintLabel: {
    ...fonts.monoEyebrow,
    color: colors.bone60,
  },
  hintSep: {
    ...fonts.monoEyebrow,
    color: colors.bone25,
  },
  hintSub: {
    ...fonts.monoEyebrow,
    color: colors.bone40,
  },
  // Card row
  cardRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  // Shared card
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.glassEdge,
  },
  blurRadius: {
    borderRadius: 16,
  },
  // Preset card regions
  cardTop: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 32,
    fontStyle: 'italic',
    color: colors.bone25,
    textAlignVertical: 'center',
  },
  cardMeta: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
  },
  metaName: {
    ...fonts.serifCard,
    fontSize: 12.5,
    color: colors.bone100,
  },
  metaBanger: {
    ...fonts.monoEyebrow,
    fontSize: 7.5,
    color: colors.bone40,
    marginTop: 2,
  },
  metaTempWhen: {
    ...fonts.monoEyebrow,
    fontSize: 7.5,
    color: colors.prismCyan,
    marginTop: 1,
  },
  // BuildFresh content
  buildFreshContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buildFreshLabel: {
    ...fonts.monoEyebrow,
    color: colors.bone60,
  },
});
