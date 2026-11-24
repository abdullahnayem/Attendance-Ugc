import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';

import { type AuthApiResponse, useAuth } from '@/context/providers/AuthProvider';
import { primaryApi } from '@/utils/api';

import { getLoginDeviceInfo } from '../loginDevice';

/**
 * Login name saved by "Remember me". Only the email/user name, never the password.
 * Kept separate from the keys signOut clears, so it survives a logout.
 */
const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

function loginErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Can't reach the server. Check your connection and that EXPO_PUBLIC_API_URL points to a reachable API.";
    }

    const data = error.response.data as { detail?: string; message?: string } | undefined;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (error.response.status === 401) return 'Wrong username or password.';
  }

  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Try again.';
}

export function useLogin() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill the saved login name. Skipped if the user already started typing.
  useEffect(() => {
    AsyncStorage.getItem(REMEMBERED_EMAIL_KEY)
      .then((saved) => {
        if (!saved) return;
        setEmail((current) => current || saved);
        setRememberMe(true);
      })
      .catch(() => undefined);
  }, []);

  const handleLogin = useCallback(async () => {
    if (isLoading) return;

    const loginName = email.trim();
    if (!loginName || !password) {
      setError(
        !loginName && !password
          ? 'Enter your email or username and your password.'
          : !loginName
            ? 'Enter your email or username.'
            : 'Enter your password.',
      );
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Phone id + IP travel with the credentials; getLoginDeviceInfo never throws.
      const deviceInfo = await getLoginDeviceInfo();
      const response = await primaryApi.post('/v1/auth/login', {
        loginName,
        email: loginName, // Nexus reads `email`
        password,
        ...deviceInfo,
      });
      const data = response.data as AuthApiResponse;

      if (response.status !== 200) {
        setError(data?.message || 'Sign in failed. Check your details and try again.');
        return;
      }

      await signIn(data, { loginName, password });

      // Only after a successful login. A storage failure must never block the login itself.
      try {
        if (rememberMe) await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, loginName);
        else await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
      } catch {}
      // The route guard in the root layout now swaps login for the attendance screen.
    } catch (e) {
      setError(loginErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [email, password, rememberMe, isLoading, signIn]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    error,
    clearError: () => setError(null),
    handleLogin,
  };
}
