// @ts-nocheck
// FILE LOCATION: src/components/ExamScreens.jsx
// InstructionScreen and TestInterface components

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, CheckCircle, Shield, BookOpen, EyeOff } from 'lucide-react';

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
    { text: `Each question has its own ${tpqFormatted} timer. Unanswered questions auto-advance to next. Once a question's time runs out, you cannot go back to it.`, highlight: true },
    { text: `Once you move forward from a question, you cannot go back to it.`, highlight: true },
    { text: `Tab switch karna BANNED hai — 1 baar switch kiya toh SEEDHA DISQUALIFY.`, danger: true },
    { text: `Windows key ${APP_CONFIG.MAX_WINDOWS_KEY_PRESSES} baar press karna = DISQUALIFY.`, danger: true },
    { text: `Developer Tools (F12) kholna = SEEDHA DISQUALIFY.`, danger: true },
    { text: 'Copy, paste, right-click, printing, saving and Ctrl+U are completely blocked.' },
    { text: 'Browser screen recording (getDisplayMedia) is blocked automatically.' },
    { text: 'Test runs in fullscreen — exiting triggers a warning and auto-returns.' },
    { text: 'Your name and email are watermarked on every screen permanently.' },
    { text: `Inactivity for ${inactivityMin} minute${inactivityMin > 1 ? 's' : ''} will trigger a warning.` },
    { text: 'Questions and answer options are shuffled — every student gets a different order.', highlight: true },
    { text: `Score ${passPercent}% or above to PASS and receive a Certificate of Achievement.` },
    { text: 'Cheating = FAIL + permanent record + zero refund + no certificate.', danger: true },
  ].filter(Boolean);

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
              { label:'Duration', value:`${timeLimit} Min` },
              { label:'Questions', value:`${totalQuestions} Qs` },
              { label:'Per Question', value:tpqFormatted },
              { label:'Pass Mark', value:`${passPercent}%` },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize:'1.2rem', fontWeight:'900', color:'#3b82f6' }}>{s.value}</div>
                <div style={{ fontSize:'0.75rem', color:'#64748b', fontWeight:'700' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'#fff', border:'3px solid #e2e8f0', borderRadius:'20px', padding:'1.5rem', marginBottom:'1rem', boxShadow:'0 8px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
            <BookOpen size={18} color="#3b82f6" />
            <span style={{ color:'#1e293b', fontWeight:'800', fontSize:'0.95rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>Test Instructions</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.5rem' }}>
            {instructions.map((item, idx) => (
              <div key={idx} style={{ display:'flex', alignItems:'flex-start', gap:'0.85rem', padding:'1rem', background:item.danger?'#fff5f5':item.highlight?'#f0fdf4':'#f8fafc', border:`2px solid ${item.danger?'#fecaca':item.highlight?'#bbf7d0':'#e2e8f0'}`, borderRadius:'14px' }}>
                <div style={{ width:'26px', height:'26px', minWidth:'26px', borderRadius:'8px', border:`2.5px solid ${item.danger?'#f87171':item.highlight?'#4ade80':'#cbd5e1'}`, background:item.danger?'#fee2e2':item.highlight?'#dcfce7':'#fff', display:'flex', alignItems:'center', justifyContent:'center', color:item.danger?'#dc2626':item.highlight?'#16a34a':'#64748b', fontWeight:'800', fontSize:'0.85rem' }}>{idx + 1}</div>
                <span style={{ color:item.danger?'#991b1b':item.highlight?'#15803d':'#475569', fontSize:'clamp(0.85rem,2.5vw,0.95rem)', fontWeight:item.danger||item.highlight?'700':'600', lineHeight:1.55, flex:1 }}>{item.text}</span>
              </div>
            ))}
          </div>
          <div onClick={() => setAccepted(!accepted)} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1.25rem', background:accepted?'#f0fdf4':'#fff', border:`3px solid ${accepted?'#10b981':'#e2e8f0'}`, borderRadius:'14px', cursor:'pointer', transition:'all 0.2s' }}>
            <div style={{ width:'32px', height:'32px', minWidth:'32px', borderRadius:'8px', border:`3px solid ${accepted?'#10b981':'#cbd5e1'}`, background:accepted?'#10b981':'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
              {accepted && <CheckCircle size={20} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ color:accepted?'#065f46':'#475569', fontSize:'clamp(0.9rem,2.5vw,1.05rem)', fontWeight:accepted?'800':'700', lineHeight:1.4, flex:1 }}>
              I have read all instructions. I will NOT cheat under any circumstances.
            </span>
          </div>
        </div>

        <button onClick={() => accepted && onAccept()} disabled={!accepted}
          style={{ width:'100%', padding:'1.1rem', background:accepted?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0', border:accepted?'3px solid #059669':'3px solid #e2e8f0', borderRadius:'16px', color:accepted?'#fff':'#94a3b8', fontSize:'1.05rem', fontWeight:'800', cursor:accepted?'pointer':'not-allowed', boxShadow:accepted?'0 8px 24px rgba(16,185,129,0.35)':'none', transition:'all 0.3s' }}>
          {accepted ? 'Start Test' : 'Please Accept Instructions First'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// TEST INTERFACE
// ==========================================
export function TestInterface({ questions, onComplete, testTitle, timeLimit, userEmail, studentInfo, passPercent, timePerQuestion }) {
  const [currentQuestion, setCurrentQuestion]   = useState(0);
  const [answers, setAnswers]                   = useState({});
  const answersRef                              = useRef({});
  const [tabSwitches, setTabSwitches]           = useState(0);
  const [blurCount, setBlurCount]               = useState(0);
  const [showWarning, setShowWarning]           = useState(false);
  const [warningMsg, setWarningMsg]             = useState('');
  const [warningType, setWarningType]           = useState('normal');
  const [warningInitialCountdown, setWarningInitialCountdown] = useState(20);
  const [isDisqualified, setIsDisqualified]     = useState(false);
  const [isContentBlurred, setIsContentBlurred] = useState(false);
  const [isMobile, setIsMobile]                 = useState(() => window.innerWidth <= 768);

  const timerStateRef = useRef({});

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

  // ✅ Track tab switch happening so fullscreen handler can ignore it
  const tabSwitchHappeningRef = useRef(false);

  const isAdmin       = TestUtils.isAdmin(userEmail);
  const answeredCount = Object.keys(answers).length;
  const studentName   = studentInfo?.fullName || 'Student';
  const inactivityLimitMs = Math.max(60000, timeLimit * 60 * 1000 * APP_CONFIG.INACTIVITY_PERCENT);

  const allAnswered = questions.every((_, idx) =>
    answers[idx] !== undefined || timerStateRef.current[idx]?.expired === true
  );

  const isDisqualifiedRef = useRef(false);
  const setIsDisqualifiedSynced = useCallback((val) => {
    isDisqualifiedRef.current = val;
    setIsDisqualified(val);
  }, []);

  const resetActivity = useCallback(() => { lastActivityRef.current = Date.now(); }, []);

  const showWarningMessage = useCallback((message, type = 'normal', mustAck = false) => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
    const needsOk = mustAck || type === 'critical' || type === 'final' || type === 'devtools-warning';

    let initCountdown = 20;
    setWarningInitialCountdown(initCountdown);
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
      if (prev < questions.length - 1) {
        return prev + 1;
      } else {
        if (handleSubmitRef.current) handleSubmitRef.current(false, 'time-up');
        return prev;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]);

  const handleAnswer = useCallback((qIndex, optIdx) => {
    if (isDisqualifiedRef.current) return;
    resetActivity();
    answersRef.current = { ...answersRef.current, [qIndex]: optIdx };
    setAnswers(prev => ({ ...prev, [qIndex]: optIdx }));
  }, [resetActivity]);

  const handleSubmit = useCallback((penalized = false, reason = '') => {
    if (hasSubmittedRef.current) return;
    FullscreenManager.exit();
    const currentAnswers       = answersRef.current;
    const currentAnsweredCount = Object.keys(currentAnswers).length;
    const effectiveDone = questions.filter((_, idx) =>
      currentAnswers[idx] !== undefined || timerStateRef.current[idx]?.expired === true
    ).length;
    if (!isAdmin && effectiveDone < questions.length && !penalized) {
      showWarningMessage(`Please answer ALL questions before submitting.\n(${currentAnsweredCount}/${questions.length} answered)`, 'normal');
      return;
    }
    hasSubmittedRef.current = true;
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const score     = TestUtils.calculateScore(currentAnswers, questions, tabSwitchRef.current, isAdmin, passPercent);
    CleanupManager.performFullCleanup();
    if (devToolsRef.current) devToolsRef.current.stop();
    onComplete({
      ...score,
      timeTaken:`${Math.floor(timeTaken/60)}m ${timeTaken%60}s`,
      tabSwitches: tabSwitchRef.current,
      penalized,
      disqualificationReason: reason,
      studentInfo,
    });
  }, [questions, isAdmin, studentInfo, onComplete, showWarningMessage, passPercent]);

  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  const handleNext = useCallback(() => {
    if (isDisqualified) return;
    resetActivity();
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(p => p + 1);
    }
  }, [currentQuestion, questions.length, isDisqualified, resetActivity]);

  useEffect(() => { window.scrollTo({ top:0, behavior:'smooth' }); }, [currentQuestion]);

  // Setup
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
    document.body.style.overflow='hidden'; document.documentElement.style.overflow='hidden';
    document.body.style.margin='0'; document.body.style.padding='0';
    document.body.style.position='fixed'; document.body.style.width='100%';
    document.body.style.height='100%'; document.body.style.top='0'; document.body.style.left='0';

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

  // Inactivity detection — sirf warning, disqualify nahi
  useEffect(() => {
    if (isAdmin) return;
    const events = ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','click'];
    events.forEach(e => document.addEventListener(e, resetActivity, { passive:true }));
    inactivityRef.current = setInterval(() => {
      if (hasSubmittedRef.current || isDisqualifiedRef.current) return;
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= inactivityLimitMs) {
        const m = Math.floor(idle / 60000), s = Math.floor((idle % 60000) / 1000);
        // Sirf warning — disqualify nahi
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

  // ✅ UPDATED: Fullscreen handler
  // Tab switch hone par fullscreen EXIT mat karo — fullscreen stays
  // Sirf manual exit (ESC press etc) pe re-enter karo
  useEffect(() => {
    if (isAdmin) return;
    const handler = () => {
      // Agar tab switch ho raha hai toh fullscreen change ignore karo
      // (Tab switch khud handle hoga visibilitychange mein)
      if (tabSwitchHappeningRef.current) return;
      if (!FullscreenManager.isActive() && !hasSubmittedRef.current && !isDisqualifiedRef.current) {
        showWarningMessage('You exited fullscreen mode. Returning you to fullscreen...', 'normal');
        setTimeout(() => FullscreenManager.enter(), 1500);
      }
    };
    return FullscreenManager.onChange(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage]);

  // ✅ UPDATED: Tab switch → SEEDHA DISQUALIFY on 1st switch
  useEffect(() => {
    if (isAdmin) return;
    const handler = () => {
      if (!document.hidden || hasSubmittedRef.current || isDisqualifiedRef.current) return;

      // Mark tab switch happening so fullscreen handler ignores it
      tabSwitchHappeningRef.current = true;
      setTimeout(() => { tabSwitchHappeningRef.current = false; }, 3000);

      const n = tabSwitchRef.current + 1;
      tabSwitchRef.current = n;
      setTabSwitches(n);

      // ✅ 1st switch pe seedha disqualify — koi warning nahi, koi chance nahi
      setIsDisqualifiedSynced(true);
      showWarningMessage(
        `DISQUALIFIED — Tab Switch Detected!\n\nAap ne exam window chhor di.\nTest FAIL submit ho raha hai.\nKoi certificate nahi milega.`,
        'final',
        true
      );
      setTimeout(() => {
        if (handleSubmitRef.current) handleSubmitRef.current(true, 'tab-switching-disqualified');
      }, APP_CONFIG.AUTO_SUBMIT_DELAY);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage, setIsDisqualifiedSynced]);

  // Window blur — sirf warning, disqualify nahi
  useEffect(() => {
    if (isAdmin) return;
    const handleBlur = () => {
      if (hasSubmittedRef.current || isDisqualifiedRef.current) return;
      setIsContentBlurred(true);
      const n = blurCountRef.current + 1; blurCountRef.current = n; setBlurCount(n);
      // Sirf warning — disqualify nahi
      showWarningMessage(
        `You left the exam window! Return immediately. (${n} time${n>1?'s':''})`,
        'violation'
      );
    };
    const handleFocus = () => { setIsContentBlurred(false); resetActivity(); };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => { window.removeEventListener('blur', handleBlur); window.removeEventListener('focus', handleFocus); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage, resetActivity]);

  // Mouse leave — sirf warning, disqualify nahi
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

  const currentQ = questions[currentQuestion];
  const headerHeight = isMobile ? 102 : 118;

  return (
    <div data-test-interface="true" style={{ position:'fixed', inset:0, background:'#f8fafc', zIndex:999999, overflowY:'auto', WebkitOverflowScrolling:'touch', userSelect:isAdmin?'auto':'none', width:'100vw', height:'100vh', top:0, left:0 }}>
      {!isAdmin && <Watermark userEmail={userEmail} userName={studentName} />}

      {isContentBlurred && !isAdmin && (
        <div style={{ position:'fixed', inset:0, zIndex:99997, backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1.25rem' }}>
          <EyeOff size={70} color="#fff" />
          <div style={{ color:'#fff', fontWeight:'900', fontSize:'1.5rem', textAlign:'center' }}>Return to the exam window</div>
          <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'1rem' }}>Content is hidden until you return focus</div>
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
        <div style={{ position:'fixed', top:'10px', left:'10px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', padding:'0.6rem 1.2rem', borderRadius:'12px', fontSize:'0.8rem', fontWeight:'900', zIndex:10000000, boxShadow:'0 6px 20px rgba(16,185,129,0.5)' }}>
          ADMIN MODE — Security Disabled
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ position:'sticky', top:0, background:'#fff', borderBottom:'3px solid #e2e8f0', padding:isMobile?'0.75rem 1rem':'0.875rem 1.5rem', zIndex:1000, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', opacity:isDisqualified?0.5:1 }}>
        <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
          {!isAdmin && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem', flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.35rem 0.75rem', background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))', border:'1.5px solid rgba(99,102,241,0.18)', borderRadius:'8px' }}>
                <span style={{ fontSize:'12px' }}>👤</span>
                <span style={{ fontSize:'0.78rem', fontWeight:'800', color:'#6366f1' }}>{studentName}</span>
                <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:'500' }}>• {studentInfo?.email}</span>
              </div>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:'200px' }}>
              <h1 style={{ fontSize:isMobile?'1.1rem':'1.4rem', fontWeight:'800', color:'#1e293b', margin:'0 0 0.25rem' }}>{testTitle}</h1>
              <div style={{ fontSize:isMobile?'0.75rem':'0.9rem', color:'#64748b', fontWeight:'600', display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
                <span>Q {currentQuestion + 1}/{questions.length}</span>
                <span style={{ background:allAnswered?'#dcfce7':'#fef3c7', color:allAnswered?'#065f46':'#92400e', padding:'0.15rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'800' }}>
                  {allAnswered ? 'All Done' : `${answeredCount}/${questions.length}`}
                </span>
                {tabSwitches > 0 && !isAdmin && <span style={{ background:'#fee2e2', color:'#dc2626', padding:'0.15rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'800' }}>Tab Switch: {tabSwitches}</span>}
                {blurCount > 0 && !isAdmin && <span style={{ background:'#fef3c7', color:'#92400e', padding:'0.15rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'800' }}>Focus lost: {blurCount}</span>}
                {isDisqualified && <span style={{ background:'#dc2626', color:'#fff', padding:'0.15rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'800' }}>DISQUALIFIED</span>}
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
              {!isAdmin && timePerQuestion > 0 ? (
                <QuestionTimer
                  questionIndex={currentQuestion}
                  totalQuestions={questions.length}
                  timePerQuestion={timePerQuestion}
                  onExpire={handleQuestionTimerExpire}
                  isAdmin={isAdmin}
                  timerStateRef={timerStateRef}
                />
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
      </div>

      {/* ── PROGRESS BAR ── */}
      <ExamProgressBar
        questions={questions}
        answers={answers}
        timerStateRef={timerStateRef}
        currentQuestion={currentQuestion}
        isMobile={isMobile}
        headerHeight={headerHeight}
      />

      {/* ── CONTENT ── */}
      <div style={{ padding:isMobile?'1.5rem 1rem':'2rem 1.5rem', maxWidth:'1400px', margin:'0 auto', paddingBottom:'6rem', opacity:isDisqualified?0.15:1, pointerEvents:isDisqualified?'none':'auto', filter:isDisqualified?'blur(6px)':'none', transition:'all 0.4s' }}>

        {/* Question card */}
        <div key={currentQuestion} style={{ background:'#fff', padding:isMobile?'1.5rem':'2.5rem', borderRadius:'20px', marginBottom:'2rem', border:'3px solid #e2e8f0', boxShadow:'0 8px 24px rgba(0,0,0,0.08)', animation:'slideIn 0.4s ease' }}>
          <div style={{ fontSize:isMobile?'1.2rem':'1.6rem', fontWeight:'700', color:'#1e293b', lineHeight:1.6 }}>{currentQ.question}</div>
          {currentQ.code && <SyntaxHighlight code={currentQ.code} />}
        </div>

        {/* Options */}
        <div key={`opts-${currentQuestion}`} style={{ display:'grid', gap:isMobile?'1rem':'1.5rem', marginBottom:'2.5rem' }}>
          {currentQ.options.map((option, idx) => {
            const isSelected = answers[currentQuestion] === idx;
            return (
              <button key={idx} onClick={() => handleAnswer(currentQuestion, idx)} disabled={isDisqualified}
                style={{ padding:isMobile?'1.25rem':'1.75rem', background:isSelected?'linear-gradient(135deg,#3b82f6,#2563eb)':'#fff', border:`3px solid ${isSelected?'#3b82f6':'#e2e8f0'}`, borderRadius:'16px', cursor:isDisqualified?'not-allowed':'pointer', textAlign:'left', color:isSelected?'#fff':'#1e293b', fontSize:isMobile?'1rem':'1.3rem', fontWeight:'600', display:'flex', alignItems:'center', gap:isMobile?'1rem':'1.5rem', boxShadow:isSelected?'0 8px 24px rgba(59,130,246,0.3)':'0 4px 12px rgba(0,0,0,0.05)', transform:isSelected?'scale(1.02)':'scale(1)', transition:'all 0.3s', animation:`fadeInUp 0.3s ease ${idx*0.08}s backwards` }}>
                <span style={{ width:isMobile?'40px':'52px', height:isMobile?'40px':'52px', borderRadius:'50%', background:isSelected?'rgba(255,255,255,0.25)':'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:isMobile?'1.1rem':'1.4rem', flexShrink:0 }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ flex:1, lineHeight:1.5 }}>{option}</span>
                {isSelected && <CheckCircle size={isMobile?22:28} color="#fff" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'1rem', marginBottom:'2.5rem' }}>
          {currentQuestion === questions.length - 1 ? (
            <button onClick={() => handleSubmit(false, '')} disabled={(!allAnswered && !isAdmin) || isDisqualified}
              style={{ padding:isMobile?'1rem 2rem':'1.25rem 3rem', background:((allAnswered||isAdmin)&&!isDisqualified)?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0', border:`3px solid ${((allAnswered||isAdmin)&&!isDisqualified)?'#059669':'#e2e8f0'}`, borderRadius:'12px', cursor:((allAnswered||isAdmin)&&!isDisqualified)?'pointer':'not-allowed', fontWeight:'800', color:((allAnswered||isAdmin)&&!isDisqualified)?'#fff':'#94a3b8', fontSize:isMobile?'1rem':'1.2rem', boxShadow:((allAnswered||isAdmin)&&!isDisqualified)?'0 8px 24px rgba(16,185,129,0.4)':'none', textTransform:'uppercase' }}>
              {((allAnswered || isAdmin) && !isDisqualified) ? 'Submit Test' : 'Answer All First'}
            </button>
          ) : (
            <button onClick={handleNext} disabled={isDisqualified}
              style={{ padding:isMobile?'1rem 1.5rem':'1.25rem 2rem', background:isDisqualified?'#f1f5f9':'#fff', border:`3px solid ${isDisqualified?'#e2e8f0':'#cbd5e1'}`, borderRadius:'12px', cursor:isDisqualified?'not-allowed':'pointer', fontWeight:'700', color:isDisqualified?'#94a3b8':'#1e293b', fontSize:isMobile?'0.95rem':'1.1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              {!isMobile && 'Next'}<ChevronRight size={isMobile?18:22} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}