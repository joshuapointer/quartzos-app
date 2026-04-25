import { create } from 'zustand';

interface UiState {
  useCelsius: boolean;
  hapticsEnabled: boolean;
  toggleUnit: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  useCelsius: false,
  hapticsEnabled: true,
  toggleUnit: () => set((s) => ({ useCelsius: !s.useCelsius })),
}));
