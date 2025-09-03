import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { FaceRecognition } from './components/FaceRecognition';
import { UserManagement } from './components/UserManagement';
import { Settings } from './components/Settings';
import { AttendanceLog } from './components/AttendanceLog';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'recognition':
        return <FaceRecognition />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <Settings />;
      case 'log':
        return <AttendanceLog />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;