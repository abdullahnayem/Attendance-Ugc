import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

/** A calendar month. `month` is 0-11, like `Date`. */
export type MonthValue = { year: number; month: number };

export const currentMonth = (): MonthValue => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
};

const pad = (n: number) => String(n).padStart(2, '0');

/** First and last day of the month as `YYYY-MM-DD`. */
export const monthRange = ({ year, month }: MonthValue): { from: string; to: string } => {
  const last = new Date(year, month + 1, 0).getDate();
  return { from: `${year}-${pad(month + 1)}-01`, to: `${year}-${pad(month + 1)}-${pad(last)}` };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthName = ({ year, month }: MonthValue) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));

/** The selected month with a calendar icon. Tap it to jump to any earlier month and year; the future is not selectable. */
export function MonthPicker({ value, onChange }: { value: MonthValue; onChange: (value: MonthValue) => void }) {
  const { colors } = useAppTheme();
  const now = currentMonth();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(value.year);

  const openPicker = () => {
    setYear(value.year);
    setOpen(true);
  };
  const choose = (month: number) => {
    onChange({ year, month });
    setOpen(false);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${monthName(value)}. Choose another month`}
        style={styles.center}
      >
        <View style={styles.monthRow}>
          <ThemedText weight="extraBold" style={[styles.month, { color: colors.text }]}>{monthName(value)}</ThemedText>
          <Ionicons name="calendar-outline" size={18} color={colors.primaryText} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          {/* Taps inside the sheet must not reach the backdrop. */}
          <Pressable style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => undefined}>
            <View style={styles.yearRow}>
              <Pressable
                onPress={() => setYear((y) => y - 1)}
                accessibilityRole="button"
                accessibilityLabel="Previous year"
                hitSlop={8}
                style={[styles.arrow, { backgroundColor: colors.primaryLight }]}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primaryText} />
              </Pressable>
              <ThemedText weight="extraBold" style={[styles.month, { color: colors.text }]}>{year}</ThemedText>
              <Pressable
                onPress={() => setYear((y) => y + 1)}
                disabled={year >= now.year}
                accessibilityRole="button"
                accessibilityLabel="Next year"
                hitSlop={8}
                style={[styles.arrow, { backgroundColor: colors.primaryLight, opacity: year >= now.year ? 0.35 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.primaryText} />
              </Pressable>
            </View>

            <View style={styles.grid}>
              {MONTHS.map((label, month) => {
                const future = year > now.year || (year === now.year && month > now.month);
                const selected = year === value.year && month === value.month;
                return (
                  <View key={label} style={styles.cellWrap}>
                    <Pressable
                      onPress={() => choose(month)}
                      disabled={future}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: future }}
                      style={[
                        styles.cell,
                        { backgroundColor: selected ? colors.primary : colors.surfaceSecondary, opacity: future ? 0.35 : 1 },
                      ]}
                    >
                      <ThemedText weight="bold" style={{ color: selected ? colors.onPrimary : colors.text, fontSize: 15 }}>
                        {label}
                      </ThemedText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, padding: 10, gap: 8 },
  arrow: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  month: { fontSize: 18, letterSpacing: -0.3 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 380, borderWidth: 1, borderRadius: 24, padding: 16, gap: 14 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: { width: '33.333%', padding: 4 },
  cell: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
