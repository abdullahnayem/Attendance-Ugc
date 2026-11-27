import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { minutesLabel } from '@/features/attendance/utils';
import { useAppTheme } from '@/hooks/use-app-theme';

export type PunchSuccess = {
  action: 'CHECK_IN' | 'CHECK_OUT';
  /** Time of the punch, already formatted for the work time zone (e.g. "9:02 AM"). */
  time: string;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  /** Check out only: time worked today, e.g. "8h 05m". */
  worked?: string;
};

type Props = {
  success: PunchSuccess | null;
  onClose: () => void;
};

/** The congratulation shown after the server accepts a check in or check out. */
export function PunchSuccessModal({ success, onClose }: Props) {
  const { colors } = useAppTheme();
  const [scale] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    if (!success) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [success, scale]);

  if (!success) return null;

  const checkIn = success.action === 'CHECK_IN';
  const late = success.lateMinutes ?? 0;
  const early = success.earlyLeaveMinutes ?? 0;

  const title = checkIn ? 'Checked in!' : 'Great work today!';
  const message = checkIn
    ? late > 0
      ? `You checked in at ${success.time}, ${minutesLabel(late)} after the shift start. Have a productive day!`
      : `You checked in on time at ${success.time}. Have a productive day!`
    : `You checked out at ${success.time}${success.worked ? ` after ${success.worked} of work` : ''}.${
        early > 0 ? ` That is ${minutesLabel(early)} before the shift end.` : ''
      } Enjoy the rest of your day!`;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="Close">
        {/* Taps on the card must not close it. */}
        <Pressable style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => undefined}>
          <Animated.View
            style={[
              styles.badge,
              { backgroundColor: checkIn ? colors.successLight : colors.primaryLight, transform: [{ scale }] },
            ]}
          >
            <Ionicons
              name={checkIn ? 'checkmark-circle' : 'trophy'}
              size={56}
              color={checkIn ? colors.success : colors.primary}
            />
          </Animated.View>

          <ThemedText style={[styles.congrats, { color: colors.textSecondary }]} weight="bold">
            {checkIn ? 'Congratulations' : 'Well done'}
          </ThemedText>
          <ThemedText style={styles.title} weight="extraBold" accessibilityRole="header">
            {title}
          </ThemedText>
          <ThemedText style={[styles.message, { color: colors.textSecondary }]}>{message}</ThemedText>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <ThemedText weight="bold" style={{ color: colors.onPrimary, fontSize: 16 }}>
              Done
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 28, borderWidth: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 22, alignItems: 'center' },
  badge: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  congrats: { fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 26, lineHeight: 32, marginTop: 4, textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  button: { alignSelf: 'stretch', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
});
