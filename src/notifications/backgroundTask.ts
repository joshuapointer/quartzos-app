import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const FOREGROUND_SERVICE_TASK = 'quartzos-ble-foreground';

const FOREGROUND_NOTIFICATION_ID = 'quartzos-foreground-service';

// Register the task (call at module load time)
TaskManager.defineTask(FOREGROUND_SERVICE_TASK, async () => {
  return { shouldContinue: true };
});

export async function startForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: FOREGROUND_NOTIFICATION_ID,
      content: {
        title: 'Quartzie Active',
        body: 'Quartzie is monitoring your Dab Rite.',
        sticky: true,
        autoDismiss: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(),
        channelId: 'connection',
      },
    });
  } catch (e) {
    console.warn('Foreground service start failed:', e);
  }
}

export async function stopForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(FOREGROUND_NOTIFICATION_ID);
    await Notifications.dismissNotificationAsync(FOREGROUND_NOTIFICATION_ID);
  } catch (e) {
    console.warn('Foreground service stop failed:', e);
  }
}
