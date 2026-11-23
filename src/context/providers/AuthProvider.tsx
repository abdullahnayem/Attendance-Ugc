import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { setUnauthorizedHandler } from '@/utils/api';
import { clearCredentials, saveCredentials, type StoredCredentials } from '@/utils/credentials';

export type AuthUser = {
  id?: string | number;
  name?: string;
  email?: string;
  /** From POST /v1/auth/login. null/undefined = not an employee, so no attendance. */
  employeeId?: number | null;
  [key: string]: any;
};

export type AuthApiResponse = {
  status?: number;
  message?: string;
  data?: {
    access_token?: string;
    refresh_token?: string;
    [key: string]: any;
  } | null;
  user?: AuthUser | null;
  token?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  authInitialized: boolean;
  isAuthenticated: boolean;
  /** `credentials` are kept in the keystore so the session can renew itself silently. */
  signIn: (res?: AuthApiResponse, credentials?: StoredCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // signOut's own calls can answer 401 too; those must not start a second sign-out.
  const signingOut = useRef(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [authValue, userValue] = await Promise.all([
          AsyncStorage.getItem('isAuthenticated'),
          AsyncStorage.getItem('appUser'),
        ]);
        if (!mounted) return;
        setIsAuthenticated(authValue === 'true');
        setUser(userValue ? JSON.parse(userValue) : null);
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        if (mounted) setAuthInitialized(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (res?: AuthApiResponse, credentials?: StoredCredentials) => {
    if (!res) throw new Error('Empty auth response');

    if (!(res.token || res.user)) {
      throw new Error(res.message || 'Invalid credentials');
    }

    const nextUser = res.user ?? res.data?.user;
    if (nextUser) {
      await AsyncStorage.setItem('appUser', JSON.stringify(nextUser));
      setUser(nextUser);
    }

    // This backend's /v1/auth/login returns the JWT as top-level `token`, not `data.access_token`.
    const access = res.token || res.data?.access_token;
    const refresh = res.data?.refresh_token;
    if (access) await SecureStore.setItemAsync('accessToken', access);
    if (refresh) await SecureStore.setItemAsync('refreshToken', refresh);
    if (credentials) await saveCredentials(credentials);

    await AsyncStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const signOut = async () => {
    signingOut.current = true;
    try {
      await AsyncStorage.setItem('isAuthenticated', 'false');
      await AsyncStorage.removeItem('appUser');
      // First, so the saved password can never outlive a sign-out even if a later step fails.
      await clearCredentials();
      for (const key of ['accessToken', 'refreshToken']) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // ignore
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      signingOut.current = false;
    }
  };

  // Any 401 from the API ends the session. The route guard then shows the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (signingOut.current) return;
      void signOut().then(() => {
        Alert.alert('Session expired', 'Your session has ended. Sign in again to continue.');
      });
    });
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAccessToken = async () => {
    try {
      return await SecureStore.getItemAsync('accessToken');
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, authInitialized, isAuthenticated, signIn, signOut, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}
