import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Shield, BookOpen } from 'lucide-react';
import UserDetailsForm from './UserDetailsForm';

// ==========================================
// 💾 LEADERBOARD STORAGE MANAGER
// ==========================================
class LeaderboardStorage {
  static async saveEntry(testResult) {
    try {
      // Import Firestore functions
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const newEntry = {
        name: testResult.studentInfo?.name || testResult.studentInfo?.fullName || testResult.userName || 'Anonymous',
        email: testResult.userEmail,
        percentage: testResult.percentage,
        score: `${testResult.correct}/${testResult.total}`,
        testTitle: testResult.testTitle,
        testLevel: testResult.testLevel,
        timeTaken: testResult.timeTaken,
        passed: testResult.passed,
        penalized: testResult.penalized || false,
        disqualificationReason: testResult.disqualificationReason || '',
        date: new Date().toLocaleDateString('en-GB'),
        timestamp: Date.now()
      };

      const docRef = await addDoc(collection(db, 'leaderboard'), newEntry);
      console.log('✅ Leaderboard entry saved to FIRESTORE:', docRef.id);
      console.log('📊 Entry details:', newEntry);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error saving to leaderboard:', error);
      return { success: false, error: error.message };
    }
  }

  static getAllEntries() {
    return [];
  }
}

// ==========================================
// 🎯 CONFIGURATION
// ==========================================
const APP_CONFIG = {
  ADMIN_EMAIL: 'luckyfaizu3@gmail.com',
  MAX_TAB_SWITCHES: 3,
  PASS_PERCENTAGE: 55,
  WARNING_TIMEOUT: 3000,
  CRITICAL_WARNING_TIMEOUT: 8000,
  FINAL_WARNING_TIMEOUT: 10000,
  AUTO_SUBMIT_DELAY: 2000,
  CRITICAL_TIME_MINUTES: 5,
  CERTIFICATE_COOLDOWN_DAYS: 30,
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
// 🖥️ ENHANCED FULLSCREEN MANAGER
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
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      }
      
      this.hideBrowserUI();
      this.lockOrientation();
      return true;
    } catch (err) {
      console.error('Fullscreen error:', err);
      return false;
    }
  }

  static hideBrowserUI() {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui';
    document.head.appendChild(meta);

    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {});
    }
  }

  static lockOrientation() {
    try {
      if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
        window.screen.orientation.lock('portrait').catch(() => {});
      }
    } catch (err) {
      // Orientation lock not supported, ignore
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
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      }
      
      this.restoreBrowserUI();
    } catch (err) {
      console.log('Fullscreen exit:', err.message);
    }
  }

  static restoreBrowserUI() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.overscrollBehavior = '';
  }

  static isActive() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      document.mozFullScreenElement
    );
  }

  static onChange(callback) {
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange', 'mozfullscreenchange'];
    events.forEach(event => document.addEventListener(event, callback));
    return () => events.forEach(event => document.removeEventListener(event, callback));
  }
}

// ==========================================
// 🔒 ENHANCED SECURITY MANAGER
// ==========================================
class SecurityManager {
  constructor(onWarning, onAutoSubmit) {
    this.onWarning = onWarning;
    this.onAutoSubmit = onAutoSubmit;
    this.violationCount = 0;
    this.maxViolations = 5;
    this.lastBlurTime = 0;
    this.blurCheckDelay = 500;
    
    this.handlers = {
      copy: (e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        this.recordViolation('⚠️ Copying disabled!'); 
      },
      cut: (e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        this.recordViolation('⚠️ Cutting disabled!'); 
      },
      paste: (e) => { 
        e.preventDefault(); 
        e.stopPropagation();
      },
      contextMenu: (e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        this.recordViolation('⚠️ Right-click disabled!'); 
      },
      keydown: (e) => {
        const isCopyPaste = (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 's'].includes(e.key.toLowerCase());
        const isDevTools = e.key === 'F12' || 
                          ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
                          ((e.ctrlKey || e.metaKey) && ['u', 'i'].includes(e.key.toLowerCase()));
        const isRefresh = e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r');
        const isPrint = (e.ctrlKey || e.metaKey) && e.key === 'p';
        const isScreenshot = (e.shiftKey && ['s', '4', '3'].includes(e.key.toLowerCase()) && (e.metaKey || e.key === 'Meta'));
        
        if (isCopyPaste || isDevTools || isRefresh || isPrint || isScreenshot) {
          e.preventDefault();
          e.stopPropagation();
          this.recordViolation('⚠️ Keyboard shortcut blocked!');
        }
      },
      dragstart: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      drop: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      selectstart: (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      },
      beforeprint: (e) => {
        e.preventDefault();
        this.recordViolation('⚠️ Printing disabled!');
      }
    };
  }

