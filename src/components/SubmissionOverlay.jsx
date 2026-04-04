import React, { useState, useEffect } from 'react';

// ==========================================
// 🎉 SUBMISSION OVERLAY — PSYCHOLOGICAL CONVERSION SYSTEM
// src/components/SubmissionOverlay.jsx
//
// Psychology layers implemented:
//   ✅ Layer 2 — Dramatic "incomplete loop" loading
//   ✅ Layer 3 — Identity shock with student name
//   ✅ Layer 7 — Recruiter fear angle
//   ✅ 24hr urgency hook planted
//   ✅ 100% English — no Hindi anywhere
//
// Props:
//   isPassed    — boolean
//   score       — number
//   testType    — string ('basic' | 'advanced' | 'pro')
//   aiDone      — boolean
//   onDone()    — redirect callback
//   studentName — string (user's real name for identity moment)
// ==========================================

export default function SubmissionOverlay({ isPassed, score, testType, aiDone, onDone, studentName }) {
  const [phase, setPhase]         = useState('generating'); // generating → identity → ready
  const [countdown, setCountdown] = useState(15);
  const [goodbye, setGoodbye]     = useState(false);
  const [stepIdx, setStepIdx]     = useState(0);

  const firstName = (studentName || 'You').split(' ')[0];

  // ── Dramatic generation steps (Layer 2 — Incomplete Loop) ──
  const generationSteps = [
    { icon: '🔍', text: 'Analyzing your answers...',           dur: 1400 },
    { icon: '📊', text: 'Calculating final score...',          dur: 1200 },
    { icon: '🏛️', text: 'Verifying test integrity...',         dur: 1000 },
    { icon: '🎓', text: 'Preparing your certificate...',       dur: 1100 },
    { icon: '🔐', text: 'Assigning unique Certificate ID...',  dur: 900  },
    { icon: '✅', text: 'Certificate ready!',                  dur: 800  },
  ];

  // ── Phase machine ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'generating') return;
    if (stepIdx < generationSteps.length - 1) {
      const t = setTimeout(() => setStepIdx(p => p + 1), generationSteps[stepIdx].dur);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase('identity'), 900);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, phase]);

  // Identity phase — show for 2.8s then go to ready
  useEffect(() => {
    if (phase !== 'identity') return;
    const t = setTimeout(() => setPhase('ready'), 2800);
    return () => clearTimeout(t);
  }, [phase]);

  // Countdown starts when phase = ready AND aiDone = true — 15 seconds
  useEffect(() => {
    if (phase !== 'ready' || !aiDone) return;
    setCountdown(15);
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(t); setGoodbye(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, aiDone]);

  useEffect(() => {
    if (!goodbye) return;
    const t = setTimeout(() => onDone?.(), 1400);
    return () => clearTimeout(t);
  }, [goodbye, onDone]);

  const accentColor = isPassed ? '#10b981' : '#6366f1';
  const accentLight = isPassed ? '#34d399' : '#a78bfa';

  // ── PHASE: GENERATING ─────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div style={overlayBase}>
        <style>{keyframes}</style>
        <GridBg />
        <div style={{ ...cardBase, maxWidth: 480 }}>

          {/* Animated orb */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%', margin: '0 auto 2rem',
            background: `conic-gradient(${accentColor}, ${accentLight}, ${accentColor})`,
            animation: 'spinOrb 1.4s linear infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${accentColor}44`,
          }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
              {generationSteps[stepIdx].icon}
            </div>
          </div>

          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', textAlign: 'center', letterSpacing: '-0.02em' }}>
            Processing Your Results
          </h2>
          <p style={{ margin: '0 0 2rem', color: '#64748b', textAlign: 'center', fontSize: '0.9rem', fontWeight: 500 }}>
            Please wait — do not close this window
          </p>

          {/* Steps list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem' }}>
            {generationSteps.map((step, i) => {
              const done    = i < stepIdx;
              const current = i === stepIdx;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 1rem', borderRadius: 12,
                  background: done ? `${accentColor}10` : current ? `${accentColor}08` : 'transparent',
                  border: `1px solid ${done ? accentColor + '30' : current ? accentColor + '20' : 'transparent'}`,
                  transition: 'all 0.4s ease',
                  opacity: i > stepIdx + 1 ? 0.35 : 1,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: done ? accentColor : current ? `${accentColor}20` : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? '0.75rem' : '0.85rem',
                    animation: current ? 'dotBlink 1s infinite' : 'none',
                  }}>
                    {done ? '✓' : current ? step.icon : '○'}
                  </div>
                  <span style={{
                    fontSize: '0.875rem', fontWeight: current ? 700 : done ? 600 : 500,
                    color: done ? accentColor : current ? '#0f172a' : '#94a3b8',
                  }}>
                    {step.text}
                  </span>
                  {current && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                      {[0,1,2].map(d => (
                        <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, animation: `dotBounce 0.8s ${d * 0.15}s infinite` }}/>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${((stepIdx + 1) / generationSteps.length) * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentLight})`,
              transition: 'width 0.6s ease',
              boxShadow: `0 0 12px ${accentColor}66`,
            }}/>
          </div>

        </div>
      </div>
    );
  }

  // ── PHASE: IDENTITY MOMENT (Layer 3) ─────────────────────
  if (phase === 'identity') {
    return (
      <div style={overlayBase}>
        <style>{keyframes}</style>
        <GridBg />

        {/* Confetti particles */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {confettiColors.map((color, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: confettiSizes[i % 5],
              height: confettiSizes[i % 5],
              borderRadius: i % 3 === 0 ? '50%' : 2,
              background: color,
              left: `${(i * 7.3) % 100}%`,
              top: '-10px',
              animation: `confettiFall ${1.8 + (i % 4) * 0.4}s ${(i % 6) * 0.12}s ease-in forwards`,
            }}/>
          ))}
        </div>

        <div style={{ ...cardBase, maxWidth: 520, textAlign: 'center', animation: 'identityIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both' }}>

          {/* Big trophy */}
          <div style={{
            fontSize: '5rem', marginBottom: '1.25rem',
            animation: 'trophyBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
            display: 'inline-block',
          }}>
            {isPassed ? '🏆' : '📊'}
          </div>

          {/* Identity line */}
          <div style={{
            display: 'inline-block',
            padding: '0.35rem 1rem',
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}30`,
            borderRadius: 99,
            fontSize: '0.75rem', fontWeight: 800,
            color: accentColor, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: '1rem',
            animation: 'fadeSlideDown 0.5s 0.2s ease both',
          }}>
            {isPassed ? '🎓 Certificate Issued' : 'Test Complete'}
          </div>

          {/* BIG NAME — the identity moment */}
          <h1 style={{
            margin: '0 0 0.5rem',
            fontSize: 'clamp(2rem, 6vw, 3.2rem)',
            fontWeight: 900,
            color: '#0f172a',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            animation: 'fadeSlideDown 0.5s 0.3s ease both',
          }}>
            {firstName},
          </h1>

          {isPassed ? (
            <h2 style={{
              margin: '0 0 1.5rem',
              fontSize: 'clamp(1.2rem, 3.5vw, 1.8rem)',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '-0.02em',
              animation: 'fadeSlideDown 0.5s 0.4s ease both',
            }}>
              you are now a certified<br/>
              <span style={{ fontWeight: 900, fontSize: '1.1em' }}>Python Developer.</span>
            </h2>
          ) : (
            <h2 style={{
              margin: '0 0 1.5rem',
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              fontWeight: 700, color: '#475569',
              animation: 'fadeSlideDown 0.5s 0.4s ease both',
            }}>
              your test has been submitted.<br/>
              <span style={{ color: accentColor, fontWeight: 800 }}>Score: {score}%</span>
            </h2>
          )}

          {isPassed && (
            <div style={{
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              borderRadius: 16, marginBottom: '1rem',
              animation: 'fadeSlideDown 0.5s 0.5s ease both',
            }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.7 }}>
                Your certificate is <strong style={{ color: '#fff' }}>ready to download.</strong><br/>
                One last step to make it official — <strong style={{ color: accentColor }}>opening now...</strong>
              </p>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ── PHASE: READY ──────────────────────────────────────────
  const progressPct = aiDone ? ((15 - Math.max(0, countdown)) / 15) * 100 : 0;
  const circumference = 2 * Math.PI * 26;
  const dashOffset = aiDone
    ? circumference - (Math.max(0, countdown) / 15) * circumference
    : circumference;

  return (
    <div style={{
      ...overlayBase,
      animation: goodbye ? 'goodbyeOverlay 1.4s cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
    }}>
      <style>{keyframes}</style>
      <GridBg />

      {/* Goodbye screen */}
      {goodbye && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'goodbyeContent 1.4s ease forwards',
        }}>
          <div style={{ fontSize: '5rem', animation: 'waveHand 0.6s ease-in-out 3', display: 'inline-block', transformOrigin: '70% 70%' }}>👋</div>
          <h2 style={{ marginTop: '1rem', fontSize: 'clamp(1.8rem,5vw,2.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>See you soon!</h2>
          <p style={{ marginTop: '0.5rem', fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>Opening your results now...</p>
        </div>
      )}

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 520, width: '100%',
        textAlign: 'center',
        opacity: goodbye ? 0 : 1, transition: 'opacity 0.3s ease',
        pointerEvents: goodbye ? 'none' : 'auto',
        animation: 'cardIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {/* Status pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.4rem 1.1rem', borderRadius: 99, marginBottom: '2rem',
          background: isPassed ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
          border: `1px solid ${isPassed ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`,
          animation: 'fadeSlideDown 0.5s 0.1s ease both',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, display: 'inline-block', animation: 'dotBlink 1.2s infinite' }}/>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: accentColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {isPassed ? 'Test Passed' : 'Test Submitted'}
          </span>
        </div>

        {/* Icon */}
        <div style={{
          width: 120, height: 120, margin: '0 auto 2rem', borderRadius: '50%',
          background: isPassed ? 'linear-gradient(145deg,#10b981,#059669)' : 'linear-gradient(145deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem',
          boxShadow: isPassed
            ? '0 20px 60px rgba(16,185,129,0.25),0 0 0 12px rgba(16,185,129,0.08)'
            : '0 20px 60px rgba(99,102,241,0.25),0 0 0 12px rgba(99,102,241,0.08)',
          animation: 'iconBounce 2.4s ease-in-out infinite, fadeSlideDown 0.5s 0.1s ease both',
        }}>
          {isPassed ? '🏆' : '📊'}
        </div>

        {/* Score */}
        <h1 style={{ margin: '0 0 0.4rem', fontSize: 'clamp(1.8rem,5vw,2.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', animation: 'fadeSlideDown 0.5s 0.2s ease both' }}>
          {isPassed ? `Congratulations, ${firstName}!` : `Well done, ${firstName}!`}
        </h1>
        <p style={{ margin: '0 0 0.3rem', fontSize: '1.1rem', fontWeight: 700, color: accentColor, animation: 'fadeSlideDown 0.5s 0.3s ease both' }}>
          Your Score: {score}%
        </p>
        <p style={{ margin: '0 0 1.75rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500, animation: 'fadeSlideDown 0.5s 0.35s ease both' }}>
          {aiDone ? 'Your full results are ready!' : 'Preparing your AI performance report...'}
        </p>

        {/* Rotating AI message */}
        {!aiDone && (
          <div style={{ minHeight: '1.6rem', marginBottom: '1.5rem', fontSize: '0.88rem', color: '#64748b', fontWeight: 500, animation: 'msgFade 0.4s ease both' }}>
            🧠 AI is analyzing your performance...
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden', marginBottom: '2rem', animation: 'fadeSlideDown 0.5s 0.45s ease both' }}>
          <div style={{
            height: '100%', width: `${progressPct}%`, borderRadius: 99,
            background: isPassed ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
            transition: aiDone ? 'width 1s linear' : 'none',
            boxShadow: `0 0 16px ${accentColor}66`, position: 'relative', overflow: 'hidden',
          }}>
            {aiDone && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)', animation: 'shimmer 1.5s linear infinite' }}/>}
          </div>
        </div>

        {/* Countdown card */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem',
          padding: '1rem 1.5rem', background: '#f8fafc', border: '2px solid #e2e8f0',
          borderRadius: 20, marginBottom: '1.25rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          animation: 'fadeSlideDown 0.5s 0.5s ease both',
        }}>
          <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <svg width={64} height={64} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
              <circle cx={32} cy={32} r={26} fill="none" stroke={`${accentColor}18`} strokeWidth={4}/>
              {aiDone && (
                <circle cx={32} cy={32} r={26} fill="none" stroke={accentColor} strokeWidth={4}
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}/>
              )}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: aiDone ? '1.4rem' : '1rem', fontWeight: 900, color: accentColor, fontFamily: 'monospace' }}>
              {aiDone ? Math.max(0, countdown) : <span style={{ animation: 'dotBlink 1s infinite', fontSize: '0.85rem' }}>⏳</span>}
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.2rem' }}>
              {aiDone ? (countdown <= 2 ? '👋 See you soon!' : 'Redirecting to Results...') : '🧠 AI building your report...'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
              {aiDone ? 'Mock Tests → Results tab' : 'Please stay — just a few seconds'}
            </div>
          </div>
        </div>

        {/* Bottom strip — RECRUITER FEAR (Layer 7) */}
        {isPassed ? (
          <div style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))',
            border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14,
            animation: 'fadeSlideDown 0.5s 0.6s ease both',
          }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.83rem', fontWeight: 700, color: '#059669' }}>
              🎓 Certificate issued! One final step remaining.
            </p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6 }}>
              Your certificate is valid on <strong>LinkedIn, resumes & job portals.</strong><br/>
              Recruiters can scan the QR code to verify it instantly.<br/>
              <strong style={{ color: '#ef4444' }}>⏰ Available for 24 hours — then permanently deleted.</strong>
            </p>
          </div>
        ) : (
          <div style={{
            padding: '0.9rem 1.25rem',
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14,
            fontSize: '0.82rem', color: '#6366f1', fontWeight: 600, lineHeight: 1.6,
            animation: 'fadeSlideDown 0.5s 0.6s ease both',
          }}>
            💪 Score 55% or above in your next attempt to earn a Certificate!
          </div>
        )}

      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────
const overlayBase = {
  position: 'fixed', inset: 0, zIndex: 99999999,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '1rem', background: '#ffffff', overflow: 'hidden',
};

const cardBase = {
  position: 'relative', zIndex: 1, width: '100%',
  padding: 'clamp(1.5rem, 4vw, 2.5rem)',
};

function GridBg() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: 'radial-gradient(circle,rgba(0,0,0,0.04) 1px,transparent 1px)',
      backgroundSize: '28px 28px',
    }}/>
  );
}

const confettiColors = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#34d399','#fbbf24','#f87171','#60a5fa','#a78bfa','#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#34d399','#fbbf24','#f87171','#60a5fa','#a78bfa'];
const confettiSizes = ['8px','10px','6px','12px','7px'];

const keyframes = `
  @keyframes spinOrb      { to { transform: rotate(360deg); } }
  @keyframes dotBounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes dotBlink     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  @keyframes cardIn       { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes fadeSlideDown{ from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes iconBounce   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-8px) scale(1.04)} }
  @keyframes shimmer      { from{transform:translateX(-100%)} to{transform:translateX(200%)} }
  @keyframes identityIn   { from{opacity:0;transform:scale(0.88) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes trophyBounce { from{transform:scale(0) rotate(-20deg)} 70%{transform:scale(1.15) rotate(5deg)} to{transform:scale(1) rotate(0deg)} }
  @keyframes confettiFall { 0%{opacity:1;transform:translateY(-10px) rotate(0deg)} 100%{opacity:0;transform:translateY(110vh) rotate(720deg)} }
  @keyframes msgFade      { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes goodbyeOverlay{ 0%{opacity:1;transform:scale(1)} 60%{opacity:1;transform:scale(1.04)} 100%{opacity:0;transform:scale(1.12)} }
  @keyframes goodbyeContent{ 0%{opacity:0;transform:scale(0.7) translateY(30px)} 30%{opacity:1;transform:scale(1.05) translateY(-6px)} 70%{opacity:1;transform:scale(1) translateY(0)} 100%{opacity:0;transform:scale(1.1) translateY(-20px)} }
  @keyframes waveHand     { 0%{transform:rotate(0deg)} 25%{transform:rotate(20deg)} 50%{transform:rotate(-10deg)} 75%{transform:rotate(20deg)} 100%{transform:rotate(0deg)} }
`;