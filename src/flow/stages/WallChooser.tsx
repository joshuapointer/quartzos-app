/**
 * src/flow/stages/WallChooser.tsx
 *
 * Step 2 of the builder — pick the wall thickness modifier.
 * Four cards: thin / standard / thick / unknown.
 *
 * Tokens: src/flow/theme.ts
 * Reference: /tmp/quartzie-prototype/src/flow-build.jsx WallChooser
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import ChooserCard from '../components/ChooserCard';
import { WALLS } from '../data';
import { useFlow } from '../store';

// ─── WallChooser ──────────────────────────────────────────────────────────────

export default function WallChooser() {
  const wallId = useFlow((s) => s.wallId);
  const setWallId = useFlow((s) => s.setWallId);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {WALLS.map((w, idx) => {
          const sign = w.mod > 0 ? '+' : '';
          const adj = w.mod === 0 ? '0°F' : `${sign}${w.mod}°F`;
          const sub = `${adj} adjustment · ${w.description}`;
          return (
            <Animated.View
              key={w.id}
              entering={FadeInUp.delay(120 + idx * 55).duration(380)}
            >
              <ChooserCard
                active={wallId === w.id}
                onPress={() => setWallId(w.id)}
                title={`${w.name} · ${w.thickness}`}
                sub={sub}
              />
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    gap: 8,
    paddingBottom: 16,
  },
});
