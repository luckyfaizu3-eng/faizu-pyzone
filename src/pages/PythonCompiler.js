import React, { useState, useRef, useEffect, useCallback } from 'react';

const BACKEND_URL = 'https://faizu-pyzone.onrender.com';

// ═══════════════════════════════════════
//  Dark Theme — VS Code Dark+ Colors
// ═══════════════════════════════════════
const TC = {
  keyword:   '#569cd6',
  builtin:   '#dcdcaa',
  string:    '#ce9178',
  comment:   '#6a9955',
  number:    '#b5cea8',
  operator:  '#d4d4d4',
  decorator: '#c586c0',
  default:   '#d4d4d4',
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
    fixes.push('✅ Fixed print statement'); return `${indent}print(${args.trim()})`;
  });
  if (printFixed !== fixed) fixed = printFixed;
  const typos = { pritn:'print', prnit:'print', pint:'print', lenght:'len', retrun:'return' };
  Object.entries(typos).forEach(([typo, correct]) => {
    if (fixed.includes(typo)) { fixed = fixed.replaceAll(typo, correct); fixes.push(`✅ Fixed typo: ${typo} → ${correct}`); }
  });
  return { code: fixed, fixes: fixes.length ? fixes : ['ℹ️ No automatic fixes found'] };
};

// ═══════════════════════════════════════
//  Code Editor
// ═══════════════════════════════════════
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
    const s = ta.selectionStart, end = ta.selectionEnd, v = valRef.current;
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
    const pairs = { '(':')', '[':']', '{':'}', '"':'"', "'":"'" };
    if (pairs[e.key] && s === end && e.key !== '"' && e.key !== "'") {
      e.preventDefault();
      onChange(v.slice(0,s) + e.key + pairs[e.key] + v.slice(end));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 1; });
    }
  }, [onChange]);

  const lineCount   = (value || '').split('\n').length;
  const FONT        = '"JetBrains Mono","Fira Code","Cascadia Code","Consolas",monospace';
  const effectiveFS = isMobile ? Math.min(fontSize, 13) : fontSize;
  const FS          = `${effectiveFS}px`;
  const LH          = Math.round(effectiveFS * 1.7);
  const LHS         = `${LH}px`;
  const PT          = '12px';
  const PL          = isMobile ? '10px' : '58px';

  const shared = {
    position:'absolute', top:0, left:0, right:0, bottom:0,
    paddingTop:PT, paddingBottom:'40px', paddingLeft:PL, paddingRight:'12px',
    fontFamily:FONT, fontSize:FS, lineHeight:LHS,
    whiteSpace: isMobile ? 'pre-wrap' : 'pre',
    wordBreak: isMobile ? 'break-all' : 'normal',
    overflowX: isMobile ? 'hidden' : 'auto',
    overflowY:'auto', tabSize:4,
  };

  return (
    <div style={{ position:'relative', flex:1, overflow:'hidden', minHeight:0, background:'#1e1e1e' }}>
      {/* Line numbers */}
      {!isMobile && (
        <div ref={lnRef} aria-hidden="true" style={{
          position:'absolute', top:0, left:0, bottom:0, width:'50px',
          background:'#1e1e1e', borderRight:'1px solid #333',
          overflow:'hidden', pointerEvents:'none', zIndex:4, paddingTop:PT
        }}>
          {Array.from({ length: lineCount }).map((_,i) => (
            <div key={i} style={{
              height:LHS, lineHeight:LHS, textAlign:'right', paddingRight:'12px',
              fontSize:Math.max(effectiveFS-2,10)+'px', color:'#5a5a5a',
              fontFamily:FONT, userSelect:'none'
            }}>
              {i + 1}
            </div>
          ))}
        </div>
      )}
      {/* Syntax highlighted layer */}
      <div ref={hiRef} aria-hidden="true" style={{ ...shared, pointerEvents:'none', zIndex:2 }}>
        <pre style={{ margin:0, padding:0, whiteSpace: isMobile ? 'pre-wrap' : 'pre', fontFamily:FONT, fontSize:FS, lineHeight:LHS, background:'transparent' }}>
          {value
            ? tokenizePy(value).map((tok,i) => (
                <span key={i} style={{ color: TC[tok.t] || TC.default }}>{tok.v}</span>
              ))
            : <span style={{ color:'#555' }}>{'# Write your Python code here...\n# Tab = 4 spaces | Enter after ":" = auto-indent'}</span>
          }
        </pre>
      </div>
      {/* Textarea */}
      <textarea ref={taRef} value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
        style={{ ...shared, background:'transparent', color:'transparent', caretColor:'#aeafad', border:'none', outline:'none', resize:'none', zIndex:3 }}
      />
    </div>
  );
};

