import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export { SCREEN_W, SCREEN_H };

export const colors = {
  // Backgrounds
  idleDeep:     '#0A1F3D',
  idleMid:      '#1B3A6B',
  idleLight:    '#2B4E90',
  // Active/heat states
  activeAmber:  '#FFA93C',
  activeGlow:   '#FFD27A',
  activeDark:   '#D46A0B',
  // Crystal/glass
  crystalWhite: 'rgba(255,255,255,0.85)',
  crystalEdge:  'rgba(255,255,255,0.38)',
  glassTint:    'rgba(180,210,255,0.18)',
  glassDeep:    'rgba(10,31,61,0.72)',
  // Chrome
  chromeHi:     '#F6F8FB',
  chromeMid:    '#B9C5D2',
  chromeLo:     '#4A5668',
  bezelDark:    '#1E2530',
  bezelLight:   '#3A4A62',
  // Alert
  alertRed:     '#FF4E50',
  alertAmber:   '#FF9F2E',
  success:      '#49D67A',
  // Text
  textPrimary:  '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textDim:      'rgba(255,255,255,0.38)',
};

export const gradients = {
  background:   ['#0A1F3D', '#132D5A', '#1B3A6B'] as const,
  amber:        ['#FFD27A', '#FFA93C', '#D46A0B'] as const,
  chrome:       ['#F6F8FB', '#D0D8E2', '#B9C5D2', '#4A5668'] as const,
  crystal:      ['rgba(255,255,255,0.45)', 'rgba(200,220,255,0.15)', 'rgba(100,150,220,0.08)'] as const,
  gloss:        ['rgba(255,255,255,0.52)', 'rgba(255,255,255,0.0)'] as const,
  heatCore:     ['rgba(255,160,0,0.0)', 'rgba(255,160,0,0.35)', 'rgba(255,200,80,0.7)'] as const,
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
    shadowColor: '#1B3A6B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
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
  display: { fontSize: 72, letterSpacing: -1.5 },
  h1:      { fontSize: 28, letterSpacing: -0.5 },
  h2:      { fontSize: 22 },
  body:    { fontSize: 16 },
  caption: { fontSize: 12, letterSpacing: 0.4 },
};

export const animation = {
  shimmerDurationMs: 4200,
  pulseDurationMs: 1400,
  pressSpring: { damping: 14, stiffness: 220, mass: 0.6 },
  toggleSpring: { damping: 15, stiffness: 260, mass: 0.5 },
  thumbSpring: { damping: 18, stiffness: 200, mass: 0.7 },
};
