import { useEffect, useState } from 'react';
import { AppState, StyleSheet, LogBox } from 'react-native';

LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered.']);
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
  Geist_300Light,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_300Light,
  GeistMono_400Regular,
  GeistMono_500Medium,
} from '@expo-google-fonts/geist-mono';

import { initDb } from '../src/db';
import { setupNotificationChannels } from '../src/notifications/channels';
import { ThemeProvider } from '../src/design/ThemeContext';
import { colors } from '../src/design/tokens';
import { ErrorBoundary, ToastHost } from '../src/design';
import { BleManager } from '../src/ble/BleManager';

// Keep the splash screen up until we're ready.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [geistLoaded] = useFonts({
    Geist_300Light,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
    GeistMono_300Light,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });
  const [dbReady, setDbReady] = useState(false);
  const fontsLoaded = geistLoaded ?? false;
  const ready = dbReady && fontsLoaded;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDb();
        await setupNotificationChannels();
      } catch {
        /* swallow — app can still proceed without DB/channel bootstrap */
      }
      if (!cancelled) setDbReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [ready]);

  // Flush an in-memory session to SQLite when the app drops to background
  // (the OS may suspend or kill us before the BLE-driven idle teardown
  // would otherwise complete the write). Resume does nothing — the next
  // session starts fresh once the rig hits 150°F again.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        void BleManager.flushActiveSession();
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={styles.root}>
          <StatusBar style="light" />
          <ErrorBoundary>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bgDeep },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding/permissions" />
              <Stack.Screen name="onboarding/pair" />
              <Stack.Screen name="(connected)" />
              <Stack.Screen
                name="(modals)/scan"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="(modals)/color-picker"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="(modals)/notification-config"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack>
          </ErrorBoundary>
          <ToastHost />
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bgDeep } });
