import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, CheckCircle, AlertCircle, Users, Wifi, WifiOff } from 'lucide-react';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

interface RecognitionState {
  isActive: boolean;
  isRecognizing: boolean;
  lastRecognized?: any;
  confidence?: number;
  message?: string;
}

export const FaceRecognition: React.FC = () => {
  const [recognitionState, setRecognitionState] = useState<RecognitionState>({
    isActive: false,
    isRecognizing: false,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [recentlyMarked, setRecentlyMarked] = useState<Set<number>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:8080');

  useEffect(() => {
    loadUsers();
  }, []);

  // Listen for WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'face_detected') {
        setRecognitionState(prev => ({
          ...prev,
          isRecognizing: false,
          lastRecognized: lastMessage.data.user,
          confidence: lastMessage.data.confidence,
        }));
      } else if (lastMessage.type === 'attendance_marked') {
        setRecognitionState(prev => ({
          ...prev,
          message: lastMessage.data.message,
        }));
        
        // Add to recently marked
        setRecentlyMarked(prev => new Set([...prev, lastMessage.data.user.id]));
        
        // Remove from recently marked after 30 seconds
        setTimeout(() => {
          setRecentlyMarked(prev => {
            const newSet = new Set(prev);
            newSet.delete(lastMessage.data.user.id);
            return newSet;
          });
        }, 30000);

        // Clear message after 5 seconds
        setTimeout(() => {
          setRecognitionState(prev => ({ ...prev, message: undefined }));
        }, 5000);
      }
    }
  }, [lastMessage]);

  const loadUsers = async () => {
    try {
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setRecognitionState(prev => ({ ...prev, isActive: true }));
        
        // Start face recognition on the backend
        await apiService.startRecognition();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setRecognitionState({
      isActive: false,
      isRecognizing: false,
    });
  };

  return (
    <div className="space-y-8">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg ${isConnected ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'}`}>
        <div className="flex items-center space-x-2">
          {isConnected ? <Wifi className="w-4 h-4 text-success-600" /> : <WifiOff className="w-4 h-4 text-error-600" />}
          <span className="text-sm font-medium">
            {isConnected ? 'Connected to recognition server' : 'Disconnected from server'}
          </span>
        </div>
      </div>

      {/* Success Message */}
      {recognitionState.message && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4 animate-slide-up">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <span className="font-medium text-success-800">{recognitionState.message}</span>
          </div>
        </div>
      )}

      {/* Camera Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Live Face Recognition</h2>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              recognitionState.isActive ? 'bg-success-500 animate-pulse' : 'bg-gray-300'
            }`} />
            <span className="text-sm text-gray-600">
              {recognitionState.isActive ? 'Camera Active' : 'Camera Inactive'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Feed */}
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {recognitionState.isActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Camera feed will appear here</p>
                  </div>
                </div>
              )}
              
              {/* Recognition Overlay */}
              {recognitionState.isRecognizing && (
                <div className="absolute inset-0 bg-primary-600 bg-opacity-20 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Recognizing...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Face Detection Box */}
              {recognitionState.lastRecognized && recognitionState.isActive && (
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-success-600" />
                      <span className="text-sm font-medium capitalize">{recognitionState.lastRecognized.name}</span>
                      <span className="text-xs text-gray-500">
                        {recognitionState.confidence?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              {!recognitionState.isActive ? (
                <button onClick={startCamera} className="btn-primary flex-1" disabled={!isConnected}>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </button>
              ) : (
                <button onClick={stopCamera} className="btn-secondary flex-1">
                  <CameraOff className="w-4 h-4 mr-2" />
                  Stop Camera
                </button>
              )}
            </div>
          </div>

          {/* Recognition Status */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recognition Status</h3>
              
              {recognitionState.lastRecognized ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {recognitionState.lastRecognized.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {recognitionState.lastRecognized.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Confidence: {recognitionState.confidence?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {recentlyMarked.has(recognitionState.lastRecognized.id) && (
                    <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success-600" />
                        <span className="text-sm font-medium text-success-800">
                          Attendance marked successfully!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                  <p className="text-gray-500">No face detected</p>
                </div>
              )}
            </div>

            {/* Recently Marked */}
            {recentlyMarked.size > 0 && (
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-3">Recently Marked</h4>
                <div className="space-y-2">
                  {Array.from(recentlyMarked).map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <div key={userId} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-sm text-gray-700 capitalize">{user.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  These users won't be marked again for 30 seconds
                </p>
              </div>
            )}

            {/* Registered Users */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Registered Users ({users.length})</h4>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {users.map(user => (
                  <div key={user.id} className="flex items-center space-x-2 text-xs text-gray-600 bg-white rounded px-3 py-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <span className="capitalize flex-1">{user.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'employee' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Start Camera" to begin face recognition</li>
              <li>• The system will automatically detect and recognize faces</li>
              <li>• Attendance is marked once per person per session (30-second cooldown)</li>
              <li>• Recognition confidence is displayed for each detection</li>
              <li>• Real-time updates are shown via WebSocket connection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};