import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * The Nexus brand mark. Same drawing as assets/images/nexus-mark.svg, as a component because
 * React Native cannot show an .svg file through <Image>.
 */
export function NexusMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityRole="image" accessibilityLabel="Nexus">
      <Defs>
        <LinearGradient id="nexusBg" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#3368A0" />
          <Stop offset="1" stopColor="#66A3BF" />
        </LinearGradient>
        <LinearGradient id="nexusShine" x1="8" y1="6" x2="28" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#C8DFDB" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#C8DFDB" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="40" height="40" rx="11" fill="url(#nexusBg)" />
      <Rect width="40" height="40" rx="11" fill="url(#nexusShine)" />
      <Circle cx="20" cy="20" r="3.25" fill="#F2EFE7" />
      <Circle cx="11.5" cy="13" r="2.35" fill="#C8DFDB" />
      <Circle cx="28.5" cy="13" r="2.35" fill="#C8DFDB" />
      <Circle cx="11.5" cy="27" r="2.35" fill="#C8DFDB" />
      <Circle cx="28.5" cy="27" r="2.35" fill="#C8DFDB" />
      <G stroke="#F2EFE7" strokeWidth={1.6} strokeLinecap="round" opacity={0.92}>
        <Line x1="20" y1="20" x2="11.5" y2="13" />
        <Line x1="20" y1="20" x2="28.5" y2="13" />
        <Line x1="20" y1="20" x2="11.5" y2="27" />
        <Line x1="20" y1="20" x2="28.5" y2="27" />
      </G>
      <Path d="M13.5 27V13.5L20 20.2L26.5 13.5V27" fill="none" stroke="#FFFFFF" strokeWidth={2.35} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
