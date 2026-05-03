import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { MMKV } from 'react-native-mmkv';
import { useSessionStore } from '../state/sessionStore';

const phoneAlertStorage = new MMKV({ id: 'quartzos' });

/**
 * Resolve the user's phone-side alarm thresholds and toggles. Falls back to
 * the device-side thresholds if the user hasn't customized phone alerts.
 */
function readPhoneAlertConfig(deviceDabF: number, deviceDunkF: number) {
  const dabEnabled = phoneAlertStorage.getBoolean('dabAlertEnabled') ?? true;
  const dunkEnabled = phoneAlertStorage.getBoolean('dunkAlertEnabled') ?? true;
  const dabF = phoneAlertStorage.getNumber('phoneDabAlarmF') ?? deviceDabF;
  const dunkF = phoneAlertStorage.getNumber('phoneDunkAlarmF') ?? deviceDunkF;
  return { dabEnabled, dunkEnabled, dabF, dunkF };
}

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
   *
   * The dab/dunk thresholds passed in are the device-side defaults; the
   * service overlays the user's phone-alert preferences from MMKV (set via
   * the Phone Alerts modal) so the user can customize phone notifications
   * independently from on-device alarm temps.
   */
  onTemp(tempF: number, deviceDabF: number, deviceDunkF: number): void {
    const { dabEnabled, dunkEnabled, dabF, dunkF } = readPhoneAlertConfig(
      deviceDabF,
      deviceDunkF,
    );

    // Dab alarm: rising edge through dabF
    if (dabEnabled && !this.dabFired && tempF >= dabF && this.lastTempF < dabF) {
      this.dabReached = true;
      this.fireDabAlert();
    }
    // Re-arm dab after cooldown (temp dropped 5°F below alarm)
    if (this.dabFired && tempF < dabF - this.HYSTERESIS_F) {
      this.dabFired = false;
    }

    // Dunk alarm: falling edge through dunkF, only after dab was reached this session
    if (
      dunkEnabled &&
      this.dabReached &&
      !this.dunkFired &&
      tempF <= dunkF &&
      this.lastTempF > dunkF
    ) {
      this.fireDunkAlert();
    }
    // Re-arm dunk
    if (this.dunkFired && tempF > dunkF + this.HYSTERESIS_F) {
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
        title: 'Dab temp reached',
        body: 'Your quartz is ready.',
        sound: 'dab_alarm.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 200, 100, 200],
      },
      trigger: null,
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
        title: 'Dunk temp reached',
        body: 'Time to drop your concentrate.',
        sound: 'dab_alarm.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 200, 100, 200],
      },
      trigger: null,
    }).catch(console.warn);
  }
}

export const alarmService = new AlarmService();
