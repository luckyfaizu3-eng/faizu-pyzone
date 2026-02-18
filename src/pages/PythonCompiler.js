import React, { useState, useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════
//  Backend URL — dev mein localhost, prod mein apna server
// ═══════════════════════════════════════════════
const BACKEND_URL = process.env.REACT_APP_COMPILER_BACKEND || 'http://localhost:5000';

// ═══════════════════════════════════════════════
//  VS Code Light+ Token Colors
// ═══════════════════════════════════════════════
const TC = {
  keyword:   '#0000ff',
  builtin:   '#795e26',
  string:    '#a31515',
  comment:   '#008000',
  number:    '#098658',
  operator:  '#000000',
  decorator: '#af00db',
  default:   '#000000',
};

const KW = new Set([
  'def','class','import','from','return','if','elif','else','for','while','in',
  'not','and','or','True','False','None','try','except','finally','with','as',
  'pass','break','continue','lambda','yield','async','await','raise','del',
  'global','nonlocal','assert','is',
]);
const BT = new Set([
  'print','len','range','type','int','str','float','list','dict','set','tuple',
  'input','open','enumerate','zip','map','filter','sorted','reversed','max','min',
  'sum','abs','round','isinstance','hasattr','getattr','setattr','super','object',
  'bool','bytes','repr','format','vars','dir','id','hex','oct','bin','eval','exec',
  '__name__','__main__',
]);

function tokenizePy(code) {
  const tokens = [];
  const lines  = code.split('\n');
  lines.forEach((line, li) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('@')) {
      const spaceIdx = trimmed.indexOf(' ');
      const decEnd   = spaceIdx > -1 ? spaceIdx : trimmed.length;
      const leading  = line.slice(0, line.length - trimmed.length);
      tokens.push({ t:'default',   v: leading });
      tokens.push({ t:'decorator', v: trimmed.slice(0, decEnd) });
      const rest = trimmed.slice(decEnd);
      if (rest) tokens.push({ t:'default', v: rest });
      if (li < lines.length - 1) tokens.push({ t:'default', v:'\n' });
      return;
    }
    const ci = line.indexOf('#');
    const cp = ci >= 0 ? line.slice(0, ci) : line;
    const cm = ci >= 0 ? line.slice(ci) : '';
    const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?'''|\b\d+\.?\d*\b|\b\w+\b|[^\w\s]|\s+)/g;
    let m;
    while ((m = re.exec(cp)) !== null) {
      const w = m[0];
      if      (/^\s+$/.test(w))                 tokens.push({ t:'default',  v:w });
      else if (w.startsWith('"""') || w.startsWith("'''") || w[0]==='"' || w[0]==="'")
                                                 tokens.push({ t:'string',   v:w });
      else if (/^\d/.test(w))                   tokens.push({ t:'number',   v:w });
      else if (KW.has(w))                        tokens.push({ t:'keyword',  v:w });
      else if (BT.has(w))                        tokens.push({ t:'builtin',  v:w });
      else if (/^[+\-*/<>=!&|^~%@]+$/.test(w)) tokens.push({ t:'operator', v:w });
      else                                       tokens.push({ t:'default',  v:w });
    }
    if (cm) tokens.push({ t:'comment', v:cm });
    if (li < lines.length - 1) tokens.push({ t:'default', v:'\n' });
  });
  return tokens;
}

const normalizeIndent = (code) => {
  if (!code) return code;
  return code.split('\n').map(line => {
    let sp = 0;
    for (let i = 0; i < line.length; i++) {
      if      (line[i] === ' ')  sp++;
      else if (line[i] === '\t') sp += 4;
      else break;
    }
    return '    '.repeat(Math.round(sp / 4)) + line.trimStart();
  }).join('\n');
};

