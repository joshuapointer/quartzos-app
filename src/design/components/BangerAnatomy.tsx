/**
 * Parametric SVG cross-section of a quartz banger.
 *
 * Renders a stylized silhouette per `banger.geometry`, with optional torch-zone
 * overlays (each `torch_zones[].anatomy` mapped to a colored band labeled with
 * its `time_pct`). When `activeZoneIdx` is provided that zone glows ember while
 * the others are muted. Defensive: unknown anatomy keywords still render as a
 * generic mid-band so every banger draws without crashing.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, Line, G, Text as SvgText } from 'react-native-svg';

import type { Banger, TorchZone } from '../../data/bangers';
import { colors } from '../tokens';

interface Props {
  readonly banger: Banger;
  readonly size?: number;
  readonly showZones?: boolean;
  readonly activeZoneIdx?: number;
}

interface ZoneBand {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly timePct: number;
}

// View-box constants — every silhouette is laid out within this 100x120 box.
const VB_W = 100;
const VB_H = 120;

/**
 * Map an anatomy keyword (e.g. "bucket_bottom", "outer_side_wall") to a
 * rectangle in the 100x120 viewBox. Unknown keywords resolve to a generic
 * mid-band so we never crash.
 */
function resolveZoneBand(
  geometry: Banger['geometry'],
  anatomy: string,
  timePct: number,
): ZoneBand {
  const a = anatomy.toLowerCase();
  const generic: ZoneBand = {
    x: 18,
    y: 56,
    width: 64,
    height: 14,
    label: anatomy.replace(/_/g, ' '),
    timePct,
  };

  if (geometry === 'bucket') {
    if (a.includes('opaque_bottom') || a === 'bucket_bottom' || a.includes('bottom_curve')) {
      return { x: 22, y: 92, width: 56, height: 16, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('lower_walls') || a.includes('lower_outer_wall')) {
      return { x: 22, y: 70, width: 56, height: 18, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('outer_side_wall')) {
      return { x: 14, y: 50, width: 72, height: 38, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('outer_bottom')) {
      return { x: 14, y: 96, width: 72, height: 14, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('host_banger_bottom')) {
      return { x: 22, y: 92, width: 56, height: 16, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('host_walls')) {
      return { x: 22, y: 60, width: 56, height: 28, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('swung_out_dish_bottom')) {
      return { x: 22, y: 96, width: 56, height: 12, label: anatomy.replace(/_/g, ' '), timePct };
    }
    return generic;
  }

  if (geometry === 'slurper') {
    if (a.includes('bottom_dish') || a.includes('bottom_skirt')) {
      return { x: 14, y: 96, width: 72, height: 14, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('slotted_column') || a.includes('lower_wall_above_slits')) {
      return { x: 32, y: 60, width: 36, height: 28, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('dish_return')) {
      return { x: 14, y: 92, width: 72, height: 8, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('under_slotted_disc')) {
      return { x: 22, y: 76, width: 56, height: 18, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('bucket_bottom')) {
      return { x: 22, y: 90, width: 56, height: 16, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('wall_between_holes') || a.includes('bucket_walls')) {
      return { x: 22, y: 60, width: 56, height: 28, label: anatomy.replace(/_/g, ' '), timePct };
    }
    if (a.includes('dish_and_chamber')) {
      return { x: 14, y: 60, width: 72, height: 50, label: anatomy.replace(/_/g, ' '), timePct };
    }
    return generic;
  }

  // insert / enail fall through to generic mapping for now
  return generic;
}

/** Returns a Path "d" string for the banger silhouette by id/geometry. */
function silhouettePath(banger: Banger): string {
  const id = banger.id;
  const g = banger.geometry;

  if (g === 'enail') {
    // E-nail: bucket with coil wrapping (coil drawn separately as circles)
    return 'M 22 50 L 22 96 Q 22 110 36 110 L 64 110 Q 78 110 78 96 L 78 50';
  }

  if (g === 'slurper') {
    // Slurper: column above wider dish
    return (
      'M 32 50 L 32 84 ' +
      'L 16 84 L 16 100 Q 16 110 28 110 L 72 110 Q 84 110 84 100 L 84 84 ' +
      'L 68 84 L 68 50'
    );
  }

  if (g === 'insert') {
    // Host banger silhouette + smaller insert cup inside (insert drawn separately)
    return 'M 18 50 L 18 96 Q 18 110 32 110 L 68 110 Q 82 110 82 96 L 82 50';
  }

  // bucket family
  if (id === 'round-bottom') {
    // Hemispherical bottom
    return 'M 20 50 L 20 80 Q 20 110 50 110 Q 80 110 80 80 L 80 50';
  }
  if (id === 'thermal-double-wall' || id === 'thermal') {
    // Outer wall only — drawn with thicker stroke; same outline path
    return 'M 16 50 L 16 100 Q 16 112 30 112 L 70 112 Q 84 112 84 100 L 84 50';
  }
  if (id === 'swing-arm') {
    // Pivoted dish (drawn slightly tilted)
    return 'M 24 60 L 22 100 Q 22 110 34 110 L 70 110 Q 82 110 82 100 L 78 60';
  }
  if (id === 'core-reactor') {
    // Bucket — central pillar drawn separately
    return 'M 20 50 L 20 96 Q 20 110 34 110 L 66 110 Q 80 110 80 96 L 80 50';
  }
  // default flat-top / beveled / opaque-bottom
  return 'M 20 50 L 20 96 Q 20 110 34 110 L 66 110 Q 80 110 80 96 L 80 50';
}

export function BangerAnatomy({
  banger,
  size = 160,
  showZones = false,
  activeZoneIdx,
}: Props) {
  const path = silhouettePath(banger);
  const isOpaque = banger.id === 'opaque-bottom';
  const isThermal = banger.geometry === 'bucket' && (banger.id === 'thermal' || banger.id === 'thermal-double-wall');
  const isCoreReactor = banger.id === 'core-reactor';
  const isSwingArm = banger.id === 'swing-arm';
  const isInsert = banger.geometry === 'insert';
  const isEnail = banger.geometry === 'enail';

  const zones = useMemo<readonly ZoneBand[]>(() => {
    if (!showZones) return [];
    return banger.torch_zones.map((z: TorchZone) =>
      resolveZoneBand(banger.geometry, z.anatomy, z.time_pct),
    );
  }, [banger, showZones]);

  const strokeMain = colors.bone70;
  const strokeOuter = colors.bone35;

  return (
    <View style={[styles.wrap, { width: size, height: size * (VB_H / VB_W) }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {/* Inner fill subtle */}
        <Path d={path} fill={isOpaque ? colors.surface3 : 'rgba(155,140,120,0.08)'} stroke="none" />

        {/* Main silhouette */}
        <Path
          d={path}
          fill="none"
          stroke={strokeMain}
          strokeWidth={isThermal ? 3.5 : 2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Thermal: inner wall outline */}
        {isThermal ? (
          <Path
            d="M 26 56 L 26 92 Q 26 102 36 102 L 64 102 Q 74 102 74 92 L 74 56"
            fill="none"
            stroke={strokeOuter}
            strokeWidth={1.4}
            strokeDasharray="2,2"
          />
        ) : null}

        {/* Core reactor: central pillar */}
        {isCoreReactor ? (
          <Rect x={46} y={62} width={8} height={48} fill={colors.surface4} stroke={strokeOuter} strokeWidth={1.2} />
        ) : null}

        {/* Insert: smaller drop-in cup */}
        {isInsert ? (
          <Path
            d="M 32 60 L 32 92 Q 32 102 42 102 L 58 102 Q 68 102 68 92 L 68 60"
            fill="rgba(123,168,196,0.08)"
            stroke={colors.quartzDeep}
            strokeWidth={1.4}
          />
        ) : null}

        {/* E-nail: coil wraps */}
        {isEnail ? (
          <G>
            {[64, 76, 88, 100].map((cy) => (
              <Line
                key={cy}
                x1={14}
                x2={86}
                y1={cy}
                y2={cy}
                stroke={colors.ember}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}
          </G>
        ) : null}

        {/* Swing-arm: pivot indicator */}
        {isSwingArm ? (
          <Circle cx={50} cy={48} r={3} fill={colors.bone35} />
        ) : null}

        {/* Opaque bottom: shaded disc */}
        {isOpaque ? (
          <Rect x={22} y={96} width={56} height={14} fill={colors.surface5} stroke={strokeOuter} strokeWidth={1} />
        ) : null}

        {/* Torch zones overlay */}
        {showZones
          ? zones.map((z, idx) => {
              const isActive = activeZoneIdx === idx;
              const isMuted = activeZoneIdx != null && !isActive;
              const fill = isActive
                ? colors.amberGold + '8C'
                : isMuted
                  ? 'rgba(199,184,164,0.10)'
                  : colors.amberGold + '47';
              const stroke = isActive ? colors.emberBright : colors.ember;
              return (
                <G key={`${z.label}-${idx}`}>
                  <Rect
                    x={z.x}
                    y={z.y}
                    width={z.width}
                    height={z.height}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isActive ? 1.5 : 0.8}
                    rx={2}
                  />
                  <SvgText
                    x={z.x + z.width / 2}
                    y={z.y + z.height / 2 + 3}
                    fontSize={7}
                    fontWeight="600"
                    fill={isActive ? colors.bone100 : colors.bone90}
                    textAnchor="middle"
                  >
                    {`${z.timePct}%`}
                  </SvgText>
                </G>
              );
            })
          : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BangerAnatomy;
