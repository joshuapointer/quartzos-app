import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../tokens';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Optional override for the fallback subtitle. Defaults to a brief
   * brand-voice line that surfaces the underlying error message when one
   * is available.
   */
  fallbackSubtitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-component error boundary — RN doesn't yet have a hooks API for
 * this, so the lifecycle methods stay. Renders a warm-tone fallback card
 * with a "Reload" button that resets local state. Used to wrap the home
 * screen scene-router and the connected stack so a TempDial /
 * SessionWalkthrough / NewPresetWizard crash doesn't blank the whole
 * screen.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log to console — production telemetry hookup lives elsewhere.
    console.error('[ErrorBoundary] caught', error, info.componentStack);
  }

  private readonly handleReload = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    const errMsg =
      this.props.fallbackSubtitle ??
      this.state.error?.message ??
      'The interface lost its bearings. Try again.';

    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.title}>Something cracked.</Text>
          <Text style={styles.subtitle} numberOfLines={4}>{errMsg}</Text>
          <TouchableOpacity
            onPress={this.handleReload}
            style={styles.btn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Reload screen"
          >
            <Text style={styles.btnText}>Reload</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface3,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.firedAmber + '40',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...fonts.h2,
    color: colors.bone100,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...fonts.body,
    color: colors.bone70,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.firedAmber,
    minHeight: 44,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    ...fonts.body,
    color: colors.firedAmber,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
