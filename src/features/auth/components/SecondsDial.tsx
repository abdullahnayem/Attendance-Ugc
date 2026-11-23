import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

const TICKS = 60;
const pad = (n: number) => String(n).padStart(2, '0');

type Props = {
  now: Date;
  /** Outer diameter in px. */
  size?: number;
};

/**
 * A punch-clock face. Sixty ticks ring the time; they fill clockwise as the seconds pass and the
 * amber tick marks "now". Drawn on the brand colour, so it only uses on-primary tokens.
 */
export function SecondsDial({ now, size = 216 }: Props) {
  const { colors } = useAppTheme();
  const seconds = now.getSeconds();
  const radius = size / 2;

  const hours = now.getHours();
  const hour12 = hours % 12 || 12;
  const meridiem = hours < 12 ? 'AM' : 'PM';
  const label = `${pad(hour12)}:${pad(now.getMinutes())} ${meridiem}`;

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={label}
    >
      {Array.from({ length: TICKS }, (_, i) => {
        const major = i % 5 === 0;
        const current = i === seconds;
        const width = current ? 4 : major ? 3 : 2;
        const height = current ? 18 : major ? 12 : 7;
        const backgroundColor = current
          ? colors.secondary
          : i < seconds
            ? colors.onPrimaryMuted
            : colors.onPrimarySubtle;

        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: radius - width / 2,
              top: radius - height / 2,
              width,
              height,
              borderRadius: width / 2,
              backgroundColor,
              // Rotate about the dial centre, then push the tick out to the rim.
              transform: [{ rotate: `${i * 6}deg` }, { translateY: -(radius - height / 2 - 2) }],
            }}
          />
        );
      })}

      <View style={styles.center} pointerEvents="none">
        <ThemedText weight="extraBold" style={[styles.time, { color: colors.onPrimary }]}>
          {pad(hour12)}:{pad(now.getMinutes())}
        </ThemedText>
        <ThemedText weight="bold" style={[styles.meridiem, { color: colors.onPrimaryMuted }]}>
          {meridiem}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 54, lineHeight: 60, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  meridiem: { fontSize: 16, lineHeight: 20, letterSpacing: 1 },
});
