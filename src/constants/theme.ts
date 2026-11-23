/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { ThemeColors } from '@/constants/app-theme';

// Legacy template colours, now derived from the app palette so nothing drifts from the design system.
export const Colors = {
  light: {
    text: ThemeColors.light.text,
    background: ThemeColors.light.background,
    backgroundElement: ThemeColors.light.surfaceSecondary,
    backgroundSelected: ThemeColors.light.border,
    textSecondary: ThemeColors.light.textSecondary,
    primary: ThemeColors.light.primary,
  },
  dark: {
    text: ThemeColors.dark.text,
    background: ThemeColors.dark.background,
    backgroundElement: ThemeColors.dark.surfaceSecondary,
    backgroundSelected: ThemeColors.dark.border,
    textSecondary: ThemeColors.dark.textSecondary,
    primary: ThemeColors.dark.primary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
