// @ts-nocheck
// FILE LOCATION: src/components/ExamScreens.jsx
// InstructionScreen and TestInterface components
//
// FIXES APPLIED:
// ✅ FIX-1:  New mobile layout — question card → 2x2 options → progress bar → sticky footer
// ✅ FIX-2:  No Skip button — Next only
// ✅ FIX-3:  Submit confirmation step before final submit (prevents accidental mobile taps)
// ✅ FIX-4:  window.scrollTo instant (not smooth) on question change — better on iOS
// ✅ FIX-5:  Expired question options show locked state via `expired` prop
// ✅ FIX-6:  Header simplified — title + Q number + 2 timer chips only
// ✅ FIX-7:  All text English only
// ✅ FIX-8:  Footer always visible, full-width button
// ✅ FIX-9:  Removed unused 'unansweredCount' variable (ESLint warning fix)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, CheckCircle, Shield, BookOpen, EyeOff, AlertCircle } from 'lucide-react';

import {
  APP_CONFIG,
  TestUtils,
  AudioManager,
  FullscreenManager,
  DesktopModeEnforcer,
  DevToolsDetector,
  SecurityManager,
  NetworkGuard,
  VisibilityManager,
  CleanupManager,
} from './utils';

import {
  Watermark,
  WarningModal,
  SyntaxHighlight,
  QuestionTimer,
  IsolatedTimer,
  ExamProgressBar,
} from './ExamComponents';

