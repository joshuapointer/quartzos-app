import { useSessionStore } from '../state/sessionStore';
export function useSessionRecorder() {
  return useSessionStore((s) => ({ active: s.active, samples: s.samples, peakF: s.peakF }));
}
