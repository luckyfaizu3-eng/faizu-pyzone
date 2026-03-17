import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════
//  VS CODE LIGHT THEME
// ═══════════════════════════════════════
const VS = {
  bg:'#ffffff', bg2:'#f3f3f3', bg3:'#ebebeb', bg4:'#e0e0e0',
  border:'#e4e4e4', text:'#1f1f1f', textDim:'#6e7681', textMute:'#c0c0c0',
  accent:'#0066b8', accentBg:'#dbeafe', green:'#1a7f37', greenBg:'#dcfce7',
  yellow:'#795e26', orange:'#a31515', red:'#cd3131', redBg:'#fef2f2',
  purple:'#6f42c1', blue:'#0451a5', comment:'#008000', string:'#a31515',
  number:'#098658', keyword:'#0000ff', builtin:'#795e26',
  mono:'"JetBrains Mono","Fira Code","Consolas",monospace',
};

// ═══════════════════════════════════════
//  ✅ LAZY PYODIDE — load only on first Run
//     UI opens instantly, no blocking
// ═══════════════════════════════════════
let _pyodide = null;
let _pyodideLoading = null;
let _pyodideReady = false;

const loadPyodideLazy = (onStatus) => {
  // Already ready — instant
  if (_pyodideReady && _pyodide) {
    onStatus('ready');
    return Promise.resolve(_pyodide);
  }
  // Already loading — attach to existing promise
  if (_pyodideLoading) {
    return _pyodideLoading;
  }
  // Start loading
  _pyodideLoading = (async () => {
    onStatus('downloading');
    // Load script only if not already present
    if (!window.loadPyodide) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    onStatus('starting');
    _pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/',
    });
    onStatus('packages');
    // Load only essential packages (micropip only, skip heavy ones upfront)
    try {
      await _pyodide.loadPackage(['micropip']);
    } catch (_) {}
    _pyodideReady = true;
    onStatus('ready');
    return _pyodide;
  })();
  return _pyodideLoading;
};

// ═══════════════════════════════════════
//  LANGUAGES
// ═══════════════════════════════════════
const LANGS = {
  python:    { label:'Python',     icon:'🐍', ext:'py',   file:'main.py',    runner:'python' },
  javascript:{ label:'JavaScript', icon:'🟨', ext:'js',   file:'main.js',    runner:'js' },
  html:      { label:'HTML/CSS',   icon:'🌐', ext:'html', file:'index.html', runner:'html' },
  csharp:    { label:'C#',         icon:'💜', ext:'cs',   file:'Program.cs', runner:'ai' },
  java:      { label:'Java',       icon:'☕', ext:'java', file:'Main.java',  runner:'ai' },
  cpp:       { label:'C++',        icon:'⚡', ext:'cpp',  file:'main.cpp',   runner:'ai' },
  sql:       { label:'SQL',        icon:'🗄️', ext:'sql',  file:'query.sql',  runner:'ai' },
};

const detectLang = (code) => {
  if (!code || !code.trim()) return null;
  const c = code.trim();
  if (/^\s*<!DOCTYPE|^\s*<html/i.test(c))                   return 'html';
  if (/^\s*<(div|p|h[1-6]|span|body)/i.test(c))             return 'html';
  if (/using System|Console\.Write|namespace\s+\w/m.test(c)) return 'csharp';
  if (/public\s+class\s+\w+|System\.out\.print/m.test(c))   return 'java';
  if (/#include\s*<|cout\s*<<|int\s+main\s*\(/m.test(c))    return 'cpp';
  if (/SELECT\s+|CREATE\s+TABLE|INSERT\s+INTO/im.test(c))   return 'sql';
  if (/console\.log|const\s+\w+\s*=|let\s+\w+|=>/m.test(c))return 'javascript';
  return null;
};

// ═══════════════════════════════════════
//  CODE SAMPLES
// ═══════════════════════════════════════
const SAMPLES = {
python:`# 🐍 Python Compiler — runs in browser!
print("Hello, PySkill! 🎉")

numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print(f"Sum: {total}")
print(f"Average: {total / len(numbers)}")

for i, n in enumerate(numbers, 1):
    print(f"  {i}. {n} squared = {n**2}")

print("\\n✅ Done!")
`,
javascript:`// 🟨 JavaScript
const greet = name => \`Hello, \${name}! 👋\`;
['Ali','Sara','Ahmed'].forEach((s,i)=>{
  console.log(\`\${i+1}. \${greet(s)}\`);
});
const squares = [1,2,3,4,5].map(x=>x**2);
console.log('Squares:', squares);
`,
html:`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>PySkill</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0}
    .card{background:white;border-radius:20px;padding:40px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
    h1{color:#667eea;margin:0 0 10px}
    button{background:#667eea;color:white;border:none;padding:12px 28px;border-radius:10px;cursor:pointer;font-size:16px;font-weight:bold}
  </style>
</head>
<body>
  <div class="card">
    <h1>🎉 Hello World!</h1>
    <p>Built with PySkill Compiler</p>
    <button onclick="this.textContent='Clicked! 🚀'">Click Me!</button>
  </div>
</body>
</html>`,
csharp:`// 💜 C# — AI simulates output
using System;
class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        for(int i=1;i<=5;i++) Console.WriteLine($"  {i}. value={i*i}");
    }
}`,
java:`// ☕ Java — AI simulates output
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        for(int i=1;i<=5;i++) System.out.println("  "+i+". value="+(i*i));
    }
}`,
cpp:`// ⚡ C++ — AI simulates output
#include<iostream>
using namespace std;
int main(){
    cout<<"Hello, World!"<<endl;
    for(int i=1;i<=5;i++) cout<<"  "<<i<<". value="<<i*i<<endl;
    return 0;
}`,
sql:`-- 🗄️ SQL — AI simulates output
CREATE TABLE students(id INTEGER PRIMARY KEY,name TEXT,marks INTEGER);
INSERT INTO students VALUES(1,'Ali',95),(2,'Sara',88),(3,'Ahmed',92);
SELECT name,marks FROM students WHERE marks>90 ORDER BY marks DESC;`,
};

// ═══════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════
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
  while ((m = re.exec(code)) !== null) prompts.push((m[1]??m[2]??'').replace(/\\n/g,'\n'));
  return prompts;
};

