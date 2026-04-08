// @ts-nocheck
// FILE LOCATION: src/components/utils.js
// Shared configs, utilities, and manager classes for MockTestInterface
// ============================================================
// SECURITY UPGRADES IN THIS FILE:
// ✅ SEC-1:  window.open blocked — popup exfil prevented
// ✅ SEC-2:  Object.freeze on APP_CONFIG — runtime tamper proof
// ✅ SEC-3:  Anti-debugger timing fingerprint (2nd DevTools detection method)
// ✅ SEC-4:  Console methods neutered on enable
// ✅ SEC-5:  navigator.clipboard fully poisoned (read + write + readText + writeText)
// ✅ SEC-6:  localStorage + sessionStorage wiped on exam start
// ✅ SEC-7:  maxViolations 5 → 3
// ✅ SEC-8:  ALL F1–F12 keys blocked (not just F12)
// ✅ SEC-9:  Ctrl+Scroll (browser zoom) blocked
// ✅ SEC-10: Mobile touchend long-press blocked
// ✅ SEC-11: getUserMedia screen-share variant blocked
// ✅ SEC-12: document.title scrambled on visibility change
// ✅ SEC-13: Ctrl+W / Ctrl+Q (close tab) blocked
// ✅ SEC-14: NetworkGuard — fetch + XHR patched to block AI/cheat domains
// ✅ SEC-15: CleanupManager — NetworkGuard + VisibilityManager also cleaned
// ============================================================

// ==========================================
// GLOBAL CSS — sirf ek baar inject hota hai
// ==========================================
export function injectGlobalCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('mock-test-global-css')) return;
  const style = document.createElement('style');
  style.id = 'mock-test-global-css';
  style.textContent = `
    * { -webkit-touch-callout: none !important; }
    ::selection { background: transparent !important; color: inherit !important; }
    ::-moz-selection { background: transparent !important; color: inherit !important; }
    img { -webkit-user-drag: none !important; user-drag: none !important; pointer-events: none !important; }
    @media print {
      body * { visibility: hidden !important; display: none !important; }
      body::after {
        content: 'PySkill — Printing & Screenshots Disabled';
        visibility: visible !important; display: block !important;
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%,-50%);
        font-size: 2rem; font-weight: 900; color: #000;
      }
    }
    @keyframes iconShake {
      0%,100%{transform:rotate(0)} 20%{transform:rotate(-8deg)}
      40%{transform:rotate(8deg)} 60%{transform:rotate(-5deg)} 80%{transform:rotate(5deg)}
    }
    @keyframes warningPulse {
      0%,100%{box-shadow:0 40px 100px rgba(220,38,38,0.5)}
      50%{box-shadow:0 40px 140px rgba(220,38,38,0.9)}
    }
    @keyframes blink { 0%,49%,100%{opacity:1} 50%,99%{opacity:0.15} }
    @keyframes slideIn { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
    @keyframes fadeInUp { from{opacity:0;transform:translateX(-15px)} to{opacity:1;transform:translateX(0)} }
    @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
    @keyframes tickBlink { 0%,49%,100%{opacity:1} 50%,99%{opacity:0.25} }
    @keyframes devtoolsPulse {
      0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.6)}
      50%{box-shadow:0 0 0 12px rgba(220,38,38,0)}
    }
    @keyframes qtTimerWarning {
      0%,100%{transform:scale(1)} 50%{transform:scale(1.04)}
    }
    @keyframes shimmer {
      0%{transform:translateX(-100%)}
      100%{transform:translateX(200%)}
    }
    @keyframes progressPop {
      0%{transform:scaleY(1)} 50%{transform:scaleY(1.6)} 100%{transform:scaleY(1)}
    }
  `;
  document.head.appendChild(style);
}

