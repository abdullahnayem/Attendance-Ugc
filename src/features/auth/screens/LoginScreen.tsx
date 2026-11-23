import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/app-themed-text';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { LoginHeader } from '@/features/auth/components/LoginHeader';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useAppTheme } from '@/hooks/use-app-theme';

export function LoginScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const login = useLogin();

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* The hero behind the status bar is the brand colour, so the icons must be light. */}
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <LoginHeader />

        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + 28 },
          ]}
        >
          <ThemedText weight="extraBold" style={[styles.title, { color: colors.text }]}>
            Sign in
          </ThemedText>
          <ThemedText weight="regular" style={[styles.subtitle, { color: colors.textSecondary }]}>
            Use your work account to punch in and out.
          </ThemedText>

          <LoginForm
            email={login.email}
            password={login.password}
            showPassword={login.showPassword}
            rememberMe={login.rememberMe}
            isLoading={login.isLoading}
            error={login.error}
            onEmailChange={(value) => {
              login.clearError();
              login.setEmail(value);
            }}
            onPasswordChange={(value) => {
              login.clearError();
              login.setPassword(value);
            }}
            onTogglePassword={() => login.setShowPassword((v) => !v)}
            onToggleRememberMe={() => login.setRememberMe((v) => !v)}
            onLogin={login.handleLogin}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1 },
  sheet: {
    flexGrow: 1,
    marginTop: -36,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 4, marginBottom: 24 },
});
