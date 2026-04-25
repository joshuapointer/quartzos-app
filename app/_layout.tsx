import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { initDb } from '../src/db';
import { setupNotificationChannels } from '../src/notifications/channels';

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
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const [dbReady, setDbReady] = useState(false);
  const ready = dbReady && (fontsLoaded ?? false);

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

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#120C1F' },
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#120C1F' } });
