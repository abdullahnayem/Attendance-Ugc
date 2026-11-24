import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAttendanceToday } from '@/api/attendance';
import { ThemedText } from '@/components/app-themed-text';
import { NexusMark } from '@/components/brand/nexus-mark';
import { useAuth } from '@/context/providers/AuthProvider';
import { useAttendanceAccess } from '@/features/attendance/access';
import {
  attendanceErrorMessage,
  dayTypeLabel,
  formatClockTime,
  formatWorkDate,
  sentenceCase,
  workedElapsedLabel,
} from '@/features/attendance/utils';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import type { AttendanceToday } from '@/types/attendance';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const greeting = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarHeight();
  const { user, signOut } = useAuth();
  const hasAttendance = useAttendanceAccess();

  const [today, setToday] = useState<AttendanceToday | null>(null);
  const [loading, setLoading] = useState(hasAttendance);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  // The worked timer and the greeting only need minute precision.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (!hasAttendance) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setToday(await getAttendanceToday());
    } catch (loadError) {
      setError(attendanceErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasAttendance]);

  // Refresh whenever Home comes back into view, e.g. after a punch.
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const fullName: string = user?.fullName ?? user?.name ?? 'there';
  const firstName = fullName.trim().split(/\s+/)[0];
  const role: string | undefined = user?.role;
  const subtitle = [user?.designation, user?.department].filter(Boolean).join(' · ') || role;

  const handleSignOut = () => void signOut();

  const action = today?.session?.allowedAction ?? 'NONE';
  const canPunch = action !== 'NONE' && today?.dayType === 'WORKING';
  const tz = today?.timeZoneId ?? 'UTC';
  const checkInAt = today?.session?.firstCheckInAt;
  const checkOutAt = today?.session?.lastCheckOutAt;
  const late = today?.summary?.lateMinutes ?? 0;

  const status = (() => {
    if (!today) return null;
    if (today.dayType !== 'WORKING') {
      return { label: dayTypeLabel(today.dayType), icon: 'moon-outline' as IconName, bg: colors.infoLight, fg: colors.infoText };
    }
    switch (today.session?.status) {
      case 'CHECKED_IN':
        return { label: 'Checked in', icon: 'radio-button-on' as IconName, bg: colors.successLight, fg: colors.successText };
      case 'CHECKED_OUT':
        return { label: 'Day complete', icon: 'checkmark-circle' as IconName, bg: colors.primaryLight, fg: colors.primaryText };
      case 'ABSENT':
        return { label: 'Absent', icon: 'close-circle' as IconName, bg: colors.errorLight, fg: colors.errorText };
      case 'INCOMPLETE':
        return { label: 'Incomplete', icon: 'alert-circle' as IconName, bg: colors.warningLight, fg: colors.warningText };
      default:
        return { label: 'Not checked in', icon: 'time-outline' as IconName, bg: colors.secondaryLight, fg: colors.secondaryDark };
    }
  })();

  const cta = canPunch
    ? { label: action === 'CHECK_IN' ? 'Check in now' : 'Check out', icon: (action === 'CHECK_IN' ? 'log-in-outline' : 'log-out-outline') as IconName }
    : { label: "View today's attendance", icon: 'arrow-forward' as IconName };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.onPrimary}
            progressViewOffset={insets.top + 8}
          />
        }
      >
        {/* ---------- hero ---------- */}
        <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: insets.top + 16 }]}>
          <View style={[styles.bubble, styles.bubbleA, { backgroundColor: colors.onPrimarySubtle }]} />
          <View style={[styles.bubble, styles.bubbleB, { backgroundColor: colors.onPrimarySubtle }]} />

          <View style={styles.brandRow}>
            <NexusMark size={36} />
            <View style={{ flex: 1 }}>
              <ThemedText weight="extraBold" style={[styles.brandName, { color: colors.onPrimary }]}>Nexus</ThemedText>
              <ThemedText weight="medium" style={{ color: colors.onPrimaryMuted, fontSize: 12 }}>Attendance</ThemedText>
            </View>
            <Pressable
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.onPrimarySubtle, opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.onPrimary} />
            </Pressable>
          </View>

          <View style={styles.heroTop}>
            <View style={[styles.avatar, { backgroundColor: colors.onPrimarySubtle }]}>
              <ThemedText weight="extraBold" style={[styles.avatarText, { color: colors.onPrimary }]}>
                {initialsOf(fullName)}
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText weight="medium" style={{ color: colors.onPrimaryMuted, fontSize: 14 }}>
                {greeting(now)}
              </ThemedText>
              <ThemedText weight="extraBold" numberOfLines={1} style={[styles.name, { color: colors.onPrimary }]}>
                {firstName}
              </ThemedText>
            </View>
          </View>

          <View style={styles.heroMeta}>
            <View style={[styles.chip, { backgroundColor: colors.onPrimarySubtle }]}>
              <Ionicons name="calendar-outline" size={14} color={colors.onPrimary} />
              <ThemedText weight="bold" style={[styles.chipText, { color: colors.onPrimary }]}>
                {today?.workDate ? formatWorkDate(today.workDate) : new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(now)}
              </ThemedText>
            </View>
            {subtitle ? (
              <View style={[styles.chip, { backgroundColor: colors.onPrimarySubtle }]}>
                <Ionicons name="briefcase-outline" size={14} color={colors.onPrimary} />
                <ThemedText weight="bold" style={[styles.chipText, { color: colors.onPrimary }]} numberOfLines={1}>
                  {subtitle}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          {/* ---------- today card ---------- */}
          <View style={[styles.card, styles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <ThemedText weight="extraBold" style={[styles.cardTitle, { color: colors.text }]}>
                Today
              </ThemedText>
              {status ? (
                <View style={[styles.pill, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon} size={13} color={status.fg} />
                  <ThemedText weight="bold" style={{ color: status.fg, fontSize: 12 }}>
                    {sentenceCase(status.label)}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            {!hasAttendance ? (
              <View style={styles.notice}>
                <View style={[styles.noticeIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="information-circle-outline" size={26} color={colors.primary} />
                </View>
                <ThemedText weight="bold" style={{ color: colors.text, fontSize: 16 }}>
                  Attendance is not set up for you
                </ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' }}>
                  Punching is for interns with a running internship. Once yours starts, your check-in and
                  check-out will appear here.
                </ThemedText>
              </View>
            ) : loading ? (
              <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
            ) : error ? (
              <View style={styles.notice}>
                <ThemedText style={{ color: colors.errorText, textAlign: 'center' }}>{error}</ThemedText>
                <Pressable onPress={() => load(true)} accessibilityRole="button">
                  <ThemedText weight="bold" style={{ color: colors.primaryText }}>Try again</ThemedText>
                </Pressable>
              </View>
            ) : today ? (
              <>
                <View style={styles.shiftRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <ThemedText weight="medium" style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {today.schedule?.shiftName ?? 'No shift'}
                    {today.schedule?.startAt && today.schedule?.endAt
                      ? `  ·  ${formatClockTime(today.schedule.startAt, tz)} – ${formatClockTime(today.schedule.endAt, tz)}`
                      : ''}
                  </ThemedText>
                </View>

                <View style={[styles.stats, { backgroundColor: colors.surfaceSecondary }]}>
                  <Stat label="Check in" value={formatClockTime(checkInAt, tz)} note={late > 0 ? `${late}m late` : checkInAt ? 'On time' : undefined} noteColor={late > 0 ? colors.secondaryDark : colors.successText} />
                  <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                  <Stat label="Check out" value={formatClockTime(checkOutAt, tz)} />
                  <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                  <Stat label="Worked" value={workedElapsedLabel(today, now.getTime())} note={checkInAt && !checkOutAt ? 'In progress' : undefined} noteColor={colors.primaryText} />
                </View>

                <Pressable
                  onPress={() => router.push('/attendance')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.cta,
                    { backgroundColor: canPunch ? colors.primary : colors.primaryLight, opacity: pressed ? 0.88 : 1 },
                  ]}
                >
                  <ThemedText weight="bold" style={{ color: canPunch ? colors.onPrimary : colors.primaryText, fontSize: 15 }}>
                    {cta.label}
                  </ThemedText>
                  <Ionicons name={cta.icon} size={18} color={canPunch ? colors.onPrimary : colors.primaryText} />
                </Pressable>
              </>
            ) : null}
          </View>

          {/* ---------- quick actions ---------- */}
          <ThemedText weight="extraBold" style={[styles.sectionTitle, { color: colors.text }]}>
            Quick actions
          </ThemedText>
          <View style={styles.grid}>
            <Action icon="finger-print" label="Punch" hint="Check in or out" tint={colors.success} tintBg={colors.successLight} disabled={!hasAttendance} onPress={() => router.push('/attendance')} />
            <Action icon="calendar-outline" label="History" hint="Days and times" tint={colors.primary} tintBg={colors.primaryLight} disabled={!hasAttendance} onPress={() => router.push('/history')} />
          </View>

          {/* ---------- where and when ---------- */}
          {hasAttendance && today ? (
            <>
              <ThemedText weight="extraBold" style={[styles.sectionTitle, { color: colors.text }]}>
                Your day
              </ThemedText>
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 4 }]}>
                <InfoRow icon="sunny-outline" label="Day type" value={dayTypeLabel(today.dayType)} />
                <View style={[styles.rule, { backgroundColor: colors.divider }]} />
                <InfoRow
                  icon="location-outline"
                  label="Work location"
                  value={today.location.displayName ?? 'Anywhere'}
                  note={today.location.requiresCurrentLocation ? 'Location is checked when you punch' : undefined}
                />
              </View>
            </>
          ) : null}

          {/* ---------- sign out ---------- */}
          <Pressable
            onPress={handleSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={({ pressed }) => [
              styles.signOut,
              { backgroundColor: colors.errorLight, borderColor: colors.errorBorder, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.errorText} />
            <ThemedText weight="bold" style={{ color: colors.errorText, fontSize: 15 }}>Sign out</ThemedText>
          </Pressable>

          {/* ---------- parent organisation ---------- */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <View style={styles.ugcBadge}>
              <Image source={require('../../../../assets/images/ugc_logo.png')} style={styles.ugcLogo} resizeMode="contain" accessibilityLabel="University Grants Commission of Bangladesh" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText weight="medium" style={{ color: colors.textMuted, fontSize: 12 }}>A product of</ThemedText>
              <ThemedText weight="bold" style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                University Grants Commission of Bangladesh
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------- small parts ----------

function Stat({ label, value, note, noteColor }: { label: string; value: string; note?: string; noteColor?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stat}>
      <ThemedText weight="medium" style={{ color: colors.textMuted, fontSize: 12 }}>{label}</ThemedText>
      <ThemedText weight="extraBold" style={{ color: colors.text, fontSize: 17, fontVariant: ['tabular-nums'] }}>{value}</ThemedText>
      <ThemedText weight="bold" style={{ color: noteColor ?? colors.textMuted, fontSize: 11, minHeight: 14 }}>{note ?? ' '}</ThemedText>
    </View>
  );
}

function Action({
  icon, label, hint, tint, tintBg, disabled, onPress,
}: { icon: IconName; label: string; hint: string; tint: string; tintBg: string; disabled?: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: tintBg }]}>
        <Ionicons name={icon} size={24} color={tint} />
      </View>
      <ThemedText weight="extraBold" style={{ color: colors.text, fontSize: 16 }}>{label}</ThemedText>
      <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>{hint}</ThemedText>
    </Pressable>
  );
}

function InfoRow({ icon, label, value, note }: { icon: IconName; label: string; value: string; note?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={18} color={colors.primaryText} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={{ color: colors.textMuted, fontSize: 12 }}>{label}</ThemedText>
        <ThemedText weight="bold" style={{ color: colors.text, fontSize: 15 }}>{value}</ThemedText>
        {note ? <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>{note}</ThemedText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  hero: { paddingHorizontal: 20, paddingBottom: 56, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  bubble: { position: 'absolute', borderRadius: 999 },
  bubbleA: { width: 220, height: 220, top: -80, right: -70 },
  bubbleB: { width: 130, height: 130, bottom: -50, left: -40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  brandName: { fontSize: 18, lineHeight: 20, letterSpacing: -0.3 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 19 },
  name: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  iconButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, maxWidth: '100%' },
  chipText: { fontSize: 12, flexShrink: 1 },

  body: { paddingHorizontal: 16, marginTop: -36, gap: 14 },
  card: { borderWidth: 1, borderRadius: 24, padding: 18 },
  todayCard: { gap: 14, shadowColor: '#16162B', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 20, letterSpacing: -0.3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stats: { flexDirection: 'row', borderRadius: 18, paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  cta: { height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loading: { height: 120, alignItems: 'center', justifyContent: 'center' },
  notice: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  noticeIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { fontSize: 18, letterSpacing: -0.3, marginTop: 6 },
  grid: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, borderWidth: 1, borderRadius: 22, padding: 16, gap: 4 },
  actionIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },

  signOut: { height: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, paddingTop: 16, borderTopWidth: 1 },
  ugcBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 5 },
  ugcLogo: { width: '100%', height: '100%' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  infoIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rule: { height: 1 },
});
