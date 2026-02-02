import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Logo animation
    setTimeout(() => setShowLogo(true), 200);
    
    // Text animation
    setTimeout(() => setShowText(true), 800);

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease'
    }}>
      {/* Logo */}
      <div style={{
        opacity: showLogo ? 1 : 0,
        transform: showLogo ? 'scale(1)' : 'scale(0.8)',
        transition: 'all 0.6s ease',
        marginBottom: '2rem'
      }}>
        <div style={{
          width: 'clamp(80px, 20vw, 120px)',
          height: 'clamp(80px, 20vw, 120px)',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(3rem, 10vw, 4rem)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: showLogo ? 'pulse 2s ease-in-out infinite' : 'none'
        }}>
          🎓
        </div>
      </div>

      {/* Text */}
      <div style={{
        opacity: showText ? 1 : 0,
        transform: showText ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease 0.3s',
        textAlign: 'center',
        marginBottom: '3rem',
        padding: '0 1rem'
      }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
          fontWeight: '900',
          color: '#fff',
          marginBottom: '0.5rem',
          textShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          FaizUpyZone
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: 'rgba(255,255,255,0.9)',
          fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
          fontWeight: '600'
        }}>
          <Sparkles size={18} />
          <span>Premium Study Materials</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '80%',
        maxWidth: '300px',
        height: '4px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: '#fff',
          borderRadius: '10px',
          transition: 'width 0.3s ease',
          boxShadow: '0 0 10px rgba(255,255,255,0.5)'
        }} />
      </div>

      {/* Loading Text */}
      <p style={{
        marginTop: '1rem',
        color: 'rgba(255,255,255,0.8)',
        fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
        fontWeight: '600'
      }}>
        Loading... {progress}%
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 25px 70px rgba(0,0,0,0.4);
          }
        }
      `}</style>
    </div>
  );
}

export default SplashScreen;