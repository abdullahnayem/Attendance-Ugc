import * as SecureStore from 'expo-secure-store';

export type StoredCredentials = { loginName: string; password: string };

const KEY = 'loginCredentials';

/**
 * The sign-in details, kept in the platform keystore (Android Keystore / iOS Keychain) so the app
 * can renew its token silently. Removed by sign-out; the OS removes them when the app is uninstalled.
 */
export async function saveCredentials(credentials: StoredCredentials): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(credentials));
}

export async function readCredentials(): Promise<StoredCredentials | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCredentials>;
    return parsed.loginName && parsed.password
      ? { loginName: parsed.loginName, password: parsed.password }
      : null;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nothing stored, or the store is unavailable: either way there is nothing left to clear.
  }
}
