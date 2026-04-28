import type { ImageRequireSource } from 'react-native';

export const BANGER_IMAGES: Partial<Record<string, ImageRequireSource>> = {
  'flat-top':      require('../../assets/bangers/flat-top.png'),
  'beveled':       require('../../assets/bangers/beveled.png'),
  'opaque':        require('../../assets/bangers/opaque-bottom.png'),
  'thermal':       require('../../assets/bangers/thermal.png'),
  'round':         require('../../assets/bangers/round-bottom.png'),
  'core-reactor':  require('../../assets/bangers/core-reactor.png'),
  'terp-slurper':  require('../../assets/bangers/terp-slurper.png'),
  'blender':       require('../../assets/bangers/blender.png'),
  'spinner':       require('../../assets/bangers/spinner.png'),
  'control-tower': require('../../assets/bangers/control-tower.png'),
  'charmer':       require('../../assets/bangers/charmer.png'),
  'insert':        require('../../assets/bangers/insert.png'),
};