  recordViolation(message) {
    this.violationCount++;
    this.onWarning(message);
    
    if (this.violationCount >= this.maxViolations) {
      this.onWarning('🚨 Too many violations! Auto-submitting...', true);
      setTimeout(() => {
        if (this.onAutoSubmit) {
          this.onAutoSubmit(true);
        }
      }, 2000);
    }
  }

  enable() {
    Object.entries(this.handlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler, true);
    });
    
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    
    this.startDevToolsDetection();
  }

  disable() {
    Object.entries(this.handlers).forEach(([event, handler]) => {
      document.removeEventListener(event, handler, true);
    });
    
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.msUserSelect = '';
    document.body.style.mozUserSelect = '';
    
    this.stopDevToolsDetection();
  }

  startDevToolsDetection() {
    this.devToolsInterval = setInterval(() => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        this.recordViolation('⚠️ Developer tools detected!');
      }
    }, 1000);
  }

  stopDevToolsDetection() {
    if (this.devToolsInterval) {
      clearInterval(this.devToolsInterval);
      this.devToolsInterval = null;
    }
  }
}

// ==========================================
// 🧹 CENTRALIZED CLEANUP MANAGER - ✅ CRITICAL FIX
// ==========================================
class CleanupManager {
  static performFullCleanup() {
    console.log('🧹 [CleanupManager] Starting full cleanup...');
    
    // ✅ Exit fullscreen
    FullscreenManager.exit();
    
    // ✅ Clear beforeunload
    window.onbeforeunload = null;
    
    // ✅ Restore ALL body/html/documentElement styles
    const elementsToRestore = [document.body, document.documentElement];
    elementsToRestore.forEach(el => {
      if (el) {
        el.style.overflow = '';
        el.style.position = '';
        el.style.margin = '';
        el.style.padding = '';
        el.style.width = '';
        el.style.height = '';
        el.style.top = '';
        el.style.left = '';
        el.style.overscrollBehavior = '';
        el.style.userSelect = '';
        el.style.webkitUserSelect = '';
        el.style.msUserSelect = '';
        el.style.mozUserSelect = '';
      }
    });
    
    // ✅ Restore hidden elements
    const hiddenElements = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
    hiddenElements.forEach(el => {
      if (el && !el.hasAttribute('data-test-interface')) {
        el.style.display = '';
        el.style.visibility = '';
      }
    });
    
    // ✅ DON'T remove test elements - React will handle cleanup
    // This prevents "removeChild" errors when React tries to unmount
    
    // ✅ Force scroll restoration
    window.scrollTo(0, 0);
    
    console.log('✅ [CleanupManager] Cleanup completed successfully');
  }
}

