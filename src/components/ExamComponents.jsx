// @ts-nocheck
// FILE LOCATION: src/components/ExamComponents.jsx
// Shared UI components used across the exam interface

import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { APP_CONFIG, THEME, TestUtils } from './utils';

// ==========================================
// TICK SOUND UTILITY — Web Audio API, no file needed
// ==========================================
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  return _audioCtx;
}

function playTick(urgent = false) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (urgent) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.07);
    }
  } catch { /* silently ignore */ }
}

// ==========================================
// AUTO-SCROLL UTILITY — hard instant jump
// ==========================================
export function scrollToQuestion(questionIndex) {
  let el = document.querySelector(`[data-question-index="${questionIndex}"]`);
  if (!el) el = document.getElementById(`question-${questionIndex}`);
  if (!el) {
    const cards = document.querySelectorAll('.question-card, [class*="question-card"]');
    if (cards[questionIndex]) el = cards[questionIndex];
  }
  if (!el) return;
  el.scrollIntoView({ behavior: 'instant', block: 'start' });
  el.style.transition = 'outline 0s';
  el.style.outline = '3px solid #6366f1';
  el.style.outlineOffset = '4px';
  setTimeout(() => {
    el.style.transition = 'outline 0.6s ease';
    el.style.outline = '3px solid transparent';
    setTimeout(() => { el.style.outline = ''; el.style.transition = ''; }, 700);
  }, 320);
}

