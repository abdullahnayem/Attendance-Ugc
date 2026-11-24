import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { getLoginDeviceInfo } from '@/features/auth/loginDevice';
import { readCredentials } from '@/utils/credentials';

// The Android emulator reaches the host machine at 10.0.2.2, not localhost. A real phone has no 10.0.2.2: over USB,
// `adb reverse tcp:5080 tcp:5080` makes the phone's localhost reach the PC, so the URL is left alone there.
const resolveApiBaseUrl = (rawUrl: string | undefined): string => {
  if (!rawUrl) return '';

  try {
    const url = new URL(rawUrl);

    if (Platform.OS === 'android' && !Device.isDevice) {
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        url.hostname = '10.0.2.2';
      }
    } else if (url.hostname === '10.0.2.2') {
      url.hostname = 'localhost';
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
};

export const primaryApi: AxiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL),
});

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync('accessToken');
}

// Login, forgot and reset password run without a session: they must not carry a stale token,
// and a 401 from login only means a wrong password.
const isAuthEndpoint = (url: string | undefined): boolean => {
  const path = url ?? '';
  return (
    path.includes('/v1/auth/login') ||
    path.includes('/v1/auth/forgot-password') ||
    path.includes('/v1/auth/reset-password')
  );
};

// Attaches the signed-in user's token, when one is stored, to every request.
primaryApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    if (!isAuthEndpoint(config.url)) {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };
type SilentSignIn = { outcome: 'renewed' } | { outcome: 'rejected' } | { outcome: 'unreachable'; error: unknown };

/**
 * The server's token lasts two days. Instead of asking the person to sign in again, sign in with the
 * details saved at login. `rejected` means the server refused them (password changed, account
 * disabled); anything else (offline, server down) says nothing about the account, so it is not a
 * reason to sign out.
 */
async function signInSilently(): Promise<SilentSignIn> {
  const credentials = await readCredentials();
  if (!credentials) return { outcome: 'rejected' };
  try {
    // Same phone id the manual login sends; the server keeps only the first one it sees.
    const response = await primaryApi.post('/v1/auth/login', {
      ...credentials,
      email: credentials.loginName, // Nexus reads `email`
      ...(await getLoginDeviceInfo()),
    });
    const body = response.data as { token?: string; data?: { access_token?: string } } | undefined;
    const token = body?.token ?? body?.data?.access_token;
    if (!token) return { outcome: 'rejected' };
    await SecureStore.setItemAsync('accessToken', token);
    return { outcome: 'renewed' };
  } catch (error) {
    const status = (error as AxiosError).response?.status;
    return status === 400 || status === 401 || status === 403
      ? { outcome: 'rejected' }
      : { outcome: 'unreachable', error };
  }
}

// Many requests can answer 401 together; they all wait for one silent sign-in.
let silentSignIn: Promise<SilentSignIn> | null = null;
const renewSession = (): Promise<SilentSignIn> => {
  if (!silentSignIn) silentSignIn = signInSilently().finally(() => { silentSignIn = null; });
  return silentSignIn;
};

// Set by AuthProvider, which owns the sign-out.
let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

primaryApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (error.response?.status !== 401 || !config || isAuthEndpoint(config.url)) {
      return Promise.reject(error);
    }

    const sent = config.headers?.Authorization;
    const token = await getAccessToken().catch(() => null);

    if (!config._retried) {
      config._retried = true;
      // A request that was in flight while the token was renewed just goes again with the new one
      // (the request interceptor attaches whatever is stored now).
      if (token && sent !== `Bearer ${token}`) return primaryApi(config);

      const result = await renewSession();
      if (result.outcome === 'renewed') return primaryApi(config);
      // Offline or the server is down: keep the person signed in. Surface the connection error, not
      // the 401, so the screen says what is actually wrong.
      if (result.outcome === 'unreachable') return Promise.reject(result.error);
    }

    // The server refused the saved details as well, so the session is really over. Only when the
    // rejected token is still the stored one: a request that was already in flight when the user
    // signed in again must not sign them out.
    const current = await getAccessToken().catch(() => null);
    if (current && sent === `Bearer ${current}`) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);
