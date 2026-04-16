// @ts-nocheck
// FILE LOCATION: src/components/ExamComponents.jsx
// ✅ FIX-AUDIO:  playTick, getAudioCtx, unlockAudio — sab remove kar diye
// ✅ FIX-AUDIO:  QuestionTimer + IsolatedTimer se sab audio calls hataye
// ✅ FIX-TIMER:  Wall-clock based startedAt — tab switch ke baad bhi accurate

import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { APP_CONFIG, THEME, TestUtils } from './utils';

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

export function OptionsGrid({
  options = [],
  selected = null,
  onSelect,
  disabled = false,
  expired = false,
  correctIndex = null,
  labels,
  isMobile,
}) {
  const defaultLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const L = labels || defaultLabels;
  const revealed = correctIndex !== null;

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
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding: 12px 10px;
          border-radius: 14px;
          border: 2px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
          box-sizing: border-box;
          min-height: 60px;
          position: relative;
          overflow: hidden;
        }
        .option-cell:hover:not(.opt-disabled):not(.opt-selected):not(.opt-expired) {
          border-color: #a5b4fc;
          background: #f5f3ff;
          box-shadow: 0 2px 10px rgba(99,102,241,0.10);
        }
        .option-cell:active:not(.opt-disabled):not(.opt-expired) {
          animation: optionPop 0.18s ease forwards;
        }
        .opt-selected  { border-color: #6366f1 !important; background: #eef2ff !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.18) !important; }
        .opt-correct   { border-color: #10b981 !important; background: #d1fae5 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.18) !important; }
        .opt-wrong     { border-color: #ef4444 !important; background: #fee2e2 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }
        .opt-expired   { border-color: #e2e8f0 !important; background: #f8fafc !important; opacity: 0.6; cursor: not-allowed !important; }
        .opt-disabled  { cursor: not-allowed; }
        .opt-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 7px;
          font-size: 0.78rem;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 1px;
          transition: background 0.18s, color 0.18s;
        }
        .opt-text {
          font-size: clamp(0.82rem, 2vw, 0.95rem);
          font-weight: 600;
          color: #1e293b;
          line-height: 1.45;
          flex: 1;
        }
        .opt-expired .opt-text { color: #94a3b8; }
      `}</style>

      {expired && (
        <div style={{
          marginTop: '0.75rem',
          padding: '8px 14px',
          background: '#fef3c7',
          border: '1.5px solid #fde68a',
          borderRadius: '10px',
          fontSize: '0.82rem',
          fontWeight: '700',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <Clock size={14} color="#d97706" />
          Time up — this question was skipped automatically
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isMobile ? '10px' : '12px',
        width: '100%',
        marginTop: '0.85rem',
      }}>
        {options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect  = revealed && idx === correctIndex;
          const isWrong    = revealed && isSelected && idx !== correctIndex;

          let labelBg    = '#f1f5f9';
          let labelColor = '#64748b';
          if (isSelected && !revealed) { labelBg = '#6366f1'; labelColor = '#fff'; }
          if (isCorrect)               { labelBg = '#10b981'; labelColor = '#fff'; }
          if (isWrong)                 { labelBg = '#ef4444'; labelColor = '#fff'; }
          if (expired)                 { labelBg = '#e2e8f0'; labelColor = '#94a3b8'; }

          const cellClass = [
            'option-cell',
            isSelected && !revealed && !expired ? 'opt-selected' : '',
            isCorrect  ? 'opt-correct'  : '',
            isWrong    ? 'opt-wrong'    : '',
            expired    ? 'opt-expired'  : '',
            (disabled && !expired) ? 'opt-disabled' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={idx}
              className={cellClass}
              onClick={() => {
                if (disabled || revealed || expired) return;
                if (onSelect) onSelect(idx);
              }}
              disabled={disabled || expired}
              aria-pressed={isSelected}
            >
              <span className="opt-label" style={{ background: labelBg, color: labelColor }}>
                {L[idx] || idx + 1}
              </span>
              <span className="opt-text">{opt}</span>
              {isCorrect && <span style={{ fontSize:'1rem', flexShrink:0 }}>✓</span>}
              {isWrong   && <span style={{ fontSize:'1rem', flexShrink:0 }}>✗</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

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
    keyword:     '#c792ea',
    builtin:     '#82aaff',
    string:      '#c3e88d',
    number:      '#f78c6c',
    comment:     '#546e7a',
    operator:    '#89ddff',
    function:    '#82aaff',
    punctuation: '#89ddff',
    identifier:  '#eeffff',
    space:       'inherit',
    other:       '#eeffff',
  };

  return (
    <div style={{
      background: '#000000',
      border: '2px solid #222',
      borderRadius: '12px',
      overflow: 'hidden',
      marginTop: '14px',
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 2,
    }}>
      <div style={{
        background: '#111111',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}>
        <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#ff5f57' }} />
        <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#febc2e' }} />
        <div style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#28c840' }} />
        <span style={{ marginLeft:'8px', fontSize:'11px', color:'#546e7a', fontFamily:'monospace' }}>python</span>
      </div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <pre style={{
          margin: 0,
          padding: '14px 16px',
          fontFamily: "Consolas, Monaco, 'Courier New', monospace",
          fontSize: 'clamp(0.78rem, 1.8vw, 0.92rem)',
          lineHeight: 1.75,
          fontWeight: '500',
          whiteSpace: 'pre',
          color: '#eeffff',
        }}>
          {code.split('\n').map((line, li) => (
            <div key={li}>
              {tokenize(line).map((tok, ti) => (
                <span key={ti} style={{ color: colorMap[tok.type] || '#eeffff' }}>{tok.value}</span>
              ))}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export function WarningModal({ show, message, type, tabSwitches, onAcknowledge, initialCountdown }) {
  const [countdown, setCountdown]    = useState(() => initialCountdown ?? 20);
  const timerRef                     = useRef(null);
  const onAcknowledgeRef             = useRef(onAcknowledge);
  useEffect(() => { onAcknowledgeRef.current = onAcknowledge; }, [onAcknowledge]);
  useEffect(() => { if (show) setCountdown(initialCountdown ?? 20); }, [show, initialCountdown]);

  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!show) return;

    window.history.pushState(null, '', window.location.href);
    const blockBack = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBack);

    const isFinal    = type === 'final';
    const isCritical = type === 'critical';
    const isDevtools = type === 'devtools-warning';
    const needsTimer = isFinal || isCritical || isDevtools;

    const startVal = isFinal
      ? Math.max(15, initialCountdown ?? 15)
      : (initialCountdown ?? 20);

    setCountdown(startVal);

    if (needsTimer) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(timerRef.current);
            onAcknowledgeRef.current();
            return 0;
          }
          return next;
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
  const totalSecs  = isFinal
    ? Math.max(15, initialCountdown ?? 15)
    : (initialCountdown ?? 20);

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
        {isDevtools && <div style={{ fontSize:'clamp(1rem,4vw,1.4rem)', fontWeight:'900', color:'#a78bfa', marginBottom:'0.75rem', animation:'devtoolsPulse 1s infinite' }}>DEVELOPER TOOLS DETECTED</div>}
        <div style={{ fontSize:'clamp(0.82rem,3.5vw,1rem)', fontWeight:'600', color:s.color, lineHeight:1.7, whiteSpace:'pre-line', marginBottom:'1rem', textAlign:'left', wordBreak:'break-word' }}>{message}</div>
        {tabSwitches > 0 && (type === 'critical' || type === 'final') && (
          <div style={{ fontSize:'0.85rem', fontWeight:'900', color:s.iconColor, padding:'0.5rem 1rem', background:'rgba(0,0,0,0.3)', borderRadius:'8px', marginBottom:'1rem', border:`2px solid ${s.iconColor}40`, display:'inline-block' }}>
            Violations: {tabSwitches} / {APP_CONFIG.MAX_TAB_SWITCHES}
          </div>
        )}
        {needsOk && (
          <div style={{ marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.6)', marginBottom:'0.5rem', fontWeight:'600' }}>
              {isDevtools
                ? <>Auto-submitting in <span style={{ color:s.iconColor, fontWeight:'900' }}>{countdown}s</span></>
                : isFinal
                ? <>Auto-dismissing in <span style={{ color:s.iconColor, fontWeight:'900' }}>{countdown}s</span></>
                : <>Continuing in <span style={{ color:s.iconColor, fontWeight:'900' }}>{countdown}s</span></>
              }
            </div>
            <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'999px', height:'6px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(countdown / totalSecs) * 100}%`, background: isDevtools ? '#7c3aed' : isFinal ? '#ef4444' : '#f59e0b', borderRadius:'999px', transition:'width 1s linear' }} />
            </div>
          </div>
        )}
        {needsOk && (
          <button
            onClick={onAcknowledge}
            style={{ width:'100%', padding:'0.875rem 1rem', background: isDevtools ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : isFinal ? 'linear-gradient(135deg,#dc2626,#7f1d1d)' : 'linear-gradient(135deg,#f59e0b,#b45309)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'clamp(0.8rem,3.5vw,0.95rem)', fontWeight:'900', cursor:'pointer', letterSpacing:'0.03em', lineHeight:1.4 }}
          >
            {isFinal    ? 'I understand — I accept this disqualification'
            : isDevtools ? 'I am closing Developer Tools now'
            :              'I understand — I will NOT violate rules again'}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// QUESTION TIMER
// ✅ FIX-AUDIO: All playTick / unlockAudio calls removed
// ✅ FIX-TIMER: startedAt wall-clock based — survives tab switches
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
    timerStateRef.current[questionIndex] = {
      timeLeft:  timePerQuestion,
      expired:   false,
      startedAt: Date.now(),
    };
  }

  const slot = timerStateRef.current[questionIndex];
  const [timeLeft, setTimeLeft] = useState(slot.timeLeft);
  const firedRef    = useRef(slot.expired);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    if (!timerStateRef.current[questionIndex]) {
      timerStateRef.current[questionIndex] = {
        timeLeft:  timePerQuestion,
        expired:   false,
        startedAt: Date.now(),
      };
    }
    const current = timerStateRef.current[questionIndex];

    if (current.expired) {
      firedRef.current = true;
      setTimeLeft(0);
      return;
    }

    if (!current.startedAt) {
      current.startedAt = Date.now() - (timePerQuestion - current.timeLeft) * 1000;
    }

    firedRef.current = false;
    setTimeLeft(current.timeLeft);

    if (isAdmin) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (firedRef.current) return;
      const elapsed = Math.floor((Date.now() - timerStateRef.current[questionIndex].startedAt) / 1000);
      const next    = Math.max(0, timePerQuestion - elapsed);

      setTimeLeft(next);
      timerStateRef.current[questionIndex].timeLeft = next;

      if (next <= 0 && !firedRef.current) {
        firedRef.current = true;
        timerStateRef.current[questionIndex].expired = true;
        clearInterval(intervalRef.current);
        onExpireRef.current();
      }
    }, 500);

    const onVisible = () => {
      if (document.hidden || firedRef.current) return;
      const elapsed = Math.floor((Date.now() - timerStateRef.current[questionIndex].startedAt) / 1000);
      const next    = Math.max(0, timePerQuestion - elapsed);
      setTimeLeft(next);
      timerStateRef.current[questionIndex].timeLeft = next;
      if (next <= 0 && !firedRef.current) {
        firedRef.current = true;
        timerStateRef.current[questionIndex].expired = true;
        clearInterval(intervalRef.current);
        onExpireRef.current();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex, timePerQuestion, isAdmin]);

  const expired  = timerStateRef.current[questionIndex]?.expired ?? false;
  const pct      = timePerQuestion > 0 ? timeLeft / timePerQuestion : 0;
  const isUrgent = pct <= 0.25 && !expired;
  const isWarn   = pct <= 0.5  && !expired;

  const borderColor = expired ? '#cbd5e1' : isUrgent ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';
  const textColor   = expired ? '#94a3b8' : isUrgent ? '#dc2626' : isWarn ? '#d97706' : '#059669';
  const bgColor     = expired ? '#f8fafc' : isUrgent ? '#fee2e2' : isWarn ? '#fef3c7' : '#d1fae5';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3px',
      padding: '5px 12px',
      background: bgColor,
      borderRadius: '10px',
      border: `2px solid ${borderColor}`,
      minWidth: '72px',
      animation: isUrgent ? 'qtTimerWarning 0.5s infinite' : 'none',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      <div style={{ fontSize:'0.6rem', fontWeight:'800', color: textColor, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
        Q {questionIndex + 1}/{totalQuestions}
      </div>
      <div style={{
        fontSize: '1.25rem',
        fontWeight: '900',
        color: textColor,
        fontFamily: 'monospace',
        lineHeight: 1,
        animation: isUrgent ? 'tickBlink 0.5s infinite' : 'none',
      }}>
        {expired ? '—' : TestUtils.formatShort(timeLeft)}
      </div>
      <div style={{ width:'100%', height:'3px', background:'rgba(0,0,0,0.08)', borderRadius:'999px', overflow:'hidden' }}>
        <div style={{
          height: '100%',
          width: expired ? '0%' : `${pct * 100}%`,
          background: borderColor,
          borderRadius: '999px',
          transition: 'width 0.5s linear',
        }} />
      </div>
    </div>
  );
});

