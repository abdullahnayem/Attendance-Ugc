import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import {
  buildPunchPayload,
  createAttendanceIdempotencyKey,
  getAttendanceToday,
  punchAttendance,
} from '@/api/attendance';
import { AttendanceHeader } from '@/components/header/attendance-header';
import { ThemedText } from '@/components/app-themed-text';
import { StatStrip } from '@/components/ui/stat-strip';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { ShiftTimeline } from '@/features/attendance/components/ShiftTimeline';
import { SwipeAttendanceButton } from '@/features/attendance/components/SwipeAttendanceButton';
import { captureAttendanceLocation } from '@/features/attendance/location';
import {
  attendanceErrorMessage,
  attendanceStatusLabel,
  dayTypeLabel,
  formatClockTime,
  formatWorkDate,
  parseUtc,
  sentenceCase,
  workedElapsedLabel,
} from '@/features/attendance/utils';
import type { AttendanceToday } from '@/types/attendance';

/** Re-renders every 15 seconds; the clock and worked timer only show hh:mm. */
const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const toMs = (value?: string | null): number => (value ? parseUtc(value).getTime() : NaN);

export default function AttendanceTodayScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();
  const now = useNow();
  const [attendance, setAttendance] = useState<AttendanceToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setAttendance(await getAttendanceToday());
    } catch (loadError) {
      setError(attendanceErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const submitPunch = async () => {
    if (!attendance?.session?.allowedAction || attendance.session.allowedAction === 'NONE') return;
    setSubmitting(true);
    setError(null);
    const idempotencyKey = createAttendanceIdempotencyKey();

    try {
      const location = attendance.location.requiresCurrentLocation || attendance.location.mode !== 'ANY'
        ? await captureAttendanceLocation()
        : undefined;
      const payload = await buildPunchPayload(idempotencyKey, location ?? null);
      const result = await punchAttendance(payload);
      setAttendance(result);
      if (!result.accepted) setError(result.message ?? 'Attendance action was not accepted.');
    } catch (punchError) {
      setError(attendanceErrorMessage(punchError));
      await load(true);
    } finally {
      setSubmitting(false);
    }
  };

  const tz = attendance?.timeZoneId ?? 'UTC';
  const action = attendance?.session?.allowedAction ?? 'NONE';
  const canPunch = action !== 'NONE' && attendance?.dayType === 'WORKING';
  const late = attendance?.summary?.lateMinutes ?? 0;
  const early = attendance?.summary?.earlyLeaveMinutes ?? 0;

  const [clockTime, clockMeridiem] = formatClockTime(now.toISOString(), tz).split(' ');
  const startMs = toMs(attendance?.schedule?.startAt);
  const endMs = toMs(attendance?.schedule?.endAt);
  const hasTimeline = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
  const checkInAt = attendance?.session?.firstCheckInAt;
  const checkOutAt = attendance?.session?.lastCheckOutAt;

  // What to say when there is nothing to swipe.
  const idleNote = !attendance || canPunch
    ? null
    : attendance.dayType !== 'WORKING'
      ? { icon: 'moon-outline' as const, text: `${dayTypeLabel(attendance.dayType)}. No punch needed today.` }
      : checkOutAt
        ? { icon: 'checkmark-circle' as const, text: 'Your day is complete. Check out is recorded.' }
        : { icon: 'information-circle-outline' as const, text: "Punching isn't available right now." };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AttendanceHeader title="Attendance" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          {error ? (
            <View style={[styles.banner, { backgroundColor: colors.errorLight, borderColor: colors.errorBorder }]}>
              <ThemedText style={{ color: colors.errorText }}>{error}</ThemedText>
              <Pressable onPress={() => load(true)}>
                <ThemedText weight="bold" style={{ color: colors.primaryText }}>Try again</ThemedText>
              </Pressable>
            </View>
          ) : null}

          {attendance ? (
            <>
              <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                <ThemedText style={[styles.heroDate, { color: colors.onPrimaryMuted }]} weight="medium">
                  {formatWorkDate(attendance.workDate)}
                </ThemedText>

                <View style={styles.clockRow}>
                  <View style={styles.clock}>
                    <ThemedText style={[styles.heroClock, { color: colors.onPrimary }]} weight="extraBold">
                      {clockTime}
                    </ThemedText>
                    {clockMeridiem ? (
                      <ThemedText style={[styles.meridiem, { color: colors.onPrimaryMuted }]} weight="bold">
                        {clockMeridiem}
                      </ThemedText>
                    ) : null}
                  </View>
                  <View style={[styles.heroPill, { backgroundColor: colors.onPrimarySubtle }]}>
                    <ThemedText style={[styles.heroPillText, { color: colors.onPrimary }]} weight="bold">
                      {sentenceCase(attendanceStatusLabel(attendance))}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.shift}>
                  <ThemedText style={[styles.heroShift, { color: colors.onPrimary }]} weight="bold">
                    {attendance.schedule?.shiftName ?? 'No assigned shift'}
                  </ThemedText>
                  {hasTimeline ? (
                    <ShiftTimeline
                      startMs={startMs}
                      endMs={endMs}
                      checkInMs={checkInAt ? toMs(checkInAt) : null}
                      checkOutMs={checkOutAt ? toMs(checkOutAt) : null}
                      nowMs={now.getTime()}
                      startLabel={formatClockTime(attendance.schedule?.startAt, tz)}
                      endLabel={formatClockTime(attendance.schedule?.endAt, tz)}
                      summary={`Shift ${formatClockTime(attendance.schedule?.startAt, tz)} to ${formatClockTime(attendance.schedule?.endAt, tz)}. ${
                        checkInAt ? `Checked in at ${formatClockTime(checkInAt, tz)}.` : 'Not checked in yet.'
                      }`}
                    />
                  ) : (
                    <ThemedText style={[styles.heroWindow, { color: colors.onPrimaryMuted }]}>
                      No schedule available
                    </ThemedText>
                  )}
                </View>
              </View>

              {canPunch ? (
                <View style={styles.action}>
                  {submitting ? (
                    <View style={styles.submitting}><ActivityIndicator color={colors.primary} /></View>
                  ) : (
                    <SwipeAttendanceButton
                      label={action === 'CHECK_IN' ? 'Check in' : 'Check out'}
                      tone={action === 'CHECK_IN' ? 'success' : 'secondary'}
                      onComplete={submitPunch}
                    />
                  )}
                  {attendance.location.requiresCurrentLocation ? (
                    <ThemedText style={[styles.helper, { color: colors.textSecondary }]}>
                      Your current location is checked when you punch.
                    </ThemedText>
                  ) : null}
                </View>
              ) : idleNote ? (
                <View style={styles.idle}>
                  <Ionicons
                    name={idleNote.icon}
                    size={20}
                    color={idleNote.icon === 'checkmark-circle' ? colors.success : colors.textMuted}
                  />
                  <ThemedText style={[styles.idleText, { color: colors.textSecondary }]}>{idleNote.text}</ThemedText>
                </View>
              ) : null}

              <StatStrip
                items={[
                  {
                    label: 'Check in',
                    value: formatClockTime(checkInAt, tz),
                    note: late > 0 ? `${late}m late` : checkInAt ? 'On time' : undefined,
                    noteColor: late > 0 ? colors.secondaryDark : colors.successText,
                  },
                  {
                    label: 'Check out',
                    value: formatClockTime(checkOutAt, tz),
                    note: early > 0 ? `${early}m early` : undefined,
                    noteColor: colors.errorText,
                  },
                  {
                    label: 'Time worked',
                    value: workedElapsedLabel(attendance, now.getTime()),
                    note: checkInAt && !checkOutAt ? 'In progress' : undefined,
                    noteColor: colors.primaryText,
                  },
                ]}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.historyLink,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => router.push('/history')}
                accessibilityRole="button"
              >
                <View style={[styles.historyIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primaryText} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText weight="bold">Attendance history</ThemedText>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Days, times and late minutes
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  banner: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  hero: { borderRadius: 28, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 },
  heroDate: { fontSize: 14 },
  clockRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, gap: 12 },
  clock: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, flexShrink: 1 },
  heroClock: { fontSize: 60, lineHeight: 68, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  meridiem: { fontSize: 18, lineHeight: 22, marginBottom: 14 },
  heroPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 14 },
  heroPillText: { fontSize: 12 },
  shift: { marginTop: 14, gap: 8 },
  heroShift: { fontSize: 15 },
  heroWindow: { fontSize: 13 },
  action: { gap: 10 },
  submitting: { height: 60, alignItems: 'center', justifyContent: 'center' },
  helper: { textAlign: 'center', fontSize: 13 },
  idle: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  idleText: { flex: 1, fontSize: 14, lineHeight: 20 },
  historyLink: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14 },
  historyIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
