import React, { useState, useEffect } from 'react';

// Dynamic Island Toast Component
const DynamicIslandToast = ({ message, type, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsExpanded(true), 50);
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 400);
    }, 3500);
    return () => clearTimeout(exitTimer);
  }, [onClose]);

  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10b981', icon: '✓' },
    error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444', icon: '✕' },
    info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6', icon: 'ℹ' },
    warning: { bg: 'rgba(245, 158, 11, 0.95)', border: '#f59e0b', icon: '⚠' }
  };

  const config = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: `translateX(-50%) scale(${isExpanded && !isExiting ? 1 : 0.8})`,
      background: config.bg,
      backdropFilter: 'blur(20px) saturate(180%)',
      border: `2px solid ${config.border}`,
      borderRadius: '50px',
      padding: isExpanded ? '1rem 2rem' : '0.5rem 1rem',
      minWidth: isExpanded ? '300px' : '120px',
      maxWidth: '90vw',
      boxShadow: `0 20px 60px ${config.border}40, 0 0 0 1px rgba(255,255,255,0.1) inset`,
      zIndex: 10000,
      opacity: isExiting ? 0 : 1,
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      color: '#fff',
      fontWeight: '600',
      fontSize: '0.95rem',
      cursor: 'pointer'
    }}
    onClick={() => {
      setIsExiting(true);
      setTimeout(onClose, 400);
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '900'
      }}>{config.icon}</div>
      <div style={{ flex: 1, opacity: isExpanded ? 1 : 0, transition: 'opacity 0.3s' }}>
        {message}
      </div>
    </div>
  );
};

// Toast Container Component
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.showToast = (message, type = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
    };
    return () => { delete window.showToast; };
  }, []);

  return (
    <>
      {toasts.map(toast => (
        <DynamicIslandToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}
    </>
  );
};

export default ToastContainer;