// ==========================================
// ISOLATED TIMER (Global exam timer)
// ✅ FIX-AUDIO: All playTick / unlockAudio calls removed
// ✅ FIX-TIMER: Wall-clock based startedAt — tab switch pe bhi timer accurate
// ==========================================
export const IsolatedTimer = React.memo(function IsolatedTimer({ timeLimit, onExpire, onTick, isAdmin }) {
  const onExpireRef  = useRef(onExpire);
  const onTickRef    = useRef(onTick);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
  useEffect(() => { onTickRef.current   = onTick;   }, [onTick]);

  const totalSecs     = useRef(timeLimit * 60);
  const startedAtRef  = useRef(Date.now());
  const firedRef      = useRef(false);
  const intervalRef   = useRef(null);

  const [display, setDisplay]   = useState(TestUtils.formatTime(timeLimit * 60).display);
  const [pct, setPct]           = useState(100);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', r, { passive: true });
    return () => window.removeEventListener('resize', r);
  }, []);

  useEffect(() => {
    if (isAdmin) return;

    const getLeft = () => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      return Math.max(0, totalSecs.current - elapsed);
    };

    const update = () => {
      if (firedRef.current) return;
      const left = getLeft();
      setDisplay(TestUtils.formatTime(left).display);
      setPct((left / totalSecs.current) * 100);
      if (onTickRef.current) onTickRef.current(left);

      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(intervalRef.current);
        if (onExpireRef.current) onExpireRef.current();
      }
    };

    intervalRef.current = setInterval(update, 500);

    const onVisible = () => {
      if (!document.hidden) update();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const theme      = pct > 50 ? THEME.timer.safe : pct > 20 ? THEME.timer.warning : THEME.timer.critical;
  const isCritical = pct <= 20;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: isMobile ? '5px 10px' : '6px 14px',
      background: theme.bg,
      borderRadius: '10px',
      border: `2px solid ${theme.border}`,
      transition: 'background 0.4s, border-color 0.4s',
    }}>
      <Clock
        size={isMobile ? 16 : 18}
        color={theme.text}
        strokeWidth={2.5}
        style={{ animation: isCritical ? 'shake 0.6s infinite' : 'none', flexShrink: 0 }}
      />
      <div>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          fontWeight: '900',
          color: theme.text,
          fontFamily: 'monospace',
          lineHeight: 1,
          animation: isCritical ? 'tickBlink 1s infinite' : 'none',
        }}>
          {display}
        </div>
        <div style={{ fontSize:'0.58rem', fontWeight:'700', color: theme.text, opacity: 0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          total
        </div>
      </div>
    </div>
  );
});

