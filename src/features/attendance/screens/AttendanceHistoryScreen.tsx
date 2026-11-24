import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { getAttendanceHistory, getAttendanceToday } from '@/api/attendance';
import { HeaderBack } from '@/components/header/header-back';
import { ThemedText } from '@/components/app-themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { AttendanceTable } from '@/features/attendance/components/AttendanceTable';
import { currentMonth, MonthPicker, monthRange, type MonthValue } from '@/features/attendance/components/MonthPicker';
import { attendanceErrorMessage, toIsoDate } from '@/features/attendance/utils';
import type { AttendanceHistoryItem } from '@/types/attendance';

const PAGE_SIZE = 31;

type DateRange = { from: string; to: string };

/**
 * History only lists days the server has already recorded, so a day with no punch yet is missing.
 * When the range includes today and history has no row for it, borrow it from the Today endpoint.
 */
async function withToday(range: DateRange, items: AttendanceHistoryItem[]): Promise<AttendanceHistoryItem[]> {
  if (range.to < toIsoDate(new Date())) return items;
  try {
    const today = await getAttendanceToday();
    const date = today.workDate;
    if (!date || date < range.from || date > range.to) return items;
    if (items.some((item) => item.workDate === date)) return items;
    return [{ ...today, id: date }, ...items];
  } catch {
    return items;
  }
}

export default function AttendanceHistoryScreen() {
  const { colors } = useAppTheme();
  const tabBarHeight = useTabBarHeight();
  const [month, setMonth] = useState<MonthValue>(currentMonth);
  const applied = useMemo(() => monthRange(month), [month]);
  const [items, setItems] = useState<AttendanceHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (range: DateRange, nextPage: number, mode: 'replace' | 'append' | 'refresh') => {
    const current = ++requestId.current;
    setError(null);
    if (mode === 'append') setLoadingMore(true);
    else if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);

    try {
      const response = await getAttendanceHistory(range.from, range.to, nextPage, PAGE_SIZE);
      const pageItems = nextPage === 1 ? await withToday(range, response.items) : response.items;
      if (current !== requestId.current) return;
      setItems((existing) => (mode === 'append' ? [...existing, ...pageItems] : pageItems));
      setPage(response.page);
      setHasNextPage(response.hasNextPage);
    } catch (loadError) {
      if (current !== requestId.current) return;
      setError(attendanceErrorMessage(loadError));
    } finally {
      if (current === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(applied, 1, 'replace');
  }, [applied, load]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <HeaderBack title="Attendance history" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(applied, 1, 'refresh')} tintColor={colors.primary} />
        }
      >
        <MonthPicker value={month} onChange={setMonth} />

        {error ? (
          <View style={[styles.banner, { backgroundColor: colors.errorLight, borderColor: colors.errorBorder }]}>
            <ThemedText style={{ color: colors.errorText }}>{error}</ThemedText>
            <Pressable onPress={() => load(applied, 1, 'replace')}>
              <ThemedText weight="bold" style={{ color: colors.primaryText }}>Try again</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
        ) : null}

        {!loading && !items.length && !error ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calendar-clear-outline" size={26} color={colors.primaryText} />
            </View>
            <ThemedText weight="bold" style={styles.emptyTitle}>No records this month</ThemedText>
            <ThemedText style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Use the arrows above to look at another month.
            </ThemedText>
          </View>
        ) : null}

        {!loading && items.length ? <AttendanceTable items={items} range={applied} hasNextPage={hasNextPage} /> : null}

        {!loading && hasNextPage ? (
          <Pressable
            style={[styles.loadMore, { borderColor: colors.primary }]}
            onPress={() => load(applied, page + 1, 'append')}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <ThemedText weight="bold" style={{ color: colors.primaryText }}>Load more days</ThemedText>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  center: { paddingVertical: 48, alignItems: 'center' },
  banner: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  empty: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16 },
  emptyBody: { textAlign: 'center', fontSize: 14 },
  loadMore: { alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingVertical: 13 },
});
