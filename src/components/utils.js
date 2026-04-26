// @ts-nocheck
// FILE LOCATION: src/components/utils.js
// ============================================================
// ORIGINAL FIXES (v1–v2):
// ✅ FIX-DESKTOP:        DesktopModeEnforcer.disable() now restores viewport properly
// ✅ FIX-DELAY:          CleanupManager fullscreen exit delay 400ms → 800ms
// ✅ FIX-AUDIO:          AudioManager playTick/playAlarm removed (silent)
// ============================================================
// ANTI-CHEAT v3:
// ✅ FIX-PRIVATE-FIELDS:    AntiCheatController uses #violations / #active (true private — DevTools proof)
// ✅ FIX-TOSTRING-ORDER:    DevToolsDetector toString trap fires BEFORE SecurityManager silences console
// ✅ FIX-DEBUGGER-BYPASS:   debugger timing check augmented with size+global fallback; threshold 100ms
// ✅ FIX-WEBRTC:            RTCPeerConnection + RTCDataChannel blocked during exam
// ✅ FIX-CLIPBOARD-RESTORE: read() + write() also restored in _restoreClipboard()
// ✅ FIX-FULLSCREEN-FLAG:   FullscreenGuard sets _active BEFORE attaching onChange listener
// ✅ FIX-STATIC-RACE:       AppSwitcherGuard _lastFired moved to instance (no cross-instance bleed)
// ✅ FIX-HISTORY-CLEANUP:   BackButtonBlocker.disable() calls replaceState to clean pushState pollution
// ✅ FIX-CONSOLE-ORDER:     SecurityManager.disable() restores console LAST, after all other cleanup
// ✅ FIX-SHUFFLE-GUARD:     shuffleQuestions coerces correct to Number before validation
// ✅ FIX-VISIBILITY-GUARD:  VisibilityManager warns if registered alongside AntiCheatController
// ✅ FIX-NETWORK-WEBSOCKET: NetworkGuard also blocks WebSocket
// ============================================================
// BUG-FIX v4:
// ✅ FIX-DOUBLE-ENABLE:       All static enable() guards prevent double-registration
// ✅ FIX-APPSWITCHER-DEDUP:   AppSwitcherGuard pagehide deduplicated against visibilitychange
// ✅ FIX-XHR-GUARD:           NetworkGuard now uses single _enabled flag (was broken dual null-check)
// ✅ FIX-CLEANUP-SECURITY:    CleanupManager.performFullCleanup() accepts securityManager + devToolsDetector
// ✅ FIX-SHUFFLE-NULL:        shuffleQuestions guards against null/undefined q.options
// ✅ FIX-TOSTRING-LEAK:       DevToolsDetector.stop() calls console.clear() to flush trap from buffer
// ✅ FIX-SCREENBLOCKER-DEDUP: ScreenRecordBlocker.enable() guards _originalGetUser before reassigning
// ✅ FIX-LEADERBOARD-SANITIZE: LeaderboardStorage sanitizes string fields before Firestore write
// ✅ FIX-HISTORY-NAV:         BackButtonBlocker.disable() uses replaceState instead of go(-2)
// ✅ FIX-FS-TRY-CATCH:        FullscreenGuard.enable() wraps enter() so listener is never added on failure
// ✅ FIX-VIOLATION-RESET:     AntiCheatController.enable() resets #violations to 0 on every call
// ✅ FIX-SOURCETLABEL-PRIVATE: _sourceLabel() inside AntiCheatController as static private
// ✅ FIX-HANDLER-WEAKREF:     SecurityManager stores bound handler refs for clean removal
// ✅ FIX-FINGERPRINT-SIGN:    getDeviceFingerprint hash uses unsigned right-shift
// ✅ FIX-OPTIONS-LENGTH:      shuffleQuestions uses (q.options?.length ?? 0) safely
// ✅ FIX-VISIBILITY-DOUBLE:   VisibilityManager tracks _enabled flag; disable() resets it
// ============================================================
// BUG-FIX v5:
// ✅ FIX-TIMETAKEN-STRING:    timeTaken now stored as formatted string "Xm Ys"
// ============================================================
// BUG-FIX v6 — UX HARDENING:
// ✅ FIX-APPSWITCHER-PAGEHIDE:  pagehide cooldown raised to _cooldown+300ms to prevent double-violation
// ✅ FIX-DEVTOOLS-ZOOM:         DevTools size check — disqualify only on isCertain (diff>300); zoom won't trigger
// ✅ FIX-DESKTOP-MOBILE:        DesktopModeEnforcer skips on touch devices (iOS/Android)
// ✅ FIX-STORAGE-WIPE-REMOVED:  _wipeStorage() REMOVED — was destroying legitimate session data
// ✅ FIX-SW-UNREG-REMOVED:      _unregisterServiceWorkers() REMOVED — causes blank screens on PWAs
// ✅ FIX-INACTIVITY-THRESHOLD:  APP_CONFIG.INACTIVITY_PERCENT raised 0.10 → 0.20 (less false positives)
// ============================================================
// BUG-FIX v7 — CRITICAL FIXES:
// ✅ FIX-NETWORKGUARD-FLAG:     NetworkGuard now uses single _enabled flag — old dual null-check was broken
// ✅ FIX-FS-ACTIVE-ORDERING:    FullscreenGuard._active = true set BEFORE onChange listener attach
// ✅ FIX-TOSTRING-CONSOLECLEAR: DevToolsDetector.stop() flushes console via native clear
// ✅ FIX-WINDOWSKEY-RESET:      SecurityManager._windowsKeyCount reset to 0 in enable()
// ✅ FIX-GETUSERMEDIA-GUARD:    ScreenRecordBlocker guards _originalGetUser before reassigning
// ============================================================
// BUG-FIX v8 — DOUBLE DETECTION + MOBILE FULLSCREEN:
// ✅ FIX-DOUBLE-TAB-DETECTION:  AppSwitcherGuard now uses a single source-of-truth violation channel.
//                                visibilitychange and pagehide share one _lastFired with 2500ms cooldown.
//                                Eliminates the race where both events fire within ms of each other
//                                on mobile/desktop causing 2 violations for 1 tab switch.
// ✅ FIX-MOBILE-FULLSCREEN-FS:  FullscreenGuard.reEnter() on mobile (touch device) is now a no-op —
//                                mobile browsers block programmatic fullscreen without user gesture,
//                                so the failed re-enter attempt left the guard in a broken _active=true
//                                state with no listener, silently dropping further exit events.
// ✅ FIX-MOBILE-BODY-FIXED:     AntiCheatController.enable() on touch devices skips fullscreen entirely
//                                (FullscreenGuard.enable resolves immediately without entering FS).
//                                ExamScreens no longer sets body position:fixed on mobile because that
//                                causes the bottom nav bar to fall outside the viewport after FS exit.
//                                Body overflow:hidden is still set via a non-fixed approach on mobile.
// ✅ FIX-FS-REENABLED-CALLBACK: FullscreenGuard.enable() now accepts a second call even when _active=true
//                                IF the existing listener was lost (e.g. after a failed re-enter on mobile).
//                                It only skips if isActive() is confirmed true AND listener exists.
// ============================================================
// BUG-FIX v9 — MOBILE DEVTOOLS + 6 ADDITIONAL BUGS:
// ✅ FIX-DEVTOOLS-MOBILE:       DevToolsDetector.start() returns early on touch devices.
//                                ROOT CAUSE: (1) outerHeight-innerHeight diff naturally >160px on mobile
//                                due to address bar + bottom nav — triggers size check falsely.
//                                (2) iOS Safari's JS engine pauses debugger >100ms without DevTools
//                                due to JIT warm-up / GC / low-power mode — timing check fires always.
//                                (3) Android USB debugging triggers toString trap.
//                                FIX: All detection gated behind !_isTouchDevice(). Mobile browsers
//                                cannot open DevTools natively so detection has zero value there.
// ✅ FIX-DEVTOOLS-STATE-RESET:  DevToolsDetector.start() now resets detected + consecutiveCount to 0
//                                before starting — prevents stale state if start() is called again.
// ✅ FIX-FS-DISABLE-EXIT:       FullscreenGuard.disable() now calls FullscreenManager.exit() itself.
//                                ROOT CAUSE: AntiCheatController.disable() calls FullscreenGuard.disable()
//                                which only removed the listener but never exited fullscreen — the exam
//                                UI would render while the browser was still in fullscreen mode.
//                                CleanupManager already called FullscreenManager.exit() separately, but
//                                any caller using AntiCheatController.disable() directly was affected.
// ✅ FIX-TABCLOSE-ONBEFOREUNLOAD: TabCloseGuard.disable() no longer sets window.onbeforeunload = null.
//                                ROOT CAUSE: The handler was registered via addEventListener (not via
//                                window.onbeforeunload assignment), so the null-assignment in disable()
//                                did nothing to remove our handler — but DID silently destroy any
//                                onbeforeunload handler set by other code after enable() was called.
// ✅ FIX-APPSWITCHER-DOUBLE-REG: AppSwitcherGuard.enable() now guards against double-registration.
//                                ROOT CAUSE: Unlike every other guard, AppSwitcherGuard had no _enabled
//                                flag. A second call to enable() overwrote _visHandler/_hideHandler refs,
//                                leaving the first pair of listeners permanently attached and unremovable.
// ✅ FIX-FS-LISTENER-RECOVERY:  FullscreenGuard.enable() second-call listener recovery now implemented.
//                                ROOT CAUSE: v8 changelog documented this behaviour but the code still
//                                did "if (this._active) return" unconditionally — no listener-existence
//                                check. On mobile where reEnter() is a no-op, if the listener was lost
//                                after a failed re-enter, subsequent FS exits were silently ignored.
//                                FIX: if _active but _removeListener is null, re-attach listener only.
// ✅ FIX-TOUCHSTART-PASSIVE:    SecurityManager touchstart handler now registered as passive.
//                                ROOT CAUSE: All handlers were registered with {passive:false} including
//                                touchstart, which only reads Date.now() and never calls preventDefault.
//                                Non-passive touchstart on document forces the browser to wait for JS
//                                before scrolling — causes janky scroll on every touch on mobile.
//                                FIX: touchstart/touchend split out and registered separately as passive.
// ============================================================

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
// DEVICE FINGERPRINT
// ==========================================
export function getDeviceFingerprint() {
  try {
    const parts = [
      navigator.userAgent || '',
      `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      navigator.language || '',
      navigator.hardwareConcurrency || '',
      navigator.platform || '',
    ];
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return (hash >>> 0).toString(36);
  } catch (e) {
    return 'unknown';
  }
}

// ==========================================
// LEADERBOARD STORAGE
// ✅ FIX-TIMETAKEN-STRING: timeTaken stored as formatted string "Xm Ys"
// ==========================================

function _sanitizeStr(val, maxLen = 200) {
  if (val == null) return '';
  return String(val)
    .replace(/<[^>]*>/g, '')
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
    .trim()
    .slice(0, maxLen);
}

function _formatTimeTaken(val) {
  if (val == null || val === '') return '0m 0s';
  if (typeof val === 'string' && /\d+m/.test(val)) {
    return _sanitizeStr(val, 30);
  }
  const secs = Math.max(0, Math.floor(Number(val) || 0));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export class LeaderboardStorage {
  static async saveEntry(testResult) {
    const MAX_RETRIES = 2;
    let collection, addDoc, db;
    try {
      ({ collection, addDoc } = await import('firebase/firestore'));
      ({ db }                 = await import('../firebase'));
    } catch (importErr) {
      (window.__nativeConsoleWarn || console.warn)('[MockTest] Firebase module import failed:', importErr.message);
      return { success: false, error: importErr.message };
    }
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const newEntry = {
          name:                   _sanitizeStr(testResult.studentInfo?.fullName || testResult.studentInfo?.name || testResult.userName || 'Anonymous', 100),
          email:                  _sanitizeStr(testResult.userEmail, 254),
          percentage:             Number(testResult.percentage) || 0,
          score:                  _sanitizeStr(`${testResult.correct}/${testResult.total}`, 20),
          testTitle:              _sanitizeStr(testResult.testTitle, 150),
          testLevel:              _sanitizeStr(testResult.testLevel, 50),
          timeTaken:              _formatTimeTaken(testResult.timeTaken),
          passed:                 Boolean(testResult.passed),
          penalized:              Boolean(testResult.penalized),
          disqualificationReason: _sanitizeStr(testResult.disqualificationReason || '', 300),
          date:                   new Date().toLocaleDateString('en-GB'),
          timestamp:              Date.now(),
          deviceFingerprint:      getDeviceFingerprint(),
        };
        await addDoc(collection(db, 'leaderboard'), newEntry);
        return { success: true };
      } catch (error) {
        // Don't retry permanent Firebase errors (permission denied, not found, quota, etc.)
        const permanent = ['permission-denied', 'not-found', 'resource-exhausted',
                           'unauthenticated', 'invalid-argument', 'already-exists'];
        if (permanent.includes(error?.code)) {
          (window.__nativeConsoleWarn || console.warn)('[MockTest] Leaderboard save — permanent error, no retry:', error.message);
          return { success: false, error: error.message };
        }
        if (attempt === MAX_RETRIES) {
          (window.__nativeConsoleWarn || console.warn)('[MockTest] Leaderboard save failed after retries:', error.message);
          return { success: false, error: error.message };
        }
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
}

// ==========================================
// CONFIGURATION
// ✅ FIX-INACTIVITY-THRESHOLD: raised 0.10 → 0.20 to avoid false positives on long questions
// ==========================================
export const APP_CONFIG = Object.freeze({
  ADMIN_EMAIL:             'luckyfaizu3@gmail.com',
  MAX_TAB_SWITCHES:        3,
  MAX_BLUR_COUNT:          999,
  MAX_WINDOWS_KEY_PRESSES: 3,
  WARNING_TIMEOUT:         3000,
  AUTO_SUBMIT_DELAY:       2000,
  CRITICAL_TIME_MINUTES:   5,
  INACTIVITY_PERCENT:      0.20,
  DEVTOOLS_SIZE_THRESHOLD: 160,
  DISQUALIFY_MIN_SECONDS:  15,
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
    const optLen = q.options?.length ?? 0;
    if (optLen === 0) return q;

    const correctIdx = Number(q.correct);
    if (!Number.isInteger(correctIdx) || correctIdx < 0 || correctIdx >= optLen) {
      return q;
    }
    const indexedOpts   = q.options.map((text, i) => ({ text, origIdx: i }));
    const shuffledIdx   = shuffleArray(indexedOpts);
    const newCorrectIdx = shuffledIdx.findIndex(o => o.origIdx === correctIdx);
    return { ...q, options: shuffledIdx.map(o => o.text), correct: newCorrectIdx };
  });
}

// ==========================================
// SCREEN RECORD BLOCKER
// ✅ FIX-GETUSERMEDIA-GUARD: guard _originalGetUser before reassigning
// ==========================================
export class ScreenRecordBlocker {
  static _originalDisplay = null;
  static _originalGetUser = null;
  static _enabled         = false;

  static enable() {
    if (this._enabled) return;
    this._enabled = true;

    if (navigator.mediaDevices?.getDisplayMedia) {
      if (!this._originalDisplay) {
        this._originalDisplay = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      }
      navigator.mediaDevices.getDisplayMedia = async () => {
        throw new DOMException('Screen recording is disabled during the exam.', 'NotAllowedError');
      };
    }
    if (navigator.mediaDevices?.getUserMedia) {
      if (!this._originalGetUser) {
        this._originalGetUser = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      }
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        if (constraints?.video?.mediaSource === 'screen' || constraints?.video?.displaySurface) {
          throw new DOMException('Screen capture is disabled during the exam.', 'NotAllowedError');
        }
        return ScreenRecordBlocker._originalGetUser(constraints);
      };
    }
  }

  static disable() {
    if (!this._enabled) return;
    this._enabled = false;

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
// ✅ FIX-DESKTOP-MOBILE: skip on touch devices
// ==========================================
export class DesktopModeEnforcer {
  static _original = null;
  static _created  = null;
  static _enabled  = false;

  static _isTouchDevice() {
    return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  }

  static enable() {
    if (this._enabled) return;
    if (this._isTouchDevice()) return;
    this._enabled = true;

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
    if (!this._enabled) return;
    this._enabled = false;

    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      if (this._original !== null) {
        meta.setAttribute('content', this._original);
        this._original = null;
      } else if (this._created) {
        this._created.remove();
        this._created = null;
      } else {
        meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes');
      }
    }
  }
}

// ==========================================
// UTILS
// ==========================================
export class TestUtils {
  static isAdmin(email) { return email === APP_CONFIG.ADMIN_EMAIL; }

  static formatTime(s) {
    const safe = Math.max(0, Math.floor(s));
    const h    = Math.floor(safe / 3600);
    const m    = Math.floor((safe % 3600) / 60);
    const sc   = safe % 60;
    return { display: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}` };
  }

  static formatShort(s) {
    const safe = Math.max(0, Math.floor(s));
    const m    = Math.floor(safe / 60);
    const sc   = safe % 60;
    if (m > 0) return `${m}:${String(sc).padStart(2,'0')}`;
    return `${sc}s`;
  }

  static calculateScore(answers, questions, tabSwitches, isAdmin, passPercent) {
    if (!questions || questions.length === 0) {
      return {
        correct: 0, wrong: 0, total: 0,
        percentage: 0, passed: false,
        correctQuestions: [], wrongQuestions: [], penalized: false,
      };
    }
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

  static isTouchDevice() {
    return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  }
}

// ==========================================
// AUDIO MANAGER
// ==========================================
export class AudioManager {
  constructor() { this.context = null; }
  init()      { /* silent */ }
  playTick()  { /* removed */ }
  playAlarm() { /* removed */ }
  destroy()   {
    if (this.context) { try { this.context.close(); } catch (e) {} this.context = null; }
  }
}

// ==========================================
// FULLSCREEN MANAGER
// ==========================================
export class FullscreenManager {
  static async enter() {
    try {
      if (FullscreenManager.isActive()) return;
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
// ✅ FIX-DEVTOOLS-ZOOM:         size check alone NEVER disqualifies — requires isCertain (diff>300)
// ✅ FIX-TOSTRING-CONSOLECLEAR: stop() flushes console buffer via native clear
// ✅ FIX-DEVTOOLS-MOBILE (v9):  All detection disabled on touch devices — see changelog above
// ✅ FIX-DEVTOOLS-STATE-RESET:  start() resets detected + consecutiveCount before starting
// ==========================================
export class DevToolsDetector {
  constructor(onWarning, onAutoSubmit) {
    this.onWarning        = onWarning;
    this.onAutoSubmit     = onAutoSubmit;
    this.interval         = null;
    this.detected         = false;
    this.consecutiveCount = 0;
    this._toStringTrap    = null;
  }

  _isTouchDevice() {
    return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  }

  _isOpenBySize() {
    const widthDiff  = window.outerWidth  - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > 300 || heightDiff > 300)
      return { isOpen: true, isCertain: true };
    if (widthDiff > APP_CONFIG.DEVTOOLS_SIZE_THRESHOLD || heightDiff > APP_CONFIG.DEVTOOLS_SIZE_THRESHOLD)
      return { isOpen: true, isCertain: false };
    return { isOpen: false, isCertain: false };
  }

  _isOpenByTiming() {
    try {
      const t0 = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      return (performance.now() - t0) > 100;
    } catch (e) { return false; }
  }

  _setupToStringTrap(onDetect) {
    try {
      const logFn = window.__nativeConsoleLog || console.log;
      if (typeof logFn !== 'function') return;
      const trap = {
        toString: () => {
          onDetect();
          return '';
        },
      };
      logFn.call(console, '%c', trap);
      this._toStringTrap = trap;
    } catch (e) {}
  }

  _isOpenByGlobal() {
    try {
      if (window.Firebug?.chrome?.isInitialized) return true;
      return false;
    } catch (e) { return false; }
  }

  _isOpen() {
    const bySize   = this._isOpenBySize();
    const byTiming = this._isOpenByTiming();
    const byGlobal = this._isOpenByGlobal();
    return {
      isOpen:    bySize.isOpen || byTiming || byGlobal,
      isCertain: bySize.isCertain || byTiming || byGlobal,
    };
  }

  _handleDetection() {
    if (this.detected) return;
    this.detected = true;
    this.stop();
    this.onWarning(
      'DISQUALIFIED — Developer Tools Detected\n\nDeveloper Tools were open. Test is being submitted as FAIL.',
      'final',
      true
    );
    setTimeout(() => this.onAutoSubmit(true, 'devtools-disqualified'), 500);
  }

  start() {
    // ✅ FIX-DEVTOOLS-MOBILE: mobile browsers can't open DevTools natively.
    // All 3 detection methods produce false positives on touch devices — skip entirely.
    if (this._isTouchDevice()) return;

    // ✅ FIX-DEVTOOLS-STATE-RESET: always start fresh in case start() is called again.
    this.detected         = false;
    this.consecutiveCount = 0;

    this._setupToStringTrap(() => this._handleDetection());

    this.interval = setInterval(() => {
      if (this.detected) return;
      const { isOpen, isCertain } = this._isOpen();
      if (isOpen) {
        this.consecutiveCount++;
        const threshold = isCertain ? 1 : 3;
        if (this.consecutiveCount >= threshold) {
          this._handleDetection();
        }
      } else {
        this.consecutiveCount = Math.max(0, this.consecutiveCount - 1);
      }
    }, 1000);
  }

  stop() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
    try {
      const clearFn = window.__nativeConsoleClear || console.clear;
      if (typeof clearFn === 'function') clearFn.call(console);
    } catch (e) {}
    this._toStringTrap = null;
  }
}

// ==========================================
// SECURITY MANAGER
// ✅ FIX-WINDOWSKEY-RESET:    _windowsKeyCount reset to 0 in enable()
// ✅ FIX-TOUCHSTART-PASSIVE:  touchstart/touchend registered separately as passive listeners
//                              so they never block scroll — they only read timestamps.
// ==========================================
export class SecurityManager {
  constructor(onWarning, handleSubmitRef) {
    this.onWarning       = onWarning;
    this.handleSubmitRef = handleSubmitRef;
    this.violationCount  = 0;
    this.maxViolations   = 999;
    this._enabled        = false;

    this._origClipboardRead      = null;
    this._origClipboardWrite     = null;
    this._origClipboardReadFull  = null;
    this._origClipboardWriteFull = null;
    this._origExecCommand        = null;
    this._origWebSocket          = null;
    this._origRTC                = null;
    this._origRTCData            = null;

    this._windowsKeyCount   = 0;
    this._windowsKeyTimer   = null;

    this._touchStartTime     = 0;
    this._longPressThreshold = 500;

    this._origConsoleMethods = {};

    // ✅ FIX-TOUCHSTART-PASSIVE: touchstart/touchend are separated from the main
    // handlers object so they can be registered with passive:true independently.
    // Keeping them in this.handlers would register them with passive:false (like all
    // other handlers), which forces the browser to wait for JS before scrolling —
    // causing janky scroll on every touch event on mobile.
    this._touchStartHandler = (e) => { this._touchStartTime = Date.now(); };
    this._touchEndHandler   = (e) => {
      const touchDuration = Date.now() - this._touchStartTime;
      const tag = e.target.tagName;
      const isInteractive = (
        tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' ||
        tag === 'TEXTAREA' || tag === 'A' ||
        e.target.isContentEditable ||
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('[role="button"]')
      );
      if (touchDuration >= this._longPressThreshold && !isInteractive) {
        e.preventDefault();
      }
    };

    this.handlers = {
      copy:        (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Copying is disabled during the test.'); },
      cut:         (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Cutting is disabled during the test.'); },
      paste:       (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Pasting is disabled during the test.'); },
      contextmenu: (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Right-click is disabled during the test.'); },

      keydown: (e) => {
        const ctrl    = e.ctrlKey || e.metaKey;
        const key     = e.key.toLowerCase();
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
        const isFKey  = /^f([1-9]|1[0-2])$/i.test(e.key);

        const isWindowsKey = e.key === 'Meta' || e.key === 'OS';
        if (isWindowsKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          this._windowsKeyCount++;

          if (this._windowsKeyTimer) clearTimeout(this._windowsKeyTimer);
          this._windowsKeyTimer = setTimeout(() => { this._windowsKeyCount = 0; }, 5000);

          if (this._windowsKeyCount >= APP_CONFIG.MAX_WINDOWS_KEY_PRESSES) {
            this._windowsKeyCount = 0;
            this.onWarning(
              `DISQUALIFIED — Windows Key Pressed ${APP_CONFIG.MAX_WINDOWS_KEY_PRESSES} Times!\n\nTest is being submitted as FAIL.`,
              'final',
              true
            );
            setTimeout(() => {
              if (this.handleSubmitRef.current) this.handleSubmitRef.current(true, 'windows-key-disqualified');
            }, APP_CONFIG.AUTO_SUBMIT_DELAY);
          } else {
            const remaining = APP_CONFIG.MAX_WINDOWS_KEY_PRESSES - this._windowsKeyCount;
            this.onWarning(
              `⚠️ Windows Key Blocked! (${this._windowsKeyCount}/${APP_CONFIG.MAX_WINDOWS_KEY_PRESSES})\n\nPress it ${remaining} more time${remaining === 1 ? '' : 's'} and you will be DISQUALIFIED!`,
              'critical',
              true
            );
          }
          return;
        }

        const blocked =
          isFKey ||
          (ctrl && key === 'a' && !isInput) ||
          (ctrl && key === 'i' && !isInput) ||
          (ctrl && ['c','x','v','s','p','u'].includes(key)) ||
          (ctrl && e.shiftKey && ['i','j','c','k'].includes(key)) ||
          (ctrl && key === 'r') ||
          (ctrl && key === 'w') ||
          (ctrl && key === 'q') ||
          (ctrl && key === '+') ||
          (ctrl && key === '-') ||
          (ctrl && key === '=') ||
          (ctrl && key === '0') ||
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && ['3','4','5','s'].includes(key));

        if (blocked) {
          e.preventDefault();
          e.stopPropagation();
          this.recordViolation('Keyboard shortcut blocked during the test.');
        }
      },

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
      beforeprint: (e) => { this.recordViolation('Printing is disabled during the test.'); },
    };
  }

  _poisonClipboard() {
    try {
      if (navigator.clipboard) {
        this._origClipboardRead      = navigator.clipboard.readText?.bind(navigator.clipboard);
        this._origClipboardWrite     = navigator.clipboard.writeText?.bind(navigator.clipboard);
        this._origClipboardReadFull  = navigator.clipboard.read?.bind(navigator.clipboard);
        this._origClipboardWriteFull = navigator.clipboard.write?.bind(navigator.clipboard);

        navigator.clipboard.readText  = async () => { this.recordViolation('Clipboard access blocked.'); return ''; };
        navigator.clipboard.writeText = async () => { this.recordViolation('Clipboard write blocked.'); };
        navigator.clipboard.read      = async () => { this.recordViolation('Clipboard read blocked.'); return []; };
        navigator.clipboard.write     = async () => { this.recordViolation('Clipboard write blocked.'); };
      }
    } catch (e) {}

    try {
      this._origExecCommand = document.execCommand.bind(document);
      document.execCommand = (cmd, ...rest) => {
        const blocked = ['copy', 'cut', 'paste', 'selectAll'];
        if (blocked.includes(cmd.toLowerCase())) {
          this.recordViolation(`execCommand '${cmd}' blocked during exam.`);
          return false;
        }
        return this._origExecCommand(cmd, ...rest);
      };
    } catch (e) {}
  }

  _restoreClipboard() {
    try {
      if (navigator.clipboard) {
        if (this._origClipboardRead)      navigator.clipboard.readText  = this._origClipboardRead;
        if (this._origClipboardWrite)     navigator.clipboard.writeText = this._origClipboardWrite;
        if (this._origClipboardReadFull)  navigator.clipboard.read      = this._origClipboardReadFull;
        if (this._origClipboardWriteFull) navigator.clipboard.write     = this._origClipboardWriteFull;
        this._origClipboardRead = this._origClipboardWrite =
        this._origClipboardReadFull = this._origClipboardWriteFull = null;
      }
    } catch (e) {}

    try {
      if (this._origExecCommand) {
        document.execCommand = this._origExecCommand;
        this._origExecCommand = null;
      }
    } catch (e) {}
  }

  _blockWebSocket() {
    try {
      this._origWebSocket = window.WebSocket;
      window.WebSocket = function() {
        throw new Error('WebSocket is blocked during the exam.');
      };
    } catch (e) {}
  }

  _restoreWebSocket() {
    try {
      if (this._origWebSocket) {
        window.WebSocket = this._origWebSocket;
        this._origWebSocket = null;
      }
    } catch (e) {}
  }

  _blockWebRTC() {
    try {
      this._origRTC = window.RTCPeerConnection;
      window.RTCPeerConnection = function() {
        throw new Error('RTCPeerConnection is blocked during the exam.');
      };
    } catch (e) {}
    try {
      this._origRTCData = window.RTCDataChannel;
      window.RTCDataChannel = function() {
        throw new Error('RTCDataChannel is blocked during the exam.');
      };
    } catch (e) {}
  }

  _restoreWebRTC() {
    try {
      if (this._origRTC)     { window.RTCPeerConnection = this._origRTC;     this._origRTC     = null; }
      if (this._origRTCData) { window.RTCDataChannel    = this._origRTCData; this._origRTCData = null; }
    } catch (e) {}
  }

  recordViolation(message) {
    this.violationCount++;
    this.onWarning(message, 'violation');
  }

  enable() {
    if (this._enabled) return;
    this._enabled = true;

    // ✅ FIX-WINDOWSKEY-RESET
    this._windowsKeyCount = 0;

    // Main handlers — registered with capture:true, passive:false (needed for preventDefault)
    Object.entries(this.handlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler, { capture: true, passive: false });
    });

    // ✅ FIX-TOUCHSTART-PASSIVE: register touch handlers separately as passive.
    // passive:true means the browser never waits for JS before scrolling — smooth UX.
    // touchend still calls preventDefault for long-press, but only conditionally;
    // passive:false on touchend is required for that preventDefault to work.
    document.addEventListener('touchstart', this._touchStartHandler, { capture: true, passive: true });
    document.addEventListener('touchend',   this._touchEndHandler,   { capture: true, passive: false });

    document.body.style.userSelect       = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect     = 'none';
    ScreenRecordBlocker.enable();
    this._poisonClipboard();
    this._blockWebSocket();
    this._blockWebRTC();
    try { window.__origOpen = window.open; window.open = () => null; } catch (e) {}
    try {
      window.__origPrint = window.print;
      window.print = () => { this.recordViolation('Printing is disabled during the test.'); };
    } catch (e) {}

    try {
      const noop = () => {};
      const methods = ['log','warn','error','info','table','dir','dirxml','group','groupEnd',
                       'time','timeEnd','assert','profile','profileEnd','trace','count','clear'];
      methods.forEach(m => {
        try {
          this._origConsoleMethods[m] = console[m];
          if (m === 'warn')  window.__nativeConsoleWarn  = console[m];
          if (m === 'log')   window.__nativeConsoleLog   = console[m];
          if (m === 'clear') window.__nativeConsoleClear = console[m];
          console[m] = noop;
        } catch (e) {}
      });
    } catch (e) {}
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;

    // Remove main handlers
    Object.entries(this.handlers).forEach(([event, handler]) => {
      document.removeEventListener(event, handler, true);
    });

    // ✅ FIX-TOUCHSTART-PASSIVE: remove touch handlers using same options as registration
    document.removeEventListener('touchstart', this._touchStartHandler, true);
    document.removeEventListener('touchend',   this._touchEndHandler,   true);

    document.body.style.userSelect       = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.msUserSelect     = '';
    ScreenRecordBlocker.disable();
    this._restoreClipboard();
    this._restoreWebSocket();
    this._restoreWebRTC();
    if (this._windowsKeyTimer) { clearTimeout(this._windowsKeyTimer); this._windowsKeyTimer = null; }
    try { if (window.__origOpen)  { window.open  = window.__origOpen;  delete window.__origOpen;  } } catch (e) {}
    try { if (window.__origPrint) { window.print = window.__origPrint; delete window.__origPrint; } } catch (e) {}

    // ✅ FIX-CONSOLE-ORDER: restore console LAST
    try {
      Object.entries(this._origConsoleMethods).forEach(([m, fn]) => {
        try { if (fn) console[m] = fn; } catch (e) {}
      });
      this._origConsoleMethods = {};
      delete window.__nativeConsoleWarn;
      delete window.__nativeConsoleLog;
      delete window.__nativeConsoleClear;
    } catch (e) {}
  }
}

// ==========================================
// VISIBILITY MANAGER
// ==========================================
export class VisibilityManager {
  static _origTitle   = '';
  static _hiddenTitle = '🔒 Return to Exam — PySkill';
  static _handler     = null;
  static _enabled     = false;

  static enable() {
    if (this._enabled) return;
    this._enabled = true;

    if (window.__antiCheatControllerActive) {
      (window.__nativeConsoleWarn || console.warn)(
        '[MockTest] VisibilityManager.enable() called while AntiCheatController is active.'
      );
    }
    this._origTitle = document.title;
    this._handler = () => {
      document.title = document.hidden ? this._hiddenTitle : this._origTitle;
    };
    document.addEventListener('visibilitychange', this._handler);
  }

  static disable() {
    if (!this._enabled) return;
    this._enabled = false;

    if (this._handler) document.removeEventListener('visibilitychange', this._handler);
    try { document.title = this._origTitle; } catch (e) {}
    this._handler = null;
  }
}

// ==========================================
// NETWORK GUARD
// ✅ FIX-NETWORKGUARD-FLAG: single _enabled flag replaces broken dual null-check
// ==========================================
const BLOCKED_DOMAINS = [
  'openai.com', 'chatgpt.com', 'claude.ai', 'gemini.google.com', 'bard.google.com',
  'copilot.microsoft.com', 'bing.com',
  'pastebin.com', 'paste.ee', 'hastebin.com', 'gist.github.com', 'snippet.run',
  'telegram.org', 'web.telegram.org', 'discord.com', 'discord.gg',
  'whatsapp.com', 'web.whatsapp.com', 'signal.org',
  'chegg.com', 'coursehero.com', 'quizlet.com', 'brainly.com', 'slader.com',
  'stackoverflow.com', 'answers.com',
  'chat.openai.com', 'perplexity.ai', 'you.com', 'phind.com', 'poe.com',
  'character.ai', 'cohere.ai', 'groq.com',
];

export class NetworkGuard {
  static _origFetch = null;
  static _origXHR   = null;
  static _enabled   = false;

  static _isBlocked(url) {
    try {
      const hostname = new URL(url, window.location.href).hostname;
      return BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch (e) { return false; }
  }

  static enable() {
    if (this._enabled) return;
    this._enabled = true;

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
    if (!this._enabled) return;
    this._enabled = false;

    if (this._origFetch) { window.fetch          = this._origFetch; this._origFetch = null; }
    if (this._origXHR)   { window.XMLHttpRequest = this._origXHR;   this._origXHR   = null; }
  }
}

// ==========================================
// BACK BUTTON BLOCKER
// ==========================================
export class BackButtonBlocker {
  static _handler = null;
  static _active  = false;

  static enable() {
    if (this._active) return;
    this._active = true;
    window.history.pushState({ examLock: true }, '', window.location.href);
    window.history.pushState({ examLock: true }, '', window.location.href);
    this._handler = () => {
      window.history.pushState({ examLock: true }, '', window.location.href);
    };
    window.addEventListener('popstate', this._handler);
  }

  static disable() {
    if (!this._active) return;
    this._active = false;
    if (this._handler) {
      window.removeEventListener('popstate', this._handler);
      this._handler = null;
    }
    try {
      window.history.replaceState(null, '', window.location.href);
    } catch (e) {}
  }
}

// ==========================================
// TAB CLOSE GUARD
// ✅ FIX-TABCLOSE-ONBEFOREUNLOAD: disable() no longer sets window.onbeforeunload = null.
//    ROOT CAUSE: The handler was added via addEventListener — setting window.onbeforeunload
//    to null in disable() did NOT remove our listener, but DID silently destroy any
//    onbeforeunload handler set by other code after our enable() was called.
// ==========================================
export class TabCloseGuard {
  static _handler = null;
  static _enabled = false;

  static enable() {
    if (this._enabled) return;
    this._enabled = true;

    this._handler = (e) => {
      e.preventDefault();
      e.returnValue = 'Your exam is in progress. Leaving will submit your test.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', this._handler);
  }

  static disable() {
    if (!this._enabled) return;
    this._enabled = false;

    if (this._handler) {
      window.removeEventListener('beforeunload', this._handler);
      this._handler = null;
    }
    // ✅ FIX-TABCLOSE-ONBEFOREUNLOAD: removed "window.onbeforeunload = null" — see changelog
  }
}

// ==========================================
// APP SWITCHER GUARD
// ✅ FIX-DOUBLE-TAB-DETECTION (v8): shared _lastFired with 3000ms cooldown
// ✅ FIX-APPSWITCHER-DOUBLE-REG (v9): added _enabled guard to prevent handler leak on double enable()
// ==========================================
export class AppSwitcherGuard {
  static _visHandler  = null;
  static _hideHandler = null;
  static _cooldown    = 3000;
  static _lastFired   = 0;
  static _enabled     = false; // ✅ FIX-APPSWITCHER-DOUBLE-REG

  static enable(onSwitch) {
    // ✅ FIX-APPSWITCHER-DOUBLE-REG: without this guard, a second enable() call would
    // overwrite _visHandler/_hideHandler, making the first pair of listeners unremovable.
    if (this._enabled) return;
    this._enabled   = true;
    this._lastFired = 0;

    this._visHandler = () => {
      if (!document.hidden) return;
      const now = Date.now();
      if (now - this._lastFired < this._cooldown) return;
      this._lastFired = now;
      onSwitch();
    };

    this._hideHandler = () => {
      const now = Date.now();
      if (now - this._lastFired < this._cooldown + 500) return;
      this._lastFired = now;
      onSwitch();
    };

    document.addEventListener('visibilitychange', this._visHandler);
    window.addEventListener('pagehide', this._hideHandler);
  }

  static disable() {
    if (!this._enabled) return; // ✅ FIX-APPSWITCHER-DOUBLE-REG: symmetric guard
    this._enabled = false;

    if (this._visHandler)  document.removeEventListener('visibilitychange', this._visHandler);
    if (this._hideHandler) window.removeEventListener('pagehide', this._hideHandler);
    this._visHandler  = null;
    this._hideHandler = null;
    this._lastFired   = 0;
  }
}

// ==========================================
// FULLSCREEN GUARD
// ✅ FIX-FS-ACTIVE-ORDERING (v7):      _active=true set BEFORE attaching listener
// ✅ FIX-MOBILE-FULLSCREEN (v8):       reEnter() no-op on touch; enable() skips FS on touch
// ✅ FIX-FS-LISTENER-RECOVERY (v9):    enable() second-call now actually re-attaches the listener
//    when _active=true but _removeListener=null (listener was lost after failed reEnter on mobile).
//    ROOT CAUSE: v8 changelog documented this behaviour but the code still did
//    "if (this._active) return" unconditionally — no listener-existence check was performed.
// ✅ FIX-FS-DISABLE-EXIT (v9):         disable() now calls FullscreenManager.exit() itself.
//    ROOT CAUSE: AntiCheatController.disable() calls FullscreenGuard.disable() which only
//    removed the listener and set _active=false — it never exited fullscreen, leaving the
//    exam UI rendering inside the fullscreen viewport. CleanupManager called exit() separately
//    but any caller using AntiCheatController.disable() directly was affected.
// ==========================================
export class FullscreenGuard {
  static _removeListener = null;
  static _active         = false;

  static _isTouchDevice() {
    return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  }

  static async enable(onExit) {
    // ✅ FIX-FS-LISTENER-RECOVERY: if _active but _removeListener is null,
    // the listener was lost (e.g. after a failed reEnter). Re-attach only — don't re-enter FS.
    if (this._active) {
      if (this._removeListener === null) {
        this._removeListener = FullscreenManager.onChange(() => {
          if (!FullscreenManager.isActive() && this._active) {
            onExit();
          }
        });
      }
      return;
    }

    // ✅ FIX-MOBILE-FULLSCREEN: skip fullscreen entirely on touch devices.
    if (this._isTouchDevice()) {
      return;
    }

    try {
      await FullscreenManager.enter();
      // ✅ FIX-FS-ACTIVE-ORDERING: flag BEFORE listener to avoid async-tick race
      this._active = true;
      this._removeListener = FullscreenManager.onChange(() => {
        if (!FullscreenManager.isActive() && this._active) {
          onExit();
        }
      });
    } catch (err) {
      // enter() failed — _active stays false, listener never attached
    }
  }

  static async reEnter() {
    // ✅ FIX-MOBILE-FULLSCREEN: no-op on touch — programmatic re-enter fails without user gesture
    if (this._isTouchDevice()) return;
    await FullscreenManager.enter();
  }

  static disable() {
    this._active = false;
    if (this._removeListener) {
      this._removeListener();
      this._removeListener = null;
    }
    // ✅ FIX-FS-DISABLE-EXIT: exit fullscreen here so any caller (including
    // AntiCheatController.disable()) leaves a clean browser state.
    FullscreenManager.exit();
  }
}

// ==========================================
// SCREENSHOT BLOCKER
// ==========================================
export class ScreenshotBlocker {
  static _injected = [];
  static _enabled  = false;

  static enable() {
    if (typeof document === 'undefined') return;
    if (this._enabled) return;
    this._enabled = true;

    const metas = [
      { name: 'apple-mobile-web-app-capable',          content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { 'http-equiv': 'x-ua-compatible',               content: 'IE=edge' },
    ];
    metas.forEach(attrs => {
      const selector = attrs.name
        ? `meta[name="${attrs.name}"]`
        : `meta[http-equiv="${attrs['http-equiv']}"]`;
      if (document.querySelector(selector)) return;
      const meta = document.createElement('meta');
      Object.entries(attrs).forEach(([k, v]) => meta.setAttribute(k, v));
      document.head.appendChild(meta);
      this._injected.push(meta);
    });
  }

  static disable() {
    if (!this._enabled) return;
    this._enabled = false;
    this._injected.forEach(m => { try { m.remove(); } catch (e) {} });
    this._injected = [];
  }
}

// ==========================================
// ANTI-CHEAT CONTROLLER
// ==========================================
export class AntiCheatController {
  #violations = 0;
  #active     = false;

  constructor({ onWarning, onDisqualify }) {
    this.onWarning    = onWarning;
    this.onDisqualify = onDisqualify;
  }

  static #sourceLabel(source) {
    return {
      'tab-switch':      'Tab / App Switch',
      'fullscreen-exit': 'Fullscreen Exited',
      'app-switch':      'App Switched',
    }[source] || source;
  }

  _recordViolation(source) {
    if (!this.#active) return;
    this.#violations++;
    const remaining = APP_CONFIG.MAX_TAB_SWITCHES - this.#violations;

    if (this.#violations >= APP_CONFIG.MAX_TAB_SWITCHES) {
      this.#active = false;
      this.onWarning(
        `DISQUALIFIED — Too Many Violations (${AntiCheatController.#sourceLabel(source)})\n\nTest is being submitted as FAIL.`,
        'final',
        true
      );
      setTimeout(() => {
        this.onDisqualify(`violations-limit-${source}`);
      }, APP_CONFIG.AUTO_SUBMIT_DELAY);
    } else {
      this.onWarning(
        `⚠️ WARNING — ${AntiCheatController.#sourceLabel(source)}! (${this.#violations}/${APP_CONFIG.MAX_TAB_SWITCHES})\n\n` +
        `${remaining} more violation${remaining === 1 ? '' : 's'} and you will be DISQUALIFIED!\n\n` +
        (FullscreenGuard._isTouchDevice() ? '' : 'Returning to fullscreen now...'),
        'critical',
        true
      );
      // ✅ FIX-MOBILE-FULLSCREEN: only call reEnter on non-touch devices
      if (!FullscreenGuard._isTouchDevice()) {
        setTimeout(() => FullscreenGuard.reEnter(), 800);
      }
    }
  }

  async enable() {
    this.#active     = true;
    this.#violations = 0;
    window.__antiCheatControllerActive = true;
    BackButtonBlocker.enable();
    TabCloseGuard.enable();
    AppSwitcherGuard.enable(() => this._recordViolation('tab-switch'));
    await FullscreenGuard.enable(() => this._recordViolation('fullscreen-exit'));
    ScreenshotBlocker.enable();
  }

  disable() {
    this.#active = false;
    window.__antiCheatControllerActive = false;
    BackButtonBlocker.disable();
    TabCloseGuard.disable();
    AppSwitcherGuard.disable();
    FullscreenGuard.disable(); // ✅ now also exits fullscreen via FIX-FS-DISABLE-EXIT
    ScreenshotBlocker.disable();
  }

  get violations() { return this.#violations; }
}

// ==========================================
// CLEANUP MANAGER
// ==========================================
export class CleanupManager {
  static performFullCleanup(delayFullscreen = false, securityManager = null, devToolsDetector = null) {
    window.onbeforeunload = null;
    window.__antiCheatControllerActive = false;

    if (devToolsDetector && typeof devToolsDetector.stop === 'function') {
      try { devToolsDetector.stop(); } catch (e) {}
    }

    DesktopModeEnforcer.disable();
    ScreenRecordBlocker.disable();
    NetworkGuard.disable();
    VisibilityManager.disable();
    BackButtonBlocker.disable();
    TabCloseGuard.disable();
    AppSwitcherGuard.disable();
    FullscreenGuard.disable(); // ✅ FIX-FS-DISABLE-EXIT: this now also calls FullscreenManager.exit()

    if (securityManager && typeof securityManager.disable === 'function') {
      try { securityManager.disable(); } catch (e) {}
    }

    ScreenshotBlocker.disable();

    // FullscreenGuard.disable() already calls FullscreenManager.exit() immediately.
    // delayFullscreen=true path is kept for callers that need an extra delayed exit
    // (e.g. to let a transition animation play before the browser chrome reappears).
    if (delayFullscreen) {
      setTimeout(() => FullscreenManager.exit(), 800);
    }

    [document.body, document.documentElement].forEach(el => {
      if (!el) return;
      ['overflow','position','margin','padding','width','height','top','left',
       'overscrollBehavior','userSelect','webkitUserSelect','msUserSelect','mozUserSelect']
        .forEach(p => { el.style[p] = ''; });
    });
    window.scrollTo(0, 0);
  }
}