export const ExamProgressBar = React.memo(function ExamProgressBar({
  questions,
  answers,
  timerStateRef,
  currentQuestion,
  isMobile,
}) {
  const total         = questions.length;
  const answeredCount = questions.filter((_, idx) => answers[idx] !== undefined).length;
  const expiredCount  = questions.filter((_, idx) =>
    timerStateRef.current[idx]?.expired === true && answers[idx] === undefined
  ).length;

  const pct    = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const allDone = answeredCount === total;

  const fillColor = allDone
    ? '#10b981'
    : pct >= 66 ? '#6366f1'
    : pct >= 33 ? '#f59e0b'
    : pct > 0   ? '#94a3b8'
    : 'transparent';

  return (
    <div style={{
      background: '#f8fafc',
      border: '1.5px solid #e2e8f0',
      borderRadius: '14px',
      padding: isMobile ? '10px 12px' : '12px 16px',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'7px' }}>
        <span style={{ fontSize:'0.68rem', fontWeight:'800', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          Exam Progress
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          {expiredCount > 0 && (
            <span style={{ fontSize:'0.62rem', fontWeight:'800', color:'#92400e', background:'#fef3c7', borderRadius:'5px', padding:'1px 6px' }}>
              {expiredCount} skipped
            </span>
          )}
          <span style={{
            fontSize:'0.7rem', fontWeight:'900',
            color: '#fff',
            background: allDone ? '#10b981' : pct >= 66 ? '#6366f1' : pct >= 33 ? '#f59e0b' : '#94a3b8',
            borderRadius: '6px',
            padding: '2px 8px',
            minWidth: '36px',
            textAlign: 'center',
            transition: 'background 0.4s',
          }}>
            {pct}%
          </span>
        </div>
      </div>

      <div style={{ width:'100%', height: isMobile ? '6px' : '8px', background:'#e2e8f0', borderRadius:'999px', overflow:'hidden', marginBottom:'8px' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: fillColor,
          borderRadius: '999px',
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1), background 0.4s',
        }} />
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'0.7rem', fontWeight:'700', color: allDone ? '#059669' : '#64748b' }}>
          {allDone ? 'All questions answered' : `${answeredCount} of ${total} answered`}
        </span>
        <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:'600' }}>
          Q{currentQuestion + 1} active
        </span>
      </div>
    </div>
  );
});