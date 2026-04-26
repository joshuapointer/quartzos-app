import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabId = 'session' | 'presets' | 'history' | 'configure';

const TABS: { id: TabId; label: string }[] = [
  { id: 'session',   label: 'Session' },
  { id: 'presets',   label: 'Presets' },
  { id: 'history',   label: 'History' },
  { id: 'configure', label: 'Configure' },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function QTabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom + 8, 20);

  return (
    <View style={[styles.outerWrap, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View style={styles.pill}>
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onChange(tab.id)}
              activeOpacity={0.8}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 30,
  },
  pill: {
    flexDirection: 'row',
    gap: 2,
    padding: 4,
    borderRadius: 100,
    backgroundColor: 'rgba(20,16,14,0.85)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  tabActive: {
    backgroundColor: '#1c1714',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.10)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    color: '#9e907e',
  },
  tabTextActive: {
    fontWeight: '500',
    color: '#f4ede4',
  },
});
