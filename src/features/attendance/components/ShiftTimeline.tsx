import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

type Props = {
  startMs: number;
  endMs: number;
  checkInMs?: number | null;
  checkOutMs?: number | null;
  nowMs: number;
  startLabel: string;
  endLabel: string;
  /** Spoken summary for screen readers. */
  summary: string;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const valid = (value: number | null | undefined): value is number =>
  value != null && Number.isFinite(value);

/**
 * The shift as a line from start to end. The bright stretch is the time actually worked, so a late
 * check-in shows up as a gap at the start. The amber dot is now. Draws itself in once on mount.
 */
export function ShiftTimeline({ startMs, endMs, checkInMs, checkOutMs, nowMs, startLabel, endLabel, summary }: Props) {
  const { colors } = useAppTheme();
  const [reveal] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) reveal.setValue(1);
        else {
          Animated.timing(reveal, {
            toValue: 1,
            duration: 900,
            delay: 150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reveal]);

  const span = endMs - startMs;
  const at = (time: number) => clamp01((time - startMs) / span);
  const hasIn = valid(checkInMs);
  const hasOut = valid(checkOutMs);

  const from = hasIn ? at(checkInMs) : 0;
  const to = hasIn ? Math.max(from, at(hasOut ? checkOutMs : nowMs)) : 0;
  const nowPos = at(nowMs);

  const fillWidth = reveal.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${(to - from) * 100}%`] });
  const nowLeft = reveal.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${nowPos * 100}%`] });

  return (
    <View accessible accessibilityLabel={summary}>
      <View style={styles.barArea}>
        <View style={[styles.track, { backgroundColor: colors.onPrimarySubtle }]} />
        {hasIn ? (
          <Animated.View
            style={[styles.fill, { left: `${from * 100}%`, width: fillWidth, backgroundColor: colors.onPrimary }]}
          />
        ) : null}
        {!hasOut ? (
          <Animated.View style={[styles.nowAnchor, { left: nowLeft }]}>
            <View style={[styles.now, { backgroundColor: colors.secondary, borderColor: colors.primary }]} />
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.labels}>
        <ThemedText weight="medium" style={[styles.label, { color: colors.onPrimaryMuted }]}>
          {startLabel}
        </ThemedText>
        <ThemedText weight="medium" style={[styles.label, { color: colors.onPrimaryMuted }]}>
          {endLabel}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barArea: { height: 20, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3 },
  fill: { position: 'absolute', height: 6, borderRadius: 3 },
  nowAnchor: { position: 'absolute', top: 0, bottom: 0, width: 0, justifyContent: 'center' },
  now: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, marginLeft: -8 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  label: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