const autoFixCode = (code) => {
  let fixed = code;
  const fixes = [];
  const normalized = normalizeIndent(code);
  if (normalized !== fixed) { fixed = normalized; fixes.push('✅ Indentation normalized'); }
  fixed = fixed.replace(/^(\s*(?:if|elif|else|for|while|def|class|try|except|finally|with)\b[^\n:]*?)(\s*)\n/gm,
    (match, line, space) => {
      if (!line.trimEnd().endsWith(':')) { fixes.push('✅ Added missing colon'); return line + ':' + space + '\n'; }
      return match;
    });
  const printFixed = fixed.replace(/^(\s*)print\s+(?!\()([^\n]+)/gm, (match, indent, args) => {
    fixes.push('✅ Fixed print statement');
    return `${indent}print(${args.trim()})`;
  });
  if (printFixed !== fixed) fixed = printFixed;
  fixed = fixed.replace(/(\w)(==|!=|<=|>=|\+=|-=|\*=|\/=)(\w)/g, (m, a, op, b) => {
    fixes.push('✅ Added spaces around operator');
    return `${a} ${op} ${b}`;
  });
  const typos = { pritn:'print', prnit:'print', pint:'print', lenght:'len', retrun:'return', retrn:'return' };
  Object.entries(typos).forEach(([typo, correct]) => {
    if (fixed.includes(typo)) { fixed = fixed.replaceAll(typo, correct); fixes.push(`✅ Fixed typo: ${typo} → ${correct}`); }
  });
  return { code: fixed, fixes: fixes.length ? fixes : ['ℹ️ No automatic fixes found'] };
};

// ═══════════════════════════════════════════════
//  Indent Guide Layer
// ═══════════════════════════════════════════════
function calcDepths(code) {
  const raw   = (code || '').split('\n');
  const n     = raw.length;
  const depth = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const line = raw[i];
    if (line.trim() === '') { depth[i] = -1; continue; }
    let sp = 0;
    for (let c = 0; c < line.length; c++) {
      if      (line[c] === ' ')  sp++;
      else if (line[c] === '\t') sp += 4;
      else break;
    }
    depth[i] = Math.floor(sp / 4);
  }
  for (let i = 0; i < n; i++) {
    if (depth[i] !== -1) continue;
    let prev = 0, next = 0;
    for (let j = i - 1; j >= 0; j--) { if (depth[j] !== -1) { prev = depth[j]; break; } }
    for (let j = i + 1; j < n;  j++) { if (depth[j] !== -1) { next = depth[j]; break; } }
    depth[i] = Math.min(prev, next);
  }
  return depth;
}

