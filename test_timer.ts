import { BANGERS as flowBangers } from './src/flow/data/bangers';
import { findBanger } from './src/data/bangers';
import { totalHeatSeconds } from './src/design/components/SessionWalkthrough/utils';

const banger = flowBangers.find(b => b.id === 'terp-slurper');
const canonicalBanger = banger ? findBanger(banger.id) : undefined;
const baseHeatSec = canonicalBanger ? totalHeatSeconds(canonicalBanger as any) : 30;

console.log('banger:', banger?.id);
console.log('canonicalBanger:', canonicalBanger?.id);
console.log('baseHeatSec:', baseHeatSec);
