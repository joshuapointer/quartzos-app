import { StyleSheet } from 'react-native';
import { THEME, TYPE } from '../../theme';

export const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  causticAbs: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionArcAbs: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  coronaAbs: {
    position: 'absolute',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  haloAbs: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: -40,
    bottom: -40,
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 60,
    shadowOpacity: 0.6,
  },
  // Android can't render shadowColor on a non-elevated View, so we render a
  // tinted, scaled circle behind the orb body to approximate the iOS bloom.
  haloAndroid: {
    position: 'absolute',
    opacity: 0.7,
  },
  searchPulse: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: THEME.ember.bright,
    backgroundColor: 'transparent',
  },
  eyebrow: {
    ...TYPE.eyebrow,
    fontSize: 9.5,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  bigNumber: {
    fontFamily: TYPE.display.fontFamily,
    // letterSpacing is set inline at the call site, proportional to fontSize
    // (-fontSize * 0.07) so spacing scales with the orb's size morph.
    lineHeight: undefined,
    includeFontPadding: false,
  },
  monoCaption: {
    fontFamily: TYPE.mono.fontFamily,
    fontSize: 9.5,
    letterSpacing: 2,
    color: THEME.bone[50],
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  degSymbol: {
    fontFamily: TYPE.display.fontFamily,
    color: THEME.bone[100],
    // fontSize is set inline (Math.round(size * 0.07)) so the degree mark
    // tracks the orb's current size rather than locking to 22pt.
    marginLeft: 4,
    marginTop: 8,
    opacity: 0.7,
  },
});
