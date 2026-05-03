import { BANGERS as flowBangers } from './src/flow/data/bangers';
import { findBanger } from './src/data/bangers';
import { totalHeatSeconds } from './src/design/components/SessionWalkthrough/utils';

const bangerIds = ['flat-top', 'beveled', 'thermal', 'terp-slurper', 'opaque-bottom'];

for (const id of bangerIds) {
  const banger = flowBangers.find(b => b.id === id);
  const canonicalBanger = banger ? findBanger(banger.id) : undefined;
  
  // Test with wall multiplier 1.0
  const baseHeatSec = canonicalBanger ? totalHeatSeconds(canonicalBanger as any, 1.0) : 30;
  // Test with wall multiplier 1.6 (thick)
  const baseHeatSecThick = canonicalBanger ? totalHeatSeconds(canonicalBanger as any, 1.6) : 30;
  
  console.log(`${id} | Base: ${baseHeatSec} | Thick: ${baseHeatSecThick}`);
}
