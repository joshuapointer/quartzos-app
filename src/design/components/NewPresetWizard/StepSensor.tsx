import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SENSORS, type Sensor } from '../../../data/sensors';
import { IrAimHint } from '../IrAimHint';
import { SENSOR_ORDER, SENSOR_SHORT_LABEL } from './constants';
import { styles } from './styles';
import type { SensorStepProps } from './types';
import { spacing } from '../../tokens';

export function StepSensor({ sensorId, onSelect, banger, sensor }: SensorStepProps) {
  const orderedSensors = useMemo<readonly Sensor[]>(() => {
    return SENSOR_ORDER.map((m) => SENSORS.find((s) => s.method === m)).filter(
      (s): s is Sensor => s !== undefined,
    );
  }, []);

  return (
    <ScrollView
      style={styles.stepRoot}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.chipRow}>
        {orderedSensors.map((s) => {
          const active = s.id === sensorId;
          return (
            <Pressable
              key={s.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(s.id);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {SENSOR_SHORT_LABEL[s.method]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {banger ? (
        <IrAimHint banger={banger} sensor={sensor} />
      ) : (
        <View style={styles.thermalPanel}>
          <Text style={styles.thermalNote}>Pick a banger first to preview IR aim guidance.</Text>
        </View>
      )}

      <View style={styles.thermalPanel}>
        <Text style={styles.labelCaps}>{sensor.name}</Text>
        <Text style={styles.thermalNote}>{sensor.description}</Text>
        <Text style={styles.calibrationNote}>{sensor.calibration_note}</Text>
      </View>
    </ScrollView>
  );
}
