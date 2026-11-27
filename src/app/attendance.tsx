import { AttendanceGuard } from '@/features/attendance/components/AttendanceGuard';
import AttendanceTodayScreen from '@/features/attendance/screens/AttendanceTodayScreen';

export default function Attendance() {
  return (
    <AttendanceGuard>
      <AttendanceTodayScreen />
    </AttendanceGuard>
  );
}