// ==========================================
// OPTIONS GRID — 2x2 layout
// Usage:
//   <OptionsGrid
//     options={['Option A', 'Option B', 'Option C', 'Option D']}
//     selected={selectedIndex}           // number | null
//     onSelect={(idx) => handleSelect(idx)}
//     disabled={false}                   // true = after submit / expired
//     correctIndex={2}                   // pass after reveal to highlight correct
//     labels={['A','B','C','D']}         // optional, defaults to A B C D
//   />
// ==========================================
export function OptionsGrid({
  options = [],
  selected = null,
  onSelect,
  disabled = false,
  correctIndex = null,  // null = not revealed yet
  labels,
  isMobile,
}) {
  const defaultLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const L = labels || defaultLabels;

  // Always 2 columns — 2x2 for 4 options, 2x3 for 6, etc.
  return (
    <>
      <style>{`
        @keyframes optionPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
        .option-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 2px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          text-align: left;
          transition:
            border-color 0.18s ease,
            background   0.18s ease,
            box-shadow   0.18s ease,
            transform    0.18s ease;
          box-sizing: border-box;
          min-height: 64px;
          position: relative;
          overflow: hidden;
        }
        .option-cell:hover:not(.opt-disabled):not(.opt-selected) {
          border-color: #a5b4fc;
          background: #f5f3ff;
          box-shadow: 0 2px 12px rgba(99,102,241,0.10);
          transform: translateY(-1px);
        }
        .option-cell:active:not(.opt-disabled) {
          animation: optionPop 0.18s ease forwards;
        }
        .opt-selected {
          border-color: #6366f1 !important;
          background: #eef2ff !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.18) !important;
        }
        .opt-correct {
          border-color: #10b981 !important;
          background: #d1fae5 !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.18) !important;
        }
        .opt-wrong {
          border-color: #ef4444 !important;
          background: #fee2e2 !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
        }
        .opt-disabled {
          cursor: not-allowed;
          opacity: 0.72;
        }
        .opt-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 900;
          flex-shrink: 0;
          transition: background 0.18s, color 0.18s;
        }
        .opt-text {
          font-size: clamp(0.82rem, 2vw, 0.95rem);
          font-weight: 600;
          color: #1e293b;
          line-height: 1.45;
          flex: 1;
        }
      `}</style>

      {/* 2-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isMobile ? '10px' : '12px',
        width: '100%',
        marginTop: '1.25rem',
      }}>
        {options.map((opt, idx) => {
          const isSelected = selected === idx;
          const revealed   = correctIndex !== null;
          const isCorrect  = revealed && idx === correctIndex;
          const isWrong    = revealed && isSelected && idx !== correctIndex;

          let labelBg    = '#f1f5f9';
          let labelColor = '#64748b';
          if (isSelected && !revealed) { labelBg = '#6366f1'; labelColor = '#fff'; }
          if (isCorrect)               { labelBg = '#10b981'; labelColor = '#fff'; }
          if (isWrong)                 { labelBg = '#ef4444'; labelColor = '#fff'; }

          const cellClass = [
            'option-cell',
            isSelected && !revealed ? 'opt-selected' : '',
            isCorrect               ? 'opt-correct'  : '',
            isWrong                 ? 'opt-wrong'    : '',
            disabled                ? 'opt-disabled' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={idx}
              className={cellClass}
              onClick={() => {
                if (disabled || revealed) return;
                if (onSelect) onSelect(idx);
              }}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              {/* Letter label badge */}
              <span className="opt-label" style={{ background: labelBg, color: labelColor }}>
                {L[idx] || idx + 1}
              </span>

              {/* Option text */}
              <span className="opt-text">{opt}</span>

              {/* Correct / wrong icon */}
              {isCorrect && (
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>✓</span>
              )}
              {isWrong && (
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>✗</span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ==========================================
// SYNTAX HIGHLIGHTER
// ==========================================
export function SyntaxHighlight({ code }) {
  if (!code) return null;
  const tokenize = (line) => {
    const tokens = [];
    let rem = line;
    const patterns = [
      { type: 'comment',     regex: /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/ },
      { type: 'string',      regex: /^(['"`])((?:\\.|(?!\1)[^\\])*)\1/ },
      { type: 'keyword',     regex: /^(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|null|undefined|true|false|void|delete|in|of|static|super)\b/ },
      { type: 'builtin',     regex: /^(console|Math|Array|Object|String|Number|Boolean|Promise|setTimeout|setInterval|clearTimeout|clearInterval|document|window|navigator|JSON|parseInt|parseFloat|isNaN|fetch|Map|Set)\b/ },
      { type: 'number',      regex: /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/ },
      { type: 'operator',    regex: /^(===|!==|==|!=|>=|<=|=>|&&|\|\||[+\-*/%=<>!&|^~?:])/ },
      { type: 'function',    regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/ },
      { type: 'punctuation', regex: /^[(){}[\],;.]/ },
      { type: 'identifier',  regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*/ },
      { type: 'space',       regex: /^\s+/ },
      { type: 'other',       regex: /^./ },
    ];
    while (rem.length > 0) {
      let matched = false;
      for (const { type, regex } of patterns) {
        const m = rem.match(regex);
        if (m) { tokens.push({ type, value: m[0] }); rem = rem.slice(m[0].length); matched = true; break; }
      }
      if (!matched) { tokens.push({ type: 'other', value: rem[0] }); rem = rem.slice(1); }
    }
    return tokens;
  };
  const colorMap = {
    keyword: '#7c3aed', builtin: '#0e7490', string: '#15803d',
    number: '#b91c1c', comment: '#64748b', operator: '#b45309',
    function: '#1d4ed8', punctuation: '#1f2937', identifier: '#0f172a',
    space: 'inherit', other: '#0f172a',
  };
  return (
    <div style={{ background:'#f1f5f9', border:'3px solid #94a3b8', borderRadius:'16px', padding:'1.25rem 1.5rem', overflowX:'auto', marginTop:'1.5rem', width:'100%', boxSizing:'border-box' }}>
      <pre style={{ margin:0, fontFamily:"Consolas,Monaco,'Courier New',monospace", fontSize:'clamp(0.82rem,1.8vw,0.95rem)', lineHeight:1.75, fontWeight:'600', whiteSpace:'pre', overflowX:'auto' }}>
        {code.split('\n').map((line, li) => (
          <div key={li}>
            {tokenize(line).map((tok, ti) => (
              <span key={ti} style={{ color: colorMap[tok.type] || '#000' }}>{tok.value}</span>
            ))}
          </div>
        ))}
      </pre>
    </div>
  );
}

// ==========================================
// WATERMARK
// ==========================================
export const Watermark = React.memo(function Watermark({ userEmail, userName }) {
  const text = `${userName || 'Student'} • ${userEmail || ''} • EXAM`;
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:99998, overflow:'hidden', userSelect:'none', WebkitUserSelect:'none' }}>
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => (
          <div key={`${row}-${col}`} style={{ position:'absolute', left:`${col*22-5}%`, top:`${row*14-2}%`, transform:'rotate(-25deg)', fontSize:'13px', fontWeight:'700', color:'rgba(99,102,241,0.13)', whiteSpace:'nowrap', letterSpacing:'0.05em', fontFamily:'monospace' }}>
            {text}
          </div>
        ))
      )}
    </div>
  );
});

// ==========================================
// WARNING MODAL
// ==========================================
export function WarningModal({ show, message, type, tabSwitches, onAcknowledge, initialCountdown }) {
  const [countdown, setCountdown] = useState(() => initialCountdown ?? 20);
  const timerRef         = useRef(null);
  const onAcknowledgeRef = useRef(onAcknowledge);
  useEffect(() => { onAcknowledgeRef.current = onAcknowledge; }, [onAcknowledge]);

  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!show) return;
    window.history.pushState(null, '', window.location.href);
    const blockBack = (e) => { e.preventDefault(); window.history.pushState(null, '', window.location.href); };
    window.addEventListener('popstate', blockBack);
    const isFinal    = type === 'final';
    const isCritical = type === 'critical';
    const isDevtools = type === 'devtools-warning';
    const needsTimer = isFinal || isCritical || isDevtools;
    const startVal   = initialCountdown ?? 20;
    setCountdown(startVal);
    if (needsTimer) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); onAcknowledgeRef.current(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      window.removeEventListener('popstate', blockBack);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, type, initialCountdown]);

  if (!show) return null;

  const isFinal    = type === 'final';
  const isCritical = type === 'critical';
  const isDevtools = type === 'devtools-warning';
  const needsOk    = isFinal || isCritical || isDevtools;
  const totalSecs  = initialCountdown ?? 20;

  const s = isFinal
    ? { bg:'linear-gradient(135deg,#1a0000,#3d0000)', border:'4px solid #dc2626', color:'#fff', iconColor:'#ff4444', iconSize:44 }
    : isDevtools
    ? { bg:'linear-gradient(135deg,#0a0a1a,#1a0030)', border:'4px solid #7c3aed', color:'#fff', iconColor:'#a78bfa', iconSize:42 }
    : isCritical
    ? { bg:'linear-gradient(135deg,#1a1000,#3d2800)', border:'3px solid #f59e0b', color:'#fff', iconColor:'#fbbf24', iconSize:38 }
    : { bg:'linear-gradient(135deg,#fee2e2,#fecaca)', border:'3px solid #ef4444', color:'#991b1b', iconColor:'#ef4444', iconSize:32 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:9999999, display:'flex', alignItems:'flex-start', justifyContent:'center', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'1rem' }}>
      <div style={{ background:s.bg, padding:'1.5rem 1.25rem', borderRadius:'20px', maxWidth:'520px', width:'100%', margin:'auto', border:s.border, boxShadow:`0 20px 60px ${s.iconColor}40`, textAlign:'center', animation:isFinal?'warningPulse 0.9s infinite':'none' }}>
        <div style={{ animation:'iconShake 0.4s infinite', display:'inline-block', marginBottom:'0.75rem' }}>
          <AlertTriangle size={s.iconSize} color={s.iconColor} strokeWidth={2.5} />
        </div>
        {isFinal    && <div style={{ fontSize:'clamp(1.1rem,5vw,1.6rem)', fontWeight:'900', color:'#ff4444', marginBottom:'0.75rem', letterSpacing:'0.04em', textTransform:'uppercase', animation:'blink 0.7s infinite' }}>DISQUALIFIED</div>}
        {isCritical && <div style={{ fontSize:'clamp(1rem,4vw,1.4rem)', fontWeight:'900', color:'#fcd34d', marginBottom:'0.75rem' }}>FINAL WARNING</div>}
        {isDevtools && <div style={{ fontSize:'clamp(1rem,4vw,1.4rem)', fontWeight:'900', color:'#a78bfa', marginBottom:'0.75rem', animation:'devtoolsPulse 1s infinite' }}>🔍 DEVELOPER TOOLS DETECTED</div>}
        <div style={{ fontSize:'clamp(0.82rem,3.5vw,1rem)', fontWeight:'600', color:s.color, lineHeight:1.7, whiteSpace:'pre-line', marginBottom:'1rem', textAlign:'left', wordBreak:'break-word' }}>{message}</div>
        {tabSwitches > 0 && (type === 'critical' || type === 'final') && (
          <div style={{ fontSize:'0.85rem', fontWeight:'900', color:s.iconColor, padding:'0.5rem 1rem', background:'rgba(0,0,0,0.3)', borderRadius:'8px', marginBottom:'1rem', border:`2px solid ${s.iconColor}40`, display:'inline-block' }}>
            Tab Switches: {tabSwitches} / {APP_CONFIG.MAX_TAB_SWITCHES}
          </div>
        )}
        {needsOk && (
          <div style={{ marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.6)', marginBottom:'0.4rem', fontWeight:'600' }}>
              {isDevtools
                ? <>Auto-submit in <span style={{ color:s.iconColor, fontWeight:'900' }}>{countdown}s</span> if DevTools not closed</>
                : <>Auto-continuing in <span style={{ color:s.iconColor, fontWeight:'900' }}>{countdown}s</span></>
              }
            </div>
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'999px', height:'6px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(countdown / totalSecs) * 100}%`, background: isDevtools ? '#7c3aed' : isFinal ? '#ef4444' : '#f59e0b', borderRadius:'999px', transition:'width 1s linear' }} />
            </div>
          </div>
        )}
        {needsOk && (
          <button onClick={onAcknowledge} style={{ width:'100%', padding:'0.875rem 1rem', background: isDevtools ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : isFinal ? 'linear-gradient(135deg,#dc2626,#7f1d1d)' : 'linear-gradient(135deg,#f59e0b,#b45309)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'clamp(0.8rem,3.5vw,0.95rem)', fontWeight:'900', cursor:'pointer', letterSpacing:'0.03em', wordBreak:'break-word', whiteSpace:'normal', lineHeight:1.4 }}>
            {isFinal    ? 'I understand — I accept this disqualification'
            : isDevtools ? 'I am closing DevTools now'
            :              'I understand — I will NOT violate rules again'}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// PER-QUESTION TIMER — tick every second
// ==========================================
export const QuestionTimer = React.memo(function QuestionTimer({
  questionIndex,
  totalQuestions,
  timePerQuestion,
  onExpire,
  isAdmin,
  timerStateRef,
}) {
  if (!timerStateRef.current[questionIndex]) {
    timerStateRef.current[questionIndex] = { timeLeft: timePerQuestion, expired: false };
  }

  const [timeLeft, setTimeLeft] = useState(timerStateRef.current[questionIndex].timeLeft);
  const firedRef    = useRef(timerStateRef.current[questionIndex].expired);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    const unlock = () => {
      const ctx = getAudioCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown',     unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown',     unlock);
    };
  }, []);

  useEffect(() => {
    const slot = timerStateRef.current[questionIndex];
    if (!slot) {
      timerStateRef.current[questionIndex] = { timeLeft: timePerQuestion, expired: false };
    }
    const current = timerStateRef.current[questionIndex];
    setTimeLeft(current.timeLeft);
    firedRef.current = current.expired;

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isAdmin || current.expired) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 1);
        const isUrgentSound = next <= 10 && next > 0;
        playTick(isUrgentSound);
        timerStateRef.current[questionIndex] = {
          ...timerStateRef.current[questionIndex],
          timeLeft: next,
        };
        if (next <= 0 && !firedRef.current) {
          firedRef.current = true;
          timerStateRef.current[questionIndex].expired = true;
          clearInterval(intervalRef.current);
          onExpireRef.current();
        }
        return next;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex, timePerQuestion, isAdmin]);

  const pct      = timeLeft / timePerQuestion;
  const isUrgent = pct <= 0.25;
  const isWarn   = pct <= 0.5;
  const expired  = timerStateRef.current[questionIndex]?.expired;

  const borderColor = expired ? '#94a3b8' : isUrgent ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';
  const textColor   = expired ? '#64748b' : isUrgent ? '#dc2626' : isWarn ? '#d97706' : '#059669';
  const bgColor     = expired ? '#f1f5f9' : isUrgent ? '#fee2e2' : isWarn ? '#fef3c7' : '#d1fae5';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      padding: '0.5rem 1rem', background: bgColor,
      borderRadius: '10px', border: `2px solid ${borderColor}`,
      animation: (!expired && isUrgent) ? 'qtTimerWarning 0.5s infinite' : 'none',
      minWidth: '80px',
    }}>
      <div style={{ fontSize: '0.65rem', fontWeight: '800', color: textColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Q {questionIndex + 1}/{totalQuestions}
      </div>
      <div style={{
        fontSize: '1.3rem', fontWeight: '900', color: textColor, fontFamily: 'monospace',
        animation: (!expired && isUrgent) ? 'tickBlink 0.5s infinite' : 'none',
      }}>
        {expired ? 'Done' : TestUtils.formatShort(timeLeft)}
      </div>
      <div style={{ width: '100%', height: '3px', background: 'rgba(0,0,0,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: expired ? '0%' : `${pct * 100}%`,
          background: borderColor, borderRadius: '999px', transition: 'width 1s linear',
        }} />
      </div>
    </div>
  );
});

