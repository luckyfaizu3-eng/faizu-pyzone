import React, { useState, useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════
//  Pyodide — Python 3.11 in Browser
// ═══════════════════════════════════════
let _pyodide = null;
let _loading = null;

const getPyodide = (onStatus) => {
  if (_pyodide) return Promise.resolve(_pyodide);
  if (_loading) return _loading;
  _loading = (async () => {
    if (!window.loadPyodide) {
      onStatus('loading');
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    onStatus('starting');
    _pyodide = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/' });
    await _pyodide.loadPackage('micropip');
    onStatus('ready');
    return _pyodide;
  })();
  return _loading;
};

// ═══════════════════════════════════════
//  Tokenizer — Light Theme Colors
// ═══════════════════════════════════════
const KW = new Set(['def','class','import','from','return','if','elif','else','for','while',
  'in','not','and','or','True','False','None','try','except','finally','with','as',
  'pass','break','continue','lambda','yield','async','await','raise','del','global','nonlocal','assert','is']);
const BT = new Set(['print','len','range','type','int','str','float','list','dict','set',
  'tuple','input','open','enumerate','zip','map','filter','sorted','reversed','max','min',
  'sum','abs','round','isinstance','hasattr','getattr','setattr','super','object',
  'bool','bytes','repr','format','vars','dir','id','hex','oct','bin','eval','exec','__name__','__main__']);

const TC = {
  keyword:'#0550ae', builtin:'#8250df', string:'#0a3069',
  comment:'#6e7781', number:'#0550ae', operator:'#24292f',
  decorator:'#8250df', default:'#24292f'
};

function tokenizePy(code) {
  const tokens = [];
  code.split('\n').forEach((line, li, arr) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('@')) {
      const end = trimmed.search(/\s/) > -1 ? trimmed.search(/\s/) : trimmed.length;
      tokens.push({t:'default', v: line.slice(0, line.length - trimmed.length)});
      tokens.push({t:'decorator', v: trimmed.slice(0, end)});
      if (trimmed.slice(end)) tokens.push({t:'default', v: trimmed.slice(end)});
      if (li < arr.length-1) tokens.push({t:'default', v:'\n'});
      return;
    }
    const ci = line.indexOf('#');
    const cp = ci >= 0 ? line.slice(0,ci) : line;
    const cm = ci >= 0 ? line.slice(ci) : '';
    const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?'''|\b\d+\.?\d*\b|\b\w+\b|[^\w\s]|\s+)/g;
    let m;
    while ((m = re.exec(cp)) !== null) {
      const w = m[0];
      if (/^\s+$/.test(w))                     tokens.push({t:'default',  v:w});
      else if (w[0]==='"'||w[0]==="'")          tokens.push({t:'string',   v:w});
      else if (/^\d/.test(w))                   tokens.push({t:'number',   v:w});
      else if (KW.has(w))                       tokens.push({t:'keyword',  v:w});
      else if (BT.has(w))                       tokens.push({t:'builtin',  v:w});
      else if (/^[+\-*/<>=!&|^~%@]+$/.test(w)) tokens.push({t:'operator', v:w});
      else                                      tokens.push({t:'default',  v:w});
    }
    if (cm) tokens.push({t:'comment', v:cm});
    if (li < arr.length-1) tokens.push({t:'default', v:'\n'});
  });
  return tokens;
}

const normalizeIndent = (code) => {
  if (!code) return code;
  return code.split('\n').map(line => {
    let sp = 0;
    for (const ch of line) { if (ch===' ') sp++; else if (ch==='\t') sp+=4; else break; }
    return '    '.repeat(Math.round(sp/4)) + line.trimStart();
  }).join('\n');
};

const detectInputCalls = (code) => {
  const prompts = [];
  const re = /\binput\s*\(\s*(?:f?(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'))?[^)]*\)/g;
  let m;
  while ((m = re.exec(code)) !== null)
    prompts.push((m[1] ?? m[2] ?? '').replace(/\\n/g,'\n').replace(/\\t/g,'\t'));
  return prompts;
};

const autoFixCode = (code) => {
  let fixed = normalizeIndent(code);
  const fixes = fixed !== code ? ['✅ Indentation fixed'] : [];
  const pf = fixed.replace(/^(\s*)print\s+(?!\()([^\n]+)/gm, (_,i,a) => {
    fixes.push('✅ print() fixed'); return `${i}print(${a.trim()})`;
  });
  if (pf !== fixed) fixed = pf;
  return { code: fixed, fixes: fixes.length ? fixes : ['ℹ️ No fixes needed'] };
};

// ═══════════════════════════════════════
//  Code Editor
// ═══════════════════════════════════════
const MONO = '"JetBrains Mono","Fira Code","Cascadia Code","Consolas",monospace';

const CodeEditor = ({ value, onChange, fontSize, isMobile }) => {
  const taRef = useRef(null), hiRef = useRef(null), lnRef = useRef(null);
  const valRef = useRef(value);
  useEffect(() => { valRef.current = value; }, [value]);

  const syncScroll = useCallback(() => {
    const ta = taRef.current; if (!ta) return;
    if (hiRef.current) { hiRef.current.scrollTop=ta.scrollTop; hiRef.current.scrollLeft=ta.scrollLeft; }
    if (lnRef.current) lnRef.current.scrollTop = ta.scrollTop;
  }, []);

  const handleKeyDown = useCallback((e) => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, end = ta.selectionEnd, v = valRef.current;
    if (e.key==='Tab') {
      e.preventDefault();
      onChange(v.slice(0,s)+'    '+v.slice(end));
      requestAnimationFrame(()=>{ ta.selectionStart=ta.selectionEnd=s+4; });
    } else if (e.key==='Enter') {
      e.preventDefault();
      const ls = v.lastIndexOf('\n',s-1)+1;
      const lt = v.slice(ls,s);
      const lead = lt.match(/^(\s*)/)[1].length;
      const extra = lt.trimEnd().endsWith(':') ? 4 : 0;
      const indent = ' '.repeat(lead+extra);
      onChange(v.slice(0,s)+'\n'+indent+v.slice(end));
      requestAnimationFrame(()=>{ ta.selectionStart=ta.selectionEnd=s+1+indent.length; });
    } else if (e.key==='Backspace' && s===end) {
      const ls = v.lastIndexOf('\n',s-1)+1;
      const bc = v.slice(ls,s);
      if (/^ +$/.test(bc) && bc.length%4===0 && bc.length>0) {
        e.preventDefault();
        onChange(v.slice(0,s-4)+v.slice(s));
        requestAnimationFrame(()=>{ ta.selectionStart=ta.selectionEnd=s-4; });
      }
    }
    const pairs={'(':')', '[':']', '{':'}'};
    if (pairs[e.key] && s===end) {
      e.preventDefault();
      onChange(v.slice(0,s)+e.key+pairs[e.key]+v.slice(end));
      requestAnimationFrame(()=>{ ta.selectionStart=ta.selectionEnd=s+1; });
    }
  }, [onChange]);

  const lineCount = (value||'').split('\n').length;
  const FS = `${fontSize}px`, LH = Math.round(fontSize*1.75), LHS = `${LH}px`;
  const PL = isMobile ? '12px' : '52px';
  const shared = {
    position:'absolute',top:0,left:0,right:0,bottom:0,
    paddingTop:'14px',paddingBottom:'40px',paddingLeft:PL,paddingRight:'14px',
    fontFamily:MONO,fontSize:FS,lineHeight:LHS,
    whiteSpace:isMobile?'pre-wrap':'pre',wordBreak:isMobile?'break-all':'normal',
    overflowX:isMobile?'hidden':'auto',overflowY:'auto',tabSize:4,
  };

  return (
    <div style={{position:'relative',flex:1,overflow:'hidden',minHeight:0,background:'#ffffff'}}>
      {!isMobile && (
        <div ref={lnRef} aria-hidden style={{
          position:'absolute',top:0,left:0,bottom:0,width:'44px',
          background:'#f6f8fa',borderRight:'1px solid #e8ecf0',
          overflow:'hidden',pointerEvents:'none',zIndex:4,paddingTop:'14px'
        }}>
          {Array.from({length:lineCount}).map((_,i)=>(
            <div key={i} style={{height:LHS,lineHeight:LHS,textAlign:'right',paddingRight:'10px',fontSize:Math.max(fontSize-2,10)+'px',color:'#c9d1d9',fontFamily:MONO,userSelect:'none'}}>{i+1}</div>
          ))}
        </div>
      )}
      <div ref={hiRef} aria-hidden style={{...shared,pointerEvents:'none',zIndex:2}}>
        <pre style={{margin:0,padding:0,whiteSpace:isMobile?'pre-wrap':'pre',fontFamily:MONO,fontSize:FS,lineHeight:LHS,background:'transparent'}}>
          {value
            ? tokenizePy(value).map((tok,i)=><span key={i} style={{color:TC[tok.t]||TC.default}}>{tok.v}</span>)
            : <span style={{color:'#c9d1d9'}}>{'# Write your Python code here...'}</span>}
        </pre>
      </div>
      <textarea ref={taRef} value={value} onChange={e=>onChange(e.target.value)}
        onScroll={syncScroll} onKeyDown={handleKeyDown}
        spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
        style={{...shared,background:'transparent',color:'transparent',caretColor:'#0550ae',border:'none',outline:'none',resize:'none',zIndex:3}}
      />
    </div>
  );
};

// ═══════════════════════════════════════
//  Terminal — White Theme
// ═══════════════════════════════════════
const Terminal = ({ lines, isWaiting, currentPrompt, onSubmit, onClear }) => {
  const [val, setVal] = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [lines, isWaiting]);
  useEffect(()=>{ if (isWaiting) setTimeout(()=>inputRef.current?.focus(),80); }, [isWaiting, currentPrompt]);

  const submit = () => { if (!isWaiting) return; onSubmit(val); setVal(''); };

  const getStyle = (type) => ({
    output: { color:'#24292f' },
    error:  { color:'#cf222e' },
    input:  { color:'#0550ae', fontWeight:600 },
    prompt: { color:'#6639ba' },
    info:   { color:'#8c959f' },
    success:{ color:'#1a7f37' },
    system: { color:'#0969da' },
  }[type] || { color:'#24292f' });

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0,background:'#ffffff'}}>
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px',fontFamily:MONO,fontSize:13,lineHeight:1.9}}>
        {lines.map((line,i)=>(
          <div key={i} style={{...getStyle(line.type),whiteSpace:'pre-wrap',wordBreak:'break-word',animation:'fadeIn 0.12s ease',display:'flex',alignItems:'flex-start',gap:6}}>
            {line.type==='error'   && <span style={{color:'#cf222e',marginTop:2,flexShrink:0}}>✕</span>}
            {line.type==='success' && <span style={{color:'#1a7f37',marginTop:2,flexShrink:0}}>✓</span>}
            {line.type==='input'   && <span style={{color:'#8c959f',marginTop:2,flexShrink:0}}>›</span>}
            <span>{line.text}</span>
          </div>
        ))}

        {/* Live input line — IDLE style */}
        {isWaiting && (
          <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',marginTop:2}}>
            <span style={{color:'#6639ba',fontFamily:MONO,fontSize:13,whiteSpace:'pre'}}>{currentPrompt}</span>
            <input ref={inputRef} value={val}
              onChange={e=>setVal(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') submit(); }}
              style={{
                flex:1,minWidth:80,background:'transparent',border:'none',outline:'none',
                fontFamily:MONO,fontSize:13,color:'#0550ae',caretColor:'#0550ae',
                lineHeight:1.9,fontWeight:600,
              }}
              autoFocus placeholder="type here..."
            />
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Bottom bar */}
      <div style={{display:'flex',alignItems:'center',padding:'5px 12px',background:'#f6f8fa',borderTop:'1px solid #e8ecf0',gap:8,flexShrink:0}}>
        {isWaiting
          ? <><span style={{fontSize:11,color:'#6639ba',fontFamily:MONO}}>⌨️ Type your input and press Enter</span>
              <button onClick={submit} style={{marginLeft:'auto',padding:'3px 14px',background:'#0969da',border:'none',borderRadius:6,color:'#fff',fontSize:12,cursor:'pointer',fontFamily:MONO,fontWeight:600}}>Enter ↵</button>
            </>
          : <><span style={{fontSize:11,color:'#8c959f',fontFamily:MONO}}>Python 3.11 · Browser · No Server</span>
              <button onClick={onClear} style={{marginLeft:'auto',background:'none',border:'1px solid #e8ecf0',color:'#8c959f',cursor:'pointer',fontSize:11,padding:'2px 10px',borderRadius:4,fontFamily:MONO}}>Clear</button>
            </>
        }
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
//  Default Code
// ═══════════════════════════════════════
const DEFAULT_CODE = `# 🐍 Python Compiler — FaizUpyZone
# Runs 100% in your browser — No server!

def greet(name):
    return f"Hello, {name}! Welcome 🎉"

students = ["Ali", "Sara", "Ahmed", "Zara"]
for i, student in enumerate(students, 1):
    print(f"{i}. {greet(student)}")

print("\\n✅ Happy Coding! 🚀")
`;

// ═══════════════════════════════════════
//  Main Compiler
// ═══════════════════════════════════════
const PythonCompiler = ({ initialCode='', onClose=null }) => {
  const [code,       setCode]      = useState(()=>normalizeIndent(initialCode)||DEFAULT_CODE);
  const [status,     setStatus]    = useState('booting');
  const [termLines,  setTermLines] = useState([]);
  const [isWaiting,  setIsWaiting] = useState(false);
  const [curPrompt,  setCurPrompt] = useState('');
  const [inputQueue, setInputQueue]= useState([]);
  const [inputIdx,   setInputIdx]  = useState(0);
  const [allPrompts, setAllPrompts]= useState([]);
  const [pendingCode,setPending]   = useState('');
  const [fixes,      setFixes]     = useState([]);
  const [showFixes,  setShowFixes] = useState(false);
  const [fontSize,   setFontSize]  = useState(14);
  const [copied,     setCopied]    = useState(false);
  const [isMobile,   setIsMobile]  = useState(window.innerWidth<=768);
  const [execTime,   setExecTime]  = useState(null);
  const [pyReady,    setPyReady]   = useState(false);
  const [bootMsg,    setBootMsg]   = useState('Loading Python...');

  const codeRef = useRef(code);
  useEffect(()=>{ codeRef.current=code; },[code]);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener('resize',h); return ()=>window.removeEventListener('resize',h);
  },[]);

  useEffect(()=>{
    getPyodide((s)=>{
      if(s==='loading')  setBootMsg('📦 Downloading Python (one time ~10MB)...');
      if(s==='starting') setBootMsg('🐍 Starting Python 3.11...');
    }).then(()=>{
      setPyReady(true); setStatus('idle');
      setTermLines([
        {type:'system', text:'🐍 Python 3.11 — Browser Engine (Pyodide)'},
        {type:'system', text:'⚡ No server · No API · 100% Free · Unlimited'},
        {type:'info',   text:'\nClick ▶ Run to execute your code!\n'},
      ]);
    }).catch(err=>{
      setStatus('error');
      setTermLines([{type:'error', text:`❌ Failed to load Python: ${err.message}`}]);
    });
  },[]);

  const addLines = (nl) => setTermLines(prev=>[...prev,...nl]);

  const resetTerminal = () => {
    setIsWaiting(false); setCurPrompt('');
    setInputQueue([]); setInputIdx(0);
    setAllPrompts([]); setPending(''); setExecTime(null);
  };

  const doExecute = useCallback(async (codeToRun, stdinArr) => {
    setStatus('running');
    const t0 = Date.now();
    try {
      const py = await getPyodide(()=>{});
      py.globals.set('_stdin_data', py.toPy(stdinArr));

      py.runPython(`
import sys, io, builtins

_out = []; _err = []
_sin = list(_stdin_data); _si = 0

class _W(io.TextIOBase):
    def __init__(self,b): self._b=b
    def write(self,s): self._b.append(str(s)); return len(s)
    def flush(self): pass

class _R(io.TextIOBase):
    def readline(self):
        global _si
        if _si<len(_sin): v=_sin[_si]; _si+=1; return str(v)+'\\n'
        return ''

sys.stdout=_W(_out); sys.stderr=_W(_err); sys.stdin=_R()

def _inp(prompt=''):
    if prompt: sys.stdout.write(str(prompt)); sys.stdout.flush()
    return sys.stdin.readline().rstrip('\\n')

builtins.input=_inp
`);

      let hasError = false, errMsg = '';
      try { py.runPython(codeToRun); }
      catch(e) { hasError=true; errMsg=String(e).replace(/^PythonError:\s*/,''); }

      const elapsed = ((Date.now()-t0)/1000).toFixed(2);
      setExecTime(elapsed);

      const fullOut = py.globals.get('_out').toJs().join('');
      const fullErr = py.globals.get('_err').toJs().join('') + (hasError?errMsg:'');

      const newLines = [];
      if (fullOut) {
        const parts = fullOut.split('\n');
        parts.forEach((part,i)=>{ if(i<parts.length-1||part) newLines.push({type:'output',text:part}); });
      }
      if (fullErr) fullErr.split('\n').forEach(ln=>{ if(ln) newLines.push({type:'error',text:ln}); });
      if (!fullOut&&!fullErr) newLines.push({type:'success',text:'✅ Ran successfully (no output)'});
      newLines.push({type:'info',text:`\n⏱ Done in ${elapsed}s`});

      addLines(newLines);
      setStatus(hasError||fullErr?'error':'success');
    } catch(err) {
      addLines([{type:'error',text:`❌ ${err.message}`}]);
      setStatus('error');
    }
    setIsWaiting(false);
  },[]);

  const runCode = useCallback(async (codeOverride) => {
    const raw = typeof codeOverride==='string' ? codeOverride : codeRef.current;
    const toRun = normalizeIndent(raw);
    setCode(toRun); codeRef.current=toRun;
    resetTerminal();
    setTermLines([{type:'info',text:'⚡ Running...'}]);

    const prompts = detectInputCalls(toRun);
    if (prompts.length>0) {
      setPending(toRun); setAllPrompts(prompts); setInputIdx(0); setInputQueue([]);
      setTermLines([]);
      setCurPrompt(prompts[0]);
      setIsWaiting(true); setStatus('waiting');
    } else {
      await doExecute(toRun,[]);
    }
  },[doExecute]);

  const handleInput = useCallback((val) => {
    addLines([{type:'prompt', text:(curPrompt||'')+val}]);
    const newQueue=[...inputQueue,val];
    setInputQueue(newQueue);
    const nextIdx=inputIdx+1;
    if (nextIdx<allPrompts.length) {
      setInputIdx(nextIdx); setCurPrompt(allPrompts[nextIdx]);
    } else {
      setIsWaiting(false); setCurPrompt('');
      addLines([{type:'info',text:'⚡ Running...'}]);
      doExecute(pendingCode,newQueue);
    }
  },[curPrompt,inputQueue,inputIdx,allPrompts,pendingCode,doExecute]);

  const handleAutoFix = () => {
    const {code:fixed,fixes:f}=autoFixCode(code);
    setCode(fixed); setFixes(f); setShowFixes(true);
    resetTerminal();
    setTermLines([{type:'system',text:'🔧 Auto-fixed! Click Run to execute.'}]);
  };

  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const handleBack = () => { if (onClose) onClose(); else if (window.history.length>1) window.history.back(); else window.location.href='/'; };
  const handleClear = () => {
    resetTerminal(); setStatus('idle');
    setTermLines([{type:'system',text:'🐍 Python 3.11 — Ready'},{type:'info',text:'Click ▶ Run!\n'}]);
  };

  const lineCount = (code||'').split('\n').length;
  const canRun = pyReady && status!=='running' && status!=='waiting' && status!=='booting';
  const isRunning = status==='running';

  const sColor = {
    idle:'#0969da',booting:'#d97706',running:'#0969da',
    waiting:'#6639ba',success:'#1a7f37',error:'#cf222e'
  }[status]||'#0969da';
  const sLabel = {
    idle:'Ready',booting:'Loading...',running:'Running...',
    waiting:'Waiting for input',success:'Done ✓',error:'Error'
  }[status]||'Ready';

  return (
    <div style={{display:'flex',flexDirection:'column',position:'fixed',inset:0,background:'#ffffff',fontFamily:'"Segoe UI",system-ui,sans-serif',overflow:'hidden',zIndex:9999,color:'#24292f'}}>

      {/* BOOT OVERLAY */}
      {status==='booting' && (
        <div style={{position:'absolute',inset:0,background:'#ffffff',zIndex:99999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20}}>
          <div style={{fontSize:52,animation:'bounce 1s ease infinite'}}>🐍</div>
          <div style={{fontSize:15,color:'#0969da',fontFamily:MONO,fontWeight:600}}>{bootMsg}</div>
          <div style={{fontSize:12,color:'#8c959f',fontFamily:MONO}}>First load only — then instant!</div>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:9,height:9,borderRadius:'50%',background:'#0969da',animation:`bounce 0.7s ease ${i*0.15}s infinite`}}/>
            ))}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:'#ffffff',borderBottom:'1px solid #e8ecf0',display:'flex',alignItems:'center',height:isMobile?'50px':'44px',padding:'0 12px',flexShrink:0,gap:8,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
        <button onClick={handleBack}
          style={{background:'#f6f8fa',border:'1px solid #e8ecf0',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontSize:'12px',color:'#57606a',fontWeight:600,transition:'all 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='#eaeef2';e.currentTarget.style.borderColor='#0969da';e.currentTarget.style.color='#0969da';}}
          onMouseLeave={e=>{e.currentTarget.style.background='#f6f8fa';e.currentTarget.style.borderColor='#e8ecf0';e.currentTarget.style.color='#57606a';}}>
          ← Back
        </button>

        {!isMobile && (
          <div style={{display:'flex',gap:5,marginLeft:4}}>
            {['#ff5f57','#febc2e','#28c840'].map((c,i)=><span key={i} style={{width:11,height:11,borderRadius:'50%',background:c,display:'inline-block'}}/>)}
          </div>
        )}

        <span style={{fontSize:isMobile?'13px':'14px',color:'#24292f',fontWeight:700,marginLeft:4}}>🐍 Python Compiler</span>

        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          {!isMobile && (
            <span style={{fontSize:'11px',color:'#0969da',fontWeight:600,background:'#ddf4ff',padding:'2px 10px',borderRadius:20,border:'1px solid #b6e3ff',fontFamily:MONO}}>
              ⚡ Browser Engine
            </span>
          )}
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:sColor,display:'inline-block',boxShadow:`0 0 0 2px ${sColor}33`,animation:isRunning||status==='waiting'?'pulse 1s ease infinite':'none'}}/>
            <span style={{fontSize:'11px',color:sColor,fontWeight:600,fontFamily:MONO}}>{sLabel}</span>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{display:'flex',alignItems:'center',height:'32px',background:'#f6f8fa',borderBottom:'1px solid #e8ecf0',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:6,background:'#ffffff',borderTop:'2px solid #0969da',padding:'0 14px',height:'32px',fontSize:'12px',color:'#57606a',fontFamily:MONO}}>
          main.py <span style={{width:5,height:5,borderRadius:'50%',background:'#f0883e',marginLeft:5,display:'inline-block'}}/>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,paddingRight:10}}>
          <button onClick={()=>setFontSize(f=>Math.max(10,f-1))} style={S.tabBtn}>A-</button>
          <span style={{fontSize:'10px',color:'#8c959f',minWidth:18,textAlign:'center',fontFamily:MONO}}>{fontSize}</span>
          <button onClick={()=>setFontSize(f=>Math.min(22,f+1))} style={S.tabBtn}>A+</button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{display:'flex',alignItems:'center',gap:isMobile?4:6,padding:isMobile?'6px 8px':'6px 12px',background:'#ffffff',borderBottom:'1px solid #e8ecf0',flexShrink:0}}>
        <button onClick={runCode} disabled={!canRun}
          style={{
            background:canRun?'#0969da':'#f6f8fa',border:'none',
            color:canRun?'#ffffff':'#8c959f',borderRadius:8,
            padding:isMobile?'8px 16px':'6px 20px',fontSize:'13px',fontWeight:700,
            cursor:canRun?'pointer':'not-allowed',fontFamily:'inherit',whiteSpace:'nowrap',
            boxShadow:canRun?'0 2px 8px rgba(9,105,218,0.3)':'none',
            transition:'all 0.15s',flexShrink:0,
          }}
          onMouseEnter={e=>{ if(canRun) e.currentTarget.style.background='#0860ca'; }}
          onMouseLeave={e=>{ if(canRun) e.currentTarget.style.background='#0969da'; }}>
          {isRunning ? '⟳ Running...' : '▶  Run'}
        </button>

        {status==='error' && (
          <button onClick={handleAutoFix} style={{...S.toolBtn,color:'#cf222e',borderColor:'#ffa198',background:'#ffebe9',flexShrink:0}}>🔧 Fix</button>
        )}

        <button onClick={()=>setCode(normalizeIndent(code))} style={{...S.toolBtn,flexShrink:0}}>⇥ Indent</button>
        <button onClick={()=>{setCode('');handleClear();}} style={{...S.toolBtn,flexShrink:0}}>🗑 Clear</button>
        <button onClick={handleCopy} style={{...S.toolBtn,color:copied?'#1a7f37':'#57606a',flexShrink:0}}>{copied?'✅ Copied':'⎘ Copy'}</button>
        {!isMobile && (
          <button onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code],{type:'text/plain'}));a.download='main.py';a.click();}} style={{...S.toolBtn,flexShrink:0}}>↓ .py</button>
        )}
        {execTime && <span style={{marginLeft:'auto',fontSize:'11px',color:'#8c959f',fontFamily:MONO,flexShrink:0}}>⏱ {execTime}s</span>}
      </div>

      {/* FIX BANNER */}
      {showFixes && fixes.length>0 && (
        <div style={{background:'#dafbe1',borderBottom:'1px solid #aceebb',padding:'4px 14px',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',flexShrink:0}}>
          {fixes.map((f,i)=><span key={i} style={{fontSize:'11px',color:'#1a7f37',fontFamily:MONO}}>{f}</span>)}
          <button onClick={()=>setShowFixes(false)} style={{marginLeft:'auto',background:'none',border:'none',color:'#8c959f',cursor:'pointer',fontSize:14}}>✕</button>
        </div>
      )}

      {/* MAIN PANE */}
      <div style={{flex:1,display:'flex',flexDirection:isMobile?'column':'row',overflow:'hidden',minHeight:0}}>

        {/* EDITOR */}
        <div style={{
          flex:isMobile?'0 0 50%':'0 0 58%',
          display:'flex',flexDirection:'column',overflow:'hidden',
          borderRight:isMobile?'none':'1px solid #e8ecf0',
          borderBottom:isMobile?'1px solid #e8ecf0':'none',
          background:'#ffffff',
        }}>
          <CodeEditor value={code} onChange={setCode} fontSize={fontSize} isMobile={isMobile}/>
        </div>

        {/* TERMINAL */}
        <div style={{flex:isMobile?'0 0 50%':'0 0 42%',display:'flex',flexDirection:'column',overflow:'hidden',background:'#ffffff'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',background:'#f6f8fa',borderBottom:'1px solid #e8ecf0',flexShrink:0}}>
            <span style={{fontSize:'10px',color:'#57606a',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:MONO}}>
              {status==='waiting'?'⌨️ Input':'Output'}
            </span>
            {status==='waiting' && <span style={{fontSize:'10px',color:'#6639ba',animation:'pulse 1s ease infinite'}}>● Waiting for input</span>}
            {status==='success' && <span style={{fontSize:'10px',color:'#1a7f37'}}>● Done</span>}
            {status==='error'   && <span style={{fontSize:'10px',color:'#cf222e'}}>● Error</span>}
            {isRunning          && <span style={{fontSize:'10px',color:'#0969da',animation:'pulse 0.8s ease infinite'}}>● Running</span>}
          </div>
          <Terminal lines={termLines} isWaiting={isWaiting} currentPrompt={curPrompt} onSubmit={handleInput} onClear={handleClear}/>
        </div>
      </div>

      {/* STATUS BAR */}
      <footer style={{background:'#0969da',display:'flex',alignItems:'center',gap:12,padding:'0 14px',height:'22px',flexShrink:0}}>
        <span style={{fontSize:'10px',color:'#ffffff',fontWeight:700,fontFamily:MONO}}>🐍 Python 3.11</span>
        <span style={{fontSize:'10px',color:'rgba(255,255,255,0.4)'}}>|</span>
        <span style={{fontSize:'10px',color:'rgba(255,255,255,0.85)',fontFamily:MONO}}>Ln {lineCount}</span>
        <span style={{fontSize:'10px',color:'rgba(255,255,255,0.4)'}}>|</span>
        <span style={{fontSize:'10px',color:'rgba(255,255,255,0.85)',fontFamily:MONO}}>UTF-8</span>
        {execTime && <><span style={{fontSize:'10px',color:'rgba(255,255,255,0.4)'}}>|</span><span style={{fontSize:'10px',color:'rgba(255,255,255,0.85)',fontFamily:MONO}}>⏱ {execTime}s</span></>}
        <span style={{marginLeft:'auto',fontSize:'10px',color:'rgba(255,255,255,0.6)',fontFamily:MONO}}>No Server · No API · Runs in Browser</span>
      </footer>

      {/* MOBILE FAB */}
      {isMobile && (
        <button onClick={runCode} disabled={!canRun}
          style={{position:'fixed',bottom:24,right:16,zIndex:99999,width:56,height:56,borderRadius:'50%',
            background:canRun?'#0969da':'#e8ecf0',border:'none',color:canRun?'#fff':'#8c959f',
            fontSize:22,cursor:'pointer',boxShadow:canRun?'0 4px 16px rgba(9,105,218,0.4)':'none',
            display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
          {isRunning?'⟳':'▶'}
        </button>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(2px)} to{opacity:1;transform:none} }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#f6f8fa}
        ::-webkit-scrollbar-thumb{background:#d0d7de;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#b1bac4}
        button:focus-visible{outline:2px solid #0969da;outline-offset:2px}
        textarea{-webkit-tap-highlight-color:transparent}
      `}</style>
    </div>
  );
};

// ── Styles
const S = {
  tabBtn: {background:'#f6f8fa',border:'1px solid #e8ecf0',color:'#57606a',borderRadius:4,padding:'2px 7px',fontSize:'10px',cursor:'pointer',fontFamily:'inherit'},
  toolBtn: {background:'#f6f8fa',border:'1px solid #e8ecf0',color:'#57606a',borderRadius:6,padding:'5px 10px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'all 0.15s'},
};

export default PythonCompiler;