import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';

import { getDeviceId } from '@/utils/device-id';
import { primaryApi } from '@/utils/api';
import type {
  AttendanceHistoryResponse,
  AttendanceLocationMode,
  AttendancePunchPayload,
  AttendancePunchResult,
  AttendanceSessionStatus,
  AttendanceAllowedAction,
  AttendanceToday,
} from '@/types/attendance';

const ATTENDANCE_PREFIX = 'v1/attendance/me';

const valueOrNull = <T>(value: T | undefined | null): T | null => value ?? null;

const normalizeDayType = (value: unknown): AttendanceToday['dayType'] => {
  const dayType = String(value ?? 'UNSCHEDULED').toUpperCase();
  return dayType === 'WORKING' || dayType === 'WEEKLY_OFF' || dayType === 'HOLIDAY' ||
    dayType === 'LEAVE' || dayType === 'UNSCHEDULED'
    ? dayType
    : 'UNSCHEDULED';
};

const normalizeStatus = (value: unknown): AttendanceSessionStatus => {
  const status = String(value ?? 'SCHEDULED').toUpperCase();
  const normalized = status.replace(/([a-z])([A-Z])/g, '$1_$2');
  return ['SCHEDULED', 'CHECKED_IN', 'CHECKED_OUT', 'INCOMPLETE', 'ABSENT', 'PENDING_REVIEW', 'LOCKED']
    .includes(normalized)
    ? normalized as AttendanceSessionStatus
    : 'SCHEDULED';
};

const normalizeAction = (value: unknown): AttendanceAllowedAction => {
  const action = String(value ?? 'NONE').toUpperCase();
  if (action === 'CHECKIN') return 'CHECK_IN';
  if (action === 'CHECKOUT') return 'CHECK_OUT';
  return action === 'CHECK_IN' || action === 'CHECK_OUT' ? action : 'NONE';
};

const normalizeToday = (raw: any): AttendanceToday => {
  const source = raw?.data ?? raw;
  const locationMode = source?.locationMode ?? source?.policy?.locationMode;
  const requiresCurrentLocation = source?.requiresCurrentLocation ?? source?.policy?.requiresCurrentLocation;

  return {
    workDate: source?.workDate ?? '',
    timeZoneId: source?.timeZoneId ?? 'UTC',
    dayType: normalizeDayType(source?.dayType),
    schedule: source?.shiftName || source?.scheduledStartAtUtc || source?.scheduledEndAtUtc
      ? {
          shiftName: valueOrNull(source.shiftName),
          startAt: valueOrNull(source.scheduledStartAtUtc),
          endAt: valueOrNull(source.scheduledEndAtUtc),
        }
      : null,
    location: {
      mode: (String(locationMode ?? 'ANY').toUpperCase() as AttendanceLocationMode),
      requiresCurrentLocation: Boolean(requiresCurrentLocation),
      displayName: valueOrNull(source?.locationDisplayName),
    },
    session: source?.sessionStatus || source?.allowedAction
      ? {
          status: normalizeStatus(source.sessionStatus),
          allowedAction: normalizeAction(source.allowedAction),
          firstCheckInAt: valueOrNull(source.firstCheckIn),
          lastCheckOutAt: valueOrNull(source.lastCheckOut),
        }
      : null,
    summary: {
      lateMinutes: valueOrNull(source?.lateMinutes),
      earlyLeaveMinutes: valueOrNull(source?.earlyLeaveMinutes),
      netWorkedMinutes: valueOrNull(source?.workedMinutes),
      status: valueOrNull(source?.sessionStatus),
    },
    manual: Boolean(source?.manual),
  };
};

export const getAttendanceToday = async (): Promise<AttendanceToday> => {
  const response = await primaryApi.get(`${ATTENDANCE_PREFIX}/today`);
  return normalizeToday(response.data);
};

export const createAttendanceIdempotencyKey = (): string => Crypto.randomUUID();

export const punchAttendance = async (
  payload: AttendancePunchPayload,
): Promise<AttendancePunchResult> => {
  const response = await primaryApi.post(
    `${ATTENDANCE_PREFIX}/punch`,
    payload,
  );
  const source = response.data?.data ?? response.data;
  const normalized = normalizeToday(source?.today ?? source);

  return {
    ...normalized,
    accepted: Boolean(source?.accepted),
    locationValidation: valueOrNull(source?.rejectionReasonCode),
    message: valueOrNull(source?.message ?? source?.rejectionReasonCode),
  };
};

export const getAttendanceHistory = async (
  from: string,
  to: string,
  page = 1,
  pageSize = 20,
): Promise<AttendanceHistoryResponse> => {
  const response = await primaryApi.get(`${ATTENDANCE_PREFIX}/history`, {
    params: { from, to, page, pageSize },
  });
  const source = response.data?.data ?? response.data;
  const items = (source?.items ?? source?.records ?? []).map((item: any) => ({
    ...normalizeToday(item),
    id: item.workDate,
  }));

  return {
    items,
    page: source?.page ?? page,
    pageSize: source?.pageSize ?? pageSize,
    total: valueOrNull(source?.totalCount),
    hasNextPage: Boolean(source?.hasNextPage ?? items.length === pageSize),
    monthlySummary: null,
  };
};

/** Uploads the selfie and returns its server path (e.g. `/files/<id>.jpg`). */
export const uploadAttendancePhoto = async (uri: string): Promise<string> => {
  const form = new FormData();
  // React Native sends a file as an object with uri, name and type.
  form.append('file', { uri, name: 'attendance.jpg', type: 'image/jpeg' } as unknown as Blob);
  const response = await primaryApi.post('v1/file/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  });
  const path = response.data?.path;
  if (typeof path !== 'string' || !path) throw new Error('ATTENDANCE_PHOTO_UPLOAD_FAILED');
  return path;
};

export const buildPunchPayload = (
  idempotencyKey: string,
  location: AttendancePunchPayload['location'],
  photoPath: string,
): Promise<AttendancePunchPayload> => getDeviceId().then((deviceId) => ({
  idempotencyKey,
  clientCapturedAt: new Date().toISOString(),
  location,
  photoPath,
  deviceId,
  appVersion: Application.nativeApplicationVersion,
}));
