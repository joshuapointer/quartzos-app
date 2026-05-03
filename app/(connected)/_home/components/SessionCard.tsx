import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Polygon,
  Polyline,
  Line as SvgLine,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { colors, gradients } from '../../../../src/design/tokens';
import { formatTemp } from '../../../../src/utils/temperature';
import { formatDate, formatDuration, formatTime, peakTempColor } from '../utils';
import type { SessionCardProps } from '../types';

// ─── Waveform SVG ─────────────────────────────────────────────────────────────

const Waveform = React.memo(function Waveform({ data, target }: { data: number[]; target: number }) {
  const W = 320;
  const H = 50;

  if (!data || data.length < 2) {
    return <View style={{ width: '100%', height: H }} />;
  }

  const minVal = Math.min(...data) - 10;
  const maxVal = Math.max(...data) + 10;
  const range = maxVal - minVal || 1;

  const toX = (i: number) => (i / (data.length - 1)) * W;
  const toY = (v: number) => H - ((v - minVal) / range) * H;

  const points = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const targetY = toY(target);

  const firstX = toX(0).toFixed(1);
  const lastX = toX(data.length - 1).toFixed(1);
  const polyPoints = `${firstX},${H} ${points} ${lastX},${H}`;

  const near = data.some((v) => Math.abs(v - target) <= 5);
  const strokeColor = near ? colors.emberBright : colors.ember;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <SvgLine
        x1={0} y1={targetY} x2={W} y2={targetY}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4 4"
      />
      <Polygon points={polyPoints} fill="url(#waveGrad)" />
      <Polyline points={points} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
});

// ─── SessionCard ─────────────────────────────────────────────────────────────

export const SessionCard = React.memo(function SessionCard({ session, index, listProgress, settings }: SessionCardProps) {
  const delay = Math.min(index * 0.1, 0.4);
  const cardStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, (listProgress.value - delay) / (1 - delay || 0.001)));
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * 10 }],
    };
  });

  const dur = formatDuration(session);
  const waveData = session.samples.map((s) => s.f);

  return (
    <Animated.View style={[styles.sessionCardOuter, cardStyle]}>
      <LinearGradient colors={gradients.cardNeutral} style={styles.sessionCard}>
        <View style={[StyleSheet.absoluteFillObject, styles.sessionCardBorder]} pointerEvents="none" />
        <View style={styles.sessionCardHeader}>
          <Text style={styles.sessionCardDate}>{formatDate(session.startedAt)} · {formatTime(session.startedAt)}</Text>
          <Text style={styles.sessionCardDur}>{dur}</Text>
        </View>
        <Text style={[styles.sessionPeakTemp, { color: peakTempColor(session.peakTempF) }]}>
          {formatTemp(session.peakTempF, settings.useCelsius)}
        </Text>
        <View style={styles.waveformWrap}>
          <Waveform data={waveData} target={session.dabAlarmF} />
        </View>
        <View style={styles.sessionTimeRange}>
          <Text style={styles.sessionTimeMono}>0:00</Text>
          <Text style={styles.sessionTimeMono}>{dur}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  sessionCardOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: colors.voidObsidian,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  sessionCard: {
    borderRadius: 18,
    padding: 16,
  },
  sessionCardBorder: {
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: colors.bone100 + '0F',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionCardDate: {
    fontFamily: 'GeistMono_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: colors.bone50,
    letterSpacing: 0.3,
  },
  sessionCardDur: {
    fontFamily: 'GeistMono_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: colors.bone50,
    letterSpacing: 0.3,
  },
  sessionPeakTemp: {
    fontFamily: 'GeistMono_300Light',
    fontVariant: ['tabular-nums'],
    fontSize: 24,
    fontWeight: '300',
    color: colors.bone100,
    letterSpacing: -0.48,
    marginBottom: 10,
  },
  waveformWrap: {
    width: '100%',
    height: 50,
    marginBottom: 6,
  },
  sessionTimeRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionTimeMono: {
    fontFamily: 'GeistMono_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 10,
    color: colors.bone35,
    letterSpacing: 0.3,
  },
});
