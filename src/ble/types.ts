export type RGB565 = number;

export interface DeviceSettings {
  colors: [RGB565, RGB565, RGB565, RGB565];
  dabAlarmF: number;
  dunkAlarmF: number;
  useCelsius: boolean;
  opaqueMode: boolean;
  soundAlert: boolean;
  lightAlert: boolean;
  ledGuide: boolean;
  nightMode: boolean;
  volume: number;
  keyTone: number;
  dabSound: number;
  dunkSound: number;
}

export type ConnectionState =
  | 'IDLE'
  | 'SCANNING'
  | 'CONNECTING'
  | 'DISCOVERING'
  | 'SUBSCRIBING'
  | 'READY'
  | 'RECONNECTING'
  | 'ERROR';

export const DEFAULT_SETTINGS: DeviceSettings = {
  colors: [0x60CC, 0x700E, 0x8852, 0xE659],
  dabAlarmF: 550,
  dunkAlarmF: 250,
  useCelsius: false,
  opaqueMode: false,
  soundAlert: true,
  lightAlert: true,
  ledGuide: true,
  nightMode: false,
  volume: 3,
  keyTone: 0,
  dabSound: 1,
  dunkSound: 1,
};