// ==========================================
// LEADERBOARD STORAGE
// ==========================================
export class LeaderboardStorage {
  static async saveEntry(testResult) {
    const MAX_RETRIES = 2;
    let collection, addDoc, db;
    try {
      ({ collection, addDoc } = await import('firebase/firestore'));
      ({ db }                 = await import('../firebase'));
    } catch (importErr) {
      console.warn('[MockTest] Firebase module import failed:', importErr.message);
      return { success: false, error: importErr.message };
    }
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const newEntry = {
          name:                   testResult.studentInfo?.fullName || testResult.studentInfo?.name || testResult.userName || 'Anonymous',
          email:                  testResult.userEmail,
          percentage:             testResult.percentage,
          score:                  `${testResult.correct}/${testResult.total}`,
          testTitle:              testResult.testTitle,
          testLevel:              testResult.testLevel,
          timeTaken:              testResult.timeTaken,
          passed:                 testResult.passed,
          penalized:              testResult.penalized || false,
          disqualificationReason: testResult.disqualificationReason || '',
          date:                   new Date().toLocaleDateString('en-GB'),
          timestamp:              Date.now(),
        };
        await addDoc(collection(db, 'leaderboard'), newEntry);
        return { success: true };
      } catch (error) {
        if (attempt === MAX_RETRIES) {
          console.warn('[MockTest] Leaderboard save failed after retries:', error.message);
          return { success: false, error: error.message };
        }
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
}

// ==========================================
// CONFIGURATION
// ✅ SEC-2: Object.freeze — no runtime tampering possible
// ==========================================
export const APP_CONFIG = Object.freeze({
  ADMIN_EMAIL:             'luckyfaizu3@gmail.com',
  MAX_TAB_SWITCHES:        3,
  MAX_BLUR_COUNT:          5,
  WARNING_TIMEOUT:         3000,
  AUTO_SUBMIT_DELAY:       2000,
  CRITICAL_TIME_MINUTES:   5,
  INACTIVITY_PERCENT:      0.10,
  DEVTOOLS_WARNING_SEC:    5,
  DEVTOOLS_SUBMIT_SEC:     10,
  DEVTOOLS_SIZE_THRESHOLD: 160,
});

export const THEME = Object.freeze({
  timer: {
    safe:     { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    warning:  { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    critical: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  },
});

// ==========================================
// SHUFFLER
// ==========================================
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleQuestions(questions) {
  const shuffled = shuffleArray(questions);
  return shuffled.map(q => {
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= (q.options?.length ?? 0)) {
      return q;
    }
    const indexedOpts   = q.options.map((text, i) => ({ text, origIdx: i }));
    const shuffledIdx   = shuffleArray(indexedOpts);
    const newCorrectIdx = shuffledIdx.findIndex(o => o.origIdx === q.correct);
    return { ...q, options: shuffledIdx.map(o => o.text), correct: newCorrectIdx };
  });
}

// ==========================================
// SCREEN RECORD BLOCKER
// ✅ SEC-11: getUserMedia screen-share variant also blocked
// ==========================================
export class ScreenRecordBlocker {
  static _originalDisplay = null;
  static _originalGetUser = null;

  static enable() {
    if (navigator.mediaDevices?.getDisplayMedia) {
      this._originalDisplay = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async () => {
        throw new DOMException('Screen recording is disabled during the exam.', 'NotAllowedError');
      };
    }
    if (navigator.mediaDevices?.getUserMedia) {
      this._originalGetUser = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        if (constraints?.video?.mediaSource === 'screen' || constraints?.video?.displaySurface) {
          throw new DOMException('Screen capture is disabled during the exam.', 'NotAllowedError');
        }
        return ScreenRecordBlocker._originalGetUser(constraints);
      };
    }
  }

  static disable() {
    if (this._originalDisplay && navigator.mediaDevices) {
      navigator.mediaDevices.getDisplayMedia = this._originalDisplay;
      this._originalDisplay = null;
    }
    if (this._originalGetUser && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = this._originalGetUser;
      this._originalGetUser = null;
    }
  }
}

// ==========================================
// DESKTOP MODE ENFORCER
// ==========================================
export class DesktopModeEnforcer {
  static _original = null;
  static _created  = null;
  static enable() {
    const existing = document.querySelector('meta[name="viewport"]');
    if (existing) {
      this._original = existing.getAttribute('content');
      existing.setAttribute('content', 'width=1024, initial-scale=0.5, maximum-scale=0.5, user-scalable=no');
    } else {
      const meta = document.createElement('meta');
      meta.name    = 'viewport';
      meta.content = 'width=1024, initial-scale=0.5, maximum-scale=0.5, user-scalable=no';
      document.head.appendChild(meta);
      this._created = meta;
    }
  }
  static disable() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      if (this._original)     meta.setAttribute('content', this._original);
      else if (this._created) this._created.remove();
      else                    meta.setAttribute('content', 'width=device-width, initial-scale=1');
    }
    this._original = null;
    this._created  = null;
  }
}

