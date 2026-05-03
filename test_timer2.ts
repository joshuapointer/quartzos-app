import { BANGERS as flowBangers } from './src/flow/data/bangers';
import { findBanger } from './src/data/bangers';

function totalHeatSeconds(banger: any, wallMultiplier: number = 1.0): number {
  if (banger.heat_time_breakdown && banger.heat_time_breakdown.length > 0) {
    return banger.heat_time_breakdown.reduce(
      (acc: number, stage: any) => acc + stage.duration_seconds,
      0,
    );
  }

  if (banger.cooling && banger.cooling.k_per_second) {
    const tau = 1 / banger.cooling.k_per_second;
    return Math.round(tau * 0.45 * wallMultiplier);
  }

  return 30;
}

const bangerIds = ['flat-top', 'beveled', 'thermal', 'terp-slurper', 'opaque-bottom'];

for (const id of bangerIds) {
  const banger = flowBangers.find(b => b.id === id);
  const canonicalBanger = banger ? findBanger(banger.id) : undefined;
  
  const baseHeatSec = canonicalBanger ? totalHeatSeconds(canonicalBanger as any, 1.0) : 30;
  const baseHeatSecThick = canonicalBanger ? totalHeatSeconds(canonicalBanger as any, 1.6) : 30;
  const baseHeatSecThin = canonicalBanger ? totalHeatSeconds(canonicalBanger as any, 0.5) : 30;
  
  console.log(`${id} | Thin: ${baseHeatSecThin} | Base: ${baseHeatSec} | Thick: ${baseHeatSecThick}`);
}
