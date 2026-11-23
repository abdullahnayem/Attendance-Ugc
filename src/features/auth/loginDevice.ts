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
  try {
    // Loaded on demand, not at the top of the file: a build made before expo-network was added has
    // no native module for it, and a top-level import would crash the app at startup. Here the
    // failure is caught and the IP is simply left out.
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
  const [deviceId, ipAddress] = await Promise.all([readDeviceId(), readIpAddress()]);
  return { deviceId, ipAddress };
}
