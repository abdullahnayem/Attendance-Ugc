import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { getDeviceId } from '@/utils/device-id';

export type LoginDeviceInfo = {
  /** Stable id of this phone (`android:<id>` / `ios:<id>` / `install:<uuid>`). */
  deviceId: string | null;
  /** IP of the phone's active network interface (LAN / carrier address, not the public IP). */
  ipAddress: string | null;
};

const readIpAddress = async (): Promise<string | null> => {
  // On web expo-network asks a third-party service (ipify) for the public IP; skip it there.
  if (Platform.OS === 'web') return null;
  // A build made before expo-network was added has no native module for it. Importing the package
  // anyway throws (and Expo logs it as an error), so ask for the native module first, quietly, and
  // leave the IP out when it is missing. Rebuild the app (`npx expo run:android`) to get it.
  if (!requireOptionalNativeModule('ExpoNetwork')) return null;
  try {
    const Network = await import('expo-network');
    const ip = await Network.getIpAddressAsync();
    return ip && ip !== '0.0.0.0' ? ip : null;
  } catch {
    return null;
  }
};

const readDeviceId = async (): Promise<string | null> => {
  try {
    return await getDeviceId();
  } catch {
    return null;
  }
};

/**
 * What the login request sends along with the credentials. Never throws: a value that
 * cannot be read is null, and the login must still go through.
 */
export async function getLoginDeviceInfo(): Promise<LoginDeviceInfo> {
  // The IP is optional: if the native call stalls, log in without it instead of waiting.
  const ipWithin = (ms: number) =>
    Promise.race([readIpAddress(), new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
  const [deviceId, ipAddress] = await Promise.all([readDeviceId(), ipWithin(3000)]);
  return { deviceId, ipAddress };
}
