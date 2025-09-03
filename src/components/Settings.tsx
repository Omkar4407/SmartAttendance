import React, { useState } from 'react';
import { 
  Camera, 
  Clock, 
  Bell, 
  Shield, 
  Database, 
  Download,
  Upload,
  RefreshCw,
  Save
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    recognitionThreshold: 85,
    autoMarkDelay: 30,
    enableNotifications: true,
    enableLateMarking: true,
    lateThreshold: 15,
    enableAutoBackup: true,
    backupInterval: 24,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Simulate saving settings
    alert('Settings saved successfully!');
  };

  const handleExportData = () => {
    // Simulate data export
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "attendance_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Configure your attendance system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Face Recognition Settings */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Camera className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Face Recognition</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recognition Threshold ({settings.recognitionThreshold}%)
              </label>
              <input
                type="range"
                min="70"
                max="95"
                value={settings.recognitionThreshold}
                onChange={(e) => handleSettingChange('recognitionThreshold', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Less Strict</span>
                <span>More Strict</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-mark Prevention (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.autoMarkDelay}
                onChange={(e) => handleSettingChange('autoMarkDelay', parseInt(e.target.value))}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Prevents duplicate marking for the same person
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Settings */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Attendance Rules</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Late Marking</label>
                <p className="text-xs text-gray-500">Allow marking attendance after scheduled time</p>
              </div>
              <button
                onClick={() => handleSettingChange('enableLateMarking', !settings.enableLateMarking)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableLateMarking ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableLateMarking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.enableLateMarking && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Late Threshold (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.lateThreshold}
                  onChange={(e) => handleSettingChange('lateThreshold', parseInt(e.target.value))}
                  className="input"
                />
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Notifications</label>
                <p className="text-xs text-gray-500">Get notified when attendance is marked</p>
              </div>
              <button
                onClick={() => handleSettingChange('enableNotifications', !settings.enableNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableNotifications ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto Backup</label>
                <p className="text-xs text-gray-500">Automatically backup attendance data</p>
              </div>
              <button
                onClick={() => handleSettingChange('enableAutoBackup', !settings.enableAutoBackup)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableAutoBackup ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableAutoBackup ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.enableAutoBackup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Backup Interval (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.backupInterval}
                  onChange={(e) => handleSettingChange('backupInterval', parseInt(e.target.value))}
                  className="input"
                />
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button onClick={handleExportData} className="btn-secondary flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
              <button className="btn-secondary flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Camera className="w-6 h-6 text-success-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Camera System</p>
            <p className="text-xs text-success-600">Online</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Database className="w-6 h-6 text-success-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Database</p>
            <p className="text-xs text-success-600">Connected</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="w-6 h-6 text-success-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Recognition Engine</p>
            <p className="text-xs text-success-600">Active</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  );
};