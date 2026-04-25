import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('alarms', {
    name: 'Temperature Alarms',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'dab_alarm.wav',
    vibrationPattern: [0, 200, 100, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
  await Notifications.setNotificationChannelAsync('connection', {
    name: 'Connection Status',
    importance: Notifications.AndroidImportance.LOW,
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true,
    },
  });
  return status === 'granted';
}
