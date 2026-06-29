import React, { useEffect, useState } from 'react';
import { MessageSquare, Bell, Cpu, Trash2, Copy, Check } from 'lucide-react';
import { API_BASE } from '../config';

export default function NotificationLog() {
  const [logs, setLogs] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Poll logs from the backend every 1.5 seconds
  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logs`);
      if (res.ok) {
        const data = await res.json();
        // Sort logs: newest first
        setLogs(data.reverse());
      }
    } catch (err) {
      // Server might be loading, ignore
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
    try {
      await fetch(`${API_BASE}/api/logs/clear`, { method: 'POST' });

      setLogs([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to extract numeric OTP from message if present
  const extractOtp = (message) => {
    const match = message.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="console-sidebar">
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: '#0f172a',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
            animation: 'pulse 2s infinite'
          }}></div>
          <h3 style={{ color: '#f8fafc', fontSize: '0.875rem', fontWeight: 600 }}>
            Live Log Console
          </h3>
        </div>
        <button
          onClick={handleClearLogs}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'var(--transition-fast)'
          }}
          title="Clear Logs"
          onMouseEnter={(e) => e.target.style.color = '#ef4444'}
          onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Info Warning */}
      <div style={{
        padding: '8px 12px',
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        fontSize: '0.75rem',
        color: '#94a3b8',
        lineHeight: 1.4
      }}>
        ℹ️ <strong>Simulating MSG91 SMS & Firebase Push:</strong> Login OTP codes and alerts trigger logs here in real-time.
      </div>

      {/* Logs Scroll List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {logs.length === 0 ? (
          <div style={{
            color: '#64748b',
            fontSize: '0.8rem',
            textAlign: 'center',
            marginTop: '2rem',
            fontStyle: 'italic'
          }}>
            Waiting for activity... Try sending an OTP or checkout to see real-time updates.
          </div>
        ) : (
          logs.map((log) => {
            const isSms = log.type === 'SMS';
            const isFcm = log.type === 'FCM';
            const otp = isSms ? extractOtp(log.message) : null;

            return (
              <div
                key={log.id}
                style={{
                  background: '#0f172a',
                  border: '1px solid',
                  borderColor: isSms ? '#b45309' : (isFcm ? '#047857' : '#475569'),
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  color: '#e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {/* Meta details */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #1e293b',
                  paddingBottom: '4px',
                  color: isSms ? '#fbbf24' : (isFcm ? '#34d399' : '#94a3b8')
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    {isSms ? <MessageSquare size={12} /> : (isFcm ? <Bell size={12} /> : <Cpu size={12} />)}
                    <span>{log.type}</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Target */}
                {log.target && (
                  <div style={{ color: '#94a3b8', fontWeight: 500 }}>
                    Target: <span style={{ color: '#f1f5f9' }}>{log.target}</span>
                  </div>
                )}

                {/* Message Body */}
                <div style={{ lineHeight: 1.4, wordBreak: 'break-word', color: '#cbd5e1' }}>
                  {log.message}
                </div>

                {/* Helper Copy Box for OTP */}
                {isSms && otp && (
                  <div style={{
                    marginTop: '4px',
                    background: '#1e293b',
                    padding: '6px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      OTP Code: {otp}
                    </span>
                    <button
                      onClick={() => copyToClipboard(otp, log.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedId === log.id ? '#10b981' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '0.65rem'
                      }}
                    >
                      {copiedId === log.id ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedId === log.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