const DEFAULT_CODE = `# 🐍 Python Compiler — FaizUpyZone
# Write your code and click Run!

def greet(name):
    message = f"Hello, {name}! Welcome! 🎉"
    return message

students = ["Ali", "Sara", "Ahmed", "Zara"]

for i, student in enumerate(students, 1):
    print(f"{i}. {greet(student)}")

print("\\n✅ Happy Coding! 🚀")
`;

// ═══════════════════════════════════════
//  Input Modal
// ═══════════════════════════════════════
const InputModal = ({ prompts, onSubmit, onCancel }) => {
  const [values, setValues] = useState(prompts.map(() => ''));
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#252526', borderRadius:8, padding:28, width:'min(480px, 92vw)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', border:'1px solid #3c3c3c' }}>
        <h3 style={{ margin:'0 0 6px', fontSize:15, color:'#569cd6', fontFamily:'"JetBrains Mono",monospace' }}>🖊️ Input Required</h3>
        <p style={{ margin:'0 0 20px', fontSize:12, color:'#888', fontFamily:'system-ui' }}>Fill all inputs below, then click Run</p>
        {prompts.map((prompt, i) => (
          <div key={i} style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, color:'#dcdcaa', marginBottom:5, fontFamily:'"JetBrains Mono",monospace' }}>
              {prompt || `Input ${i+1}`}
            </label>
            <input
              autoFocus={i === 0}
              value={values[i]}
              onChange={e => { const c = [...values]; c[i] = e.target.value; setValues(c); }}
              onKeyDown={e => { if (e.key === 'Enter' && i === prompts.length - 1) onSubmit(values); }}
              style={{ width:'100%', padding:'8px 12px', background:'#3c3c3c', border:'1px solid #555', borderRadius:4, color:'#d4d4d4', fontFamily:'"JetBrains Mono",monospace', fontSize:13, outline:'none', boxSizing:'border-box' }}
              placeholder="Type your input..."
            />
          </div>
        ))}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
          <button onClick={onCancel} style={{ padding:'7px 18px', border:'1px solid #555', borderRadius:4, background:'#3c3c3c', color:'#d4d4d4', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={() => onSubmit(values)} style={{ padding:'7px 20px', border:'none', borderRadius:4, background:'#0e639c', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13 }}>
            ▶ Run
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
//  MAIN COMPILER
// ═══════════════════════════════════════
const PythonCompiler = ({ initialCode = '', onClose = null }) => {
  const [code,          setCode]          = useState(() => normalizeIndent(initialCode) || DEFAULT_CODE);
  const [output,        setOutput]        = useState('');
  const [status,        setStatus]        = useState('idle');
  const [fixes,         setFixes]         = useState([]);
  const [showFixes,     setShowFixes]     = useState(false);
  const [fontSize,      setFontSize]      = useState(14);
  const [copied,        setCopied]        = useState(false);
  const [isMobile,      setIsMobile]      = useState(window.innerWidth <= 700);
  const [execTime,      setExecTime]      = useState(null);
  const [showInputModal,setShowInputModal]= useState(false);
  const [inputPrompts,  setInputPrompts]  = useState([]);
  const [pendingCode,   setPendingCode]   = useState('');

  const outputRef = useRef(null);
  const codeRef   = useRef(code);

  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!initialCode || !initialCode.trim()) return;
    const clean = normalizeIndent(initialCode);
    setCode(clean); codeRef.current = clean;
    setOutput(''); setFixes([]); setShowFixes(false);
  }, [initialCode]);

  const executeCode = useCallback(async (codeToRun, stdinStr = '') => {
    setStatus('running');
    setOutput('');
    const startTime = Date.now();
    try {
      const res = await fetch(`${BACKEND_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToRun, stdin: stdinStr }),
      });
      const data = await res.json();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      setExecTime(elapsed);
      let finalOut = '';
      if (data.stdout) finalOut += data.stdout;
      if (data.stderr) finalOut += (finalOut ? '\n' : '') + data.stderr;
      if (!finalOut)   finalOut = '✅ Code ran with no output.';
      setOutput(finalOut);
      setStatus(data.exitCode === 0 ? 'success' : 'error');
    } catch (err) {
      setExecTime(null);
      setOutput('❌ Cannot connect to compiler backend!\n\nMake sure backend is running.');
      setStatus('error');
    }
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 100);
  }, []);

  const runCode = useCallback(async (codeOverride) => {
    const rawCode = (typeof codeOverride === 'string') ? codeOverride : codeRef.current;
    const toRun   = normalizeIndent(rawCode);
    setCode(toRun);
    const hasInput = /\binput\s*\(/.test(toRun);
    if (hasInput) {
      setStatus('running'); setOutput('');
      try {
        const res  = await fetch(`${BACKEND_URL}/check-input`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ code: toRun }) });
        const data = await res.json();
        if (data.count > 0) {
          setInputPrompts(data.prompts.length === data.count ? data.prompts : Array(data.count).fill(''));
          setPendingCode(toRun); setStatus('idle'); setOutput('');
          setShowInputModal(true); return;
        }
      } catch {}
    }
    await executeCode(toRun, '');
  }, [executeCode]);

  const handleInputSubmit = useCallback((values) => {
    setShowInputModal(false);
    executeCode(pendingCode, values.join('\n') + '\n');
  }, [pendingCode, executeCode]);

  const handleAutoFix = () => {
    const { code: fixed, fixes: f } = autoFixCode(code);
    setCode(fixed); setFixes(f); setShowFixes(true); setOutput(''); setStatus('idle');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code); setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    if (onClose) onClose();
    else if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  };

  const lineCount = (code || '').split('\n').length;
  const isRunning = status === 'running';

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      position:'fixed', inset:0,
      background:'#1e1e1e', color:'#d4d4d4',
      fontFamily:'"Segoe UI",system-ui,sans-serif',
      overflow:'hidden', zIndex:9999,
    }}>
      {showInputModal && (
        <InputModal prompts={inputPrompts} onSubmit={handleInputSubmit}
          onCancel={() => { setShowInputModal(false); setStatus('idle'); setOutput(''); }} />
      )}

      {/* ══ TITLE BAR ══ */}
      <div style={{ background:'#323233', borderBottom:'1px solid #252526', display:'flex', alignItems:'center', height:'40px', padding:'0 12px', flexShrink:0, userSelect:'none', gap:10 }}>
        <button onClick={handleBack}
          style={{ display:'flex', alignItems:'center', gap:5, background:'#3c3c3c', border:'1px solid #555', borderRadius:4, padding:'4px 12px', cursor:'pointer', fontSize:'12px', color:'#ccc', fontWeight:600 }}
          onMouseEnter={e => e.currentTarget.style.background='#4a4a4a'}
          onMouseLeave={e => e.currentTarget.style.background='#3c3c3c'}>
          ← Back
        </button>
        <div style={{ display:'flex', gap:6, marginLeft:4 }}>
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#ff5f57', display:'inline-block', boxShadow:'0 0 4px #ff5f57' }}/>
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#febc2e', display:'inline-block', boxShadow:'0 0 4px #febc2e' }}/>
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#28c840', display:'inline-block', boxShadow:'0 0 4px #28c840' }}/>
        </div>
        <span style={{ fontSize:'13px', color:'#ccc', fontWeight:600, marginLeft:8, fontFamily:'"JetBrains Mono",monospace' }}>🐍 Python Compiler</span>
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#666', background:'#2d2d2d', padding:'2px 10px', borderRadius:4, border:'1px solid #3c3c3c' }}>
          Python 3.10 · FaizUpyZone
        </span>
      </div>

      {/* ══ TAB BAR ══ */}
      <div style={{ display:'flex', alignItems:'center', height:'35px', background:'#252526', borderBottom:'1px solid #1e1e1e', flexShrink:0, paddingLeft:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#1e1e1e', borderTop:'2px solid #0078d4', padding:'0 16px', height:'35px', fontSize:'13px', color:'#d4d4d4', fontFamily:'"JetBrains Mono",monospace' }}>
          main.py
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#e8c06e', marginLeft:2 }}/>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, paddingRight:12 }}>
          <button onClick={() => setFontSize(f => Math.max(10, f-1))} style={tabBtn}>A-</button>
          <span style={{ fontSize:'11px', color:'#666', minWidth:20, textAlign:'center' }}>{fontSize}</span>
          <button onClick={() => setFontSize(f => Math.min(24, f+1))} style={tabBtn}>A+</button>
        </div>
      </div>

      {/* ══ TOOLBAR ══ */}
      <div className="toolbar-wrap" style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#2d2d2d', borderBottom:'1px solid #1e1e1e', flexShrink:0 }}>
        <button onClick={runCode} disabled={isRunning}
          style={{ ...toolBtn, background: isRunning ? '#555':'#0e639c', color:'#fff', border:'none', fontWeight:700, padding:'6px 18px', cursor: isRunning ? 'not-allowed':'pointer', letterSpacing:'0.3px' }}>
          {isRunning ? '⟳ Running...' : '▶  Run'}
        </button>

        {status === 'error' && (
          <button onClick={handleAutoFix} style={{ ...toolBtn, background:'#3c1f1f', border:'1px solid #6b2b2b', color:'#f48771' }}>
            🔧 Auto Fix
          </button>
        )}

        <button onClick={() => { setCode(normalizeIndent(code)); setFixes(['✅ Indentation fixed!']); setShowFixes(true); }}
          style={toolBtn}>⇥ Indent</button>
        <button onClick={() => { setCode(''); setOutput(''); setStatus('idle'); setFixes([]); setShowFixes(false); setExecTime(null); }}
          style={toolBtn}>🗑 Clear</button>
        <button onClick={handleCopy} style={{ ...toolBtn, color: copied ? '#4ec94e':'#d4d4d4' }}>
          {copied ? '✅ Copied!' : '⎘ Copy'}
        </button>
        <button onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code],{type:'text/plain'})); a.download='main.py'; a.click(); }}
          style={toolBtn} className="hide-mobile">↓ .py</button>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          {execTime && <span style={{ fontSize:'11px', color:'#888' }}>⏱ {execTime}s</span>}
          <span style={{
            width:8, height:8, borderRadius:'50%',
            background: status==='success'?'#4ec94e': status==='error'?'#f44747': status==='running'?'#0078d4':'#555',
            display:'inline-block',
            boxShadow: status==='running' ? '0 0 6px #0078d4' : 'none',
            animation: isRunning ? 'pulse 1s ease-in-out infinite':'none'
          }}/>
          <span style={{ fontSize:'11px', color: status==='success'?'#4ec94e': status==='error'?'#f44747': status==='running'?'#0078d4':'#888', fontWeight:500 }}>
            {status==='success'?'Completed ✓': status==='error'?'Error': status==='running'?'Running...':'Ready'}
          </span>
        </div>
      </div>

      {/* ══ AUTO-FIX BANNER ══ */}
      {showFixes && fixes.length > 0 && (
        <div style={{ background:'#1b3a1b', borderBottom:'1px solid #2d5a2d', padding:'5px 14px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', flexShrink:0 }}>
          <span style={{ fontSize:'11px', color:'#4ec94e', fontWeight:700 }}>🔧 Applied:</span>
          {fixes.map((f,i) => <span key={i} style={{ fontSize:'11px', color:'#89d185', background:'#1e3a1e', padding:'1px 8px', borderRadius:3 }}>{f}</span>)}
          <button onClick={() => setShowFixes(false)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:14 }}>✕</button>
        </div>
      )}

      {/* ══ MAIN PANE ══ */}
      <div style={{ flex:1, display:'flex', flexDirection: isMobile ? 'column':'row', overflow:'hidden', minHeight:0 }}>

        {/* CODE EDITOR — 60% */}
        <div style={{ flex: isMobile ? '0 0 55%' : '0 0 60%', display:'flex', flexDirection:'column', overflow:'hidden', borderRight: isMobile ? 'none':'2px solid #333', borderBottom: isMobile ? '2px solid #333':'none' }}>
          <CodeEditor value={code} onChange={setCode} fontSize={fontSize} isMobile={isMobile} />
        </div>

        {/* OUTPUT PANEL — 40% */}
        <div ref={outputRef} style={{ flex: isMobile ? '0 0 45%' : '0 0 40%', display:'flex', flexDirection:'column', overflow:'hidden', background:'#1e1e1e' }}>
          {/* Output header */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'#252526', borderBottom:'1px solid #1e1e1e', flexShrink:0 }}>
            <span style={{ fontSize:'11px', color:'#888', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'"JetBrains Mono",monospace' }}>Terminal</span>
            {status==='success' && <span style={{ fontSize:'11px', color:'#4ec94e' }}>● Done</span>}
            {status==='error'   && <span style={{ fontSize:'11px', color:'#f44747' }}>● Error</span>}
            {status==='running' && <span style={{ fontSize:'11px', color:'#0078d4' }}>● Running...</span>}
            <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
              {output && <button onClick={() => navigator.clipboard.writeText(output)}
                style={{ background:'#2d2d2d', border:'1px solid #444', color:'#888', cursor:'pointer', fontSize:'11px', padding:'2px 8px', borderRadius:3 }}>⎘</button>}
              <button onClick={() => { setOutput(''); setStatus('idle'); setExecTime(null); }}
                style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:'11px' }}>Clear</button>
            </div>
          </div>

          {/* Output content */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', background:'#1e1e1e', minHeight:0 }}>
            {isRunning ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:8 }}>
                <span style={{ animation:'spin 0.8s linear infinite', display:'inline-block', fontSize:16, color:'#0078d4' }}>⟳</span>
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:13, color:'#666' }}>Executing...</span>
              </div>
            ) : output ? (
              <pre style={{
                margin:0,
                fontFamily:'"JetBrains Mono","Fira Code","Consolas",monospace',
                fontSize: isMobile ? '12px' : Math.max(fontSize-1,12)+'px',
                lineHeight:1.7,
                whiteSpace:'pre-wrap',
                wordBreak:'break-word',
                color: status==='error' ? '#f48771' : '#4ec94e',
              }}>
                {output}
              </pre>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:8, opacity:0.3 }}>
                <span style={{ fontSize:36 }}>▶</span>
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:12, color:'#888' }}>Click Run to execute</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ STATUS BAR ══ */}
      <footer style={{ background:'#0078d4', display:'flex', alignItems:'center', gap:14, padding:'0 14px', height:'22px', flexShrink:0 }}>
        <span style={{ fontSize:'11px', color:'#fff', fontWeight:600 }}>🐍 Python 3.10</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>|</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)' }}>Ln: {lineCount}</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>|</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)' }}>UTF-8</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>|</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)' }}>Spaces: 4</span>
        {execTime && <><span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>|</span><span style={{ fontSize:'11px', color:'rgba(255,255,255,0.85)' }}>⏱ {execTime}s</span></>}
      </footer>

      {/* ══ MOBILE FAB ══ */}
      <button onClick={runCode} disabled={isRunning} className="fab-run"
        style={{ position:'fixed', bottom:28, right:16, zIndex:99999, width:58, height:58, borderRadius:'50%', background: isRunning?'#555':'#0e639c', border:'none', color:'#fff', fontSize:24, cursor:'pointer', boxShadow:'0 4px 20px rgba(0,120,212,0.5)', display:'none', alignItems:'center', justifyContent:'center' }}>
        {isRunning ? '⟳' : '▶'}
      </button>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar       { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#1e1e1e; }
        ::-webkit-scrollbar-thumb { background:#444; border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:#555; }
        @media (max-width: 700px) {
          .fab-run     { display:flex !important; }
          .hide-mobile { display:none !important; }
        }
        button:focus-visible { outline:2px solid #0078d4; }
      `}</style>
    </div>
  );
};

const tabBtn = {
  background:'#3c3c3c', border:'1px solid #555', color:'#888',
  borderRadius:3, padding:'3px 8px', fontSize:'11px', cursor:'pointer', fontFamily:'inherit',
};
const toolBtn = {
  background:'#3c3c3c', border:'1px solid #555', color:'#d4d4d4',
  borderRadius:3, padding:'5px 12px', fontSize:'12px', cursor:'pointer',
  fontFamily:'inherit', whiteSpace:'nowrap', transition:'background 0.1s',
};

export default PythonCompiler;