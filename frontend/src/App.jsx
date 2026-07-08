import React, { useState } from 'react';
import MobilePortal from './mobile/MobilePortal';
import AdminPortal from './admin/AdminPortal';
import NotificationLog from './components/NotificationLog';
import DeviceFrame from './components/DeviceFrame';

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const isMobileApp = 
    (queryParams.get('standalone') === 'true' || 
     window.innerWidth <= 768 || 
     (typeof window !== 'undefined' && window.Capacitor)) &&
    queryParams.get('view') !== 'admin';

  const [activePortal, setActivePortal] = useState(
    queryParams.get('view') === 'admin' ? 'admin' : (isMobileApp || queryParams.get('view') === 'mobile' ? 'mobile' : 'admin')
  );
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

  if (isMobileApp) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff' }}>
        <MobilePortal onNotification={showToast} />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      
      {/* Head Office Header */}
      <header className="global-header" style={{ justifyContent: 'space-between' }}>
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
          <h1>BISWAS DISTRIBUTION <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#90caf9', marginLeft: '6px' }}>Head Office Enterprise Portal</span></h1>
        </div>

        {queryParams.get('view') === 'mobile' && (
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
        )}
      </header>

      {/* Main Workspace Frame */}
      {activePortal === 'mobile' ? (
        <div className="simulator-container">
          <div className="simulator-workspace">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <DeviceFrame showNavbar={false}>
                <MobilePortal onNotification={showToast} />
              </DeviceFrame>
            </div>
          </div>
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
