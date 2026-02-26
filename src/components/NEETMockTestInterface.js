import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Shield, BookOpen, WifiOff } from 'lucide-react';

const NEET_CONFIG = {
  ADMIN_EMAIL: 'luckyfaizu3@gmail.com',
  MAX_TAB_SWITCHES: 3,
  MAX_VIOLATIONS: 5,
  TIME_MINUTES: 180,
  MARKS_CORRECT: 4,
  MARKS_WRONG: -1,
  MARKS_SKIP: 0,
  MAX_SCORE: 720,
  IDLE_TIMEOUT: 180,
  WARNING_TIMEOUT: 3000,
  CRITICAL_WARNING_TIMEOUT: 8000,
  FINAL_WARNING_TIMEOUT: 10000,
  AUTO_SUBMIT_DELAY: 2000,
  CRITICAL_TIME_MINUTES: 10,
  PASS_PERCENTAGE: 55,
};

const NEET_SECTIONS = [
  { id: 'Physics',   label: '⚡ Physics',   total: 45, color: '#3b82f6', bg: '#eff6ff' },
  { id: 'Chemistry', label: '🧪 Chemistry', total: 45, color: '#a855f7', bg: '#fdf4ff' },
  { id: 'Botany',    label: '🌿 Botany',    total: 45, color: '#22c55e', bg: '#f0fdf4' },
  { id: 'Zoology',   label: '🐾 Zoology',   total: 45, color: '#f97316', bg: '#fff7ed' },
];

const THEME = {
  timer: {
    safe:     { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    warning:  { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    critical: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  }
};

const isAdminUser = (email) => email === NEET_CONFIG.ADMIN_EMAIL;

const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

const getTimerTheme = (timeLeft, totalTime) => {
  const pct = (timeLeft / totalTime) * 100;
  if (pct > 50) return THEME.timer.safe;
  if (pct > 20) return THEME.timer.warning;
  return THEME.timer.critical;
};

class AudioManager {
  constructor() { this.context = null; }
  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  playTick(isEven) {
    if (!this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain); gain.connect(this.context.destination);
    osc.frequency.value = isEven ? 1000 : 800; osc.type = 'sine';
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now); osc.stop(now + 0.08);
  }
  playAlarm() {
    if (!this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain); gain.connect(this.context.destination);
    osc.frequency.value = 880; osc.type = 'square';
    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    osc.start(this.context.currentTime); osc.stop(this.context.currentTime + 1);
  }
  destroy() {
    if (this.context) { this.context.close(); this.context = null; }
  }
}

class FullscreenManager {
  static async enter() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
      this.hideBrowserUI();
      this.lockOrientation();
      return true;
    } catch (err) {
      console.log('Fullscreen skipped:', err.message);
      return false;
    }
  }
  static hideBrowserUI() {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui';
    document.head.appendChild(meta);
    if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(() => {});
  }
  static lockOrientation() {
    try {
      if (window.screen?.orientation?.lock) window.screen.orientation.lock('portrait').catch(() => {});
    } catch {}
  }
  static async exit() {
    try {
      if (!FullscreenManager.isActive()) return;
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
      else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
      this.restoreBrowserUI();
    } catch {}
  }
  static restoreBrowserUI() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.overscrollBehavior = '';
  }
  static isActive() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
              document.msFullscreenElement || document.mozFullScreenElement);
  }
  static onChange(callback) {
    const events = ['fullscreenchange','webkitfullscreenchange','msfullscreenchange','mozfullscreenchange'];
    events.forEach(e => document.addEventListener(e, callback));
    return () => events.forEach(e => document.removeEventListener(e, callback));
  }
}

class CleanupManager {
  static performFullCleanup() {
    try { FullscreenManager.exit(); } catch {}
    window.onbeforeunload = null;
    const els = [document.body, document.documentElement];
    els.forEach(el => {
      if (!el) return;
      el.style.overflow = ''; el.style.position = ''; el.style.margin = '';
      el.style.padding = ''; el.style.width = ''; el.style.height = '';
      el.style.top = ''; el.style.left = '';
      el.style.overscrollBehavior = '';
      el.style.userSelect = ''; el.style.webkitUserSelect = '';
    });
    window.scrollTo(0, 0);
  }
}

class NEETSecurityManager {
  constructor(onWarning, onAutoSubmit, onViolationLog) {
    this.onWarning = onWarning;
    this.onAutoSubmit = onAutoSubmit;
    this.onViolationLog = onViolationLog;
    this.violations = 0;
    this.maxViolations = NEET_CONFIG.MAX_VIOLATIONS;
    this.submitted = false;
    this.devToolsInterval = null;
    this.idleTimer = null;
    this.lastActivity = Date.now();
    this.handlers = {
      copy:        (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('⚠️ Copying disabled!'); },
      cut:         (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('⚠️ Cutting disabled!'); },
      paste:       (e) => { e.preventDefault(); e.stopPropagation(); },
      contextmenu: (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('⚠️ Right-click disabled!'); },
      dragstart:   (e) => { e.preventDefault(); e.stopPropagation(); },
      drop:        (e) => { e.preventDefault(); e.stopPropagation(); },
      selectstart: (e) => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); },
      beforeprint: (e) => { e.preventDefault(); this.recordViolation('⚠️ Printing disabled!'); },
      keydown: (e) => {
        const ctrl = e.ctrlKey || e.metaKey;
        const blocked = [
          ctrl && ['c','v','x','a','s','u','p','f','g','h','j','k','l','n','r','t','w'].includes(e.key.toLowerCase()),
          e.key === 'F12', ctrl && e.shiftKey && ['i','j','c','k'].includes(e.key.toLowerCase()),
          e.key === 'F5', ctrl && e.key === 'r', e.key === 'PrintScreen', e.key === 'F11',
        ].some(Boolean);
        if (blocked) {
          e.preventDefault(); e.stopPropagation();
          if (e.key === 'PrintScreen') { this.recordViolation('⚠️ Screenshot attempt!'); this.flashBlack(); }
          else this.recordViolation('⚠️ Keyboard shortcut blocked!');
        }
      },
    };
  }
  flashBlack() {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;inset:0;background:#000;z-index:99999999;pointer-events:none;';
    document.body.appendChild(div);
    setTimeout(() => { if (document.body.contains(div)) document.body.removeChild(div); }, 800);
  }
  log(msg) { if (this.onViolationLog) this.onViolationLog(msg, 'info'); }
  recordViolation(msg) {
    if (this.submitted) return;
    this.violations++;
    this.log(msg);
    this.onWarning(msg, this.violations, this.maxViolations);
    if (this.violations >= this.maxViolations) {
      this.submitted = true;
      this.onAutoSubmit('Too many security violations');
    }
  }
  startIdleDetection() {
    const resetIdle = () => { this.lastActivity = Date.now(); };
    ['mousemove','keydown','click','touchstart','scroll'].forEach(e => document.addEventListener(e, resetIdle, true));
    this.idleTimer = setInterval(() => {
      const idle = (Date.now() - this.lastActivity) / 1000;
      if (idle >= NEET_CONFIG.IDLE_TIMEOUT) {
        this.lastActivity = Date.now();
        this.onWarning('idle', 0, 0, 'idle');
      }
    }, 10000);
  }
  startDevToolsDetection() {
    this.devToolsInterval = setInterval(() => {
      const w = window.outerWidth - window.innerWidth > 200;
      const h = window.outerHeight - window.innerHeight > 200;
      if (w || h) this.recordViolation('⚠️ Developer tools detected!');
    }, 1500);
  }
  enable() {
    Object.entries(this.handlers).forEach(([ev, fn]) => document.addEventListener(ev, fn, true));
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    this.startDevToolsDetection();
    this.startIdleDetection();
  }
  disable() {
    Object.entries(this.handlers).forEach(([ev, fn]) => document.removeEventListener(ev, fn, true));
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    if (this.devToolsInterval) clearInterval(this.devToolsInterval);
    if (this.idleTimer) clearInterval(this.idleTimer);
  }
}