const IndentGuideLayer = ({ code, fontSize, lineHeight, paddingTop, paddingLeft, scrollTop, scrollLeft }) => {
  const depths  = calcDepths(code);
  const charW   = fontSize * 0.601;
  const indentW = charW * 4;
  const ptNum   = parseInt(paddingTop,  10) || 0;
  const plNum   = parseInt(paddingLeft, 10) || 0;
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, overflow:'hidden', pointerEvents:'none', zIndex:1, transform:`translate(${-scrollLeft}px, ${-scrollTop}px)`, willChange:'transform' }}>
      {depths.map((d, i) => (
        <div key={i} style={{ position:'absolute', top: ptNum + i * lineHeight, left: plNum, height: lineHeight, width: Math.max(d * indentW, 0), pointerEvents:'none' }}>
          {Array.from({ length: d }).map((_, lvl) => (
            <span key={lvl} style={{ position:'absolute', left: lvl * indentW, top:0, bottom:0, width:'1px', background:'rgba(0,0,0,0.13)' }}/>
          ))}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════
//  Code Editor Component
// ═══════════════════════════════════════════════
const CodeEditor = ({ value, onChange, fontSize, isMobile }) => {
  const taRef  = useRef(null);
  const hiRef  = useRef(null);
  const lnRef  = useRef(null);
  const valRef = useRef(value);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });

  useEffect(() => { valRef.current = value; }, [value]);

  const syncScroll = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    if (hiRef.current) { hiRef.current.scrollTop = ta.scrollTop; hiRef.current.scrollLeft = ta.scrollLeft; }
    if (lnRef.current) { lnRef.current.scrollTop = ta.scrollTop; }
    setScroll({ top: ta.scrollTop, left: ta.scrollLeft });
  }, []);

  const handleKeyDown = useCallback((e) => {
    const ta  = taRef.current;
    if (!ta) return;
    const s   = ta.selectionStart, end = ta.selectionEnd, v = valRef.current;
    if (e.key === 'Tab') {
      e.preventDefault();
      onChange(v.slice(0,s) + '    ' + v.slice(end));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 4; });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      const lineText  = v.slice(lineStart, s);
      const leading   = lineText.match(/^(\s*)/)[1].length;
      const extra     = lineText.trimEnd().endsWith(':') ? 4 : 0;
      const indent    = ' '.repeat(leading + extra);
      onChange(v.slice(0,s) + '\n' + indent + v.slice(end));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 1 + indent.length; });
    } else if (e.key === 'Backspace' && s === end) {
      const lineStart   = v.lastIndexOf('\n', s - 1) + 1;
      const beforeCaret = v.slice(lineStart, s);
      if (/^ +$/.test(beforeCaret) && beforeCaret.length % 4 === 0 && beforeCaret.length > 0) {
        e.preventDefault();
        onChange(v.slice(0, s - 4) + v.slice(s));
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s - 4; });
      }
    }
    const pairs = { '(':')', '[':']', '{':'}' };
    if (pairs[e.key] && s === end) {
      e.preventDefault();
      onChange(v.slice(0,s) + e.key + pairs[e.key] + v.slice(end));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 1; });
    }
  }, [onChange]);

  const lineCount    = (value || '').split('\n').length;
  const FONT         = '"Consolas","Courier New",monospace';
  const effectiveFS  = isMobile ? Math.min(fontSize, 12) : fontSize;
  const FS           = `${effectiveFS}px`;
  const LH           = Math.round(effectiveFS * 1.65);
  const LHS          = `${LH}px`;
  const PT           = '10px';
  const PL           = isMobile ? '8px' : '56px';

  const shared = {
    position:'absolute', top:0, left:0, right:0, bottom:0,
    paddingTop:PT, paddingBottom:'40px', paddingLeft:PL, paddingRight:'8px',
    fontFamily:FONT, fontSize:FS, lineHeight:LHS,
    whiteSpace: isMobile ? 'pre-wrap' : 'pre',
    wordBreak: isMobile ? 'break-all' : 'normal',
    overflowX: isMobile ? 'hidden' : 'auto',
    overflowY:'auto', tabSize:4,
  };

  return (
    <div style={{ position:'relative', flex:1, overflow:'hidden', minHeight:0, background:'#ffffff' }}>
      {!isMobile && (
        <IndentGuideLayer code={value} fontSize={effectiveFS} lineHeight={LH} paddingTop={PT} paddingLeft={PL} scrollTop={scroll.top} scrollLeft={scroll.left} />
      )}
      {!isMobile && (
        <div ref={lnRef} aria-hidden="true" style={{ position:'absolute', top:0, left:0, bottom:0, width:'48px', background:'#f8f8f8', borderRight:'1px solid #e0e0e0', overflow:'hidden', pointerEvents:'none', zIndex:4, paddingTop:PT }}>
          {Array.from({ length: lineCount }).map((_,i) => (
            <div key={i} style={{ height:LHS, lineHeight:LHS, textAlign:'right', paddingRight:'10px', fontSize:Math.max(effectiveFS-2,10)+'px', color:'#aaa', fontFamily:FONT, userSelect:'none' }}>
              {i + 1}
            </div>
          ))}
        </div>
      )}
      <div ref={hiRef} aria-hidden="true" style={{ ...shared, pointerEvents:'none', zIndex:2 }}>
        <pre style={{ margin:0, padding:0, whiteSpace: isMobile ? 'pre-wrap' : 'pre', wordBreak: isMobile ? 'break-all' : 'normal', fontFamily:FONT, fontSize:FS, lineHeight:LHS, background:'transparent' }}>
          {value
            ? tokenizePy(value).map((tok,i) => (
                <span key={i} style={{ color: TC[tok.t] || TC.default }}>{tok.v}</span>
              ))
            : <span style={{ color:'#bbb' }}>{'# Write your Python code here...\n# Tab = 4 spaces | Enter after ":" = auto-indent'}</span>
          }
        </pre>
      </div>
      <textarea ref={taRef} value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
        style={{ ...shared, background:'transparent', color:'transparent', caretColor:'#000', border:'none', outline:'none', resize:'none', zIndex:3 }}
      />
    </div>
  );
};

