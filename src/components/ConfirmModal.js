import React from 'react';
import { AlertCircle, CheckCircle, Trash2, X } from 'lucide-react';

function ConfirmModal({ 
  show, 
  onConfirm, 
  onCancel, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // 'danger', 'warning', 'info'
}) {
  if (!show) return null;

  const getIcon = () => {
    switch(type) {
      case 'danger':
        return <Trash2 size={48} color="#ef4444" />;
      case 'warning':
        return <AlertCircle size={48} color="#f59e0b" />;
      case 'info':
        return <CheckCircle size={48} color="#6366f1" />;
      default:
        return <AlertCircle size={48} color="#6366f1" />;
    }
  };

  const getColor = () => {
    switch(type) {
      case 'danger':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#6366f1';
      default:
        return '#6366f1';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease'
    }}
    onClick={onCancel}
    >
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease',
        position: 'relative'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'rgba(148,163,184,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(148,163,184,0.2)';
            e.currentTarget.style.transform = 'rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(148,163,184,0.1)';
            e.currentTarget.style.transform = 'rotate(0deg)';
          }}
        >
          <X size={20} color="#64748b" />
        </button>

        <div style={{
          background: `${getColor()}15`,
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          animation: 'pulse 2s ease infinite'
        }}>
          {getIcon()}
        </div>

        <h2 style={{
          fontSize: '2rem',
          fontWeight: '900',
          marginBottom: '1rem',
          color: '#1e293b'
        }}>
          {title}
        </h2>

        <p style={{
          fontSize: '1.1rem',
          color: '#64748b',
          marginBottom: '2.5rem',
          lineHeight: '1.6'
        }}>
          {message}
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              border: '2px solid #e2e8f0',
              background: '#fff',
              color: '#64748b',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              border: 'none',
              background: type === 'danger' 
                ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                : type === 'warning'
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '120px',
              boxShadow: `0 4px 15px ${getColor()}40`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${getColor()}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 15px ${getColor()}40`;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

export default ConfirmModal;