// ==========================================
// TOTAL TIMER — tick every second
// ==========================================
export const IsolatedTimer = React.memo(function IsolatedTimer({ timeLimit, onExpire, onTick, isAdmin }) {
  const onExpireRef = useRef(onExpire);
  const onTickRef   = useRef(onTick);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
  useEffect(() => { onTickRef.current   = onTick;   }, [onTick]);

  const [display, setDisplay]   = useState(TestUtils.formatTime(timeLimit * 60).display);
  const [pct, setPct]           = useState(100);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  const timeLeftRef  = useRef(timeLimit * 60);
  const firedRef     = useRef(false);
  const intervalRef  = useRef(null);
  const totalSecsRef = useRef(timeLimit * 60);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unlock = () => {
      const ctx = getAudioCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown',     unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown',     unlock);
    };
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    intervalRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      const left = timeLeftRef.current;
      setDisplay(TestUtils.formatTime(left).display);
      setPct((left / totalSecsRef.current) * 100);
      if (onTickRef.current) onTickRef.current(left);
      const isUrgentSound = left <= 10 && left > 0;
      playTick(isUrgentSound);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(intervalRef.current);
        if (onExpireRef.current) onExpireRef.current();
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const theme      = pct > 50 ? THEME.timer.safe : pct > 20 ? THEME.timer.warning : THEME.timer.critical;
  const isCritical = timeLeftRef.current < APP_CONFIG.CRITICAL_TIME_MINUTES * 60;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:isMobile?'0.5rem 1rem':'0.65rem 1.25rem', background:theme.bg, borderRadius:'12px', border:`3px solid ${theme.border}` }}>
      <Clock size={isMobile?18:22} color={theme.text} strokeWidth={2.5}
        style={{ animation: isCritical ? 'shake 0.6s infinite' : 'none' }} />
      <div style={{ fontSize:isMobile?'1.1rem':'1.4rem', fontWeight:'900', color:theme.text, fontFamily:'monospace',
        animation: isCritical ? 'tickBlink 1s infinite' : 'none' }}>
        {display}
      </div>
    </div>
  );
});

