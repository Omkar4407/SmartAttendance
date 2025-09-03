import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserCheck, Clock, UserX, TrendingUp, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

interface Stats {
  totalUsers: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  attendanceRate: number;
}

interface WeeklyData {
  day: string;
  present: number;
  late: number;
  absent: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    attendanceRate: 0,
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:8080');

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, weeklyDataResponse, attendanceData] = await Promise.all([
        apiService.getStats(),
        apiService.getWeeklyData(),
        apiService.getAttendance({ date: new Date().toISOString().split('T')[0] })
      ]);

      setStats(statsData);
      setWeeklyData(weeklyDataResponse);
      setRecentActivity(attendanceData.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'attendance_marked') {
      loadData(); // Refresh data when attendance is marked
    }
  }, [lastMessage]);

  const pieData = [
    { name: 'Present', value: stats.presentToday, color: '#22c55e' },
    { name: 'Late', value: stats.lateToday, color: '#f59e0b' },
    { name: 'Absent', value: stats.absentToday, color: '#ef4444' },
  ];

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-primary-500',
      change: '+2 this week',
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: UserCheck,
      color: 'bg-success-500',
      change: `${stats.attendanceRate.toFixed(1)}% rate`,
    },
    {
      title: 'Late Today',
      value: stats.lateToday,
      icon: Clock,
      color: 'bg-warning-500',
      change: '-1 from yesterday',
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      icon: UserX,
      color: 'bg-error-500',
      change: 'Same as yesterday',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg ${isConnected ? 'bg-success-50 border border-success-200' : 'bg-warning-50 border border-warning-200'}`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-warning-500'}`} />
          <span className="text-sm font-medium">
            {isConnected ? 'Connected to real-time updates' : 'Connecting to server...'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Attendance Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Attendance</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="present" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
              <Bar dataKey="late" stackId="a" fill="#f59e0b" />
              <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Status Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Today's Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-6 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((record, index) => (
            <div key={record.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  record.status === 'present' ? 'bg-success-500' :
                  record.status === 'late' ? 'bg-warning-500' : 'bg-error-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900 capitalize">{record.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                record.status === 'present' ? 'bg-success-100 text-success-800' :
                record.status === 'late' ? 'bg-warning-100 text-warning-800' : 'bg-error-100 text-error-800'
              }`}>
                {record.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};