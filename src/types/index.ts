export interface AttendanceRecord {
  id: string;
  name: string;
  timestamp: string;
  status: 'present' | 'late' | 'absent';
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'student' | 'employee' | 'admin';
  totalAttendance: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
}

export interface AttendanceStats {
  totalUsers: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  attendanceRate: number;
}

export interface CameraState {
  isActive: boolean;
  isRecognizing: boolean;
  lastRecognized?: string;
  confidence?: number;
}