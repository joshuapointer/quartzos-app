import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export { SCREEN_W, SCREEN_H };

export const colors = {
  // ── Obsidian surfaces (warm dark brown-blacks) ─────────────────────────────
  bgDeep:       '#050403',
  surface1:     '#0c0908',
  surface2:     '#14100e',
  surface3:     '#1c1714',
  surface4:     '#2a2320',
  surface5:     '#352c27',
  surface6:     '#3d342e',
  surfaceBright:'#2a2320',

  // ── Bone whites (warm neutral type) ────────────────────────────────────────
  bone100: '#f4ede4',
  bone90:  '#e8dfd2',
  bone70:  '#c7b8a4',
  bone50:  '#9e907e',
  bone35:  '#6d6050',
  bone20:  '#413830',

  // ── Ember (warm amber / heat states) ───────────────────────────────────────
  emberBright:  '#E89240',  // at-target ring
  ember:        '#C97326',  // heating
  emberDeep:    '#8A4E16',  // deep heat
  emberMid:     '#9B6030',  // heating ring (dim)
  emberCool:    '#AD7040',  // cooling ring

  // ── Quartz (cool blue / dunk states) ────────────────────────────────────────
  quartzBright: '#9ABDD8',  // dunk ready
  quartz:       '#7BA8C4',
  quartzDeep:   '#5C8CAE',
  quartzDim:    '#4A7490',  // idle ring

  // ── Brass (custom preset accent) ────────────────────────────────────────────
  brass: '#C4AC54',

  // ── Inner lens colors (used by TempDial) ────────────────────────────────────
  lensIdle:    '#28283C',
  lensHeating: '#3D1E0A',
  lensTarget:  '#5E2E0C',
  lensCooling: '#3E2212',
  lensDunk:    '#2A3C52',

  // ── Semantic ─────────────────────────────────────────────────────────────────
  error:   '#E07070',
  warning: '#E89240',
  success: '#7EC8A0',

  // ── Backward-compat aliases (referenced by components not being redesigned) ──
  primary:           '#E89240',
  primaryContainer:  '#9ABDD8',
  primaryFixedDim:   '#c7b8a4',
  primaryFixedHigh:  '#f4ede4',
  inversePrimary:    '#8A4E16',
  secondary:         '#9ABDD8',
  secondaryContainer:'#2A3C52',
  onSurface:         '#f4ede4',
  onSurfaceVariant:  '#c7b8a4',
  outline:           '#6d6050',
  outlineVariant:    '#413830',
  glassFill:         'rgba(5,4,3,0.6)',
  glassBorder:       'rgba(244,237,228,0.08)',
  heatIdle:          '#4A7490',
  heatAmber:         '#E89240',
  heatGlow:          '#E89240',
  heatCyan:          '#9ABDD8',
  heatCooling:       '#AD7040',
  ruby:      '#E07070',
  amethyst:  '#9ABDD8',
  emerald:   '#7EC8A0',
  sapphire:  '#7BA8C4',
  citrine:   '#C4AC54',
  idleDeep:      '#050403',
  textPrimary:   '#f4ede4',
  textSecondary: '#c7b8a4',
  textDim:       '#6d6050',
  crystalEdge:   'rgba(244,237,228,0.08)',
  glassDeep:     'rgba(5,4,3,0.6)',
  activeAmber:   '#E89240',
  activeGlow:    '#E89240',
  activeDark:    '#E89240',
};

export const gradients = {
  background:  ['#050403', '#0c0908', '#14100e'] as const,
  ember:       ['#E89240', '#C97326', '#8A4E16'] as const,
  quartz:      ['#9ABDD8', '#7BA8C4', '#4A7490'] as const,
  heatCore:    ['rgba(232,146,64,0)', 'rgba(232,146,64,0.25)', 'rgba(201,115,38,0.5)'] as const,
  // Card surface gradients — use via SurfaceCard component
  cardActive:   ['#1e170e', '#0f0b06'] as const,  // active preset, highlighted rows
  cardInactive: ['#110d0a', '#0a0806'] as const,  // non-active items in a list
  cardNeutral:  ['#100e0c', '#0a0806'] as const,  // config sections, history cards
  // legacy
  amethyst:    ['#9ABDD8', '#7BA8C4', '#4A7490'] as const,
  primary:     ['#E89240', '#C97326', '#8A4E16'] as const,
  secondary:   ['#9ABDD8', '#7BA8C4', '#5C8CAE'] as const,
  wordmark:    ['#f4ede4', '#c7b8a4'] as const,
  crystal:     ['rgba(244,237,228,0.08)', 'rgba(244,237,228,0.02)', 'rgba(5,4,3,0)'] as const,
  gloss:       ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'] as const,
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radius = {
  sm: 8, md: 16, lg: 22, xl: 32, full: 9999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  orb: {
    shadowColor: '#E89240',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
};

export const fonts = {
  display:   { fontSize: 48, letterSpacing: -1.92, fontWeight: '300' as const },
  h1:        { fontSize: 32, letterSpacing: -0.64, fontWeight: '400' as const },
  h2:        { fontSize: 24, fontWeight: '400' as const },
  bodyLg:    { fontSize: 18, fontWeight: '300' as const },
  body:      { fontSize: 16, fontWeight: '300' as const },
  caption:   { fontSize: 12, letterSpacing: 0.4 },
  labelCaps: { fontSize: 10, letterSpacing: 2.2, fontWeight: '500' as const, textTransform: 'uppercase' as const },
};

export const animation = {
  shimmerDurationMs: 4200,
  pulseDurationMs:   1400,
  pressSpring:  { damping: 14, stiffness: 220, mass: 0.6 },
  toggleSpring: { damping: 15, stiffness: 260, mass: 0.5 },
  thumbSpring:  { damping: 18, stiffness: 200, mass: 0.7 },
  orbitDurationMs: 30000,
};
