import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/app-themed-text';
import { SecondsDial } from '@/features/auth/components/SecondsDial';
import { useAppTheme } from '@/hooks/use-app-theme';

const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);

/**
 * The first thing on screen is the clock the app exists to answer to: a live dial on the brand
 * colour. The sign-in sheet rises over its lower edge.
 */
export function LoginHeader() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: insets.top + 20 }]}>
      <View style={styles.brand}>
        <View style={[styles.brandMark, { backgroundColor: colors.onPrimary }]}>
          <Ionicons name="time" size={18} color={colors.primary} />
        </View>
        <ThemedText weight="bold" style={[styles.brandName, { color: colors.onPrimary }]}>
          Attendance
        </ThemedText>
      </View>

      <View style={styles.dial}>
        <SecondsDial now={now} />
      </View>

      <ThemedText weight="medium" style={[styles.date, { color: colors.onPrimaryMuted }]}>
        {dateLabel(now)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 68,
    alignItems: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start' },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 16 },
  dial: { marginTop: 24 },
  date: { fontSize: 15, marginTop: 18 },
});
