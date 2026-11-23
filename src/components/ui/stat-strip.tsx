import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

export type StatItem = {
  label: string;
  value: string;
  /** Short qualifier under the value, e.g. "5m late". */
  note?: string;
  noteColor?: string;
};

/** Three or four figures in one bordered strip, split by hairlines. One card instead of a card per number. */
export function StatStrip({ items }: { items: StatItem[] }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.divider }]} /> : null}
          <View style={styles.cell}>
            <ThemedText weight="medium" style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.label}
            </ThemedText>
            <ThemedText weight="extraBold" style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.value}
            </ThemedText>
            <ThemedText
              weight="bold"
              style={[styles.note, { color: item.noteColor ?? colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.note ?? ' '}
            </ThemedText>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderWidth: 1, borderRadius: 20, paddingVertical: 14 },
  cell: { flex: 1, paddingHorizontal: 14, gap: 2 },
  divider: { width: StyleSheet.hairlineWidth * 2 },
  label: { fontSize: 12 },
  value: { fontSize: 19, lineHeight: 26, fontVariant: ['tabular-nums'] },
  note: { fontSize: 12 },
});
