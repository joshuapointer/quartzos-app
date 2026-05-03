import { Stack } from 'expo-router';

import { ErrorBoundary } from '../../src/design';

export default function ConnectedLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </ErrorBoundary>
  );
}