// ==========================================
// ✅ SWIPE PREVENTION HOOK
// Horizontal swipe se browser back nahi hoga
// ==========================================
function usePreventSwipeBack(ref) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;

    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      // Agar horizontal swipe zyada hai vertical se
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault(); // browser back/forward block
        e.stopPropagation();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false }); // passive: false zaroori hai
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [ref]);
}

function InstructionScreen({ onAccept, testTitle, timeLimit, totalQuestions, sessionId }) {
  const [accepted, setAccepted] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const containerRef = useRef(null);
  usePreventSwipeBack(containerRef);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    const toHide = ['nav','header','footer','.navbar','.header','.footer',
      '.telegram-button','[class*="telegram"]','[class*="background"]',
      '[class*="toast"]','[class*="razorpay"]'];
    const hidden = [];
    toHide.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          hidden.push({ el, d: el.style.display, v: el.style.visibility });
          el.style.display = 'none'; el.style.visibility = 'hidden';
        });
      } catch {}
    });
    return () => {
      window.removeEventListener('resize', h);
      hidden.forEach(({ el, d, v }) => { if (el) { el.style.display = d||''; el.style.visibility = v||''; } });
    };
  }, []);

  const instructions = [
    { icon: '⏱️', text: `Total time: ${timeLimit} minutes (3 hours). Timer starts immediately when test begins.` },
    { icon: '✅', text: `Correct answer: +${NEET_CONFIG.MARKS_CORRECT} marks. Wrong answer: ${NEET_CONFIG.MARKS_WRONG} mark (negative marking). Skipped: 0 marks.` },
    { icon: '🧬', text: `Physics: 45Q • Chemistry: 45Q • Botany: 45Q • Zoology: 45Q. Total: ${totalQuestions} questions, 720 marks.` },
    { icon: '🚫', text: `Tab switching detected. ${NEET_CONFIG.MAX_TAB_SWITCHES} switches = AUTO SUBMIT + FAIL. No refund.` },
    { icon: '📵', text: `Copy, paste, right-click, screenshot, and print screen are COMPLETELY DISABLED.` },
    { icon: '🖥️', text: `Test runs in fullscreen mode. Exiting fullscreen will trigger a warning and auto-return.` },
    { icon: '🛠️', text: `Opening developer tools = automatic test submission.` },
    { icon: '👁️', text: `Session continuously monitored. Every violation is recorded permanently.` },
    { icon: '🔄', text: `You can freely navigate between all sections and questions before submitting.` },
    { icon: '⚠️', text: `${NEET_CONFIG.MAX_VIOLATIONS} security violations = immediate auto submit with FAIL status.` },
    { icon: '📊', text: `After submission, you will see detailed subject-wise score analysis with wrong answer explanations.` },
  ];

  return (
    <div ref={containerRef} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#f8fafc', display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', padding: '1rem', overflowY: 'auto',
      WebkitOverflowScrolling: 'touch', zIndex: 999999,
      overscrollBehavior: 'none', touchAction: 'pan-y',
    }}>
      <style>{`* { } input,select,textarea { font-size: 16px !important; }`}</style>
      <div style={{ width: '100%', maxWidth: '680px', padding: '1rem 0' }}>
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: '2px solid #ef4444', borderRadius: '16px', padding: isMobile ? '0.85rem 1rem' : '1rem 1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: '900', color: '#fff', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>🔴 LIVE MONITORING ACTIVE</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '1rem' : '2rem', flexWrap: 'wrap' }}>
            {[{ icon: '📍', label: 'Location Logged' }, { icon: '🖥️', label: 'Screen Tracked' }, { icon: '⚠️', label: `Violations: 0/${NEET_CONFIG.MAX_VIOLATIONS}` }].map((item, i) => (
              <div key={i} style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: '#fecaca', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {item.icon} {item.label}
              </div>
            ))}
          </div>
          {sessionId && <div style={{ marginTop: '0.4rem', fontSize: isMobile ? '0.62rem' : '0.7rem', color: '#fca5a5', fontWeight: '600' }}>🌐 Session ID: {sessionId}</div>}
        </div>
        <div style={{ background: '#fff', border: '3px solid #e2e8f0', borderRadius: '20px', padding: isMobile ? '1.25rem' : '1.75rem', marginBottom: '1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '50px', padding: '0.4rem 1rem', marginBottom: '1rem' }}>
            <Shield size={16} color="#3b82f6" />
            <span style={{ color: '#1d4ed8', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '0.08em' }}>NEET MOCK TEST</span>
          </div>
          <h1 style={{ fontSize: isMobile ? 'clamp(1.2rem,4vw,1.6rem)' : '1.9rem', fontWeight: '800', color: '#1e293b', margin: '0 0 1rem' }}>{testTitle}</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {[
              { label: 'Questions', value: `${totalQuestions}`, color: '#3b82f6' },
              { label: 'Time',      value: `${timeLimit} Min`,  color: '#10b981' },
              { label: 'Max Marks', value: '720',               color: '#f59e0b' },
              { label: 'Marking',   value: '+4 / -1',           color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0.5rem', background: '#f8fafc', borderRadius: '10px', border: '2px solid #e2e8f0' }}>
                <div style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: '900', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: '#64748b', fontWeight: '700' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
          {NEET_SECTIONS.map(s => (
            <div key={s.id} style={{ background: '#fff', border: `2px solid ${s.color}33`, borderRadius: '12px', padding: isMobile ? '0.75rem' : '0.9rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '800', color: s.color }}>{s.label}</div>
              <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: '#64748b', marginTop: '0.2rem', fontWeight: '600' }}>{s.total} Questions • {s.total * 4} Marks</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', border: '3px solid #e2e8f0', borderRadius: '20px', padding: isMobile ? '1.25rem' : '1.5rem', marginBottom: '1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BookOpen size={16} color="#3b82f6" />
            <span style={{ color: '#1e293b', fontWeight: '800', fontSize: isMobile ? '0.85rem' : '0.95rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Important Instructions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {instructions.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: isMobile ? '0.75rem' : '0.9rem', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ color: '#475569', fontSize: isMobile ? 'clamp(0.78rem,2.2vw,0.88rem)' : '0.88rem', fontWeight: '500', lineHeight: 1.55 }}>{item.text}</span>
              </div>
            ))}
          </div>
          <div onClick={() => setAccepted(!accepted)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: isMobile ? '1rem' : '1.25rem', background: accepted ? '#f0fdf4' : '#fff', border: `3px solid ${accepted ? '#10b981' : '#e2e8f0'}`, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '8px', border: `3px solid ${accepted ? '#10b981' : '#cbd5e1'}`, background: accepted ? '#10b981' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {accepted && <CheckCircle size={20} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ color: accepted ? '#065f46' : '#475569', fontSize: isMobile ? 'clamp(0.82rem,2.5vw,0.95rem)' : '0.95rem', fontWeight: accepted ? '800' : '700', lineHeight: 1.4, flex: 1 }}>
              ✅ I have read all instructions. I understand any cheating will be recorded and test auto-submitted.
            </span>
          </div>
        </div>
        <button onClick={() => accepted && onAccept()} disabled={!accepted} style={{ width: '100%', padding: isMobile ? '1rem' : '1.15rem', background: accepted ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#e2e8f0', border: accepted ? '3px solid #ef4444' : '3px solid #e2e8f0', borderRadius: '16px', color: accepted ? '#fff' : '#94a3b8', fontSize: isMobile ? '1rem' : '1.05rem', fontWeight: '800', cursor: accepted ? 'pointer' : 'not-allowed', boxShadow: accepted ? '0 8px 24px rgba(220,38,38,0.35)' : 'none', transition: 'all 0.3s' }}>
          {accepted ? '🚀 Proceed to Fill Details' : '☑️ Please accept instructions first'}
        </button>
      </div>
    </div>
  );
}

function NEETNameForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [age,  setAge]  = useState('');
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const containerRef = useRef(null);
  usePreventSwipeBack(containerRef);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const handleSubmit = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required!';
    else if (name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters!';
    if (!age.trim()) newErrors.age = 'Age is required!';
    else if (isNaN(age) || parseInt(age) < 10 || parseInt(age) > 40) newErrors.age = 'Enter a valid age (10–40)!';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onSubmit({ fullName: name.trim(), name: name.trim(), age: parseInt(age) });
  };

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 999999, overscrollBehavior: 'none', touchAction: 'pan-y' }}>
      <style>{`input,select,textarea { font-size: 16px !important; }`}</style>
      <div style={{ background: '#fff', border: '3px solid #e2e8f0', borderRadius: '24px', padding: isMobile ? '1.75rem 1.5rem' : '2.5rem', maxWidth: '440px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '70px', height: '70px', margin: '0 auto 1rem', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>🧬</div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight: '900', color: '#1e293b' }}>Enter Your Details</h2>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: '600' }}>Your name will appear on the leaderboard</p>
        </div>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '800', color: '#475569', letterSpacing: '0.04em' }}>FULL NAME *</label>
          <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Enter your full name..." autoFocus
            style={{ width: '100%', padding: isMobile ? '0.9rem 1rem' : '1rem 1.1rem', background: '#f8fafc', border: `3px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`, borderRadius: '14px', color: '#1e293b', fontSize: isMobile ? '1rem' : '1.05rem', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = errors.name ? '#ef4444' : '#e2e8f0'} />
          {errors.name && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: '700' }}>⚠️ {errors.name}</div>}
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '800', color: '#475569', letterSpacing: '0.04em' }}>AGE *</label>
          <input type="number" value={age} onChange={e => { setAge(e.target.value); setErrors(p => ({ ...p, age: '' })); }} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Enter your age..." min="10" max="40"
            style={{ width: '100%', padding: isMobile ? '0.9rem 1rem' : '1rem 1.1rem', background: '#f8fafc', border: `3px solid ${errors.age ? '#ef4444' : '#e2e8f0'}`, borderRadius: '14px', color: '#1e293b', fontSize: isMobile ? '1rem' : '1.05rem', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = errors.age ? '#ef4444' : '#e2e8f0'} />
          {errors.age && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: '700' }}>⚠️ {errors.age}</div>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: isMobile ? '0.9rem' : '1rem', background: '#fff', border: '3px solid #e2e8f0', borderRadius: '14px', color: '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '0.88rem' : '0.95rem' }}>← Back</button>
          <button onClick={handleSubmit} style={{ flex: 2, padding: isMobile ? '0.9rem' : '1rem', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: isMobile ? '0.88rem' : '0.95rem', boxShadow: '0 6px 20px rgba(59,130,246,0.4)' }}>Start Test 🚀</button>
        </div>
      </div>
    </div>
  );
}

