import { AttendanceGuard } from '@/features/attendance/components/AttendanceGuard';
import AttendanceTodayScreen from '@/features/attendance/screens/AttendanceTodayScreen';

export default function Home() {
  return (
    <AttendanceGuard>
      <AttendanceTodayScreen />
    </AttendanceGuard>
  );
}