// ═══════════════════════════════════════
//  TOKENIZERS
// ═══════════════════════════════════════
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const PY_KW = new Set(['def','class','import','from','return','if','elif','else','for','while','in','not','and','or','True','False','None','try','except','finally','with','as','pass','break','continue','lambda','yield','async','await','raise','del','global','nonlocal','assert','is']);
const PY_BT = new Set(['print','len','range','type','int','str','float','list','dict','set','tuple','input','open','enumerate','zip','map','filter','sorted','reversed','max','min','sum','abs','round','isinstance','hasattr','getattr','setattr','super','object','bool','bytes','repr','format','vars','dir','id','hex','oct','bin','eval','exec','any','all','next','iter']);

function tokenizePy(code) {
  let h='';
  code.split('\n').forEach((line,li,arr)=>{
    const ci=line.indexOf('#'),cp=ci>=0?line.slice(0,ci):line,cm=ci>=0?line.slice(ci):'';
    const re=/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+\.?\d*\b|\b\w+\b|[^\w\s]|\s+)/g;
    let mt;
    while((mt=re.exec(cp))!==null){
      const w=mt[0],e=esc(w);
      if(/^\s+$/.test(w))              {h+=e;continue;}
      if(w[0]==='"'||w[0]==="'")       {h+=`<span style="color:${VS.string}">${e}</span>`;continue;}
      if(/^\d/.test(w))                {h+=`<span style="color:${VS.number}">${e}</span>`;continue;}
      if(PY_KW.has(w))                 {h+=`<span style="color:${VS.keyword};font-weight:600">${e}</span>`;continue;}
      if(PY_BT.has(w))                 {h+=`<span style="color:${VS.builtin}">${e}</span>`;continue;}
      h+=e;
    }
    if(cm) h+=`<span style="color:${VS.comment}">${esc(cm)}</span>`;
    if(li<arr.length-1) h+='\n';
  });
  return h;
}

const JS_KW = new Set(['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','new','class','extends','import','export','default','async','await','try','catch','finally','throw','typeof','instanceof','in','of','null','undefined','true','false','this','super','yield','delete','void','static']);
const CS_KW = new Set(['using','namespace','class','public','private','protected','static','void','int','string','bool','double','float','var','new','return','if','else','for','foreach','while','do','switch','case','break','continue','try','catch','finally','throw','true','false','null','this','base','override','virtual','abstract','sealed','readonly','const']);
const CPP_KW = new Set(['int','float','double','char','bool','void','string','auto','const','static','return','if','else','for','while','do','switch','case','break','continue','class','struct','public','private','protected','new','delete','namespace','using','include','template','try','catch','throw','true','false','nullptr','this','virtual','override']);

function tokenizeGen(code, kwSet) {
  let h='';
  code.split('\n').forEach((line,li,arr)=>{
    const ci=line.indexOf('//'),cp=ci>=0?line.slice(0,ci):line,cm=ci>=0?line.slice(ci):'';
    const re=/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+\.?\d*\b|\b\w+\b|[^\w\s]|\s+)/g;
    let mt;
    while((mt=re.exec(cp))!==null){
      const w=mt[0],e=esc(w);
      if(/^\s+$/.test(w))                    {h+=e;continue;}
      if(w[0]==='"'||w[0]==="'"||w[0]==='`') {h+=`<span style="color:${VS.string}">${e}</span>`;continue;}
      if(/^\d/.test(w))                       {h+=`<span style="color:${VS.number}">${e}</span>`;continue;}
      if(kwSet.has(w))                        {h+=`<span style="color:${VS.keyword};font-weight:600">${e}</span>`;continue;}
      h+=e;
    }
    if(cm) h+=`<span style="color:${VS.comment}">${esc(cm)}</span>`;
    if(li<arr.length-1) h+='\n';
  });
  return h;
}

const getHL = (lang) => {
  if (lang==='python')      return c => tokenizePy(c);
  if (lang==='javascript')  return c => tokenizeGen(c, JS_KW);
  if (lang==='csharp'||lang==='java') return c => tokenizeGen(c, CS_KW);
  if (lang==='cpp')         return c => tokenizeGen(c, CPP_KW);
  return c => esc(c);
};

// ═══════════════════════════════════════
//  AI FIX
// ═══════════════════════════════════════
const AI_URL = 'https://white-limit-e2fe.luckyfaizu3.workers.dev/chat';

const aiAutoFix = async (code, lang) => {
  try {
    const resp = await fetch(AI_URL, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ messages:[
        {role:'system',content:`You are a ${lang} code fixer. Return ONLY the fixed raw code. No explanation, no markdown, no backticks.`},
        {role:'user',content:`Fix:\n\n${code}`}
      ], max_tokens:1500, temperature:0.1 })
    });
    if (!resp.ok) throw new Error();
    const reader=resp.body.getReader(), decoder=new TextDecoder();
    let result='',leftover='';
    while(true){
      const{done,value}=await reader.read(); if(done) break;
      const chunk=leftover+decoder.decode(value,{stream:true});
      const lines=chunk.split('\n'); leftover=lines.pop()||'';
      for(const l of lines){
        const t=l.trim(); if(!t.startsWith('data: ')) continue;
        const d=t.slice(6).trim(); if(d==='[DONE]'||!d) continue;
        try{const p=JSON.parse(d);const delta=p.choices?.[0]?.delta?.content;if(delta)result+=delta;}catch{}
      }
    }
    result=result.trim().replace(/^```[\w]*\n?/,'').replace(/\n?```$/,'').trim();
    return result||null;
  } catch { return null; }
};

