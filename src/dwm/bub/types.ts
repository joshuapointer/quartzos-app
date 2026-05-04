export type Mood = 'idle' | 'curious' | 'eager' | 'heat' | 'cool' | 'dab' | 'dunk' | 'clean' | 'done';
export type Eye = 'open' | 'wide' | 'concentrating' | 'surprised' | 'happy' | 'starry' | 'tidy';
export type BubSize = 'xl' | 'lg' | 'md' | 'sm';

export const BUB_SIZE_PX: Record<BubSize, number> = {
  xl: 220,
  lg: 170,
  md: 130,
  sm: 100,
};

export interface BubProps {
  mood?: Mood;
  eye?: Eye;
  size?: BubSize;
  coreOverride?: string;
  edgeOverride?: string;
  extras?: ReadonlyArray<'torch' | 'bubbles' | 'wave' | 'suds' | 'sparkles' | 'sweat'>;
  torchLit?: boolean;
  squish?: boolean;
  onPress?: () => void;
  paused?: boolean;
}
