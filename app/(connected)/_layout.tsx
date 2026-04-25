import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { animation, colors, radius, spacing } from '../../src/design/tokens';

// Tab definitions
const TABS: Array<{
  name: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}> = [
  { name: 'home',     icon: 'flare' },
  { name: 'hub',      icon: 'diamond' },
  { name: 'presets',  icon: 'auto-awesome' },
  { name: 'settings', icon: 'tune' },
];

export default function ConnectedLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="home"     options={{ title: 'Home' }} />
      <Tabs.Screen name="hub"      options={{ title: 'Hub' }} />
      <Tabs.Screen name="presets"  options={{ title: 'Presets' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Hidden screens — registered so navigation still works */}
      <Tabs.Screen name="history"      options={{ href: null }} />
      <Tabs.Screen name="history/[id]" options={{ href: null }} />
      <Tabs.Screen name="presets/[id]" options={{ href: null }} />
    </Tabs>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.barContainer,
        { bottom: Math.max(insets.bottom + 8, 24) },
      ]}
      pointerEvents="box-none"
    >
      {/* Blur layer */}
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      {/* Dark overlay */}
      <View style={styles.barOverlay} pointerEvents="none" />
      {/* Top highlight border */}
      <View style={styles.topBorder} pointerEvents="none" />

      {/* Tab items */}
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              icon={tab.icon}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabItemProps {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  focused: boolean;
  onPress: () => void;
}

function TabItem({ icon, focused, onPress }: TabItemProps) {
  const scale = useSharedValue(focused ? 1.1 : 1.0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1.0, animation.pressSpring);
  }, [focused, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = focused
    ? colors.primaryContainer
    : 'rgba(255,255,255,0.30)';

  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Animated.View style={iconStyle}>
        <MaterialIcons name={icon} size={26} color={iconColor} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 80,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: colors.primaryContainer,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    elevation: 20,
  },
  barOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,12,31,0.80)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
