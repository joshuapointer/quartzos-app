import React, { useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { findBanger } from '../../../data/bangers';
import { BangerAnatomy } from '../BangerAnatomy';
import { BANGER_CATEGORY_LABELS, CARD_GAP, CARD_W } from './constants';
import { ORDERED_BANGERS } from './utils';
import { styles } from './styles';
import type { BangerStepProps } from './types';
import { spacing } from '../../tokens';

export function StepBanger({ bangerId, onSelect }: BangerStepProps) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const stride = CARD_W + CARD_GAP;
  const sidePad = (windowWidth - CARD_W) / 2;

  const cards = ORDERED_BANGERS;

  const activeIndex = useMemo(() => {
    const idx = cards.findIndex((b) => b.id === bangerId);
    return idx === -1 ? 0 : idx;
  }, [bangerId, cards]);

  useEffect(() => {
    if (!bangerId) return;
    scrollRef.current?.scrollTo({ x: activeIndex * stride, animated: true });
  }, [bangerId, activeIndex, stride]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / stride);
    const clamped = Math.max(0, Math.min(cards.length - 1, index));
    const target = cards[clamped];
    if (target && target.id !== bangerId) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(target.id);
    }
  };

  const banger = bangerId ? findBanger(bangerId) ?? null : null;

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
        {cards.map((b, idx) => {
          const active = b.id === bangerId;
          const prev = idx > 0 ? cards[idx - 1] : null;
          const showCategoryBadge = !prev || prev.category !== b.category;
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
              {showCategoryBadge ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {BANGER_CATEGORY_LABELS[b.category]}
                  </Text>
                </View>
              ) : null}
              <View style={styles.bangerDiagramFrame}>
                <BangerAnatomy banger={b} size={80} />
              </View>
              <Text style={styles.bangerName} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={styles.bangerSpec} numberOfLines={2}>
                {b.geometry} · {b.surface_temp_range_f[0]}–{b.surface_temp_range_f[1]}°F
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.dotRow}>
        {cards.map((b, i) => (
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
        <Text style={styles.labelCaps}>About this banger</Text>
        {banger ? (
          <>
            <Text style={styles.bangerGeometryLine}>
              {banger.geometry.toUpperCase()} · {banger.cold_start_compatible === 'NO'
                ? 'No cold start'
                : banger.cold_start_compatible === 'YES'
                  ? 'Cold start ready'
                  : 'Cold start optional'}
            </Text>
            <Text style={styles.thermalNote}>{banger.description}</Text>
            <View style={styles.bangerSpecRow}>
              <View style={styles.bangerSpecCell}>
                <Text style={styles.labelCaps}>Heat</Text>
                <Text style={styles.bangerSpecValue}>{banger.heat_time_seconds}s</Text>
              </View>
              <View style={styles.bangerSpecCell}>
                <Text style={styles.labelCaps}>Cool</Text>
                <Text style={styles.bangerSpecValue}>{banger.cooldown_seconds}s</Text>
              </View>
            </View>
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
