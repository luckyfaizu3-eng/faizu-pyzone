import React from 'react';
import { useTheme } from '../App';

const AIChatBot = ({ setCurrentPage, currentPage }) => {
  const { isDark } = useTheme();

  if (currentPage !== 'home') return null;

  return (
    <>
      <style>{`
        @keyframes levitate {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes glowRing {
          0%,100% { box-shadow: 0 0 0 0px rgba(236,72,153,0.3), 0 8px 30px rgba(99,102,241,0.4); }
          50%      { box-shadow: 0 0 0 10px rgba(236,72,153,0.08), 0 14px 50px rgba(236,72,153,0.45); }
        }
        @keyframes hairBounce {
          0%,100% { transform: scaleY(1); }
          50%      { transform: scaleY(1.04); }
        }
        @keyframes eyeBlink {
          0%,90%,100% { transform: scaleY(1); }
          95%          { transform: scaleY(0.05); }
        }
        @keyframes eyeBlinkR {
          0%,75%,100% { transform: scaleY(1); }
          80%          { transform: scaleY(0.05); }
        }
        @keyframes blush {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.2); }
        }
        @keyframes mouthTalk {
          0%,100% { transform: scaleX(1) scaleY(1); }
          30%      { transform: scaleX(1.1) scaleY(0.8); }
          60%      { transform: scaleX(0.95) scaleY(1.15); }
        }
        @keyframes heartBeat {
          0%,100% { transform: scale(1); opacity:1; }
          20%      { transform: scale(1.3); opacity:0.9; }
          40%      { transform: scale(1); opacity:1; }
          60%      { transform: scale(1.15); opacity:0.95; }
        }
        @keyframes tipFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes liveDot {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
        @keyframes sparkle {
          0%,100% { opacity:0; transform: scale(0) rotate(0deg); }
          50%      { opacity:1; transform: scale(1) rotate(180deg); }
        }
        @keyframes earring {
          0%,100% { transform: translateY(0px) rotate(-5deg); }
          50%      { transform: translateY(3px) rotate(5deg); }
        }

        .zehra-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(145deg, #f9a8d4, #c084fc, #818cf8);
          cursor: pointer;
          z-index: 999;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: levitate 3s ease-in-out infinite, glowRing 3s ease-in-out infinite;
          transition: transform 0.2s ease;
          overflow: visible;
        }
        .zehra-fab:hover { transform: scale(1.12) rotate(-3deg); }
        .zehra-fab:active { transform: scale(0.94); }

        .zehra-tip {
          position: fixed;
          right: 14px;
          bottom: 106px;
          padding: 0.4rem 0.95rem;
          border-radius: 14px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          white-space: nowrap;
          pointer-events: none;
          z-index: 998;
          animation: tipFloat 3s ease-in-out infinite;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .zehra-tip-dot {
          width: 7px;
          height: 7px;
          background: #22c55e;
          border-radius: 50%;
          animation: liveDot 1.2s ease-in-out infinite;
          flex-shrink: 0;
        }
        .zehra-tip-arrow {
          position: absolute;
          bottom: -5px;
          right: 22px;
          width: 10px;
          height: 10px;
          transform: rotate(45deg);
        }
      `}</style>

      {/* ── FLOATING BUTTON ── */}
      <button
        className="zehra-fab"
        onClick={() => setCurrentPage('aichat')}
        title="Chat with Zehra"
      >
        <svg width="52" height="56" viewBox="0 0 52 56" fill="none" xmlns="http://www.w3.org/2000/svg">

          {/* ── HAIR (back layer) ── */}
          <ellipse cx="26" cy="22" rx="18" ry="19" fill="#1a0a2e"/>
          {/* Hair sides flowing */}
          <rect x="8" y="22" width="6" height="18" rx="3" fill="#1a0a2e"/>
          <rect x="38" y="22" width="6" height="18" rx="3" fill="#1a0a2e"/>
          {/* Hair top curls */}
          <ellipse cx="18" cy="10" rx="5" ry="6" fill="#1a0a2e"/>
          <ellipse cx="26" cy="7" rx="6" ry="7" fill="#1a0a2e"/>
          <ellipse cx="34" cy="10" rx="5" ry="6" fill="#1a0a2e"/>

          {/* ── FACE ── */}
          <ellipse cx="26" cy="26" rx="15" ry="16" fill="#FDDBB4"/>

          {/* ── HIJAB ── */}
          <path d="M11 28 Q8 20 14 14 Q20 8 26 7 Q32 8 38 14 Q44 20 41 28 Q38 36 26 38 Q14 36 11 28Z" fill="#c084fc" opacity="0.85"/>
          {/* Hijab chin wrap */}
          <path d="M12 30 Q10 38 16 42 Q20 45 26 45 Q32 45 36 42 Q42 38 40 30" stroke="#a855f7" strokeWidth="2" fill="none" opacity="0.6"/>
          {/* Hijab highlight */}
          <path d="M15 16 Q20 11 26 10 Q32 11 37 16" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

          {/* ── EARRINGS ── */}
          <circle cx="11" cy="30" r="2" fill="#facc15" style={{animation:'earring 1.8s ease-in-out infinite'}}/>
          <circle cx="41" cy="30" r="2" fill="#facc15" style={{animation:'earring 1.8s ease-in-out infinite', animationDelay:'0.3s'}}/>

          {/* ── EYEBROWS ── */}
          <path d="M18 20 Q20.5 18.5 23 20" stroke="#1a0a2e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M29 20 Q31.5 18.5 34 20" stroke="#1a0a2e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

          {/* ── EYES ── */}
          {/* Left eye white */}
          <ellipse cx="21" cy="24" rx="4" ry="4.5" fill="white" style={{animation:'eyeBlink 4s ease-in-out infinite'}}/>
          {/* Left iris */}
          <ellipse cx="21" cy="25" rx="2.5" ry="2.8" fill="#1a0a2e" style={{animation:'eyeBlink 4s ease-in-out infinite'}}/>
          {/* Left shine */}
          <circle cx="22.2" cy="23.5" r="0.9" fill="white"/>

          {/* Right eye white */}
          <ellipse cx="31" cy="24" rx="4" ry="4.5" fill="white" style={{animation:'eyeBlinkR 5s ease-in-out infinite'}}/>
          {/* Right iris */}
          <ellipse cx="31" cy="25" rx="2.5" ry="2.8" fill="#1a0a2e" style={{animation:'eyeBlinkR 5s ease-in-out infinite'}}/>
          {/* Right shine */}
          <circle cx="32.2" cy="23.5" r="0.9" fill="white"/>

          {/* ── LASHES ── */}
          <line x1="18" y1="20.5" x2="17" y2="19" stroke="#1a0a2e" strokeWidth="1" strokeLinecap="round"/>
          <line x1="21" y1="19.5" x2="21" y2="18" stroke="#1a0a2e" strokeWidth="1" strokeLinecap="round"/>
          <line x1="24" y1="20.5" x2="25" y2="19" stroke="#1a0a2e" strokeWidth="1" strokeLinecap="round"/>
          <line x1="28" y1="20.5" x2="27" y2="19" stroke="#1a0a2e" strokeWidth="1" strokeLinecap="round"/>
          <line x1="31" y1="19.5" x2="31" y2="18" stroke="#1a0a2e" strokeWidth="1" strokeLinecap="round"/>
          <line x1="34" y1="20.5" x2="35" y2="19" stroke="#1a0a2e" strokeWidth="1" strokeLinecap="round"/>

          {/* ── NOSE ── */}
          <path d="M25 28 Q26 30 27 28" stroke="#e8a87c" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

          {/* ── BLUSH ── */}
          <ellipse cx="16" cy="30" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.6" style={{animation:'blush 2.5s ease-in-out infinite'}}/>
          <ellipse cx="36" cy="30" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.6" style={{animation:'blush 2.5s ease-in-out infinite', animationDelay:'0.4s'}}/>

          {/* ── SMILE ── */}
          <path d="M21 33 Q26 37 31 33" stroke="#e07b5a" strokeWidth="1.8" fill="none" strokeLinecap="round" style={{animation:'mouthTalk 2.5s ease-in-out infinite'}}/>

          {/* ── SPARKLES ── */}
          <text x="2" y="14" fontSize="8" style={{animation:'sparkle 2s ease-in-out infinite'}}>✨</text>
          <text x="40" y="10" fontSize="7" style={{animation:'sparkle 2.4s ease-in-out infinite', animationDelay:'0.6s'}}>⭐</text>

          {/* ── HEART ── */}
          <text x="22" y="55" fontSize="9" style={{animation:'heartBeat 1.5s ease-in-out infinite'}}>💕</text>

        </svg>
      </button>

      {/* ── TOOLTIP ── */}
      <div
        className="zehra-tip"
        style={{
          background: isDark ? '#1e1b2e' : '#ffffff',
          border: isDark ? '1px solid #3b2f6e' : '1px solid #e9d5ff',
          color: '#7c3aed',
          boxShadow: isDark
            ? '0 6px 24px rgba(0,0,0,0.5)'
            : '0 6px 24px rgba(168,85,247,0.2)',
        }}
      >
        <span className="zehra-tip-dot" />
        Zehra is online 🌸

        <span
          className="zehra-tip-arrow"
          style={{
            background: isDark ? '#1e1b2e' : '#ffffff',
            borderRight: isDark ? '1px solid #3b2f6e' : '1px solid #e9d5ff',
            borderBottom: isDark ? '1px solid #3b2f6e' : '1px solid #e9d5ff',
          }}
        />
      </div>
    </>
  );
};

export default AIChatBot;