import {
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeColors } from '@/constants/app-theme';
import { AuthProvider, useAuth } from '@/context/providers/AuthProvider';

SplashScreen.preventAutoHideAsync();

// Keeps navigation chrome (screen backdrop while transitioning, borders) on the app palette.
const navigationColors = (scheme: 'light' | 'dark') => ({
  primary: ThemeColors[scheme].primary,
  background: ThemeColors[scheme].background,
  card: ThemeColors[scheme].surface,
  text: ThemeColors[scheme].text,
  border: ThemeColors[scheme].border,
  notification: ThemeColors[scheme].badge,
});
const AppLightTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, ...navigationColors('light') } };
const AppDarkTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, ...navigationColors('dark') } };

function RootStack() {
  const { authInitialized, isAuthenticated } = useAuth();
  const [fontsLoaded] = useFonts({
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // The splash overlay stays up until the session and fonts are ready.
  if (!authInitialized || !fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="index" />
        <Stack.Screen name="attendance" />
        <Stack.Screen name="history" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationTheme = colorScheme === 'dark' ? AppDarkTheme : AppLightTheme;
  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootStack />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
