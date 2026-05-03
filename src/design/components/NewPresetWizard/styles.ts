import { Platform, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import { CARD_W, CARD_H } from './constants';

const labelCaps = {
  fontSize: 10,
  fontWeight: '500' as const,
  letterSpacing: 2.2,
  textTransform: 'uppercase' as const,
  color: colors.bone50,
};

export const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    color: colors.bone100,
    fontSize: 18,
    fontWeight: '400',
    marginTop: 2,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 6,
    marginBottom: spacing.sm,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepSegmentEmpty: {
    backgroundColor: colors.surface2,
  },
  stepSegmentActive: {
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },

  // Body
  body: { flex: 1 },
  stepRoot: { flex: 1 },

  // Footer
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  cta: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaDisabled: {
    backgroundColor: colors.surface2,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    color: colors.bone100,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  ctaLabelDisabled: {
    color: colors.bone35,
  },

  // Banger step
  bangerCard: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: colors.surface3,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.bone35,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bangerCardActive: {
    borderColor: colors.emberBright,
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  bangerDiagramFrame: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bangerName: {
    color: colors.bone100,
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  bangerSpec: {
    color: colors.bone50,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  bangerGeometryLine: {
    color: colors.bone90,
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  bangerSpecRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  bangerSpecCell: {
    gap: 2,
  },
  bangerSpecValue: {
    color: colors.bone100,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface5,
    borderWidth: 0.5,
    borderColor: colors.bone35,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.4,
    color: colors.bone90,
    textTransform: 'uppercase',
  },
  dotRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginVertical: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bone20,
  },
  dotActive: {
    backgroundColor: colors.emberBright,
    width: 18,
  },
  thermalPanel: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface3,
    borderColor: colors.bone35,
    borderWidth: 0.5,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  thermalNote: {
    color: colors.bone70,
    fontSize: 13,
    lineHeight: 18,
  },
  calibrationNote: {
    color: colors.bone50,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },

  // Sensor / Wall chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 0.5,
    borderColor: colors.bone35,
    backgroundColor: colors.surface3,
  },
  chipActive: {
    borderColor: colors.emberBright,
    borderWidth: 1.5,
    backgroundColor: colors.surface4,
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  chipLabel: {
    color: colors.bone70,
    fontSize: 13,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: colors.bone100,
  },

  // Wall strip panel
  wallStripPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.bone35,
  },
  wallStripText: {
    flex: 1,
    gap: 2,
  },
  wallStripTitle: {
    color: colors.bone100,
    fontSize: 16,
    fontWeight: '500',
  },
  wallStripModifier: {
    color: colors.emberBright,
    fontSize: 13,
    fontWeight: '500',
  },

  // Concentrate / extract step
  labelCaps: {
    ...labelCaps,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: '48%',
    minHeight: 96,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.bone35,
    backgroundColor: colors.surface3,
  },
  swatchActive: {
    borderColor: colors.emberBright,
    borderWidth: 1.5,
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  swatchBlocked: {
    borderColor: colors.bone20,
    opacity: 0.55,
  },
  swatchGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  swatchGradientBlocked: {
    opacity: 0.12,
  },
  swatchTextWrap: {
    flex: 1,
    padding: spacing.sm,
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  swatchName: {
    color: colors.bone100,
    fontSize: 13,
    fontWeight: '500',
  },
  swatchNameBlocked: {
    color: colors.bone50,
  },
  swatchTemp: {
    color: colors.bone90,
    fontSize: 12,
  },
  swatchTempBlocked: {
    color: colors.error,
    fontStyle: 'italic',
  },
  swatchTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.emberBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBadgeText: {
    color: colors.bgDeep,
    fontSize: 11,
    fontWeight: '700',
  },
  blockedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface5,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tune step
  tempBlock: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  tempValue: {
    color: colors.bone100,
    fontSize: 120,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Times New Roman', default: 'serif' }),
    letterSpacing: -2,
  },
  tempHint: {
    ...labelCaps,
    marginTop: spacing.sm,
  },
  traceLine: {
    color: colors.bone90,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  warningBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.bone20,
    gap: spacing.xs,
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.bone35,
    backgroundColor: colors.surface3,
    paddingHorizontal: spacing.md,
    color: colors.bone100,
    fontSize: 15,
  },

  // Save step
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  heroOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
  },
  heroTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  heroTemp: {
    fontSize: 32,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Times New Roman', default: 'serif' }),
  },
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.bone20,
  },
  heroSummary: {
    color: colors.bone70,
    fontSize: 13,
    textAlign: 'center',
  },
  gemRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gemRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gemRingActive: {
    borderColor: colors.emberBright,
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  gemDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // Save error toast
  saveErrorToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface4,
    borderWidth: 0.5,
    borderColor: colors.error,
  },
  saveErrorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
  },
  saveErrorDismiss: {
    fontSize: 12,
    color: colors.bone50,
    fontWeight: '500',
    paddingLeft: 12,
  },

  // Cold-start toggle
  coldStartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.bone35,
  },
  coldStartRowDisabled: {
    opacity: 0.55,
  },
  coldStartRowActive: {
    borderColor: colors.emberBright,
  },
  coldStartLabel: {
    color: colors.bone100,
    fontSize: 15,
    fontWeight: '500',
  },
  coldStartHint: {
    color: colors.bone70,
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface5,
    borderWidth: 0.5,
    borderColor: colors.bone35,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: colors.ember,
    borderColor: colors.emberBright,
  },
  toggleDisabled: {
    backgroundColor: colors.surface3,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bone70,
    alignSelf: 'flex-start',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.bone100,
  },
});
