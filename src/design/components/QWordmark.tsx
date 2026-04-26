import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  connected?: boolean;
}

export function QWordmark({ connected = true }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>quartzie</Text>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: connected ? '#E89240' : '#6d6050' }]} />
        <Text style={styles.statusText}>{connected ? 'CONNECTED' : 'OFFLINE'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 4,
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 22,
    color: '#e8dfd2',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#E89240',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: '#9e907e',
    fontFamily: 'Menlo',
  },
});
