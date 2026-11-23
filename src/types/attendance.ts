export type AttendanceDayType =
  | 'WORKING'
  | 'WEEKLY_OFF'
  | 'HOLIDAY'
  | 'LEAVE'
  | 'UNSCHEDULED';

export type AttendanceSessionStatus =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'INCOMPLETE'
  | 'ABSENT'
  | 'PENDING_REVIEW'
  | 'LOCKED';

export type AttendanceAllowedAction = 'CHECK_IN' | 'CHECK_OUT' | 'NONE';
export type AttendanceLocationMode = 'ANY' | 'REQUIRED' | 'ALLOWED_LIST';

export type AttendanceSchedule = {
  shiftId?: string | number;
  shiftName?: string | null;
  scheduleType?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  requiredWorkMinutes?: number | null;
};

export type AttendanceLocation = {
  mode: AttendanceLocationMode;
  requiresCurrentLocation: boolean;
  displayName?: string | null;
};

export type AttendanceSummary = {
  lateMinutes?: number | null;
  earlyLeaveMinutes?: number | null;
  netWorkedMinutes?: number | null;
  status?: string | null;
};

export type AttendanceSession = {
  id?: string;
  status: AttendanceSessionStatus;
  allowedAction: AttendanceAllowedAction;
  firstCheckInAt?: string | null;
  lastCheckOutAt?: string | null;
};

export type AttendanceToday = {
  workDate: string;
  timeZoneId: string;
  dayType: AttendanceDayType;
  schedule?: AttendanceSchedule | null;
  location: AttendanceLocation;
  session?: AttendanceSession | null;
  summary?: AttendanceSummary | null;
};

export type AttendancePunchResult = AttendanceToday & {
  accepted: boolean;
  serverConfirmedAt?: string | null;
  locationValidation?: string | null;
  message?: string | null;
};

export type AttendanceHistoryItem = AttendanceToday & {
  id: string;
};

export type AttendanceHistoryResponse = {
  items: AttendanceHistoryItem[];
  page: number;
  pageSize: number;
  total?: number | null;
  hasNextPage: boolean;
  monthlySummary?: AttendanceSummary | null;
};

export type AttendancePunchPayload = {
  idempotencyKey: string;
  clientCapturedAt: string;
  location: {
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
  } | null;
  deviceId: string;
  appVersion: string | null;
};
