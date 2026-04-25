import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { animation, colors, fonts, gradients, radius, spacing } from '../../src/design/tokens';
import { useBleConnection } from '../../src/hooks/useBleConnection';
import { useBleStore } from '../../src/state/bleStore';

export default function ConnectedLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ChromeTabBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      <Tabs.Screen name="presets" options={{ title: 'Presets' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
    </Tabs>
  );
}

function ChromeTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={tabStyles.wrap}>
      <StatusBadge />
      <LinearGradient
        colors={gradients.chrome}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={tabStyles.bezel} pointerEvents="none" />
      <View style={tabStyles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;

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
              name={route.name}
              label={label}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

interface ItemProps {
  name: string;
  label: string;
  focused: boolean;
  onPress: () => void;
}

function TabItem({ name, label, focused, onPress }: ItemProps) {
  const scale = useSharedValue(focused ? 1 : 0.95);
  const indicator = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.95, animation.toggleSpring);
    indicator.value = withSpring(focused ? 1 : 0, animation.toggleSpring);
  }, [focused, scale, indicator]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicator.value,
    transform: [{ scaleX: indicator.value }],
  }));

  const color = focused ? colors.activeDark : colors.chromeLo;

  return (
    <Pressable onPress={onPress} style={tabStyles.item}>
      <Animated.View style={indicatorStyle}>
        <LinearGradient
          colors={gradients.amber}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tabStyles.indicator}
        />
      </Animated.View>
      <Animated.View style={[tabStyles.icon, iconStyle]}>
        <TabIcon name={name} color={color} />
      </Animated.View>
      <Text style={[tabStyles.label, { color }]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case 'home':
      return (
        // Thermometer
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3 a3 3 0 0 1 3 3 v8 a4 4 0 1 1 -6 0 V6 a3 3 0 0 1 3 -3 z"
            stroke={color}
            strokeWidth={1.8}
            fill="none"
          />
          <Circle cx={12} cy={17} r={2.4} fill={color} />
          <Path d="M12 7 v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'settings':
      return (
        // Slider
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M4 7 h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M4 12 h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M4 17 h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={9} cy={7} r={2.4} fill={color} />
          <Circle cx={15} cy={12} r={2.4} fill={color} />
          <Circle cx={7} cy={17} r={2.4} fill={color} />
        </Svg>
      );
    case 'presets':
      return (
        // Bookmark
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 4 h10 a1 1 0 0 1 1 1 v15 l-6 -4 l-6 4 V5 a1 1 0 0 1 1 -1 z"
            stroke={color}
            strokeWidth={1.8}
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'history':
      return (
        // Clock
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" />
          <Path d="M12 7 v5 l3 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Rect x={4} y={4} width={16} height={16} rx={3} stroke={color} strokeWidth={1.8} fill="none" />
        </Svg>
      );
  }
}

function StatusBadge() {
  const { connectionState } = useBleConnection();
  const rssi = useBleStore((s) => s.rssi);

  let dotColor = colors.alertRed;
  let label = 'OFFLINE';
  if (connectionState === 'READY') {
    dotColor = colors.success;
    label = rssi != null ? `${rssi} dBm` : 'LIVE';
  } else if (connectionState === 'RECONNECTING') {
    dotColor = colors.alertAmber;
    label = 'RECONNECTING';
  } else if (
    connectionState === 'SCANNING' ||
    connectionState === 'CONNECTING' ||
    connectionState === 'DISCOVERING' ||
    connectionState === 'SUBSCRIBING'
  ) {
    dotColor = colors.alertAmber;
    label = 'CONNECTING';
  } else if (connectionState === 'ERROR') {
    dotColor = colors.alertRed;
    label = 'ERROR';
  }

  return (
    <View style={tabStyles.badge} pointerEvents="none">
      <View style={[tabStyles.badgeDot, { backgroundColor: dotColor }]} />
      <Text style={tabStyles.badgeLabel}>{label}</Text>
    </View>
  );
}

const TAB_HEIGHT = 72;

const tabStyles = StyleSheet.create({
  wrap: {
    height: TAB_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: colors.bezelDark,
    overflow: 'hidden',
  },
  bezel: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.55)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    marginTop: 4,
  },
  indicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginBottom: 2,
  },
  label: {
    ...fonts.caption,
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -26,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(10,31,61,0.8)',
    borderWidth: 1,
    borderColor: colors.crystalEdge,
    zIndex: 10,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginRight: 6,
  },
  badgeLabel: {
    ...fonts.caption,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
});
