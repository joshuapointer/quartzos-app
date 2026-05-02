/**
 * TempRangeIndicator
 *
 * Bold #5 — instrument-tape readout. Renders an analog meter beneath the
 * target temperature on the calibration card: a thin horizontal rule with
 * endpoint ticks (low/high) and a center mark (target). Numeric labels
 * above each tick in Geist Mono `data-value` style.
 *
 * Visual contract:
 *  - Width: full container width.
 *  - Height: ~64pt total (label row + rule + caption).
 *  - Target tick + label use THEME.ember.base.
 *  - Low/high labels use THEME.bone[50].
 *  - Below the rule, a small "WINDOW" caption for context.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { THEME, TYPE } from '../theme';

type Props = {
  targetTemp: number;
  lowTemp: number;
  highTemp: number;
  unit: 'F' | 'C';
};

export default function TempRangeIndicator({
  targetTemp,
  lowTemp,
  highTemp,
  unit,
}: Props) {
  const target = Math.round(targetTemp);
  const low = Math.round(lowTemp);
  const high = Math.round(highTemp);

  return (
    <View style={styles.container}>
      {/* Numeric labels above the rule */}
      <View style={styles.labelRow}>
        <Text style={[styles.endpointLabel, styles.endpointLeft]}>{low}°</Text>
        <Text style={styles.targetLabel}>{target}°</Text>
        <Text style={[styles.endpointLabel, styles.endpointRight]}>
          {high}°
        </Text>
      </View>

      {/* Horizontal rule with endpoint + center ticks */}
      <View style={styles.ruleRow}>
        <View style={styles.endpointTick} />
        <View style={styles.rule} />
        <View style={styles.targetTick} />
        <View style={styles.rule} />
        <View style={styles.endpointTick} />
      </View>

      {/* WINDOW context caption */}
      <Text style={styles.windowLabel}>WINDOW · °{unit}</Text>
    </View>
  );
}

const TICK_WIDTH = 1.5;
const ENDPOINT_TICK_HEIGHT = 8;
const TARGET_TICK_HEIGHT = 12;
const RULE_HEIGHT = 1;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 64,
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  endpointLabel: {
    ...(TYPE.mono as object),
    fontSize: 11,
    letterSpacing: 0.55,
    color: THEME.bone[50],
    flex: 1,
  } as const,
  endpointLeft: {
    textAlign: 'left',
  },
  endpointRight: {
    textAlign: 'right',
  },
  targetLabel: {
    ...(TYPE.mono as object),
    fontSize: 13,
    letterSpacing: 0.65,
    color: THEME.ember.base,
    textAlign: 'center',
    flex: 1,
  } as const,
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TARGET_TICK_HEIGHT,
  },
  rule: {
    flex: 1,
    height: RULE_HEIGHT,
    backgroundColor: 'rgba(246, 222, 210, 0.20)',
  },
  endpointTick: {
    width: TICK_WIDTH,
    height: ENDPOINT_TICK_HEIGHT,
    backgroundColor: THEME.bone[50],
  },
  targetTick: {
    width: TICK_WIDTH,
    height: TARGET_TICK_HEIGHT,
    backgroundColor: THEME.ember.base,
    shadowColor: THEME.ember.base,
    shadowRadius: 6,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
  },
  windowLabel: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 1.5,
    color: THEME.bone[50],
    textTransform: 'uppercase',
    textAlign: 'center',
  } as const,
});
