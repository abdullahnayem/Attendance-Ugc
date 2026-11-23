import { useAuth, type AuthUser } from '@/context/providers/AuthProvider';

/**
 * Attendance is only for staff who have an employee record. The login response
 * (`POST /v1/auth/login`) returns `user.employeeId` as `number | null`.
 */
export const hasAttendanceAccess = (user: AuthUser | null | undefined): boolean =>
  user?.employeeId != null;

export const useAttendanceAccess = (): boolean => {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated && hasAttendanceAccess(user);
};
