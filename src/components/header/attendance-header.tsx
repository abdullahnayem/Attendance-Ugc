import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/app-themed-text';
import { useAuth } from '@/context/providers/AuthProvider';
import { useAppTheme } from '@/hooks/use-app-theme';

type AttendanceHeaderProps = {
  title: string;
};

const greeting = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export function AttendanceHeader({ title }: AttendanceHeaderProps) {
  const { colors } = useAppTheme();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const firstName = user?.name?.trim().split(/\s+/)[0];

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to punch.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.titles}>
        <ThemedText weight="extraBold" style={[styles.title, { color: colors.text }]}>
          {title}
        </ThemedText>
        <ThemedText weight="medium" style={[styles.subtitle, { color: colors.textSecondary }]}>
          {firstName ? `${greeting(new Date())}, ${firstName}` : greeting(new Date())}
        </ThemedText>
      </View>
      <Pressable
        onPress={confirmSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        hitSlop={8}
        style={({ pressed }) => [
          styles.signOut,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  titles: { flex: 1, gap: 2 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },
  signOut: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
