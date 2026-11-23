import { StyleSheet, Text, type TextProps } from 'react-native';

import { ManropeFonts } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  weight?: 'extraLight' | 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  weight = 'regular',
  ...rest
}: ThemedTextProps) {
  const { colors, isDark } = useAppTheme();
  const color = (isDark ? darkColor : lightColor) ?? (type === 'link' ? colors.primaryText : colors.text);

  return (
    <Text
      style={[
        { color, fontFamily: ManropeFonts[weight] },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontSize: 16, lineHeight: 24 },
  defaultSemiBold: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 32, lineHeight: 32 },
  subtitle: { fontSize: 20 },
  link: { lineHeight: 30, fontSize: 16 },
});
