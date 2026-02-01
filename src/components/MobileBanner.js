import React, { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';

function MobileBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if mobile and not dismissed before
    const isMobile = window.innerWidth <= 768;
    const wasDismissed = localStorage.getItem('mobileBannerDismissed');
    
    if (isMobile && !wasDismissed) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('mobileBannerDismissed', 'true');
  };

  if (!showBanner || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #6366f1, #ec4899)',
      padding: '1.5rem',
      zIndex: 9999,
      boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
      animation: 'slideUp 0.5s ease'
    }}>
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <X size={20} color="#fff" />
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '16px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Monitor size={32} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            💡 Best Experience Tip!
          </div>
          <div style={{
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.5
          }}>
            For the best experience, turn on <strong>Desktop Site</strong> in your browser settings
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default MobileBanner;