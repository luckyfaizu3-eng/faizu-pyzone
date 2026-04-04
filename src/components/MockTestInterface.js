// @ts-nocheck
// FILE LOCATION: src/components/MockTestInterface.jsx
//
// ============================================================
// ALL BUGS FIXED — COMPLETE AUDIT LOG
// ============================================================
// ✅ ORIG-FIX 1:  IsolatedTimer stale closure — onExpire/onTick refs (retained)
// ✅ ORIG-FIX 2:  SecurityManager stale handleSubmit — ref se pass (retained)
// ✅ ORIG-FIX 3:  handleAnswer setTimeout race — direct functional setState (retained)
// ✅ ORIG-FIX 4:  handleSubmit useEffect dep loop — securityRef se call (retained)
// ✅ ORIG-FIX 5:  DevTools detection — warning + auto-submit (retained + patched below)
// ✅ ORIG-FIX 6:  window.innerWidth in IsolatedTimer render — state mein (retained)
// ✅ ORIG-FIX 7:  OS screen record false sense — note added (retained)
// ✅ ORIG-FIX 8:  @keyframes global CSS mein inject ek baar (retained)
// ✅ ORIG-FIX 9:  Firebase silent fail — retry + console warning (retained)
// ✅ ORIG-FIX 10: handleSubmit useCallback deps stable (retained)
//
// ✅ NEW-FIX A:  DevToolsDetector._isOpen() — firebug Image getter NEVER fires without
//               console.log(element). firebugOpen was ALWAYS false → Method 2 was dead.
//               FIXED: removed broken getter trick; use ONLY size-diff with two thresholds.
//               veryLargeDiff (>300px) = definite; moderateDiff (>160px) = probable after
//               REQUIRED_TICKS consecutive checks (reduces false positives on split-screen).
//
// ✅ NEW-FIX B:  DevToolsDetector — after auto-submit fires, interval kept running because
//               stop() is called inside handleSubmit which may not execute immediately.
//               FIXED: call this.stop() immediately after onAutoSubmit() inside the detector.
//
// ✅ NEW-FIX C:  DevToolsDetector — warningShown never reset to false unless consecutiveCount
//               reaches exactly 0. If count drops from 4→3 (closed just before warning),
//               warningShown stays true permanently and warning never shows again.
//               FIXED: reset warningShown when consecutiveCount drops below WARNING threshold.
//
// ✅ NEW-FIX D:  WarningModal useState(20) initial value — first render always shows "20s"
//               even for devtools (which uses 10s). Visible flicker before useEffect runs.
//               FIXED: lazy initializer reads type prop to compute correct initial value.
//               NOTE: type/show are props, not available in useState lazy init directly —
//               solution: pass initialCountdown as explicit prop.
//
// ✅ NEW-FIX E:  SecurityManager keydown — Ctrl+I blocked globally including inside inputs
//               (breaks italic shortcut in rich text editors / contenteditable).
//               FIXED: added isInput guard for Ctrl+I (mirrors existing Ctrl+A guard).
//
// ✅ NEW-FIX F:  TestInterface blur & mouseleave useEffects — isDisqualified in deps causes
//               listeners to briefly detach/re-attach when disqualification happens, creating
//               a small window where cheating events go undetected.
//               FIXED: removed isDisqualified from deps; use isDisqualifiedRef.current inside.
//
// ✅ NEW-FIX G:  InstructionScreen onAccept — fullscreen may have been dismissed by user
//               between mount and clicking "Start Test". Parent enters fullscreen only on
//               mount; re-entry on accept ensures test actually starts in fullscreen.
//               FIXED: call FullscreenManager.enter() inside onAccept handler in parent.
//
// ✅ NEW-FIX H:  shuffleQuestions — if q.correct is undefined/missing, findIndex returns -1,
//               setting q.correct = -1. All answers would then always be wrong.
//               FIXED: guard with Number.isInteger(q.correct) check; skip shuffle if invalid.
//
// ✅ NEW-FIX I:  LeaderboardStorage — dynamic import('firebase/...') inside retry loop.
//               Some bundlers/environments fail silently on re-import after first failure.
//               FIXED: hoist imports outside the retry loop with one try/catch.
//
// ✅ NEW-FIX J:  WarningModal — TWO effects both keyed on [show,type]. If type changes
//               while show=true (one warning replaces another), countdown was NOT reset
//               because the reset-effect only runs when `show` changes, not `type`.
//               FIXED: merged countdown reset directly into the interval-start effect;
//               removed the separate reset effect entirely.
//
// ✅ NEW-FIX K:  SecurityManager.recordViolation — after violationCount >= maxViolations,
//               every further violation kept showing the 'final' modal again AND spawning
//               another setTimeout auto-submit call (all harmless due to hasSubmittedRef
//               guard, but caused repeated modal flicker and timer leak).
//               FIXED: early return after maxViolations already triggered.
//
// ✅ NEW-FIX L:  DevToolsDetector — veryLargeDiff computed twice per tick: once inside
//               _isOpen() and again inside start(). Window could theoretically resize
//               between the two reads; also the effectiveCount formula was wrong —
//               max(count, REQUIRED_TICKS=3) on first tick gives 3, but WARNING_SEC=5,
//               so "veryLargeDiff = immediate" comment was FALSE — still took 5 ticks.
//               FIXED: _isOpen() now returns {isOpen, isVeryLarge} object (read once);
//               effectiveCount for veryLarge uses max(count, WARNING_SEC) so first tick
//               with huge diff immediately shows warning, max(count, SUBMIT_SEC) for submit.
//
// ✅ NEW-FIX N:  handleAnswer stale closure — isDisqualified captured at creation time.
//               Gap between state change and useCallback recreation lets a click through.
//               FIXED: use isDisqualifiedRef.current inside handler; removed from deps.
//
// ✅ NEW-FIX P:  TestUtils.getTimerTheme() — defined but never called anywhere (dead code).
//               FIXED: removed the dead method.
//
// ✅ NEW-FIX Q:  handleTimerExpire — 4 separate setState calls inside a setInterval callback.
//               setInterval callbacks are NOT auto-batched in React 18 → 4 re-renders.
//               FIXED: consolidated into single showWarningMessage() call + handleSubmit.
//
// ✅ NEW-FIX S:  WarningModal — tabSwitches badge showed inside DevTools warning,
//               which is unrelated to tab switching. Confusing UX.
//               FIXED: only show tabSwitches badge when type is 'critical' or 'final'.
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Shield, BookOpen, EyeOff } from 'lucide-react';