// ==========================================
// INSTRUCTION SCREEN
// ==========================================
export function InstructionScreen({ onAccept, testTitle, timeLimit, totalQuestions, passPercent, timePerQuestion }) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const sels = ['nav','header','footer','.navbar','.header','.footer','.telegram-button','#telegram-button','.TelegramButton','[class*="telegram"]','.background','.Background','[class*="background"]','.toast-container','.ToastContainer','[class*="razorpay"]','[id*="razorpay"]'];
    const hidden = [];
    sels.forEach(s => {
      try {
        document.querySelectorAll(s).forEach(el => {
          if (el) { hidden.push({ el, d:el.style.display, v:el.style.visibility }); el.style.display='none'; el.style.visibility='hidden'; }
        });
      } catch (e) {}
    });
    return () => hidden.forEach(({ el, d, v }) => { if (el) { el.style.display=d||''; el.style.visibility=v||''; } });
  }, []);

  const inactivityMin = Math.max(1, Math.round(timeLimit * APP_CONFIG.INACTIVITY_PERCENT));
  const tpqFormatted  = timePerQuestion >= 60
    ? `${Math.floor(timePerQuestion/60)}m ${timePerQuestion%60 > 0 ? timePerQuestion%60+'s' : ''}`
    : `${timePerQuestion}s`;

  const instructions = [
    { text: `Test duration is ${timeLimit} minutes. Timer starts immediately.` },
    { text: `Each question has its own ${tpqFormatted} timer. Unanswered questions auto-advance to the next. Once a question's time runs out, you cannot return to it.`, highlight: true },
    { text: `Once you move forward from a question, you cannot go back to it.`, highlight: true },
    { text: `Tab switching is BANNED — 1 switch = instant DISQUALIFICATION.`, danger: true },
    { text: `Pressing the Windows key ${APP_CONFIG.MAX_WINDOWS_KEY_PRESSES} times = DISQUALIFICATION.`, danger: true },
    { text: `Opening Developer Tools (F12) = instant DISQUALIFICATION.`, danger: true },
    { text: 'Copy, paste, right-click, printing, saving and Ctrl+U are completely blocked.' },
    { text: 'Browser screen recording is blocked automatically.' },
    { text: 'Test runs in fullscreen — exiting triggers a warning and auto-returns.' },
    { text: 'Your name and email are watermarked on every screen permanently.' },
    { text: `Inactivity for ${inactivityMin} minute${inactivityMin > 1 ? 's' : ''} will trigger a warning.` },
    { text: 'Questions and answer options are shuffled — every student gets a different order.', highlight: true },
    { text: `Score ${passPercent}% or above to PASS and receive a Certificate of Achievement.` },
    { text: 'Cheating = FAIL + permanent record + zero refund + no certificate.', danger: true },
  ];

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'#f8fafc', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'1rem', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
      <div style={{ width:'100%', maxWidth:'680px', padding:'1rem 0' }}>

        {/* Title card */}
        <div style={{ background:'#fff', border:'3px solid #e2e8f0', borderRadius:'20px', padding:'1.5rem', marginBottom:'1rem', boxShadow:'0 8px 24px rgba(0,0,0,0.08)', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:'50px', padding:'0.5rem 1.25rem', marginBottom:'1rem' }}>
            <Shield size={18} color="#3b82f6" />
            <span style={{ color:'#1d4ed8', fontWeight:'800', fontSize:'0.85rem', letterSpacing:'0.06em' }}>EXAM INSTRUCTIONS</span>
          </div>
          <h1 style={{ fontSize:'clamp(1.3rem,5vw,1.9rem)', fontWeight:'800', color:'#1e293b', margin:'0 0 0.75rem' }}>{testTitle}</h1>
          <div style={{ display:'flex', justifyContent:'center', gap:'1.5rem', flexWrap:'wrap' }}>
            {[
              { label:'Duration',     value:`${timeLimit} min` },
              { label:'Questions',    value:`${totalQuestions}` },
              { label:'Per question', value:tpqFormatted },
              { label:'Pass mark',    value:`${passPercent}%` },
            ].map((s, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.3rem', fontWeight:'900', color:'#3b82f6' }}>{s.value}</div>
                <div style={{ fontSize:'0.72rem', color:'#64748b', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div style={{ background:'#fff', border:'3px solid #e2e8f0', borderRadius:'20px', padding:'1.5rem', marginBottom:'1rem', boxShadow:'0 8px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
            <BookOpen size={18} color="#3b82f6" />
            <span style={{ color:'#1e293b', fontWeight:'800', fontSize:'0.95rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>Rules & Instructions</span>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem', marginBottom:'1.5rem' }}>
            {instructions.map((item, idx) => (
              <div key={idx} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.875rem 1rem', background:item.danger?'#fff5f5':item.highlight?'#f0fdf4':'#f8fafc', border:`1.5px solid ${item.danger?'#fecaca':item.highlight?'#bbf7d0':'#e2e8f0'}`, borderRadius:'12px' }}>
                <div style={{ width:'24px', height:'24px', minWidth:'24px', borderRadius:'7px', border:`2px solid ${item.danger?'#f87171':item.highlight?'#4ade80':'#cbd5e1'}`, background:item.danger?'#fee2e2':item.highlight?'#dcfce7':'#fff', display:'flex', alignItems:'center', justifyContent:'center', color:item.danger?'#dc2626':item.highlight?'#16a34a':'#64748b', fontWeight:'800', fontSize:'0.78rem' }}>{idx + 1}</div>
                <span style={{ color:item.danger?'#991b1b':item.highlight?'#15803d':'#475569', fontSize:'clamp(0.82rem,2.5vw,0.92rem)', fontWeight:item.danger||item.highlight?'700':'500', lineHeight:1.55, flex:1 }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Checkbox */}
          <div
            onClick={() => setAccepted(!accepted)}
            style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1.25rem', background:accepted?'#f0fdf4':'#fff', border:`2px solid ${accepted?'#10b981':'#e2e8f0'}`, borderRadius:'14px', cursor:'pointer', transition:'all 0.2s' }}
          >
            <div style={{ width:'30px', height:'30px', minWidth:'30px', borderRadius:'8px', border:`2.5px solid ${accepted?'#10b981':'#cbd5e1'}`, background:accepted?'#10b981':'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0 }}>
              {accepted && <CheckCircle size={18} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ color:accepted?'#065f46':'#475569', fontSize:'clamp(0.88rem,2.5vw,1rem)', fontWeight:accepted?'700':'600', lineHeight:1.4, flex:1 }}>
              I have read all instructions and I will NOT cheat under any circumstances.
            </span>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => accepted && onAccept()}
          disabled={!accepted}
          style={{ width:'100%', padding:'1.1rem', background:accepted?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0', border:'none', borderRadius:'16px', color:accepted?'#fff':'#94a3b8', fontSize:'1.05rem', fontWeight:'800', cursor:accepted?'pointer':'not-allowed', boxShadow:accepted?'0 8px 24px rgba(16,185,129,0.35)':'none', transition:'all 0.3s' }}
        >
          {accepted ? 'Start Test' : 'Accept instructions to continue'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// TEST INTERFACE
// ==========================================
export function TestInterface({ questions, onComplete, testTitle, timeLimit, userEmail, studentInfo, passPercent, timePerQuestion }) {
  const [currentQuestion, setCurrentQuestion]     = useState(0);
  const [answers, setAnswers]                     = useState({});
  const answersRef                                = useRef({});
  const [tabSwitches, setTabSwitches]             = useState(0);
  const [blurCount, setBlurCount]                 = useState(0);
  const [showWarning, setShowWarning]             = useState(false);
  const [warningMsg, setWarningMsg]               = useState('');
  const [warningType, setWarningType]             = useState('normal');
  const [warningInitialCountdown, setWarningInitialCountdown] = useState(20);
  const [isDisqualified, setIsDisqualified]       = useState(false);
  const [isContentBlurred, setIsContentBlurred]   = useState(false);
  const [isMobile, setIsMobile]                   = useState(() => window.innerWidth <= 768);
  // Submit confirmation state
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const timerStateRef   = useRef({});
  const startTimeRef    = useRef(Date.now());
  const audioRef        = useRef(new AudioManager());
  const securityRef     = useRef(null);
  const devToolsRef     = useRef(null);
  const warningTimerRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const tabSwitchRef    = useRef(0);
  const blurCountRef    = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const inactivityRef   = useRef(null);
  const handleSubmitRef = useRef(null);
  const tabSwitchHappeningRef = useRef(false);
  const isDisqualifiedRef     = useRef(false);

  const isAdmin           = TestUtils.isAdmin(userEmail);
  const answeredCount     = Object.keys(answers).length;
  const studentName       = studentInfo?.fullName || 'Student';
  const inactivityLimitMs = Math.max(60000, timeLimit * 60 * 1000 * APP_CONFIG.INACTIVITY_PERCENT);
  const isLastQuestion    = currentQuestion === questions.length - 1;

  const allAnswered = questions.every((_, idx) =>
    answers[idx] !== undefined || timerStateRef.current[idx]?.expired === true
  );

  // ── helpers ──────────────────────────────

  const setIsDisqualifiedSynced = useCallback((val) => {
    isDisqualifiedRef.current = val;
    setIsDisqualified(val);
  }, []);

  const resetActivity = useCallback(() => { lastActivityRef.current = Date.now(); }, []);

  const showWarningMessage = useCallback((message, type = 'normal', mustAck = false) => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
    const needsOk = mustAck || type === 'critical' || type === 'final' || type === 'devtools-warning';
    setWarningInitialCountdown(20);
    setWarningMsg(message);
    setWarningType(type);
    setShowWarning(true);
    if (!needsOk) warningTimerRef.current = setTimeout(() => setShowWarning(false), APP_CONFIG.WARNING_TIMEOUT);
  }, []);

  const handleAcknowledge = useCallback(() => setShowWarning(false), []);

  const handleTimerTick = useCallback((left) => {
    try { audioRef.current.playTick(left % 2 === 0); } catch (e) {}
  }, []);

  const handleTimerExpire = useCallback(() => {
    try { audioRef.current.playAlarm(); } catch (e) {}
    showWarningMessage('TIME IS UP!\n\nYour test is being submitted automatically.', 'final', true);
    if (handleSubmitRef.current) handleSubmitRef.current(false, 'time-up');
  }, [showWarningMessage]);

  const handleQuestionTimerExpire = useCallback(() => {
    if (isDisqualifiedRef.current || hasSubmittedRef.current) return;
    setCurrentQuestion(prev => {
      if (prev < questions.length - 1) return prev + 1;
      if (handleSubmitRef.current) handleSubmitRef.current(false, 'time-up');
      return prev;
    });
  }, [questions.length]);

  const handleAnswer = useCallback((qIndex, optIdx) => {
    if (isDisqualifiedRef.current) return;
    resetActivity();
    answersRef.current = { ...answersRef.current, [qIndex]: optIdx };
    setAnswers(prev => ({ ...prev, [qIndex]: optIdx }));
  }, [resetActivity]);

  // Final submit
  const handleSubmit = useCallback((penalized = false, reason = '') => {
    if (hasSubmittedRef.current) return;
    FullscreenManager.exit();
    const currentAnswers   = answersRef.current;
    const answeredNow      = Object.keys(currentAnswers).length;
    const effectiveDone    = questions.filter((_, idx) =>
      currentAnswers[idx] !== undefined || timerStateRef.current[idx]?.expired === true
    ).length;
    if (!isAdmin && effectiveDone < questions.length && !penalized) {
      showWarningMessage(`Please answer all questions before submitting.\n(${answeredNow}/${questions.length} answered)`, 'normal');
      return;
    }
    hasSubmittedRef.current = true;
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const score     = TestUtils.calculateScore(currentAnswers, questions, tabSwitchRef.current, isAdmin, passPercent);
    CleanupManager.performFullCleanup();
    if (devToolsRef.current) devToolsRef.current.stop();
    onComplete({
      ...score,
      timeTaken: `${Math.floor(timeTaken/60)}m ${timeTaken%60}s`,
      tabSwitches: tabSwitchRef.current,
      penalized,
      disqualificationReason: reason,
      studentInfo,
    });
  }, [questions, isAdmin, studentInfo, onComplete, showWarningMessage, passPercent]);

  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  // Next question
  const handleNext = useCallback(() => {
    if (isDisqualified) return;
    resetActivity();
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(p => p + 1);
    }
  }, [currentQuestion, questions.length, isDisqualified, resetActivity]);

  // FIX: instant scroll — smooth is laggy on iOS
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentQuestion]);

  // ── setup / teardown ──────────────────────

  useEffect(() => {
    const sels = ['nav','header','footer','.navbar','.header','.footer','.menu','.toolbar','#toolbar','[role="navigation"]','[role="banner"]','[role="contentinfo"]','.telegram-button','#telegram-button','.TelegramButton','[class*="telegram"]','.background','.Background','[class*="background"]','.toast-container','.ToastContainer','[class*="toast"]','[class*="razorpay"]','[id*="razorpay"]','aside','.sidebar','#sidebar'];
    const hidden = [];
    sels.forEach(s => {
      try {
        document.querySelectorAll(s).forEach(el => {
          if (el && !el.closest('[data-test-interface]')) {
            hidden.push({ el, d:el.style.display, v:el.style.visibility });
            el.style.display='none'; el.style.visibility='hidden';
          }
        });
      } catch (e) {}
    });

    const orig = {
      overflow:     document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      position:     document.body.style.position,
      margin:       document.body.style.margin,
      padding:      document.body.style.padding,
      width:        document.body.style.width,
      height:       document.body.style.height,
    };
    document.body.style.overflow='hidden';
    document.documentElement.style.overflow='hidden';
    document.body.style.margin='0';
    document.body.style.padding='0';
    document.body.style.position='fixed';
    document.body.style.width='100%';
    document.body.style.height='100%';
    document.body.style.top='0';
    document.body.style.left='0';

    if (!isAdmin) {
      audioRef.current.init();
      securityRef.current = new SecurityManager(showWarningMessage, handleSubmitRef);
      securityRef.current.enable();
      NetworkGuard.enable();
      VisibilityManager.enable();
      devToolsRef.current = new DevToolsDetector(
        showWarningMessage,
        (penalized, reason) => { if (handleSubmitRef.current) handleSubmitRef.current(penalized, reason); }
      );
      devToolsRef.current.start();
      DesktopModeEnforcer.enable();
    }

    window.onbeforeunload = (e) => {
      if (!hasSubmittedRef.current) { e.preventDefault(); e.returnValue=''; return ''; }
    };

    const ca = audioRef.current;
    const cs = securityRef.current;
    const cd = devToolsRef.current;

    return () => {
      window.onbeforeunload = null;
      hidden.forEach(({ el, d, v }) => { if (el) { el.style.display=d||''; el.style.visibility=v||''; } });
      document.body.style.overflow=orig.overflow;
      document.documentElement.style.overflow=orig.htmlOverflow;
      document.body.style.position=orig.position;
      document.body.style.margin=orig.margin;
      document.body.style.padding=orig.padding;
      document.body.style.width=orig.width;
      document.body.style.height=orig.height;
      document.body.style.top=''; document.body.style.left='';
      ca.destroy();
      if (cs) cs.disable();
      if (cd) cd.stop();
      NetworkGuard.disable();
      VisibilityManager.disable();
      DesktopModeEnforcer.disable();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage]);

  // Resize
  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', r, { passive: true });
    return () => window.removeEventListener('resize', r);
  }, []);

  // Inactivity
  useEffect(() => {
    if (isAdmin) return;
    const events = ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','click'];
    events.forEach(e => document.addEventListener(e, resetActivity, { passive:true }));
    inactivityRef.current = setInterval(() => {
      if (hasSubmittedRef.current || isDisqualifiedRef.current) return;
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= inactivityLimitMs) {
        const m = Math.floor(idle / 60000);
        const s = Math.floor((idle % 60000) / 1000);
        showWarningMessage(
          `INACTIVITY DETECTED\n\nYou have been idle for ${m > 0 ? m+'m ' : ''}${s}s.\n\nStay active during the exam!`,
          'critical', true
        );
        lastActivityRef.current = Date.now();
      }
    }, 5000);
    return () => {
      events.forEach(e => document.removeEventListener(e, resetActivity));
      if (inactivityRef.current) clearInterval(inactivityRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, inactivityLimitMs, resetActivity, showWarningMessage]);

  // Fullscreen
  useEffect(() => {
    if (isAdmin) return;
    const handler = () => {
      if (tabSwitchHappeningRef.current) return;
      if (!FullscreenManager.isActive() && !hasSubmittedRef.current && !isDisqualifiedRef.current) {
        showWarningMessage('You exited fullscreen mode. Returning to fullscreen...', 'normal');
        setTimeout(() => FullscreenManager.enter(), 1500);
      }
    };
    return FullscreenManager.onChange(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage]);

  // Tab switch → instant disqualify
  useEffect(() => {
    if (isAdmin) return;
    const handler = () => {
      if (!document.hidden || hasSubmittedRef.current || isDisqualifiedRef.current) return;
      tabSwitchHappeningRef.current = true;
      setTimeout(() => { tabSwitchHappeningRef.current = false; }, 3000);
      const n = tabSwitchRef.current + 1;
      tabSwitchRef.current = n;
      setTabSwitches(n);
      setIsDisqualifiedSynced(true);
      showWarningMessage(
        `DISQUALIFIED — Tab Switch Detected!\n\nYou left the exam window.\nTest is being submitted as FAIL.\nNo certificate will be issued.`,
        'final', true
      );
      setTimeout(() => {
        if (handleSubmitRef.current) handleSubmitRef.current(true, 'tab-switching-disqualified');
      }, APP_CONFIG.AUTO_SUBMIT_DELAY);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage, setIsDisqualifiedSynced]);

  // Window blur
  useEffect(() => {
    if (isAdmin) return;
    const handleBlur = () => {
      if (hasSubmittedRef.current || isDisqualifiedRef.current) return;
      setIsContentBlurred(true);
      const n = blurCountRef.current + 1;
      blurCountRef.current = n;
      setBlurCount(n);
      showWarningMessage(`You left the exam window! Return immediately. (${n} time${n>1?'s':''})`, 'violation');
    };
    const handleFocus = () => { setIsContentBlurred(false); resetActivity(); };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage, resetActivity]);

  // Mouse leave
  useEffect(() => {
    if (isAdmin) return;
    const handler = (e) => {
      if (hasSubmittedRef.current || isDisqualifiedRef.current) return;
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)
        showWarningMessage('Your mouse left the exam window! Stay focused.', 'violation');
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage]);

  // ── render helpers ───────────────────────

  const currentQ  = questions[currentQuestion];
  const isExpired = timerStateRef.current[currentQuestion]?.expired === true && answers[currentQuestion] === undefined;

  // ── submit confirmation overlay ──────────
  const renderSubmitConfirm = () => {
    const unanswered = questions.filter((_, idx) =>
      answers[idx] === undefined && !timerStateRef.current[idx]?.expired
    ).length;

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999998,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}>
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '1.75rem',
          maxWidth: '420px', width: '100%',
          border: '3px solid #e2e8f0',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <AlertCircle size={44} color="#f59e0b" strokeWidth={2} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>
            Submit Test?
          </h2>
          {unanswered > 0 ? (
            <p style={{ fontSize: '0.95rem', color: '#dc2626', fontWeight: '700', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {unanswered} question{unanswered > 1 ? 's' : ''} still unanswered.<br />
              <span style={{ fontWeight: '500', color: '#64748b' }}>Unanswered questions will be marked wrong.</span>
            </p>
          ) : (
            <p style={{ fontSize: '0.95rem', color: '#475569', fontWeight: '600', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              All questions answered.<br />Are you sure you want to submit?
            </p>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '0.875rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981' }}>{Object.keys(answers).length}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Answered</div>
            </div>
            <div style={{ width: '1px', background: '#e2e8f0' }} />
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: unanswered > 0 ? '#ef4444' : '#94a3b8' }}>{unanswered}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Unanswered</div>
            </div>
            <div style={{ width: '1px', background: '#e2e8f0' }} />
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e293b' }}>{questions.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowSubmitConfirm(false)}
              style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: '700', fontSize: '0.95rem', color: '#475569', cursor: 'pointer' }}
            >
              Go back
            </button>
            <button
              onClick={() => { setShowSubmitConfirm(false); handleSubmit(false, ''); }}
              style={{ flex: 2, padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', fontWeight: '800', fontSize: '0.95rem', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
            >
              Yes, submit now
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── main render ──────────────────────────
  return (
    <div
      data-test-interface="true"
      style={{
        position: 'fixed', inset: 0,
        background: '#f8fafc',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        width: '100vw', height: '100vh',
        top: 0, left: 0,
        userSelect: isAdmin ? 'auto' : 'none',
      }}
    >
      {!isAdmin && <Watermark userEmail={userEmail} userName={studentName} />}

      {/* Submit confirmation */}
      {showSubmitConfirm && renderSubmitConfirm()}

      {/* Content blur overlay */}
      {isContentBlurred && !isAdmin && (
        <div style={{ position:'fixed', inset:0, zIndex:99997, backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1.25rem' }}>
          <EyeOff size={64} color="#fff" />
          <div style={{ color:'#fff', fontWeight:'900', fontSize:'1.4rem', textAlign:'center' }}>Return to the exam window</div>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.95rem' }}>Content hidden until you return focus</div>
        </div>
      )}

      {/* Warning modal */}
      {!isAdmin && (
        <WarningModal
          show={showWarning}
          message={warningMsg}
          type={warningType}
          tabSwitches={tabSwitches}
          onAcknowledge={handleAcknowledge}
          initialCountdown={warningInitialCountdown}
        />
      )}

      {/* Admin badge */}
      {isAdmin && (
        <div style={{ position:'fixed', top:'10px', left:'10px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', padding:'0.5rem 1rem', borderRadius:'10px', fontSize:'0.78rem', fontWeight:'900', zIndex:10000000 }}>
          ADMIN MODE — Security Disabled
        </div>
      )}

      {/* ── STICKY HEADER ── */}
      <div style={{
        flexShrink: 0,
        background: '#fff',
        borderBottom: '2px solid #e2e8f0',
        padding: isMobile ? '10px 14px 8px' : '12px 20px 10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        opacity: isDisqualified ? 0.5 : 1,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Student row */}
          {!isAdmin && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'5px' }}>
              <span style={{ fontSize:'11px' }}>👤</span>
              <span style={{ fontSize:'0.73rem', fontWeight:'700', color:'#6366f1' }}>{studentName}</span>
              <span style={{ fontSize:'0.68rem', color:'#94a3b8' }}>· {studentInfo?.email}</span>
              {tabSwitches > 0 && (
                <span style={{ marginLeft:'4px', background:'#fee2e2', color:'#dc2626', padding:'1px 6px', borderRadius:'5px', fontSize:'0.62rem', fontWeight:'800' }}>
                  Tab switch: {tabSwitches}
                </span>
              )}
              {blurCount > 0 && (
                <span style={{ background:'#fef3c7', color:'#92400e', padding:'1px 6px', borderRadius:'5px', fontSize:'0.62rem', fontWeight:'800' }}>
                  Focus lost: {blurCount}
                </span>
              )}
              {isDisqualified && (
                <span style={{ marginLeft:'auto', background:'#dc2626', color:'#fff', padding:'2px 8px', borderRadius:'5px', fontSize:'0.62rem', fontWeight:'800' }}>
                  DISQUALIFIED
                </span>
              )}
            </div>
          )}

          {/* Main row */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize: isMobile?'0.68rem':'0.78rem', color:'#94a3b8', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {testTitle}
              </div>
              <div style={{ fontSize: isMobile?'0.95rem':'1.15rem', fontWeight:'800', color:'#1e293b', lineHeight:1.2 }}>
                Question {currentQuestion + 1}
                <span style={{ fontWeight:'500', color:'#94a3b8', fontSize: isMobile?'0.82rem':'0.95rem' }}> / {questions.length}</span>
              </div>
            </div>

            {/* Timers */}
            {!isAdmin && timePerQuestion > 0 ? (
              <>
                <QuestionTimer
                  questionIndex={currentQuestion}
                  totalQuestions={questions.length}
                  timePerQuestion={timePerQuestion}
                  onExpire={handleQuestionTimerExpire}
                  isAdmin={isAdmin}
                  timerStateRef={timerStateRef}
                />
                <IsolatedTimer
                  timeLimit={timeLimit}
                  isAdmin={isAdmin}
                  onTick={handleTimerTick}
                  onExpire={handleTimerExpire}
                />
              </>
            ) : (
              <IsolatedTimer
                timeLimit={timeLimit}
                isAdmin={isAdmin}
                onTick={handleTimerTick}
                onExpire={handleTimerExpire}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        opacity: isDisqualified ? 0.15 : 1,
        pointerEvents: isDisqualified ? 'none' : 'auto',
        filter: isDisqualified ? 'blur(6px)' : 'none',
        transition: 'opacity 0.4s, filter 0.4s',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: isMobile ? '14px 14px 0' : '20px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>

          {/* ── 1. QUESTION CARD ── */}
          <div
            key={`q-${currentQuestion}`}
            style={{
              background: '#fff',
              border: '2px solid #e2e8f0',
              borderRadius: '18px',
              padding: isMobile ? '16px' : '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              animation: 'slideIn 0.3s ease',
            }}
          >
            <div style={{
              fontSize: isMobile ? '1rem' : '1.15rem',
              fontWeight: '700',
              color: '#1e293b',
              lineHeight: 1.65,
            }}>
              {currentQ.question}
            </div>
            {currentQ.code && <SyntaxHighlight code={currentQ.code} />}
          </div>

          {/* ── 2. OPTIONS 2×2 ── */}
          <div
            key={`opts-${currentQuestion}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: isMobile ? '10px' : '12px',
            }}
          >
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentQuestion] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(currentQuestion, idx)}
                  disabled={isDisqualified || isExpired}
                  style={{
                    padding: isMobile ? '12px 10px' : '16px 14px',
                    background: isExpired
                      ? '#f8fafc'
                      : isSelected ? '#eef2ff' : '#fff',
                    border: `2px solid ${isExpired ? '#e2e8f0' : isSelected ? '#6366f1' : '#e2e8f0'}`,
                    borderRadius: '14px',
                    cursor: (isDisqualified || isExpired) ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    boxShadow: isSelected && !isExpired ? '0 0 0 3px rgba(99,102,241,0.15)' : '0 2px 6px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s',
                    minHeight: isMobile ? '60px' : '68px',
                    opacity: isExpired ? 0.55 : 1,
                    animation: `fadeInUp 0.25s ease ${idx * 0.05}s backwards`,
                  }}
                >
                  <span style={{
                    width: isMobile ? '24px' : '28px',
                    height: isMobile ? '24px' : '28px',
                    minWidth: isMobile ? '24px' : '28px',
                    borderRadius: '7px',
                    background: isExpired ? '#e2e8f0' : isSelected ? '#6366f1' : '#f1f5f9',
                    color: isExpired ? '#94a3b8' : isSelected ? '#fff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: isMobile ? '0.72rem' : '0.82rem',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{
                    flex: 1,
                    fontSize: isMobile ? '0.88rem' : '0.98rem',
                    fontWeight: '600',
                    color: isExpired ? '#94a3b8' : isSelected ? '#3730a3' : '#1e293b',
                    lineHeight: 1.45,
                  }}>
                    {option}
                  </span>
                  {isSelected && !isExpired && (
                    <CheckCircle size={isMobile ? 15 : 17} color="#6366f1" strokeWidth={2.5} style={{ flexShrink:0, marginTop:'2px' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Time-up notice for expired question */}
          {isExpired && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: '#fef3c7',
              border: '1.5px solid #fde68a',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: '700',
              color: '#92400e',
            }}>
              <span style={{ fontSize:'16px' }}>⏱</span>
              Time ran out — this question was skipped automatically
            </div>
          )}

          {/* ── 3. PROGRESS BAR — after options ── */}
          <ExamProgressBar
            questions={questions}
            answers={answers}
            timerStateRef={timerStateRef}
            currentQuestion={currentQuestion}
            isMobile={isMobile}
          />

        </div>

        {/* spacer so content clears sticky footer */}
        <div style={{ height: '88px' }} />
      </div>

      {/* ── STICKY FOOTER ── */}
      <div style={{
        flexShrink: 0,
        padding: isMobile ? '10px 14px' : '12px 20px',
        background: '#fff',
        borderTop: '2px solid #e2e8f0',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
        opacity: isDisqualified ? 0.5 : 1,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {isLastQuestion ? (
            <button
              onClick={() => {
                if (isDisqualified) return;
                if (!isAdmin && !allAnswered) {
                  showWarningMessage(`Please answer all questions before submitting.\n(${answeredCount}/${questions.length} answered)`, 'normal');
                  return;
                }
                // FIX: show confirmation instead of instant submit
                setShowSubmitConfirm(true);
              }}
              disabled={isDisqualified}
              style={{
                width: '100%',
                padding: isMobile ? '14px' : '16px',
                background: isDisqualified
                  ? '#e2e8f0'
                  : (!allAnswered && !isAdmin)
                  ? '#fef3c7'
                  : 'linear-gradient(135deg,#10b981,#059669)',
                border: 'none',
                borderRadius: '14px',
                cursor: isDisqualified ? 'not-allowed' : 'pointer',
                fontWeight: '800',
                color: isDisqualified
                  ? '#94a3b8'
                  : (!allAnswered && !isAdmin) ? '#92400e' : '#fff',
                fontSize: isMobile ? '1rem' : '1.05rem',
                boxShadow: (!isDisqualified && (allAnswered || isAdmin))
                  ? '0 6px 20px rgba(16,185,129,0.35)'
                  : 'none',
                transition: 'all 0.2s',
              }}
            >
              {isDisqualified
                ? 'Disqualified'
                : (!allAnswered && !isAdmin)
                ? `${answeredCount}/${questions.length} answered — finish all to submit`
                : 'Submit Test'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isDisqualified}
              style={{
                width: '100%',
                padding: isMobile ? '14px' : '16px',
                background: isDisqualified ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                border: 'none',
                borderRadius: '14px',
                cursor: isDisqualified ? 'not-allowed' : 'pointer',
                fontWeight: '800',
                color: isDisqualified ? '#94a3b8' : '#fff',
                fontSize: isMobile ? '1rem' : '1.05rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: isDisqualified ? 'none' : '0 6px 20px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}
            >
              Next Question <ChevronRight size={isMobile ? 18 : 20} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}