// ═══════════════════════════════════════
//  CODE EDITOR
// ═══════════════════════════════════════
const CodeEditor = ({ value, onChange, lang, fontSize, isMobile=false }) => {
  const taRef=useRef(null), hiRef=useRef(null), lnRef=useRef(null);
  const valRef=useRef(value);
  useEffect(()=>{ valRef.current=value; },[value]);
  const tokenize = useMemo(()=>getHL(lang),[lang]);
  const LH = Math.round(fontSize*1.75);

  const syncScroll = useCallback(()=>{
    const ta=taRef.current; if(!ta) return;
    if(hiRef.current){ hiRef.current.scrollTop=ta.scrollTop; hiRef.current.scrollLeft=ta.scrollLeft; }
    if(lnRef.current) lnRef.current.scrollTop=ta.scrollTop;
  },[]);

  const onKeyDown = useCallback((e)=>{
    const ta=taRef.current; if(!ta) return;
    const s=ta.selectionStart, end=ta.selectionEnd, v=valRef.current;
    if(e.key==='Tab'){
      e.preventDefault();
      onChange(v.slice(0,s)+'    '+v.slice(end));
      requestAnimationFrame(()=>{ ta.selectionStart=ta.selectionEnd=s+4; });
    } else if(e.key==='Enter'){
      e.preventDefault();
      const ls=v.lastIndexOf('\n',s-1)+1, lt=v.slice(ls,s);
      const lead=lt.match(/^(\s*)/)[1].length;
      const extra=(lt.trimEnd().endsWith(':')||lt.trimEnd().endsWith('{')||lt.trimEnd().endsWith('('))?4:0;
      const ind=' '.repeat(lead+extra);
      onChange(v.slice(0,s)+'\n'+ind+v.slice(end));
      requestAnimationFrame(()=>{ ta.selectionStart=ta.selectionEnd=s+1+ind.length; });
    } else if(e.key==='Backspace'&&s===end){
      const ls=v.lastIndexOf('\n',s-1)+1, bc=v.slice(ls,s);
      if(/^ +$/.test(bc)&&bc.length%4===0&&bc.length>0){
        e.preventDefault();
        onChange(v.slice(0,s-4)+v.slice(s));
        requestAnimationFrame(()=>{ ta.selectionStart=ta.selectionEnd=s-4; });
      }
    }
    const pairs={'(':')','{':'}','[':']'};
    if(pairs[e.key]&&s===end){
      e.preventDefault();
      onChange(v.slice(0,s)+e.key+pairs[e.key]+v.slice(end));
      requestAnimationFrame(()=>{ ta.selectionStart=ta.selectionEnd=s+1; });
    }
  },[onChange]);

  const lineCount=(value||'').split('\n').length;
  const shared={
    position:'absolute',top:0,left:0,right:0,bottom:0,
    paddingTop:'12px',paddingBottom:'60px',
    paddingLeft:isMobile?'10px':'50px',paddingRight:'10px',
    fontFamily:VS.mono,fontSize:fontSize+'px',lineHeight:LH+'px',
    whiteSpace:'pre-wrap',wordBreak:'break-all',
    overflowX:'hidden',overflowY:'auto',tabSize:4,
  };

  return (
    <div style={{position:'relative',flex:1,overflow:'hidden',minHeight:0,background:VS.bg}}>
      {/* Line numbers */}
      <div ref={lnRef} style={{
        position:'absolute',top:0,left:0,bottom:0,width:'44px',
        display:isMobile?'none':'block',
        background:'#f8f8f8',borderRight:`1px solid ${VS.border}`,
        overflow:'hidden',pointerEvents:'none',zIndex:4,paddingTop:'12px',
      }}>
        {Array.from({length:lineCount}).map((_,i)=>(
          <div key={i} style={{height:LH+'px',lineHeight:LH+'px',textAlign:'right',paddingRight:'10px',fontSize:Math.max(fontSize-2,9)+'px',color:VS.textMute,fontFamily:VS.mono,userSelect:'none'}}>{i+1}</div>
        ))}
      </div>
      {/* Highlight */}
      <div ref={hiRef} style={{...shared,pointerEvents:'none',zIndex:2,color:VS.text}}>
        <pre style={{margin:0,padding:0,fontFamily:VS.mono,fontSize:fontSize+'px',lineHeight:LH+'px',background:'transparent',whiteSpace:'pre-wrap',wordBreak:'break-all'}}
          dangerouslySetInnerHTML={{__html:value?tokenize(value):`<span style="color:${VS.textMute}">// Write your code here...</span>`}}/>
      </div>
      {/* Textarea */}
      <textarea ref={taRef} value={value} onChange={e=>onChange(e.target.value)}
        onScroll={syncScroll} onKeyDown={onKeyDown}
        spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
        style={{...shared,background:'transparent',color:'transparent',caretColor:VS.text,border:'none',outline:'none',resize:'none',zIndex:3}}/>
    </div>
  );
};

