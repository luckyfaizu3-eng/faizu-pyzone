import React from 'react';
import { useTheme } from '../App';

const AIChatBot = ({ setCurrentPage, currentPage }) => {
  const { isDark } = useTheme();

  // ✅ Sirf Home page pe dikhega
  if (currentPage !== 'home') return null;

  return (
    <>
      <style>{`
        /* ── BREATHING BODY ── */
        @keyframes breathe {
          0%, 100% { transform: scale(1) translateY(0px); }
          30%       { transform: scale(1.06) translateY(-4px); }
          60%       { transform: scale(0.97) translateY(2px); }
        }

        /* ── WHOLE BUTTON LEVITATE ── */
        @keyframes levitate {
          0%, 100% { bottom: 24px; }
          50%       { bottom: 32px; }
        }

        /* ── ANTENNA ALIVE WIGGLE ── */
        @keyframes antWiggle {
          0%,100% { transform: rotate(-12deg) scaleY(1); }
          25%      { transform: rotate(14deg)  scaleY(1.1); }
          50%      { transform: rotate(-8deg)  scaleY(0.95); }
          75%      { transform: rotate(10deg)  scaleY(1.05); }
        }

        /* ── TIP GLOW PULSE ── */
        @keyframes tipGlow {
          0%,100% { box-shadow: 0 0 5px 2px rgba(250,204,21,0.6); background: #facc15; }
          50%      { box-shadow: 0 0 14px 6px rgba(251,146,60,0.9); background: #fb923c; }
        }

        /* ── EYE BLINK LEFT ── */
        @keyframes blinkL {
          0%,88%,100% { transform: scaleY(1); }
          92%,96%     { transform: scaleY(0.05); }
        }

        /* ── EYE BLINK RIGHT (offset) ── */
        @keyframes blinkR {
          0%,70%,100% { transform: scaleY(1); }
          74%,78%     { transform: scaleY(0.05); }
        }

        /* ── PUPIL SCAN ── */
        @keyframes pupilScan {
          0%,100% { transform: translate(0px, 0px); }
          20%      { transform: translate(2px, -1px); }
          40%      { transform: translate(-2px, 1px); }
          60%      { transform: translate(1px, 2px); }
          80%      { transform: translate(-1px, -2px); }
        }

        /* ── SMILE TALK ── */
        @keyframes talk {
          0%,100% { transform: scaleX(1)   scaleY(1); }
          25%      { transform: scaleX(1.2) scaleY(0.7); }
          50%      { transform: scaleX(0.9) scaleY(1.3); }
          75%      { transform: scaleX(1.15) scaleY(0.8); }
        }

        /* ── CHEEK BLUSH ── */
        @keyframes blush {
          0%,100% { opacity: 0.35; transform: scale(1); }
          50%      { opacity: 0.7;  transform: scale(1.3); }
        }

        /* ── GLOW RING ── */
        @keyframes glowRing {
          0%,100% { box-shadow: 0 0 0 0px rgba(99,102,241,0.3), 0 10px 35px rgba(99,102,241,0.45); }
          50%      { box-shadow: 0 0 0 10px rgba(236,72,153,0.08), 0 14px 50px rgba(236,72,153,0.5); }
        }

        /* ── TOOLTIP FLOAT ── */
        @keyframes tipFloat {
          0%,100% { transform: translateY(0px)  scale(1); }
          50%      { transform: translateY(-6px) scale(1.03); }
        }

        /* ── EAR PULSE ── */
        @keyframes earPulse {
          0%,100% { transform: translateY(-50%) scaleX(1); background: rgba(255,255,255,0.35); }
          50%      { transform: translateY(-50%) scaleX(1.4); background: rgba(250,204,21,0.6); }
        }

        /* ── LIVE DOT ── */
        @keyframes liveDot {
          0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50%      { opacity: 0.7; box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }

        /* === BUTTON === */
        .fab-btn {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(145deg, #4f46e5, #7c3aed, #ec4899);
          cursor: pointer;
          z-index: 999;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: levitate 2.8s ease-in-out infinite, glowRing 2.8s ease-in-out infinite;
          transition: transform 0.2s ease;
        }
        .fab-btn:hover { transform: scale(1.14) rotate(-4deg); }
        .fab-btn:active { transform: scale(0.95); }

        /* === ROBOT BODY === */
        .rb-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          animation: breathe 2.4s ease-in-out infinite;
        }

        /* === ANTENNA === */
        .rb-ant-wrap {
          position: relative;
          height: 14px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .rb-ant {
          width: 3px;
          height: 10px;
          background: rgba(255,255,255,0.9);
          border-radius: 3px;
          transform-origin: bottom center;
          animation: antWiggle 1.6s ease-in-out infinite;
        }
        .rb-ant-tip {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: tipGlow 1.2s ease-in-out infinite;
        }

        /* === HEAD === */
        .rb-head {
          width: 40px;
          height: 32px;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(255,255,255,0.55);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          position: relative;
          backdrop-filter: blur(3px);
        }

        /* === EARS === */
        .rb-head::before,
        .rb-head::after {
          content: '';
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 10px;
          border-radius: 3px;
          background: rgba(255,255,255,0.35);
          animation: earPulse 2s ease-in-out infinite;
        }
        .rb-head::before { left: -5px; animation-delay: 0s; }
        .rb-head::after  { right: -5px; animation-delay: 0.4s; }

        /* === EYES === */
        .rb-eyes {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .rb-eye {
          width: 9px;
          height: 9px;
          background: #fff;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
        }
        .rb-eye.left  { animation: blinkL 3.5s ease-in-out infinite; }
        .rb-eye.right { animation: blinkR 4.2s ease-in-out infinite; }

        .rb-pupil {
          position: absolute;
          bottom: 1.5px;
          right: 1.5px;
          width: 4px;
          height: 4px;
          background: #4f46e5;
          border-radius: 50%;
          animation: pupilScan 3s ease-in-out infinite;
        }

        /* === BLUSH CHEEKS === */
        .rb-cheeks {
          display: flex;
          gap: 14px;
          position: absolute;
          bottom: 5px;
        }
        .rb-cheek {
          width: 7px;
          height: 4px;
          background: rgba(251,146,60,0.6);
          border-radius: 50%;
          animation: blush 2s ease-in-out infinite;
        }
        .rb-cheek.right { animation-delay: 0.3s; }

        /* === MOUTH === */
        .rb-mouth {
          width: 18px;
          height: 8px;
          border: 2.5px solid rgba(255,255,255,0.9);
          border-top: none;
          border-radius: 0 0 18px 18px;
          animation: talk 2s ease-in-out infinite;
          transform-origin: center top;
          margin-bottom: 2px;
        }

        /* === TOOLTIP === */
        .fab-tip {
          position: fixed;
          right: 14px;
          bottom: 100px;
          padding: 0.38rem 0.9rem;
          border-radius: 14px;
          font-size: 0.71rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          white-space: nowrap;
          pointer-events: none;
          z-index: 998;
          animation: tipFloat 2.8s ease-in-out infinite;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fab-tip-dot {
          width: 7px;
          height: 7px;
          background: #22c55e;
          border-radius: 50%;
          animation: liveDot 1.2s ease-in-out infinite;
          flex-shrink: 0;
        }

        .fab-tip-arrow {
          position: absolute;
          bottom: -6px;
          right: 22px;
          width: 10px;
          height: 10px;
          transform: rotate(45deg);
        }
      `}</style>

      {/* ── FLOATING BUTTON ── */}
      <button
        className="fab-btn"
        onClick={() => setCurrentPage('aichat')}
        title="AI Support"
      >
        <div className="rb-body">

          {/* Antenna */}
          <div className="rb-ant-wrap">
            <div className="rb-ant" />
            <div className="rb-ant-tip" />
          </div>

          {/* Head */}
          <div className="rb-head">

            {/* Eyes */}
            <div className="rb-eyes">
              <div className="rb-eye left">
                <div className="rb-pupil" />
              </div>
              <div className="rb-eye right">
                <div className="rb-pupil" style={{ animationDelay: '0.8s' }} />
              </div>
            </div>

            {/* Mouth */}
            <div className="rb-mouth" />

            {/* Cheeks */}
            <div className="rb-cheeks">
              <div className="rb-cheek left" />
              <div className="rb-cheek right" />
            </div>

          </div>
        </div>
      </button>

      {/* ── TOOLTIP ── */}
      <div
        className="fab-tip"
        style={{
          background: isDark ? '#1e293b' : '#ffffff',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          color: '#6366f1',
          boxShadow: isDark
            ? '0 6px 24px rgba(0,0,0,0.5)'
            : '0 6px 24px rgba(99,102,241,0.18)',
        }}
      >
        <span className="fab-tip-dot" />
        AI Support

        <span
          className="fab-tip-arrow"
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderRight: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          }}
        />
      </div>
    </>
  );
};

export default AIChatBot;