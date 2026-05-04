import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '../tokens';
import type { Eye } from './types';

interface Props {
  size: number;
  eye: Eye;
  paused: boolean;
  blinking: boolean;
}

// 4-pointed star path centered at 0,0 with given radius
function starPath(r: number): string {
  const inner = r * 0.4;
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    pts.push(`${i === 0 ? 'M' : 'L'}${(radius * Math.cos(angle)).toFixed(2)},${(radius * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ') + ' Z';
}

function StarEye({ eyeSize, delay }: { eyeSize: number; delay: number }) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const easing = undefined;
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700 }),
          withTiming(1.0, { duration: 700 }),
        ),
        -1,
        false,
      ),
    );
    rotate.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(15, { duration: 700 }),
          withTiming(0, { duration: 700 }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(rotate);
    };
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const r = eyeSize * 0.5;
  const path = starPath(r);

  return (
    <Animated.View style={[{ width: eyeSize, height: eyeSize, alignItems: 'center', justifyContent: 'center' }, animStyle]}>
      <Svg width={eyeSize} height={eyeSize} viewBox={`${-r} ${-r} ${eyeSize} ${eyeSize}`}>
        <Path d={path} fill={palette.accentDeep} />
      </Svg>
    </Animated.View>
  );
}

function SingleEye({
  eyeW,
  eyeH,
  eye,
  blinking,
  isRight,
  paused,
}: {
  eyeW: number;
  eyeH: number;
  eye: Eye;
  blinking: boolean;
  isRight: boolean;
  paused: boolean;
}) {
  const scaleY = useSharedValue(1);
  const scaleX = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (blinking && eye !== 'concentrating' && eye !== 'happy' && eye !== 'starry' && eye !== 'tidy') {
      scaleY.value = withTiming(0.05, { duration: 80 });
    } else {
      scaleY.value = withTiming(1, { duration: 80 });
    }
  }, [blinking, eye]);

  // Eye shape transforms
  let targetScaleX = 1;
  let targetScaleY = 1;
  if (eye === 'wide') { targetScaleX = 1.2; targetScaleY = 1.2; }
  if (eye === 'surprised') { targetScaleX = 1.3; targetScaleY = 1.3; }
  if (eye === 'concentrating') { targetScaleX = 1; targetScaleY = 0.08; }

  if (eye === 'starry') {
    return <StarEye eyeSize={eyeW * 1.5} delay={isRight ? 700 : 0} />;
  }

  if (eye === 'happy' || eye === 'tidy') {
    // Smile arc — render as a semicircle bottom border
    return (
      <View style={{ width: eyeW * 1.5, height: eyeH * 0.5, overflow: 'hidden', justifyContent: 'flex-end' }}>
        <View
          style={{
            width: eyeW * 1.5,
            height: eyeW * 1.5,
            borderRadius: eyeW * 0.75,
            borderWidth: 2.5,
            borderColor: '#3A2E46',
            backgroundColor: 'transparent',
            // Only show bottom arc
            marginTop: -(eyeW * 0.75),
          }}
        />
      </View>
    );
  }

  const isConcentrating = eye === 'concentrating';
  const isSurprised = eye === 'surprised';

  return (
    <Animated.View
      style={[
        {
          width: eyeW,
          height: isSurprised ? eyeW : eyeH,
          borderRadius: isConcentrating ? 4 : eyeW / 2,
          backgroundColor: isConcentrating ? '#5A4E60' : '#3A2E46',
          overflow: 'hidden',
          transform: [
            { scaleX: targetScaleX },
            { scaleY: blinking && !isConcentrating ? 0.05 : targetScaleY },
          ],
        },
      ]}
    >
      {/* Highlight dot — hidden when concentrating or blinking */}
      {!isConcentrating && !blinking && (
        <View
          style={{
            position: 'absolute',
            top: eyeH * 0.18,
            left: eyeW * 0.28,
            width: eyeW * 0.32,
            height: eyeH * 0.32,
            borderRadius: eyeW * 0.16,
            backgroundColor: 'rgba(255,255,255,0.85)',
          }}
        />
      )}
    </Animated.View>
  );
}

export function BubFace({ size, eye, paused, blinking }: Props) {
  const eyeW = size * 0.12;
  const eyeH = size * 0.155;
  const gap = size * 0.12;
  const paddingTop = size * 0.08;

  const showMouth =
    eye === 'happy' || eye === 'tidy' || eye === 'starry' || eye === 'surprised';
  const mouthIsRound = eye === 'surprised';

  const mouthW = mouthIsRound ? size * 0.08 : size * 0.18;
  const mouthH = mouthIsRound ? size * 0.08 : size * 0.08;

  return (
    <View pointerEvents="none" style={[styles.face, { paddingTop }]}>
      <View style={[styles.eyes, { gap }]}>
        <SingleEye eyeW={eyeW} eyeH={eyeH} eye={eye} blinking={blinking} isRight={false} paused={paused} />
        <SingleEye eyeW={eyeW} eyeH={eyeH} eye={eye} blinking={blinking} isRight={true} paused={paused} />
      </View>

      {showMouth && (
        <View
          style={[
            styles.mouth,
            {
              width: mouthW,
              height: mouthH,
              borderRadius: mouthIsRound ? mouthW / 2 : undefined,
              borderBottomWidth: mouthIsRound ? 2 : 2,
              borderLeftWidth: mouthIsRound ? 2 : 0,
              borderRightWidth: mouthIsRound ? 2 : 0,
              borderTopWidth: mouthIsRound ? 2 : 0,
              borderBottomLeftRadius: mouthIsRound ? mouthW / 2 : mouthW / 2,
              borderBottomRightRadius: mouthIsRound ? mouthW / 2 : mouthW / 2,
              bottom: size * 0.30,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  eyes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mouth: {
    position: 'absolute',
    borderColor: '#3A2E46',
    opacity: 0.7,
    left: '50%',
    transform: [{ translateX: -1 }],
  },
});
