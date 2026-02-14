import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Shield, Award, XCircle, BookOpen } from 'lucide-react';
import UserDetailsForm from './UserDetailsForm';

// ==========================================
// 🎯 CONFIGURATION
// ==========================================
const APP_CONFIG = {
  ADMIN_EMAIL: 'luckyfaizu3@gmail.com',
  MAX_TAB_SWITCHES: 3,
  PASS_PERCENTAGE: 55,
  WARNING_TIMEOUT: 3000,
  CRITICAL_WARNING_TIMEOUT: 5000,
  AUTO_SUBMIT_DELAY: 3000,
  CRITICAL_TIME_MINUTES: 5,
};

// ==========================================
// 🎨 THEME & STYLES
// ==========================================
const THEME = {
  colors: {
    primary: '#3b82f6',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    dark: '#1e293b',
    light: '#f8fafc',
  },
  timer: {
    safe: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    critical: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  }
};

// ==========================================
// 🛠️ UTILITY FUNCTIONS
// ==========================================
class TestUtils {
  static isAdmin(email) {
    return email === APP_CONFIG.ADMIN_EMAIL;
  }

  static formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return {
      hours: h,
      minutes: m,
      seconds: s,
      display: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    };
  }

  static getTimerTheme(timeLeft, totalTime) {
    const percentage = (timeLeft / totalTime) * 100;
    if (percentage > 50) return THEME.timer.safe;
    if (percentage > 20) return THEME.timer.warning;
    return THEME.timer.critical;
  }

  static calculateScore(answers, questions, tabSwitches, isAdmin) {
    let correct = 0;
    let wrong = 0;
    const correctQuestions = [];
    const wrongQuestions = [];

    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined) {
        if (answers[idx] === q.correct) {
          correct++;
          correctQuestions.push(idx + 1);
        } else {
          wrong++;
          wrongQuestions.push(idx + 1);
        }
      } else {
        wrongQuestions.push(idx + 1);
      }
    });

    let percentage = Math.round((correct / questions.length) * 100);
    
    // Apply penalty for tab switches
    const penalized = !isAdmin && tabSwitches >= APP_CONFIG.MAX_TAB_SWITCHES;
    if (penalized) {
      percentage = Math.max(0, percentage - 20);
    }

    return {
      correct,
      wrong,
      total: questions.length,
      percentage,
      passed: isAdmin ? true : percentage >= APP_CONFIG.PASS_PERCENTAGE,
      correctQuestions,
      wrongQuestions,
      penalized
    };
  }
}

// ==========================================
// 🔊 AUDIO MANAGER
// ==========================================
class AudioManager {
  constructor() {
    this.context = null;
  }

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTick(isEven) {
    if (!this.context) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.value = isEven ? 1000 : 800;
    osc.type = 'sine';
    
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playAlarm() {
    if (!this.context) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.value = 880;
    osc.type = 'square';
    
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    
    osc.start(now);
    osc.stop(now + 1);
  }

  destroy() {
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}

// ==========================================
// 🖥️ FULLSCREEN MANAGER - BRAND NEW
// ==========================================
class FullscreenManager {
  static async enter() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      return true;
    } catch (err) {
      // Only log in production, ignore in dev mode
      if (process.env.NODE_ENV === 'production') {
        console.error('Fullscreen error:', err);
      }
      return false;
    }
  }

  static async exit() {
    try {
      // Only try to exit if actually in fullscreen
      if (!FullscreenManager.isActive()) {
        return;
      }

      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      // Silently ignore errors in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Fullscreen exit (expected in dev mode):', err.message);
      }
    }
  }

  static isActive() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
  }

  static onChange(callback) {
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'];
    events.forEach(event => document.addEventListener(event, callback));
    return () => events.forEach(event => document.removeEventListener(event, callback));
  }
}

// ==========================================
// 🔒 SECURITY MANAGER
// ==========================================
class SecurityManager {
  constructor(onWarning) {
    this.onWarning = onWarning;
    this.handlers = {
      copy: (e) => { e.preventDefault(); this.onWarning('⚠️ Copying disabled!'); },
      cut: (e) => { e.preventDefault(); this.onWarning('⚠️ Cutting disabled!'); },
      paste: (e) => { e.preventDefault(); },
      contextMenu: (e) => { e.preventDefault(); this.onWarning('⚠️ Right-click disabled!'); },
      keydown: (e) => {
        const isCopyPaste = e.ctrlKey && ['c', 'v', 'x', 'a', 'u'].includes(e.key.toLowerCase());
        const isDevTools = e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()));
        
        if (isCopyPaste || isDevTools) {
          e.preventDefault();
          this.onWarning('⚠️ Shortcut disabled!');
        }
      }
    };
  }

  enable() {
    Object.entries(this.handlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler);
    });
  }

  disable() {
    Object.entries(this.handlers).forEach(([event, handler]) => {
      document.removeEventListener(event, handler);
    });
  }
}

