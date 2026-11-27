import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { StatStrip } from '@/components/ui/stat-strip';
import { useAppTheme } from '@/hooks/use-app-theme';
import { AttendanceCalendar, type CalendarDay } from '@/features/attendance/components/AttendanceCalendar';
import { toneOf } from '@/features/attendance/dayTone';
import {
  dayOfMonth,
  dayTypeLabel,
  formatClockTime,
  formatMinutes,
  formatMonthYear,
  formatWeekday,
  fromIsoDate,
  minutesLabel,
  toIsoDate,
} from '@/features/attendance/utils';
import type { AttendanceHistoryItem } from '@/types/attendance';

type Range = { from: string; to: string };

/** Column widths as flex shares, so the table fits any phone without sideways scrolling. */
const COL = { date: 1.05, clockIn: 1.5, clockOut: 1.5, worked: 1.1, status: 1.55 } as const;

const MAX_DAYS = 400;

/**
 * Every day the screen is asked to show, newest first. A day with no record still gets a row, so a
 * gap is visible instead of silently missing. Days after today are left out, and when more pages
 * are still to load the list stops at the oldest day loaded so far.
 */
function buildDays(items: AttendanceHistoryItem[], range: Range, hasNextPage: boolean): CalendarDay[] {
  const byDate = new Map(items.map((item) => [item.workDate, item]));
  const todayIso = toIsoDate(new Date());
  const upper = range.to < todayIso ? range.to : todayIso;
  const oldestLoaded = items.reduce((min, item) => (item.workDate < min ? item.workDate : min), items[0]?.workDate ?? range.from);
  const lower = hasNextPage && oldestLoaded > range.from ? oldestLoaded : range.from;

  const dates = new Set(byDate.keys());
  let cursor = fromIsoDate(upper);
  for (let i = 0; i < MAX_DAYS && toIsoDate(cursor) >= lower; i += 1) {
    dates.add(toIsoDate(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return [...dates].sort().reverse().map((date) => ({ date, item: byDate.get(date) }));
}

function Dash() {
  const { colors } = useAppTheme();
  return <ThemedText style={[styles.cellText, { color: colors.textMuted }]}>—</ThemedText>;
}

function HeaderRow() {
  const { colors } = useAppTheme();
  const label = (text: string, flex: number, align: 'left' | 'right' = 'left') => (
    <View style={{ flex }}>
      <ThemedText
        weight="semiBold"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.headText, { color: colors.textSecondary, textAlign: align }]}
      >
        {text}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.header, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
      {label('Date', COL.date)}
      {label('Check in', COL.clockIn)}
      {label('Check out', COL.clockOut)}
      {label('Worked', COL.worked)}
      {label('Status', COL.status, 'right')}
    </View>
  );
}

function DayRow({ day, last, isToday }: { day: CalendarDay; last: boolean; isToday: boolean }) {
  const { colors } = useAppTheme();
  const { item, date } = day;
  const tone = item ? toneOf(item) : 'idle';
  const late = item?.summary?.lateMinutes ?? 0;
  const early = item?.summary?.earlyLeaveMinutes ?? 0;
  const checkedIn = Boolean(item?.session?.firstCheckInAt);
  const checkedOut = Boolean(item?.session?.lastCheckOutAt);
  const netMinutes = item?.summary?.netWorkedMinutes;
  const absent = tone === 'bad';
  const showTimes = checkedIn && tone !== 'off' && !absent;

  const flags: { text: string; color: string }[] = [];
  if (showTimes) {
    if (late > 0) flags.push({ text: `${minutesLabel(late)} late`, color: colors.secondaryDark });
    if (early > 0) flags.push({ text: `${minutesLabel(early)} early`, color: colors.errorText });
    if (!flags.length) flags.push({ text: 'On time', color: colors.text });
  }

  const stateText = absent
    ? 'Absent'
    : tone === 'off' && item
      ? dayTypeLabel(item.dayType)
      : !item
        ? 'No record'
        : 'No check in';

  return (
    <View
      style={[
        styles.row,
        absent && { backgroundColor: colors.errorLight },
        !last && { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
      ]}
    >
      <View style={[styles.cell, { flex: COL.date }]}>
        <ThemedText
          weight="extraBold"
          style={[styles.dayNum, { color: absent ? colors.errorText : tone === 'off' || !item ? colors.textMuted : colors.text }]}
        >
          {dayOfMonth(date)}
        </ThemedText>
        <ThemedText
          weight={isToday ? 'bold' : 'medium'}
          style={[styles.weekday, { color: isToday ? colors.primaryText : colors.textMuted }]}
        >
          {isToday ? 'Today' : formatWeekday(date)}
        </ThemedText>
      </View>

      <View style={[styles.cell, { flex: COL.clockIn }]}>
        {showTimes ? (
          <ThemedText weight="semiBold" style={styles.cellText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {formatClockTime(item?.session?.firstCheckInAt, item?.timeZoneId ?? 'UTC')}
          </ThemedText>
        ) : (
          <Dash />
        )}
      </View>

      <View style={[styles.cell, { flex: COL.clockOut }]}>
        {showTimes && checkedOut ? (
          <ThemedText weight="semiBold" style={styles.cellText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {formatClockTime(item?.session?.lastCheckOutAt, item?.timeZoneId ?? 'UTC')}
          </ThemedText>
        ) : (
          <Dash />
        )}
      </View>

      <View style={[styles.cell, { flex: COL.worked }]}>
        {showTimes && netMinutes != null ? (
          <ThemedText weight="semiBold" style={styles.cellText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {formatMinutes(netMinutes)}
          </ThemedText>
        ) : (
          <Dash />
        )}
      </View>

      <View style={[styles.cell, styles.statusCell, { flex: COL.status }]}>
        {flags.length ? (
          flags.map((flag) => (
            <View key={flag.text} style={styles.flag}>
              <View style={[styles.flagDot, { backgroundColor: flag.color }]} />
              <ThemedText weight="bold" style={[styles.flagText, { color: flag.color }]} numberOfLines={1}>
                {flag.text}
              </ThemedText>
            </View>
          ))
        ) : (
          <ThemedText
            weight={absent ? 'bold' : 'semiBold'}
            style={[styles.flagText, { color: absent ? colors.errorText : colors.textMuted }]}
            numberOfLines={1}
          >
            {stateText}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

export function AttendanceTable({
  items,
  range,
  hasNextPage = false,
}: {
  items: AttendanceHistoryItem[];
  range: Range;
  hasNextPage?: boolean;
}) {
  const { colors } = useAppTheme();

  const days = useMemo(() => buildDays(items, range, hasNextPage), [items, range, hasNextPage]);
  const todayIso = toIsoDate(new Date());

  const totals = useMemo(() => {
    let present = 0;
    let absent = 0;
    let lateDays = 0;
    let lateMinutes = 0;
    let earlyMinutes = 0;
    for (const item of items) {
      if (item.session?.firstCheckInAt) present += 1;
      if (item.session?.status === 'ABSENT') absent += 1;
      const late = item.summary?.lateMinutes ?? 0;
      if (late > 0) lateDays += 1;
      lateMinutes += late;
      earlyMinutes += item.summary?.earlyLeaveMinutes ?? 0;
    }
    return { present, absent, lateDays, lateMinutes, earlyMinutes };
  }, [items]);

  const calendarSummary = `${totals.present} days present, ${totals.lateDays} late, ${totals.absent} absent.`;

  return (
    <View style={styles.wrap}>
      <StatStrip
        items={[
          { label: 'Days present', value: String(totals.present) },
          {
            label: 'Late',
            value: minutesLabel(totals.lateMinutes),
            note: totals.lateDays ? `${totals.lateDays} ${totals.lateDays === 1 ? 'day' : 'days'}` : undefined,
            noteColor: colors.secondaryDark,
          },
          { label: 'Left early', value: `${totals.earlyMinutes}m` },
        ]}
      />

      <AttendanceCalendar days={days} summary={calendarSummary} />

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <HeaderRow />
        {days.map((day, index) => {
          const month = formatMonthYear(day.date);
          const startsMonth = index === 0 || month !== formatMonthYear(days[index - 1].date);
          return (
            <React.Fragment key={day.date}>
              {startsMonth ? (
                <View style={[styles.month, { backgroundColor: colors.primaryLighter, borderBottomColor: colors.divider }]}>
                  <ThemedText weight="bold" style={[styles.monthText, { color: colors.primaryText }]}>{month}</ThemedText>
                </View>
              ) : null}
              <DayRow day={day} last={index === days.length - 1} isToday={day.date === todayIso} />
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  card: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  headText: { fontSize: 12 },
  month: { paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  monthText: { fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, minHeight: 54 },
  cell: { justifyContent: 'center' },
  statusCell: { alignItems: 'flex-end', gap: 2 },
  dayNum: { fontSize: 18, lineHeight: 22, fontVariant: ['tabular-nums'] },
  weekday: { fontSize: 11 },
  cellText: { fontSize: 13, fontVariant: ['tabular-nums'] },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flagDot: { width: 6, height: 6, borderRadius: 3 },
  flagText: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
