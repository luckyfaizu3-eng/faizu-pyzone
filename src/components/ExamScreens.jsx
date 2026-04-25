// @ts-nocheck
// FILE LOCATION: src/components/ExamScreens.jsx
// ✅ FIX-SUBMIT:          handleSubmit — onComplete pehle, CleanupManager 800ms baad
// ✅ FIX-AUDIO:           handleTimerTick / handleTimerExpire se audio calls hataye
// ✅ FIX-DUPLICATE:       Tab-switch visibilitychange useEffect REMOVED — AntiCheatController handles it
// ✅ FIX-ANTICHEAT:       AntiCheatController.enable() called on exam start
// ✅ FIX-FS-DUPLICATE:    Duplicate fullscreen onChange listener REMOVED
// ✅ FIX-INACTIVITY:      Question navigation resets inactivity timer
// ✅ FIX-QTEXPIRE-TOAST:  handleQuestionTimerExpire shows a brief toast before advancing
// ✅ FIX-LINT:            Removed unused FullscreenManager import
// ============================================================
// BUG-FIX v8 — DOUBLE DETECTION + MOBILE NEXT BUTTON FIX:
// ✅ FIX-MOBILE-BODY-FIXED:   On touch devices, body is NOT set to position:fixed.
//                              The old code set position:fixed unconditionally which caused
//                              the bottom nav bar (Next/Submit button) to fall outside the
//                              viewport after fullscreen exit on mobile — because the browser
//                              shrinks the visual viewport but the fixed body stays at 100vh.
//                              Fix: use overflow:hidden on body WITHOUT position:fixed on mobile.
//                              On desktop, position:fixed is still applied (needed for fullscreen).
// ✅ FIX-BLUR-DEDUP:          window blur event was firing INDEPENDENTLY from AppSwitcherGuard's
//                              visibilitychange, meaning 1 tab switch = 1 violation (AppSwitcher)
//                              + 1 blur warning (separate counter). While blur doesn't increment
//                              the AntiCheat violation count, it was showing a second warning modal
//                              on top of the violation modal, creating confusing UX.
//                              Fix: blur handler now checks if a violation was recently recorded
//                              (via a 2s gate shared with AppSwitcherGuard timing) before showing
//                              its own warning. Blur warnings are now purely informational and
//                              DO NOT conflict with AppSwitcher violation modals.
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, CheckCircle, Shield, BookOpen, EyeOff } from 'lucide-react';

import {
  APP_CONFIG,
  TestUtils,
  AudioManager,
  DesktopModeEnforcer,
  DevToolsDetector,
  SecurityManager,
  NetworkGuard,
  VisibilityManager,
  CleanupManager,
  AntiCheatController,
} from './utils';

