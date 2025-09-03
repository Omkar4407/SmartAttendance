import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Search, Clock, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

interface AttendanceRecord {
  id: number;
  name: string;
  role: string;
  timestamp: string;
  status: string;
  confidence?: number;
}

export const AttendanceLog: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const { lastMessage } = useWebSocket('ws://localhost:8080');

  useEffect(() => {
    loadRecords();
  }, [dateFilter]);

  // Listen for real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'attendance_marked') {
      loadRecords(); // Refresh records when new attendance is marked
    }
  }, [lastMessage]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (dateFilter === 'today') {
        filters.date = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        filters.date = yesterday.toISOString().split('T')[0];
      }

      const attendanceData = await apiService.getAttendance(filters);
      setRecords(attendanceData);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRelativeDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const exportToCsv = () => {
    const csvContent = [
      ['Name', 'Date', 'Time', 'Status', 'Confidence'],
      ...filteredRecords.map(record => [
        record.name,
        getRelativeDate(record.timestamp),
        new Date(record.timestamp).toLocaleTimeString(),
        record.status,
        record.confidence ? `${record.confidence.toFixed(1)}%` : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Log</h2>
          <p className="text-gray-600">View and manage attendance records</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={loadRecords} className="btn-secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button onClick={exportToCsv} className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input sm:w-48"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
              <span className="text-gray-600">Loading records...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr 
                    key={record.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {record.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 capitalize">{record.name}</span>
                          <p className="text-xs text-gray-500">{record.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {getRelativeDate(record.timestamp)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' ? 'bg-success-100 text-success-800' :
                        record.status === 'late' ? 'bg-warning-100 text-warning-800' :
                        'bg-error-100 text-error-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {record.confidence ? `${record.confidence.toFixed(1)}%` : 'Manual'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'No attendance records match your filters'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Total Records</h4>
            <p className="text-2xl font-bold text-primary-600">{filteredRecords.length}</p>
          </div>
          <Filter className="w-8 h-8 text-primary-400" />
        </div>
      </div>
    </div>
  );
};