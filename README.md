# AttendanceTracker Pro

A modern, comprehensive attendance tracking system with real-time face recognition capabilities.

## Features

- **Real-time Face Recognition**: Advanced face detection and recognition with confidence scoring
- **Modern Dashboard**: Interactive charts and statistics for attendance tracking
- **User Management**: Complete user registration and management system
- **Live Updates**: WebSocket-powered real-time notifications
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Data Export**: Export attendance data to CSV format
- **Duplicate Prevention**: Smart system prevents duplicate attendance marking

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **Real-time**: WebSocket for live updates
- **Charts**: Recharts for beautiful data visualization
- **Face Recognition**: Simulated recognition engine (easily replaceable with Python OpenCV)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the application**:
   ```bash
   npm start
   ```

This single command starts both the backend server and frontend development server.

## API Endpoints

- `GET /api/stats` - Dashboard statistics
- `GET /api/users` - User management
- `GET /api/attendance` - Attendance records
- `POST /api/users` - Create new user
- `POST /api/attendance/mark` - Manual attendance marking
- `POST /api/recognition/start` - Start face recognition

## WebSocket Events

- `face_detected` - When a face is recognized
- `attendance_marked` - When attendance is successfully marked

## Database Schema

The system uses SQLite with the following tables:
- `users` - User information and roles
- `attendance` - Attendance records with timestamps

## Development

- Frontend runs on `http://localhost:5173`
- Backend API runs on `http://localhost:3001`
- WebSocket server runs on `ws://localhost:8080`

## Production Deployment

For production, replace the simulated face recognition with actual Python OpenCV implementation:

1. Set up Python Flask/FastAPI backend
2. Install OpenCV and face_recognition libraries
3. Replace the recognition simulation with actual camera processing
4. Update API endpoints to match the Node.js interface

The frontend is designed to work seamlessly with any backend that implements the same API contract.