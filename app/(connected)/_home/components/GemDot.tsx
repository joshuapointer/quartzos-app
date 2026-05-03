import React from 'react';
import { View } from 'react-native';
import { GEM_COLORS_ORDERED } from '../constants';

export function GemDot({ idx }: { idx: number }) {
  const color = GEM_COLORS_ORDERED[idx % GEM_COLORS_ORDERED.length] ?? GEM_COLORS_ORDERED[0]!;
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />;
}