// ==========================================
// GLOBAL CSS — sirf ek baar inject hota hai
// ==========================================
(function injectGlobalCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('mock-test-global-css')) return;
  const style = document.createElement('style');
  style.id = 'mock-test-global-css';
  style.textContent = `
    * { -webkit-touch-callout: none !important; }
    ::selection { background: transparent !important; color: inherit !important; }
    ::-moz-selection { background: transparent !important; color: inherit !important; }
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
  `;
  document.head.appendChild(style);
})();

// ==========================================
// LEADERBOARD STORAGE
// NEW-FIX I: dynamic imports hoisted outside retry loop
// ==========================================
class LeaderboardStorage {
  static async saveEntry(testResult) {
    const MAX_RETRIES = 2;

    // NEW-FIX I: import once before retry loop — avoids silent failures on re-import
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
// ==========================================
const APP_CONFIG = {
  ADMIN_EMAIL:              'luckyfaizu3@gmail.com',
  MAX_TAB_SWITCHES:         3,
  MAX_BLUR_COUNT:           5,
  WARNING_TIMEOUT:          3000,
  AUTO_SUBMIT_DELAY:        2000,
  CRITICAL_TIME_MINUTES:    5,
  INACTIVITY_PERCENT:       0.10,
  DEVTOOLS_WARNING_SEC:     5,   // consecutive ticks before warning
  DEVTOOLS_SUBMIT_SEC:      10,  // consecutive ticks before auto-submit
  DEVTOOLS_SIZE_THRESHOLD:  160, // px difference for moderate detection
};

const THEME = {
  timer: {
    safe:     { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    warning:  { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    critical: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  },
};

// ==========================================
// SHUFFLER
// ==========================================
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// NEW-FIX H: guard against malformed questions (missing/invalid 'correct' field)
function shuffleQuestions(questions) {
  const shuffled = shuffleArray(questions);
  return shuffled.map(q => {
    // NEW-FIX H: if correct index is not a valid integer, skip option shuffle to avoid -1 correct
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= (q.options?.length ?? 0)) {
      console.warn('[MockTest] Question has invalid/missing correct index — skipping shuffle for this question:', q);
      return q;
    }
    const indexedOpts   = q.options.map((text, i) => ({ text, origIdx: i }));
    const shuffledIdx   = shuffleArray(indexedOpts);
    const newCorrectIdx = shuffledIdx.findIndex(o => o.origIdx === q.correct);
    return { ...q, options: shuffledIdx.map(o => o.text), correct: newCorrectIdx };
  });
}

// ==========================================
// SCREEN RECORD BLOCKER (browser-level only)
// NOTE: OS-level screen recording (OBS, ShareX, macOS Screenshot) cannot be blocked from JS.
//       This only blocks browser's own getDisplayMedia API.
// ==========================================
class ScreenRecordBlocker {
  static _original = null;
  static enable() {
    if (navigator.mediaDevices?.getDisplayMedia) {
      this._original = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async () => {
        throw new DOMException('Screen recording is disabled during the exam.', 'NotAllowedError');
      };
    }
  }
  static disable() {
    if (this._original && navigator.mediaDevices) {
      navigator.mediaDevices.getDisplayMedia = this._original;
      this._original = null;
    }
  }
}

// ==========================================
// DESKTOP MODE ENFORCER
// ==========================================
class DesktopModeEnforcer {
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
// SYNTAX HIGHLIGHTER
// ==========================================
function SyntaxHighlight({ code }) {
  if (!code) return null;
  const tokenize = (line) => {
    const tokens = [];
    let remaining = line;
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
    while (remaining.length > 0) {
      let matched = false;
      for (const { type, regex } of patterns) {
        const m = remaining.match(regex);
        if (m) { tokens.push({ type, value: m[0] }); remaining = remaining.slice(m[0].length); matched = true; break; }
      }
      if (!matched) { tokens.push({ type: 'other', value: remaining[0] }); remaining = remaining.slice(1); }
    }
    return tokens;
  };
  const colorMap = {
    keyword: '#7c3aed', builtin: '#0e7490', string: '#15803d',
    number: '#b91c1c', comment: '#64748b', operator: '#b45309',
    function: '#1d4ed8', punctuation: '#1f2937', identifier: '#0f172a',
    space: 'inherit', other: '#0f172a',
  };
  return (
    <div style={{ background:'#f1f5f9', border:'3px solid #94a3b8', borderRadius:'16px', padding:'1.25rem 1.5rem', overflowX:'auto', marginTop:'1.5rem', width:'100%', boxSizing:'border-box' }}>
      <pre style={{ margin:0, fontFamily:"Consolas,Monaco,'Courier New',monospace", fontSize:'clamp(0.82rem,1.8vw,0.95rem)', lineHeight:1.75, fontWeight:'600', whiteSpace:'pre', overflowX:'auto' }}>
        {code.split('\n').map((line, li) => (
          <div key={li}>
            {tokenize(line).map((tok, ti) => (
              <span key={ti} style={{ color: colorMap[tok.type] || '#000' }}>{tok.value}</span>
            ))}
          </div>
        ))}
      </pre>
    </div>
  );
}

// ==========================================
// UTILS
// ==========================================
class TestUtils {
  static isAdmin(email) { return email === APP_CONFIG.ADMIN_EMAIL; }

  static formatTime(s) {
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return { display: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}` };
  }

  // NEW-FIX P: getTimerTheme() removed — was dead code, never called anywhere

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
class AudioManager {
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
class FullscreenManager {
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
// NEW-FIX A+B+C: DEVTOOLS DETECTOR — fully fixed
//
// A: Removed broken Image/getter trick (firebugOpen was ALWAYS false without console.log).
//    Now uses ONLY size-difference with two thresholds:
//    - veryLargeDiff (>300px) = immediate detection, no consecutive check needed
//    - moderateDiff (>160px)  = requires REQUIRED_TICKS consecutive checks
//
// B: After auto-submit fires, this.stop() is called immediately inside the detector
//    so the interval does not keep running if handleSubmit is slow/blocked.
//
// C: warningShown is reset when consecutiveCount drops BELOW WARNING threshold again,
//    so a user who briefly triggers then closes DevTools can be warned again next time.
// ==========================================
class DevToolsDetector {
  constructor(onWarning, onAutoSubmit) {
    this.onWarning        = onWarning;
    this.onAutoSubmit     = onAutoSubmit;
    this.interval         = null;
    this.detected         = false;
    this.warningShown     = false;
    this.consecutiveCount = 0;
    // REQUIRED_TICKS removed — effectiveCount now uses DEVTOOLS_WARNING/SUBMIT_SEC directly (NEW-FIX L)
  }

  // NEW-FIX L: returns {isOpen, isVeryLarge} so start() reads veryLargeDiff exactly once per tick
  _isOpen() {
    const veryLargeDiff =
      window.outerWidth  - window.innerWidth  > 300 ||
      window.outerHeight - window.innerHeight > 300;
    if (veryLargeDiff) return { isOpen: true, isVeryLarge: true };

    const moderateDiff =
      window.outerWidth  - window.innerWidth  > APP_CONFIG.DEVTOOLS_SIZE_THRESHOLD ||
      window.outerHeight - window.innerHeight > APP_CONFIG.DEVTOOLS_SIZE_THRESHOLD;

    return { isOpen: moderateDiff, isVeryLarge: false };
  }

  start() {
    this.interval = setInterval(() => {
      if (this.detected) return;

      const { isOpen, isVeryLarge } = this._isOpen(); // NEW-FIX L: read once per tick

      if (isOpen) {
        this.consecutiveCount++;

        // NEW-FIX L: veryLarge diff = immediately skip to WARNING/SUBMIT threshold
        //            Previous code: max(count, REQUIRED_TICKS=3) → still needed 5 ticks for warning
        //            Correct: max(count, WARNING_SEC) so first huge-diff tick shows warning instantly
        const effectiveCount = isVeryLarge
          ? Math.max(this.consecutiveCount, APP_CONFIG.DEVTOOLS_WARNING_SEC)
          : this.consecutiveCount;
        const submitCount = isVeryLarge
          ? Math.max(this.consecutiveCount, APP_CONFIG.DEVTOOLS_SUBMIT_SEC)
          : this.consecutiveCount;

        // Show WARNING
        if (effectiveCount >= APP_CONFIG.DEVTOOLS_WARNING_SEC && !this.warningShown) {
          this.warningShown = true;
          this.onWarning(
            `⚠️ DEVELOPER TOOLS DETECTED\n\nClose DevTools immediately!\n\nAuto-submit in ${APP_CONFIG.DEVTOOLS_SUBMIT_SEC - APP_CONFIG.DEVTOOLS_WARNING_SEC} seconds if not closed.`,
            'devtools-warning'
          );
        }

        // Auto-submit
        if (submitCount >= APP_CONFIG.DEVTOOLS_SUBMIT_SEC) {
          this.detected = true;
          // Re-verify using same tick's data (isVeryLarge already known, or re-check moderate)
          if (isOpen) {
            this.onWarning(
              `DISQUALIFIED — Developer Tools\n\nYou kept DevTools open. Test submitted as FAIL.`,
              'final',
              true
            );
            this.stop(); // NEW-FIX B: stop immediately
            setTimeout(() => this.onAutoSubmit(true, 'devtools-disqualified'), 500);
          } else {
            this._reset();
          }
        }

      } else {
        if (this.consecutiveCount > 0) {
          this.consecutiveCount = Math.max(0, this.consecutiveCount - 1);
        }
        // NEW-FIX C: reset warningShown when count drops below warning threshold
        if (this.consecutiveCount < APP_CONFIG.DEVTOOLS_WARNING_SEC) {
          this.warningShown = false;
        }
        if (this.consecutiveCount === 0) {
          this._reset();
        }
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
// SECURITY MANAGER — handleSubmit ref se lega
// NEW-FIX E: Ctrl+I isInput guard added
// ==========================================
class SecurityManager {
  constructor(onWarning, handleSubmitRef) {
    this.onWarning        = onWarning;
    this.handleSubmitRef  = handleSubmitRef;
    this.violationCount   = 0;
    this.maxViolations    = 5;
    this.handlers = {
      copy:        (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Copying is disabled during the test.'); },
      cut:         (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Cutting is disabled during the test.'); },
      paste:       (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Pasting is disabled during the test.'); },
      contextMenu: (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('Right-click is disabled during the test.'); },
      keydown: (e) => {
        const ctrl    = e.ctrlKey || e.metaKey;
        const key     = e.key.toLowerCase();
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
        const blocked =
          // Ctrl+A only blocked outside inputs
          (ctrl && key === 'a' && !isInput) ||
          // NEW-FIX E: Ctrl+I only blocked outside inputs (was blocked everywhere — broke italic)
          (ctrl && key === 'i' && !isInput) ||
          (ctrl && ['c','x','v','s','p','u'].includes(key)) ||
          e.key === 'F12' ||
          (ctrl && e.shiftKey && ['i','j','c','k'].includes(key)) ||
          (e.key === 'F5') ||
          (ctrl && key === 'r') ||
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && ['3','4','s'].includes(key));
        if (blocked) {
          e.preventDefault();
          e.stopPropagation();
          this.recordViolation('Keyboard shortcut blocked during the test.');
        }
      },
      dragstart:   (e) => { e.preventDefault(); e.stopPropagation(); },
      drop:        (e) => { e.preventDefault(); e.stopPropagation(); },
      selectstart: (e) => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); },
      beforeprint: (e) => { e.preventDefault(); this.recordViolation('Printing is disabled during the test.'); },
      touchstart:  (e) => {
        // >= 2 touches = pinch gesture
        if (e.touches.length >= 2) { e.preventDefault(); this.recordViolation('Multi-touch gesture blocked.'); }
      },
    };
  }

  recordViolation(message) {
    // NEW-FIX K: if already at max violations, ignore further violations to prevent
    //            repeated 'final' modal flicker and leaked setTimeout timers
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
  }

  disable() {
    Object.entries(this.handlers).forEach(([event, handler]) => {
      document.removeEventListener(event, handler, true);
    });
    document.body.style.userSelect       = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.msUserSelect     = '';
    ScreenRecordBlocker.disable();
  }
}

// ==========================================
// CLEANUP MANAGER
// ==========================================
class CleanupManager {
  static performFullCleanup() {
    FullscreenManager.exit();
    DesktopModeEnforcer.disable();
    ScreenRecordBlocker.disable();
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

// React.memo — prevents 40 divs re-creating on every parent render
const Watermark = React.memo(function Watermark({ userEmail, userName }) {
  const text = `${userName || 'Student'} • ${userEmail || ''} • EXAM`;
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:99998, overflow:'hidden', userSelect:'none', WebkitUserSelect:'none' }}>
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => (
          <div key={`${row}-${col}`} style={{ position:'absolute', left:`${col*22-5}%`, top:`${row*14-2}%`, transform:'rotate(-25deg)', fontSize:'13px', fontWeight:'700', color:'rgba(99,102,241,0.13)', whiteSpace:'nowrap', letterSpacing:'0.05em', fontFamily:'monospace' }}>
            {text}
          </div>
        ))
      )}
    </div>
  );
});

// ==========================================
// WARNING MODAL
// NEW-FIX D: initialCountdown prop added — eliminates "20s flicker" on first render
// ==========================================
function WarningModal({ show, message, type, tabSwitches, onAcknowledge, initialCountdown }) {
  const [countdown, setCountdown] = useState(() => initialCountdown ?? 20);
  const timerRef         = useRef(null);
  const onAcknowledgeRef = useRef(onAcknowledge);
  useEffect(() => { onAcknowledgeRef.current = onAcknowledge; }, [onAcknowledge]);

  // NEW-FIX J: single effect handles both countdown reset AND interval start/stop.
  //            Previous code had two effects on [show] and [show,type] — if type changed
  //            while show=true, the reset-effect (keyed on show) did NOT re-run, so
  //            countdown continued from wrong value and progress bar % was wrong.
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!show) return;

    window.history.pushState(null, '', window.location.href);
    const blockBack = (e) => { e.preventDefault(); window.history.pushState(null, '', window.location.href); };
    window.addEventListener('popstate', blockBack);

    const isFinal    = type === 'final';
    const isCritical = type === 'critical';
    const isDevtools = type === 'devtools-warning';
    const needsTimer = isFinal || isCritical || isDevtools;

    // Reset countdown first (handles both new show=true AND type change while show=true)
    const startVal = initialCountdown ?? 20;
    setCountdown(startVal);

    if (needsTimer) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onAcknowledgeRef.current();
            return 0;
          }
          return prev - 1;
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
  const totalSecs  = initialCountdown ?? 20;

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
        {isDevtools && (
          <div style={{ fontSize:'clamp(1rem,4vw,1.4rem)', fontWeight:'900', color:'#a78bfa', marginBottom:'0.75rem', animation:'devtoolsPulse 1s infinite' }}>
            🔍 DEVELOPER TOOLS DETECTED
          </div>
        )}
        <div style={{ fontSize:'clamp(0.82rem,3.5vw,1rem)', fontWeight:'600', color:s.color, lineHeight:1.7, whiteSpace:'pre-line', marginBottom:'1rem', textAlign:'left', wordBreak:'break-word' }}>{message}</div>
        {/* NEW-FIX S: tabSwitches badge only for critical/final warnings — not DevTools */}
        {tabSwitches > 0 && (type === 'critical' || type === 'final') && (
          <div style={{ fontSize:'0.85rem', fontWeight:'900', color:s.iconColor, padding:'0.5rem 1rem', background:'rgba(0,0,0,0.3)', borderRadius:'8px', marginBottom:'1rem', border:`2px solid ${s.iconColor}40`, display:'inline-block' }}>
            Tab Switches: {tabSwitches} / {APP_CONFIG.MAX_TAB_SWITCHES}
          </div>
        )}
        {needsOk && (
          <div style={{ marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.6)', marginBottom:'0.4rem', fontWeight:'600' }}>
              {isDevtools
                ? <>Auto-submit in <span style={{ color:s.iconColor, fontWeight:'900' }}>{countdown}s</span> if DevTools not closed</>
                : <>Auto-continuing in <span style={{ color:s.iconColor, fontWeight:'900' }}>{countdown}s</span></>
              }
            </div>
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'999px', height:'6px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(countdown / totalSecs) * 100}%`, background: isDevtools ? '#7c3aed' : isFinal ? '#ef4444' : '#f59e0b', borderRadius:'999px', transition:'width 1s linear' }} />
            </div>
          </div>
        )}
        {needsOk && (
          <button onClick={onAcknowledge} style={{ width:'100%', padding:'0.875rem 1rem', background: isDevtools ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : isFinal ? 'linear-gradient(135deg,#dc2626,#7f1d1d)' : 'linear-gradient(135deg,#f59e0b,#b45309)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'clamp(0.8rem,3.5vw,0.95rem)', fontWeight:'900', cursor:'pointer', letterSpacing:'0.03em', wordBreak:'break-word', whiteSpace:'normal', lineHeight:1.4 }}>
            {isFinal    ? 'I understand — I accept this disqualification'
            : isDevtools ? 'I am closing DevTools now'
            :              'I understand — I will NOT violate rules again'}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// FIX 1: ISOLATED TIMER — onExpire/onTick via refs — NEVER stale
// ==========================================
const IsolatedTimer = React.memo(function IsolatedTimer({ timeLimit, onExpire, onTick, isAdmin }) {
  const onExpireRef = useRef(onExpire);
  const onTickRef   = useRef(onTick);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
  useEffect(() => { onTickRef.current   = onTick;   }, [onTick]);

  const [display, setDisplay] = useState(TestUtils.formatTime(timeLimit * 60).display);
  const [pct, setPct]         = useState(100);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  const timeLeftRef  = useRef(timeLimit * 60);
  const firedRef     = useRef(false);
  const intervalRef  = useRef(null);
  const totalSecsRef = useRef(timeLimit * 60);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    intervalRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      const remaining = timeLeftRef.current;
      setDisplay(TestUtils.formatTime(remaining).display);
      setPct((remaining / totalSecsRef.current) * 100);
      if (onTickRef.current) onTickRef.current(remaining);
      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(intervalRef.current);
        if (onExpireRef.current) onExpireRef.current();
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const theme      = pct > 50 ? THEME.timer.safe : pct > 20 ? THEME.timer.warning : THEME.timer.critical;
  const isCritical = timeLeftRef.current < APP_CONFIG.CRITICAL_TIME_MINUTES * 60;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:isMobile?'0.5rem 1rem':'0.65rem 1.25rem', background:theme.bg, borderRadius:'12px', border:`3px solid ${theme.border}` }}>
      <Clock size={isMobile?18:22} color={theme.text} strokeWidth={2.5}
        style={{ animation: isCritical ? 'shake 0.6s infinite' : 'none' }} />
      <div style={{ fontSize:isMobile?'1.1rem':'1.4rem', fontWeight:'900', color:theme.text, fontFamily:'monospace',
        animation: isCritical ? 'tickBlink 1s infinite' : 'none' }}>
        {display}
      </div>
    </div>
  );
});

// ==========================================
// INSTRUCTION SCREEN
// ==========================================
function InstructionScreen({ onAccept, testTitle, timeLimit, totalQuestions, passPercent }) {
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

  const instructions = [
    { text: `Test duration is ${timeLimit} minutes. Timer starts immediately.` },
    { text: `Do NOT switch tabs — ${APP_CONFIG.MAX_TAB_SWITCHES} switches = auto-submit with FAIL.` },
    { text: 'Copy, paste, right-click, printing, saving and Ctrl+U are completely blocked.' },
    { text: 'Browser screen recording (getDisplayMedia) is blocked automatically.' },
    { text: 'Test runs in fullscreen — exiting triggers a warning and auto-returns.' },
    { text: 'Your name and email are watermarked on every screen permanently.' },
    { text: `Inactivity for ${inactivityMin} minute${inactivityMin > 1 ? 's' : ''} will trigger a warning.` },
    { text: `Opening Developer Tools (F12 / DevTools) will trigger a ${APP_CONFIG.DEVTOOLS_SUBMIT_SEC}s auto-submit countdown.`, danger: true },
    { text: 'Questions and answer options are shuffled — every student gets a different order.', highlight: true },
    { text: 'All questions must be answered before submitting.' },
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
            {[{ label:'Duration', value:`${timeLimit} Min` }, { label:'Questions', value:`${totalQuestions} Qs` }, { label:'Pass Mark', value:`${passPercent}%` }].map((s, i) => (
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
// NEW-FIX F: isDisqualified removed from blur & mouseleave deps; use ref instead
// ==========================================
function TestInterface({ questions, onComplete, testTitle, timeLimit, userEmail, studentInfo, passPercent }) {
  const [currentQuestion, setCurrentQuestion]   = useState(0);
  const [answers, setAnswers]                   = useState({});
  const answersRef                              = useRef({});
  const [tabSwitches, setTabSwitches]           = useState(0);
  const [blurCount, setBlurCount]               = useState(0);
  const [showWarning, setShowWarning]           = useState(false);
  const [warningMsg, setWarningMsg]             = useState('');
  const [warningType, setWarningType]           = useState('normal');
  // NEW-FIX D: track initialCountdown for WarningModal so no flicker on first render
  const [warningInitialCountdown, setWarningInitialCountdown] = useState(20);
  const [isDisqualified, setIsDisqualified]     = useState(false);
  const [isContentBlurred, setIsContentBlurred] = useState(false);
  const [isMobile, setIsMobile]                 = useState(() => window.innerWidth <= 768);

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

  const isAdmin       = TestUtils.isAdmin(userEmail);
  const answeredCount = Object.keys(answers).length;
  const allAnswered   = answeredCount === questions.length;
  const studentName   = studentInfo?.fullName || 'Student';
  const inactivityLimitMs = Math.max(60000, timeLimit * 60 * 1000 * APP_CONFIG.INACTIVITY_PERCENT);

  const isDisqualifiedRef = useRef(false);
  const setIsDisqualifiedSynced = useCallback((val) => {
    isDisqualifiedRef.current = val;
    setIsDisqualified(val);
  }, []);

  const resetActivity = useCallback(() => { lastActivityRef.current = Date.now(); }, []);

  // NEW-FIX D: showWarningMessage computes correct initialCountdown for each warning type
  const showWarningMessage = useCallback((message, type = 'normal', mustAck = false) => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
    const needsOk = mustAck || type === 'critical' || type === 'final' || type === 'devtools-warning';

    // Compute correct initial countdown so WarningModal renders correct value immediately
    let initCountdown = 20;
    if (type === 'devtools-warning') initCountdown = APP_CONFIG.DEVTOOLS_SUBMIT_SEC;
    else if (type === 'final' || type === 'critical') initCountdown = 20;

    setWarningInitialCountdown(initCountdown);
    setWarningMsg(message);
    setWarningType(type);
    setShowWarning(true);
    if (!needsOk) warningTimerRef.current = setTimeout(() => setShowWarning(false), APP_CONFIG.WARNING_TIMEOUT);
  }, []);

  const handleAcknowledge = useCallback(() => setShowWarning(false), []);

  const handleTimerTick = useCallback((remaining) => {
    try { audioRef.current.playTick(remaining % 2 === 0); } catch (e) {}
  }, []);

  // NEW-FIX Q: consolidated 4 separate setState calls into showWarningMessage() + handleSubmit.
  //            setInterval callbacks are NOT auto-batched in React 18 — 4 separate setState
  //            calls caused 4 separate re-renders. showWarningMessage already batches its sets.
  const handleTimerExpire = useCallback(() => {
    try { audioRef.current.playAlarm(); } catch (e) {}
    showWarningMessage('TIME IS UP!\n\nYour test is being submitted automatically.', 'final', true);
    if (handleSubmitRef.current) handleSubmitRef.current(false, 'time-up');
  }, [showWarningMessage]);

  // NEW-FIX N: use isDisqualifiedRef.current — removes stale closure gap between
  //            state change and useCallback recreation where a click could sneak through
  const handleAnswer = useCallback((qIndex, optIdx) => {
    if (isDisqualifiedRef.current) return;
    resetActivity();
    answersRef.current = { ...answersRef.current, [qIndex]: optIdx };
    setAnswers(prev => ({ ...prev, [qIndex]: optIdx }));
  // isDisqualified removed from deps — ref is always current
  }, [resetActivity]);

  const handleSubmit = useCallback((penalized = false, reason = '') => {
    if (hasSubmittedRef.current) return;
    FullscreenManager.exit();
    const currentAnswers       = answersRef.current;
    const currentAnsweredCount = Object.keys(currentAnswers).length;
    if (!isAdmin && currentAnsweredCount < questions.length && !penalized) {
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

  const handleNavigation = useCallback((dir) => {
    if (isDisqualified) return;
    resetActivity();
    if (dir === 'next' && currentQuestion < questions.length - 1) setCurrentQuestion(p => p + 1);
    else if (dir === 'prev' && currentQuestion > 0) setCurrentQuestion(p => p - 1);
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
      devToolsRef.current = new DevToolsDetector(
        showWarningMessage,
        (penalized, reason) => {
          if (handleSubmitRef.current) handleSubmitRef.current(penalized, reason);
        }
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

  // Inactivity detection
  useEffect(() => {
    if (isAdmin) return;
    const events = ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','click'];
    events.forEach(e => document.addEventListener(e, resetActivity, { passive:true }));
    inactivityRef.current = setInterval(() => {
      if (hasSubmittedRef.current || isDisqualifiedRef.current) return;
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= inactivityLimitMs) {
        const m = Math.floor(idle / 60000), s = Math.floor((idle % 60000) / 1000);
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
      if (!FullscreenManager.isActive() && !hasSubmittedRef.current && !isDisqualifiedRef.current) {
        showWarningMessage('You exited fullscreen mode. Returning you to fullscreen...', 'normal');
        setTimeout(() => FullscreenManager.enter(), 1500);
      }
    };
    return FullscreenManager.onChange(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage]);

  // Tab switch
  useEffect(() => {
    if (isAdmin) return;
    const handler = () => {
      if (!document.hidden || hasSubmittedRef.current || isDisqualifiedRef.current) return;
      const n = tabSwitchRef.current + 1;
      tabSwitchRef.current = n; setTabSwitches(n);
      if (n === 1) {
        showWarningMessage(`WARNING — Tab Switch Detected (1 of ${APP_CONFIG.MAX_TAB_SWITCHES})\n\nReturn immediately and stay focused.`, 'critical', true);
      } else if (n === 2) {
        showWarningMessage(`SECOND WARNING — Tab Switch (2 of ${APP_CONFIG.MAX_TAB_SWITCHES}) — LAST CHANCE\n\nOne more = immediate FAIL + no certificate.`, 'critical', true);
      } else if (n >= APP_CONFIG.MAX_TAB_SWITCHES) {
        setIsDisqualifiedSynced(true);
        showWarningMessage(`YOU HAVE BEEN DISQUALIFIED\n\nSubmitted as FAIL.\nNo certificate. No refund. No appeal.`, 'final', true);
        setTimeout(() => {
          if (handleSubmitRef.current) handleSubmitRef.current(true, 'tab-switching-disqualified');
        }, APP_CONFIG.AUTO_SUBMIT_DELAY);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage, setIsDisqualifiedSynced]);

  // Window blur
  // NEW-FIX F: isDisqualified removed from deps — use isDisqualifiedRef.current inside handler
  //            Prevents brief listener detach/re-attach when disqualification happens
  useEffect(() => {
    if (isAdmin) return;
    const handleBlur = () => {
      if (hasSubmittedRef.current || isDisqualifiedRef.current) return;
      setIsContentBlurred(true);
      const n = blurCountRef.current + 1; blurCountRef.current = n; setBlurCount(n);
      if (n >= APP_CONFIG.MAX_BLUR_COUNT) {
        showWarningMessage(`REPEATED FOCUS LOSS — ${n} times\n\nStay focused on the exam.`, 'critical', true);
      } else {
        showWarningMessage(`You left the exam window! Return immediately. (${n} time${n>1?'s':''})`, 'violation');
      }
    };
    const handleFocus = () => { setIsContentBlurred(false); resetActivity(); };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => { window.removeEventListener('blur', handleBlur); window.removeEventListener('focus', handleFocus); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showWarningMessage, resetActivity]);

  // Mouse leave
  // NEW-FIX F: isDisqualified removed from deps — use isDisqualifiedRef.current inside handler
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

      {/* Header */}
      <div style={{ position:'sticky', top:0, background:'#fff', borderBottom:'3px solid #e2e8f0', padding:isMobile?'0.75rem 1rem':'0.875rem 1.5rem', zIndex:1000, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', opacity:isDisqualified?0.5:1 }}>
        <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
          {!isAdmin && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem', padding:'0.35rem 0.75rem', background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))', border:'1.5px solid rgba(99,102,241,0.18)', borderRadius:'8px', width:'fit-content' }}>
              <span style={{ fontSize:'12px' }}>👤</span>
              <span style={{ fontSize:'0.78rem', fontWeight:'800', color:'#6366f1' }}>{studentName}</span>
              <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:'500' }}>• {studentInfo?.email}</span>
              {studentInfo?.address && <span style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:'500' }}>• {studentInfo.address}</span>}
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:'200px' }}>
              <h1 style={{ fontSize:isMobile?'1.1rem':'1.4rem', fontWeight:'800', color:'#1e293b', margin:'0 0 0.25rem' }}>{testTitle}</h1>
              <div style={{ fontSize:isMobile?'0.75rem':'0.9rem', color:'#64748b', fontWeight:'600', display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
                <span>Q {currentQuestion + 1}/{questions.length}</span>
                <span style={{ background:allAnswered?'#dcfce7':'#fef3c7', color:allAnswered?'#065f46':'#92400e', padding:'0.15rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'800' }}>
                  {allAnswered ? 'All Answered' : `${answeredCount}/${questions.length}`}
                </span>
                {tabSwitches > 0 && !isAdmin && <span style={{ background:'#fee2e2', color:'#dc2626', padding:'0.15rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'800' }}>Tab: {tabSwitches}/{APP_CONFIG.MAX_TAB_SWITCHES}</span>}
                {blurCount > 0 && !isAdmin && <span style={{ background:'#fef3c7', color:'#92400e', padding:'0.15rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'800' }}>Focus lost: {blurCount}</span>}
                {isDisqualified && <span style={{ background:'#dc2626', color:'#fff', padding:'0.15rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'800' }}>DISQUALIFIED</span>}
              </div>
            </div>
            <IsolatedTimer
              timeLimit={timeLimit}
              isAdmin={isAdmin}
              onTick={handleTimerTick}
              onExpire={handleTimerExpire}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:isMobile?'1.5rem 1rem':'2rem 1.5rem', maxWidth:'1400px', margin:'0 auto', paddingBottom:'6rem', opacity:isDisqualified?0.15:1, pointerEvents:isDisqualified?'none':'auto', filter:isDisqualified?'blur(6px)':'none', transition:'all 0.4s' }}>

        <div key={currentQuestion} style={{ background:'#fff', padding:isMobile?'1.5rem':'2.5rem', borderRadius:'20px', marginBottom:'2rem', border:'3px solid #e2e8f0', boxShadow:'0 8px 24px rgba(0,0,0,0.08)', animation:'slideIn 0.4s ease' }}>
          <div style={{ fontSize:isMobile?'1.2rem':'1.6rem', fontWeight:'700', color:'#1e293b', lineHeight:1.6 }}>{currentQ.question}</div>
          {currentQ.code && <SyntaxHighlight code={currentQ.code} />}
        </div>

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

        <div style={{ display:'flex', justifyContent:'space-between', gap:'1rem', marginBottom:'2.5rem' }}>
          <button onClick={() => handleNavigation('prev')} disabled={currentQuestion === 0 || isDisqualified}
            style={{ padding:isMobile?'1rem 1.5rem':'1.25rem 2rem', background:(currentQuestion===0||isDisqualified)?'#f1f5f9':'#fff', border:`3px solid ${(currentQuestion===0||isDisqualified)?'#e2e8f0':'#cbd5e1'}`, borderRadius:'12px', cursor:(currentQuestion===0||isDisqualified)?'not-allowed':'pointer', fontWeight:'700', color:(currentQuestion===0||isDisqualified)?'#94a3b8':'#1e293b', fontSize:isMobile?'0.95rem':'1.1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <ChevronLeft size={isMobile?18:22} />{!isMobile && 'Previous'}
          </button>
          {currentQuestion === questions.length - 1 ? (
            <button onClick={() => handleSubmit(false, '')} disabled={(!allAnswered && !isAdmin) || isDisqualified}
              style={{ padding:isMobile?'1rem 2rem':'1.25rem 3rem', background:((allAnswered||isAdmin)&&!isDisqualified)?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0', border:`3px solid ${((allAnswered||isAdmin)&&!isDisqualified)?'#059669':'#e2e8f0'}`, borderRadius:'12px', cursor:((allAnswered||isAdmin)&&!isDisqualified)?'pointer':'not-allowed', fontWeight:'800', color:((allAnswered||isAdmin)&&!isDisqualified)?'#fff':'#94a3b8', fontSize:isMobile?'1rem':'1.2rem', boxShadow:((allAnswered||isAdmin)&&!isDisqualified)?'0 8px 24px rgba(16,185,129,0.4)':'none', textTransform:'uppercase' }}>
              {((allAnswered || isAdmin) && !isDisqualified) ? 'Submit Test' : 'Answer All First'}
            </button>
          ) : (
            <button onClick={() => handleNavigation('next')} disabled={isDisqualified}
              style={{ padding:isMobile?'1rem 1.5rem':'1.25rem 2rem', background:isDisqualified?'#f1f5f9':'#fff', border:`3px solid ${isDisqualified?'#e2e8f0':'#cbd5e1'}`, borderRadius:'12px', cursor:isDisqualified?'not-allowed':'pointer', fontWeight:'700', color:isDisqualified?'#94a3b8':'#1e293b', fontSize:isMobile?'0.95rem':'1.1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              {!isMobile && 'Next'}<ChevronRight size={isMobile?18:22} />
            </button>
          )}
        </div>

        <div style={{ background:'#fff', padding:isMobile?'1.25rem':'1.75rem', borderRadius:'20px', border:'3px solid #e2e8f0', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:isMobile?'0.9rem':'1.05rem', fontWeight:'800', color:'#64748b', marginBottom:'1.25rem', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Progress: {answeredCount}/{questions.length} Answered
          </div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(auto-fill,minmax(44px,1fr))':'repeat(auto-fill,minmax(56px,1fr))', gap:isMobile?'0.6rem':'0.85rem' }}>
            {questions.map((_, idx) => {
              const isAnswered = answers[idx] !== undefined;
              const isCurr     = idx === currentQuestion;
              return (
                <button key={idx} onClick={() => { if (!isDisqualified) { resetActivity(); setCurrentQuestion(idx); } }} disabled={isDisqualified}
                  style={{ height:isMobile?'44px':'56px', borderRadius:'10px', border:isCurr?'3px solid #3b82f6':'none', background:isAnswered?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0', color:isAnswered?'#fff':'#1e293b', fontWeight:'800', cursor:isDisqualified?'not-allowed':'pointer', fontSize:isMobile?'0.95rem':'1.15rem', boxShadow:isAnswered?'0 4px 12px rgba(16,185,129,0.3)':'none', transform:isCurr?'scale(1.05)':'scale(1)', opacity:isDisqualified?0.5:1, transition:'all 0.2s' }}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN EXPORT
// NEW-FIX G: FullscreenManager.enter() called on onAccept (re-enter if user dismissed it)
// ==========================================
export default function MockTestInterface({
  questions,
  testTitle,
  timeLimit,
  userEmail,
  testLevel,
  onExit,
  onComplete,
  studentInfo,
  passPercent,
}) {
  const [shuffledQuestions] = useState(() => shuffleQuestions(questions));
  const [stage, setStage]   = useState('instructions');
  const hasCompletedRef     = useRef(false);

  useEffect(() => {
    if (userEmail !== APP_CONFIG.ADMIN_EMAIL) FullscreenManager.enter();
    window.onbeforeunload = null;
    return () => CleanupManager.performFullCleanup();
  }, [userEmail]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      const ok = window.confirm('Are you sure you want to exit the test?\n\n• Your progress will be lost\n• Payment is non-refundable');
      if (ok) { CleanupManager.performFullCleanup(); if (onExit) onExit(); }
      else window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [onExit]);

  const onCompleteRef   = useRef(onComplete);
  const studentInfoRef  = useRef(studentInfo);
  const testTitleRef    = useRef(testTitle);
  const testLevelRef    = useRef(testLevel);
  const userEmailRef    = useRef(userEmail);
  useEffect(() => { onCompleteRef.current  = onComplete;  }, [onComplete]);
  useEffect(() => { studentInfoRef.current = studentInfo; }, [studentInfo]);
  useEffect(() => { testTitleRef.current   = testTitle;   }, [testTitle]);
  useEffect(() => { testLevelRef.current   = testLevel;   }, [testLevel]);
  useEffect(() => { userEmailRef.current   = userEmail;   }, [userEmail]);

  // NEW-FIX G: Re-enter fullscreen when user clicks "Start Test"
  //            Fullscreen may have been dismissed between mount and test start
  const handleAccept = useCallback(() => {
    if (userEmail !== APP_CONFIG.ADMIN_EMAIL) {
      FullscreenManager.enter(); // re-enter; no-op if already active
    }
    setStage('test');
  }, [userEmail]);

  const handleTestComplete = useCallback((testResults) => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    CleanupManager.performFullCleanup();
    const data = {
      ...testResults,
      studentInfo: studentInfoRef.current,
      userName:    studentInfoRef.current?.fullName,
      testTitle:   testTitleRef.current,
      testLevel:   testLevelRef.current,
      userEmail:   userEmailRef.current,
      completedAt: Date.now(),
      timestamp:   new Date().toISOString(),
    };
    LeaderboardStorage.saveEntry(data).then(result => {
      if (!result?.success) {
        console.warn('[MockTest] Could not save to leaderboard:', result?.error);
      }
    });
    if (onCompleteRef.current) onCompleteRef.current(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {stage === 'instructions' && (
        <InstructionScreen
          testTitle={testTitle}
          timeLimit={timeLimit}
          totalQuestions={shuffledQuestions.length}
          passPercent={passPercent || 55}
          onAccept={handleAccept}
        />
      )}
      {stage === 'test' && (
        <TestInterface
          questions={shuffledQuestions}
          testTitle={testTitle}
          timeLimit={timeLimit}
          userEmail={userEmail}
          studentInfo={studentInfo}
          passPercent={passPercent || 55}
          onComplete={handleTestComplete}
        />
      )}
    </>
  );
}