// ==========================================
// EXAM PROGRESS BAR
// Place this BELOW the options in your question card:
//
//   <QuestionCard>
//     <QuestionText />
//     <OptionsGrid />          ← options first
//     <ExamProgressBar />      ← then progress bar
//   </QuestionCard>
//
// ==========================================
export const ExamProgressBar = React.memo(function ExamProgressBar({
  questions,
  answers,
  timerStateRef,
  currentQuestion,
  isMobile,
  onQuestionClick,
  // NOTE: headerHeight & sticky removed — bar now lives INSIDE question card flow
  // If you still want sticky, pass sticky={true}
  sticky = false,
  headerHeight,
}) {
  const total         = questions.length;
  const answeredCount = questions.filter((_, idx) => answers[idx] !== undefined).length;
  const expiredCount  = questions.filter((_, idx) =>
    timerStateRef.current[idx]?.expired === true && answers[idx] === undefined
  ).length;

  const pct    = total > 0 ? (answeredCount / total) * 100 : 0;
  const allDone = answeredCount === total;

  const fillGradient = allDone
    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
    : pct >= 66
    ? 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)'
    : pct >= 33
    ? 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)'
    : pct > 0
    ? 'linear-gradient(90deg, #94a3b8 0%, #64748b 100%)'
    : 'transparent';

  const pillSize     = isMobile
    ? (total > 15 ? 22 : total > 10 ? 26 : 30)
    : (total > 20 ? 26 : total > 15 ? 30 : 34);
  const pillFontSize = pillSize <= 24 ? '0.55rem' : pillSize <= 28 ? '0.6rem' : '0.65rem';

  const wrapperStyle = sticky
    ? {
        position: 'sticky',
        top: headerHeight || (isMobile ? 70 : 86),
        zIndex: 998,
        background: '#fff',
        borderBottom: '2px solid #e2e8f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }
    : {
        // Inline inside question card — styled as a card section
        background: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        borderRadius: '14px',
        marginTop: '1.25rem',
      };

  return (
    <div style={{
      ...wrapperStyle,
      padding: isMobile ? '0.6rem 0.75rem 0.7rem' : '0.75rem 1.25rem 0.85rem',
    }}>
      <style>{`
        @keyframes progressShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes pillPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.55); }
          50%      { box-shadow: 0 0 0 5px rgba(99,102,241,0.0); }
        }
        .exam-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-weight: 800;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          user-select: none;
          flex-shrink: 0;
          border: 1.5px solid transparent;
          box-sizing: border-box;
        }
        .exam-pill.clickable { cursor: pointer; }
        .exam-pill.clickable:hover { transform: translateY(-2px) scale(1.12); }
        .exam-pill.pill-current { animation: pillPulse 1.4s ease infinite; }
      `}</style>

      {/* Top row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px', gap:'8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'0.67rem', fontWeight:'800', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Exam Progress
          </span>
          {expiredCount > 0 && (
            <span style={{ fontSize:'0.6rem', fontWeight:'800', color:'#fff', background:'#94a3b8', borderRadius:'4px', padding:'1px 5px' }}>
              {expiredCount} skipped
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'0.72rem', fontWeight:'900', color: allDone ? '#059669' : '#475569', transition:'color 0.4s' }}>
            {allDone ? '✓ All Done' : `${answeredCount} / ${total} answered`}
          </span>
          <span style={{
            fontSize:'0.7rem', fontWeight:'900', color:'#fff', fontFamily:'monospace',
            background: allDone ? '#059669' : pct >= 66 ? '#6366f1' : pct >= 33 ? '#f97316' : '#94a3b8',
            borderRadius:'6px', padding:'2px 7px', minWidth:'36px', textAlign:'center',
            transition:'background 0.4s ease',
          }}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>

      {/* Main bar */}
      <div style={{ width:'100%', height: isMobile ? '7px' : '9px', background:'#f1f5f9', borderRadius:'999px', overflow:'hidden', border:'1.5px solid #e2e8f0', position:'relative', marginBottom:'8px' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:fillGradient, borderRadius:'999px', transition:'width 0.55s cubic-bezier(0.4,0,0.2,1), background 0.4s ease', position:'relative', overflow:'hidden' }}>
          {pct > 0 && pct < 100 && (
            <div style={{ position:'absolute', top:0, left:0, width:'30%', height:'100%', background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', animation:'progressShimmer 1.8s ease-in-out infinite' }} />
          )}
        </div>
      </div>

      {/* Numbered pills */}
      <div style={{ display:'flex', flexWrap:'wrap', gap: isMobile ? '3px' : '4px' }}>
        {questions.map((_, idx) => {
          const isAnswered  = answers[idx] !== undefined;
          const isExpired   = timerStateRef.current[idx]?.expired === true && !isAnswered;
          const isCurr      = idx === currentQuestion;
          const isClickable = typeof onQuestionClick === 'function';

          let bg = '#f8fafc', color = '#94a3b8', border = '#e2e8f0';
          if (isAnswered)              { bg = '#10b981'; color = '#fff'; border = '#059669'; }
          else if (isExpired)          { bg = '#e2e8f0'; color = '#94a3b8'; border = '#cbd5e1'; }
          else if (isCurr)             { bg = '#6366f1'; color = '#fff'; border = '#4f46e5'; }

          return (
            <div
              key={idx}
              title={isAnswered ? `Q${idx+1} ✓` : isExpired ? `Q${idx+1} skipped` : isCurr ? `Q${idx+1} current` : `Q${idx+1}`}
              className={[
                'exam-pill',
                isCurr && !isAnswered && !isExpired ? 'pill-current' : '',
                isClickable ? 'clickable' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => {
                if (isClickable) { onQuestionClick(idx); scrollToQuestion(idx); }
              }}
              style={{ width:pillSize, height:pillSize, background:bg, color, borderColor:border, fontSize:pillFontSize }}
            >
              {isExpired ? '✕' : idx + 1}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {(!isMobile || expiredCount > 0) && (
        <div style={{ display:'flex', gap:'12px', marginTop:'6px', flexWrap:'wrap' }}>
          {[
            { bg:'#10b981', label:'Answered' },
            { bg:'#6366f1', label:'Current' },
            { bg:'#e2e8f0', label:'Skipped', color:'#94a3b8' },
            { bg:'#f8fafc', label:'Remaining', color:'#94a3b8', border:'#e2e8f0' },
          ].map(({ bg, label, color, border }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'3px', background:bg, border: border ? `1px solid ${border}` : 'none', flexShrink:0 }} />
              <span style={{ fontSize:'0.6rem', fontWeight:'700', color: color || '#64748b', whiteSpace:'nowrap' }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});