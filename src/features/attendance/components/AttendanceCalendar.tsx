import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { toneOf, toneStyle, type DayTone } from '@/features/attendance/dayTone';
import type { AttendanceHistoryItem } from '@/types/attendance';

const DAY_MS = 86_400_000;
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const dayNumber = (workDate: string): number => {
  const [year, month, day] = workDate.split('-').map(Number);
  return Math.round(Date.UTC(year, (month || 1) - 1, day || 1) / DAY_MS);
};

/** One calendar day. `item` is missing when the server has no record for that date. */
export type CalendarDay = { date: string; item?: AttendanceHistoryItem };

// Same amber as the admin panel's "edited by admin" dot.
const EDITED_DOT = '#F59E0B';

type Cell = { key: string; day: number; tone: DayTone; manual: boolean } | null;

const LEGEND: { tone: DayTone; label: string }[] = [
  { tone: 'good', label: 'On time' },
  { tone: 'warn', label: 'Late or early' },
  { tone: 'bad', label: 'Absent' },
  { tone: 'off', label: 'Day off' },
];

/**
 * The loaded days laid out as a real calendar (Sunday first). On time is a light green tile,
 * late or early light amber, absent light red, everything else stays quiet. One glance answers "how has my month
 * been" before the list answers "what exactly happened".
 */
export function AttendanceCalendar({ days, summary }: { days: CalendarDay[]; summary: string }) {
  const { colors } = useAppTheme();

  const { cells, counts } = useMemo(() => {
    const tally: Record<DayTone, number> = { good: 0, warn: 0, bad: 0, off: 0, idle: 0 };
    if (!days.length) return { cells: [] as Cell[], counts: tally };

    const byDay = new Map<number, CalendarDay>();
    for (const day of days) byDay.set(dayNumber(day.date), day);
    const keys = [...byDay.keys()];
    const first = Math.min(...keys);
    const last = Math.max(...keys);

    const grid: Cell[] = Array.from({ length: new Date(first * DAY_MS).getUTCDay() }, () => null);
    for (let d = first; d <= last; d += 1) {
      const entry = byDay.get(d);
      const tone = entry?.item ? toneOf(entry.item) : 'idle';
      tally[tone] += 1;
      grid.push({ key: String(d), day: new Date(d * DAY_MS).getUTCDate(), tone, manual: Boolean(entry?.item?.manual) });
    }
    return { cells: grid, counts: tally };
  }, [days]);

  return (
    <View style={[styles.panel, { backgroundColor: colors.surfaceSecondary }]}>
      <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {WEEKDAYS.map((letter, index) => (
          <View key={index} style={styles.slot}>
            <ThemedText weight="semiBold" style={[styles.weekday, { color: colors.textMuted }]}>
              {letter}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.row} accessible accessibilityLabel={summary}>
        {cells.map((cell, index) => {
          if (!cell) return <View key={`lead-${index}`} style={styles.slot} />;
          const tone = toneStyle(cell.tone, colors);
          return (
            <View key={cell.key} style={styles.slot}>
              <View
                style={[
                  styles.day,
                  { backgroundColor: tone.background, borderColor: tone.border, borderStyle: tone.borderStyle },
                ]}
              >
                <ThemedText
                  weight={cell.tone === 'bad' ? 'extraBold' : 'bold'}
                  style={[styles.dayText, { color: tone.text }]}
                >
                  {cell.day}
                </ThemedText>
                {cell.manual ? <View style={[styles.editDot, { backgroundColor: EDITED_DOT }]} /> : null}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        {LEGEND.map((entry) => {
          const tone = toneStyle(entry.tone, colors);
          return (
            <View key={entry.tone} style={styles.legendItem}>
              <View
                style={[
                  styles.swatch,
                  entry.tone === 'off'
                    ? { backgroundColor: colors.border, borderColor: colors.border }
                    : { backgroundColor: tone.background, borderColor: tone.border },
                ]}
              />
              <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>
                {entry.label}
              </ThemedText>
              <ThemedText weight="extraBold" style={[styles.legendCount, { color: colors.text }]}>
                {counts[entry.tone]}
              </ThemedText>
            </View>
          );
        })}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: EDITED_DOT }]} />
          <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Edited by admin</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 22, paddingHorizontal: 10, paddingTop: 12, paddingBottom: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  // Seven equal columns without measuring: each slot is a seventh of the width.
  slot: { width: `${100 / 7}%`, padding: 3 },
  weekday: { fontSize: 12, textAlign: 'center', paddingBottom: 2 },
  day: { aspectRatio: 1, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editDot: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3 },
  dayText: { fontSize: 14, fontVariant: ['tabular-nums'] },
  legend: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginTop: 12, paddingHorizontal: 4 },
  // Two columns, so the legend reads as a tidy block instead of a ragged line.
  legendItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 4, borderWidth: 1 },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 },
  legendText: { fontSize: 12 },
  legendCount: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
