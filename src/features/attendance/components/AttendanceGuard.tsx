import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/app-themed-text';
import { useAuth } from '@/context/providers/AuthProvider';
import { useAttendanceAccess } from '@/features/attendance/access';
import { useAppTheme } from '@/hooks/use-app-theme';

/**
 * Renders the attendance UI only when `user.employeeId != null`. A signed-in account without an
 * employee record sees an explanation and a way out, and no attendance API call is made.
 */
export function AttendanceGuard({ children }: { children: ReactNode }) {
  const { authInitialized, signOut, user } = useAuth();
  const allowed = useAttendanceAccess();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  if (!authInitialized) return null;
  if (allowed) return <>{children}</>;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.body}>
        <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
        </View>
        <ThemedText weight="extraBold" style={[styles.title, { color: colors.text }]}>
          No employee record
        </ThemedText>
        <ThemedText weight="regular" style={[styles.copy, { color: colors.textSecondary }]}>
          {user?.name ? `${user.name}'s account` : 'This account'} isn't linked to an employee, so
          attendance isn't available. Ask your administrator to link it, then sign in again.
        </ThemedText>
      </View>
      <Pressable
        onPress={() => void signOut()}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <ThemedText weight="bold" style={{ color: colors.white, fontSize: 16 }}>
          Sign out
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', gap: 12 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  copy: { fontSize: 16, lineHeight: 24, maxWidth: 340 },
  button: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
