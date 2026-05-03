import type { HistoryFilter } from './types';

// ─── Layout constants ─────────────────────────────────────────────────────────

export const DIAL_MINI_SCALE = 0.42;
export const WORDMARK_H = 40;  // QWordmark intrinsic height (paddingTop:8 + text~24 + paddingBottom:4 + lineHeight)
export const NAV_HEIGHT = 72;

// ─── Spring constants (smooth, DR ≈ 0.90–1.0) ──────────────────────────────

export const SPRING_DIAL = { damping: 28, stiffness: 200, mass: 1 } as const;
export const SPRING_PANEL = { damping: 24, stiffness: 180, mass: 1 } as const;

// ─── Preset gem colors ────────────────────────────────────────────────────────

export const GEM_COLORS_ORDERED = ['#00a8ff', '#95ccff', '#C4AC54', '#7EC8A0', '#ffb4ab'];

// ─── Nav Node label map ───────────────────────────────────────────────────────

export const NAV_LABELS: Record<string, string> = {
  presets: 'PRESETS',
  history: 'HISTORY',
  configure: 'TUNE',
};

// ─── History filters ──────────────────────────────────────────────────────────

export const HISTORY_FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high', label: 'High · 540°+' },
  { id: 'mid', label: 'Mid · 500–540°' },
  { id: 'low', label: 'Low · <500°' },
];