import {
  WarningModal,
  SyntaxHighlight,
  QuestionTimer,
  IsolatedTimer,
  ExamProgressBar,
} from './ExamComponents';

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
    { text: `Tab switching ${APP_CONFIG.MAX_TAB_SWITCHES} times = instant DISQUALIFICATION.`, danger: true },
    { text: `Pressing the Windows key ${APP_CONFIG.MAX_WINDOWS_KEY_PRESSES} times = DISQUALIFICATION.`, danger: true },
    { text: `Opening Developer Tools (F12) = instant DISQUALIFICATION.`, danger: true },
    { text: 'Copy, paste, right-click, printing, saving and Ctrl+U are completely blocked.' },
    { text: 'Browser screen recording is blocked automatically.' },
    { text: 'Test runs in fullscreen — exiting triggers a warning and auto-returns.' },
    { text: `Inactivity for ${inactivityMin} minute${inactivityMin > 1 ? 's' : ''} will trigger a warning.` },
    { text: 'Questions and answer options are shuffled — every student gets a different order.', highlight: true },
    { text: `Score ${passPercent}% or above to PASS and receive a Certificate of Achievement.` },
    { text: 'Cheating = FAIL + permanent record + zero refund + no certificate.', danger: true },
  ];

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'#f8fafc', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'1rem', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
      <div style={{ width:'100%', maxWidth:'680px', padding:'1rem 0' }}>

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

  const timerStateRef   = useRef({});
  const startTimeRef    = useRef(Date.now());
  const audioRef        = useRef(new AudioManager());
  const securityRef     = useRef(null);
  const devToolsRef     = useRef(null);
  const antiCheatRef    = useRef(null);
  const warningTimerRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const tabSwitchRef    = useRef(0);
  const blurCountRef    = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const inactivityRef   = useRef(null);
  const handleSubmitRef = useRef(null);
  const isDisqualifiedRef = useRef(false);
  // ✅ FIX-BLUR-DEDUP: track when AppSwitcher last fired to suppress redundant blur warning
  const lastViolationTimeRef = useRef(0);

  const isAdmin        = TestUtils.isAdmin(userEmail);
  const studentName    = studentInfo?.fullName || 'Student';
  const inactivityLimitMs = Math.max(60000, timeLimit * 60 * 1000 * APP_CONFIG.INACTIVITY_PERCENT);
  const isLastQuestion = currentQuestion === questions.length - 1;
  // ✅ FIX-MOBILE-BODY-FIXED: detect touch device once at mount
  const isTouchDevice  = useRef(TestUtils.isTouchDevice?.() ?? (navigator.maxTouchPoints > 0 || 'ontouchstart' in window));

  const setIsDisqualifiedSynced = useCallback((val) => {
    isDisqualifiedRef.current = val;
    setIsDisqualified(val);
  }, []);

  const resetActivity = useCallback(() => { lastActivityRef.current = Date.now(); }, []);

  const showWarningMessage = useCallback((message, type = 'normal', mustAck = false) => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
    const needsOk = mustAck || type === 'critical' || type === 'final' || type === 'devtools-warning';
    const countdownSecs = (type === 'final' || type === 'critical')
      ? Math.max(APP_CONFIG.DISQUALIFY_MIN_SECONDS, 15)
      : 20;
    setWarningInitialCountdown(countdownSecs);
    setWarningMsg(message);
    setWarningType(type);
    setShowWarning(true);
    if (!needsOk) warningTimerRef.current = setTimeout(() => setShowWarning(false), APP_CONFIG.WARNING_TIMEOUT);
  }, []);

  const handleAcknowledge = useCallback(() => setShowWarning(false), []);

  const handleTimerTick = useCallback((_left) => {
    // No audio
  }, []);

  const handleTimerExpire = useCallback(() => {
    showWarningMessage('TIME IS UP!\n\nYour test is being submitted automatically.', 'final', true);
    if (handleSubmitRef.current) handleSubmitRef.current(false, 'time-up');
  }, [showWarningMessage]);

  // ✅ FIX-QTEXPIRE-TOAST
  const handleQuestionTimerExpire = useCallback(() => {
    if (isDisqualifiedRef.current || hasSubmittedRef.current) return;

    showWarningMessage(
      'Question time ran out — moving to the next question automatically.',
      'normal',
      false
    );

    setCurrentQuestion(prev => {
      if (prev < questions.length - 1) return prev + 1;
      if (handleSubmitRef.current) handleSubmitRef.current(false, 'time-up');
      return prev;
    });
  }, [questions.length, showWarningMessage]);

  const handleAnswer = useCallback((qIndex, optIdx) => {
    if (isDisqualifiedRef.current) return;
    resetActivity();
    answersRef.current = { ...answersRef.current, [qIndex]: optIdx };
    setAnswers(prev => ({ ...prev, [qIndex]: optIdx }));
  }, [resetActivity]);

  const handleSubmit = useCallback((penalized = false, reason = '') => {
    if (hasSubmittedRef.current) return;
    window.onbeforeunload = null;
    hasSubmittedRef.current = true;

    const currentAnswers = answersRef.current;
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    const violationCount = antiCheatRef.current ? antiCheatRef.current.violations : tabSwitchRef.current;
    const score = TestUtils.calculateScore(currentAnswers, questions, violationCount, isAdmin, passPercent);

    if (devToolsRef.current) devToolsRef.current.stop();
    if (securityRef.current) securityRef.current.disable();
    if (antiCheatRef.current) antiCheatRef.current.disable();

    onComplete({
      ...score,
      timeTaken: `${Math.floor(timeTaken/60)}m ${timeTaken%60}s`,
      tabSwitches: violationCount,
      penalized,
      disqualificationReason: reason,
      studentInfo,
    });

    setTimeout(() => {
      CleanupManager.performFullCleanup(false);
    }, 800);

  }, [questions, isAdmin, studentInfo, onComplete, passPercent]);

  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  // ✅ FIX-INACTIVITY: reset on question change
  const handleNext = useCallback(() => {
    if (isDisqualified) return;
    resetActivity();
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(p => p + 1);
    }
  }, [currentQuestion, questions.length, isDisqualified, resetActivity]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    resetActivity();
  }, [currentQuestion, resetActivity]);

  // ==========================================
  // MAIN SETUP EFFECT
  // ==========================================
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

    // ✅ FIX-MOBILE-BODY-FIXED:
    // On touch devices: do NOT use position:fixed — it causes the bottom nav bar
    // (Next/Submit button) to disappear off-screen after fullscreen exit because
    // the browser shrinks the visual viewport but the fixed-positioned body keeps
    // its original dimensions.
    // On desktop: position:fixed is still needed to prevent scroll during exam.
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.margin  = '0';
    document.body.style.padding = '0';

    if (!isTouchDevice.current) {
      // Desktop: use position:fixed (works fine, fullscreen covers everything)
      document.body.style.position = 'fixed';
      document.body.style.width    = '100%';
      document.body.style.height   = '100%';
      document.body.style.top      = '0';
      document.body.style.left     = '0';
    } else {
      // Mobile: use min-height instead of position:fixed
      // This keeps the layout stable after fullscreen exit
      document.body.style.width     = '100%';
      document.body.style.minHeight = '100dvh'; // dvh = dynamic viewport height, adapts to browser chrome
    }

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

      antiCheatRef.current = new AntiCheatController({
        onWarning: (msg, level, force) => {
          // ✅ FIX-BLUR-DEDUP: record time of violation so blur handler can suppress its warning
          if (level === 'critical' || level === 'final') {
            lastViolationTimeRef.current = Date.now();
          }
          if (antiCheatRef.current) {
            tabSwitchRef.current = antiCheatRef.current.violations;
            setTabSwitches(antiCheatRef.current.violations);
            if (antiCheatRef.current.violations >= APP_CONFIG.MAX_TAB_SWITCHES) {
              setIsDisqualifiedSynced(true);
            }
          }
          showWarningMessage(msg, level, force);
        },
        onDisqualify: (reason) => {
          setIsDisqualifiedSynced(true);
          if (handleSubmitRef.current) handleSubmitRef.current(true, reason);
        },
      });
      antiCheatRef.current.enable().catch(() => {});
    }

    window.onbeforeunload = (e) => {
      if (!hasSubmittedRef.current) { e.preventDefault(); e.returnValue=''; return ''; }
    };

    const ca = audioRef.current;

    return () => {
      window.onbeforeunload = null;
      hidden.forEach(({ el, d, v }) => { if (el) { el.style.display=d||''; el.style.visibility=v||''; } });
      document.body.style.overflow    = orig.overflow;
      document.documentElement.style.overflow = orig.htmlOverflow;
      document.body.style.position   = orig.position;
      document.body.style.margin     = orig.margin;
      document.body.style.padding    = orig.padding;
      document.body.style.width      = orig.width;
      document.body.style.height     = orig.height;
      document.body.style.minHeight  = '';
      document.body.style.top        = '';
      document.body.style.left       = '';
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      ca.destroy();
      NetworkGuard.disable();
      VisibilityManager.disable();
      DesktopModeEnforcer.disable();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage]);

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', r, { passive: true });
    return () => window.removeEventListener('resize', r);
  }, []);

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

  useEffect(() => {
    if (isAdmin) return;
    const handleBlur = () => {
      if (hasSubmittedRef.current || isDisqualifiedRef.current) return;
      setIsContentBlurred(true);
      const n = blurCountRef.current + 1;
      blurCountRef.current = n;
      setBlurCount(n);

      // ✅ FIX-BLUR-DEDUP: if AppSwitcherGuard already fired a violation warning
      // within the last 3.5s (its cooldown + buffer), don't show a redundant blur
      // warning on top. The violation modal is already showing.
      const timeSinceViolation = Date.now() - lastViolationTimeRef.current;
      if (timeSinceViolation < 3500) return;

      showWarningMessage(
        `You left the exam window! Return immediately. (${n} time${n>1?'s':''})`,
        'violation'
      );
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

  const currentQ  = questions[currentQuestion];
  const isExpired = timerStateRef.current[currentQuestion]?.expired === true && answers[currentQuestion] === undefined;

  return (
    <div
      data-test-interface="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#f8fafc',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        // ✅ FIX-MOBILE-BODY-FIXED: use 100dvh on mobile so the height adapts when
        // the browser chrome (address bar, bottom bar) shows/hides. On desktop,
        // 100vh is fine since we're in fullscreen.
        height: isTouchDevice.current ? '100dvh' : '100vh',
        top: 0,
        left: 0,
        userSelect: isAdmin ? 'auto' : 'none',
        // ✅ Ensure the container scrolls internally, not the body
        overflow: 'hidden',
      }}
    >
      {isContentBlurred && !isAdmin && (
        <div style={{ position:'fixed', inset:0, zIndex:99997, backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1.25rem' }}>
          <EyeOff size={64} color="#fff" />
          <div style={{ color:'#fff', fontWeight:'900', fontSize:'1.4rem', textAlign:'center' }}>Return to the exam window</div>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.95rem' }}>Content hidden until you return focus</div>
        </div>
      )}

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

      {isAdmin && (
        <div style={{ position:'fixed', top:'10px', left:'10px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', padding:'0.5rem 1rem', borderRadius:'10px', fontSize:'0.78rem', fontWeight:'900', zIndex:10000000 }}>
          ADMIN MODE — Security Disabled
        </div>
      )}

      {/* TOP HEADER — flexShrink:0 so it never collapses */}
      <div style={{
        flexShrink: 0,
        background: '#fff',
        borderBottom: '2px solid #e2e8f0',
        padding: isMobile ? '10px 14px 8px' : '12px 20px 10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        opacity: isDisqualified ? 0.5 : 1,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {!isAdmin && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'5px' }}>
              <span style={{ fontSize:'11px' }}>👤</span>
              <span style={{ fontSize:'0.73rem', fontWeight:'700', color:'#6366f1' }}>{studentName}</span>
              <span style={{ fontSize:'0.68rem', color:'#94a3b8' }}>· {studentInfo?.email}</span>
              {tabSwitches > 0 && (
                <span style={{ marginLeft:'4px', background:'#fee2e2', color:'#dc2626', padding:'1px 6px', borderRadius:'5px', fontSize:'0.62rem', fontWeight:'800' }}>
                  Violations: {tabSwitches}/{APP_CONFIG.MAX_TAB_SWITCHES}
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
                <div style={{ display: 'none' }}>
                  <IsolatedTimer
                    timeLimit={timeLimit}
                    isAdmin={isAdmin}
                    onTick={handleTimerTick}
                    onExpire={handleTimerExpire}
                  />
                </div>
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

      {/* SCROLLABLE CONTENT AREA */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        // ✅ FIX-MOBILE-BODY-FIXED: overscroll-behavior prevents pull-to-refresh
        // interfering with the exam on mobile
        overscrollBehavior: 'contain',
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
          <div
            key={`q-${currentQuestion}`}
            style={{
              background: '#fff',
              border: '2px solid #e2e8f0',
              borderRadius: '18px',
              padding: isMobile ? '16px' : '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              animation: 'slideIn 0.3s ease',
              position: 'relative',
              zIndex: 1,
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

          <div
            key={`opts-${currentQuestion}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: isMobile ? '10px' : '12px',
              position: 'relative',
              zIndex: 1,
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
                    background: isExpired ? '#f8fafc' : isSelected ? '#eef2ff' : '#fff',
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
              position: 'relative',
              zIndex: 1,
            }}>
              <span style={{ fontSize:'16px' }}>⏱</span>
              Time ran out — this question was skipped automatically
            </div>
          )}

          <ExamProgressBar
            questions={questions}
            answers={answers}
            timerStateRef={timerStateRef}
            currentQuestion={currentQuestion}
            isMobile={isMobile}
          />
        </div>

        <div style={{ height: '88px' }} />
      </div>

      {/* BOTTOM NAVIGATION — flexShrink:0 ensures it's ALWAYS visible */}
      <div style={{
        flexShrink: 0,
        padding: isMobile ? '10px 14px' : '12px 20px',
        background: '#fff',
        borderTop: '2px solid #e2e8f0',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
        opacity: isDisqualified ? 0.5 : 1,
        // ✅ FIX-MOBILE-BODY-FIXED: safe area inset for iPhone notch/home indicator
        paddingBottom: isMobile
          ? 'max(10px, env(safe-area-inset-bottom, 10px))'
          : '12px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {isLastQuestion ? (
            <button
              onClick={() => {
                if (isDisqualified) return;
                handleSubmit(false, '');
              }}
              disabled={isDisqualified}
              style={{
                width: '100%',
                padding: isMobile ? '14px' : '16px',
                background: isDisqualified ? '#e2e8f0' : 'linear-gradient(135deg,#10b981,#059669)',
                border: 'none',
                borderRadius: '14px',
                cursor: isDisqualified ? 'not-allowed' : 'pointer',
                fontWeight: '800',
                color: isDisqualified ? '#94a3b8' : '#fff',
                fontSize: isMobile ? '1rem' : '1.05rem',
                boxShadow: isDisqualified ? 'none' : '0 6px 20px rgba(16,185,129,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {isDisqualified ? 'Disqualified' : 'Submit Test'}
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