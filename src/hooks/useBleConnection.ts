import { useBleStore } from '../state/bleStore';
import type { ConnectionState } from '../ble/types';

const CONNECTING_STATES: ConnectionState[] = [
  'SCANNING',
  'CONNECTING',
  'DISCOVERING',
  'SUBSCRIBING',
];

export function useBleConnection() {
  const connectionState = useBleStore((s) => s.connectionState);
  const connectedDeviceId = useBleStore((s) => s.connectedDeviceId);
  const rssi = useBleStore((s) => s.rssi);

  const connected = connectionState === 'READY';
  const connecting = CONNECTING_STATES.includes(connectionState);
  const reconnecting = connectionState === 'RECONNECTING';

  return {
    connectionState,
    connectedDeviceId,
    connected,
    connecting,
    reconnecting,
    rssi,
  };
}
