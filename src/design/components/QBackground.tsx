import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function QBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050403' }]} />
      {/* Warm blob top-left */}
      <LinearGradient
        colors={['rgba(42,22,6,0.55)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.blobWarm]}
      />
      {/* Cool blob bottom-right */}
      <LinearGradient
        colors={['rgba(14,26,40,0.4)', 'transparent']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={[StyleSheet.absoluteFill, styles.blobCool]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blobWarm: {
    opacity: 0.8,
  },
  blobCool: {
    opacity: 0.6,
  },
});
