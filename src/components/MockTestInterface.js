import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Shield, BookOpen, EyeOff } from 'lucide-react';
import UserDetailsForm from './UserDetailsForm';

// ==========================================
// 💾 LEADERBOARD STORAGE MANAGER
// ==========================================
class LeaderboardStorage {
  static async saveEntry(testResult) {
    try {
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
      console.log('✅ Leaderboard entry saved:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error saving to leaderboard:', error);
      return { success: false, error: error.message };
    }
  }
  static getAllEntries() { return []; }
}

// ==========================================
// 🎯 CONFIGURATION
// ==========================================
const APP_CONFIG = {
  ADMIN_EMAIL: 'luckyfaizu3@gmail.com',
  MAX_TAB_SWITCHES: 3,
  MAX_BLUR_COUNT: 5,
  PASS_PERCENTAGE: 55,
  WARNING_TIMEOUT: 3000,
  AUTO_SUBMIT_DELAY: 2000,
  CRITICAL_TIME_MINUTES: 5,
};

const THEME = {
  timer: {
    safe:     { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    warning:  { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    critical: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  }
};

// ==========================================
// 🎨 SYNTAX HIGHLIGHTER
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
    keyword:     '#7c3aed',  // deep violet
    builtin:     '#0e7490',  // deep cyan
    string:      '#15803d',  // deep green
    number:      '#b91c1c',  // deep red
    comment:     '#64748b',  // slate
    operator:    '#b45309',  // deep amber
    function:    '#1d4ed8',  // deep blue
    punctuation: '#1f2937',  // near black
    identifier:  '#0f172a',  // black
    space:       'inherit',
    other:       '#0f172a',
  };

  const lines = code.split('\n');

  return (
    <div style={{ background:'#f1f5f9', border:'3px solid #94a3b8', borderRadius:'16px', padding:'1.25rem 1.5rem', overflowX:'auto', marginTop:'1.5rem', width:'100%', boxSizing:'border-box' }}>
      <pre style={{ margin:0, fontFamily:"Consolas,Monaco,'Courier New',monospace", fontSize:'clamp(0.82rem, 1.8vw, 0.95rem)', lineHeight:1.75, fontWeight:'600', whiteSpace:'pre', overflowX:'auto' }}>
        {lines.map((line, lineIdx) => {
          const tokens = tokenize(line);
          return (
            <div key={lineIdx}>
              {tokens.map((tok, tIdx) => (
                <span key={tIdx} style={{ color: colorMap[tok.type] || '#000' }}>{tok.value}</span>
              ))}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

// ==========================================
// 🛠️ UTILS
// ==========================================
class TestUtils {
  static isAdmin(email) { return email === APP_CONFIG.ADMIN_EMAIL; }
  static formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return { display: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` };
  }
  static getTimerTheme(timeLeft, totalTime) {
    const p = (timeLeft / totalTime) * 100;
    if (p > 50) return THEME.timer.safe;
    if (p > 20) return THEME.timer.warning;
    return THEME.timer.critical;
  }
  static calculateScore(answers, questions, tabSwitches, isAdmin) {
    let correct = 0;
    const correctQuestions = [], wrongQuestions = [];
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && answers[idx] === q.correct) { correct++; correctQuestions.push(idx+1); }
      else wrongQuestions.push(idx+1);
    });
    let percentage = Math.round((correct / questions.length) * 100);
    const penalized = !isAdmin && tabSwitches >= APP_CONFIG.MAX_TAB_SWITCHES;
    if (penalized) percentage = Math.max(0, percentage - 20);
    return { correct, wrong: questions.length - correct, total: questions.length, percentage, passed: isAdmin ? true : percentage >= APP_CONFIG.PASS_PERCENTAGE, correctQuestions, wrongQuestions, penalized };
  }
}

// ==========================================
// 🔊 AUDIO MANAGER
// ==========================================
class AudioManager {
  constructor() { this.context = null; }
  init() { if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)(); }
  playTick(isEven) {
    if (!this.context) return;
    const osc = this.context.createOscillator(); const gain = this.context.createGain();
    osc.connect(gain); gain.connect(this.context.destination);
    osc.frequency.value = isEven ? 1000 : 800; osc.type = 'sine';
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.08, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now); osc.stop(now + 0.08);
  }
  playAlarm() {
    if (!this.context) return;
    const osc = this.context.createOscillator(); const gain = this.context.createGain();
    osc.connect(gain); gain.connect(this.context.destination);
    osc.frequency.value = 880; osc.type = 'square';
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.2, now); osc.start(now); osc.stop(now + 1);
  }
  destroy() { if (this.context) { this.context.close(); this.context = null; } }
}

// ==========================================
// 🖥️ FULLSCREEN MANAGER
// ==========================================
class FullscreenManager {
  static async enter() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
      if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(() => {});
      try { if (window.screen?.orientation?.lock) window.screen.orientation.lock('portrait').catch(() => {}); } catch(e) {}
      return true;
    } catch (err) { return false; }
  }
  static async exit() {
    try {
      if (!FullscreenManager.isActive()) return;
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
      else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
    } catch (err) {}
  }
  static isActive() { return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || document.mozFullScreenElement); }
  static onChange(callback) {
    const events = ['fullscreenchange','webkitfullscreenchange','msfullscreenchange','mozfullscreenchange'];
    events.forEach(e => document.addEventListener(e, callback));
    return () => events.forEach(e => document.removeEventListener(e, callback));
  }
}

// ==========================================
// 🔒 SECURITY MANAGER
// ==========================================
class SecurityManager {
  constructor(onWarning, onAutoSubmit) {
    this.onWarning = onWarning; this.onAutoSubmit = onAutoSubmit;
    this.violationCount = 0; this.maxViolations = 5;
    this.handlers = {
      copy:        (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('🚫 Copying is strictly disabled!'); },
      cut:         (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('🚫 Cutting is disabled!'); },
      paste:       (e) => { e.preventDefault(); e.stopPropagation(); },
      contextMenu: (e) => { e.preventDefault(); e.stopPropagation(); this.recordViolation('🚫 Right-click is disabled during test!'); },
      keydown: (e) => {
        const isCopyPaste = (e.ctrlKey||e.metaKey) && ['c','v','x','a','s'].includes(e.key.toLowerCase());
        const isDevTools  = e.key==='F12' || ((e.ctrlKey||e.metaKey)&&e.shiftKey&&['i','j','c'].includes(e.key.toLowerCase())) || ((e.ctrlKey||e.metaKey)&&['u','i'].includes(e.key.toLowerCase()));
        const isRefresh   = e.key==='F5' || ((e.ctrlKey||e.metaKey)&&e.key==='r');
        const isPrint     = (e.ctrlKey||e.metaKey)&&e.key==='p';
        const isScreenshot= (e.metaKey&&e.shiftKey&&['3','4','s'].includes(e.key.toLowerCase()));
        if (isCopyPaste||isDevTools||isRefresh||isPrint||isScreenshot) { e.preventDefault(); e.stopPropagation(); this.recordViolation('🚫 Keyboard shortcut blocked!'); }
      },
      dragstart:   (e) => { e.preventDefault(); e.stopPropagation(); },
      drop:        (e) => { e.preventDefault(); e.stopPropagation(); },
      selectstart: (e) => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); },
      beforeprint: (e) => { e.preventDefault(); this.recordViolation('🚫 Printing is disabled!'); },
      touchstart:  (e) => { if (e.touches.length > 2) { e.preventDefault(); this.recordViolation('🚫 Multi-touch gesture blocked!'); } },
    };
  }
  recordViolation(message) {
    this.violationCount++;
    this.onWarning(message, 'violation');
    if (this.violationCount >= this.maxViolations) {
      this.onWarning('🚨 Too many violations detected! Auto-submitting now...', 'final', true);
      setTimeout(() => { if (this.onAutoSubmit) this.onAutoSubmit(true); }, 2000);
    }
  }
  enable() {
    Object.entries(this.handlers).forEach(([event, handler]) => { document.addEventListener(event, handler, { capture: true, passive: false }); });
    document.body.style.userSelect = 'none'; document.body.style.webkitUserSelect = 'none'; document.body.style.msUserSelect = 'none';
    this.startDevToolsDetection(); this.startScreenRecordDetection();
  }
  disable() {
    Object.entries(this.handlers).forEach(([event, handler]) => document.removeEventListener(event, handler, true));
    document.body.style.userSelect = ''; document.body.style.webkitUserSelect = ''; document.body.style.msUserSelect = '';
    this.stopDevToolsDetection(); this.stopScreenRecordDetection();
  }
  startDevToolsDetection() {
    this.devToolsInterval = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) this.recordViolation('⚠️ Developer tools detected! Close them immediately.');
    }, 1000);
  }
  stopDevToolsDetection() { if (this.devToolsInterval) { clearInterval(this.devToolsInterval); this.devToolsInterval = null; } }
  startScreenRecordDetection() {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      this._origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async () => { this.recordViolation('🚫 Screen recording attempt detected and blocked!'); throw new DOMException('Not allowed.', 'NotAllowedError'); };
    }
  }
  stopScreenRecordDetection() { if (this._origGetDisplayMedia && navigator.mediaDevices) navigator.mediaDevices.getDisplayMedia = this._origGetDisplayMedia; }
}

// ==========================================
// 🧹 CLEANUP MANAGER
// ==========================================
class CleanupManager {
  static performFullCleanup() {
    FullscreenManager.exit();
    window.onbeforeunload = null;
    [document.body, document.documentElement].forEach(el => {
      if (!el) return;
      ['overflow','position','margin','padding','width','height','top','left','overscrollBehavior','userSelect','webkitUserSelect','msUserSelect','mozUserSelect'].forEach(p => { el.style[p] = ''; });
    });
    window.scrollTo(0, 0);
  }
}

// ==========================================
// 💧 WATERMARK
// ==========================================
function Watermark({ userEmail, userName }) {
  const text = `${userName || 'Student'} • ${userEmail || ''} • EXAM`;
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:99998, overflow:'hidden', userSelect:'none', WebkitUserSelect:'none' }}>
      {Array.from({length:8}).map((_,row) => Array.from({length:5}).map((_,col) => (
        <div key={`${row}-${col}`} style={{ position:'absolute', left:`${col*22-5}%`, top:`${row*14-2}%`, transform:'rotate(-25deg)', fontSize:'13px', fontWeight:'700', color:'rgba(99,102,241,0.13)', whiteSpace:'nowrap', letterSpacing:'0.05em', fontFamily:'monospace' }}>
          {text}
        </div>
      )))}
    </div>
  );
}

// ==========================================
// ⚠️ WARNING MODAL — mobile responsive + countdown + scroll
// ==========================================
function WarningModal({ show, message, type, tabSwitches, onAcknowledge, isMobile }) {
  const [countdown, setCountdown] = useState(20);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!show) { setCountdown(20); if (timerRef.current) clearInterval(timerRef.current); return; }

    // Block back button when modal is showing
    window.history.pushState(null, '', window.location.href);
    const blockBack = (e) => { e.preventDefault(); window.history.pushState(null, '', window.location.href); };
    window.addEventListener('popstate', blockBack);

    // 20 sec countdown — sirf final/critical pe
    const isFinal = type === 'final';
    const isCritical = type === 'critical';
    if (isFinal || isCritical) {
      setCountdown(20);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onAcknowledge(); // auto close/submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      window.removeEventListener('popstate', blockBack);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [show, type, onAcknowledge]);

  if (!show) return null;

  const isFinal    = type === 'final';
  const isCritical = type === 'critical';
  const needsOk    = isFinal || isCritical;

  const s = isFinal
    ? { bg:'linear-gradient(135deg,#1a0000,#3d0000)', border:'4px solid #dc2626', color:'#fff', iconColor:'#ff4444', iconSize:44 }
    : isCritical
    ? { bg:'linear-gradient(135deg,#1a1000,#3d2800)', border:'3px solid #f59e0b', color:'#fff', iconColor:'#fbbf24', iconSize:38 }
    : { bg:'linear-gradient(135deg,#fee2e2,#fecaca)', border:'3px solid #ef4444', color:'#991b1b', iconColor:'#ef4444', iconSize:32 };

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(0,0,0,0.92)',
      zIndex:9999999,
      display:'flex',
      alignItems:'flex-start',
      justifyContent:'center',
      backdropFilter:'blur(12px)',
      WebkitBackdropFilter:'blur(12px)',
      overflowY:'auto',
      WebkitOverflowScrolling:'touch',
      padding:'1rem',
    }}>
      <div style={{
        background:s.bg,
        padding:'1.5rem 1.25rem',
        borderRadius:'20px',
        maxWidth:'520px',
        width:'100%',
        margin:'auto',
        border:s.border,
        boxShadow:`0 20px 60px ${s.iconColor}40`,
        textAlign:'center',
        animation:isFinal?'warningPulse 0.9s infinite':'none',
      }}>
        {/* Icon */}
        <div style={{ animation:'iconShake 0.4s infinite', display:'inline-block', marginBottom:'0.75rem' }}>
          <AlertTriangle size={s.iconSize} color={s.iconColor} strokeWidth={2.5} />
        </div>

        {/* Title */}
        {isFinal && (
          <div style={{ fontSize:'clamp(1.1rem,5vw,1.6rem)', fontWeight:'900', color:'#ff4444', marginBottom:'0.75rem', letterSpacing:'0.04em', textTransform:'uppercase', animation:'blink 0.7s infinite' }}>
            🚫 DISQUALIFIED
          </div>
        )}
        {isCritical && (
          <div style={{ fontSize:'clamp(1rem,4vw,1.4rem)', fontWeight:'900', color:'#fcd34d', marginBottom:'0.75rem' }}>
            🚨 FINAL WARNING
          </div>
        )}

        {/* Message — readable font on mobile */}
        <div style={{
          fontSize:'clamp(0.82rem,3.5vw,1rem)',
          fontWeight:'600',
          color:s.color,
          lineHeight:1.7,
          whiteSpace:'pre-line',
          marginBottom:'1rem',
          textAlign:'left',
          wordBreak:'break-word',
        }}>
          {message}
        </div>

        {/* Tab switch counter */}
        {tabSwitches > 0 && (
          <div style={{ fontSize:'0.85rem', fontWeight:'900', color:s.iconColor, padding:'0.5rem 1rem', background:'rgba(0,0,0,0.3)', borderRadius:'8px', marginBottom:'1rem', border:`2px solid ${s.iconColor}40`, display:'inline-block' }}>
            Tab Switches: {tabSwitches} / {APP_CONFIG.MAX_TAB_SWITCHES}
          </div>
        )}

        {/* Countdown bar */}
        {needsOk && (
          <div style={{ marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.6)', marginBottom:'0.4rem', fontWeight:'600' }}>
              Auto-continuing in <span style={{ color:s.iconColor, fontWeight:'900' }}>{countdown}s</span>
            </div>
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'999px', height:'6px', overflow:'hidden' }}>
              <div style={{
                height:'100%',
                width:`${(countdown/20)*100}%`,
                background:isFinal?'#ef4444':'#f59e0b',
                borderRadius:'999px',
                transition:'width 1s linear',
              }} />
            </div>
          </div>
        )}

        {/* OK Button */}
        {needsOk && (
          <button
            onClick={onAcknowledge}
            style={{
              width:'100%',
              padding:'0.875rem 1rem',
              background:isFinal?'linear-gradient(135deg,#dc2626,#7f1d1d)':'linear-gradient(135deg,#f59e0b,#b45309)',
              border:'none', borderRadius:'12px',
              color:'#fff', fontSize:'clamp(0.8rem,3.5vw,0.95rem)', fontWeight:'900',
              cursor:'pointer', letterSpacing:'0.03em',
              boxShadow:isFinal?'0 6px 20px rgba(220,38,38,0.5)':'0 6px 20px rgba(245,158,11,0.5)',
              transition:'all 0.2s',
              wordBreak:'break-word',
              whiteSpace:'normal',
              lineHeight:1.4,
            }}>
            {isFinal ? '😔 I understand — I accept this disqualification' : '⚠️ I understand — I will NOT violate rules again'}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 📋 INSTRUCTION SCREEN
// ==========================================
function InstructionScreen({ onAccept, testTitle, timeLimit, totalQuestions }) {
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const sels = ['nav','header','footer','.navbar','.header','.footer','.telegram-button','#telegram-button','.TelegramButton','[class*="telegram"]','.background','.Background','[class*="background"]','.toast-container','.ToastContainer','[class*="razorpay"]','[id*="razorpay"]'];
    const hidden = [];
    sels.forEach(s => { try { document.querySelectorAll(s).forEach(el => { if(el){ hidden.push({el,d:el.style.display,v:el.style.visibility}); el.style.display='none'; el.style.visibility='hidden'; } }); } catch(e){} });
    return () => hidden.forEach(({el,d,v}) => { if(el){ el.style.display=d||''; el.style.visibility=v||''; } });
  }, []);
  const instructions = [
    { text: `Test duration is ${timeLimit} minutes. Timer starts immediately.` },
    { text: 'Mobile users: Do NOT switch tabs — 3 switches = auto-submit with FAIL.' },
    { text: 'Copy, paste, right-click, printing, and screenshots are completely disabled.' },
    { text: 'Screen recording is detected and blocked automatically.' },
    { text: 'Test runs in fullscreen — exiting triggers warning and auto-returns.' },
    { text: 'Your name & email are watermarked on every screen permanently.' },
    { text: 'ALL questions must be answered before submitting.' },
    { text: 'Score 55%+ to PASS and receive Certificate of Achievement.' },
    { text: 'Cheating = FAIL + permanent record + zero refund + no certificate.', danger: true },
  ];
  return (
    <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,background:'#f8fafc',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'1rem',overflowY:'auto',WebkitOverflowScrolling:'touch' }}>
      <div style={{ width:'100%',maxWidth:'680px',padding:'1rem 0' }}>
        <div style={{ background:'#fff',border:'3px solid #e2e8f0',borderRadius:'20px',padding:'1.5rem',marginBottom:'1rem',boxShadow:'0 8px 24px rgba(0,0,0,0.08)',textAlign:'center' }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:'0.5rem',background:'#eff6ff',border:'2px solid #bfdbfe',borderRadius:'50px',padding:'0.5rem 1.25rem',marginBottom:'1rem' }}>
            <Shield size={18} color="#3b82f6" /><span style={{ color:'#1d4ed8',fontWeight:'800',fontSize:'0.85rem',letterSpacing:'0.06em' }}>EXAM INSTRUCTIONS</span>
          </div>
          <h1 style={{ fontSize:'clamp(1.3rem,5vw,1.9rem)',fontWeight:'800',color:'#1e293b',margin:'0 0 0.75rem' }}>{testTitle}</h1>
          <div style={{ display:'flex',justifyContent:'center',gap:'1.5rem',flexWrap:'wrap' }}>
            {[{label:'Duration',value:`${timeLimit} Min`},{label:'Questions',value:`${totalQuestions} Qs`},{label:'Pass Mark',value:'55%'}].map((s,i)=>(
              <div key={i}><div style={{ fontSize:'1.2rem',fontWeight:'900',color:'#3b82f6' }}>{s.value}</div><div style={{ fontSize:'0.75rem',color:'#64748b',fontWeight:'700' }}>{s.label}</div></div>
            ))}
          </div>
        </div>
        <div style={{ background:'#fff',border:'3px solid #e2e8f0',borderRadius:'20px',padding:'1.5rem',marginBottom:'1rem',boxShadow:'0 8px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1.25rem' }}>
            <BookOpen size={18} color="#3b82f6" /><span style={{ color:'#1e293b',fontWeight:'800',fontSize:'0.95rem',textTransform:'uppercase',letterSpacing:'0.08em' }}>Test Instructions</span>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:'0.75rem',marginBottom:'1.5rem' }}>
            {instructions.map((item,idx) => (
              <div key={idx} style={{ display:'flex',alignItems:'flex-start',gap:'0.85rem',padding:'1rem',background:item.danger?'#fff5f5':'#f8fafc',border:`2px solid ${item.danger?'#fecaca':'#e2e8f0'}`,borderRadius:'14px' }}>
                <div style={{ width:'26px',height:'26px',minWidth:'26px',borderRadius:'8px',border:`2.5px solid ${item.danger?'#f87171':'#cbd5e1'}`,background:item.danger?'#fee2e2':'#fff',display:'flex',alignItems:'center',justifyContent:'center',color:item.danger?'#dc2626':'#64748b',fontWeight:'800',fontSize:'0.85rem' }}>{idx+1}</div>
                <span style={{ color:item.danger?'#991b1b':'#475569',fontSize:'clamp(0.85rem,2.5vw,0.95rem)',fontWeight:item.danger?'700':'600',lineHeight:1.55,flex:1 }}>{item.text}</span>
              </div>
            ))}
          </div>
          <div onClick={()=>setAccepted(!accepted)} style={{ display:'flex',alignItems:'center',gap:'1rem',padding:'1.25rem',background:accepted?'#f0fdf4':'#fff',border:`3px solid ${accepted?'#10b981':'#e2e8f0'}`,borderRadius:'14px',cursor:'pointer',transition:'all 0.2s' }}>
            <div style={{ width:'32px',height:'32px',minWidth:'32px',borderRadius:'8px',border:`3px solid ${accepted?'#10b981':'#cbd5e1'}`,background:accepted?'#10b981':'#fff',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s' }}>
              {accepted && <CheckCircle size={20} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ color:accepted?'#065f46':'#475569',fontSize:'clamp(0.9rem,2.5vw,1.05rem)',fontWeight:accepted?'800':'700',lineHeight:1.4,flex:1 }}>✅ I have read all instructions. I will NOT cheat under any circumstances.</span>
          </div>
        </div>
        <button onClick={()=>accepted&&onAccept()} disabled={!accepted} style={{ width:'100%',padding:'1.1rem',background:accepted?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0',border:accepted?'3px solid #059669':'3px solid #e2e8f0',borderRadius:'16px',color:accepted?'#fff':'#94a3b8',fontSize:'1.05rem',fontWeight:'800',cursor:accepted?'pointer':'not-allowed',boxShadow:accepted?'0 8px 24px rgba(16,185,129,0.35)':'none',transition:'all 0.3s' }}>
          {accepted ? '✅ Proceed to Fill Details' : '☑️ Please Accept Instructions First'}
        </button>
      </div>
    </div>
  );
}


function TestInterface({ questions, onComplete, testTitle, timeLimit, userEmail, studentInfo }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers]         = useState({});
  const [timeLeft, setTimeLeft]       = useState(timeLimit * 60);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [blurCount, setBlurCount]     = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg]   = useState('');
  const [warningType, setWarningType] = useState('normal');
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [isContentBlurred, setIsContentBlurred] = useState(false);
  const [isMobile, setIsMobile]       = useState(window.innerWidth <= 768);

  const startTimeRef    = useRef(Date.now());
  const audioRef        = useRef(new AudioManager());
  const securityRef     = useRef(null);
  const warningTimerRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const tabSwitchRef    = useRef(0);
  const blurCountRef    = useRef(0);

  const isAdmin        = TestUtils.isAdmin(userEmail);
  const answeredCount  = Object.keys(answers).length;
  const allAnswered    = answeredCount === questions.length;
  const timeData       = TestUtils.formatTime(timeLeft);
  const timerTheme     = TestUtils.getTimerTheme(timeLeft, timeLimit * 60);
  const isCriticalTime = timeLeft < APP_CONFIG.CRITICAL_TIME_MINUTES * 60;
  const studentName    = studentInfo?.fullName || 'Student';

  const showWarningMessage = useCallback((message, type = 'normal', mustAck = false) => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
    const needsOk = mustAck || type === 'critical' || type === 'final';
    setWarningMsg(message); setWarningType(type); setShowWarning(true);
    if (!needsOk) warningTimerRef.current = setTimeout(() => setShowWarning(false), APP_CONFIG.WARNING_TIMEOUT);
  }, []);

  const handleAcknowledge = useCallback(() => setShowWarning(false), []);

  const handleAnswer = useCallback((qIndex, optIdx) => {
    if (isDisqualified) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optIdx }));
  }, [isDisqualified]);

  const handleSubmit = useCallback((penalized = false, reason = '') => {
    if (hasSubmittedRef.current) return;
    FullscreenManager.exit();
    if (!isAdmin && !allAnswered && !penalized) {
      showWarningMessage(`⚠️ Please answer ALL questions before submitting!\n(${answeredCount}/${questions.length} answered)`, 'normal');
      return;
    }
    hasSubmittedRef.current = true;
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const score = TestUtils.calculateScore(answers, questions, tabSwitchRef.current, isAdmin);
    const results = { ...score, timeTaken:`${Math.floor(timeTaken/60)}m ${timeTaken%60}s`, tabSwitches:tabSwitchRef.current, penalized, disqualificationReason:reason, studentInfo };
    CleanupManager.performFullCleanup();
    setTimeout(() => onComplete(results), 100);
  }, [answers, questions, isAdmin, allAnswered, answeredCount, studentInfo, onComplete, showWarningMessage]);

  const handleNavigation = useCallback((dir) => {
    if (isDisqualified) return;
    if (dir === 'next' && currentQuestion < questions.length-1) setCurrentQuestion(p=>p+1);
    else if (dir === 'prev' && currentQuestion > 0) setCurrentQuestion(p=>p-1);
  }, [currentQuestion, questions.length, isDisqualified]);

  useEffect(() => { window.scrollTo({top:0,behavior:'smooth'}); }, [currentQuestion]);

  // SETUP
  useEffect(() => {
    const sels = ['nav','header','footer','.navbar','.header','.footer','.menu','.toolbar','#toolbar','[role="navigation"]','[role="banner"]','[role="contentinfo"]','.telegram-button','#telegram-button','.TelegramButton','[class*="telegram"]','.background','.Background','[class*="background"]','.toast-container','.ToastContainer','[class*="toast"]','[class*="razorpay"]','[id*="razorpay"]','aside','.sidebar','#sidebar'];
    const hidden = [];
    sels.forEach(s=>{ try{ document.querySelectorAll(s).forEach(el=>{ if(el&&!el.closest('[data-test-interface]')){ hidden.push({el,d:el.style.display,v:el.style.visibility}); el.style.display='none'; el.style.visibility='hidden'; } }); }catch(e){} });
    const orig = { overflow:document.body.style.overflow, htmlOverflow:document.documentElement.style.overflow, position:document.body.style.position, margin:document.body.style.margin, padding:document.body.style.padding, width:document.body.style.width, height:document.body.style.height };
    document.body.style.overflow='hidden'; document.documentElement.style.overflow='hidden';
    document.body.style.margin='0'; document.body.style.padding='0'; document.body.style.position='fixed';
    document.body.style.width='100%'; document.body.style.height='100%'; document.body.style.top='0'; document.body.style.left='0';
    if (!isAdmin) { audioRef.current.init(); securityRef.current = new SecurityManager(showWarningMessage, handleSubmit); securityRef.current.enable(); }
    window.onbeforeunload = (e) => { if (!hasSubmittedRef.current) { e.preventDefault(); e.returnValue=''; return ''; } };
    const currentAudio = audioRef.current; const currentSecurity = securityRef.current;
    return () => {
      window.onbeforeunload = null;
      hidden.forEach(({el,d,v})=>{ if(el){ el.style.display=d||''; el.style.visibility=v||''; } });
      document.body.style.overflow=orig.overflow; document.documentElement.style.overflow=orig.htmlOverflow;
      document.body.style.position=orig.position; document.body.style.margin=orig.margin; document.body.style.padding=orig.padding;
      document.body.style.width=orig.width; document.body.style.height=orig.height; document.body.style.top=''; document.body.style.left='';
      currentAudio.destroy(); if (currentSecurity) currentSecurity.disable();
    };
  }, [isAdmin, showWarningMessage, handleSubmit]);

  // FULLSCREEN
  useEffect(() => {
    if (isAdmin) return;
    const handler = () => {
      if (!FullscreenManager.isActive() && !hasSubmittedRef.current && !isDisqualified) {
        showWarningMessage('⚠️ You exited fullscreen mode! Returning you to fullscreen...', 'normal');
        setTimeout(() => FullscreenManager.enter(), 1500);
      }
    };
    return FullscreenManager.onChange(handler);
  }, [isAdmin, showWarningMessage, isDisqualified]);

  // TIMER
  useEffect(() => {
    if (timeLeft <= 0 || hasSubmittedRef.current || isDisqualified) {
      if (timeLeft <= 0 && !hasSubmittedRef.current && !isDisqualified) { audioRef.current.playAlarm(); showWarningMessage('⏰ TIME IS UP!\n\nYour test is being submitted automatically.', 'final', true); setTimeout(() => handleSubmit(false, 'time-up'), APP_CONFIG.AUTO_SUBMIT_DELAY); }
      return;
    }
    const t = setInterval(() => setTimeLeft(p=>p-1), 1000); return () => clearInterval(t);
  }, [timeLeft, showWarningMessage, handleSubmit, isDisqualified]);

  // TICK
  useEffect(() => {
    if (isAdmin||timeLeft<=0||hasSubmittedRef.current||isDisqualified) return;
    const t = setInterval(() => audioRef.current.playTick(timeLeft%2===0), 1000); return () => clearInterval(t);
  }, [timeLeft, isAdmin, isDisqualified]);

  // ✅ TAB SWITCH — ONLY on mobile
  useEffect(() => {
    if (isAdmin||isDisqualified) return;
    const handler = () => {
      if (!document.hidden || hasSubmittedRef.current) return;
      const newCount = tabSwitchRef.current + 1; tabSwitchRef.current = newCount; setTabSwitches(newCount);
      if (newCount === 1) {
        showWarningMessage(`⚠️ WARNING — Tab Switch Detected (1 of 3)\n\nYou have switched away from the exam window.\nReturn immediately and stay focused.`, 'critical', true);
      } else if (newCount === 2) {
        showWarningMessage(`🚨 SECOND WARNING — Tab Switch (2 of 3) — LAST CHANCE\n\nOne more tab switch = immediate FAIL + permanent record + no certificate.`, 'critical', true);
      } else if (newCount >= APP_CONFIG.MAX_TAB_SWITCHES) {
        setIsDisqualified(true);
        showWarningMessage(`🚫 YOU HAVE BEEN DISQUALIFIED\n\nSubmitted as FAIL.\nYour name and email recorded.\nNo certificate. No refund. No appeal.`, 'final', true);
        setTimeout(() => handleSubmit(true, 'tab-switching-disqualified'), APP_CONFIG.AUTO_SUBMIT_DELAY);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isAdmin, showWarningMessage, handleSubmit, isDisqualified, isMobile]);

  // WINDOW BLUR
  useEffect(() => {
    if (isAdmin||isDisqualified) return;
    const handleBlur = () => {
      if (hasSubmittedRef.current||isDisqualified) return;
      setIsContentBlurred(true); const newCount = blurCountRef.current + 1; blurCountRef.current = newCount; setBlurCount(newCount);
      if (newCount >= APP_CONFIG.MAX_BLUR_COUNT) showWarningMessage(`⚠️ REPEATED FOCUS LOSS DETECTED — ${newCount} times\n\nStay focused on the exam.`, 'critical', true);
      else showWarningMessage(`⚠️ You left the exam window! Return immediately. (${newCount} time${newCount>1?'s':''})`, 'violation');
    };
    const handleFocus = () => setIsContentBlurred(false);
    window.addEventListener('blur', handleBlur); window.addEventListener('focus', handleFocus);
    return () => { window.removeEventListener('blur', handleBlur); window.removeEventListener('focus', handleFocus); };
  }, [isAdmin, showWarningMessage, isDisqualified]);

  // MOUSE LEAVE
  useEffect(() => {
    if (isAdmin||isDisqualified) return;
    const handler = (e) => {
      if (hasSubmittedRef.current||isDisqualified) return;
      if (e.clientY<=0||e.clientX<=0||e.clientX>=window.innerWidth||e.clientY>=window.innerHeight) showWarningMessage('⚠️ Your mouse left the exam window! Stay focused.', 'violation');
    };
    document.addEventListener('mouseleave', handler); return () => document.removeEventListener('mouseleave', handler);
  }, [isAdmin, showWarningMessage, isDisqualified]);

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth<=768);
    window.addEventListener('resize', r); return () => window.removeEventListener('resize', r);
  }, []);

  const currentQ = questions[currentQuestion];

  return (
    <div data-test-interface="true" style={{ position:'fixed', inset:0, background:'#f8fafc', zIndex:999999, overflowY:'auto', WebkitOverflowScrolling:'touch', userSelect:isAdmin?'auto':'none', width:'100vw', height:'100vh', top:0, left:0 }}>
      <style>{`
        * { -webkit-touch-callout: none !important; }
        ::selection { background: transparent !important; color: inherit !important; }
        ::-moz-selection { background: transparent !important; color: inherit !important; }
        @keyframes iconShake { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)} 60%{transform:rotate(-5deg)} 80%{transform:rotate(5deg)} }
        @keyframes warningPulse { 0%,100%{box-shadow:0 40px 100px rgba(220,38,38,0.5)} 50%{box-shadow:0 40px 140px rgba(220,38,38,0.9)} }
        @keyframes blink { 0%,49%,100%{opacity:1} 50%,99%{opacity:0.15} }
        @keyframes slideIn { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateX(-15px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes tickBlink { 0%,49%,100%{opacity:1} 50%,99%{opacity:0.25} }
      `}</style>

      {!isAdmin && <Watermark userEmail={userEmail} userName={studentName} />}

      {isContentBlurred && !isAdmin && (
        <div style={{ position:'fixed',inset:0,zIndex:99997,backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'1.25rem' }}>
          <EyeOff size={70} color="#fff" />
          <div style={{ color:'#fff',fontWeight:'900',fontSize:'1.5rem',textAlign:'center' }}>⚠️ Return to the exam window</div>
          <div style={{ color:'rgba(255,255,255,0.65)',fontSize:'1rem' }}>Content is hidden until you return focus</div>
        </div>
      )}

      {!isAdmin && <WarningModal show={showWarning} message={warningMsg} type={warningType} tabSwitches={tabSwitches} onAcknowledge={handleAcknowledge} isMobile={isMobile} />}

      {isAdmin && (
        <div style={{ position:'fixed',top:'10px',left:'10px',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',padding:'0.6rem 1.2rem',borderRadius:'12px',fontSize:'0.8rem',fontWeight:'900',zIndex:10000000,boxShadow:'0 6px 20px rgba(16,185,129,0.5)' }}>
          👑 ADMIN MODE — Security Disabled
        </div>
      )}

      {/* HEADER */}
      <div style={{ position:'sticky',top:0,background:'#fff',borderBottom:'3px solid #e2e8f0',padding:isMobile?'0.75rem 1rem':'0.875rem 1.5rem',zIndex:1000,boxShadow:'0 4px 12px rgba(0,0,0,0.08)',opacity:isDisqualified?0.5:1 }}>
        <div style={{ maxWidth:'1400px',margin:'0 auto' }}>

          {/* ✅ Student name bar */}
          {!isAdmin && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem', padding:'0.35rem 0.75rem', background:'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))', border:'1.5px solid rgba(99,102,241,0.18)', borderRadius:'8px', width:'fit-content' }}>
              <span style={{ fontSize:'12px' }}>👤</span>
              <span style={{ fontSize:'0.78rem', fontWeight:'800', color:'#6366f1' }}>{studentName}</span>
              <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:'500' }}>• {studentInfo?.email}</span>
              {studentInfo?.address && <span style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:'500' }}>• {studentInfo.address}</span>}
            </div>
          )}

          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem',flexWrap:'wrap' }}>
            <div style={{ flex:1,minWidth:'200px' }}>
              <h1 style={{ fontSize:isMobile?'1.1rem':'1.4rem',fontWeight:'800',color:'#1e293b',margin:'0 0 0.25rem' }}>{testTitle}</h1>
              <div style={{ fontSize:isMobile?'0.75rem':'0.9rem',color:'#64748b',fontWeight:'600',display:'flex',gap:'0.5rem',alignItems:'center',flexWrap:'wrap' }}>
                <span>Q {currentQuestion+1}/{questions.length}</span>
                <span style={{ background:allAnswered?'#dcfce7':'#fef3c7',color:allAnswered?'#065f46':'#92400e',padding:'0.15rem 0.5rem',borderRadius:'6px',fontSize:'0.7rem',fontWeight:'800' }}>
                  {allAnswered?'✅':'📝'} {answeredCount}/{questions.length}
                </span>
                {tabSwitches>0&&!isAdmin&&<span style={{ background:'#fee2e2',color:'#dc2626',padding:'0.15rem 0.5rem',borderRadius:'6px',fontSize:'0.7rem',fontWeight:'800' }}>⚠️ {tabSwitches}/{APP_CONFIG.MAX_TAB_SWITCHES}</span>}
                {blurCount>0&&!isAdmin&&<span style={{ background:'#fef3c7',color:'#92400e',padding:'0.15rem 0.5rem',borderRadius:'6px',fontSize:'0.7rem',fontWeight:'800' }}>👁️ {blurCount}</span>}
                {isDisqualified&&<span style={{ background:'#dc2626',color:'#fff',padding:'0.15rem 0.5rem',borderRadius:'6px',fontSize:'0.7rem',fontWeight:'800' }}>🚫 DISQUALIFIED</span>}
              </div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:'0.5rem',padding:isMobile?'0.5rem 1rem':'0.65rem 1.25rem',background:timerTheme.bg,borderRadius:'12px',border:`3px solid ${timerTheme.border}` }}>
              <Clock size={isMobile?18:22} color={timerTheme.text} strokeWidth={2.5} style={{ animation:isCriticalTime?'shake 0.6s infinite':'none' }} />
              <div style={{ fontSize:isMobile?'1.1rem':'1.4rem',fontWeight:'900',color:timerTheme.text,fontFamily:'monospace',animation:isCriticalTime?'tickBlink 1s infinite':'none' }}>
                {timeData.display}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding:isMobile?'1.5rem 1rem':'2rem 1.5rem',maxWidth:'1400px',margin:'0 auto',paddingBottom:'6rem',opacity:isDisqualified?0.15:1,pointerEvents:isDisqualified?'none':'auto',filter:isDisqualified?'blur(6px)':'none',transition:'all 0.4s' }}>

        {/* QUESTION CARD */}
        <div key={currentQuestion} style={{ background:'#fff',padding:isMobile?'1.5rem':'2.5rem',borderRadius:'20px',marginBottom:'2rem',border:'3px solid #e2e8f0',boxShadow:'0 8px 24px rgba(0,0,0,0.08)',animation:'slideIn 0.4s ease' }}>
          <div style={{ fontSize:isMobile?'1.2rem':'1.6rem',fontWeight:'700',color:'#1e293b',lineHeight:1.6 }}>
            {currentQ.question}
          </div>
          {/* ✅ Syntax highlighted code box */}
          {currentQ.code && <SyntaxHighlight code={currentQ.code} />}
        </div>

        {/* OPTIONS */}
        <div key={`opts-${currentQuestion}`} style={{ display:'grid',gap:isMobile?'1rem':'1.5rem',marginBottom:'2.5rem' }}>
          {currentQ.options.map((option,idx)=>{
            const isSelected = answers[currentQuestion]===idx;
            return (
              <button key={idx} onClick={()=>handleAnswer(currentQuestion,idx)} disabled={isDisqualified} style={{ padding:isMobile?'1.25rem':'1.75rem', background:isSelected?'linear-gradient(135deg,#3b82f6,#2563eb)':'#fff', border:`3px solid ${isSelected?'#3b82f6':'#e2e8f0'}`, borderRadius:'16px',cursor:isDisqualified?'not-allowed':'pointer',textAlign:'left', color:isSelected?'#fff':'#1e293b',fontSize:isMobile?'1rem':'1.3rem',fontWeight:'600', display:'flex',alignItems:'center',gap:isMobile?'1rem':'1.5rem', boxShadow:isSelected?'0 8px 24px rgba(59,130,246,0.3)':'0 4px 12px rgba(0,0,0,0.05)', transform:isSelected?'scale(1.02)':'scale(1)',transition:'all 0.3s', animation:`fadeInUp 0.3s ease ${idx*0.08}s backwards` }}>
                <span style={{ width:isMobile?'40px':'52px',height:isMobile?'40px':'52px',borderRadius:'50%',background:isSelected?'rgba(255,255,255,0.25)':'#e2e8f0',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'900',fontSize:isMobile?'1.1rem':'1.4rem',flexShrink:0 }}>
                  {String.fromCharCode(65+idx)}
                </span>
                <span style={{ flex:1,lineHeight:1.5 }}>{option}</span>
                {isSelected&&<CheckCircle size={isMobile?22:28} color="#fff" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        {/* NAVIGATION */}
        <div style={{ display:'flex',justifyContent:'space-between',gap:'1rem',marginBottom:'2.5rem' }}>
          <button onClick={()=>handleNavigation('prev')} disabled={currentQuestion===0||isDisqualified} style={{ padding:isMobile?'1rem 1.5rem':'1.25rem 2rem',background:(currentQuestion===0||isDisqualified)?'#f1f5f9':'#fff',border:`3px solid ${(currentQuestion===0||isDisqualified)?'#e2e8f0':'#cbd5e1'}`,borderRadius:'12px',cursor:(currentQuestion===0||isDisqualified)?'not-allowed':'pointer',fontWeight:'700',color:(currentQuestion===0||isDisqualified)?'#94a3b8':'#1e293b',fontSize:isMobile?'0.95rem':'1.1rem',display:'flex',alignItems:'center',gap:'0.5rem' }}>
            <ChevronLeft size={isMobile?18:22} />{!isMobile&&'Previous'}
          </button>
          {currentQuestion===questions.length-1 ? (
            <button onClick={()=>handleSubmit(false,'')} disabled={((!allAnswered&&!isAdmin)||isDisqualified)} style={{ padding:isMobile?'1rem 2rem':'1.25rem 3rem',background:((allAnswered||isAdmin)&&!isDisqualified)?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0',border:`3px solid ${((allAnswered||isAdmin)&&!isDisqualified)?'#059669':'#e2e8f0'}`,borderRadius:'12px',cursor:((allAnswered||isAdmin)&&!isDisqualified)?'pointer':'not-allowed',fontWeight:'800',color:((allAnswered||isAdmin)&&!isDisqualified)?'#fff':'#94a3b8',fontSize:isMobile?'1rem':'1.2rem',boxShadow:((allAnswered||isAdmin)&&!isDisqualified)?'0 8px 24px rgba(16,185,129,0.4)':'none',textTransform:'uppercase' }}>
              {((allAnswered||isAdmin)&&!isDisqualified)?'✅ Submit Test':'⚠️ Answer All First'}
            </button>
          ):(
            <button onClick={()=>handleNavigation('next')} disabled={isDisqualified} style={{ padding:isMobile?'1rem 1.5rem':'1.25rem 2rem',background:isDisqualified?'#f1f5f9':'#fff',border:`3px solid ${isDisqualified?'#e2e8f0':'#cbd5e1'}`,borderRadius:'12px',cursor:isDisqualified?'not-allowed':'pointer',fontWeight:'700',color:isDisqualified?'#94a3b8':'#1e293b',fontSize:isMobile?'0.95rem':'1.1rem',display:'flex',alignItems:'center',gap:'0.5rem' }}>
              {!isMobile&&'Next'}<ChevronRight size={isMobile?18:22} />
            </button>
          )}
        </div>

        {/* PROGRESS GRID */}
        <div style={{ background:'#fff',padding:isMobile?'1.25rem':'1.75rem',borderRadius:'20px',border:'3px solid #e2e8f0',boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:isMobile?'0.9rem':'1.05rem',fontWeight:'800',color:'#64748b',marginBottom:'1.25rem',textTransform:'uppercase',letterSpacing:'0.1em' }}>
            Progress: {answeredCount}/{questions.length} Answered
          </div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(auto-fill,minmax(44px,1fr))':'repeat(auto-fill,minmax(56px,1fr))',gap:isMobile?'0.6rem':'0.85rem' }}>
            {questions.map((_,idx)=>{
              const isAnswered = answers[idx]!==undefined; const isCurrent = idx===currentQuestion;
              return (
                <button key={idx} onClick={()=>!isDisqualified&&setCurrentQuestion(idx)} disabled={isDisqualified} style={{ height:isMobile?'44px':'56px',borderRadius:'10px',border:isCurrent?'3px solid #3b82f6':'none',background:isAnswered?'linear-gradient(135deg,#10b981,#059669)':'#e2e8f0',color:isAnswered?'#fff':'#1e293b',fontWeight:'800',cursor:isDisqualified?'not-allowed':'pointer',fontSize:isMobile?'0.95rem':'1.15rem',boxShadow:isAnswered?'0 4px 12px rgba(16,185,129,0.3)':'none',transform:isCurrent?'scale(1.05)':'scale(1)',opacity:isDisqualified?0.5:1,transition:'all 0.2s' }}>
                  {idx+1}
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
// 🎯 MAIN APP
// ==========================================
export default function MockTestInterface({ questions, testTitle, timeLimit, userEmail, testLevel, onExit, onComplete }) {
  const [stage, setStage]             = useState('instructions');
  const [studentInfo, setStudentInfo] = useState(null);
  const stageRef         = useRef('instructions');

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
      else window.history.pushState(null,'',window.location.href);
    };
    window.history.pushState(null,'',window.location.href);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [onExit]);

  // ✅ Form submit — stageRef ONLY check karo (single source of truth)
  const handleFormSubmit = useCallback((info) => {
    if (stageRef.current !== 'form') {
      console.log('⛔ Form submit blocked — stage:', stageRef.current);
      return;
    }
    stageRef.current = 'test'; // immediately set — koi aur call nahi ho sakta
    setStudentInfo(info);
    setStage('test');
  }, []);

  const handleTestComplete = useCallback((testResults) => {
    CleanupManager.performFullCleanup();
    // ✅ Stage 'done' pe set karo — form/instructions dobara nahi dikhenge
    stageRef.current = 'done';
    setStage('done');
    const data = {
      ...testResults,
      studentInfo,
      userName: studentInfo?.fullName,
      testTitle, testLevel, userEmail,
      completedAt: Date.now(),
      timestamp: new Date().toISOString()
    };
    LeaderboardStorage.saveEntry(data);
    setTimeout(() => { if (onComplete) onComplete(data); }, 200);
  }, [studentInfo, testTitle, testLevel, userEmail, onComplete]);

  return (
    <>
      {stage === 'instructions' && (
        <InstructionScreen
          testTitle={testTitle} timeLimit={timeLimit} totalQuestions={questions.length}
          onAccept={() => { stageRef.current = 'form'; setStage('form'); }}
        />
      )}
      {stage === 'form' && (
        <UserDetailsForm onSubmit={handleFormSubmit} />
      )}
      {stage === 'test' && (
        <TestInterface
          questions={questions} testTitle={testTitle} timeLimit={timeLimit}
          userEmail={userEmail} studentInfo={studentInfo} onComplete={handleTestComplete}
        />
      )}
    </>
  );
}