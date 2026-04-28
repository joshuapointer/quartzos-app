import * as Haptics from 'expo-haptics';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';

import ChooserCard from '../components/ChooserCard';
import { WALLS } from '../data';
import { useFlow } from '../store';

const STAGGER_EASING = Easing.bezier(0.22, 1, 0.36, 1);

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
              entering={FadeInUp.delay(120 + idx * 55).duration(380).easing(STAGGER_EASING)}
            >
              <ChooserCard
                active={wallId === w.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setWallId(w.id);
                }}
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