// ═══════════════════════════════════════
//  TERMINAL
// ═══════════════════════════════════════
const Terminal = ({ lines, isWaiting, currentPrompt, onSubmit }) => {
  const [val, setVal] = useState('');
  const bottomRef=useRef(null), inputRef=useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[lines,isWaiting]);
  useEffect(()=>{ if(isWaiting) setTimeout(()=>inputRef.current?.focus(),80); },[isWaiting,currentPrompt]);
  const submit=()=>{ if(!isWaiting) return; onSubmit(val); setVal(''); };
  const C={output:VS.text,error:VS.red,success:VS.green,info:VS.textDim,system:VS.accent,prompt:VS.purple,input:VS.blue};
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0,background:VS.bg}}>
      <div style={{flex:1,overflowY:'auto',padding:'10px 14px',fontFamily:VS.mono,fontSize:'13px',lineHeight:'1.85'}}>
        {lines.map((line,i)=>(
          <div key={i} style={{color:C[line.type]||VS.text,whiteSpace:'pre-wrap',wordBreak:'break-word',display:'flex',alignItems:'flex-start',gap:6}}>
            {line.type==='error'  &&<span style={{flexShrink:0,marginTop:2}}>✕</span>}
            {line.type==='success'&&<span style={{flexShrink:0,marginTop:2}}>✓</span>}
            {line.type==='input'  &&<span style={{flexShrink:0,marginTop:2,color:VS.textDim}}>›</span>}
            <span>{line.text}</span>
          </div>
        ))}
        {isWaiting&&(
          <div style={{display:'flex',alignItems:'center',flexWrap:'wrap'}}>
            <span style={{color:VS.purple,fontFamily:VS.mono,fontSize:'13px',whiteSpace:'pre'}}>{currentPrompt}</span>
            <input ref={inputRef} value={val} onChange={e=>setVal(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') submit(); }}
              placeholder="type here..."
              style={{flex:1,minWidth:60,background:'transparent',border:'none',outline:'none',fontFamily:VS.mono,fontSize:'13px',color:VS.blue,caretColor:VS.blue,fontWeight:600,lineHeight:'1.85'}}
              autoFocus/>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      {isWaiting&&(
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 12px',background:VS.bg2,borderTop:`1px solid ${VS.border}`,flexShrink:0}}>
          <span style={{fontSize:'11px',color:VS.purple,fontFamily:VS.mono}}>⌨ Type → Enter</span>
          <button onClick={submit} style={{marginLeft:'auto',background:VS.accent,border:'none',color:'#fff',padding:'3px 12px',borderRadius:4,fontFamily:VS.mono,fontSize:'11px',cursor:'pointer',fontWeight:700}}>Enter ↵</button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
//  ✅ LOADING OVERLAY — shows only when
//     user clicks Run for first time
// ═══════════════════════════════════════
const LoadingOverlay = ({ msg, progress }) => (
  <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,background:VS.bg,padding:24}}>
    <div style={{fontSize:44,animation:'bounce 0.9s ease infinite'}}>🐍</div>
    <div style={{fontFamily:VS.mono,fontSize:'13px',color:VS.accent,fontWeight:600,textAlign:'center'}}>{msg}</div>
    {/* Progress bar */}
    <div style={{width:'220px',height:'4px',background:VS.bg3,borderRadius:4,overflow:'hidden'}}>
      <div style={{height:'100%',width:progress+'%',background:VS.accent,borderRadius:4,transition:'width 0.4s ease'}}/>
    </div>
    <div style={{fontFamily:VS.mono,fontSize:'10px',color:VS.textDim}}>First run only — then instant ⚡</div>
  </div>
);

// ═══════════════════════════════════════
//  MAIN COMPILER
// ═══════════════════════════════════════
const PythonCompiler = ({ initialCode='', onClose=null }) => {
  const initLang = detectLang(initialCode)||'python';
  const initCode = initialCode?.trim() ? initialCode : SAMPLES[initLang];

  const [lang,       setLang]      = useState(initLang);
  const [code,       setCode]      = useState(initCode);
  // ✅ Status starts 'idle' immediately — no booting state on open
  const [status,     setStatus]    = useState('idle');
  const [termLines,  setTermLines] = useState([
    {type:'system', text:`${LANGS[initLang].icon} ${LANGS[initLang].label} — Ready`},
    {type:'info',   text:'▶ Press Run to execute your code\n'},
  ]);
  const [isWaiting,  setIsWaiting] = useState(false);
  const [curPrompt,  setCurPrompt] = useState('');
  const [inputQueue, setInputQueue]= useState([]);
  const [inputIdx,   setInputIdx]  = useState(0);
  const [allPrompts, setAllPrompts]= useState([]);
  const [pendingCode,setPending]   = useState('');
  const [execTime,   setExecTime]  = useState(null);
  const [hasError,   setHasError]  = useState(false);
  const [isFixing,   setIsFixing]  = useState(false);
  const [fixMsg,     setFixMsg]    = useState('');
  const [showFix,    setShowFix]   = useState(false);
  const [fontSize,   setFontSize]  = useState(()=>window.innerWidth<=600?12:13);
  const [copied,     setCopied]    = useState(false);
  const [termCopied, setTermCopied]= useState(false);
  const [showPreview,setShowPreview]=useState(false);
  const [menuOpen,   setMenuOpen]  = useState(false);
  const [isMobile,   setIsMobile]  = useState(()=>window.innerWidth<=600);

  // ✅ Loading state for lazy pyodide
  const [pyLoading,  setPyLoading] = useState(false);
  const [pyLoadMsg,  setPyLoadMsg] = useState('');
  const [pyProgress, setPyProgress]= useState(0);

  const codeRef = useRef(code);
  useEffect(()=>{ codeRef.current=code; },[code]);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<=600);
    window.addEventListener('resize',h);
    return ()=>window.removeEventListener('resize',h);
  },[]);

  // ✅ NO useEffect boot — Pyodide loads only when Run is clicked
  // Optionally: preload in background after 3s (silent, no UI change)
  useEffect(()=>{
    const timer = setTimeout(()=>{
      if (!_pyodideReady) {
        // Silent background preload — no UI change
        loadPyodideLazy(()=>{}).catch(()=>{});
      }
    }, 3000); // start preloading after 3s silently
    return ()=>clearTimeout(timer);
  },[]);

  const addLine  = (type,text) => setTermLines(p=>[...p,{type,text}]);
  const addLines = (nl)        => setTermLines(p=>[...p,...nl]);

  const resetTerminal = () => {
    setIsWaiting(false); setCurPrompt('');
    setInputQueue([]); setInputIdx(0); setAllPrompts([]);
    setPending(''); setExecTime(null); setHasError(false);
    setShowFix(false); setShowPreview(false);
  };

  // ═══════════════════════════════════════
  //  Execute Python (called after py ready)
  // ═══════════════════════════════════════
  const doExecute = useCallback(async(codeToRun, stdinArr) => {
    setStatus('running');
    const t0=Date.now();
    try {
      const py = _pyodide;
      const BUILTIN = new Set(['sys','io','os','re','math','json','time','random','datetime','collections','itertools','functools','string','pathlib','builtins','abc','copy','typing','enum','dataclasses','contextlib','hashlib','base64','struct','array','heapq','bisect','gc','inspect','traceback','warnings','logging','csv','sqlite3','argparse','glob','tempfile','calendar','pprint','textwrap','ast','token','unittest','threading','queue','multiprocessing','concurrent','asyncio','subprocess','socket','ssl','http','html','xml','email','urllib','ftplib','smtplib','zipfile','tarfile','gzip','shutil','stat','platform','signal','ctypes','decimal','fractions','statistics','cmath','numbers','operator','codecs','unicodedata','locale','pickle','shelve','dbm','importlib','pkgutil','runpy','dis','py_compile','tokenize','keyword','linecache','symtable','antigravity','this','__future__','__main__']);
      const importRe=/^(?:import|from)\s+([\w]+)/gm;
      const toInstall=new Set(); let im;
      while((im=importRe.exec(codeToRun))!==null){
        const p=im[1]; if(!BUILTIN.has(p)&&!BUILTIN.has(p.toLowerCase())) toInstall.add(p);
      }
      if(toInstall.size>0){
        addLine('system',`📦 Installing: ${[...toInstall].join(', ')}...`);
        try{
          const PYODIDE_PKGS=['numpy','pandas','matplotlib','scipy','Pillow','sympy','networkx','scikit-learn','statsmodels','bokeh','lxml','cryptography','regex','pyyaml'];
          const pyPkgs=[...toInstall].filter(p=>PYODIDE_PKGS.map(x=>x.toLowerCase()).includes(p.toLowerCase()));
          const mpPkgs=[...toInstall].filter(p=>!PYODIDE_PKGS.map(x=>x.toLowerCase()).includes(p.toLowerCase()));
          if(pyPkgs.length>0) { try{ await py.loadPackage(pyPkgs); }catch{} }
          if(mpPkgs.length>0){
            await py.runPythonAsync(`
import micropip
for _p in ${JSON.stringify(mpPkgs)}:
    try: await micropip.install(_p)
    except: pass
`);
          }
          addLine('success','Packages ready');
        }catch{ addLine('info','Some packages unavailable in browser'); }
      }

      py.globals.set('_stdin_data', py.toPy(stdinArr));
      py.runPython(`
import sys,io,builtins
_out=[];_err=[]
_sin=list(_stdin_data);_si=0
class _W(io.TextIOBase):
    def __init__(self,b): self._b=b
    def write(self,s): self._b.append(str(s));return len(s)
    def flush(self): pass
class _R(io.TextIOBase):
    def readline(self):
        global _si
        if _si<len(_sin): v=_sin[_si];_si+=1;return str(v)+'\\n'
        return ''
sys.stdout=_W(_out);sys.stderr=_W(_err);sys.stdin=_R()
def _inp(p=''):
    if p: sys.stdout.write(str(p));sys.stdout.flush()
    return sys.stdin.readline().rstrip('\\n')
builtins.input=_inp
try:
    import requests as _req
    _o_get=_req.get;_o_post=_req.post
    _P='https://corsproxy.io/?'
    def _pg(url,**kw): return _o_get((_P+url if not url.startswith(_P) else url),**kw)
    def _pp(url,**kw): return _o_post((_P+url if not url.startswith(_P) else url),**kw)
    _req.get=_pg;_req.post=_pp
except: pass
`);
      let runErr=false, errMsg='';
      try { py.runPython(codeToRun); }
      catch(e){ runErr=true; errMsg=String(e).replace(/^PythonError:\s*/,''); }

      const elapsed=((Date.now()-t0)/1000).toFixed(2);
      setExecTime(elapsed);
      const fullOut=py.globals.get('_out').toJs().join('');
      const fullErr=py.globals.get('_err').toJs().join('')+(runErr?errMsg:'');
      const nl=[];
      if(fullOut) fullOut.split('\n').forEach((l,i,a)=>{ if(i<a.length-1||l) nl.push({type:'output',text:l}); });
      if(fullErr) fullErr.split('\n').forEach(l=>{ if(l) nl.push({type:'error',text:l}); });
      if(!fullOut&&!fullErr) nl.push({type:'success',text:'Ran successfully (no output)'});
      nl.push({type:'info',text:`⏱ ${elapsed}s`});
      addLines(nl);
      if(runErr||fullErr){ setStatus('error');setHasError(true);setFixMsg('Error found — click Fix 🔧');setShowFix(true); }
      else { setStatus('success');setHasError(false);setShowFix(false); }
    } catch(e) {
      addLine('error',e.message);
      setStatus('error');setHasError(true);
      setFixMsg('Error found — click Fix 🔧');setShowFix(true);
    }
    setIsWaiting(false);
    setPyLoading(false);
  },[]);

  // ═══════════════════════════════════════
  //  ✅ RUN — lazy load Pyodide if needed
  // ═══════════════════════════════════════
  const runCode = useCallback(async(codeOverride) => {
    const raw = typeof codeOverride==='string' ? codeOverride : codeRef.current;
    const detected = detectLang(raw);
    const effectiveLang = detected||lang;
    const effectiveRunner = LANGS[effectiveLang]?.runner||'python';
    if(detected&&detected!==lang) setLang(detected);

    // HTML preview
    if(effectiveRunner==='html'){
      setShowPreview(true); setStatus('success'); return;
    }

    // JavaScript
    if(effectiveRunner==='js'){
      resetTerminal();
      setTermLines([{type:'info',text:'⚡ Running JavaScript...'}]);
      setStatus('running');
      const logs=[];
      const oL=console.log,oE=console.error,oW=console.warn;
      console.log  =(...a)=>logs.push({type:'output',text:a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ')});
      console.error=(...a)=>logs.push({type:'error', text:a.map(String).join(' ')});
      console.warn =(...a)=>logs.push({type:'info',  text:a.map(String).join(' ')});
      const t0=Date.now();
      try{
        // eslint-disable-next-line no-eval
        eval(raw);
        const el=((Date.now()-t0)/1000).toFixed(2);
        setTermLines([...logs,...(logs.length===0?[{type:'success',text:'Ran (no output)'}]:[]),{type:'info',text:`⏱ ${el}s`}]);
        setExecTime(el);setStatus('success');setHasError(false);
      }catch(e){
        const el=((Date.now()-t0)/1000).toFixed(2);
        setTermLines([...logs,{type:'error',text:e.message},{type:'info',text:`⏱ ${el}s`}]);
        setStatus('error');setHasError(true);setFixMsg('Error — click Fix 🔧');setShowFix(true);
      }
      console.log=oL;console.error=oE;console.warn=oW;
      return;
    }

    // AI languages
    if(effectiveRunner==='ai'){
      resetTerminal();setStatus('running');
      const cfg=LANGS[effectiveLang]||LANGS[lang];
      setTermLines([{type:'system',text:`${cfg.icon} ${cfg.label} — AI simulating output...`}]);
      try{
        const resp=await fetch(AI_URL,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({messages:[
            {role:'system',content:`Simulate ${effectiveLang} output. Format: [one line what code does]\n\n[exact console output only]. No markdown.`},
            {role:'user',content:`${effectiveLang}:\n\n${raw}`}
          ],max_tokens:300,temperature:0.1})});
        const reader=resp.body.getReader(),decoder=new TextDecoder();
        let reply='',leftover='';
        while(true){
          const{done,value}=await reader.read();if(done)break;
          const chunk=leftover+decoder.decode(value,{stream:true});
          const ls=chunk.split('\n');leftover=ls.pop()||'';
          for(const l of ls){
            const t=l.trim();if(!t.startsWith('data: '))continue;
            const d=t.slice(6).trim();if(d==='[DONE]'||!d)continue;
            try{const p=JSON.parse(d);const delta=p.choices?.[0]?.delta?.content;if(delta)reply+=delta;}catch{}
          }
        }
        const rlines=reply.trim().split('\n');
        const nl=[];let outputSection=false;
        for(let i=0;i<rlines.length;i++){
          if(i===0){nl.push({type:'info',text:rlines[0]});continue;}
          if(!outputSection&&rlines[i].trim()===''){outputSection=true;continue;}
          if(outputSection) nl.push({type:'output',text:rlines[i]});
        }
        setTermLines(nl);setStatus('success');
      }catch{
        setTermLines([{type:'error',text:'AI offline. Check network.'}]);setStatus('error');
      }
      return;
    }

    // ✅ Python — lazy load Pyodide
    const toRun = normalizeIndent(raw);
    setCode(toRun); codeRef.current=toRun;
    resetTerminal();

    // If Pyodide not ready — show loading in output panel (not blocking UI)
    if (!_pyodideReady) {
      setPyLoading(true);
      setPyProgress(5);
      setPyLoadMsg('📦 Downloading Python runtime (~10MB)...');
      setTermLines([{type:'system',text:'🐍 Loading Python for first run...'}]);
      setStatus('booting');

      try {
        await loadPyodideLazy((s) => {
          if(s==='downloading') { setPyLoadMsg('📦 Downloading Python (~10MB, only once)...'); setPyProgress(20); }
          if(s==='starting')    { setPyLoadMsg('🐍 Starting Python 3.11...');                  setPyProgress(70); }
          if(s==='packages')    { setPyLoadMsg('📦 Loading micropip...');                       setPyProgress(90); }
          if(s==='ready')       { setPyLoadMsg('✅ Python ready!');                              setPyProgress(100); }
        });
      } catch(err) {
        setPyLoading(false);
        setTermLines([{type:'error',text:`Failed to load Python: ${err.message}`}]);
        setStatus('error');
        return;
      }
      setPyLoading(false);
    }

    setTermLines([{type:'info',text:'⚡ Running...'}]);
    const prompts = detectInputCalls(toRun);
    if(prompts.length>0){
      setPending(toRun); setAllPrompts(prompts); setInputIdx(0); setInputQueue([]);
      setTermLines([]); setCurPrompt(prompts[0]); setIsWaiting(true); setStatus('waiting');
    } else {
      await doExecute(toRun,[]);
    }
  },[doExecute,lang]);

  const handleInput = useCallback((val)=>{
    addLine('input',(curPrompt||'')+val);
    const nq=[...inputQueue,val], ni=inputIdx+1;
    setInputQueue(nq);
    if(ni<allPrompts.length){ setInputIdx(ni); setCurPrompt(allPrompts[ni]); }
    else{ setIsWaiting(false); setCurPrompt(''); addLine('info','⚡ Running...'); doExecute(pendingCode,nq); }
  },[curPrompt,inputQueue,inputIdx,allPrompts,pendingCode,doExecute]);

  // AI Fix
  const handleFix = useCallback(async()=>{
    if(isFixing||!codeRef.current.trim()) return;
    setIsFixing(true); setFixMsg('🤖 AI fixing...'); setShowFix(true);
    const fixed=await aiAutoFix(codeRef.current,lang);
    if(fixed){
      const oL=codeRef.current.split('\n'), fL=fixed.split('\n');
      let diff=0;
      for(let i=0;i<Math.max(oL.length,fL.length);i++) if(oL[i]!==fL[i]) diff++;
      setCode(fixed); codeRef.current=fixed;
      setFixMsg(diff>0?`✅ Fixed ${diff} line${diff>1?'s':''}`:'✅ No changes needed');
    } else {
      const f=normalizeIndent(codeRef.current); setCode(f); codeRef.current=f;
      setFixMsg('🔧 Indentation fixed');
    }
    setIsFixing(false); setHasError(false);
    setTimeout(()=>setShowFix(false),4000);
  },[isFixing,lang]);

  const handleLangChange = (l) => {
    setLang(l); setCode(SAMPLES[l]||''); codeRef.current=SAMPLES[l]||'';
    resetTerminal(); setMenuOpen(false);
    const c=LANGS[l];
    setTermLines([{type:'system',text:`${c.icon} ${c.label} — Ready`},{type:'info',text:'▶ Run to execute\n'}]);
    setStatus('idle');
  };

  const handleBack     = ()=>{ if(onClose) onClose(); else if(window.history.length>1) window.history.back(); else window.location.href='/'; };
  const handleCopyCode = ()=>{
    const el=document.createElement('textarea'); el.value=code;
    document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    navigator.clipboard?.writeText(code).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };
  const handleCopyOutput = ()=>{
    const text=termLines.filter(l=>l.type!=='system').map(l=>l.text).join('\n').trim()||'(no output)';
    const el=document.createElement('textarea'); el.value=text;
    document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    navigator.clipboard?.writeText(text).catch(()=>{});
    setTermCopied(true); setTimeout(()=>setTermCopied(false),2000);
  };
  const handleClear = ()=>{
    resetTerminal(); setStatus('idle');
    const c=LANGS[lang];
    setTermLines([{type:'system',text:`${c.icon} ${c.label} — Ready`},{type:'info',text:'▶ Run\n'}]);
  };
  const handleDownload = ()=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([code],{type:'text/plain'}));
    a.download=LANGS[lang]?.file||'main.txt'; a.click();
  };

  const lineCount=(code||'').split('\n').length;
  const runner=LANGS[lang]?.runner||'python';
  // ✅ canRun — always true for non-python, always true for python (lazy loads)
  const canRun = status!=='running'&&status!=='waiting'&&status!=='booting';
  const isRunning=status==='running'||status==='booting';
  const cfg=LANGS[lang]||LANGS.python;

  const sColor={idle:VS.accent,booting:'#d97706',running:VS.accent,waiting:VS.purple,success:VS.green,error:VS.red}[status]||VS.accent;
  const sLabel={idle:'Ready',booting:'Loading...',running:'Running...',waiting:'Waiting',success:'Done ✓',error:'Error'}[status]||'Ready';

  const fixBg   = fixMsg.startsWith('✅')?VS.greenBg : fixMsg.startsWith('🤖')?VS.accentBg : '#fef2f2';
  const fixBord = fixMsg.startsWith('✅')?VS.green   : fixMsg.startsWith('🤖')?VS.accent   : VS.red;
  const fixTxt  = fixMsg.startsWith('✅')?VS.green   : fixMsg.startsWith('🤖')?VS.accent   : VS.red;

  return (
    <div style={{display:'flex',flexDirection:'column',position:'fixed',inset:0,background:VS.bg,color:VS.text,fontFamily:'"Segoe UI",system-ui,sans-serif',overflow:'hidden',zIndex:9999}}>

      {/* ── HEADER */}
      <div style={{background:VS.bg2,borderBottom:`1px solid ${VS.border}`,display:'flex',alignItems:'center',height:isMobile?'48px':'46px',padding:isMobile?'0 8px':'0 10px',flexShrink:0,gap:isMobile?4:6,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        {/* Back */}
        <button onClick={handleBack} style={{background:'transparent',border:`1px solid ${VS.border}`,color:VS.textDim,borderRadius:5,padding:'5px 10px',cursor:'pointer',fontSize:'13px',fontFamily:'inherit',flexShrink:0}}>←</button>

        {/* Language dropdown */}
        <div style={{position:'relative',flexShrink:0}}>
          <button onClick={()=>setMenuOpen(o=>!o)} style={{background:VS.bg,border:`1px solid ${VS.border}`,color:VS.text,borderRadius:6,padding:'6px 10px',cursor:'pointer',fontFamily:VS.mono,fontSize:'12px',fontWeight:600,display:'flex',alignItems:'center',gap:5,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
            {cfg.icon}{!isMobile&&' '+cfg.label}
            <span style={{fontSize:'9px',color:VS.textDim}}>▾</span>
          </button>
          {menuOpen&&(
            <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:VS.bg,border:`1px solid ${VS.border}`,borderRadius:8,zIndex:1000,minWidth:'160px',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',overflow:'hidden'}}>
              {Object.entries(LANGS).map(([k,v])=>(
                <button key={k} onClick={()=>handleLangChange(k)} style={{width:'100%',padding:'10px 14px',background:lang===k?VS.accentBg:'transparent',border:'none',color:lang===k?VS.accent:VS.text,cursor:'pointer',textAlign:'left',fontFamily:VS.mono,fontSize:'12px',display:'flex',alignItems:'center',gap:8}}>
                  <span>{v.icon}</span>
                  <span style={{flex:1}}>{v.label}</span>
                  {lang===k&&<span style={{color:VS.accent,fontSize:'11px'}}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Run */}
        <button onClick={()=>runCode()} disabled={!canRun} style={{background:canRun?VS.accent:'#f0f0f0',border:'none',color:canRun?'#fff':'#aaa',borderRadius:6,padding:isMobile?'7px 12px':'7px 18px',fontWeight:700,fontSize:isMobile?'12px':'13px',cursor:canRun?'pointer':'not-allowed',fontFamily:'inherit',flexShrink:0,transition:'all 0.15s',whiteSpace:'nowrap',boxShadow:canRun?'0 2px 6px rgba(0,102,184,0.3)':'none'}}>
          {isRunning?'⟳ Running':'▶ Run'}
        </button>

        {/* Fix */}
        <button onClick={handleFix} disabled={isFixing} style={{background:hasError?'#fef2f2':'transparent',border:`1px solid ${hasError?VS.red:VS.border}`,color:hasError?VS.red:VS.textDim,borderRadius:6,padding:isMobile?'7px 8px':'7px 11px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',flexShrink:0,fontWeight:hasError?700:400,transition:'all 0.15s'}}>
          {isFixing?'⟳':'🔧'}
        </button>

        {/* Status */}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:sColor,animation:(isRunning||status==='waiting')?'pulse 1s ease infinite':'none',display:'inline-block'}}/>
          <span style={{fontFamily:VS.mono,fontSize:'10px',color:sColor,fontWeight:600}}>{sLabel}</span>
        </div>

        <button onClick={handleCopyCode} style={{background:'transparent',border:'none',color:VS.textDim,cursor:'pointer',fontSize:'16px',padding:'4px',flexShrink:0}}>{copied?'✅':'⎘'}</button>
        {!isMobile&&<button onClick={handleDownload} style={{background:'transparent',border:'none',color:VS.textDim,cursor:'pointer',fontSize:'16px',padding:'4px',flexShrink:0}}>↓</button>}
      </div>

      {/* ── TAB BAR */}
      <div style={{background:VS.bg2,borderBottom:`1px solid ${VS.border}`,display:'flex',alignItems:'flex-end',height:'28px',padding:'0 10px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:5,background:VS.bg,borderTop:`2px solid ${VS.accent}`,padding:'0 12px',height:'26px',fontSize:'11px',color:VS.textDim,fontFamily:VS.mono}}>
          {cfg.file}
          <span style={{width:5,height:5,borderRadius:'50%',background:'#f0883e',marginLeft:3,display:'inline-block'}}/>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:3,paddingBottom:2}}>
          <button onClick={()=>setFontSize(f=>Math.max(10,f-1))} style={S.tabBtn}>A-</button>
          <span style={{fontSize:'10px',color:VS.textMute,minWidth:16,textAlign:'center',fontFamily:VS.mono}}>{fontSize}</span>
          <button onClick={()=>setFontSize(f=>Math.min(20,f+1))} style={S.tabBtn}>A+</button>
          <button onClick={handleClear} style={{...S.tabBtn,marginLeft:6}}>🗑</button>
        </div>
      </div>

      {/* ── FIX BANNER */}
      {showFix&&(
        <div style={{background:fixBg,borderBottom:`1px solid ${fixBord}`,padding:'5px 12px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{fontFamily:VS.mono,fontSize:'11px',fontWeight:600,color:fixTxt}}>{fixMsg}</span>
          {isFixing&&<span style={{display:'inline-flex',gap:3}}>{[0,1,2].map(i=><span key={i} style={{width:4,height:4,borderRadius:'50%',background:VS.accent,display:'inline-block',animation:`bounce 0.6s ease ${i*0.13}s infinite`}}/>)}</span>}
          <button onClick={()=>setShowFix(false)} style={{marginLeft:'auto',background:'none',border:'none',color:VS.textMute,cursor:'pointer',fontSize:'13px'}}>✕</button>
        </div>
      )}

      {/* ── MAIN PANE */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>
        {/* EDITOR */}
        <div style={{flex:isMobile?'0 0 50%':'0 0 55%',display:'flex',flexDirection:'column',overflow:'hidden',borderBottom:`1px solid ${VS.border}`}}>
          <CodeEditor value={code} onChange={v=>{setCode(v);codeRef.current=v;}} lang={lang} fontSize={fontSize} isMobile={isMobile}/>
        </div>

        {/* OUTPUT HEADER */}
        <div style={{background:VS.bg2,display:'flex',alignItems:'center',height:'24px',padding:'0 10px',flexShrink:0,gap:8,borderBottom:`1px solid ${VS.border}`}}>
          <span style={{fontFamily:VS.mono,fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:VS.textDim}}>
            {showPreview?'Preview':status==='waiting'?'Input':'Output'}
          </span>
          {status==='waiting' &&<span style={{fontSize:'10px',color:VS.purple,animation:'pulse 1s ease infinite'}}>● waiting</span>}
          {status==='success' &&<span style={{fontSize:'10px',color:VS.green}}>● done</span>}
          {status==='error'   &&<span style={{fontSize:'10px',color:VS.red}}>● error</span>}
          {status==='running' &&<span style={{fontSize:'10px',color:VS.accent,animation:'pulse 0.8s ease infinite'}}>● running</span>}
          {status==='booting' &&<span style={{fontSize:'10px',color:'#d97706',animation:'pulse 0.8s ease infinite'}}>● loading python</span>}
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
            {!showPreview&&!isRunning&&termLines.length>0&&(
              <button onClick={handleCopyOutput} style={{display:'flex',alignItems:'center',gap:3,background:termCopied?VS.greenBg:'transparent',border:`1px solid ${termCopied?VS.green:VS.border}`,color:termCopied?VS.green:VS.textDim,borderRadius:4,padding:'2px 8px',cursor:'pointer',fontSize:'10px',fontFamily:VS.mono}}>
                {termCopied?'✅ Copied':'⎘ Copy'}
              </button>
            )}
            {showPreview&&(
              <button onClick={()=>setShowPreview(false)} style={{background:'none',border:'none',color:VS.textDim,cursor:'pointer',fontSize:'11px',fontFamily:VS.mono}}>← Code</button>
            )}
          </div>
        </div>

        {/* OUTPUT */}
        <div style={{flex:1,overflow:'hidden',minHeight:0}}>
          {showPreview
            ? <iframe title="preview" style={{width:'100%',height:'100%',border:'none',background:'#fff'}} srcDoc={code}/>
            : pyLoading
              ? <LoadingOverlay msg={pyLoadMsg} progress={pyProgress}/>
              : <Terminal lines={termLines} isWaiting={isWaiting} currentPrompt={curPrompt} onSubmit={handleInput}/>
          }
        </div>
      </div>

      {/* ── STATUS BAR */}
      <div style={{background:VS.accent,display:'flex',alignItems:'center',gap:10,padding:'0 12px',height:'20px',flexShrink:0}}>
        <span style={{fontFamily:VS.mono,fontSize:'10px',color:'#fff',fontWeight:700}}>{cfg.icon}{!isMobile&&' '+cfg.label}</span>
        <span style={{color:'rgba(255,255,255,0.4)'}}>|</span>
        <span style={{fontFamily:VS.mono,fontSize:'10px',color:'rgba(255,255,255,0.9)'}}>Ln {lineCount}</span>
        {execTime&&<><span style={{color:'rgba(255,255,255,0.4)'}}>|</span><span style={{fontFamily:VS.mono,fontSize:'10px',color:'rgba(255,255,255,0.9)'}}>⏱ {execTime}s</span></>}
        {runner==='python'&&!_pyodideReady&&<span style={{fontFamily:VS.mono,fontSize:'10px',color:'rgba(255,255,255,0.6)',marginLeft:4}}>· Python loads on first Run</span>}
        <span style={{marginLeft:'auto',fontFamily:VS.mono,fontSize:'10px',color:'rgba(255,255,255,0.5)'}}>PySkill</span>
      </div>

      {menuOpen&&<div style={{position:'fixed',inset:0,zIndex:999}} onClick={()=>setMenuOpen(false)}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;}
        @keyframes pulse  {0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes bounce {0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes fadeIn {from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#f3f3f3}
        ::-webkit-scrollbar-thumb{background:#c0c0c0;border-radius:2px}
        textarea{-webkit-tap-highlight-color:transparent;}
        *{-webkit-tap-highlight-color:transparent;}
        body,html{overflow:hidden;position:fixed;width:100%;height:100%;}
        input,textarea,select{font-size:16px !important;}
        button:active{opacity:0.75;}
      `}</style>
    </div>
  );
};

const S = {
  tabBtn:{background:'transparent',border:`1px solid #e4e4e4`,color:'#6e7681',borderRadius:4,padding:'2px 7px',fontSize:'10px',cursor:'pointer',fontFamily:'inherit'},
};

export default PythonCompiler;