/**
 * Attendance app palette: "Indigo Ink".
 *
 * One calm, deep indigo carries every action (the hero card, buttons, links, active states).
 * Neutrals are soft violet-tinted greys so surfaces feel cohesive with the brand colour.
 * Amber is the single warm accent (check out, late). Green / amber / red / blue are reserved
 * for status. Every screen reads these tokens through useAppTheme(); never hardcode a colour.
 */

export type ThemeColorPalette = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  borderLight: string;
  divider: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  icon: string;
  white: string;
  black: string;

  tabInactive: string;
  headerBackground: string;
  headerBorder: string;
  card: string;

  inputBackground: string;
  inputBorder: string;
  inputFocus: string;

  drawerItemBackground: string;
  drawerItemActive: string;

  switchTrackOff: string;
  switchTrackOn: string;
  switchThumb: string;

  overlay: string;

  /** Text and shapes drawn on top of a primary (brand) surface such as the hero card. */
  onPrimary: string;
  onPrimaryMuted: string;
  onPrimarySubtle: string;
  /** Solid swipe-to-punch tracks. Deep enough for white text at about 5:1. */
  trackCheckIn: string;
  trackCheckOut: string;
  /** Splash screen backdrop. Mirrors app.json, which cannot read tokens. */
  splash: string;

  primary: string;
  primaryLight: string;
  primaryLighter: string;
  primaryDark: string;
  primaryBorder: string;
  primaryText: string;

  secondary: string;
  secondaryLight: string;
  secondaryLighter: string;
  secondaryDark: string;
  secondaryBorder: string;
  secondaryText: string;

  success: string;
  successLight: string;
  successLighter: string;
  successBorder: string;
  successText: string;

  warning: string;
  warningLight: string;
  warningText: string;

  error: string;
  /** Text and icons drawn on a solid `error` fill (an absent day). */
  onError: string;
  errorLight: string;
  errorBorder: string;
  errorText: string;

  star: string;
  placeholder: string;
  badge: string;
  info: string;
  infoLight: string;
  infoText: string;
};

export const ThemeColors: Record<'light' | 'dark', ThemeColorPalette> = {
  light: {
    background: '#F6F6FB',
    surface: '#FFFFFF',
    surfaceSecondary: '#EFEFF8',
    border: '#E1E1EE',
    borderLight: '#EBEBF4',
    divider: '#EBEBF4',
    text: '#16162B',
    textSecondary: '#4F4F70',
    textMuted: '#6C6C8C',
    icon: '#4F4F70',
    white: '#FFFFFF',
    black: '#000000',

    tabInactive: '#6C6C8C',
    headerBackground: '#FFFFFF',
    headerBorder: '#EBEBF4',
    card: '#FFFFFF',

    inputBackground: '#F6F6FB',
    inputBorder: '#E1E1EE',
    inputFocus: '#4F46B5',

    drawerItemBackground: '#FFFFFF',
    drawerItemActive: '#ECEBFA',

    switchTrackOff: '#E1E1EE',
    switchTrackOn: '#4F46B5',
    switchThumb: '#FFFFFF',

    overlay: 'rgba(16, 14, 43, 0.5)',

    onPrimary: '#FFFFFF',
    onPrimaryMuted: 'rgba(255,255,255,0.78)',
    onPrimarySubtle: 'rgba(255,255,255,0.16)',
    trackCheckIn: '#0F7A55',
    trackCheckOut: '#9A5A0B',
    splash: '#4F46B5',

    primary: '#4F46B5',
    primaryLight: '#ECEBFA',
    primaryLighter: '#F5F5FD',
    primaryDark: '#3C3590',
    primaryBorder: '#D2D0F0',
    primaryText: '#3C3590',

    secondary: '#D98E2B',
    secondaryLight: '#FBF0DC',
    secondaryLighter: '#FFF8EC',
    secondaryDark: '#A8650F',
    secondaryBorder: '#F1D6A4',
    secondaryText: '#7A4A08',

    success: '#17855F',
    successLight: '#DEF4EA',
    successLighter: '#EEF9F4',
    successBorder: '#A9DEC8',
    successText: '#0F6648',

    warning: '#D18A12',
    warningLight: '#FBEFD3',
    warningText: '#7A4A08',

    error: '#D13B4F',
    onError: '#FFFFFF',
    errorLight: '#FCE9EC',
    errorBorder: '#F2BAC3',
    errorText: '#A3182D',

    star: '#E5A823',
    placeholder: '#9A9AB6',
    badge: '#D13B4F',
    info: '#2E6FD6',
    infoLight: '#E4EEFB',
    infoText: '#1B4FA0',
  },
  dark: {
    background: '#0C0C1B',
    surface: '#15152A',
    surfaceSecondary: '#1E1E3A',
    border: '#2D2D4E',
    borderLight: '#222241',
    divider: '#222241',
    text: '#EEEEFA',
    textSecondary: '#B0B0D0',
    textMuted: '#8686A8',
    icon: '#B0B0D0',
    white: '#FFFFFF',
    black: '#000000',

    tabInactive: '#8686A8',
    headerBackground: '#101024',
    headerBorder: '#222241',
    card: '#15152A',

    inputBackground: '#101024',
    inputBorder: '#2D2D4E',
    inputFocus: '#9A93F2',

    drawerItemBackground: '#15152A',
    drawerItemActive: '#232349',

    switchTrackOff: '#2D2D4E',
    switchTrackOn: '#6C63E0',
    switchThumb: '#FFFFFF',

    overlay: 'rgba(0, 0, 0, 0.65)',

    onPrimary: '#FFFFFF',
    onPrimaryMuted: 'rgba(255,255,255,0.78)',
    onPrimarySubtle: 'rgba(255,255,255,0.16)',
    trackCheckIn: '#0F7A55',
    trackCheckOut: '#9A5A0B',
    splash: '#4F46B5',

    primary: '#6C63E0',
    primaryLight: '#232349',
    primaryLighter: '#1A1A38',
    primaryDark: '#9A93F2',
    primaryBorder: '#3A3680',
    primaryText: '#B5B0FA',

    secondary: '#E3A040',
    secondaryLight: '#33260F',
    secondaryLighter: '#271D0C',
    secondaryDark: '#F0B65E',
    secondaryBorder: '#654612',
    secondaryText: '#F3C985',

    success: '#34C096',
    successLight: '#0F2E27',
    successLighter: '#0C241F',
    successBorder: '#1D5A47',
    successText: '#74E0BD',

    warning: '#E3A040',
    warningLight: '#33260F',
    warningText: '#F3C985',

    error: '#F0687C',
    onError: '#2A0A10',
    errorLight: '#3A1520',
    errorBorder: '#6B2634',
    errorText: '#F79EAB',

    star: '#E5A823',
    placeholder: '#60608A',
    badge: '#F0687C',
    info: '#6AA0F2',
    infoLight: '#13284B',
    infoText: '#A2C6F8',
  },
};

export const ManropeFonts = {
  extraLight: 'Manrope_200ExtraLight',
  light: 'Manrope_300Light',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
} as const;
