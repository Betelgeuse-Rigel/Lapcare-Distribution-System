import React, { useState } from 'react';
import MobilePortal from './mobile/MobilePortal';
import AdminPortal from './admin/AdminPortal';
import NotificationLog from './components/NotificationLog';
import DeviceFrame from './components/DeviceFrame';

export default function App() {
  const [activePortal, setActivePortal] = useState('mobile'); // 'mobile' or 'admin'
  const [toasts, setToasts] = useState([]);

  // Trigger global toast alert
  const showToast = (type, message) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Automatically remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <div className="admin-shell">
      
      {/* Global Top Navbar */}
      <header className="global-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'white',
            color: 'var(--primary)',
            fontSize: '1.2rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            B
          </div>
          <h1>BISWAS DISTRIBUTION <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#90caf9', marginLeft: '6px' }}>Simulation Console</span></h1>
        </div>

        {/* Tabs to switch Workspace Views */}
        <div className="header-tabs">
          <button
            onClick={() => setActivePortal('mobile')}
            className={`header-tab ${activePortal === 'mobile' ? 'active' : ''}`}
          >
            📱 Mobile App Simulator
          </button>
          <button
            onClick={() => setActivePortal('admin')}
            className={`header-tab ${activePortal === 'admin' ? 'active' : ''}`}
          >
            🏢 Head Office Admin Panel
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      {activePortal === 'mobile' ? (
        <div className="simulator-container">
          
          {/* Main phone simulator block */}
          <div className="simulator-workspace">
            {/* Render Phone Simulator Shell */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <DeviceFrame showNavbar={false}>
                {/* Embedded Mobile React Portal */}
                <MobilePortal onNotification={showToast} />
              </DeviceFrame>
              <div style={{ color: '#64748b', fontSize: '0.7rem', display: 'flex', gap: '8px' }}>
                <span>📱 Android 14 Simulator</span>
                <span>•</span>
                <span>Width: 360px</span>
              </div>
            </div>
          </div>

          {/* Right Live SMS/FCM logs console */}
          <NotificationLog />

        </div>
      ) : (
        /* Fullscreen Desktop Admin Portal */
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AdminPortal onNotification={showToast} />
        </div>
      )}

      {/* Floating Global Toasts List */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="toast"
            style={{
              borderLeftColor: toast.type === 'success' ? 'var(--success)' : 
                               (toast.type === 'warning' ? 'var(--warning)' : 
                               (toast.type === 'error' ? 'var(--danger)' : 'var(--primary)'))
            }}
          >
            <div style={{ flex: 1 }}>
              <strong style={{ 
                fontSize: '0.75rem', 
                display: 'block', 
                color: toast.type === 'success' ? 'var(--success)' : 
                       (toast.type === 'warning' ? 'var(--warning)' : 
                       (toast.type === 'error' ? 'var(--danger)' : 'var(--text-main)'))
              }}>
                {toast.type.toUpperCase()}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {toast.message}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
