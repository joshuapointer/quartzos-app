import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export type TabId = 'session' | 'presets' | 'history' | 'configure';

const TABS: { id: TabId; label: string }[] = [
  { id: 'session',   label: 'Session' },
  { id: 'presets',   label: 'Presets' },
  { id: 'history',   label: 'History' },
  { id: 'configure', label: 'Configure' },
];

const TIMING = { duration: 200, easing: Easing.out(Easing.quad) };

function TabButton({
  tab,
  index,
  activeIndexAnim,
  onPress,
}: {
  tab: { id: TabId; label: string };
  index: number;
  activeIndexAnim: SharedValue<number>;
  onPress: () => void;
}) {
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      activeIndexAnim.value === index
        ? 'rgba(36,29,24,0.95)'
        : 'transparent',
      TIMING
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: withTiming(
      activeIndexAnim.value === index ? '#e8dfd2' : '#6d6050',
      TIMING
    ),
    fontWeight: activeIndexAnim.value === index ? '500' : '400',
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.tabTouch}
    >
      <Animated.View style={[styles.tabBg, bgStyle]}>
        <Animated.Text style={[styles.tabText, textStyle]}>
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function QTabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom + 8, 20);
  const activeIndexAnim = useSharedValue(TABS.findIndex((t) => t.id === active));

  useEffect(() => {
    activeIndexAnim.value = TABS.findIndex((t) => t.id === active);
  }, [active]);

  return (
    <View style={[styles.outerWrap, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View style={styles.pill}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFillObject, styles.pillOverlay]} />
        <View style={[StyleSheet.absoluteFillObject, styles.pillBorder]} pointerEvents="none" />
        {TABS.map((tab, index) => (
          <TabButton
            key={tab.id}
            tab={tab}
            index={index}
            activeIndexAnim={activeIndexAnim}
            onPress={() => onChange(tab.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 30,
  },
  pill: {
    flexDirection: 'row',
    gap: 2,
    padding: 4,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 14,
  },
  pillOverlay: {
    backgroundColor: 'rgba(10,8,6,0.65)',
    borderRadius: 100,
  },
  pillBorder: {
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.09)',
  },
  tabTouch: {
    flex: 1,
    borderRadius: 100,
    overflow: 'hidden',
  },
  tabBg: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 0,
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
