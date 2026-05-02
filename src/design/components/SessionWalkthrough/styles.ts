import { StyleSheet } from 'react-native';
import { colors } from '../../tokens';
import { RING_RADIUS } from './constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },

  headerLeft: {
    flex: 1,
  },

  supraLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    color: colors.bone35,
    textTransform: 'uppercase',
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bone100 + '0F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingBottom: 20,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.bone100 + '1F',
  },

  dotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: colors.emberBright,
  },

  dotDone: {
    backgroundColor: colors.firedAmber + '59',
  },

  stepArea: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
  },

  stepTitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 38,
    fontWeight: '400',
    color: colors.bone100,
    letterSpacing: -0.76,
    textAlign: 'center',
    marginBottom: 10,
  },

  stepBody: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.bone50,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 28,
    maxWidth: 280,
  },

  stepCenterIcon: {
    alignItems: 'center',
    marginTop: 12,
    flex: 1,
  },

  heatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  bangerSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  stageTimerSlot: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16,
  },

  aimHintSlot: {
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 4,
  },

  visualCue: {
    fontSize: 12,
    color: colors.bone50,
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    maxWidth: 280,
  },

  // Torch timer
  timerContainer: {
    width: RING_RADIUS * 2 + 40,
    height: RING_RADIUS * 2 + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timerGlow: {
    position: 'absolute',
    width: RING_RADIUS * 2,
    height: RING_RADIUS * 2,
    borderRadius: RING_RADIUS,
    backgroundColor: colors.emberBright,
    opacity: 0.04,
  },

  timerSvg: {
    position: 'absolute',
  },

  timerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  timerCountdown: {
    fontFamily: 'GeistMono_300Light',
    fontSize: 48,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    color: colors.bone90,
    letterSpacing: -1,
    marginTop: 4,
  },

  timerLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.2,
    color: colors.bone35,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Live temp badge
  liveTempBadge: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.bone100 + '08',
  },

  liveTempValue: {
    fontFamily: 'GeistMono_300Light',
    fontSize: 36,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.7,
  },

  liveTempSub: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.2,
    color: colors.bone35,
    textTransform: 'uppercase',
    marginTop: 3,
  },

  targetPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.ember + '44',
    backgroundColor: colors.firedAmber + '0F',
  },

  targetPillText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.ember,
    textTransform: 'uppercase',
  },

  // Stats (complete step)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bone100 + '0A',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderWidth: 0.5,
    borderColor: colors.bone100 + '14',
  },

  statCol: {
    alignItems: 'center',
    minWidth: 80,
  },

  statValue: {
    fontFamily: 'GeistMono_300Light',
    fontSize: 28,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    color: colors.bone90,
    letterSpacing: -0.5,
  },

  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.bone35,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  statDivider: {
    width: 0.5,
    height: 40,
    backgroundColor: colors.bone100 + '14',
    marginHorizontal: 24,
  },

  // CTA
  ctaRow: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    paddingTop: 16,
  },

  ctaBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  ctaBtnFinal: {
    shadowColor: colors.success,
  },

  ctaBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 18,
  },

  ctaBtnText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.bone100,
  },

  autoAdvanceHint: {
    paddingBottom: 20,
    alignItems: 'center',
  },

  autoAdvanceText: {
    fontSize: 11,
    color: colors.bone35,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
