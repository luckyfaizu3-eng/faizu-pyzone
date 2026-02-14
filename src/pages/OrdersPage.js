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
// 🖥️ FULLSCREEN MANAGER
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
      if (process.env.NODE_ENV === 'production') {
        console.error('Fullscreen error:', err);
      }
      return false;
    }
  }

  static async exit() {
    try {
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
      animation: 'fadeIn 0.3s ease', padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
        padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        borderRadius: '28px',
        maxWidth: '480px',
        width: '100%',
        border: '4px solid #e2e8f0',
        boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        textAlign: 'center',
        animation: 'scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}>
        <div style={{
          width: 'clamp(60px, 15vw, 80px)',
          height: 'clamp(60px, 15vw, 80px)',
          margin: '0 auto 1.5rem',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(251,191,36,0.4)'
        }}>
          <AlertTriangle size={window.innerWidth < 768 ? 32 : 42} color="#fff" strokeWidth={2.5} />
        </div>
        
        <div style={{
          fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
          fontWeight: '800',
          color: '#1e293b',
          marginBottom: '2rem',
          lineHeight: 1.4
        }}>
          {message}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row'
        }}>
          <button onClick={onCancel} style={{
            flex: 1,
            padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
            background: '#fff',
            border: '3px solid #e2e8f0',
            borderRadius: '14px',
            color: '#64748b',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            ✕ Cancel
          </button>
          
          <button onClick={onConfirm} style={{
            flex: 1,
            padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: '3px solid #dc2626',
            borderRadius: '14px',
            color: '#fff',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
            fontWeight: '800',
            cursor: 'pointer',
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
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: 'clamp(1rem, 3vw, 2rem)',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '680px',
        padding: 'clamp(1rem, 3vw, 2rem) 0'
      }}>
        {/* Header */}
        <div style={{
          background: '#fff',
          border: '3px solid #e2e8f0',
          borderRadius: '20px',
          padding: 'clamp(1.25rem, 4vw, 1.5rem)',
          marginBottom: '1rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#eff6ff',
            border: '2px solid #bfdbfe',
            borderRadius: '50px',
            padding: '0.5rem 1.25rem',
            marginBottom: '1rem'
          }}>
            <Shield size={18} color="#3b82f6" />
            <span style={{
              color: '#1d4ed8',
              fontWeight: '800',
              fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
              letterSpacing: '0.06em'
            }}>
              EXAM INSTRUCTIONS
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(1.3rem, 5vw, 1.9rem)',
            fontWeight: '800',
            color: '#1e293b',
            margin: '0 0 0.75rem'
          }}>
            {testTitle}
          </h1>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(1rem, 4vw, 1.5rem)',
            flexWrap: 'wrap'
          }}>
            {[
              { label: 'Duration', value: `${timeLimit} Min` },
              { label: 'Questions', value: `${totalQuestions} Qs` },
              { label: 'Pass Mark', value: '55%' }
            ].map((s, i) => (
              <div key={i}>
                <div style={{
                  fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                  fontWeight: '900',
                  color: '#3b82f6'
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                  color: '#64748b',
                  fontWeight: '700'
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#fff',
          border: '3px solid #e2e8f0',
          borderRadius: '20px',
          padding: 'clamp(1.25rem, 4vw, 1.5rem)',
          marginBottom: '1rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <BookOpen size={18} color="#3b82f6" />
            <span style={{
              color: '#1e293b',
              fontWeight: '800',
              fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Test Instructions
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            {instructions.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                padding: 'clamp(0.85rem, 2.5vw, 1rem)',
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '14px'
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  minWidth: '26px',
                  borderRadius: '8px',
                  border: '2.5px solid #cbd5e1',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontWeight: '800',
                  fontSize: '0.85rem'
                }}>
                  {idx + 1}
                </div>
                <span style={{
                  color: '#475569',
                  fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
                  fontWeight: '600',
                  lineHeight: 1.55,
                  flex: 1
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div onClick={() => setAccepted(!accepted)} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: 'clamp(1rem, 3vw, 1.25rem)',
            background: accepted ? '#f0fdf4' : '#fff',
            border: `3px solid ${accepted ? '#10b981' : '#e2e8f0'}`,
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              borderRadius: '8px',
              border: `3px solid ${accepted ? '#10b981' : '#cbd5e1'}`,
              background: accepted ? '#10b981' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}>
              {accepted && <CheckCircle size={20} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{
              color: accepted ? '#065f46' : '#475569',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
              fontWeight: accepted ? '800' : '700',
              lineHeight: 1.4,
              flex: 1
            }}>
              ✅ I have read and understood all instructions above
            </span>
          </div>
        </div>

        <button onClick={() => accepted && onAccept()} disabled={!accepted} style={{
          width: '100%',
          padding: 'clamp(1rem, 3vw, 1.1rem)',
          background: accepted ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
          border: accepted ? '3px solid #059669' : '3px solid #e2e8f0',
          borderRadius: '16px',
          color: accepted ? '#fff' : '#94a3b8',
          fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
          fontWeight: '800',
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
  // 🛠️ HANDLERS
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

  const handleAnswer = useCallback((qIndex, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
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
    const navbar = document.querySelector('nav');
    const header = document.querySelector('header');
    if (navbar) navbar.style.display = 'none';
    if (header) header.style.display = 'none';

    const currentAudioManager = audioManagerRef.current;
    const currentSecurityManager = securityManagerRef.current;

    if (!isAdmin) {
      currentAudioManager.init();
      securityManagerRef.current = new SecurityManager(showWarningMessage);
      securityManagerRef.current.enable();
    }

    return () => {
      if (navbar) navbar.style.display = '';
      if (header) header.style.display = '';
      currentAudioManager.destroy();
      if (currentSecurityManager) {
        currentSecurityManager.disable();
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
      
      if (!isFullscreen) {
        showWarningMessage('⚠️ Stay in fullscreen mode!');
        setTimeout(() => {
          FullscreenManager.enter();
        }, 2000);
      }
    };

    const cleanup = FullscreenManager.onChange(handleFullscreenChange);

    return () => {
      cleanup();
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
  // 🛠️ NAVIGATION HANDLER
  // ==========================================
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
      position: 'fixed',
      inset: 0,
      background: '#f8fafc',
      zIndex: 999999,
      overflowY: 'auto',
      userSelect: isAdmin ? 'auto' : 'none'
    }}>
      {/* Admin Badge */}
      {isAdmin && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.8rem, 3vw, 1.2rem)',
          borderRadius: '12px',
          fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
          fontWeight: '900',
          zIndex: 10000000,
          boxShadow: '0 6px 20px rgba(16,185,129,0.5)',
          border: '2px solid #047857'
        }}>
          👑 ADMIN MODE
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && !isAdmin && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          padding: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            padding: 'clamp(2rem, 5vw, 3rem)',
            borderRadius: '28px',
            maxWidth: '500px',
            width: '100%',
            border: '5px solid #ef4444',
            boxShadow: '0 30px 80px rgba(239,68,68,0.6)',
            textAlign: 'center',
            animation: 'pulse 0.5s infinite'
          }}>
            <AlertTriangle
              size={isMobile ? 64 : 80}
              color="#dc2626"
              strokeWidth={3}
              style={{ marginBottom: '1rem', animation: 'shake 0.5s infinite' }}
            />
            <div style={{
              fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
              fontWeight: '900',
              color: '#991b1b',
              lineHeight: 1.4
            }}>
              {warningMsg}
            </div>
            {tabSwitches > 0 && (
              <div style={{
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                color: '#7f1d1d',
                fontWeight: '700',
                marginTop: '1rem'
              }}>
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
        position: 'sticky',
        top: 0,
        background: '#fff',
        borderBottom: '3px solid #e2e8f0',
        padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{
              fontSize: 'clamp(1rem, 3vw, 1.4rem)',
              fontWeight: '800',
              color: '#1e293b',
              margin: '0 0 0.25rem'
            }}>
              {testTitle}
            </h1>
            <div style={{
              fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
              color: '#64748b',
              fontWeight: '600',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <span>Q {currentQuestion + 1}/{questions.length}</span>
              <span style={{
                background: allAnswered ? '#dcfce7' : '#fef3c7',
                color: allAnswered ? '#065f46' : '#92400e',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: 'clamp(0.65rem, 1.8vw, 0.7rem)',
                fontWeight: '800'
              }}>
                {allAnswered ? '✅' : '📝'} {answeredCount}/{questions.length}
              </span>
              {tabSwitches > 0 && !isAdmin && (
                <span style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: 'clamp(0.65rem, 1.8vw, 0.7rem)',
                  fontWeight: '800'
                }}>
                  ⚠️ {tabSwitches}/{APP_CONFIG.MAX_TAB_SWITCHES}
                </span>
              )}
            </div>
          </div>

          {/* Timer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: 'clamp(0.4rem, 2vw, 0.65rem) clamp(0.8rem, 3vw, 1.25rem)',
            background: `linear-gradient(135deg, ${timerTheme.bg}, ${timerTheme.bg})`,
            borderRadius: '12px',
            border: `3px solid ${timerTheme.border}`,
            boxShadow: `0 4px 12px ${timerTheme.border}33`
          }}>
            <Clock
              size={isMobile ? 18 : 22}
              color={timerTheme.text}
              strokeWidth={2.5}
              style={{ animation: isCriticalTime ? 'shake 0.6s infinite' : 'none' }}
            />
            <div style={{
              fontSize: 'clamp(1rem, 3vw, 1.4rem)',
              fontWeight: '900',
              color: timerTheme.text,
              fontFamily: 'monospace',
              animation: isCriticalTime ? 'blink 1s infinite' : 'none'
            }}>
              {timeData.display}
            </div>
          </div>

          {/* Exit Button */}
          <button onClick={() => setShowExitDialog(true)} style={{
            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            border: '3px solid #ef4444',
            borderRadius: '12px',
            width: 'clamp(38px, 10vw, 52px)',
            height: 'clamp(38px, 10vw, 52px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
          }}>
            <X size={isMobile ? 20 : 28} color="#ef4444" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        padding: 'clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem)',
        maxWidth: '1400px',
        margin: '0 auto',
        paddingBottom: '6rem'
      }}>
        {/* Question Box */}
        <div key={currentQuestion} style={{
          background: '#fff',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          borderRadius: '20px',
          marginBottom: '2rem',
          border: '3px solid #e2e8f0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          animation: 'slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <div style={{
            fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '1.5rem',
            lineHeight: 1.6
          }}>
            {currentQ.question}
          </div>
          {currentQ.code && (
            <div style={{
              background: '#f8fafc',
              border: '3px solid #cbd5e1',
              borderRadius: '16px',
              padding: 'clamp(1.5rem, 4vw, 2.5rem)',
              overflowX: 'auto',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <pre style={{
                margin: 0,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: 'clamp(1.2rem, 3.5vw, 1.8rem)',
                lineHeight: 1.8,
                color: '#000',
                fontWeight: '500',
                whiteSpace: 'pre',
                wordWrap: 'normal'
              }}>
{currentQ.code}
              </pre>
            </div>
          )}
        </div>

        {/* Options */}
        <div key={`options-${currentQuestion}`} style={{
          display: 'grid',
          gap: 'clamp(1rem, 3vw, 1.5rem)',
          marginBottom: '2.5rem'
        }}>
          {currentQ.options.map((option, idx) => {
            const isSelected = answers[currentQuestion] === idx;
            return (
              <button key={idx} onClick={() => handleAnswer(currentQuestion, idx)} style={{
                padding: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                background: isSelected ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#fff',
                border: `3px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                color: isSelected ? '#fff' : '#1e293b',
                fontSize: 'clamp(0.95rem, 2.8vw, 1.3rem)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(1rem, 3vw, 1.5rem)',
                boxShadow: isSelected ? '0 8px 24px rgba(59,130,246,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.3s',
                animation: `fadeInUp 0.3s ease ${idx * 0.1}s backwards`
              }}>
                <span style={{
                  width: 'clamp(36px, 10vw, 52px)',
                  height: 'clamp(36px, 10vw, 52px)',
                  borderRadius: '50%',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: 'clamp(1rem, 3vw, 1.4rem)',
                  flexShrink: 0
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{option}</span>
                {isSelected && <CheckCircle size={isMobile ? 20 : 28} color="#fff" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2.5rem'
        }}>
          <button onClick={() => handleNavigation('prev')} disabled={currentQuestion === 0} style={{
            padding: 'clamp(0.9rem, 2.5vw, 1.25rem) clamp(1.25rem, 4vw, 2rem)',
            background: currentQuestion === 0 ? '#f1f5f9' : 'linear-gradient(135deg, #fff, #f8fafc)',
            border: `3px solid ${currentQuestion === 0 ? '#e2e8f0' : '#cbd5e1'}`,
            borderRadius: '12px',
            cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
            fontWeight: '700',
            color: currentQuestion === 0 ? '#94a3b8' : '#1e293b',
            fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}>
            <ChevronLeft size={isMobile ? 18 : 22} />
            {!isMobile && 'Previous'}
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button onClick={() => handleSubmit(false)} disabled={!allAnswered && !isAdmin} style={{
              padding: 'clamp(0.9rem, 2.5vw, 1.25rem) clamp(1.5rem, 5vw, 3rem)',
              background: (allAnswered || isAdmin) ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
              border: `3px solid ${(allAnswered || isAdmin) ? '#059669' : '#e2e8f0'}`,
              borderRadius: '12px',
              cursor: (allAnswered || isAdmin) ? 'pointer' : 'not-allowed',
              fontWeight: '800',
              color: (allAnswered || isAdmin) ? '#fff' : '#94a3b8',
              fontSize: 'clamp(0.9rem, 2.8vw, 1.2rem)',
              boxShadow: (allAnswered || isAdmin) ? '0 8px 24px rgba(16,185,129,0.4)' : 'none',
              textTransform: 'uppercase',
              transition: 'all 0.2s'
            }}>
              {(allAnswered || isAdmin) ? '✅ Submit Test' : '⚠️ Answer All'}
            </button>
          ) : (
            <button onClick={() => handleNavigation('next')} style={{
              padding: 'clamp(0.9rem, 2.5vw, 1.25rem) clamp(1.25rem, 4vw, 2rem)',
              background: 'linear-gradient(135deg, #fff, #f8fafc)',
              border: '3px solid #cbd5e1',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              color: '#1e293b',
              fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}>
              {!isMobile && 'Next'}
              <ChevronRight size={isMobile ? 18 : 22} />
            </button>
          )}
        </div>

        {/* Progress Grid */}
        <div style={{
          background: '#fff',
          padding: 'clamp(1.25rem, 3.5vw, 1.75rem)',
          borderRadius: '20px',
          border: '3px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            fontSize: 'clamp(0.85rem, 2.5vw, 1.05rem)',
            fontWeight: '800',
            color: '#64748b',
            marginBottom: '1.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Progress: {answeredCount}/{questions.length} Answered
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(40px, 1fr))' : 'repeat(auto-fill, minmax(56px, 1fr))',
            gap: 'clamp(0.6rem, 2vw, 0.85rem)'
          }}>
            {questions.map((_, idx) => {
              const isAnswered = answers[idx] !== undefined;
              const isCurrent = idx === currentQuestion;
              return (
                <button key={idx} onClick={() => setCurrentQuestion(idx)} style={{
                  height: 'clamp(40px, 12vw, 56px)',
                  borderRadius: '10px',
                  border: isCurrent ? '3px solid #3b82f6' : 'none',
                  background: isAnswered ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
                  color: isAnswered ? '#fff' : '#1e293b',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.85rem, 2.5vw, 1.15rem)',
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
// 🎯 MAIN APP
// ==========================================
export default function MockTestApp({ questions, testTitle, timeLimit, userEmail }) {
  const [stage, setStage] = useState('instructions');
  const [studentInfo, setStudentInfo] = useState(null);
  const [results, setResults] = useState(null);

  const handleInstructionsAccept = () => {
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
    </>
  );
}