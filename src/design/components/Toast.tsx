import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { animation, colors, fonts, motion, radius, reanimatedEasing, spacing } from '../tokens';

// ─── Store ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'info' | 'error' | 'success';

interface ToastSpec {
  id: number;
  message: string;
  variant: ToastVariant;
  retryLabel?: string;
  onRetry?: () => void;
  /** Lifetime in ms (default 3000). Pass 0 to keep until dismissed. */
  durationMs: number;
}

interface ToastState {
  current: ToastSpec | null;
  show: (spec: Omit<ToastSpec, 'id' | 'durationMs'> & { durationMs?: number }) => void;
  dismiss: () => void;
}

let toastIdCounter = 0;

const useToastStore = create<ToastState>()((set) => ({
  current: null,
  show: (spec) => set({
    current: {
      id: ++toastIdCounter,
      durationMs: 3000,
      ...spec,
    },
  }),
  dismiss: () => set({ current: null }),
}));

/**
 * Hook-style API. Brand-voice copy lives at call sites; this surface
 * just provides the verbs.
 */
export function useToast() {
  const show = useToastStore((s) => s.show);
  const dismiss = useToastStore((s) => s.dismiss);

  const info = useCallback(
    (message: string, opts?: { retryLabel?: string; onRetry?: () => void; durationMs?: number }) =>
      show({ message, variant: 'info', ...opts }),
    [show],
  );
  const error = useCallback(
    (message: string, opts?: { retryLabel?: string; onRetry?: () => void; durationMs?: number }) =>
      show({ message, variant: 'error', ...opts }),
    [show],
  );
  const success = useCallback(
    (message: string, opts?: { retryLabel?: string; onRetry?: () => void; durationMs?: number }) =>
      show({ message, variant: 'success', ...opts }),
    [show],
  );

  return { info, error, success, dismiss };
}

/**
 * Imperative API for non-React call sites (BleManager, etc).
 */
export const toast = {
  info: (message: string, opts?: { retryLabel?: string; onRetry?: () => void; durationMs?: number }) =>
    useToastStore.getState().show({ message, variant: 'info', ...opts }),
  error: (message: string, opts?: { retryLabel?: string; onRetry?: () => void; durationMs?: number }) =>
    useToastStore.getState().show({ message, variant: 'error', ...opts }),
  success: (message: string, opts?: { retryLabel?: string; onRetry?: () => void; durationMs?: number }) =>
    useToastStore.getState().show({ message, variant: 'success', ...opts }),
  dismiss: () => useToastStore.getState().dismiss(),
};

// ─── ToastHost ────────────────────────────────────────────────────────────────

/**
 * Mounts the live toast slot. Place once near the top of the app tree
 * (inside SafeAreaProvider). Slides down from the top, auto-dismisses
 * after the configured lifetime, exposes an optional Retry CTA.
 */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);

  const reduced = useReducedMotion();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (current) {
      translateY.value = reduced ? 0 : withSpring(0, animation.toastSpring);
      opacity.value = withTiming(1, { duration: motion.duration.popover, easing: reanimatedEasing.easeOut });
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      if (current.durationMs > 0) {
        const id = current.id;
        dismissTimer.current = setTimeout(() => {
          dismissTimer.current = null;
          // Only dismiss if the same toast is still up — newer toasts
          // own their own lifetime.
          if (useToastStore.getState().current?.id === id) dismiss();
        }, current.durationMs);
      }
    } else {
      translateY.value = reduced ? -120 : withTiming(-120, { duration: motion.exit.popover, easing: reanimatedEasing.easeOut });
      opacity.value = withTiming(0, { duration: motion.exit.popover, easing: reanimatedEasing.easeOut });
    }
    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    };
  }, [current, dismiss, translateY, opacity, reduced]);

  useEffect(() => () => {
    cancelAnimation(translateY);
    cancelAnimation(opacity);
  }, [translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleRetry = useCallback(() => {
    const fn = current?.onRetry;
    dismiss();
    if (fn) fn();
  }, [current, dismiss]);

  if (!current) return null;

  const accent =
    current.variant === 'error' ? colors.error :
    current.variant === 'success' ? colors.success :
    colors.firedAmber;

  const messageColor = current.variant === 'info' ? colors.bone100 : accent;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.host, { paddingTop: insets.top + 8 }, animStyle]}
    >
      <View style={[styles.card, { borderColor: accent }]}>
        <Text style={[styles.message, { color: messageColor }]} numberOfLines={3}>{current.message}</Text>
        {current.onRetry && (
          <TouchableOpacity
            onPress={handleRetry}
            style={styles.retryBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={current.retryLabel ?? 'Retry'}
          >
            <Text style={[styles.retryText, { color: accent }]}>
              {current.retryLabel ?? 'Retry'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={dismiss}
          style={styles.dismissBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 1000,
    elevation: 1000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface3,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingVertical: 10,
    overflow: 'hidden',
    shadowColor: colors.voidObsidian,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    ...fonts.body,
    color: colors.bone100,
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dismissBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    minHeight: 32,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: colors.bone50,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '300',
  },
});
