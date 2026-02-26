import React, { useState, useEffect } from 'react';

// ==========================================
// 🎉 SUBMISSION OVERLAY COMPONENT
// Path: src/components/SubmissionOverlay.jsx
//
// Certificate logic:
//   Python tests → certificate issued if passed (55%+)
//   NEET test    → NO certificate, only leaderboard ranking
//
// Goodbye animation plays when countdown hits 0
// then onDone() is called to hide overlay + switch tab
// ==========================================

export default function SubmissionOverlay({ isPassed, countdown, score, testType, onDone }) {
  const isNeet = testType === 'neet';

  // ── Goodbye phase (plays when countdown === 0) ──
  const [goodbye, setGoodbye] = useState(false);

  useEffect(() => {
    if (countdown === 0) {
      setGoodbye(true);
      // Wait 1.4s for goodbye animation to finish, then call onDone
      const t = setTimeout(() => {
        onDone?.();
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [countdown, onDone]);

  const msgs = isPassed
    ? [
        '🧠 Calculating your performance...',
        '📊 Analyzing subject-wise scores...',
        '🏆 Preparing your results...',
        '✅ Almost done!',
        '🎯 Opening your Results...',
      ]
    : [
        '📝 Saving your answers...',
        '🔢 Computing your score...',
        '📊 Building your report...',
        '💾 Storing your result...',
        '🔄 Opening your Results...',
      ];

  const msgIdx = Math.min(4, Math.floor(((10 - Math.max(0, countdown)) / 10) * 5));
  const progressPct = ((10 - Math.max(0, countdown)) / 10) * 100;

  const orbs = [
    { w: 500, h: 500, top: '-15%', left: '-10%', color: isPassed ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.08)', delay: '0s', dur: '9s' },
    { w: 380, h: 380, top: '55%', left: '65%',   color: isPassed ? 'rgba(52,211,153,0.06)'  : 'rgba(139,92,246,0.07)',  delay: '3s', dur: '11s' },
    { w: 260, h: 260, top: '25%', left: '78%',   color: isPassed ? 'rgba(16,185,129,0.05)'  : 'rgba(236,72,153,0.05)',  delay: '5s', dur: '7s' },
    { w: 200, h: 200, top: '70%', left: '5%',    color: isPassed ? 'rgba(52,211,153,0.06)'  : 'rgba(99,102,241,0.06)',  delay: '1s', dur: '13s' },
  ];

  const getBottomMsg = () => {
    if (isNeet) return isPassed
      ? '🏅 Great score! Check your rank on the Leaderboard tab!'
      : '💪 Keep practicing! Check your subject-wise analysis in the Results tab.';
    return isPassed
      ? '🎓 Your Certificate has been issued! Check the Certificates tab.'
      : '💪 Score 55% or above in your next attempt to earn a Certificate!';
  };

  const getHeading = () => {
    if (isPassed) return isNeet ? 'Amazing Score! 🎉' : 'Congratulations! 🎉';
    return 'Test Submitted!';
  };

  // SVG timer vars
  const size = 64, radius = 26, stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, countdown) / 10) * circumference;
  const timerColor = isPassed ? '#10b981' : '#6366f1';
  const trackColor  = isPassed ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: '#ffffff',
      overflow: 'hidden',
      // ── Goodbye: whole overlay fades + zooms out ──
      animation: goodbye
        ? 'goodbyeOverlay 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards'
        : 'none',
    }}>

      {/* Orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {orbs.map((o, i) => (
          <div key={i} style={{
            position: 'absolute', width: o.w, height: o.h,
            top: o.top, left: o.left, borderRadius: '50%',
            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
            animation: `orbFloat ${o.dur} ${o.delay} ease-in-out infinite alternate`,
            filter: 'blur(50px)',
          }} />
        ))}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
      </div>

      {/* ── GOODBYE SCREEN (shown when countdown === 0) ── */}
      {goodbye && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'goodbyeContent 1.4s ease forwards',
        }}>
          <div style={{
            fontSize: '5rem',
            animation: 'waveHand 0.6s ease-in-out 3',
            display: 'inline-block',
            transformOrigin: '70% 70%',
          }}>👋</div>
          <h2 style={{
            marginTop: '1rem',
            fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
            fontWeight: '900',
            color: '#0f172a',
            letterSpacing: '-0.03em',
            animation: 'fadeSlideDown 0.5s 0.2s ease both',
          }}>
            See you soon!
          </h2>
          <p style={{
            marginTop: '0.5rem',
            fontSize: '1rem',
            color: '#94a3b8',
            fontWeight: '600',
            animation: 'fadeSlideDown 0.5s 0.35s ease both',
          }}>
            Opening your Results now...
          </p>

          {/* Shooting stars */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 3, height: 3,
                borderRadius: '50%',
                background: isPassed ? '#10b981' : '#6366f1',
                top: `${10 + i * 15}%`,
                left: `${5 + i * 16}%`,
                animation: `shootingStar 0.8s ${i * 0.1}s ease-out forwards`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT (hidden during goodbye) ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 520, width: '100%',
        textAlign: 'center',
        animation: 'cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        opacity: goodbye ? 0 : 1,
        transition: 'opacity 0.3s ease',
        pointerEvents: goodbye ? 'none' : 'auto',
      }}>

        {/* Status pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.4rem 1.1rem', borderRadius: 99,
          background: isPassed ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
          border: `1px solid ${isPassed ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`,
          marginBottom: '2rem',
          animation: 'fadeSlideDown 0.5s 0.2s ease both',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isPassed ? '#10b981' : '#6366f1',
            display: 'inline-block',
            animation: 'dotBlink 1.2s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: '0.78rem', fontWeight: '700',
            color: isPassed ? '#059669' : '#4f46e5',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {isPassed ? (isNeet ? 'NEET Passed' : 'Test Passed') : 'Test Submitted'}
          </span>
        </div>

        {/* Icon */}
        <div style={{
          width: 130, height: 130, margin: '0 auto 2rem', borderRadius: '50%',
          background: isPassed ? 'linear-gradient(145deg, #10b981, #059669)' : 'linear-gradient(145deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3.8rem',
          boxShadow: isPassed
            ? '0 20px 60px rgba(16,185,129,0.25), 0 0 0 12px rgba(16,185,129,0.08), 0 0 0 24px rgba(16,185,129,0.04)'
            : '0 20px 60px rgba(99,102,241,0.25), 0 0 0 12px rgba(99,102,241,0.08), 0 0 0 24px rgba(99,102,241,0.04)',
          animation: 'iconBounce 2.4s ease-in-out infinite, fadeSlideDown 0.5s 0.1s ease both',
        }}>
          {isPassed ? (isNeet ? '🧬' : '🏆') : '📊'}
        </div>

        {/* Heading */}
        <h1 style={{
          margin: '0 0 0.6rem',
          fontSize: 'clamp(2rem, 5vw, 2.8rem)',
          fontWeight: '900', color: '#0f172a',
          letterSpacing: '-0.03em', lineHeight: 1.15,
          animation: 'fadeSlideDown 0.5s 0.25s ease both',
        }}>
          {getHeading()}
        </h1>

        {/* Score */}
        <p style={{
          margin: '0 0 0.4rem',
          fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: '700',
          color: isPassed ? '#059669' : '#6366f1',
          animation: 'fadeSlideDown 0.5s 0.35s ease both',
        }}>
          {isNeet ? `Your Score: ${score ?? '—'} / 720` : `Your Score: ${score ?? '—'}%`}
        </p>

        <p style={{
          margin: '0 0 2rem', fontSize: '0.88rem',
          color: '#94a3b8', fontWeight: '500',
          animation: 'fadeSlideDown 0.5s 0.4s ease both',
        }}>
          You can view your detailed result in the Results tab
        </p>

        {/* Rotating message */}
        <div key={msgIdx} style={{
          minHeight: '1.8rem', marginBottom: '1.75rem',
          fontSize: '0.92rem', color: '#64748b', fontWeight: '500',
          animation: 'msgFade 0.35s ease both',
        }}>
          {msgs[msgIdx]}
        </div>

        {/* Progress bar */}
        <div style={{
          height: 10, borderRadius: 99, background: '#f1f5f9',
          overflow: 'hidden', marginBottom: '2rem',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
          animation: 'fadeSlideDown 0.5s 0.5s ease both',
        }}>
          <div style={{
            height: '100%', width: `${progressPct}%`, borderRadius: 99,
            background: isPassed
              ? 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)'
              : 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
            transition: 'width 1s linear',
            boxShadow: isPassed ? '0 0 16px rgba(52,211,153,0.5)' : '0 0 16px rgba(139,92,246,0.5)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              animation: 'shimmer 1.5s linear infinite',
            }} />
          </div>
        </div>

        {/* Countdown card */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '1.25rem', padding: '1.1rem 1.75rem',
          background: '#f8fafc', border: '2px solid #e2e8f0',
          borderRadius: 20, marginBottom: '1.25rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          animation: 'fadeSlideDown 0.5s 0.55s ease both',
        }}>
          {/* SVG circular timer */}
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
              <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
              <circle
                cx={size/2} cy={size/2} r={radius} fill="none"
                stroke={timerColor} strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: '900', color: timerColor,
              fontFamily: 'monospace', letterSpacing: '-1px',
            }}>
              {Math.max(0, countdown)}
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.2rem' }}>
              {countdown <= 2 ? '👋 See you soon!' : 'Redirecting to Results tab...'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
              Mock Tests → Results tab
            </div>
          </div>
        </div>

        {/* Bottom info strip */}
        <div style={{
          padding: '0.9rem 1.25rem',
          background: isPassed ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.06)',
          border: `1px solid ${isPassed ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`,
          borderRadius: 14, fontSize: '0.82rem',
          color: isPassed ? '#059669' : '#6366f1',
          fontWeight: '600', lineHeight: 1.6,
          animation: 'fadeSlideDown 0.5s 0.65s ease both',
        }}>
          {getBottomMsg()}
        </div>

        {/* NEET note */}
        {isNeet && (
          <div style={{
            marginTop: '0.75rem', padding: '0.7rem 1rem',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12, fontSize: '0.76rem',
            color: '#b45309', fontWeight: '600',
            animation: 'fadeSlideDown 0.5s 0.75s ease both',
          }}>
            ⚠️ Note: NEET Mock Test does not issue a Certificate.
            Only Python level tests (Basic / Advanced / Pro) have Certificates.
          </div>
        )}
      </div>

      {/* ── All keyframes ── */}
      <style>{`
        @keyframes orbFloat {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(35px,-35px) scale(1.12); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes iconBounce {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-8px) scale(1.04); }
        }
        @keyframes msgFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
        @keyframes dotBlink {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }

        /* ── Goodbye animations ── */
        @keyframes goodbyeOverlay {
          0%   { opacity: 1; transform: scale(1); }
          60%  { opacity: 1; transform: scale(1.04); }
          100% { opacity: 0; transform: scale(1.12); }
        }
        @keyframes goodbyeContent {
          0%   { opacity: 0; transform: scale(0.7) translateY(30px); }
          30%  { opacity: 1; transform: scale(1.05) translateY(-6px); }
          70%  { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(1.1) translateY(-20px); }
        }
        @keyframes waveHand {
          0%   { transform: rotate(0deg);   }
          25%  { transform: rotate(20deg);  }
          50%  { transform: rotate(-10deg); }
          75%  { transform: rotate(20deg);  }
          100% { transform: rotate(0deg);   }
        }
        @keyframes shootingStar {
          0%   { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(120px, -120px) scale(0); }
        }
      `}</style>
    </div>
  );
}