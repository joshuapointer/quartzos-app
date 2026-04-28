/**
 * src/flow/ErrorBoundary.tsx
 *
 * Class-based error boundary wrapping QFlowShell.
 * Shows a calm recovery screen — no stack traces, no alert dialogs.
 * Reset bumps a key on the parent to force a clean remount.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFlow } from './store';
import { THEME, TYPE, SPACE } from './theme';

// ─── Recovery screen ─────────────────────────────────────────────────────────
// Rendered as a plain functional component so it can call the store hook.

function RecoveryScreen({ onReset }: { onReset: () => void }) {
  const reset = useFlow((s) => s.reset);

  function handleReset() {
    reset();
    onReset();
  }

  return (
    <View style={styles.screen}>
      {/* Wordmark — keeps brand presence during error */}
      <Text style={styles.wordmark}>Quartzie</Text>
      <Text style={styles.message}>Something went sideways.</Text>
      <Pressable
        onPress={handleReset}
        style={styles.resetBtn}
        accessibilityRole="button"
        accessibilityLabel="Reset app"
      >
        <Text style={styles.resetText}>Reset</Text>
      </Pressable>
    </View>
  );
}

// ─── Error boundary ───────────────────────────────────────────────────────────

type Props = { children: React.ReactNode };
type State = { hasError: boolean; key: number };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, key: 0 };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  handleReset() {
    // Bump key forces a full remount of children on next render.
    this.setState((prev) => ({ hasError: false, key: prev.key + 1 }));
  }

  override render() {
    if (this.state.hasError) {
      return <RecoveryScreen onReset={this.handleReset} />;
    }
    // Keyed so a reset triggers clean remount of the entire subtree.
    return (
      <React.Fragment key={this.state.key}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.navy[0],
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.lg,
    paddingHorizontal: SPACE.xxl,
  },
  wordmark: {
    fontFamily: TYPE.headline.fontFamily,
    fontSize: 24,
    color: THEME.bone[100],
    letterSpacing: -0.5,
    marginBottom: SPACE.sm,
  },
  message: {
    fontFamily: TYPE.body.fontFamily,
    fontSize: 15,
    color: THEME.bone[50],
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: SPACE.md,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xxl,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: THEME.bone[20],
    backgroundColor: 'rgba(180, 200, 230, 0.05)',
  },
  resetText: {
    fontFamily: TYPE.body.fontFamily,
    fontSize: 14,
    color: THEME.bone[70],
    letterSpacing: 0.2,
  },
});
