import { AttendanceRecord, User, AttendanceStats } from '../types';
import { format, isToday, parseISO } from 'date-fns';

// Parse the existing attendance.csv data
const attendanceData: AttendanceRecord[] = [
  { id: '1', name: 'omkar bommakanti', timestamp: '2025-05-24T23:20:00', status: 'present' },
  { id: '2', name: 'vaishnavi bommakanti', timestamp: '2025-05-24T23:23:00', status: 'present' },
  { id: '3', name: 'vcb', timestamp: '2025-05-24T23:24:00', status: 'present' },
  { id: '4', name: 'dakshesh chennuri', timestamp: '2025-06-06T20:39:00', status: 'present' },
  { id: '5', name: 'chaitanya', timestamp: '2025-06-06T20:41:00', status: 'present' },
  { id: '6', name: 'sarvika', timestamp: '2025-06-11T11:45:00', status: 'present' },
  { id: '7', name: 'ian randi', timestamp: '2025-06-11T12:23:00', status: 'present' },
  { id: '8', name: 'tushi', timestamp: '2025-06-11T12:24:00', status: 'present' },
  { id: '9', name: 'karan', timestamp: '2025-06-11T13:30:00', status: 'late' },
  { id: '10', name: 'ashish', timestamp: '2025-07-15T14:57:00', status: 'present' },
];

export const getAttendanceRecords = (): AttendanceRecord[] => {
  return attendanceData.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const getTodayAttendance = (): AttendanceRecord[] => {
  return attendanceData.filter(record => 
    isToday(parseISO(record.timestamp))
  );
};

export const getUsers = (): User[] => {
  const userMap = new Map<string, User>();
  
  attendanceData.forEach(record => {
    if (!userMap.has(record.name)) {
      userMap.set(record.name, {
        id: record.name.replace(/\s+/g, '-'),
        name: record.name,
        role: 'student',
        totalAttendance: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
      });
    }
    
    const user = userMap.get(record.name)!;
    user.totalAttendance++;
    
    if (record.status === 'present') {
      user.presentDays++;
    } else if (record.status === 'late') {
      user.lateDays++;
    } else {
      user.absentDays++;
    }
  });
  
  return Array.from(userMap.values());
};

export const getAttendanceStats = (): AttendanceStats => {
  const todayRecords = getTodayAttendance();
  const users = getUsers();
  
  const presentToday = todayRecords.filter(r => r.status === 'present').length;
  const lateToday = todayRecords.filter(r => r.status === 'late').length;
  const absentToday = users.length - todayRecords.length;
  
  return {
    totalUsers: users.length,
    presentToday,
    lateToday,
    absentToday,
    attendanceRate: users.length > 0 ? (presentToday / users.length) * 100 : 0,
  };
};

export const addAttendanceRecord = (name: string): AttendanceRecord => {
  const newRecord: AttendanceRecord = {
    id: Date.now().toString(),
    name: name.toLowerCase(),
    timestamp: new Date().toISOString(),
    status: 'present',
  };
  
  attendanceData.push(newRecord);
  return newRecord;
};