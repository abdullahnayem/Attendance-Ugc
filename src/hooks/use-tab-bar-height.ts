import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom space the attendance screens keep clear. This app has no tab bar, so it is just the
 * home-indicator inset plus breathing room; the name is kept so the screens copy over unchanged.
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 8) + 16;
}
