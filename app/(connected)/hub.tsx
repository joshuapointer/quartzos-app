import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { QuartzBackground, FloatingHeader, GlassCard } from '../../src/design';
import { useBleStore } from '../../src/state/bleStore';
import { colors, fonts, spacing, radius } from '../../src/design/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const connectionState = useBleStore((s) => s.connectionState);

  return (
    <View style={styles.root}>
      <QuartzBackground />
      <FloatingHeader connectionState={connectionState} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.displayTitle}>
            {'Awaken the\nDevice.'}
          </Text>
          <Text style={styles.subtitle}>
            Select your state of resonance.
          </Text>
        </View>

        {/* Hero card */}
        <Pressable
          onPress={() => router.push('/(connected)/home')}
          accessibilityRole="button"
          accessibilityLabel="Go to home monitor"
        >
          <GlassCard padding={0} borderRadius={24} style={styles.heroCard}>
            {/* Amethyst crystal placeholder */}
            <View style={styles.heroCrystalBg}>
              <MaterialIcons
                name="diamond"
                size={80}
                color={colors.primaryContainer}
              />
            </View>

            {/* Gradient overlay covering bottom half */}
            <LinearGradient
              colors={['rgba(100,80,200,0.0)', 'rgba(100,80,200,0.3)', 'rgba(18,12,31,0.9)']}
              style={styles.heroGradient}
            />

            {/* Content overlay at bottom */}
            <View style={styles.heroContent}>
              <View style={styles.heroIconCircle}>
                <MaterialIcons name="flare" size={20} color={colors.primary} />
              </View>
              <Text style={styles.heroTitle}>Initialize Ritual</Text>
              <Text style={styles.heroBody}>
                Enter the active session environment.
              </Text>
            </View>
          </GlassCard>
        </Pressable>

        {/* 2-column grid row */}
        <View style={styles.gridRow}>
          {/* Presets card */}
          <Pressable
            style={styles.gridCardWrap}
            onPress={() => router.push('/(connected)/presets')}
            accessibilityRole="button"
            accessibilityLabel="Go to Presets"
          >
            <GlassCard padding={16} borderRadius={radius.lg} style={styles.gridCard}>
              <MaterialIcons name="auto-awesome" size={28} color={colors.secondary} />
              <View style={styles.gridCardBottom}>
                <Text style={styles.gridCardTitle}>Presets</Text>
                <Text style={styles.gridCardBody}>Saved profiles.</Text>
              </View>
            </GlassCard>
          </Pressable>

          {/* History card */}
          <Pressable
            style={styles.gridCardWrap}
            onPress={() => router.push('/(connected)/history')}
            accessibilityRole="button"
            accessibilityLabel="Go to History"
          >
            <GlassCard padding={16} borderRadius={radius.lg} style={styles.gridCard}>
              <MaterialIcons name="history" size={28} color={colors.onSurfaceVariant} />
              <View style={styles.gridCardBottom}>
                <Text style={styles.gridCardTitle}>History</Text>
                <View style={styles.gridCardBodyRow}>
                  <Text style={styles.gridCardBody}>Past sessions.</Text>
                  <MaterialIcons name="arrow-forward" size={14} color={colors.onSurfaceVariant} />
                </View>
              </View>
            </GlassCard>
          </Pressable>
        </View>

        {/* Settings card */}
        <Pressable
          onPress={() => router.push('/(connected)/settings')}
          accessibilityRole="button"
          accessibilityLabel="Go to Device Settings"
        >
          <GlassCard padding={12} borderRadius={radius.lg} style={styles.settingsCard}>
            <View style={styles.settingsInner}>
              <View style={styles.settingsIconCircle}>
                <MaterialIcons name="tune" size={20} color={colors.onSurfaceVariant} />
              </View>
              <Text style={styles.settingsTitle}>Device Settings</Text>
              <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
            </View>
          </GlassCard>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  scrollContent: {
    paddingTop: 96,
    paddingHorizontal: spacing.md,
  },

  // Page header
  pageHeader: {
    marginTop: spacing.sm,
    marginBottom: 32,
  },
  displayTitle: {
    ...fonts.display,
    color: colors.onSurface,
  },
  subtitle: {
    ...fonts.bodyLg,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },

  // Hero card
  heroCard: {
    height: 240,
    overflow: 'hidden',
  },
  heroCrystalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(100,80,200,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  heroContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    gap: 4,
  },
  heroIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(207,193,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(207,193,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    ...fonts.h2,
    color: colors.onSurface,
  },
  heroBody: {
    ...fonts.body,
    color: colors.onSurfaceVariant,
  },

  // 2-column grid
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  gridCardWrap: {
    flex: 1,
  },
  gridCard: {
    height: 140,
    justifyContent: 'space-between',
  },
  gridCardBottom: {
    gap: 2,
  },
  gridCardTitle: {
    ...fonts.h2,
    color: colors.onSurface,
  },
  gridCardBody: {
    ...fonts.body,
    color: colors.onSurfaceVariant,
  },
  gridCardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Settings card
  settingsCard: {
    marginTop: 12,
    height: 64,
    justifyContent: 'center',
  },
  settingsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    flex: 1,
    ...fonts.h2,
    color: colors.onSurface,
  },
});