const DEFAULT_CODE = `# Python Compiler 🐍
# Write your Python code below and click Run!

def greet(name):
    message = f"Hello, {name}! Welcome! 🎉"
    return message

students = ["Ali", "Sara", "Ahmed", "Zara"]

for i, student in enumerate(students, 1):
    print(f"{i}. {greet(student)}")

print("\\n✅ Happy Coding! 🚀")
`;

// ═══════════════════════════════════════════════
//  Input Modal — collect all inputs BEFORE running
// ═══════════════════════════════════════════════
const InputModal = ({ prompts, onSubmit, onCancel }) => {
  const [values, setValues] = useState(prompts.map(() => ''));

  const handleSubmit = () => {
    onSubmit(values);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:8, padding:24, width:'min(480px, 92vw)', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin:'0 0 4px', fontSize:16, color:'#0078d4' }}>🖊️ Program needs input</h3>
        <p style={{ margin:'0 0 16px', fontSize:12, color:'#888' }}>Fill all inputs below, then click Run</p>

        {prompts.map((prompt, i) => (
          <div key={i} style={{ marginBottom:12 }}>
            {prompt && <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4, fontFamily:'monospace' }}>{prompt || `Input ${i+1}`}</label>}
            {!prompt && <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:4 }}>Input {i+1}</label>}
            <input
              autoFocus={i === 0}
              value={values[i]}
              onChange={e => {
                const copy = [...values];
                copy[i] = e.target.value;
                setValues(copy);
              }}
              onKeyDown={e => { if (e.key === 'Enter' && i === prompts.length - 1) handleSubmit(); }}
              style={{ width:'100%', padding:'7px 10px', border:'1px solid #ccc', borderRadius:4, fontFamily:'monospace', fontSize:13, outline:'none', boxSizing:'border-box' }}
              placeholder="Type your input..."
            />
          </div>
        ))}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
          <button onClick={onCancel} style={{ padding:'6px 16px', border:'1px solid #ccc', borderRadius:4, background:'#f5f5f5', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={handleSubmit} style={{ padding:'6px 18px', border:'none', borderRadius:4, background:'#0078d4', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}>
            ▶ Run
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  MAIN COMPILER COMPONENT
// ═══════════════════════════════════════════════
const PythonCompiler = ({ initialCode = '', onClose = null }) => {
  const [code,       setCode]       = useState(() => normalizeIndent(initialCode) || DEFAULT_CODE);
  const [output,     setOutput]     = useState('');
  const [status,     setStatus]     = useState('idle');
  const [fixes,      setFixes]      = useState([]);
  const [showFixes,  setShowFixes]  = useState(false);
  const [fontSize,   setFontSize]   = useState(14);
  const [copied,     setCopied]     = useState(false);
  const [isMobile,   setIsMobile]   = useState(window.innerWidth <= 600);
  const [execTime,   setExecTime]   = useState(null);

  // Input modal state
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputPrompts,   setInputPrompts]   = useState([]);
  const [pendingCode,    setPendingCode]     = useState('');

  const outputRef = useRef(null);
  const codeRef   = useRef(code);

  useEffect(() => { codeRef.current = code; }, [code]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // When initialCode prop changes → update editor
  useEffect(() => {
    if (!initialCode || !initialCode.trim()) return;
    const clean = normalizeIndent(initialCode);
    setCode(clean);
    codeRef.current = clean;
    setOutput('');
    setFixes([]);
    setShowFixes(false);
  }, [initialCode]);

  // ── Actually execute code via backend ──
  const executeCode = useCallback(async (codeToRun, stdinStr = '') => {
    setStatus('running');
    setOutput('⟳ Running...');

    const startTime = Date.now();
    try {
      const res = await fetch(`${BACKEND_URL}/run`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: codeToRun, stdin: stdinStr }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      setExecTime(elapsed);

      // ── Format output ──
      let finalOut = '';
      if (data.stdout) finalOut += data.stdout;
      if (data.stderr) finalOut += (finalOut ? '\n' : '') + '❌ Error:\n' + data.stderr;
      if (!finalOut)   finalOut  = '✅ Code ran with no output.';

      setOutput(finalOut);
      setStatus(data.exitCode === 0 ? 'success' : 'error');

    } catch (err) {
      setExecTime(null);
      // Backend not running?
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setOutput(
          '❌ Cannot connect to compiler backend!\n\n' +
          'Please start the backend:\n' +
          '  cd backend\n' +
          '  node server.js\n\n' +
          'Or check if backend is running on port 5000.'
        );
      } else {
        setOutput('❌ Error: ' + err.message);
      }
      setStatus('error');
    }

    setTimeout(() => outputRef.current?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 100);
  }, []);

  // ── Run button handler ──
  const runCode = useCallback(async (codeOverride) => {
    const rawCode = (typeof codeOverride === 'string') ? codeOverride : codeRef.current;
    const toRun   = normalizeIndent(rawCode);
    setCode(toRun);

    const hasInput = /\binput\s*\(/.test(toRun);

    if (hasInput) {
      // Ask backend how many inputs and their prompts
      setStatus('running');
      setOutput('⟳ Checking inputs...');
      try {
        const res = await fetch(`${BACKEND_URL}/check-input`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ code: toRun }),
        });
        const data = await res.json();

        if (data.count > 0) {
          // Show modal to collect inputs
          setInputPrompts(data.prompts.length === data.count ? data.prompts : Array(data.count).fill(''));
          setPendingCode(toRun);
          setStatus('idle');
          setOutput('');
          setShowInputModal(true);
          return;
        }
      } catch {
        // If check fails, just run without stdin
      }
    }

    await executeCode(toRun, '');
  }, [executeCode]);

  // Modal submit
  const handleInputSubmit = useCallback((values) => {
    setShowInputModal(false);
    const stdinStr = values.join('\n') + '\n';
    executeCode(pendingCode, stdinStr);
  }, [pendingCode, executeCode]);

  const handleAutoFix = () => {
    const { code: fixed, fixes: appliedFixes } = autoFixCode(code);
    setCode(fixed);
    setFixes(appliedFixes);
    setShowFixes(true);
    setOutput('');
    setStatus('idle');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([code], { type:'text/plain' }));
    a.download = 'main.py';
    a.click();
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const lineCount = (code || '').split('\n').length;

  const SC = {
    idle:   { color:'#888',    label:'Ready' },
    running:{ color:'#0078d4', label:'Running...' },
    success:{ color:'#107c10', label: execTime ? `Completed ✓  (${execTime}s)` : 'Completed ✓' },
    error:  { color:'#d13438', label:'Error' },
  };
  const sc = SC[status] || SC.idle;

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      position:'fixed', inset:0,
      background:'#ffffff', color:'#1e1e1e',
      fontFamily:'"Segoe UI",system-ui,sans-serif',
      overflow:'hidden', zIndex:9999,
    }}>

      {/* Input Modal */}
      {showInputModal && (
        <InputModal
          prompts={inputPrompts}
          onSubmit={handleInputSubmit}
          onCancel={() => { setShowInputModal(false); setStatus('idle'); setOutput(''); }}
        />
      )}

      {/* ══ TITLE BAR ══ */}
      <div style={{ background:'#f3f3f3', borderBottom:'1px solid #ddd', display:'flex', alignItems:'center', height:'38px', padding:'0 10px', flexShrink:0, userSelect:'none', gap:8 }}>
        <button onClick={handleBack} title="Go back"
          style={{ display:'flex', alignItems:'center', gap:4, background:'#e4e4e4', border:'1px solid #ccc', borderRadius:4, padding:'3px 10px', cursor:'pointer', fontSize:'12px', color:'#333', fontWeight:600 }}
          onMouseEnter={e => e.currentTarget.style.background='#d0d0d0'}
          onMouseLeave={e => e.currentTarget.style.background='#e4e4e4'}>
          ← Back
        </button>
        <div style={{ display:'flex', gap:5, marginLeft:4 }}>
          <span style={{ width:11, height:11, borderRadius:'50%', background:'#ff5f56', display:'inline-block' }}/>
          <span style={{ width:11, height:11, borderRadius:'50%', background:'#ffbd2e', display:'inline-block' }}/>
          <span style={{ width:11, height:11, borderRadius:'50%', background:'#27c93f', display:'inline-block' }}/>
        </div>
        <span style={{ fontSize:'13px', color:'#444', fontWeight:500, marginLeft:6 }}>Python Compiler</span>
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#888', background:'#e8e8e8', padding:'2px 8px', borderRadius:3 }}>
          Python 3.10 · Piston API
        </span>
      </div>

      {/* ══ TAB BAR ══ */}
      <div style={{ display:'flex', alignItems:'center', height:'34px', background:'#ececec', borderBottom:'1px solid #ddd', flexShrink:0, paddingLeft:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'#ffffff', borderTop:'2px solid #0078d4', borderRight:'1px solid #ddd', padding:'0 14px', height:'34px', fontSize:'13px', color:'#333' }}>
          🐍 main.py
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#888', marginLeft:4 }}/>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, paddingRight:10 }}>
          <button onClick={() => setFontSize(f => Math.max(10, f-1))} style={tabBtn}>A-</button>
          <span style={{ fontSize:'11px', color:'#888', minWidth:18, textAlign:'center' }}>{fontSize}</span>
          <button onClick={() => setFontSize(f => Math.min(22, f+1))} style={tabBtn}>A+</button>
        </div>
      </div>

      {/* ══ TOOLBAR ══ */}
      <div className="toolbar-wrap" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:'#f8f8f8', borderBottom:'1px solid #e0e0e0', flexShrink:0, flexWrap:'wrap' }}>
        <button onClick={runCode} disabled={status==='running'}
          style={{ ...toolBtn, background: status==='running' ? '#ccc':'#0078d4', color:'#fff', border:'none', fontWeight:600, padding:'5px 16px', cursor: status==='running' ? 'not-allowed':'pointer' }}>
          {status==='running' ? '⟳ Running...' : '▶  Run (F5)'}
        </button>

        {status === 'error' && (
          <button onClick={handleAutoFix} style={{ ...toolBtn, background:'#fdf0f0', border:'1px solid #f1a0a0', color:'#c0392b', fontWeight:600 }}>
            🔧 Auto Fix
          </button>
        )}

        <button onClick={() => { setCode(normalizeIndent(code)); setFixes(['✅ Indentation fixed!']); setShowFixes(true); }} style={toolBtn}>⇥ Fix Indent</button>
        <button onClick={() => { setCode(''); setOutput(''); setStatus('idle'); setFixes([]); setShowFixes(false); setExecTime(null); }} style={toolBtn}>🗑 Clear</button>
        <button onClick={handleCopy} style={{ ...toolBtn, color: copied ? '#107c10' : '#333' }}>{copied ? '✅ Copied!' : '⎘ Copy'}</button>
        <button onClick={handleDownload} style={toolBtn} className="hide-mobile">↓ .py</button>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:sc.color, display:'inline-block', boxShadow:`0 0 5px ${sc.color}`, animation: status==='running' ? 'pulse 1s ease-in-out infinite':'none' }}/>
          <span style={{ fontSize:'11px', color:sc.color, fontWeight:500 }}>{sc.label}</span>
        </div>
      </div>

      {/* ══ AUTO-FIX BANNER ══ */}
      {showFixes && fixes.length > 0 && (
        <div style={{ background:'#f0fff4', borderBottom:'1px solid #b7ebc8', padding:'5px 12px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', flexShrink:0 }}>
          <span style={{ fontSize:'11px', color:'#107c10', fontWeight:700 }}>🔧 Applied:</span>
          {fixes.map((f,i) => (
            <span key={i} style={{ fontSize:'11px', color:'#1a5c2a', background:'#d4edda', padding:'1px 7px', borderRadius:3 }}>{f}</span>
          ))}
          <button onClick={() => setShowFixes(false)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:13 }}>✕</button>
        </div>
      )}

      {/* ══ MAIN PANE ══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>

        {/* CODE EDITOR — 60% */}
        <div style={{ flex:'0 0 60%', display:'flex', flexDirection:'column', overflow:'hidden', borderBottom:'2px solid #0078d4' }}>
          <CodeEditor value={code} onChange={setCode} fontSize={fontSize} isMobile={isMobile} />
        </div>

        {/* OUTPUT PANEL — 40% */}
        <div ref={outputRef} style={{ flex:'0 0 40%', display:'flex', flexDirection:'column', overflow:'hidden', background:'#fafafa' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 12px', background:'#f0f0f0', borderBottom:'1px solid #ddd', flexShrink:0 }}>
            <span style={{ fontSize:'11px', color:'#555', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Output — Terminal</span>
            {status==='success' && <span style={{ fontSize:'11px', color:'#107c10' }}>● Completed</span>}
            {status==='error'   && <span style={{ fontSize:'11px', color:'#d13438' }}>● Error</span>}
            {status==='running' && <span style={{ fontSize:'11px', color:'#0078d4' }}>● Running...</span>}
            <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
              {output && (
                <button onClick={() => { navigator.clipboard.writeText(output); }}
                  style={{ background:'#e8f4fd', border:'1px solid #b3d9f5', color:'#0078d4', cursor:'pointer', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:3 }}>
                  ⎘ Copy
                </button>
              )}
              <button onClick={() => { setOutput(''); setStatus('idle'); setExecTime(null); }} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:'11px' }}>Clear</button>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'10px 14px', background:'#ffffff', minHeight:0 }}>
            {status === 'running' ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:8 }}>
                <span style={{ animation:'spin 1s linear infinite', display:'inline-block', fontSize:14, color:'#0078d4' }}>⟳</span>
                <span style={{ fontFamily:'monospace', fontSize:13, color:'#666' }}>Executing...</span>
              </div>
            ) : output ? (
              <pre style={{
                margin:0,
                fontFamily:'"Consolas","Courier New",monospace',
                fontSize: isMobile ? '12px' : Math.max(fontSize-1,12)+'px',
                lineHeight:1.65,
                whiteSpace:'pre-wrap',
                wordBreak:'break-word',
                color: status==='error' ? '#d13438' : '#107c10'
              }}>
                {output}
              </pre>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:6 }}>
                <span style={{ fontSize:28, opacity:0.15 }}>▶</span>
                <span style={{ fontFamily:'monospace', fontSize:12, color:'#bbb' }}>Click Run to execute your Python code</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ STATUS BAR ══ */}
      <footer style={{ background:'#0078d4', display:'flex', alignItems:'center', gap:12, padding:'0 12px', height:'22px', flexShrink:0 }}>
        <span style={{ fontSize:'11px', color:'#fff', fontWeight:500 }}>🐍 Python 3.10</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>|</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)' }}>Lines: {lineCount}</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>|</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)' }}>UTF-8</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>|</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)' }}>Spaces: 4</span>
        {execTime && <><span style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>|</span><span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)' }}>⏱ {execTime}s</span></>}
      </footer>

      {/* ══ MOBILE FAB ══ */}
      <button onClick={runCode} disabled={status==='running'} className="fab-run"
        style={{ position:'fixed', bottom:30, right:16, zIndex:99999, width:56, height:56, borderRadius:'50%', background: status==='running' ? '#aaa':'#0078d4', border:'none', color:'#fff', fontSize:24, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,120,212,0.45)', display:'none', alignItems:'center', justifyContent:'center' }}>
        {status === 'running' ? '⟳' : '▶'}
      </button>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar       { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:#f5f5f5; }
        ::-webkit-scrollbar-thumb { background:#d0d0d0; border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:#b0b0b0; }
        @media (max-width: 600px) {
          .fab-run     { display:flex !important; }
          .hide-mobile { display:none !important; }
          .toolbar-wrap { flex-wrap: wrap; gap: 4px !important; padding: 4px 6px !important; }
          .toolbar-wrap button { font-size: 11px !important; padding: 3px 7px !important; }
        }
        button:focus-visible { outline:2px solid #0078d4; }
      `}</style>
    </div>
  );
};

const tabBtn = {
  background:'#e8e8e8', border:'1px solid #ccc', color:'#555',
  borderRadius:3, padding:'2px 7px', fontSize:'11px', cursor:'pointer', fontFamily:'inherit',
};
const toolBtn = {
  background:'#ffffff', border:'1px solid #ccc', color:'#333',
  borderRadius:3, padding:'4px 10px', fontSize:'12px', cursor:'pointer',
  fontFamily:'inherit', whiteSpace:'nowrap', transition:'background 0.12s',
};

export default PythonCompiler;