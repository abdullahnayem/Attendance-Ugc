import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Kept outside the keys signOut clears: the same phone must keep the same id for the next
// person who signs in on it.
const INSTALL_ID_KEY = 'attendance.installId';

/** The OS's own id for this phone, or null when it has none to give. */
async function readOsDeviceId(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      const id = Application.getAndroidId();
      return id ? `android:${id}` : null;
    }
    if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync();
      return id ? `ios:${id}` : null;
    }
  } catch {
    // Fall back to the install id.
  }
  return null;
}

/** A random id made once and kept, for when the OS gives none. */
async function readInstallId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (stored) return `install:${stored}`;
    const id = Crypto.randomUUID();
    await AsyncStorage.setItem(INSTALL_ID_KEY, id);
    return `install:${id}`;
  } catch {
    return `install:${Crypto.randomUUID()}`;
  }
}

let cached: Promise<string> | null = null;

/** Stable id of this phone, sent with every punch. Read once per app start. */
export function getDeviceId(): Promise<string> {
  if (!cached) {
    cached = readOsDeviceId().then((id) => id ?? readInstallId());
  }
  return cached;
}