// ==========================================
// 🎨 CONFIRMATION DIALOG
// ==========================================
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999999, backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
        padding: '2.5rem', borderRadius: '28px', maxWidth: '480px', width: '90%',
        border: '4px solid #e2e8f0',
        boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        textAlign: 'center', animation: 'scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}>
        <div style={{
          width: '80px', height: '80px', margin: '0 auto 1.5rem',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(251,191,36,0.4)'
        }}>
          <AlertTriangle size={42} color="#fff" strokeWidth={2.5} />
        </div>
        
        <div style={{
          fontSize: '1.5rem', fontWeight: '800', color: '#1e293b',
          marginBottom: '2rem', lineHeight: 1.4
        }}>
          {message}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '1rem 1.5rem',
            background: '#fff', border: '3px solid #e2e8f0',
            borderRadius: '14px', color: '#64748b',
            fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            ✕ Cancel
          </button>
          
          <button onClick={onConfirm} style={{
            flex: 1, padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: '3px solid #dc2626', borderRadius: '14px',
            color: '#fff', fontSize: '1.05rem', fontWeight: '800', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
            transition: 'all 0.2s'
          }}>
            ✓ Yes, Exit
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 📋 INSTRUCTION SCREEN
// ==========================================
function InstructionScreen({ onAccept, testTitle, timeLimit, totalQuestions }) {
  const [accepted, setAccepted] = useState(false);

  const instructions = [
    { text: `Test duration is ${timeLimit} minutes. Timer starts immediately after you begin.` },
    { text: `Do NOT switch tabs or windows. After 3 tab switches, test auto-submits.` },
    { text: 'Copy, paste, right-click, and screenshots are disabled during the test.' },
    { text: 'Test runs in fullscreen mode. Exiting fullscreen will trigger a warning.' },
    { text: 'You can navigate between questions freely before submitting.' },
    { text: 'ALL questions must be answered (A to Z completion required).' },
    { text: 'Score 55% or above to PASS and receive your Certificate of Achievement.' },
    { text: 'This test must be taken honestly. Malpractice leads to disqualification.' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '1rem', overflowY: 'auto'
    }}>
      <div style={{ width: '100%', maxWidth: '680px', padding: '1rem 0' }}>
        {/* Header */}
        <div style={{
          background: '#fff', border: '3px solid #e2e8f0',
          borderRadius: '20px', padding: '1.5rem', marginBottom: '1rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#eff6ff', border: '2px solid #bfdbfe',
            borderRadius: '50px', padding: '0.5rem 1.25rem', marginBottom: '1rem'
          }}>
            <Shield size={18} color="#3b82f6" />
            <span style={{ color: '#1d4ed8', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '0.06em' }}>
              EXAM INSTRUCTIONS
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.3rem,5vw,1.9rem)', fontWeight: '800', color: '#1e293b', margin: '0 0 0.75rem' }}>
            {testTitle}
          </h1>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Duration', value: `${timeLimit} Min` },
              { label: 'Questions', value: `${totalQuestions} Qs` },
              { label: 'Pass Mark', value: '55%' }
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#3b82f6' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#fff', border: '3px solid #e2e8f0',
          borderRadius: '20px', padding: '1.5rem', marginBottom: '1rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <BookOpen size={18} color="#3b82f6" />
            <span style={{ color: '#1e293b', fontWeight: '800', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Test Instructions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {instructions.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                padding: '1rem', background: '#f8fafc',
                border: '2px solid #e2e8f0', borderRadius: '14px'
              }}>
                <div style={{
                  width: '26px', height: '26px', minWidth: '26px',
                  borderRadius: '8px', border: '2.5px solid #cbd5e1',
                  background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748b', fontWeight: '800', fontSize: '0.85rem'
                }}>
                  {idx + 1}
                </div>
                <span style={{
                  color: '#475569', fontSize: 'clamp(0.85rem,2.5vw,0.95rem)',
                  fontWeight: '600', lineHeight: 1.55, flex: 1
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div onClick={() => setAccepted(!accepted)} style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
            background: accepted ? '#f0fdf4' : '#fff',
            border: `3px solid ${accepted ? '#10b981' : '#e2e8f0'}`,
            borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <div style={{
              width: '32px', height: '32px', minWidth: '32px', borderRadius: '8px',
              border: `3px solid ${accepted ? '#10b981' : '#cbd5e1'}`,
              background: accepted ? '#10b981' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}>
              {accepted && <CheckCircle size={20} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{
              color: accepted ? '#065f46' : '#475569',
              fontSize: 'clamp(0.9rem,2.5vw,1.05rem)',
              fontWeight: accepted ? '800' : '700', lineHeight: 1.4, flex: 1
            }}>
              ✅ I have read and understood all instructions above
            </span>
          </div>
        </div>

        <button onClick={() => accepted && onAccept()} disabled={!accepted} style={{
          width: '100%', padding: '1.1rem',
          background: accepted ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
          border: accepted ? '3px solid #059669' : '3px solid #e2e8f0',
          borderRadius: '16px', color: accepted ? '#fff' : '#94a3b8',
          fontSize: '1.05rem', fontWeight: '800',
          cursor: accepted ? 'pointer' : 'not-allowed',
          boxShadow: accepted ? '0 8px 24px rgba(16,185,129,0.35)' : 'none',
          transition: 'all 0.3s'
        }}>
          {accepted ? '✅ Proceed to Fill Details' : '☑️ Please Accept Instructions First'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 🎮 MAIN TEST INTERFACE
// ==========================================
function TestInterface({ questions, onComplete, onExit, testTitle, timeLimit, userEmail, studentInfo }) {
  // State
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Refs
  const startTimeRef = useRef(Date.now());
  const audioManagerRef = useRef(new AudioManager());
  const securityManagerRef = useRef(null);
  const warningTimerRef = useRef(null);

  // Computed
  const isAdmin = TestUtils.isAdmin(userEmail);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const timeData = TestUtils.formatTime(timeLeft);
  const timerTheme = TestUtils.getTimerTheme(timeLeft, timeLimit * 60);
  const isCriticalTime = timeLeft < APP_CONFIG.CRITICAL_TIME_MINUTES * 60;

  // ==========================================
  // ✅ AUTO-SCROLL TO TOP ON QUESTION CHANGE
  // ==========================================
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestion]);

  // ==========================================
  // 🎬 INITIALIZATION
  // ==========================================
  useEffect(() => {
    // Hide navbar/header
    const navbar = document.querySelector('nav');
    const header = document.querySelector('header');
    if (navbar) navbar.style.display = 'none';
    if (header) header.style.display = 'none';

    // Setup audio
    if (!isAdmin) {
      audioManagerRef.current.init();
    }

    // Setup security
    if (!isAdmin) {
      securityManagerRef.current = new SecurityManager(showWarningMessage);
      securityManagerRef.current.enable();
    }

    // Cleanup
    return () => {
      if (navbar) navbar.style.display = '';
      if (header) header.style.display = '';
      const audioManager = audioManagerRef.current;
      if (audioManager) audioManager.destroy();
      if (securityManagerRef.current) {
        securityManagerRef.current.disable();
      }
    };
  }, [isAdmin, showWarningMessage]);

  // ==========================================
  // 🖥️ FULLSCREEN MANAGEMENT
  // ==========================================
  useEffect(() => {
    if (isAdmin) return;

    const handleFullscreenChange = () => {
      const isFullscreen = FullscreenManager.isActive();
      
      // If user exits fullscreen, show warning and re-enter
      if (!isFullscreen) {
        showWarningMessage('⚠️ Stay in fullscreen mode!');
        setTimeout(() => {
          FullscreenManager.enter();
        }, 2000);
      }
    };

    // Listen for fullscreen changes
    const cleanup = FullscreenManager.onChange(handleFullscreenChange);

    return () => {
      cleanup();
      // Only exit if actually in fullscreen
      if (FullscreenManager.isActive()) {
        FullscreenManager.exit();
      }
    };
  }, [isAdmin, showWarningMessage]);

  // ==========================================
  // ⏱️ TIMER
  // ==========================================
  useEffect(() => {
    if (timeLeft <= 0) {
      audioManagerRef.current.playAlarm();
      showWarningMessage('⏰ TIME UP! Auto-submitting...', true);
      setTimeout(() => handleSubmit(false), APP_CONFIG.AUTO_SUBMIT_DELAY);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showWarningMessage, handleSubmit]);

  // ==========================================
  // 🔊 TICK SOUND
  // ==========================================
  useEffect(() => {
    if (isAdmin || timeLeft <= 0) return;

    const tickTimer = setInterval(() => {
      audioManagerRef.current.playTick(timeLeft % 2 === 0);
    }, 1000);

    return () => clearInterval(tickTimer);
  }, [timeLeft, isAdmin]);

  // ==========================================
  // 🚫 TAB SWITCH DETECTION
  // ==========================================
  useEffect(() => {
    if (isAdmin) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);

        if (newCount >= APP_CONFIG.MAX_TAB_SWITCHES) {
          showWarningMessage('🚨 Maximum tab switches! Auto-submitting...', true);
          setTimeout(() => handleSubmit(true), APP_CONFIG.AUTO_SUBMIT_DELAY);
        } else {
          showWarningMessage(`⚠️ Tab Switch ${newCount}/${APP_CONFIG.MAX_TAB_SWITCHES}!`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tabSwitches, isAdmin, showWarningMessage, handleSubmit]);

  // ==========================================
  // 📱 MOBILE DETECTION
  // ==========================================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // ==========================================
  // 🛠️ HANDLERS (moved above useEffects to fix no-use-before-define)
  // ==========================================
  const showWarningMessage = useCallback((message, critical = false) => {
    setWarningMsg(message);
    setShowWarning(true);

    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    const timeout = critical ? APP_CONFIG.CRITICAL_WARNING_TIMEOUT : APP_CONFIG.WARNING_TIMEOUT;
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(false);
    }, timeout);
  }, []);

  const handleSubmit = useCallback((penalized = false) => {
    if (!isAdmin && !allAnswered) {
      showWarningMessage(`⚠️ Answer ALL questions! (${answeredCount}/${questions.length} done)`, true);
      return;
    }

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const score = TestUtils.calculateScore(answers, questions, tabSwitches, isAdmin);

    const results = {
      ...score,
      timeTaken: `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`,
      tabSwitches,
      penalized,
      studentInfo
    };

    onComplete(results);
  }, [answers, questions, tabSwitches, isAdmin, allAnswered, answeredCount, studentInfo, onComplete, showWarningMessage]);

  const handleAnswer = useCallback((qIndex, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  }, []);

  const handleNavigation = useCallback((direction) => {
    if (direction === 'next' && currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  }, [currentQuestion, questions.length]);

  const currentQ = questions[currentQuestion];

  // ==========================================
  // 🎨 RENDER
  // ==========================================
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#f8fafc',
      zIndex: 999999, overflowY: 'auto',
      userSelect: isAdmin ? 'auto' : 'none'
    }}>
      {/* Admin Badge */}
      {isAdmin && (
        <div style={{
          position: 'fixed', top: '10px', left: '10px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '12px',
          fontSize: '0.8rem', fontWeight: '900', zIndex: 10000000,
          boxShadow: '0 6px 20px rgba(16,185,129,0.5)', border: '2px solid #047857'
        }}>
          👑 ADMIN MODE
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && !isAdmin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
          zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            padding: isMobile ? '2.5rem 2rem' : '3rem',
            borderRadius: '28px', maxWidth: '500px', width: '90%',
            border: '5px solid #ef4444',
            boxShadow: '0 30px 80px rgba(239,68,68,0.6)',
            textAlign: 'center', animation: 'pulse 0.5s infinite'
          }}>
            <AlertTriangle size={isMobile ? 64 : 80} color="#dc2626" strokeWidth={3} 
              style={{ marginBottom: '1rem', animation: 'shake 0.5s infinite' }} />
            <div style={{
              fontSize: isMobile ? '1.3rem' : '1.8rem',
              fontWeight: '900', color: '#991b1b', lineHeight: 1.4
            }}>
              {warningMsg}
            </div>
            {tabSwitches > 0 && (
              <div style={{ fontSize: '1rem', color: '#7f1d1d', fontWeight: '700', marginTop: '1rem' }}>
                Tab Switches: {tabSwitches}/{APP_CONFIG.MAX_TAB_SWITCHES}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exit Dialog */}
      {showExitDialog && (
        <ConfirmDialog
          message="Are you sure you want to exit and submit the test?"
          onConfirm={() => { handleSubmit(false); onExit(); }}
          onCancel={() => setShowExitDialog(false)}
        />
      )}

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, background: '#fff',
        borderBottom: '3px solid #e2e8f0',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{
              fontSize: isMobile ? '1.1rem' : '1.4rem',
              fontWeight: '800', color: '#1e293b', margin: '0 0 0.25rem'
            }}>
              {testTitle}
            </h1>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.9rem',
              color: '#64748b', fontWeight: '600',
              display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap'
            }}>
              <span>Q {currentQuestion + 1}/{questions.length}</span>
              <span style={{
                background: allAnswered ? '#dcfce7' : '#fef3c7',
                color: allAnswered ? '#065f46' : '#92400e',
                padding: '0.15rem 0.5rem', borderRadius: '6px',
                fontSize: '0.7rem', fontWeight: '800'
              }}>
                {allAnswered ? '✅' : '📝'} {answeredCount}/{questions.length}
              </span>
              {tabSwitches > 0 && !isAdmin && (
                <span style={{
                  background: '#fee2e2', color: '#dc2626',
                  padding: '0.15rem 0.5rem', borderRadius: '6px',
                  fontSize: '0.7rem', fontWeight: '800'
                }}>
                  ⚠️ {tabSwitches}/{APP_CONFIG.MAX_TAB_SWITCHES}
                </span>
              )}
            </div>
          </div>

          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: isMobile ? '0.5rem 1rem' : '0.65rem 1.25rem',
            background: `linear-gradient(135deg, ${timerTheme.bg}, ${timerTheme.bg})`,
            borderRadius: '12px', border: `3px solid ${timerTheme.border}`,
            boxShadow: `0 4px 12px ${timerTheme.border}33`
          }}>
            <Clock size={isMobile ? 18 : 22} color={timerTheme.text} strokeWidth={2.5}
              style={{ animation: isCriticalTime ? 'shake 0.6s infinite' : 'none' }} />
            <div style={{
              fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: '900',
              color: timerTheme.text, fontFamily: 'monospace',
              animation: isCriticalTime ? 'blink 1s infinite' : 'none'
            }}>
              {timeData.display}
            </div>
          </div>

          {/* Exit Button */}
          <button onClick={() => setShowExitDialog(true)} style={{
            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            border: '3px solid #ef4444', borderRadius: '12px',
            width: isMobile ? '42px' : '52px',
            height: isMobile ? '42px' : '52px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
          }}>
            <X size={isMobile ? 22 : 28} color="#ef4444" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem',
        maxWidth: '1400px', margin: '0 auto', paddingBottom: '6rem'
      }}>
        {/* Question Box - NO CHANGES */}
        <div key={currentQuestion} style={{
          background: '#fff', padding: isMobile ? '1.5rem' : '2.5rem',
          borderRadius: '20px', marginBottom: '2rem',
          border: '3px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          animation: 'slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <div style={{
            fontSize: isMobile ? '1.2rem' : '1.6rem',
            fontWeight: '700', color: '#1e293b',
            marginBottom: '1.5rem', lineHeight: 1.6
          }}>
            {currentQ.question}
          </div>
          {currentQ.code && (
            <div style={{
              background: '#f8fafc', border: '3px solid #cbd5e1',
              borderRadius: '16px', padding: isMobile ? '1.5rem' : '2.5rem',
              overflowX: 'auto', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <pre style={{
                margin: 0, fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: isMobile ? '1.3rem' : '1.8rem',
                lineHeight: 1.8, color: '#000', fontWeight: '500',
                whiteSpace: 'pre', wordWrap: 'normal'
              }}>
{currentQ.code}
              </pre>
            </div>
          )}
        </div>

        {/* Options */}
        <div key={`options-${currentQuestion}`} style={{
          display: 'grid', gap: isMobile ? '1rem' : '1.5rem', marginBottom: '2.5rem'
        }}>
          {currentQ.options.map((option, idx) => {
            const isSelected = answers[currentQuestion] === idx;
            return (
              <button key={idx} onClick={() => handleAnswer(currentQuestion, idx)} style={{
                padding: isMobile ? '1.25rem' : '1.75rem',
                background: isSelected ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#fff',
                border: `3px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
                color: isSelected ? '#fff' : '#1e293b',
                fontSize: isMobile ? '1rem' : '1.3rem', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: isMobile ? '1rem' : '1.5rem',
                boxShadow: isSelected ? '0 8px 24px rgba(59,130,246,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.3s',
                animation: `fadeInUp 0.3s ease ${idx * 0.1}s backwards`
              }}>
                <span style={{
                  width: isMobile ? '40px' : '52px',
                  height: isMobile ? '40px' : '52px',
                  borderRadius: '50%',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: isMobile ? '1.1rem' : '1.4rem',
                  flexShrink: 0
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{option}</span>
                {isSelected && <CheckCircle size={isMobile ? 22 : 28} color="#fff" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '2.5rem' }}>
          <button onClick={() => handleNavigation('prev')} disabled={currentQuestion === 0} style={{
            padding: isMobile ? '1rem 1.5rem' : '1.25rem 2rem',
            background: currentQuestion === 0 ? '#f1f5f9' : 'linear-gradient(135deg, #fff, #f8fafc)',
            border: `3px solid ${currentQuestion === 0 ? '#e2e8f0' : '#cbd5e1'}`,
            borderRadius: '12px', cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
            fontWeight: '700', color: currentQuestion === 0 ? '#94a3b8' : '#1e293b',
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s'
          }}>
            <ChevronLeft size={isMobile ? 18 : 22} />
            {!isMobile && 'Previous'}
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button onClick={() => handleSubmit(false)} disabled={!allAnswered && !isAdmin} style={{
              padding: isMobile ? '1rem 2rem' : '1.25rem 3rem',
              background: (allAnswered || isAdmin) ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
              border: `3px solid ${(allAnswered || isAdmin) ? '#059669' : '#e2e8f0'}`,
              borderRadius: '12px',
              cursor: (allAnswered || isAdmin) ? 'pointer' : 'not-allowed',
              fontWeight: '800', color: (allAnswered || isAdmin) ? '#fff' : '#94a3b8',
              fontSize: isMobile ? '1rem' : '1.2rem',
              boxShadow: (allAnswered || isAdmin) ? '0 8px 24px rgba(16,185,129,0.4)' : 'none',
              textTransform: 'uppercase', transition: 'all 0.2s'
            }}>
              {(allAnswered || isAdmin) ? '✅ Submit Test' : '⚠️ Answer All First'}
            </button>
          ) : (
            <button onClick={() => handleNavigation('next')} style={{
              padding: isMobile ? '1rem 1.5rem' : '1.25rem 2rem',
              background: 'linear-gradient(135deg, #fff, #f8fafc)',
              border: '3px solid #cbd5e1', borderRadius: '12px',
              cursor: 'pointer', fontWeight: '700', color: '#1e293b',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.2s'
            }}>
              {!isMobile && 'Next'}
              <ChevronRight size={isMobile ? 18 : 22} />
            </button>
          )}
        </div>

        {/* Progress Grid */}
        <div style={{
          background: '#fff', padding: isMobile ? '1.25rem' : '1.75rem',
          borderRadius: '20px', border: '3px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            fontSize: isMobile ? '0.9rem' : '1.05rem',
            fontWeight: '800', color: '#64748b', marginBottom: '1.25rem',
            textTransform: 'uppercase', letterSpacing: '0.1em'
          }}>
            Progress: {answeredCount}/{questions.length} Answered
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(44px, 1fr))' : 'repeat(auto-fill, minmax(56px, 1fr))',
            gap: isMobile ? '0.6rem' : '0.85rem'
          }}>
            {questions.map((_, idx) => {
              const isAnswered = answers[idx] !== undefined;
              const isCurrent = idx === currentQuestion;
              return (
                <button key={idx} onClick={() => setCurrentQuestion(idx)} style={{
                  height: isMobile ? '44px' : '56px', borderRadius: '10px',
                  border: isCurrent ? '3px solid #3b82f6' : 'none',
                  background: isAnswered ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
                  color: isAnswered ? '#fff' : '#1e293b',
                  fontWeight: '800', cursor: 'pointer',
                  fontSize: isMobile ? '0.95rem' : '1.15rem',
                  boxShadow: isAnswered ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                  transition: 'all 0.2s',
                  transform: isCurrent ? 'scale(1.05)' : 'scale(1)'
                }}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slideIn { 0% { opacity: 0; transform: translateY(40px) scale(0.9); } 60% { opacity: 1; transform: translateY(-5px) scale(1.02); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px) rotate(-3deg); } 75% { transform: translateX(4px) rotate(3deg); } }
        @keyframes blink { 0%, 49%, 100% { opacity: 1; } 50%, 99% { opacity: 0.3; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
      `}</style>
    </div>
  );
}

// ==========================================
// 📊 RESULT SCREEN
// ==========================================
function ResultScreen({ results, onGoToMainPage }) {
  const { correct, wrong, total, percentage, passed, timeTaken, tabSwitches, correctQuestions, wrongQuestions, studentInfo } = results;
  const isMobile = window.innerWidth <= 768;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const certId = `CERT-${Date.now().toString().slice(-8)}`;

  useEffect(() => {
    FullscreenManager.exit();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', overflowY: 'auto', padding: isMobile ? '1rem' : '2rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Result Header */}
        <div style={{
          background: passed ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
          borderRadius: '24px', padding: isMobile ? '2rem 1.5rem' : '2.5rem',
          textAlign: 'center', marginBottom: '1.25rem',
          boxShadow: passed ? '0 12px 40px rgba(16,185,129,0.4)' : '0 12px 40px rgba(239,68,68,0.4)'
        }}>
          <div style={{ fontSize: isMobile ? '3.5rem' : '5rem', marginBottom: '0.5rem' }}>
            {passed ? '🎉' : '😔'}
          </div>
          <div style={{ fontSize: 'clamp(2rem,8vw,3.5rem)', fontWeight: '900', color: '#fff', lineHeight: 1, marginBottom: '0.5rem' }}>
            {percentage}%
          </div>
          <div style={{ fontSize: 'clamp(1.2rem,4vw,1.8rem)', fontWeight: '800', color: 'rgba(255,255,255,0.9)', marginBottom: '0.5rem' }}>
            {passed ? 'PASS ✅' : 'FAIL ❌'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: '0.95rem' }}>
            {passed ? 'Congratulations! Certificate Generated Below 🏆' : 'Minimum 55% required to pass. Try Again! 💪'}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
          {[
            { icon: '✅', label: 'Correct', value: correct, bg: '#f0fdf4', border: '#10b981', color: '#10b981' },
            { icon: '❌', label: 'Wrong', value: wrong, bg: '#fff5f5', border: '#ef4444', color: '#ef4444' },
            { icon: '⏱️', label: 'Time Taken', value: timeTaken, bg: '#eff6ff', border: '#3b82f6', color: '#3b82f6' },
            { icon: '📝', label: 'Total', value: `${correct}/${total}`, bg: '#f8fafc', border: '#94a3b8', color: '#475569' },
          ].map((s, i) => (
            <div key={i} style={{
              background: s.bg, border: `2.5px solid ${s.border}`,
              borderRadius: '18px', padding: isMobile ? '1.1rem' : '1.4rem',
              textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div style={{ color: s.color, fontWeight: '900', fontSize: isMobile ? '1.5rem' : '2rem', lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '700', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Analysis */}
        <div style={{
          background: '#fff', border: '3px solid #e2e8f0',
          borderRadius: '20px', padding: isMobile ? '1.25rem' : '1.75rem',
          marginBottom: '1.25rem', boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <h3 style={{ color: '#1e293b', fontWeight: '800', fontSize: '1rem', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            📋 Question-wise Analysis
          </h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <CheckCircle size={18} color="#10b981" />
              <span style={{ color: '#065f46', fontWeight: '800', fontSize: '0.9rem' }}>
                Correct Questions ({correctQuestions.length})
              </span>
            </div>
            {correctQuestions.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {correctQuestions.map(qNum => (
                  <span key={qNum} style={{
                    background: '#dcfce7', border: '2px solid #10b981',
                    color: '#065f46', borderRadius: '8px',
                    padding: '0.3rem 0.75rem', fontSize: '0.88rem', fontWeight: '800'
                  }}>Q{qNum}</span>
                ))}
              </div>
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '0.88rem', fontWeight: '600' }}>None answered correctly</span>
            )}
          </div>

          <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 1.25rem' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <XCircle size={18} color="#ef4444" />
              <span style={{ color: '#991b1b', fontWeight: '800', fontSize: '0.9rem' }}>
                Wrong / Unattempted ({wrongQuestions.length})
              </span>
            </div>
            {wrongQuestions.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {wrongQuestions.map(qNum => (
                  <span key={qNum} style={{
                    background: '#fee2e2', border: '2px solid #ef4444',
                    color: '#991b1b', borderRadius: '8px',
                    padding: '0.3rem 0.75rem', fontSize: '0.88rem', fontWeight: '800'
                  }}>Q{qNum}</span>
                ))}
              </div>
            ) : (
              <span style={{ color: '#10b981', fontSize: '0.88rem', fontWeight: '700' }}>All correct! Perfect score! 🎉</span>
            )}
          </div>

          {tabSwitches > 0 && (
            <div style={{
              marginTop: '1.25rem', padding: '0.85rem 1rem',
              background: '#fef3c7', border: '2px solid #f59e0b',
              borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <AlertTriangle size={18} color="#d97706" />
              <span style={{ color: '#92400e', fontSize: '0.85rem', fontWeight: '800' }}>
                Tab switches recorded: {tabSwitches}/3
              </span>
            </div>
          )}
        </div>

        {/* Certificate */}
        {passed && studentInfo && (
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef9c3 50%, #fffbeb 100%)',
            border: '5px solid #f59e0b', borderRadius: '24px',
            padding: isMobile ? '1.75rem 1.25rem' : '3rem',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(245,158,11,0.25)',
            marginBottom: '1.25rem'
          }}>
            {[
              { top: '10px', left: '10px', borderTop: '3px solid #d97706', borderLeft: '3px solid #d97706' },
              { top: '10px', right: '10px', borderTop: '3px solid #d97706', borderRight: '3px solid #d97706' },
              { bottom: '10px', left: '10px', borderBottom: '3px solid #d97706', borderLeft: '3px solid #d97706' },
              { bottom: '10px', right: '10px', borderBottom: '3px solid #d97706', borderRight: '3px solid #d97706' },
            ].map((style, i) => (
              <div key={i} style={{ position: 'absolute', width: '32px', height: '32px', ...style }} />
            ))}

            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: isMobile ? '72px' : '90px', height: isMobile ? '72px' : '90px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '50%', margin: '0 auto 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(245,158,11,0.5)', border: '4px solid #92400e'
              }}>
                <Award size={isMobile ? 32 : 42} color="#fff" strokeWidth={1.8} />
              </div>

              <div style={{ color: '#92400e', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Certificate of Achievement
              </div>

              <div style={{ color: '#78350f', fontSize: isMobile ? '0.82rem' : '0.95rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                This is to certify that
              </div>

              <div style={{
                fontSize: isMobile ? '1.8rem' : '2.4rem', fontWeight: '900',
                color: '#1a0a00', fontFamily: 'Georgia, serif',
                borderBottom: '2.5px solid #d97706', paddingBottom: '0.5rem',
                marginBottom: '0.75rem', display: 'inline-block', minWidth: '60%'
              }}>
                {studentInfo.fullName}
              </div>

              <div style={{ color: '#78350f', fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                has successfully completed
              </div>

              <div style={{ fontSize: isMobile ? '1rem' : '1.3rem', fontWeight: '900', color: '#92400e', marginBottom: '0.75rem' }}>
                Mock Test Examination
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#10b981', borderRadius: '50px',
                padding: isMobile ? '0.4rem 1.25rem' : '0.5rem 1.75rem',
                marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(16,185,129,0.35)'
              }}>
                <span style={{ color: '#fff', fontWeight: '900', fontSize: isMobile ? '1rem' : '1.25rem' }}>
                  Score: {percentage}% — PASS
                </span>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem', paddingTop: '1rem', borderTop: '1.5px dashed #d97706'
              }}>
                {[
                  { label: 'Candidate', value: studentInfo.fullName?.split(' ')[0] || '' },
                  { label: 'Date', value: dateStr },
                  { label: 'Cert ID', value: certId },
                ].map((info, i) => (
                  <div key={i} style={{ textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center' }}>
                    <div style={{ color: '#78350f', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>
                      {info.label}
                    </div>
                    <div style={{ color: '#1a0a00', fontWeight: '700', fontSize: i === 2 ? '0.65rem' : '0.8rem', fontFamily: i === 2 ? 'monospace' : 'inherit' }}>
                      {info.value}
                    </div>
                  </div>
                ))}
              </div>
              {studentInfo.address && (
                <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                  <span style={{ color: '#78350f', fontSize: '0.65rem', fontWeight: '800' }}>Address: </span>
                  <span style={{ color: '#1a0a00', fontSize: '0.75rem', fontWeight: '700' }}>{studentInfo.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={onGoToMainPage} style={{
            flex: 1, padding: '1rem',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: '3px solid #2563eb', borderRadius: '14px', color: '#fff',
            fontSize: '1rem', fontWeight: '800', cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(59,130,246,0.35)', transition: 'all 0.2s'
          }}>
            🏠 Back to Tests
          </button>
          
          {passed && (
            <button onClick={() => window.print()} style={{
              flex: 1, padding: '1rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: '3px solid #d97706', borderRadius: '14px',
              color: '#fff', fontSize: '1rem', fontWeight: '800', cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(245,158,11,0.35)', transition: 'all 0.2s'
            }}>
              🖨️ Print Certificate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🎯 MAIN APP
// ==========================================
export default function MockTestApp({ questions, testTitle, timeLimit, userEmail }) {
  const [stage, setStage] = useState('instructions');
  const [studentInfo, setStudentInfo] = useState(null);
  const [results, setResults] = useState(null);

  const handleInstructionsAccept = () => {
    // Request fullscreen immediately on user button click
    if (userEmail !== APP_CONFIG.ADMIN_EMAIL) {
      FullscreenManager.enter();
    }
    setStage('form');
  };

  return (
    <>
      {stage === 'instructions' && (
        <InstructionScreen
          testTitle={testTitle}
          timeLimit={timeLimit}
          totalQuestions={questions.length}
          onAccept={handleInstructionsAccept}
        />
      )}
      {stage === 'form' && (
        <UserDetailsForm
          onSubmit={(info) => { setStudentInfo(info); setStage('test'); }}
          onCancel={() => setStage('instructions')}
        />
      )}
      {stage === 'test' && (
        <TestInterface
          questions={questions}
          testTitle={testTitle}
          timeLimit={timeLimit}
          userEmail={userEmail}
          studentInfo={studentInfo}
          onComplete={(res) => { setResults(res); setStage('results'); }}
          onExit={() => setStage('instructions')}
        />
      )}
      {stage === 'results' && (
        <ResultScreen
          results={results}
          onGoToMainPage={() => window.location.reload()}
        />
      )}
    </>
  );
}