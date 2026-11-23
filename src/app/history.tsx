import { AttendanceGuard } from '@/features/attendance/components/AttendanceGuard';
import AttendanceHistoryScreen from '@/features/attendance/screens/AttendanceHistoryScreen';

export default function History() {
  return (
    <AttendanceGuard>
      <AttendanceHistoryScreen />
    </AttendanceGuard>
  );
}
