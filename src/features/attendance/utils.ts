import type { AxiosError } from 'axios';

import type { AttendanceToday } from '@/types/attendance';

/**
 * The API sends UTC instants. Some payloads omit the `Z`, which JS would read as
 * device-local time and skip the conversion, so treat zone-less values as UTC.
 */
export const parseUtc = (value: string): Date => {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const looksLikeTime = value.includes('T') || value.includes(' ');
  return new Date(!hasZone && looksLikeTime ? `${value.replace(' ', 'T')}Z` : value);
};

export const formatAttendanceTime = (
  value: string | null | undefined,
  timeZoneId: string,
): string => {
  if (!value) return '—';
  const date = parseUtc(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatWorkDate = (workDate: string): string => {
  if (!workDate) return 'Today';
  const date = new Date(`${workDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return workDate;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(date);
};

export const formatMinutes = (minutes: number | null | undefined): string => {
  if (minutes == null) return '—';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
};

export const attendanceStatusLabel = (today: AttendanceToday): string => {
  if (today.dayType !== 'WORKING') {
    return today.dayType.replace('_', ' ');
  }
  return (today.session?.status ?? 'UNSCHEDULED').replace('_', ' ');
};

/** `CHECKED IN` -> `Checked in`. */
export const sentenceCase = (value: string): string => {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const attendanceErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const localMessages: Record<string, string> = {
      LOCATION_PERMISSION_DENIED: 'Location permission is required for attendance under your current policy.',
      LOCATION_SERVICE_DISABLED: 'Turn on device location services and try again.',
      ATTENDANCE_DEVICE_ID_UNAVAILABLE: 'This device could not be identified. Please restart the app and try again.',
    };
    if (localMessages[error.message]) return localMessages[error.message];
  }

  const axiosError = error as AxiosError<{
    code?: string;
    message?: string | string[];
    error?: string;
  }>;
  const responseData = axiosError.response?.data;
  const code = responseData?.code;
  const message = Array.isArray(responseData?.message)
    ? responseData.message.join(', ')
    : responseData?.message;

  const messages: Record<string, string> = {
    ATTENDANCE_UNAUTHENTICATED: 'Your session has expired. Please sign in again.',
    ATTENDANCE_EMPLOYEE_NOT_FOUND: 'Your employee account could not be found. Contact HR.',
    ATTENDANCE_CONFIGURATION_INVALID: 'Attendance is not configured for your account. Contact HR.',
    ATTENDANCE_INVALID_PAGING: 'The attendance history request is invalid. Please try again.',
    ATTENDANCE_INVALID_IDEMPOTENCY_KEY: 'This attendance attempt could not be identified. Please try again.',
    ATTENDANCE_INVALID_LOCATION: 'The current location could not be validated. Please try again.',
    NO_ACTIVE_SCHEDULE: 'No attendance schedule is assigned for today. Contact HR if this looks incorrect.',
    LOCATION_PERMISSION_DENIED: 'Location permission is required for attendance under your current policy.',
    LOCATION_SERVICE_DISABLED: 'Turn on device location services and try again.',
    LOW_ACCURACY: 'Your location is not accurate enough yet. Move to an open area and retry.',
    OUTSIDE_GEOFENCE: 'You are outside the permitted attendance area.',
    ALREADY_CHECKED_IN: 'Your Check-in is already recorded. Refreshing your attendance.',
    ALREADY_CHECKED_OUT: 'Your Check-out is already recorded.',
    PUNCH_WINDOW_CLOSED: 'The attendance action is no longer available. Contact HR if you need a correction.',
    SESSION_LOCKED: 'This attendance session is finalized and cannot be changed from the app.',
  };

  if (code === 'ATTENDANCE_CONFIGURATION_INVALID' && message) return message;
  if (code && messages[code]) return messages[code];
  if (message) return message;
  if (!axiosError.response) return 'Attendance requires an internet connection. No punch was queued offline.';

  console.error('[attendance] API request failed', {
    baseURL: axiosError.config?.baseURL,
    url: axiosError.config?.url,
    method: axiosError.config?.method,
    status: axiosError.response.status,
    code,
    message,
    error: responseData?.error,
  });

  if (responseData?.error) return responseData.error;
  if (axiosError.response.status === 404) {
    return 'Attendance API is not available on the configured server. Please contact support.';
  }
  return 'Attendance could not be processed. Please retry later or contact support.';
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-11-01` -> `01 Nov 26` (no Intl, so the output is identical on every device). */
export const formatTableDate = (workDate: string): string => {
  const [year, month, day] = workDate.split('-');
  const monthName = MONTHS[Number(month) - 1];
  if (!year || !monthName || !day) return workDate;
  return `${day.padStart(2, '0')} ${monthName} ${year.slice(-2)}`;
};

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** `2026-11-01` -> `November 2026`. */
export const formatMonthYear = (workDate: string): string => {
  const [year, month] = workDate.split('-');
  const name = MONTHS_FULL[Number(month) - 1];
  return name && year ? `${name} ${year}` : workDate;
};

/** `2026-11-01` -> `1` (day of the month, no padding). */
export const dayOfMonth = (workDate: string): string => String(Number(workDate.split('-')[2]) || '');

/** Weekday for a `YYYY-MM-DD` work date, e.g. `Sun`. */
export const formatWeekday = (workDate: string): string => {
  const date = new Date(`${workDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()];
};

/** Clock time only (`09:05 AM`) in the attendance timezone. */
export const formatClockTime = (
  value: string | null | undefined,
  timeZoneId: string,
): string => {
  if (!value) return '—';
  const date = parseUtc(value);
  if (Number.isNaN(date.getTime())) return '—';

  // Punch times arrive as UTC instants; show them in the device's local time.
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/** Local calendar date -> `YYYY-MM-DD` (never shifted by UTC). */
export const toIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const fromIsoDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export type RangePreset = 'last7' | 'thisMonth' | 'lastMonth';

export const presetRange = (preset: RangePreset): { from: string; to: string } => {
  const now = new Date();
  if (preset === 'last7') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { from: toIsoDate(start), to: toIsoDate(now) };
  }
  if (preset === 'lastMonth') {
    return {
      from: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  return {
    from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

export const dayTypeLabel = (dayType: AttendanceToday['dayType']): string => {
  switch (dayType) {
    case 'WEEKLY_OFF': return 'Weekly off';
    case 'HOLIDAY': return 'Holiday';
    case 'LEAVE': return 'On leave';
    case 'UNSCHEDULED': return 'No schedule';
    default: return 'Working day';
  }
};

/** Elapsed milliseconds -> `HHh:MMm` (e.g. 39 minutes -> `00h:39m`). */
export const formatElapsed = (milliseconds: number): string => {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}h:${minutes}m`;
};

/**
 * Time worked today: counts up from the first check-in until a check-out exists,
 * then freezes at the last check-out (even if the server still allows another
 * check-out swipe; that swipe returns a newer `lastCheckOutAt`, which moves the
 * frozen value). `—` before the first check-in.
 */
export const workedElapsedLabel = (today: AttendanceToday, nowMs: number): string => {
  const inAt = today.session?.firstCheckInAt;
  if (!inAt) return '—';
  const start = parseUtc(inAt).getTime();
  if (Number.isNaN(start)) return '—';

  const outAt = today.session?.lastCheckOutAt;
  if (outAt) {
    const end = parseUtc(outAt).getTime();
    if (!Number.isNaN(end)) return formatElapsed(end - start);
  }
  return formatElapsed(nowMs - start);
};
