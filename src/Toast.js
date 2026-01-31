import React, { useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, Zap } from 'lucide-react';

let showToastFunction = null;

export const showToast = (message, type = 'success') => {
  if (showToastFunction) {
    showToastFunction(message, type);
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    showToastFunction = (message, type) => {
      const id = Date.now();
      const newToast = { id, message, type };
      setToasts(prev => [...prev, newToast]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    return () => {
      showToastFunction = null;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '400px'
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}
    </div>
  );
}

function Toast({ message, type, onClose }) {
  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={24} />,
          gradient: 'linear-gradient(135deg, #10b981, #059669)',
          shadow: 'rgba(16, 185, 129, 0.5)'
        };
      case 'error':
        return {
          icon: <AlertCircle size={24} />,
          gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
          shadow: 'rgba(239, 68, 68, 0.5)'
        };
      case 'info':
        return {
          icon: <Info size={24} />,
          gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          shadow: 'rgba(59, 130, 246, 0.5)'
        };
      case 'loading':
        return {
          icon: <Zap size={24} />,
          gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          shadow: 'rgba(139, 92, 246, 0.5)'
        };
      default:
        return {
          icon: <CheckCircle size={24} />,
          gradient: 'linear-gradient(135deg, #10b981, #059669)',
          shadow: 'rgba(16, 185, 129, 0.5)'
        };
    }
  };

  const config = getConfig();

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '2px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '16px',
      padding: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: `0 10px 40px ${config.shadow}`,
      animation: 'slideIn 0.3s ease-out',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        background: config.gradient,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
        animation: type === 'loading' ? 'pulse 2s ease-in-out infinite' : 'none'
      }}>
        {config.icon}
      </div>

      <div style={{ flex: 1, color: '#fff', fontSize: '1rem', fontWeight: '600', lineHeight: 1.5 }}>
        {message}
      </div>

      <button onClick={onClose} style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '8px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#fff',
        flexShrink: 0
      }}>
        <X size={18} />
      </button>

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '4px',
        background: config.gradient,
        animation: 'shrink 4s linear',
        width: '100%'
      }} />

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}