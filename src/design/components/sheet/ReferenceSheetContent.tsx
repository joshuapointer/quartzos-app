/**
 * ReferenceSheetContent — in-app calibration reference and explainer.
 *
 * Sections:
 *  1. How calibration works (formula explainer + 5 worked examples)
 *  2. Sensor types
 *  3. Wall thickness
 *  4. Confidence legend
 *  5. Data sources
 *  6. Workflow note
 *  7. Regulatory note — THCP (conditionally rendered)
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ConfidencePill } from '../ConfidencePill';
import { GlassCard } from '../GlassCard';
import { useThemeColors } from '../../ThemeContext';
import { colors, fonts, radius, spacing } from '../../tokens';
import { META, SENSORS, WALL_THICKNESSES, CONCENTRATES } from '../../../data/dabReference';

// ---------------------------------------------------------------------------
// Derived module-level constant — THCP regulatory section visibility
// ---------------------------------------------------------------------------

const THCP_CONCENTRATE = CONCENTRATES.find((c) => c.id === 'thcp');
const SHOW_THCP_WARNING =
  THCP_CONCENTRATE !== undefined &&
  THCP_CONCENTRATE.tags.includes('GRAY_MARKET');

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  const theme = useThemeColors();
  return (
    <Text style={[styles.sectionHeader, { color: theme.primary }]}>{title}</Text>
  );
}

// ---------------------------------------------------------------------------
// ReferenceSheetContent
// ---------------------------------------------------------------------------

export function ReferenceSheetContent() {
  const theme = useThemeColors();

  const confidenceEntries = Object.entries(META.confidence_levels) as [string, string][];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. How calibration works ─────────────────────────────────────── */}
      <SectionHeader title="How calibration works" />

      <GlassCard style={styles.card} padding={spacing.md}>
        {/* Formula */}
        <Text style={[styles.formulaCode, { color: colors.emberBright }]}>
          {META.calibration_formula}
        </Text>
        {/* 4-line explanation */}
        {META.calibration_explanation.map((line, idx) => (
          <Text
            key={idx}
            style={[styles.explainerLine, { color: theme.onSurface }]}
          >
            {line}
          </Text>
        ))}
      </GlassCard>

      {/* Worked example cards */}
      {META.calibration_examples.map((ex, idx) => (
        <GlassCard key={idx} style={styles.card} padding={spacing.md}>
          <Text style={[styles.exampleScenario, { color: theme.onSurfaceVariant }]}>
            {ex.scenario}
          </Text>
          <Text style={[styles.exampleMath, { color: theme.onSurface }]}>
            {ex.math}
          </Text>
          <Text style={[styles.exampleTarget, { color: colors.emberBright }]}>
            {ex.displayed_target_f}°F
          </Text>
        </GlassCard>
      ))}

      {/* ── 2. Sensor types ──────────────────────────────────────────────── */}
      <SectionHeader title="Sensor types" />

      {SENSORS.map((sensor) => (
        <GlassCard key={sensor.id} style={styles.card} padding={spacing.md}>
          <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
            {sensor.name}
          </Text>
          <Text style={[styles.cardMeta, { color: theme.onSurfaceVariant }]}>
            Method: {sensor.method}
          </Text>
          <Text style={[styles.cardBody, { color: theme.onSurface }]}>
            {sensor.calibration_note}
          </Text>
        </GlassCard>
      ))}

      {/* ── 3. Wall thickness ────────────────────────────────────────────── */}
      <SectionHeader title="Wall thickness" />

      {WALL_THICKNESSES.map((wall) => (
        <GlassCard key={wall.id} style={styles.card} padding={spacing.md}>
          <View style={styles.wallHeader}>
            <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
              {wall.name}
            </Text>
            <Text
              style={[
                styles.modifierBadge,
                { color: wall.modifier_f >= 0 ? colors.success : colors.warning },
              ]}
            >
              {wall.modifier_f >= 0 ? `+${wall.modifier_f}` : `${wall.modifier_f}`}°F
            </Text>
          </View>
          {wall.thickness_mm_range !== null && (
            <Text style={[styles.cardMeta, { color: theme.onSurfaceVariant }]}>
              {wall.thickness_mm_range} mm
            </Text>
          )}
          <Text style={[styles.cardBody, { color: theme.onSurface }]}>
            {wall.description}
          </Text>
        </GlassCard>
      ))}

      {/* ── 4. Confidence legend ─────────────────────────────────────────── */}
      <SectionHeader title="Confidence legend" />

      <GlassCard style={styles.card} padding={spacing.md}>
        {confidenceEntries.map(([level, description]) => (
          <View key={level} style={styles.confidenceRow}>
            <ConfidencePill level={level} />
            <View style={styles.confidenceTextBlock}>
              <Text style={[styles.confidenceLabel, { color: theme.onSurface }]}>
                {level}
              </Text>
              <Text style={[styles.confidenceDesc, { color: theme.onSurfaceVariant }]}>
                {description}
              </Text>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* ── 5. Data sources ──────────────────────────────────────────────── */}
      <SectionHeader title="Data sources" />

      <GlassCard style={styles.card} padding={spacing.md}>
        {META.data_sources.map((source, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: colors.emberBright }]}>•</Text>
            <Text style={[styles.bulletText, { color: theme.onSurface }]}>
              {source}
            </Text>
          </View>
        ))}
        <Text style={[styles.licenseText, { color: theme.onSurfaceVariant }]}>
          {META.license} Dataset v{META.version} — {META.release_date}.
        </Text>
      </GlassCard>

      {/* ── 6. Workflow note ─────────────────────────────────────────────── */}
      <SectionHeader title="Workflow note" />

      <View
        style={[
          styles.workflowCallout,
          { borderLeftColor: colors.ember, backgroundColor: colors.emberDeep + '22' },
        ]}
      >
        <Text style={[styles.workflowText, { color: theme.onSurface }]}>
          {META.calibration_workflow_note}
        </Text>
      </View>

      {/* ── 7. Regulatory note — THCP (conditional) ──────────────────────── */}
      {SHOW_THCP_WARNING && THCP_CONCENTRATE !== undefined && (
        <>
          <SectionHeader title="Regulatory note — THCP" />
          <View
            style={[
              styles.warningCallout,
              { borderLeftColor: colors.warning, backgroundColor: colors.warning + '18' },
            ]}
          >
            <Text style={[styles.warningHeader, { color: colors.warning }]}>
              Warning — H.R. 5371 (Nov 2026)
            </Text>
            {THCP_CONCENTRATE.notes.map((note, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: colors.warning }]}>•</Text>
                <Text style={[styles.bulletText, { color: theme.onSurface }]}>
                  {note}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 60,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.sm,
  },

  // ── Calibration section ──────────────────────────────────────────────────
  formulaCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 0.2,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  explainerLine: {
    ...fonts.body,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },

  // ── Example cards ────────────────────────────────────────────────────────
  exampleScenario: {
    ...fonts.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  exampleMath: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  exampleTarget: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -1,
  },

  // ── Sensor / wall cards ──────────────────────────────────────────────────
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cardMeta: {
    ...fonts.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  cardBody: {
    ...fonts.body,
    lineHeight: 20,
  },

  // ── Wall header ──────────────────────────────────────────────────────────
  wallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modifierBadge: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // ── Confidence legend ─────────────────────────────────────────────────────
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  confidenceTextBlock: {
    flex: 1,
  },
  confidenceLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  confidenceDesc: {
    ...fonts.caption,
    lineHeight: 16,
  },

  // ── Bullets ───────────────────────────────────────────────────────────────
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: spacing.sm,
    width: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  licenseText: {
    ...fonts.caption,
    lineHeight: 16,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // ── Workflow callout ──────────────────────────────────────────────────────
  workflowCallout: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  workflowText: {
    ...fonts.body,
    lineHeight: 22,
  },

  // ── Warning callout ───────────────────────────────────────────────────────
  warningCallout: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  warningHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },

  // ── Bottom padding ─────────────────────────────────────────────────────────
  bottomPad: {
    height: spacing.xl,
  },
});
