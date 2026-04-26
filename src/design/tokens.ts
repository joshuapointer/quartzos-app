import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export { SCREEN_W, SCREEN_H };

export const colors = {
  // Backgrounds (amethyst-deep)
  bgDeep:      '#120C1F',
  surface1:    '#110b1e',
  surface2:    '#161023',
  surface3:    '#1e182c',
  surface4:    '#231c30',
  surface5:    '#2d273b',
  surface6:    '#383146',
  surfaceBright: '#3d364b',

  // Primary (amethyst/lavender)
  primary:           '#cfc1ff',
  primaryContainer:  '#b5a1ff',
  primaryFixedDim:   '#ccbdff',
  primaryFixedHigh:  '#e7deff',
  inversePrimary:    '#6350a8',

  // Secondary (rose/mauve)
  secondary:           '#e1bae2',
  secondaryContainer:  '#5a3c5d',

  // Glass surfaces
  glassFill:   'rgba(18,12,31,0.40)',
  glassBorder: 'rgba(204,189,255,0.10)',

  // On-surface text
  onSurface:        '#e9def9',
  onSurfaceVariant: '#cac4d3',
  outline:          '#938e9c',
  outlineVariant:   '#484551',

  // Semantic
  error:   '#ffb4ab',
  warning: '#FF9F2E',
  success: '#49D67A',

  // Heat-state ring colors (preserved for usability)
  heatIdle:    'rgba(140,180,255,0.5)',
  heatAmber:   '#FFA93C',
  heatGlow:    '#FFD27A',
  heatCyan:    '#5AD9FF',
  heatCooling: 'rgba(212,106,11,0.55)',

  // Gem palette for presets / aura core
  ruby:     '#ff4d6d',
  amethyst: '#b5a1ff',
  emerald:  '#06d6a0',
  sapphire: '#60a5fa',
  citrine:  '#fbbf24',

  // Legacy aliases (used by a few screens – kept to avoid breaking changes)
  /** @deprecated use bgDeep */
  idleDeep:     '#120C1F',
  /** @deprecated use onSurface */
  textPrimary:  '#e9def9',
  /** @deprecated use onSurfaceVariant */
  textSecondary: '#cac4d3',
  /** @deprecated use outline */
  textDim:      '#938e9c',
  /** @deprecated use outlineVariant */
  crystalEdge:  'rgba(204,189,255,0.10)',
  /** @deprecated use glassFill */
  glassDeep:    'rgba(18,12,31,0.40)',
  /** @deprecated use heatAmber */
  activeAmber:  '#FFA93C',
  /** @deprecated use heatGlow */
  activeGlow:   '#FFD27A',
  /** @deprecated use primary */
  activeDark:   '#cfc1ff',
};

export const gradients = {
  background:   ['#120C1F', '#161023', '#1e182c'] as const,
  amethyst:     ['#e7deff', '#cfc1ff', '#5a3c5d'] as const,
  primary:      ['#e7deff', '#b5a1ff', '#6350a8'] as const,
  secondary:    ['#ffd6ff', '#e1bae2', '#5a3c5d'] as const,
  wordmark:     ['#ffffff', '#b5a1ff'] as const,
  crystal:      ['rgba(207,193,255,0.15)', 'rgba(100,80,180,0.05)', 'rgba(18,12,31,0)'] as const,
  gloss:        ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.0)'] as const,
  heatCore:     ['rgba(255,160,0,0.0)', 'rgba(255,160,0,0.25)', 'rgba(255,200,80,0.5)'] as const,
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radius = {
  sm: 8, md: 16, lg: 24, xl: 32, full: 9999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  orb: {
    shadowColor: '#b5a1ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 20,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const fonts = {
  display: { fontSize: 48, letterSpacing: -1.92, fontWeight: '300' as const },
  h1:      { fontSize: 32, letterSpacing: -0.64, fontWeight: '400' as const },
  h2:      { fontSize: 24, fontWeight: '400' as const },
  bodyLg:  { fontSize: 18, fontWeight: '300' as const },
  body:    { fontSize: 16, fontWeight: '300' as const },
  caption: { fontSize: 12, letterSpacing: 0.4 },
  labelCaps: { fontSize: 12, letterSpacing: 1.2, fontWeight: '500' as const, textTransform: 'uppercase' as const },
};

export const animation = {
  shimmerDurationMs: 4200,
  pulseDurationMs: 1400,
  pressSpring: { damping: 14, stiffness: 220, mass: 0.6 },
  toggleSpring: { damping: 15, stiffness: 260, mass: 0.5 },
  thumbSpring: { damping: 18, stiffness: 200, mass: 0.7 },
  orbitDurationMs: 30000,
};
