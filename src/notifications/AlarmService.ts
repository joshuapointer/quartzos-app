import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '../state/sessionStore';

export class AlarmService {
  private lastTempF = 0;
  private dabFired = false;
  private dunkFired = false;
  private dabReached = false;
  private dabFiredThisSession = false;
  private dunkFiredThisSession = false;
  private readonly HYSTERESIS_F = 5;
  private readonly COOLDOWN_MS = 30_000;
  private lastDabFireAt = 0;
  private lastDunkFireAt = 0;

  /**
   * Call this on every temperature update.
   * Manages dab-ready (rising edge) and dunk-ready (falling edge after dab) alerts.
   */
  onTemp(tempF: number, dabAlarmF: number, dunkAlarmF: number): void {
    // Dab alarm: rising edge through dabAlarmF
    if (!this.dabFired && tempF >= dabAlarmF && this.lastTempF < dabAlarmF) {
      this.dabReached = true;
      this.fireDabAlert();
    }
    // Re-arm dab after cooldown (temp dropped 5°F below alarm)
    if (this.dabFired && tempF < dabAlarmF - this.HYSTERESIS_F) {
      this.dabFired = false;
    }

    // Dunk alarm: falling edge through dunkAlarmF, only after dab was reached this session
    if (this.dabReached && !this.dunkFired && tempF <= dunkAlarmF && this.lastTempF > dunkAlarmF) {
      this.fireDunkAlert();
    }
    // Re-arm dunk
    if (this.dunkFired && tempF > dunkAlarmF + this.HYSTERESIS_F) {
      this.dunkFired = false;
    }

    this.lastTempF = tempF;
  }

  resetSession(): void {
    this.dabFired = false;
    this.dunkFired = false;
    this.dabReached = false;
    this.dabFiredThisSession = false;
    this.dunkFiredThisSession = false;
    this.lastTempF = 0;
  }

  private async fireDabAlert(): Promise<void> {
    this.dabFired = true;
    if (this.dabFiredThisSession) return;
    if (Date.now() - this.lastDabFireAt < this.COOLDOWN_MS) return;
    this.lastDabFireAt = Date.now();
    this.dabFiredThisSession = true;
    useSessionStore.getState().fireAlert('dab');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Dab Temp Reached',
        body: 'Your quartz is ready.',
        sound: 'dab-alarm.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 200, 100, 200],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(),
        channelId: 'alarms',
      },
    }).catch(console.warn);
  }

  private async fireDunkAlert(): Promise<void> {
    this.dunkFired = true;
    if (this.dunkFiredThisSession) return;
    if (Date.now() - this.lastDunkFireAt < this.COOLDOWN_MS) return;
    this.lastDunkFireAt = Date.now();
    this.dunkFiredThisSession = true;
    useSessionStore.getState().fireAlert('dunk');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '❄️ Dunk Temp Reached',
        body: 'Time to drop your concentrate.',
        sound: 'dab-alarm.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 200, 100, 200],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(),
        channelId: 'alarms',
      },
    }).catch(console.warn);
  }
}

export const alarmService = new AlarmService();
