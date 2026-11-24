import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

type Props = {
  label: string;
  /** Check in uses the success green (go); check out uses the amber accent (leave). */
  tone?: 'success' | 'secondary';
  disabled?: boolean;
  /** What the locked track says. */
  disabledLabel?: string;
  onComplete: () => void;
};

const AnimatedText = Animated.createAnimatedComponent(ThemedText);

/**
 * "Slide to unlock" style shimmer: a band of light sweeps across the label from
 * left to right, brightening each letter as it passes. Opacity only, so it runs
 * on the native driver. Falls back to static text when Reduce Motion is on.
 */
function ShimmerText({ text, color, active, dim = 0.55 }: { text: string; color: string; active: boolean; dim?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => mounted && setReduceMotion(value)).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!active || reduceMotion) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(700),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduceMotion, progress]);

  const chars = useMemo(() => Array.from(text), [text]);
  const BAND = 0.28; // half-width of the light band, as a share of the text
  const span = 1 + BAND * 2; // the band enters before the first letter and exits after the last
  const half = BAND / span;

  return (
    <View style={styles.shimmerRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {chars.map((char, index) => {
        const position = chars.length > 1 ? index / (chars.length - 1) : 0;
        // Progress at which the centre of the band reaches this letter.
        const peak = (position + BAND) / span;
        const opacity = active && !reduceMotion
          ? progress.interpolate({
              inputRange: [0, peak - half, peak, peak + half, 1],
              outputRange: [dim, dim, 1, dim, dim],
              extrapolate: 'clamp',
            })
          : 1;
        return (
          <AnimatedText key={`${char}-${index}`} weight="bold" style={[styles.hint, { color, opacity }]}>
            {char === ' ' ? '\u00A0' : char}
          </AnimatedText>
        );
      })}
    </View>
  );
}

const THUMB = 52;
const INSET = 4;

export function SwipeAttendanceButton({ label, tone = 'success', disabled, disabledLabel, onComplete }: Props) {
  const { colors } = useAppTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  // PanResponder is created once, so it reads live values through refs.
  const maxDistance = useRef(0);
  const disabledRef = useRef(disabled);
  const completeRef = useRef(onComplete);
  maxDistance.current = Math.max(0, trackWidth - THUMB - INSET * 2);
  disabledRef.current = disabled;
  completeRef.current = onComplete;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8,
      onPanResponderMove: (_, gesture) => {
        if (!disabledRef.current) translateX.setValue(Math.max(0, Math.min(gesture.dx, maxDistance.current)));
      },
      onPanResponderRelease: (_, gesture) => {
        if (disabledRef.current) return;
        if (maxDistance.current > 0 && gesture.dx >= maxDistance.current * 0.72) {
          Animated.timing(translateX, { toValue: maxDistance.current, duration: 120, useNativeDriver: true }).start(() => {
            completeRef.current();
            // Snap back so the control is usable again if the punch is rejected.
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  // Solid, deepened tones from the theme so white text keeps about 5:1 contrast on the track.
  const track = tone === 'secondary' ? colors.trackCheckOut : colors.trackCheckIn;

  // The hint fades as the thumb moves over it.
  const hintOpacity = translateX.interpolate({
    inputRange: [0, Math.max(1, maxDistance.current * 0.6)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.track, { backgroundColor: disabled ? colors.border : track }]}
      onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Swipe right to ${label.toLowerCase()}`}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityAction={() => !disabled && onComplete()}
      {...panResponder.panHandlers}
    >
      <Animated.View style={[styles.hintWrap, { opacity: hintOpacity }]} pointerEvents="none">
        <ShimmerText
          text={disabled ? (disabledLabel ?? 'Not available right now') : `Swipe to ${label.toLowerCase()}`}
          color={disabled ? colors.textMuted : colors.onPrimary}
          dim={0.7}
          active={!disabled}
        />
        {!disabled ? <Ionicons name="chevron-forward" size={16} color={colors.onPrimary} /> : null}
      </Animated.View>
      <Animated.View
        style={[styles.thumb, { backgroundColor: disabled ? colors.textMuted : colors.onPrimary, transform: [{ translateX }] }]}
      >
        <Ionicons name="arrow-forward" size={22} color={disabled ? colors.white : track} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: THUMB + INSET * 2, borderRadius: (THUMB + INSET * 2) / 2, justifyContent: 'center', overflow: 'hidden' },
  hintWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingLeft: THUMB },
  hint: { fontSize: 15 },
  shimmerRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { position: 'absolute', left: INSET, width: THUMB, height: THUMB, borderRadius: THUMB / 2, alignItems: 'center', justifyContent: 'center' },
});
