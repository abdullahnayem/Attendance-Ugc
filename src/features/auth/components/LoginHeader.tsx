import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/app-themed-text';
import { NexusMark } from '@/components/brand/nexus-mark';
import { SecondsDial } from '@/features/auth/components/SecondsDial';
import { useAppTheme } from '@/hooks/use-app-theme';

const DATE_ROOM = 40;

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
  const [area, setArea] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // The hero takes whatever height the sign-in sheet leaves, so the dial is sized to fit it. No scrolling.
  const onArea = (e: LayoutChangeEvent) => setArea(e.nativeEvent.layout);
  const dialSize = Math.min(216, area.width, area.height - DATE_ROOM);

  return (
    <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: insets.top + 20 }]}>
      <View style={styles.brand}>
        <NexusMark size={34} />
        <ThemedText weight="extraBold" style={[styles.brandName, { color: colors.onPrimary }]}>
          Nexus Attendance
        </ThemedText>
      </View>

      <View style={styles.middle} onLayout={onArea}>
        {dialSize >= 96 ? (
          <>
            <SecondsDial now={now} size={Math.floor(dialSize)} />
            <ThemedText weight="medium" style={[styles.date, { color: colors.onPrimaryMuted }]}>
              {dateLabel(now)}
            </ThemedText>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 56,
  },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start' },
  brandName: { fontSize: 16 },
  date: { fontSize: 15, marginTop: 14 },
});
