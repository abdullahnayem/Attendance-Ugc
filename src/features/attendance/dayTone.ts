import type { ThemeColorPalette } from '@/constants/app-theme';
import type { AttendanceHistoryItem } from '@/types/attendance';

/** How a day went: used by the calendar and the day list so they always agree. */
export type DayTone = 'good' | 'warn' | 'bad' | 'off' | 'idle';

export const toneOf = (item: AttendanceHistoryItem): DayTone => {
  if (item.dayType !== 'WORKING') return 'off';
  if (item.session?.status === 'ABSENT') return 'bad';
  if (!item.session?.firstCheckInAt) return 'idle';
  const late = item.summary?.lateMinutes ?? 0;
  const early = item.summary?.earlyLeaveMinutes ?? 0;
  return late > 0 || early > 0 ? 'warn' : 'good';
};

export type ToneStyle = {
  background: string;
  border: string;
  text: string;
  borderStyle: 'solid' | 'dashed';
};

/**
 * Calendar look per tone. All three states are light tints: on time is green, late or early is
 * amber, absent is red. The colour tells them apart; none is solid.
 */
export const toneStyle = (tone: DayTone, colors: ThemeColorPalette): ToneStyle => {
  switch (tone) {
    case 'good':
      return { background: colors.successLight, border: colors.successBorder, text: colors.successText, borderStyle: 'solid' };
    case 'warn':
      return { background: colors.secondaryLight, border: colors.secondaryBorder, text: colors.secondaryText, borderStyle: 'solid' };
    case 'bad':
      // A step lighter than errorBorder, with a softer outline, so absent days read as red without shouting.
      return { background: '#F7D3D9', border: '#E8909E', text: colors.errorText, borderStyle: 'solid' };
    case 'off':
      return { background: 'transparent', border: 'transparent', text: colors.textMuted, borderStyle: 'solid' };
    default:
      return { background: 'transparent', border: colors.border, text: colors.textMuted, borderStyle: 'dashed' };
  }
};
