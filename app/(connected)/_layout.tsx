import { Stack } from 'expo-router';

import { ErrorBoundary } from '../../src/design';

export default function ConnectedLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="history/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="presets/new" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="presets/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </ErrorBoundary>
  );
}
