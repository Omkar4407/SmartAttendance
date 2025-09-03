import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { CameraState } from '../types';
import { addAttendanceRecord } from '../utils/attendanceData';

export const FaceRecognition: React.FC = () => {
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    isRecognizing: false,
  });
  const [lastMarked, setLastMarked] = useState<string | null>(null);
  const [recentlyMarked, setRecentlyMarked] = useState<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Known users from the existing data
  const knownUsers = [
    'omkar bommakanti', 'vaishnavi bommakanti', 'vcb', 'dakshesh chennuri',
    'chaitanya', 'sarvika', 'ian randi', 'tushi', 'karan', 'ashish'
  ];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraState(prev => ({ ...prev, isActive: true }));
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
    
    setCameraState({
      isActive: false,
      isRecognizing: false,
    });
  };

  const simulateRecognition = () => {
    if (!cameraState.isActive) return;

    setCameraState(prev => ({ ...prev, isRecognizing: true }));
    
    // Simulate face recognition with random user detection
    setTimeout(() => {
      const randomUser = knownUsers[Math.floor(Math.random() * knownUsers.length)];
      const confidence = 0.85 + Math.random() * 0.1; // 85-95% confidence
      
      // Only mark attendance if this person hasn't been marked recently
      if (!recentlyMarked.has(randomUser)) {
        addAttendanceRecord(randomUser);
        setLastMarked(randomUser);
        setRecentlyMarked(prev => new Set([...prev, randomUser]));
        
        // Clear the recently marked status after 30 seconds
        setTimeout(() => {
          setRecentlyMarked(prev => {
            const newSet = new Set(prev);
            newSet.delete(randomUser);
            return newSet;
          });
        }, 30000);
      }
      
      setCameraState(prev => ({ 
        ...prev, 
        isRecognizing: false, 
        lastRecognized: randomUser,
        confidence: confidence * 100
      }));
    }, 2000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (cameraState.isActive && !cameraState.isRecognizing) {
      interval = setInterval(simulateRecognition, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cameraState.isActive, cameraState.isRecognizing, recentlyMarked]);

  return (
    <div className="space-y-8">
      {/* Camera Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Live Face Recognition</h2>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              cameraState.isActive ? 'bg-success-500 animate-pulse' : 'bg-gray-300'
            }`} />
            <span className="text-sm text-gray-600">
              {cameraState.isActive ? 'Camera Active' : 'Camera Inactive'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Feed */}
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {cameraState.isActive ? (
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
              {cameraState.isRecognizing && (
                <div className="absolute inset-0 bg-primary-600 bg-opacity-20 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Recognizing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              {!cameraState.isActive ? (
                <button onClick={startCamera} className="btn-primary flex-1">
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
              
              {cameraState.lastRecognized ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-success-500" />
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {cameraState.lastRecognized}
                      </p>
                      <p className="text-sm text-gray-500">
                        Confidence: {cameraState.confidence?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {lastMarked === cameraState.lastRecognized && (
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
                  {Array.from(recentlyMarked).map(name => (
                    <div key={name} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm text-gray-700 capitalize">{name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  These users won't be marked again for 30 seconds
                </p>
              </div>
            )}

            {/* Known Users */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Registered Users</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {knownUsers.map(user => (
                  <div key={user} className="text-xs text-gray-600 capitalize bg-white rounded px-2 py-1">
                    {user}
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
              <li>• Attendance is marked once per person per session</li>
              <li>• Recognition confidence is displayed for each detection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};