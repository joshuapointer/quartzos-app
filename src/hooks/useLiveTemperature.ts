import { useBleStore } from '../state/bleStore';
import { fToC } from '../utils/temperature';

export function useLiveTemperature(useCelsius = false) {
  const tempF = useBleStore((s) => s.liveTempF);
  const tempDisplay = useCelsius ? fToC(tempF) : tempF;
  const unit = useCelsius ? '°C' : '°F';
  return { tempF, tempDisplay, unit };
}
