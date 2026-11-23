import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeColors } from '@/constants/app-theme';

export function useAppTheme() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return {
    colorScheme,
    isDark: colorScheme === 'dark',
    colors: ThemeColors[colorScheme],
  };
}
