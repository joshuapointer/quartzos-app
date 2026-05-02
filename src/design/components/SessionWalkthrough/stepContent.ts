import type { Banger } from '../../../data/bangers';
import type { Concentrate } from '../../../data/concentrates';
import type { Sensor } from '../../../data/sensors';
import { formatTemp } from '../../../utils/temperature';
import type { BuildStepsArgs, Step } from './types';

export function buildHeatBody(banger: Banger): string {
  const torchPattern = banger.torch_pattern.replace(/_/g, ' ');
  if (banger.torch_distance_inches != null) {
    return `Apply the torch using a ${torchPattern} sweep, ${banger.torch_distance_inches}" from quartz.`;
  }
  return `Apply the torch using a ${torchPattern} sweep.`;
}

export function buildCoolBody(args: {
  readonly banger: Banger;
  readonly sensor: Sensor;
  readonly displayedTargetF: number;
  readonly interiorTargetF: number;
  readonly pidSetpointF: number;
  readonly useCelsius: boolean;
}): string {
  const { banger, sensor, displayedTargetF, interiorTargetF, pidSetpointF, useCelsius } = args;
  switch (sensor.method) {
    case 'ir':
      return `Aim ${sensor.name} at ${banger.ir_aim_location}. Dab on the descent through ${formatTemp(displayedTargetF, useCelsius)} — not at peak torch.`;
    case 'contact':
      return `Probe contact reads surface truth. Dab when probe shows ${formatTemp(interiorTargetF, useCelsius)}.`;
    case 'enail':
      return `PID is set & forget. When the coil shows ${formatTemp(pidSetpointF, useCelsius)}, you're ready.`;
    case 'visual':
    default:
      return `Watch for: ${banger.visual_cue}. Counted timing fills the gap.`;
  }
}

export function buildDabBody(concentrate: Concentrate): string {
  const tip = concentrate.notes[0] ?? '';
  return tip ? `Drop ${concentrate.name}. ${tip}` : `Drop ${concentrate.name}.`;
}

export function buildSteps(args: BuildStepsArgs): Step[] {
  const { banger, concentrate, sensor, useCelsius } = args;
  const heatBody = buildHeatBody(banger);
  const coolBody = buildCoolBody(args);
  const dabBody = buildDabBody(concentrate);
  const completeSummary = `${banger.name} · ${concentrate.name} · ${sensor.name}`;

  if (args.coldStart) {
    return [
      {
        id: 'prepare',
        supra: 'STEP 1 OF 4',
        title: 'Prepare',
        body: 'Cold-start ready. Set your torch within reach and grab your cap.',
        ctaLabel: "I'm Ready",
      },
      {
        id: 'cold-load',
        supra: 'STEP 2 OF 4',
        title: 'Cold Load',
        body: 'Load your concentrate cold into the bucket. Cap on, torch ready.',
        ctaLabel: 'Loaded',
      },
      {
        id: 'cold-heat',
        supra: 'STEP 3 OF 4',
        title: 'Light Heat',
        body: 'Light heat from below for 10–20 seconds. Pull torch when oil starts to bubble.',
        autoAdvance: true,
      },
      {
        id: 'dab',
        supra: 'STEP 4 OF 4',
        title: 'Dab',
        body: dabBody,
        ctaLabel: 'Done',
        autoAdvance: true,
      },
      {
        id: 'complete',
        supra: 'SESSION',
        title: 'Complete',
        body: completeSummary,
        ctaLabel: 'Finish',
      },
    ];
  }

  return [
    {
      id: 'prepare',
      supra: 'STEP 1 OF 5',
      title: 'Prepare',
      body: 'Load your material into your cap and set your torch within reach.',
      ctaLabel: "I'm Ready",
    },
    {
      id: 'heat',
      supra: 'STEP 2 OF 5',
      title: 'Torch It',
      body: heatBody,
      autoAdvance: true,
    },
    {
      id: 'cool',
      supra: 'STEP 3 OF 5',
      title: 'Cool Down',
      body: coolBody,
      autoAdvance: true,
    },
    {
      id: 'dab',
      supra: 'STEP 4 OF 5',
      title: 'Dab',
      body: dabBody,
      ctaLabel: 'Done',
      autoAdvance: true,
    },
    {
      id: 'dunk',
      supra: 'STEP 5 OF 5',
      title: 'Dunk',
      body: `While the banger is still warm, swab the inside to remove residue.`,
      ctaLabel: 'All Done',
    },
    {
      id: 'complete',
      supra: 'SESSION',
      title: 'Complete',
      body: completeSummary,
      ctaLabel: 'Finish',
    },
  ];
}
