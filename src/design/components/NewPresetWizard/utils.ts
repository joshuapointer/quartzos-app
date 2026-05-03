import { BANGERS, type Banger } from '../../../data/bangers';
import { colors } from '../../tokens';
import { BANGER_CATEGORY_ORDER, TEMP_RANGE } from './constants';
import type { BangerGroup } from './types';

export function buildBangerGroups(): readonly BangerGroup[] {
  return BANGER_CATEGORY_ORDER.map((category) => ({
    category,
    bangers: BANGERS.filter((b) => b.category === category),
  })).filter((g) => g.bangers.length > 0);
}

export function tempColorFor(offset: number): string {
  const t = offset / TEMP_RANGE;
  if (t > 0.5) return colors.emberBright;
  if (t > 0.15) return colors.ember;
  if (t < -0.5) return colors.quartzBright;
  if (t < -0.15) return colors.quartz;
  return colors.bone100;
}

export const BANGER_GROUPS: readonly BangerGroup[] = buildBangerGroups();

export const ORDERED_BANGERS: readonly Banger[] = BANGER_GROUPS.flatMap((g) => g.bangers);
