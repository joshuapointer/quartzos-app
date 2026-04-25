import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ConnectionState } from '../ble/types';

interface BleState {
  connectionState: ConnectionState;
  liveTempF: number;
  rssi: number | null;
  connectedDeviceId: string | null;
  setConnectionState: (s: ConnectionState) => void;
  setLiveTempF: (f: number) => void;
  setRssi: (r: number) => void;
  setConnectedDevice: (id: string | null) => void;
}

export const useBleStore = create<BleState>()(immer((set) => ({
  connectionState: 'IDLE',
  liveTempF: 0,
  rssi: null,
  connectedDeviceId: null,
  setConnectionState: (s) => set((st) => { st.connectionState = s; }),
  setLiveTempF: (f) => set((st) => { st.liveTempF = f; }),
  setRssi: (r) => set((st) => { st.rssi = r; }),
  setConnectedDevice: (id) => set((st) => { st.connectedDeviceId = id; }),
})));