// ==========================================
// UTILS
// ==========================================
export class TestUtils {
  static isAdmin(email) { return email === APP_CONFIG.ADMIN_EMAIL; }

  static formatTime(s) {
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return { display: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}` };
  }

  static formatShort(s) {
    const m  = Math.floor(s / 60);
    const sc = s % 60;
    if (m > 0) return `${m}:${String(sc).padStart(2,'0')}`;
    return `${sc}s`;
  }

  static calculateScore(answers, questions, tabSwitches, isAdmin, passPercent) {
    let correct = 0;
    const correctQuestions = [], wrongQuestions = [];
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && answers[idx] === q.correct) {
        correct++; correctQuestions.push(idx + 1);
      } else {
        wrongQuestions.push(idx + 1);
      }
    });
    let percentage  = Math.round((correct / questions.length) * 100);
    const penalized = !isAdmin && tabSwitches >= APP_CONFIG.MAX_TAB_SWITCHES;
    if (penalized) percentage = Math.max(0, percentage - 20);
    return {
      correct, wrong: questions.length - correct, total: questions.length,
      percentage, passed: isAdmin ? true : percentage >= passPercent,
      correctQuestions, wrongQuestions, penalized,
    };
  }
}

// ==========================================
// AUDIO MANAGER
// ==========================================
export class AudioManager {
  constructor() { this.context = null; }
  init() {
    if (!this.context) {
      try { this.context = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
  }
  playTick(isEven) {
    if (!this.context) return;
    try {
      const osc  = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.connect(gain); gain.connect(this.context.destination);
      osc.frequency.value = isEven ? 1000 : 800; osc.type = 'sine';
      const now = this.context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } catch (e) {}
  }
  playAlarm() {
    if (!this.context) return;
    try {
      const osc  = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.connect(gain); gain.connect(this.context.destination);
      osc.frequency.value = 880; osc.type = 'square';
      const now = this.context.currentTime;
      gain.gain.setValueAtTime(0.2, now); osc.start(now); osc.stop(now + 1);
    } catch (e) {}
  }
  destroy() {
    if (this.context) { try { this.context.close(); } catch (e) {} this.context = null; }
  }
}

// ==========================================
// FULLSCREEN MANAGER
// ==========================================
export class FullscreenManager {
  static async enter() {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen)            await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen)     await el.msRequestFullscreen();
      else if (el.mozRequestFullScreen)    await el.mozRequestFullScreen();
      if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(() => {});
      try { if (window.screen?.orientation?.lock) window.screen.orientation.lock('portrait').catch(() => {}); } catch (e) {}
    } catch (err) {}
  }
  static async exit() {
    try {
      if (!FullscreenManager.isActive()) return;
      if (document.exitFullscreen)            await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.msExitFullscreen)     await document.msExitFullscreen();
      else if (document.mozCancelFullScreen)  await document.mozCancelFullScreen();
    } catch (err) {}
  }
  static isActive() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || document.mozFullScreenElement);
  }
  static onChange(callback) {
    const events = ['fullscreenchange','webkitfullscreenchange','msfullscreenchange','mozfullscreenchange'];
    events.forEach(e => document.addEventListener(e, callback));
    return () => events.forEach(e => document.removeEventListener(e, callback));
  }
}

// ==========================================
// DEVTOOLS DETECTOR
// ✅ SEC-3: Dual method — window size diff + debugger timing fingerprint
// ==========================================
export class DevToolsDetector {
  constructor(onWarning, onAutoSubmit) {
    this.onWarning        = onWarning;
    this.onAutoSubmit     = onAutoSubmit;
    this.interval         = null;
    this.detected         = false;
    this.warningShown     = false;
    this.consecutiveCount = 0;
  }

  _isOpenBySize() {
    const veryLargeDiff =
      window.outerWidth  - window.innerWidth  > 300 ||
      window.outerHeight - window.innerHeight > 300;
    if (veryLargeDiff) return { isOpen: true, isVeryLarge: true };
    const moderateDiff =
      window.outerWidth  - window.innerWidth  > APP_CONFIG.DEVTOOLS_SIZE_THRESHOLD ||
      window.outerHeight - window.innerHeight > APP_CONFIG.DEVTOOLS_SIZE_THRESHOLD;
    return { isOpen: moderateDiff, isVeryLarge: false };
  }

  // ✅ SEC-3: If devtools is paused on debugger statement, timing spikes >80ms
  _isOpenByTiming() {
    try {
      const t0 = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      return (performance.now() - t0) > 80;
    } catch (e) { return false; }
  }

  _isOpen() {
    const bySize   = this._isOpenBySize();
    const byTiming = this._isOpenByTiming();
    return {
      isOpen:      bySize.isOpen || byTiming,
      isVeryLarge: bySize.isVeryLarge || byTiming,
    };
  }

  start() {
    this.interval = setInterval(() => {
      if (this.detected) return;
      const { isOpen, isVeryLarge } = this._isOpen();
      if (isOpen) {
        this.consecutiveCount++;
        const effectiveCount = isVeryLarge
          ? Math.max(this.consecutiveCount, APP_CONFIG.DEVTOOLS_WARNING_SEC)
          : this.consecutiveCount;
        const submitCount = isVeryLarge
          ? Math.max(this.consecutiveCount, APP_CONFIG.DEVTOOLS_SUBMIT_SEC)
          : this.consecutiveCount;
        if (effectiveCount >= APP_CONFIG.DEVTOOLS_WARNING_SEC && !this.warningShown) {
          this.warningShown = true;
          this.onWarning(
            `⚠️ DEVELOPER TOOLS DETECTED\n\nClose DevTools immediately!\n\nAuto-submit in ${APP_CONFIG.DEVTOOLS_SUBMIT_SEC - APP_CONFIG.DEVTOOLS_WARNING_SEC} seconds if not closed.`,
            'devtools-warning'
          );
        }
        if (submitCount >= APP_CONFIG.DEVTOOLS_SUBMIT_SEC) {
          this.detected = true;
          this.onWarning(`DISQUALIFIED — Developer Tools\n\nYou kept DevTools open. Test submitted as FAIL.`, 'final', true);
          this.stop();
          setTimeout(() => this.onAutoSubmit(true, 'devtools-disqualified'), 500);
        }
      } else {
        if (this.consecutiveCount > 0) this.consecutiveCount = Math.max(0, this.consecutiveCount - 1);
        if (this.consecutiveCount < APP_CONFIG.DEVTOOLS_WARNING_SEC) this.warningShown = false;
        if (this.consecutiveCount === 0) this._reset();
      }
    }, 1000);
  }

  _reset() {
    this.detected         = false;
    this.warningShown     = false;
    this.consecutiveCount = 0;
  }

  stop() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }
}

// ==========================================
// SECURITY MANAGER
// ✅ SEC-1:  window.open blocked
// ✅ SEC-4:  Console neutered
// ✅ SEC-5:  Clipboard API fully poisoned
// ✅ SEC-6:  localStorage + sessionStorage wiped
// ✅ SEC-7:  maxViolations 5 → 3
// ✅ SEC-8:  ALL F1–F12 blocked
// ✅ SEC-9:  Ctrl+Scroll zoom blocked
// ✅ SEC-10: touchend long-press blocked
// ✅ SEC-13: Ctrl+W / Ctrl+Q blocked
// ==========================================
export class SecurityManager {
  constructor(onWarning, handleSubmitRef) {
    this.onWarning           = onWarning;
    this.handleSubmitRef     = handleSubmitRef;
    this.violationCount      = 0;
    this.maxViolations       = 3;   // ✅ SEC-7
    this._origClipboardRead  = null;
    this._origClipboardWrite = null;

    this.handlers = {
      copy:        (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Copying is disabled during the test.'); },
      cut:         (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Cutting is disabled during the test.'); },
      paste:       (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Pasting is disabled during the test.'); },
      contextMenu: (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Right-click is disabled during the test.'); },

      // ✅ SEC-8 + SEC-9 + SEC-13
      keydown: (e) => {
        const ctrl    = e.ctrlKey || e.metaKey;
        const key     = e.key.toLowerCase();
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;

        const isFKey = /^f([1-9]|1[0-2])$/i.test(e.key); // F1–F12

        const blocked =
          isFKey ||
          (ctrl && key === 'a' && !isInput) ||
          (ctrl && key === 'i' && !isInput) ||
          (ctrl && ['c','x','v','s','p','u'].includes(key)) ||
          (ctrl && e.shiftKey && ['i','j','c','k'].includes(key)) ||
          (ctrl && key === 'r') ||
          (ctrl && key === 'w') ||   // ✅ SEC-13: close tab
          (ctrl && key === 'q') ||   // ✅ SEC-13: quit browser
          (ctrl && key === '+') ||   // ✅ SEC-9: zoom in
          (ctrl && key === '-') ||   // ✅ SEC-9: zoom out
          (ctrl && key === '=') ||   // ✅ SEC-9: zoom in alt
          (ctrl && key === '0') ||   // ✅ SEC-9: zoom reset
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && ['3','4','5','s'].includes(key));

        if (blocked) {
          e.preventDefault();
          e.stopPropagation();
          this.recordViolation('Keyboard shortcut blocked during the test.');
        }
      },

      // ✅ SEC-9: Ctrl+Scroll zoom
      wheel: (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          this.recordViolation('Zoom is disabled during the test.');
        }
      },

      dragstart:   (e) => { e.preventDefault(); e.stopPropagation(); },
      drop:        (e) => { e.preventDefault(); e.stopPropagation(); },
      selectstart: (e) => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); },
      beforeprint: (e) => { e.preventDefault(); this.recordViolation('Printing is disabled during the test.'); },

      touchstart: (e) => {
        if (e.touches.length >= 2) { e.preventDefault(); this.recordViolation('Multi-touch gesture blocked.'); }
      },
      // ✅ SEC-10: block long-press context menu on mobile
      touchend: (e) => { e.preventDefault(); },
    };
  }

  // ✅ SEC-5: Poison navigator.clipboard fully
  _poisonClipboard() {
    try {
      if (navigator.clipboard) {
        this._origClipboardRead  = navigator.clipboard.readText?.bind(navigator.clipboard);
        this._origClipboardWrite = navigator.clipboard.writeText?.bind(navigator.clipboard);
        navigator.clipboard.readText  = async () => { this.recordViolation('Clipboard access blocked.'); return ''; };
        navigator.clipboard.writeText = async () => { this.recordViolation('Clipboard write blocked.'); };
        navigator.clipboard.read      = async () => { this.recordViolation('Clipboard read blocked.'); return []; };
        navigator.clipboard.write     = async () => { this.recordViolation('Clipboard write blocked.'); };
      }
    } catch (e) {}
  }

  _restoreClipboard() {
    try {
      if (navigator.clipboard) {
        if (this._origClipboardRead)  navigator.clipboard.readText  = this._origClipboardRead;
        if (this._origClipboardWrite) navigator.clipboard.writeText = this._origClipboardWrite;
      }
    } catch (e) {}
  }

  // ✅ SEC-6: Wipe storage — no answer can be cached/exfiltrated
  _wipeStorage() {
    try { localStorage.clear();   } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
  }

  recordViolation(message) {
    if (this.violationCount >= this.maxViolations) return;
    this.violationCount++;
    this.onWarning(message, 'violation');
    if (this.violationCount >= this.maxViolations) {
      this.onWarning('Too many violations. Test will be submitted automatically.', 'final', true);
      setTimeout(() => {
        if (this.handleSubmitRef.current) this.handleSubmitRef.current(true, 'too-many-violations');
      }, 2000);
    }
  }

  enable() {
    Object.entries(this.handlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler, { capture: true, passive: false });
    });
    document.body.style.userSelect       = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect     = 'none';
    ScreenRecordBlocker.enable();
    this._poisonClipboard();
    this._wipeStorage();

    // ✅ SEC-1: Block window.open (popup exfil)
    try { window.__origOpen = window.open; window.open = () => null; } catch (e) {}

    // ✅ SEC-4: Neuter console so student can't inspect via console
    try {
      const noop = () => {};
      ['log','warn','error','info','table','dir','dirxml','group','groupEnd',
       'time','timeEnd','assert','profile','profileEnd','trace','count'].forEach(m => {
        try { console[m] = noop; } catch (e) {}
      });
    } catch (e) {}
  }

  disable() {
    Object.entries(this.handlers).forEach(([event, handler]) => {
      document.removeEventListener(event, handler, true);
    });
    document.body.style.userSelect       = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.msUserSelect     = '';
    ScreenRecordBlocker.disable();
    this._restoreClipboard();

    // Restore window.open
    try { if (window.__origOpen) { window.open = window.__origOpen; delete window.__origOpen; } } catch (e) {}
  }
}

// ==========================================
// ✅ SEC-12: VISIBILITY MANAGER
// Scrambles document.title on tab blur — student can't read question from taskbar
// ==========================================
export class VisibilityManager {
  static _origTitle   = '';
  static _hiddenTitle = '🔒 Return to Exam — PySkill';
  static _handler     = null;

  static enable() {
    this._origTitle = document.title;
    this._handler = () => {
      document.title = document.hidden ? this._hiddenTitle : this._origTitle;
    };
    document.addEventListener('visibilitychange', this._handler);
  }

  static disable() {
    if (this._handler) document.removeEventListener('visibilitychange', this._handler);
    try { document.title = this._origTitle; } catch (e) {}
    this._handler = null;
  }
}

// ==========================================
// ✅ SEC-14: NETWORK GUARD
// Patches fetch + XHR to block known AI / answer-sharing domains
// ==========================================
const BLOCKED_DOMAINS = [
  'openai.com', 'chatgpt.com', 'claude.ai', 'gemini.google.com', 'bard.google.com',
  'copilot.microsoft.com', 'bing.com',
  'pastebin.com', 'paste.ee', 'hastebin.com', 'gist.github.com', 'snippet.run',
  'telegram.org', 'web.telegram.org', 'discord.com', 'discord.gg',
  'whatsapp.com', 'web.whatsapp.com', 'signal.org',
  'chegg.com', 'coursehero.com', 'quizlet.com', 'brainly.com', 'slader.com',
  'stackoverflow.com', 'answers.com',
];

export class NetworkGuard {
  static _origFetch = null;
  static _origXHR   = null;

  static _isBlocked(url) {
    try {
      const hostname = new URL(url, window.location.href).hostname;
      return BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch (e) { return false; }
  }

  static enable() {
    this._origFetch = window.fetch;
    window.fetch = (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      if (NetworkGuard._isBlocked(url)) {
        return Promise.reject(new Error('Network request blocked during exam.'));
      }
      return NetworkGuard._origFetch.apply(window, args);
    };

    this._origXHR = window.XMLHttpRequest;
    const Guard   = this;
    window.XMLHttpRequest = class extends Guard._origXHR {
      open(method, url, ...rest) {
        if (NetworkGuard._isBlocked(url)) {
          throw new Error('Network request blocked during exam.');
        }
        return super.open(method, url, ...rest);
      }
    };
  }

  static disable() {
    if (this._origFetch) { window.fetch          = this._origFetch; this._origFetch = null; }
    if (this._origXHR)   { window.XMLHttpRequest = this._origXHR;   this._origXHR   = null; }
  }
}

// ==========================================
// CLEANUP MANAGER
// ✅ SEC-15: Also cleans NetworkGuard + VisibilityManager
// ==========================================
export class CleanupManager {
  static performFullCleanup() {
    FullscreenManager.exit();
    DesktopModeEnforcer.disable();
    ScreenRecordBlocker.disable();
    NetworkGuard.disable();
    VisibilityManager.disable();
    window.onbeforeunload = null;
    [document.body, document.documentElement].forEach(el => {
      if (!el) return;
      ['overflow','position','margin','padding','width','height','top','left',
       'overscrollBehavior','userSelect','webkitUserSelect','msUserSelect','mozUserSelect']
        .forEach(p => { el.style[p] = ''; });
    });
    window.scrollTo(0, 0);
  }
}