// ==========================================
// 📋 INSTRUCTION SCREEN (MOBILE OPTIMIZED)
// ==========================================
function InstructionScreen({ onAccept, testTitle, timeLimit, totalQuestions }) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const elementsToHide = [
      'nav', 'header', 'footer', 
      '.navbar', '.header', '.footer',
      '.telegram-button', '#telegram-button',
      '.TelegramButton', '[class*="telegram"]',
      '.background', '.Background', '[class*="background"]',
      '.toast-container', '.ToastContainer',
      '[class*="razorpay"]', '[id*="razorpay"]'
    ];
    
    const hiddenElements = [];
    
    elementsToHide.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el) {
            hiddenElements.push({ 
              element: el, 
              display: el.style.display,
              visibility: el.style.visibility 
            });
            el.style.display = 'none';
            el.style.visibility = 'hidden';
          }
        });
      } catch (e) {}
    });

    return () => {
      hiddenElements.forEach(({ element, display, visibility }) => {
        if (element) {
          element.style.display = display || '';
          element.style.visibility = visibility || '';
        }
      });
    };
  }, []);

  const instructions = [
    { text: `Test duration is ${timeLimit} minutes. Timer starts immediately after you begin.` },
    { text: `Do NOT switch tabs or windows. After 3 tab switches, test auto-submits.` },
    { text: 'Copy, paste, right-click, and screenshots are disabled during the test.' },
    { text: 'Test runs in fullscreen mode. Exiting fullscreen will trigger a warning.' },
    { text: 'You can navigate between questions freely before submitting.' },
    { text: 'ALL questions must be answered (A to Z completion required).' },
    { text: 'Score 55% or above to PASS and receive your Certificate of Achievement.' },
    { text: 'Any cheating attempt will result in automatic test submission with penalty.' },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      <div style={{ width: '100%', maxWidth: '680px', padding: '1rem 0' }}>
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
// 🎮 MAIN TEST INTERFACE (MOBILE OPTIMIZED)
// ==========================================
function TestInterface({ questions, onComplete, testTitle, timeLimit, userEmail, studentInfo }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [warningType, setWarningType] = useState('normal');
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const startTimeRef = useRef(Date.now());
  const audioManagerRef = useRef(new AudioManager());
  const securityManagerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const hasSubmittedRef = useRef(false);

  const isAdmin = TestUtils.isAdmin(userEmail);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const timeData = TestUtils.formatTime(timeLeft);
  const timerTheme = TestUtils.getTimerTheme(timeLeft, timeLimit * 60);
  const isCriticalTime = timeLeft < APP_CONFIG.CRITICAL_TIME_MINUTES * 60;

  const showWarningMessage = useCallback((message, type = 'normal') => {
    setWarningMsg(message);
    setWarningType(type);
    setShowWarning(true);

    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    let timeout = APP_CONFIG.WARNING_TIMEOUT;
    if (type === 'critical') timeout = APP_CONFIG.CRITICAL_WARNING_TIMEOUT;
    if (type === 'final') timeout = APP_CONFIG.FINAL_WARNING_TIMEOUT;

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(false);
    }, timeout);
  }, []);

  const handleAnswer = useCallback((qIndex, optionIndex) => {
    if (isDisqualified) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  }, [isDisqualified]);

  const handleSubmit = useCallback((penalized = false, reason = '') => {
    if (hasSubmittedRef.current) {
      console.log('⚠️ Already submitted, ignoring duplicate submission');
      return;
    }

    // ✅ IMMEDIATE FULLSCREEN EXIT - 0.1 second
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    } else if (document.msFullscreenElement) {
      document.msExitFullscreen();
    } else if (document.mozFullScreenElement) {
      document.mozCancelFullScreen();
    }

    if (!isAdmin && !allAnswered && !penalized) {
      showWarningMessage(`⚠️ Answer ALL questions! (${answeredCount}/${questions.length} done)`, 'normal');
      return;
    }

    hasSubmittedRef.current = true;

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const score = TestUtils.calculateScore(answers, questions, tabSwitches, isAdmin);

    const results = {
      ...score,
      timeTaken: `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`,
      tabSwitches,
      penalized,
      disqualificationReason: reason,
      studentInfo
    };

    console.log('✅ [TestInterface] Submitting results:', results);
    
    // ✅ CRITICAL: Cleanup BEFORE completing
    CleanupManager.performFullCleanup();
    
    // ✅ Small delay to ensure cleanup completes
    setTimeout(() => {
      onComplete(results);
    }, 100);
    
  }, [answers, questions, tabSwitches, isAdmin, allAnswered, answeredCount, studentInfo, onComplete, showWarningMessage]);

  const handleNavigation = useCallback((direction) => {
    if (isDisqualified) return;
    
    if (direction === 'next' && currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  }, [currentQuestion, questions.length, isDisqualified]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestion]);

  useEffect(() => {
    const elementsToHide = [
      'nav', 'header', 'footer', 
      '.navbar', '.header', '.footer',
      '.menu', '.toolbar', '#toolbar', '.app-bar',
      '#navbar', '#header', '#footer',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '.top-bar', '.bottom-bar', '.side-nav', '.navigation',
      '.telegram-button', '#telegram-button',
      '.TelegramButton', '[class*="telegram"]', '[id*="telegram"]',
      '.background', '.Background', '[class*="background"]',
      '.toast-container', '.ToastContainer', '[class*="toast"]',
      '[class*="razorpay"]', '[id*="razorpay"]',
      'aside', '.sidebar', '#sidebar', '[class*="sidebar"]',
      '[class*="menu"]', '[class*="nav"]', '[class*="header"]', '[class*="footer"]',
      '.fixed', '.sticky', '[style*="fixed"]', '[style*="sticky"]'
    ];
    
    const hiddenElements = [];
    
    elementsToHide.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && !el.closest('[data-test-interface]')) {
            hiddenElements.push({ 
              element: el, 
              display: el.style.display,
              visibility: el.style.visibility,
              position: el.style.position
            });
            el.style.display = 'none';
            el.style.visibility = 'hidden';
          }
        });
      } catch (e) {}
    });
    
    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach(child => {
      if (child && 
          !child.hasAttribute('data-test-interface') && 
          child.id !== 'root' &&
          !child.querySelector('[data-test-interface]')) {
        hiddenElements.push({ 
          element: child, 
          display: child.style.display,
          visibility: child.style.visibility 
        });
        child.style.display = 'none';
        child.style.visibility = 'hidden';
      }
    });
    
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyMargin = document.body.style.margin;
    const originalBodyPadding = document.body.style.padding;
    const originalBodyWidth = document.body.style.width;
    const originalBodyHeight = document.body.style.height;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';
    
    const currentAudioManager = audioManagerRef.current;
    const currentSecurityManager = securityManagerRef.current;

    if (!isAdmin) {
      currentAudioManager.init();
      securityManagerRef.current = new SecurityManager(showWarningMessage, handleSubmit);
      securityManagerRef.current.enable();
    }

    window.onbeforeunload = (e) => {
      if (!hasSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    return () => {
      window.onbeforeunload = null;
      
      hiddenElements.forEach(({ element, display, visibility, position }) => {
        if (element) {
          element.style.display = display || '';
          element.style.visibility = visibility || '';
          if (position) element.style.position = position;
        }
      });
      
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.margin = originalBodyMargin;
      document.body.style.padding = originalBodyPadding;
      document.body.style.width = originalBodyWidth;
      document.body.style.height = originalBodyHeight;
      document.body.style.top = '';
      document.body.style.left = '';
      
      if (currentAudioManager) {
        currentAudioManager.destroy();
      }
      
      if (currentSecurityManager) {
        currentSecurityManager.disable();
      }
    };
  }, [isAdmin, showWarningMessage, handleSubmit]);

  useEffect(() => {
    if (isAdmin) return;

    const handleFullscreenChange = () => {
      const isFullscreen = FullscreenManager.isActive();
      
      if (!isFullscreen && !hasSubmittedRef.current && !isDisqualified) {
        showWarningMessage('⚠️ Stay in fullscreen mode!', 'normal');
        setTimeout(() => {
          FullscreenManager.enter();
        }, 2000);
      }
    };

    const cleanup = FullscreenManager.onChange(handleFullscreenChange);

    return () => {
      cleanup();
    };
  }, [isAdmin, showWarningMessage, isDisqualified]);

  useEffect(() => {
    if (timeLeft <= 0 || hasSubmittedRef.current || isDisqualified) {
      if (timeLeft <= 0 && !hasSubmittedRef.current && !isDisqualified) {
        audioManagerRef.current.playAlarm();
        showWarningMessage('⏰ TIME UP! Auto-submitting...', 'final');
        setTimeout(() => handleSubmit(false, ''), APP_CONFIG.AUTO_SUBMIT_DELAY);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showWarningMessage, handleSubmit, isDisqualified]);

  useEffect(() => {
    if (isAdmin || timeLeft <= 0 || hasSubmittedRef.current || isDisqualified) return;

    const tickTimer = setInterval(() => {
      audioManagerRef.current.playTick(timeLeft % 2 === 0);
    }, 1000);

    return () => clearInterval(tickTimer);
  }, [timeLeft, isAdmin, isDisqualified]);

  useEffect(() => {
    if (isAdmin || isDisqualified) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !hasSubmittedRef.current) {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);

        if (newCount === 1) {
          showWarningMessage('⚠️ Warning! Tab Switch 1/3 - Stay focused on the test!', 'normal');
        }
        else if (newCount === 2) {
          const criticalMessage = `🚨 FINAL WARNING! Tab Switch 2/3

⚠️ If you switch tabs ONE MORE TIME:
• Your test will be IMMEDIATELY SUBMITTED
• You will be marked as FAIL
• Your payment will NOT BE REFUNDABLE
• Certificate will NOT be issued

This is your LAST CHANCE!`;
          
          showWarningMessage(criticalMessage, 'critical');
        }
        else if (newCount >= APP_CONFIG.MAX_TAB_SWITCHES) {
          setIsDisqualified(true);
          
          const disqualificationMessage = `🚫 TEST DISQUALIFIED

Sorry! Cheating is NOT allowed.

Your test has been auto-submitted with FAIL status.

⚠️ IMPORTANT:
• Payment is NON-REFUNDABLE
• No certificate will be issued
• This attempt is permanently recorded`;
          
          showWarningMessage(disqualificationMessage, 'final');
          
          setTimeout(() => {
            handleSubmit(true, 'tab-switching-cheating');
          }, APP_CONFIG.AUTO_SUBMIT_DELAY);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tabSwitches, isAdmin, showWarningMessage, handleSubmit, isDisqualified]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentQ = questions[currentQuestion];

  const getWarningStyle = () => {
    if (warningType === 'final') {
      return {
        background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
        border: '5px solid #dc2626',
        color: '#991b1b',
        iconColor: '#dc2626',
        iconSize: isMobile ? 80 : 100
      };
    } else if (warningType === 'critical') {
      return {
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        border: '5px solid #f59e0b',
        color: '#92400e',
        iconColor: '#f59e0b',
        iconSize: isMobile ? 70 : 85
      };
    } else {
      return {
        background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
        border: '4px solid #ef4444',
        color: '#991b1b',
        iconColor: '#ef4444',
        iconSize: isMobile ? 64 : 80
      };
    }
  };

  const warningStyle = getWarningStyle();

  return (
    <div 
      data-test-interface="true"
      style={{
        position: 'fixed', 
        inset: 0, 
        background: '#f8fafc',
        zIndex: 999999, 
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        userSelect: isAdmin ? 'auto' : 'none',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        pointerEvents: isDisqualified ? 'none' : 'auto'
      }}>
      {isAdmin && (
        <div style={{
          position: 'fixed', top: '10px', left: '10px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '12px',
          fontSize: '0.8rem', fontWeight: '900', zIndex: 10000000,
          boxShadow: '0 6px 20px rgba(16,185,129,0.5)', border: '2px solid #047857'
        }}>
          👑 ADMIN MODE - Security Disabled
        </div>
      )}

      {showWarning && !isAdmin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{
            background: warningStyle.background,
            padding: isMobile ? '2.5rem 2rem' : '3.5rem 3rem',
            borderRadius: '28px', maxWidth: warningType === 'critical' || warningType === 'final' ? '600px' : '500px',
            width: '90%',
            border: warningStyle.border,
            boxShadow: `0 30px 80px ${warningStyle.iconColor}60`,
            textAlign: 'center',
            animation: warningType === 'final' ? 'shake 0.5s infinite' : 'pulse 0.5s infinite'
          }}>
            <AlertTriangle 
              size={warningStyle.iconSize} 
              color={warningStyle.iconColor} 
              strokeWidth={3} 
              style={{ marginBottom: '1.5rem', animation: 'shake 0.5s infinite' }} 
            />
            <div style={{
              fontSize: warningType === 'critical' || warningType === 'final' ? (isMobile ? '1.1rem' : '1.4rem') : (isMobile ? '1.3rem' : '1.8rem'),
              fontWeight: '900', 
              color: warningStyle.color, 
              lineHeight: 1.5,
              whiteSpace: 'pre-line'
            }}>
              {warningMsg}
            </div>
            {tabSwitches > 0 && (
              <div style={{ 
                fontSize: isMobile ? '1rem' : '1.2rem', 
                color: warningStyle.color, 
                fontWeight: '800', 
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '12px'
              }}>
                Tab Switches: {tabSwitches}/{APP_CONFIG.MAX_TAB_SWITCHES}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        position: 'sticky', top: 0, background: '#fff',
        borderBottom: '3px solid #e2e8f0',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        opacity: isDisqualified ? 0.5 : 1
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
              {isDisqualified && (
                <span style={{
                  background: '#dc2626', color: '#fff',
                  padding: '0.15rem 0.5rem', borderRadius: '6px',
                  fontSize: '0.7rem', fontWeight: '800'
                }}>
                  🚫 DISQUALIFIED
                </span>
              )}
            </div>
          </div>

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
        </div>
      </div>

      <div style={{
        padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem',
        maxWidth: '1400px', margin: '0 auto', paddingBottom: '6rem',
        opacity: isDisqualified ? 0.3 : 1,
        pointerEvents: isDisqualified ? 'none' : 'auto'
      }}>
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

        <div key={`options-${currentQuestion}`} style={{
          display: 'grid', gap: isMobile ? '1rem' : '1.5rem', marginBottom: '2.5rem'
        }}>
          {currentQ.options.map((option, idx) => {
            const isSelected = answers[currentQuestion] === idx;
            return (
              <button key={idx} onClick={() => handleAnswer(currentQuestion, idx)} 
                disabled={isDisqualified}
                style={{
                padding: isMobile ? '1.25rem' : '1.75rem',
                background: isSelected ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#fff',
                border: `3px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '16px', cursor: isDisqualified ? 'not-allowed' : 'pointer', textAlign: 'left',
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

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '2.5rem' }}>
          <button onClick={() => handleNavigation('prev')} 
            disabled={currentQuestion === 0 || isDisqualified} 
            style={{
            padding: isMobile ? '1rem 1.5rem' : '1.25rem 2rem',
            background: (currentQuestion === 0 || isDisqualified) ? '#f1f5f9' : 'linear-gradient(135deg, #fff, #f8fafc)',
            border: `3px solid ${(currentQuestion === 0 || isDisqualified) ? '#e2e8f0' : '#cbd5e1'}`,
            borderRadius: '12px', cursor: (currentQuestion === 0 || isDisqualified) ? 'not-allowed' : 'pointer',
            fontWeight: '700', color: (currentQuestion === 0 || isDisqualified) ? '#94a3b8' : '#1e293b',
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s'
          }}>
            <ChevronLeft size={isMobile ? 18 : 22} />
            {!isMobile && 'Previous'}
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button onClick={() => handleSubmit(false, '')} 
              disabled={((!allAnswered && !isAdmin) || isDisqualified)} 
              style={{
              padding: isMobile ? '1rem 2rem' : '1.25rem 3rem',
              background: ((allAnswered || isAdmin) && !isDisqualified) ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
              border: `3px solid ${((allAnswered || isAdmin) && !isDisqualified) ? '#059669' : '#e2e8f0'}`,
              borderRadius: '12px',
              cursor: ((allAnswered || isAdmin) && !isDisqualified) ? 'pointer' : 'not-allowed',
              fontWeight: '800', color: ((allAnswered || isAdmin) && !isDisqualified) ? '#fff' : '#94a3b8',
              fontSize: isMobile ? '1rem' : '1.2rem',
              boxShadow: ((allAnswered || isAdmin) && !isDisqualified) ? '0 8px 24px rgba(16,185,129,0.4)' : 'none',
              textTransform: 'uppercase', transition: 'all 0.2s'
            }}>
              {((allAnswered || isAdmin) && !isDisqualified) ? '✅ Submit Test' : '⚠️ Answer All First'}
            </button>
          ) : (
            <button onClick={() => handleNavigation('next')} 
              disabled={isDisqualified}
              style={{
              padding: isMobile ? '1rem 1.5rem' : '1.25rem 2rem',
              background: isDisqualified ? '#f1f5f9' : 'linear-gradient(135deg, #fff, #f8fafc)',
              border: `3px solid ${isDisqualified ? '#e2e8f0' : '#cbd5e1'}`,
              borderRadius: '12px',
              cursor: isDisqualified ? 'not-allowed' : 'pointer',
              fontWeight: '700', 
              color: isDisqualified ? '#94a3b8' : '#1e293b',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.2s'
            }}>
              {!isMobile && 'Next'}
              <ChevronRight size={isMobile ? 18 : 22} />
            </button>
          )}
        </div>

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
                <button key={idx} onClick={() => !isDisqualified && setCurrentQuestion(idx)} 
                  disabled={isDisqualified}
                  style={{
                  height: isMobile ? '44px' : '56px', borderRadius: '10px',
                  border: isCurrent ? '3px solid #3b82f6' : 'none',
                  background: isAnswered ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
                  color: isAnswered ? '#fff' : '#1e293b',
                  fontWeight: '800', cursor: isDisqualified ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '0.95rem' : '1.15rem',
                  boxShadow: isAnswered ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                  transition: 'all 0.2s',
                  transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                  opacity: isDisqualified ? 0.5 : 1
                }}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

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
// 🎯 MAIN APP - ✅ COMPLETE FIXED VERSION
// ==========================================
export default function MockTestInterface({ 
  questions, 
  testTitle, 
  timeLimit, 
  userEmail, 
  testLevel, 
  onExit,
  onComplete
}) {
  const [stage, setStage] = useState('instructions');
  const [studentInfo, setStudentInfo] = useState(null);
  const hasSubmittedFormRef = useRef(false);

  useEffect(() => {
    if (userEmail !== APP_CONFIG.ADMIN_EMAIL) {
      FullscreenManager.enter();
    }
    
    window.onbeforeunload = null;
    
    // ✅ Comprehensive cleanup on unmount
    return () => {
      console.log('🧹 [MockTestInterface] Cleaning up on unmount');
      CleanupManager.performFullCleanup();
    };
  }, [userEmail]);

  // ✅ Handle browser back button
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      
      const confirmExit = window.confirm(
        'Are you sure you want to exit the test?\n\n' +
        '• Your progress will be lost\n' +
        '• Payment is non-refundable\n' +
        '• You can restart later'
      );
      
      if (confirmExit) {
        CleanupManager.performFullCleanup();
        if (onExit) onExit();
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onExit]);

  const handleInstructionsAccept = () => {
    setStage('form');
  };

  const handleFormSubmit = useCallback((info) => {
    if (hasSubmittedFormRef.current) {
      console.log('⚠️ Form already submitted, ignoring duplicate');
      return;
    }
    
    hasSubmittedFormRef.current = true;
    setStudentInfo(info);
    setStage('test');
  }, []);

  const handleTestComplete = useCallback((testResults) => {
    console.log('✅ [MockTestInterface] Test completed, passing to parent');
    
    // ✅ CRITICAL: Immediate cleanup FIRST
    CleanupManager.performFullCleanup();
    
    // ✅ Prepare complete test data
    const completeTestData = {
      ...testResults,
      studentInfo: studentInfo,
      userName: studentInfo?.fullName,  // ✅ Fixed - Use fullName instead of name
      testTitle: testTitle,
      testLevel: testLevel,
      userEmail: userEmail,
      completedAt: Date.now(),
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 [MockTestInterface] Passing data to parent:', completeTestData);
    console.log('🔍 DEBUG - studentInfo:', studentInfo);
    console.log('🔍 DEBUG - userName from studentInfo:', studentInfo?.fullName);
    console.log('🔍 DEBUG - completeTestData.userName:', completeTestData.userName);
    
    // ✅ Save to leaderboard
    LeaderboardStorage.saveEntry(completeTestData);
    
    // ✅ Pass results to parent component with small delay
    setTimeout(() => {
      if (onComplete && typeof onComplete === 'function') {
        onComplete(completeTestData);
      }
    }, 200);
    
  }, [studentInfo, testTitle, testLevel, userEmail, onComplete]);

  const handleFormCancel = () => {
    const confirmCancel = window.confirm(
      'Are you sure you want to go back?\n\nYou will need to accept instructions again.'
    );
    
    if (confirmCancel) {
      hasSubmittedFormRef.current = false;
      setStage('instructions');
    }
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
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
      {stage === 'test' && (
        <TestInterface
          questions={questions}
          testTitle={testTitle}
          timeLimit={timeLimit}
          userEmail={userEmail}
          studentInfo={studentInfo}
          onComplete={handleTestComplete}
        />
      )}
    </>
  );
}