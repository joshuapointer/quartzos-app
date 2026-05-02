import React from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '../ThemeContext';
import { animation } from '../tokens';

const { height: SCREEN_H } = Dimensions.get('window');

export interface MainBottomSheetHandle {
  openToPresets: () => void;
  openToHistory: () => void;
  openToReference: () => void;
  collapse: () => void;
}

export interface MainBottomSheetProps {
  presetsContent: React.ReactNode;
  historyContent: React.ReactNode;
  configureContent: React.ReactNode;
  referenceContent: React.ReactNode;
  onExpand?: () => void;
  onCollapse?: () => void;
}

type TabKey = 'presets' | 'history' | 'configure' | 'reference';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SheetTabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useThemeColors();
  const progress = useSharedValue(isActive ? 1 : 0);
  const pressScale = useSharedValue(1);

  React.useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });
  }, [isActive]);

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [theme.onSurfaceVariant, theme.onSurface]),
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: progress.value }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { pressScale.value = withSpring(0.97, animation.pressSpring); }}
      onPressOut={() => { pressScale.value = withSpring(1, animation.pressSpring); }}
      style={[styles.tabItem, scaleStyle]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.Text style={[styles.tabLabel, labelStyle]}>
        {label}
      </Animated.Text>
      <Animated.View
        style={[styles.tabIndicator, { backgroundColor: theme.primary }, indicatorStyle]}
      />
    </AnimatedPressable>
  );
}

const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 } as const;

export const MainBottomSheet = React.forwardRef<
  MainBottomSheetHandle,
  MainBottomSheetProps
>(function MainBottomSheet(
  { presetsContent, historyContent, configureContent, referenceContent, onExpand, onCollapse },
  ref,
) {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();

  const SHEET_HEIGHT = SCREEN_H - insets.top - 100;
  const PEEK_OFFSET = SHEET_HEIGHT - 120;
  const FULL_OFFSET = 0;

  const translateY = useSharedValue(PEEK_OFFSET);
  const [selectedTab, setSelectedTab] = React.useState<TabKey>('presets');

  const expandSheet = React.useCallback(() => {
    translateY.value = withSpring(FULL_OFFSET, SPRING_CONFIG);
    onExpand?.();
  }, [translateY, onExpand]);

  const collapseSheet = React.useCallback(() => {
    translateY.value = withSpring(PEEK_OFFSET, SPRING_CONFIG);
    onCollapse?.();
  }, [translateY, PEEK_OFFSET, onCollapse]);

  React.useImperativeHandle(ref, () => ({
    openToPresets() {
      setSelectedTab('presets');
      expandSheet();
    },
    openToHistory() {
      setSelectedTab('history');
      expandSheet();
    },
    openToReference() {
      setSelectedTab('reference');
      expandSheet();
    },
    collapse() {
      collapseSheet();
    },
  }));

  const gesture = Gesture.Pan()
    .onChange((event) => {
      const next = translateY.value + event.changeY;
      translateY.value = Math.max(FULL_OFFSET, Math.min(PEEK_OFFSET, next));
    })
    .onEnd((event) => {
      const midpoint = PEEK_OFFSET / 2;
      if (
        event.velocityY > 600 ||
        (event.velocityY > -200 && translateY.value > midpoint)
      ) {
        translateY.value = withSpring(PEEK_OFFSET, SPRING_CONFIG);
        if (onCollapse) runOnJS(onCollapse)();
      } else {
        translateY.value = withSpring(FULL_OFFSET, SPRING_CONFIG);
        if (onExpand) runOnJS(onExpand)();
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'presets', label: 'Presets' },
    { key: 'history', label: 'History' },
    { key: 'configure', label: 'Configure' },
    { key: 'reference', label: 'Reference' },
  ];

  return (
    <Animated.View
      style={[
        styles.sheet,
        { height: SHEET_HEIGHT },
        sheetAnimStyle,
      ]}
    >
      {/* Blur background */}
      <BlurView
        intensity={25}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />

      {/* Dark overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.bgDeep + '99' },
        ]}
        pointerEvents="none"
      />

      {/* Top border */}
      <View
        style={[styles.topBorder, { borderColor: theme.glassBorder }]}
        pointerEvents="none"
      />

      {/* Drag area — gesture only applied here to avoid scroll conflicts */}
      <GestureDetector gesture={gesture}>
        <View style={styles.dragArea}>
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: theme.outline }]} />
          </View>

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {tabs.map(({ key, label }) => (
              <SheetTabButton
                key={key}
                label={label}
                isActive={selectedTab === key}
                onPress={() => setSelectedTab(key)}
              />
            ))}
          </View>
        </View>
      </GestureDetector>

      {/* Content — scrolls independently, no gesture conflict */}
      <View style={styles.content}>
        {selectedTab === 'presets' && presetsContent}
        {selectedTab === 'history' && historyContent}
        {selectedTab === 'configure' && configureContent}
        {selectedTab === 'reference' && referenceContent}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
  },
  dragArea: {
    // Only this region responds to pan gestures — keeps scroll unblocked
  },
  handleRow: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 6,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
});