function NEETTestInterface({ questions, onComplete, testTitle, timeLimit, userEmail, studentInfo }) {
  const [currentSection, setCurrentSection] = useState('Physics');
  const [currentQIdx, setCurrentQIdx]       = useState(0);
  const [answers, setAnswers]               = useState({});
  const [timeLeft, setTimeLeft]             = useState(timeLimit * 60);
  const [tabSwitches, setTabSwitches]       = useState(0);
  const [violations, setViolations]         = useState(0);
  const [showWarning, setShowWarning]       = useState(false);
  const [warningMsg, setWarningMsg]         = useState('');
  const [warningType, setWarningType]       = useState('normal');
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [violationLogs, setViolationLogs]   = useState([]);
  const [isMobile, setIsMobile]             = useState(window.innerWidth <= 768);
  const [showQPanel, setShowQPanel]         = useState(window.innerWidth > 768);
  const [isOnline, setIsOnline]             = useState(navigator.onLine);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);

  const containerRef     = useRef(null);
  const sectionTabsRef   = useRef(null); // ✅ Section tabs ref for swipe prevention
  const hasSubmittedRef  = useRef(false);
  const startTimeRef     = useRef(Date.now());
  const audioRef         = useRef(new AudioManager());
  const securityRef      = useRef(null);
  const warningTimerRef  = useRef(null);
  const tabSwitchesRef   = useRef(0);
  const violationsRef    = useRef(0);
  const answersRef       = useRef({});

  // ✅ Swipe back prevention on main container AND section tabs
  usePreventSwipeBack(containerRef);
  usePreventSwipeBack(sectionTabsRef);

  const admin = isAdminUser(userEmail);

  const sectionQs = React.useMemo(() => {
    const map = {};
    NEET_SECTIONS.forEach(s => { map[s.id] = questions.filter(q => q.subject === s.id); });
    return map;
  }, [questions]);

  const currentSectionQs = sectionQs[currentSection] || [];
  const currentQ = currentSectionQs[currentQIdx];

  const getGlobalIdx = useCallback((section, localIdx) => {
    let offset = 0;
    for (const s of NEET_SECTIONS) {
      if (s.id === section) return offset + localIdx;
      offset += (sectionQs[s.id] || []).length;
    }
    return localIdx;
  }, [sectionQs]);

  const globalIdx = currentQ ? getGlobalIdx(currentSection, currentQIdx) : 0;
  const timerTheme   = getTimerTheme(timeLeft, timeLimit * 60);
  const isCritical   = timeLeft < NEET_CONFIG.CRITICAL_TIME_MINUTES * 60;
  const answeredTotal = Object.keys(answers).length;
  const totalQCount  = NEET_SECTIONS.reduce((a, s) => a + (sectionQs[s.id] || []).length, 0);
  const allAnswered  = answeredTotal === totalQCount;

  useEffect(() => { answersRef.current = answers; }, [answers]);

  const showWarningMessage = useCallback((message, type = 'normal') => {
    setWarningMsg(message); setWarningType(type); setShowWarning(true);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    let timeout = NEET_CONFIG.WARNING_TIMEOUT;
    if (type === 'critical') timeout = NEET_CONFIG.CRITICAL_WARNING_TIMEOUT;
    if (type === 'final')    timeout = NEET_CONFIG.FINAL_WARNING_TIMEOUT;
    warningTimerRef.current = setTimeout(() => setShowWarning(false), timeout);
  }, []);

  const handleSubmit = useCallback((penalized = false, reason = '') => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
      else if (document.msFullscreenElement) document.msExitFullscreen();
      else if (document.mozFullScreenElement) document.mozCancelFullScreen();
    } catch {}
    setIsSubmitting(true);
    setShowConfirm(false);
    requestAnimationFrame(() => {
      setTimeout(() => {
        const currentAnswers = answersRef.current;
        const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const subjectScores = {};
        NEET_SECTIONS.forEach(s => {
          const qs = sectionQs[s.id] || [];
          let correct = 0, wrong = 0, skipped = 0, marks = 0;
          const wrongDetails = [];
          qs.forEach((q, localIdx) => {
            const gIdx = getGlobalIdx(s.id, localIdx);
            const ans = currentAnswers[gIdx];
            if (ans === undefined || ans === null) { skipped++; }
            else if (ans === q.correct) { correct++; marks += NEET_CONFIG.MARKS_CORRECT; }
            else {
              wrong++; marks += NEET_CONFIG.MARKS_WRONG;
              wrongDetails.push({
                question: q.question, userAnswer: ans, correctAnswer: q.correct,
                options: q.options, subject: q.subject,
                neetClass: q.neetClass || '', chapterNo: q.chapterNo || '',
                chapterName: q.chapterName || '', topic: q.topic || '',
                code: q.code || '', explanation: q.explanation || '',
              });
            }
          });
          subjectScores[s.id] = { correct, wrong, skipped, marks, total: qs.length, maxMarks: qs.length * 4, wrongDetails };
        });
        const totalCorrect = Object.values(subjectScores).reduce((a, s) => a + s.correct, 0);
        const totalWrong   = Object.values(subjectScores).reduce((a, s) => a + s.wrong, 0);
        const totalSkipped = Object.values(subjectScores).reduce((a, s) => a + s.skipped, 0);
        const totalScore   = Object.values(subjectScores).reduce((a, s) => a + s.marks, 0);
        const allQsCount   = NEET_SECTIONS.reduce((a, s) => a + (sectionQs[s.id] || []).length, 0);
        const pct = Math.round(Math.max(0, (totalScore / NEET_CONFIG.MAX_SCORE)) * 100);
        const results = {
          score: totalScore, correct: totalCorrect, wrong: totalWrong, skipped: totalSkipped,
          total: allQsCount, percentage: pct, passed: pct >= NEET_CONFIG.PASS_PERCENTAGE,
          timeTaken: `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`,
          tabSwitches: tabSwitchesRef.current, violations: violationsRef.current,
          violationLogs: [], penalized, disqualificationReason: reason, subjectScores, studentInfo,
        };
        CleanupManager.performFullCleanup();
        setTimeout(() => { setIsSubmitting(false); onComplete(results); }, 300);
      }, 50);
    });
  }, [sectionQs, studentInfo, onComplete, getGlobalIdx]);

  useEffect(() => {
    if (!admin) {
      audioRef.current.init();
      FullscreenManager.enter();
      securityRef.current = new NEETSecurityManager(
        (msg, vCount, maxV, type) => {
          if (type === 'idle') { showWarningMessage(`💤 Inactive 3 minutes! Test still running...`, 'normal'); return; }
          violationsRef.current = vCount; setViolations(vCount);
          const warnType = vCount >= maxV - 1 ? 'critical' : 'normal';
          showWarningMessage(`⚠️ SECURITY VIOLATION #${vCount}/${maxV}\n\n${msg}\n\n${vCount >= maxV - 1 ? '🚨 FINAL WARNING! Next = AUTO SUBMIT!' : `${maxV - vCount} remaining.`}`, warnType);
        },
        (reason) => {
          setIsDisqualified(true);
          showWarningMessage(`🚫 TEST DISQUALIFIED!\n\nReason: ${reason}\n\nAuto-submitting now...`, 'final');
          setTimeout(() => handleSubmit(true, reason), NEET_CONFIG.AUTO_SUBMIT_DELAY);
        },
        (msg, type) => { setViolationLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]); }
      );
      securityRef.current.enable();
    }
    const toHide = ['nav','header','footer','.navbar','.header','.footer','.menu','.toolbar','#toolbar','[role="navigation"]','[role="banner"]','.telegram-button','[class*="telegram"]','[class*="background"]','[class*="toast"]','[class*="razorpay"]','aside','.sidebar'];
    const hidden = [];
    toHide.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (el && !el.closest('[data-test-interface]')) {
            hidden.push({ el, d: el.style.display, v: el.style.visibility });
            el.style.display = 'none'; el.style.visibility = 'hidden';
          }
        });
      } catch {}
    });
    document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed'; document.body.style.width = '100%';
    document.body.style.height = '100%'; document.body.style.top = '0'; document.body.style.left = '0';
    window.onbeforeunload = (e) => { if (!hasSubmittedRef.current) { e.preventDefault(); e.returnValue = ''; return ''; } };
    const goOnline  = () => { setIsOnline(true); showWarningMessage('✅ Connection restored!', 'normal'); };
    const goOffline = () => { setIsOnline(false); showWarningMessage('📵 Internet lost! Answers are safe.', 'critical'); };
    window.addEventListener('online', goOnline); window.addEventListener('offline', goOffline);
    const currentAudio = audioRef.current; const currentSecurity = securityRef.current;
    return () => {
      window.onbeforeunload = null;
      hidden.forEach(({ el, d, v }) => { if (el) { el.style.display = d||''; el.style.visibility = v||''; } });
      document.body.style.overflow = ''; document.documentElement.style.overflow = '';
      document.body.style.position = ''; document.body.style.width = '';
      document.body.style.height = ''; document.body.style.top = ''; document.body.style.left = '';
      currentAudio?.destroy(); currentSecurity?.disable();
      window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline);
    };
  }, [admin, showWarningMessage, handleSubmit]);

  useEffect(() => {
    if (admin) return;
    return FullscreenManager.onChange(() => {
      if (!FullscreenManager.isActive() && !hasSubmittedRef.current && !isDisqualified) {
        showWarningMessage('⚠️ Stay in fullscreen!', 'normal');
        setTimeout(() => FullscreenManager.enter(), 2000);
      }
    });
  }, [admin, showWarningMessage, isDisqualified]);

  useEffect(() => {
    if (admin || isDisqualified) return;
    const handleVisibility = () => {
      if (document.hidden && !hasSubmittedRef.current) {
        const newCount = tabSwitchesRef.current + 1;
        tabSwitchesRef.current = newCount; setTabSwitches(newCount);
        if (newCount === 1) showWarningMessage('⚠️ Tab Switch 1/3!', 'normal');
        else if (newCount === 2) showWarningMessage(`🚨 FINAL WARNING! Tab Switch 2/3\n\nONE MORE = AUTO SUBMIT + FAIL`, 'critical');
        else if (newCount >= NEET_CONFIG.MAX_TAB_SWITCHES) {
          setIsDisqualified(true);
          showWarningMessage(`🚫 DISQUALIFIED\n\n3 tab switches. Auto-submitting...`, 'final');
          setTimeout(() => handleSubmit(true, 'tab-switching'), NEET_CONFIG.AUTO_SUBMIT_DELAY);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [admin, isDisqualified, showWarningMessage, handleSubmit]);

  useEffect(() => {
    if (timeLeft <= 0 && !hasSubmittedRef.current) {
      audioRef.current.playAlarm();
      showWarningMessage('⏰ TIME UP! Auto-submitting...', 'final');
      setTimeout(() => handleSubmit(false, ''), NEET_CONFIG.AUTO_SUBMIT_DELAY);
      return;
    }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, showWarningMessage, handleSubmit]);

  useEffect(() => {
    if (admin || timeLeft <= 0 || isDisqualified || !isCritical) return;
    const t = setInterval(() => audioRef.current.playTick(timeLeft % 2 === 0), 1000);
    return () => clearInterval(t);
  }, [timeLeft, admin, isDisqualified, isCritical]);

  useEffect(() => {
    const h = () => { const m = window.innerWidth <= 768; setIsMobile(m); if (!m) setShowQPanel(true); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const handleAnswer = useCallback((optionIdx) => {
    if (isDisqualified || !currentQ) return;
    setAnswers(prev => { const n = { ...prev, [globalIdx]: optionIdx }; answersRef.current = n; return n; });
  }, [isDisqualified, currentQ, globalIdx]);

  const handleClear = useCallback(() => {
    if (isDisqualified || !currentQ) return;
    setAnswers(prev => { const n = { ...prev }; delete n[globalIdx]; answersRef.current = n; return n; });
  }, [isDisqualified, currentQ, globalIdx]);

  const handleNext = () => {
    if (currentQIdx < currentSectionQs.length - 1) setCurrentQIdx(p => p + 1);
    else {
      const sIdx = NEET_SECTIONS.findIndex(s => s.id === currentSection);
      if (sIdx < NEET_SECTIONS.length - 1) { setCurrentSection(NEET_SECTIONS[sIdx + 1].id); setCurrentQIdx(0); }
    }
  };

  const handlePrev = () => {
    if (currentQIdx > 0) setCurrentQIdx(p => p - 1);
    else {
      const sIdx = NEET_SECTIONS.findIndex(s => s.id === currentSection);
      if (sIdx > 0) { const prev = NEET_SECTIONS[sIdx - 1].id; setCurrentSection(prev); setCurrentQIdx((sectionQs[prev] || []).length - 1); }
    }
  };

  const goToQuestion = (section, localIdx) => { setCurrentSection(section); setCurrentQIdx(localIdx); if (isMobile) setShowQPanel(false); };

  const currentAnswer = answers[globalIdx];
  const sc = NEET_SECTIONS.find(s => s.id === currentSection);

  const getWarningStyle = () => {
    if (warningType === 'final') return { background: 'linear-gradient(135deg, #fee2e2, #fecaca)', border: '5px solid #dc2626', color: '#991b1b', iconColor: '#dc2626', iconSize: isMobile ? 80 : 100 };
    if (warningType === 'critical') return { background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '5px solid #f59e0b', color: '#92400e', iconColor: '#f59e0b', iconSize: isMobile ? 70 : 85 };
    return { background: 'linear-gradient(135deg, #fee2e2, #fecaca)', border: '4px solid #ef4444', color: '#991b1b', iconColor: '#ef4444', iconSize: isMobile ? 64 : 80 };
  };
  const ws = getWarningStyle();

  if (isSubmitting) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.6rem', fontWeight: '900', color: '#1e293b' }}>Submitting Your Test...</h2>
        <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Calculating your score. Please wait...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div ref={containerRef} data-test-interface="true" style={{ position: 'fixed', inset: 0, background: '#f8fafc', zIndex: 999999, display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden', pointerEvents: isDisqualified ? 'none' : 'auto', overscrollBehavior: 'none' }}>
      <style>{`
        * { touch-action: pan-x pan-y !important; }
        input, textarea, select { font-size: 16px !important; }
        [data-test-interface] { overscroll-behavior: none; }
        @keyframes slideIn { 0%{opacity:0;transform:translateY(30px) scale(0.95)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes blink { 0%,49%,100%{opacity:1} 50%,99%{opacity:0.25} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: isMobile ? '2rem 1.5rem' : '2.5rem', maxWidth: '420px', width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.2)', textAlign: 'center', border: '3px solid #e2e8f0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>📋</div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: '900', color: '#1e293b' }}>Submit NEET Test?</h2>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: isMobile ? '0.85rem' : '0.9rem', lineHeight: 1.6 }}>Are you sure you want to submit?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1.75rem' }}>
              {[
                { label: 'Answered', value: answeredTotal, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: 'Skipped',  value: totalQCount - answeredTotal, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                { label: 'Total',    value: totalQCount, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '0.75rem 0.5rem', background: s.bg, border: `2px solid ${s.border}`, borderRadius: '12px' }}>
                  <div style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: '900', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: '700', marginTop: '0.1rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ margin: '0 0 1.75rem', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>⚠️ Skipped questions get 0 marks. Cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: isMobile ? '0.9rem' : '1rem', background: '#fff', border: '3px solid #e2e8f0', borderRadius: '14px', color: '#64748b', fontWeight: '800', cursor: 'pointer', fontSize: isMobile ? '0.88rem' : '0.95rem' }}>← Cancel</button>
              <button onClick={() => handleSubmit(false, '')} style={{ flex: 2, padding: isMobile ? '0.9rem' : '1rem', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: isMobile ? '0.88rem' : '0.95rem', boxShadow: '0 6px 20px rgba(220,38,38,0.35)' }}>✅ Yes, Submit!</button>
            </div>
          </div>
        </div>
      )}

      {admin && (
        <div style={{ position: 'fixed', top: '10px', left: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '900', zIndex: 10000000, boxShadow: '0 6px 20px rgba(16,185,129,0.5)' }}>
          👑 ADMIN MODE - Security Disabled
        </div>
      )}

      {showWarning && !admin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
          <div style={{ background: ws.background, padding: isMobile ? '2.5rem 2rem' : '3.5rem 3rem', borderRadius: '28px', maxWidth: '600px', width: '90%', border: ws.border, boxShadow: `0 30px 80px ${ws.iconColor}60`, textAlign: 'center' }}>
            <AlertTriangle size={ws.iconSize} color={ws.iconColor} strokeWidth={3} style={{ marginBottom: '1.5rem' }} />
            <div style={{ fontSize: warningType === 'critical' || warningType === 'final' ? (isMobile ? '1.1rem' : '1.4rem') : (isMobile ? '1.3rem' : '1.8rem'), fontWeight: '900', color: ws.color, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {warningMsg}
            </div>
            {tabSwitches > 0 && (
              <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: ws.color, fontWeight: '800', marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                Tab Switches: {tabSwitches}/{NEET_CONFIG.MAX_TAB_SWITCHES}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ background: '#fff', borderBottom: '3px solid #e2e8f0', padding: isMobile ? '0.65rem 0.85rem' : '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', flexWrap: 'wrap', opacity: isDisqualified ? 0.5 : 1 }}>
        <div style={{ flex: 1, minWidth: isMobile ? '120px' : '200px' }}>
          <div style={{ fontSize: isMobile ? '0.88rem' : '1.05rem', fontWeight: '800', color: '#1e293b' }}>🧬 {testTitle}</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.1rem' }}>
            <span style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: '#64748b', fontWeight: '600' }}>{studentInfo?.fullName || studentInfo?.name || ''}</span>
            <span style={{ background: allAnswered ? '#dcfce7' : '#fef3c7', color: allAnswered ? '#065f46' : '#92400e', padding: '0.1rem 0.45rem', borderRadius: '5px', fontSize: '0.62rem', fontWeight: '800' }}>
              {allAnswered ? '✅' : '📝'} {answeredTotal}/{totalQCount}
            </span>
            {!isOnline && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.45rem', borderRadius: '5px', fontSize: '0.62rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><WifiOff size={10} /> Offline</span>}
            {tabSwitches > 0 && !admin && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.45rem', borderRadius: '5px', fontSize: '0.62rem', fontWeight: '800' }}>⚠️ {tabSwitches}/3</span>}
            {isDisqualified && <span style={{ background: '#dc2626', color: '#fff', padding: '0.1rem 0.45rem', borderRadius: '5px', fontSize: '0.62rem', fontWeight: '800' }}>🚫 DISQUALIFIED</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: isMobile ? '0.5rem 0.85rem' : '0.6rem 1.1rem', background: timerTheme.bg, border: `3px solid ${timerTheme.border}`, borderRadius: '12px' }}>
          <Clock size={isMobile ? 16 : 20} color={timerTheme.text} strokeWidth={2.5} style={{ animation: isCritical ? 'shake 0.6s infinite' : 'none' }} />
          <span style={{ fontSize: isMobile ? '1rem' : '1.3rem', fontWeight: '900', color: timerTheme.text, fontFamily: 'monospace', animation: isCritical ? 'blink 1s infinite' : 'none' }}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <button onClick={() => setShowConfirm(true)} style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1.1rem', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: isMobile ? '0.72rem' : '0.82rem', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
          {isMobile ? '✅ Submit' : '✅ Submit Test'}
        </button>
      </div>

      {/* ✅ SECTION TABS — ref lagaya swipe back rokne ke liye */}
      <div ref={sectionTabsRef} style={{ background: '#fff', borderBottom: '2px solid #e2e8f0', padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem', display: 'flex', gap: '0.4rem', flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', overscrollBehavior: 'contain' }}>
        {NEET_SECTIONS.map(s => {
          const qs = sectionQs[s.id] || [];
          const answered = qs.filter((_, li) => answers[getGlobalIdx(s.id, li)] !== undefined).length;
          const isActive = currentSection === s.id;
          return (
            <button key={s.id} onClick={() => { setCurrentSection(s.id); setCurrentQIdx(0); }} style={{ padding: isMobile ? '0.45rem 0.6rem' : '0.5rem 1rem', borderRadius: '10px', border: isActive ? `2px solid ${s.color}` : '2px solid #e2e8f0', background: isActive ? `${s.color}15` : '#fff', color: isActive ? s.color : '#64748b', fontWeight: '800', cursor: 'pointer', fontSize: isMobile ? '0.7rem' : '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s' }}>
              <span>{s.label}</span>
              <span style={{ padding: '0.1rem 0.4rem', background: isActive ? s.color : '#e2e8f0', borderRadius: '5px', fontSize: '0.6rem', fontWeight: '800', color: isActive ? '#fff' : '#64748b' }}>{answered}/{qs.length}</span>
            </button>
          );
        })}
        {isMobile && (
          <button onClick={() => setShowQPanel(p => !p)} style={{ marginLeft: 'auto', padding: '0.45rem 0.65rem', borderRadius: '10px', border: '2px solid #e2e8f0', background: showQPanel ? '#e2e8f0' : '#fff', color: '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '0.68rem', flexShrink: 0 }}>
            {showQPanel ? 'Hide' : 'Q Panel'}
          </button>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '1.5rem', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          {currentQ ? (
            <div style={{ maxWidth: '800px', margin: '0 auto', opacity: isDisqualified ? 0.3 : 1, pointerEvents: isDisqualified ? 'none' : 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.25rem 0.6rem', background: `${sc?.color}15`, border: `1px solid ${sc?.color}44`, borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700', color: sc?.color }}>{currentSection}</span>
                  <span style={{ padding: '0.25rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>Q {currentQIdx + 1}/{currentSectionQs.length}</span>
                  {currentQ.neetClass && <span style={{ padding: '0.25rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8' }}>Class {currentQ.neetClass}th</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', fontWeight: '700' }}>
                  <span style={{ color: '#10b981' }}>✅ +4</span>
                  <span style={{ color: '#ef4444' }}>❌ -1</span>
                  <span style={{ color: '#94a3b8' }}>⬜ 0</span>
                </div>
              </div>
              <div style={{ background: '#fff', border: '3px solid #e2e8f0', borderRadius: '20px', padding: isMobile ? '1.25rem' : '2rem', marginBottom: isMobile ? '1rem' : '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: isMobile ? 'clamp(1rem,3vw,1.2rem)' : '1.4rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.65, marginBottom: currentQ.code ? '1.25rem' : 0 }}>
                  {currentQ.question}
                </div>
                {currentQ.code && (
                  <div style={{ background: '#f8fafc', border: '3px solid #cbd5e1', borderRadius: '14px', padding: isMobile ? '1rem' : '1.5rem', overflowX: 'auto' }}>
                    <pre style={{ margin: 0, fontFamily: 'Consolas, Monaco, monospace', fontSize: isMobile ? '0.95rem' : '1.1rem', lineHeight: 1.7, color: '#1e293b', fontWeight: '500', whiteSpace: 'pre' }}>{currentQ.code}</pre>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gap: isMobile ? '0.75rem' : '1rem', marginBottom: isMobile ? '1rem' : '1.5rem' }}>
                {currentQ.options?.map((option, idx) => {
                  const isSelected = currentAnswer === idx;
                  return (
                    <button key={idx} onClick={() => handleAnswer(idx)} disabled={isDisqualified} style={{ padding: isMobile ? '1rem 1.1rem' : '1.4rem 1.5rem', background: isSelected ? `linear-gradient(135deg, ${sc?.color}, ${sc?.color}dd)` : '#fff', border: `3px solid ${isSelected ? sc?.color : '#e2e8f0'}`, borderRadius: '16px', cursor: isDisqualified ? 'not-allowed' : 'pointer', textAlign: 'left', color: isSelected ? '#fff' : '#1e293b', fontSize: isMobile ? 'clamp(0.9rem,2.5vw,1rem)' : '1.15rem', fontWeight: isSelected ? '700' : '600', display: 'flex', alignItems: 'center', gap: isMobile ? '0.85rem' : '1.25rem', boxShadow: isSelected ? `0 8px 24px ${sc?.color}44` : '0 4px 12px rgba(0,0,0,0.05)', transform: isSelected ? 'scale(1.01)' : 'scale(1)', transition: 'all 0.25s' }}>
                      <span style={{ width: isMobile ? '36px' : '46px', height: isMobile ? '36px' : '46px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: isMobile ? '1rem' : '1.2rem', flexShrink: 0 }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span style={{ flex: 1, lineHeight: 1.5 }}>{option}</span>
                      {isSelected && <CheckCircle size={isMobile ? 20 : 24} color="#fff" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: isMobile ? '1rem' : '1.5rem' }}>
                <button onClick={handlePrev} style={{ padding: isMobile ? '0.75rem 1rem' : '0.9rem 1.5rem', background: '#fff', border: '3px solid #e2e8f0', borderRadius: '12px', color: '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '0.85rem' : '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ChevronLeft size={isMobile ? 16 : 18} />{!isMobile && 'Prev'}
                </button>
                {currentAnswer !== undefined && (
                  <button onClick={handleClear} style={{ padding: isMobile ? '0.75rem 0.9rem' : '0.9rem 1.25rem', background: '#fff5f5', border: '3px solid #fecaca', borderRadius: '12px', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '0.78rem' : '0.85rem' }}>🗑️ Clear</button>
                )}
                <div style={{ flex: 1 }} />
                <button onClick={handleNext} style={{ padding: isMobile ? '0.75rem 1rem' : '0.9rem 1.5rem', background: `linear-gradient(135deg, ${sc?.color}, ${sc?.color}cc)`, border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '0.85rem' : '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: `0 4px 12px ${sc?.color}44` }}>
                  {!isMobile && 'Next'}<ChevronRight size={isMobile ? 16 : 18} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <div style={{ fontWeight: '600' }}>No questions in this section yet.</div>
            </div>
          )}
        </div>

        {(showQPanel || !isMobile) && (
          <div style={{ width: isMobile ? '100%' : '240px', background: '#fff', borderLeft: isMobile ? 'none' : '2px solid #e2e8f0', borderTop: isMobile ? '2px solid #e2e8f0' : 'none', overflowY: 'auto', padding: '1rem', flexShrink: 0, position: isMobile ? 'fixed' : 'relative', bottom: isMobile ? 0 : 'auto', left: isMobile ? 0 : 'auto', right: isMobile ? 0 : 'auto', zIndex: isMobile ? 100 : 'auto', height: isMobile ? '50vh' : '100%', boxShadow: isMobile ? '0 -8px 24px rgba(0,0,0,0.12)' : 'none' }}>
            {NEET_SECTIONS.map(s => {
              const qs = sectionQs[s.id] || [];
              return (
                <div key={s.id} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: s.color, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    {s.label} ({qs.filter((_, li) => answers[getGlobalIdx(s.id, li)] !== undefined).length}/{qs.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: '0.3rem' }}>
                    {qs.map((_, li) => {
                      const gI = getGlobalIdx(s.id, li);
                      const isAnswered = answers[gI] !== undefined;
                      const isCurr = currentSection === s.id && currentQIdx === li;
                      return (
                        <button key={li} onClick={() => goToQuestion(s.id, li)} style={{ height: '36px', borderRadius: '8px', border: isCurr ? `2px solid ${s.color}` : '2px solid transparent', background: isAnswered ? `linear-gradient(135deg, ${s.color}, ${s.color}cc)` : '#e2e8f0', color: isAnswered ? '#fff' : '#64748b', fontWeight: '800', cursor: 'pointer', fontSize: '0.7rem', transform: isCurr ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.15s', boxShadow: isCurr ? `0 0 0 2px ${s.color}44` : isAnswered ? `0 2px 6px ${s.color}44` : 'none' }}>
                          {li + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: '#64748b' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#e2e8f0' }} /> Not attempted</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: '#64748b' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#10b981' }} /> Answered</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NEETMockTestInterface({ questions, userEmail, userId, onExit, onComplete }) {
  const [stage, setStage]             = useState('instructions');
  const [studentInfo, setStudentInfo] = useState(null);
  const [saving, setSaving]           = useState(false);
  const hasSubmittedFormRef           = useRef(false);

  const sessionId = useRef(
    `NEET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`
  );

  useEffect(() => {
    if (userEmail !== NEET_CONFIG.ADMIN_EMAIL) FullscreenManager.enter();
    window.onbeforeunload = null;
    return () => CleanupManager.performFullCleanup();
  }, [userEmail]);

  useEffect(() => {
    const handlePop = (e) => { e.preventDefault(); window.history.pushState(null, '', window.location.href); };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const handleFormSubmit = useCallback((info) => {
    if (hasSubmittedFormRef.current) return;
    hasSubmittedFormRef.current = true;
    setStudentInfo(info);
    setStage('test');
  }, []);

  const handleFormCancel = () => { hasSubmittedFormRef.current = false; setStage('instructions'); };

  const handleTestComplete = useCallback(async (testResults) => {
    CleanupManager.performFullCleanup();
    setSaving(true);
    const completeData = {
      ...testResults,
      studentInfo,
      userName: studentInfo?.fullName || studentInfo?.name,
      testTitle: 'NEET Mock Test',
      userEmail,
      completedAt: Date.now(),
      timestamp: new Date().toISOString(),
    };
    if (onComplete) {
      try { await onComplete(completeData); } catch (err) { console.error('❌ onComplete error:', err); }
    }
    setSaving(false);
  }, [studentInfo, userEmail, onComplete]);

  if (saving) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'spin 1.5s linear infinite' }}>💾</div>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.6rem', fontWeight: '900', color: '#1e293b' }}>Saving Your Results...</h2>
        <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Please wait...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (stage === 'instructions') return <InstructionScreen testTitle="NEET Mock Test" timeLimit={NEET_CONFIG.TIME_MINUTES} totalQuestions={questions.length} sessionId={sessionId.current} onAccept={() => setStage('form')} />;
  if (stage === 'form') return <NEETNameForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} />;
  if (stage === 'test') return <NEETTestInterface questions={questions} testTitle="NEET Mock Test" timeLimit={NEET_CONFIG.TIME_MINUTES} userEmail={userEmail} studentInfo={studentInfo} onComplete={handleTestComplete} />;
  return null;
}