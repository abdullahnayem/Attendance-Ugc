import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/app-themed-text';
import { ManropeFonts } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type LoginFormProps = {
  email: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleRememberMe: () => void;
  onLogin: () => void;
};

type Focus = 'email' | 'password' | null;

export function LoginForm({
  email,
  password,
  showPassword,
  rememberMe,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onToggleRememberMe,
  onLogin,
}: LoginFormProps) {
  const { colors } = useAppTheme();
  const [focus, setFocus] = useState<Focus>(null);

  const fieldStyle = (name: Exclude<Focus, null>) => [
    styles.field,
    {
      backgroundColor: colors.inputBackground,
      borderColor: focus === name ? colors.primary : colors.inputBorder,
    },
  ];
  const inputStyle = [styles.input, { color: colors.text, fontFamily: ManropeFonts.medium }];

  return (
    <View style={styles.form}>
      <View style={styles.group}>
      <ThemedText weight="semiBold" style={[styles.label, { color: colors.textSecondary }]}>
        Email or username
      </ThemedText>
      <View style={fieldStyle('email')}>
        <Ionicons
          name="mail-outline"
          size={20}
          color={focus === 'email' ? colors.primary : colors.textMuted}
        />
        <TextInput
          style={inputStyle}
          placeholder="name@company.com"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={onEmailChange}
          onFocus={() => setFocus('email')}
          onBlur={() => setFocus(null)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          returnKeyType="next"
          accessibilityLabel="Email or username"
        />
      </View>
      </View>

      <View style={styles.group}>
      <ThemedText weight="semiBold" style={[styles.label, { color: colors.textSecondary }]}>
        Password
      </ThemedText>
      <View style={fieldStyle('password')}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={focus === 'password' ? colors.primary : colors.textMuted}
        />
        <TextInput
          style={inputStyle}
          placeholder="Enter your password"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={onPasswordChange}
          onFocus={() => setFocus('password')}
          onBlur={() => setFocus(null)}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={onLogin}
          accessibilityLabel="Password"
        />
        <Pressable
          onPress={onTogglePassword}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      </View>
      </View>

      <Pressable
        onPress={onToggleRememberMe}
        style={styles.remember}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: rememberMe }}
      >
        <View
          style={[
            styles.box,
            {
              borderColor: rememberMe ? colors.primary : colors.border,
              backgroundColor: rememberMe ? colors.primary : 'transparent',
            },
          ]}
        >
          {rememberMe ? <Ionicons name="checkmark" size={14} color={colors.onPrimary} /> : null}
        </View>
        <ThemedText weight="medium" style={{ fontSize: 14, color: colors.textSecondary }}>
          Remember me
        </ThemedText>
      </Pressable>

      {error ? (
        <View
          style={[styles.error, { backgroundColor: colors.errorLight, borderColor: colors.errorBorder }]}
          accessibilityRole="alert"
        >
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <ThemedText weight="medium" style={[styles.errorText, { color: colors.errorText }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <Pressable
        onPress={onLogin}
        disabled={isLoading}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : pressed ? 0.88 : 1 },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <ThemedText weight="bold" style={{ color: colors.onPrimary, fontSize: 17 }}>
            Sign in
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  group: { gap: 8 },
  label: { fontSize: 13 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  input: { flex: 1, fontSize: 16, height: '100%' },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20 },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
