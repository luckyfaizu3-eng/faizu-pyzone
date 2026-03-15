import React from 'react';
import { useTheme } from '../App';

const AIChatBot = ({ setCurrentPage, currentPage }) => {
  const { isDark } = useTheme();

  if (currentPage !== 'home') return null;

  return (
    <>
      <style>{`
        @keyframes levitate {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes glowRing {
          0%,100% { box-shadow: 0 0 0 0px rgba(99,102,241,0.3), 0 8px 30px rgba(99,102,241,0.4); }
          50%      { box-shadow: 0 0 0 10px rgba(99,102,241,0.08), 0 14px 50px rgba(139,92,246,0.5); }
        }
        @keyframes orbitRing {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseCore {
          0%,100% { opacity: 0.9; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.08); }
        }
        @keyframes scanLine {
          0%   { top: 20%; opacity: 0.6; }
          100% { top: 80%; opacity: 0; }
        }
        @keyframes blink {
          0%,90%,100% { transform: scaleY(1); }
          95%          { transform: scaleY(0.05); }
        }
        @keyframes tipFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes liveDot {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50%      { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
        @keyframes dotPulse1 {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          33%      { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes dotPulse2 {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          66%      { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes dotPulse3 {
          0%,100% { opacity: 1;   transform: scale(1.2); }
          33%      { opacity: 0.3; transform: scale(0.8); }
        }
        @keyframes waveBar1 {
          0%,100% { height: 6px; }
          50%      { height: 18px; }
        }
        @keyframes waveBar2 {
          0%,100% { height: 12px; }
          50%      { height: 6px; }
        }
        @keyframes waveBar3 {
          0%,100% { height: 8px; }
          50%      { height: 20px; }
        }
        @keyframes waveBar4 {
          0%,100% { height: 14px; }
          50%      { height: 4px; }
        }
        @keyframes waveBar5 {
          0%,100% { height: 6px; }
          50%      { height: 16px; }
        }

        .ai-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(145deg, #4f46e5, #7c3aed, #6366f1);
          cursor: pointer;
          z-index: 999;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: levitate 3.5s ease-in-out infinite, glowRing 3s ease-in-out infinite;
          transition: transform 0.2s ease;
          overflow: visible;
        }
        .ai-fab:hover { transform: scale(1.12); }
        .ai-fab:active { transform: scale(0.94); }

        .ai-tip {
          position: fixed;
          right: 14px;
          bottom: 104px;
          padding: 0.45rem 1rem;
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
          gap: 7px;
        }
        .ai-tip-dot {
          width: 7px;
          height: 7px;
          background: #22c55e;
          border-radius: 50%;
          animation: liveDot 1.2s ease-in-out infinite;
          flex-shrink: 0;
        }
        .ai-tip-arrow {
          position: absolute;
          bottom: -5px;
          right: 22px;
          width: 10px;
          height: 10px;
          transform: rotate(45deg);
        }

        /* Orbit ring around fab */
        .ai-orbit {
          position: absolute;
          width: 84px;
          height: 84px;
          border-radius: 50%;
          border: 1.5px dashed rgba(139,92,246,0.4);
          animation: orbitRing 8s linear infinite;
          pointer-events: none;
        }
        .ai-orbit::before {
          content: '';
          position: absolute;
          width: 7px;
          height: 7px;
          background: #a78bfa;
          border-radius: 50%;
          top: -3.5px;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 6px #a78bfa;
        }
      `}</style>

      {/* ── FLOATING BUTTON ── */}
      <button
        className="ai-fab"
        onClick={() => setCurrentPage('aichat')}
        title="AI Support"
      >
        {/* Orbit ring */}
        <div className="ai-orbit" />

        {/* AI Bot SVG Icon */}
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">

          {/* Outer glow circle */}
          <circle cx="20" cy="20" r="18" fill="rgba(255,255,255,0.08)" />

          {/* Bot head */}
          <rect x="8" y="12" width="24" height="18" rx="6" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>

          {/* Antenna */}
          <line x1="20" y1="12" x2="20" y2="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="20" cy="6" r="2.5" fill="#a78bfa" style={{animation:'pulseCore 1.5s ease-in-out infinite'}}/>
          <circle cx="20" cy="6" r="1.2" fill="white"/>

          {/* Eyes */}
          <ellipse cx="15" cy="20" rx="3" ry="3.2" fill="white" style={{animation:'blink 4s ease-in-out infinite'}}/>
          <ellipse cx="15" cy="20.5" rx="1.8" ry="2" fill="#4f46e5" style={{animation:'blink 4s ease-in-out infinite'}}/>
          <circle cx="15.8" cy="19.5" r="0.7" fill="white"/>

          <ellipse cx="25" cy="20" rx="3" ry="3.2" fill="white" style={{animation:'blink 5s ease-in-out infinite', animationDelay:'0.5s'}}/>
          <ellipse cx="25" cy="20.5" rx="1.8" ry="2" fill="#4f46e5" style={{animation:'blink 5s ease-in-out infinite', animationDelay:'0.5s'}}/>
          <circle cx="25.8" cy="19.5" r="0.7" fill="white"/>

          {/* Sound wave bars (mouth) */}
          <g transform="translate(13, 26.5)">
            <rect x="0"  y="0" width="2" height="6"  rx="1" fill="rgba(255,255,255,0.9)" style={{animation:'waveBar1 0.8s ease-in-out infinite', transformOrigin:'bottom'}}/>
            <rect x="3.5" y="0" width="2" height="12" rx="1" fill="rgba(255,255,255,0.9)" style={{animation:'waveBar2 0.8s ease-in-out infinite 0.1s', transformOrigin:'bottom'}}/>
            <rect x="7"  y="0" width="2" height="8"  rx="1" fill="white" style={{animation:'waveBar3 0.8s ease-in-out infinite 0.2s', transformOrigin:'bottom'}}/>
            <rect x="10.5" y="0" width="2" height="14" rx="1" fill="rgba(255,255,255,0.9)" style={{animation:'waveBar4 0.8s ease-in-out infinite 0.15s', transformOrigin:'bottom'}}/>
            <rect x="14" y="0" width="2" height="6"  rx="1" fill="rgba(255,255,255,0.9)" style={{animation:'waveBar5 0.8s ease-in-out infinite 0.05s', transformOrigin:'bottom'}}/>
          </g>

          {/* Ear connectors */}
          <rect x="5" y="18" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
          <rect x="32" y="18" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>

          {/* Scan line effect */}
          <rect x="8" y="12" width="24" height="2" rx="1" fill="rgba(167,139,250,0.3)" style={{animation:'scanLine 2s ease-in-out infinite'}}/>
        </svg>
      </button>

      {/* ── TOOLTIP ── */}
      <div
        className="ai-tip"
        style={{
          background: isDark ? '#1e1b2e' : '#ffffff',
          border: isDark ? '1px solid #3b2f6e' : '1px solid #e0e7ff',
          color: '#6366f1',
          boxShadow: isDark
            ? '0 6px 24px rgba(0,0,0,0.5)'
            : '0 6px 24px rgba(99,102,241,0.2)',
        }}
      >
        <span className="ai-tip-dot" />
        AI Support Online 🤖

        <span
          className="ai-tip-arrow"
          style={{
            background: isDark ? '#1e1b2e' : '#ffffff',
            borderRight: isDark ? '1px solid #3b2f6e' : '1px solid #e0e7ff',
            borderBottom: isDark ? '1px solid #3b2f6e' : '1px solid #e0e7ff',
          }}
        />
      </div>
    </>
  );
};

export default AIChatBot;