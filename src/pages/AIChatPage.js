import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, User, RotateCcw, StopCircle, Copy, Check,
  HelpCircle, Play, Flame, BookOpen,
  Download, Terminal, FileText, Trash2, Eye, X, ArrowLeft
} from 'lucide-react';
import { useTheme } from '../App';

// ═══════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════
const HF_TOKEN = "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";
const MODEL    = "openai/gpt-oss-120b:groq";
const BASE_URL = "https://router.huggingface.co/v1";

// ═══════════════════════════════════════════════
//  FIREBASE
// ═══════════════════════════════════════════════
let db = null;
try {
  const { getFirestore } = require('firebase/firestore');
  const { getApp }       = require('firebase/app');
  db = getFirestore(getApp());
} catch (e) {}

const saveMsgToDb = async (userEmail, role, text) => {
  if (!db || !userEmail) return;
  try {
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    await addDoc(collection(db, 'ai_chat_logs'), {
      userEmail, role, text: text.slice(0, 2000),
      ts: serverTimestamp(), page: window.location.hash || '/'
    });
  } catch (e) {}
};

const loadHistoryFromDb = async (userEmail) => {
  if (!db || !userEmail) return [];
  try {
    const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
    const q    = query(collection(db, 'ai_chat_logs'), orderBy('ts', 'desc'), limit(20));
    const snap = await getDocs(q);
    const msgs = [];
    snap.forEach(d => msgs.unshift(d.data()));
    return msgs
      .filter(m => m.userEmail === userEmail)
      .map(m => ({ from: m.role === 'user' ? 'user' : 'bot', text: m.text }));
  } catch (e) { return []; }
};

// ═══════════════════════════════════════════════
//  STATIC DATA
// ═══════════════════════════════════════════════
const PYTHON_TOPICS = [
  { id:'basics',    emoji:'🌱', label:'Basics',       color:'#10b981' },
  { id:'control',   emoji:'🔀', label:'Control Flow', color:'#3b82f6' },
  { id:'functions', emoji:'⚡', label:'Functions',    color:'#f59e0b' },
  { id:'ds',        emoji:'📦', label:'Data Structs', color:'#8b5cf6' },
  { id:'strings',   emoji:'🔤', label:'Strings',      color:'#ec4899' },
  { id:'files',     emoji:'📁', label:'File I/O',     color:'#06b6d4' },
  { id:'oop',       emoji:'🏗️', label:'OOP',          color:'#f97316' },
  { id:'modules',   emoji:'🧩', label:'Modules',      color:'#84cc16' },
  { id:'errors',    emoji:'🛡️', label:'Errors',       color:'#ef4444' },
  { id:'advanced',  emoji:'🚀', label:'Advanced',     color:'#a855f7' },
];

// ═══════════════════════════════════════════════
//  SYSTEM PROMPT
// ═══════════════════════════════════════════════
const SYSTEM_PROMPT = `You are ZEHRA — the official AI assistant of FaizUpyZone.shop. You are a brilliant Python mentor, full-stack developer, motivational coach, and every student's favorite cool mentor who genuinely wants them to succeed! 🌸

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 LANGUAGE RULE (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- DEFAULT language is ENGLISH. Always reply in English unless the user writes in another language.
- If user writes in Urdu → reply in Urdu. If Hindi → Hindi. If mixed → match their mix.
- NEVER use Urdu/Hindi/Roman Urdu unless the user themselves uses it first.
- Do NOT say "Assalam-o-Alaikum" or any Urdu greetings by default — greet in English.
- First message greeting: "Hey! 👋 I'm ZEHRA, your FaizUpyZone AI mentor! 🌸"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
😄 PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Friendly, warm, funny, and encouraging — like a cool senior who makes learning fun.
- Celebrate wins with energy: "YOOO! That was pro level! 🔥🔥"
- Keep humor tasteful and encouraging, NEVER mean.
- If user seems sad or says "I give up" → respond with warmth first, then help.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 RESPONSE LENGTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Simple question → SHORT (2-4 lines max)
- Code help → brief explanation THEN code
- Roadmap/full topic → detailed OK
- NEVER write walls of text unless asked

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐍 CODE RULES (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- ALWAYS wrap code in triple backticks with language tag:
\`\`\`python
# code here
\`\`\`
- Never give raw unwrapped code — ever.
- Keep code clean, well-commented, beginner-friendly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 QUIZ FORMAT (only when asked)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[[QUIZ]]
QUESTION: Question text here
A: Option one
B: Option two
C: Option three
D: Option four
ANSWER: B
EXPLANATION: Clear one-line explanation.
[[/QUIZ]]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 NEVER DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Never use Urdu/Hindi unless user writes in it first.
- Never use markdown tables.
- Never be rude or dismissive.
- Never give code without backticks.

✅ End EVERY response with one short friendly follow-up question in English.`;

// ═══════════════════════════════════════════════
//  TOKEN COLORS
// ═══════════════════════════════════════════════
const TC = {
  keyword:'#c792ea', builtin:'#82aaff', string:'#c3e88d',
  comment:'#607d8b', number:'#f78c6c', operator:'#89ddff', default:'#cdd6f4',
};
const KW = new Set(['def','class','import','from','return','if','elif','else','for','while','in',
  'not','and','or','True','False','None','try','except','finally','with','as',
  'pass','break','continue','lambda','yield','async','await','raise','del','global','nonlocal','assert','is']);
const BT = new Set(['print','len','range','type','int','str','float','list','dict','set','tuple',
  'input','open','enumerate','zip','map','filter','sorted','reversed','max','min',
  'sum','abs','round','isinstance','hasattr','getattr','setattr','super','object']);

function tokenizePy(code) {
  const tokens = [];
  const lines  = code.split('\n');
  lines.forEach((line, li) => {
    const ci = line.indexOf('#');
    const cp = ci >= 0 ? line.slice(0, ci) : line;
    const cm = ci >= 0 ? line.slice(ci) : '';
    const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+\.?\d*\b|\b\w+\b|[^\w\s]|\s+)/g;
    let m;
    while ((m = re.exec(cp)) !== null) {
      const w = m[0];
      if      (/^\s+$/.test(w))                { tokens.push({ t:'default',  v:w }); }
      else if (w[0]==='"'||w[0]==="'")         { tokens.push({ t:'string',   v:w }); }
      else if (/^\d/.test(w))                  { tokens.push({ t:'number',   v:w }); }
      else if (KW.has(w))                      { tokens.push({ t:'keyword',  v:w }); }
      else if (BT.has(w))                      { tokens.push({ t:'builtin',  v:w }); }
      else if (/^[+\-*/<>=!&|^~%@]+$/.test(w)){ tokens.push({ t:'operator', v:w }); }
      else                                     { tokens.push({ t:'default',  v:w }); }
    }
    if (cm) tokens.push({ t:'comment', v:cm });
    if (li < lines.length - 1) tokens.push({ t:'default', v:'\n' });
  });
  return tokens;
}

const HiCode = ({ code }) => (
  <pre style={{ margin:0, padding:0, whiteSpace:'pre-wrap', wordBreak:'break-word', overflowWrap:'anywhere', fontFamily:'"Fira Code","Consolas",monospace', fontSize:'12px', lineHeight:'20px', color:TC.default, maxWidth:'100%', overflow:'hidden' }}>
    {tokenizePy(code).map((tok,i) => <span key={i} style={{ color:TC[tok.t]||TC.default }}>{tok.v}</span>)}
  </pre>
);

// ═══════════════════════════════════════════════
//  PDF MANAGER
// ═══════════════════════════════════════════════
const PDF_KEY = 'fuz_saved_pdfs';
const loadPDFs = () => { try { return JSON.parse(localStorage.getItem(PDF_KEY) || '[]'); } catch { return []; } };
const savePDFs = (list) => { try { localStorage.setItem(PDF_KEY, JSON.stringify(list)); } catch(e) {} };

const PdfPanel = ({ isDark, onClose, onExplain }) => {
  const [pdfs, setPdfs]         = useState(loadPDFs);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return alert('Please select a PDF file.');
    if (file.size > 5 * 1024 * 1024) return alert('PDF must be under 5 MB.');
    setUploading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload  = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const entry = { id: Date.now().toString(), name: file.name, size: (file.size/1024).toFixed(1)+' KB', data: base64, savedAt: new Date().toLocaleDateString() };
      const updated = [entry, ...pdfs];
      setPdfs(updated); savePDFs(updated);
    } catch { alert('Failed to read file.'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const deletePdf = (id) => { const u = pdfs.filter(p=>p.id!==id); setPdfs(u); savePDFs(u); };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:'500px', background:isDark?'#0d1117':'#fff', borderRadius:'20px 20px 0 0', maxHeight:'85vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg,#6366f1,#ec4899)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
          <FileText size={18} color="#fff"/>
          <div style={{ flex:1 }}>
            <div style={{ color:'#fff', fontWeight:800, fontSize:'15px' }}>PDF Library 📄</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'11px' }}>{pdfs.length} saved</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.18)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
        </div>

        <div style={{ padding:'12px', borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#f0f0f0'}` }}>
          <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} style={{ display:'none' }}/>
          <button onClick={()=>fileRef.current?.click()} disabled={uploading}
            style={{ width:'100%', padding:'12px', background:isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.05)', border:`2px dashed rgba(99,102,241,0.4)`, borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
            {uploading
              ? <span style={{ fontSize:'13px', color:'#6366f1', fontWeight:700 }}>Reading PDF...</span>
              : <><FileText size={16} color="#6366f1"/><span style={{ fontSize:'13px', color:'#6366f1', fontWeight:700 }}>Upload PDF (max 5MB)</span></>
            }
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'10px' }}>
          {pdfs.length === 0
            ? <div style={{ textAlign:'center', padding:'32px', color:'#94a3b8' }}><div style={{ fontSize:'40px', marginBottom:8 }}>📭</div><div style={{ fontSize:'13px' }}>No PDFs yet. Upload one above!</div></div>
            : pdfs.map(pdf => (
              <div key={pdf.id} style={{ padding:'10px', borderRadius:12, marginBottom:8, border:`1px solid ${isDark?'rgba(99,102,241,0.15)':'rgba(99,102,241,0.1)'}`, background:isDark?'rgba(99,102,241,0.05)':'rgba(99,102,241,0.02)', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:40, height:40, background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(236,72,153,0.15))', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <FileText size={18} color="#6366f1"/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:isDark?'#e2e8f0':'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pdf.name}</div>
                  <div style={{ fontSize:'11px', color:'#94a3b8' }}>{pdf.size} · {pdf.savedAt}</div>
                </div>
                <button onClick={()=>onExplain(pdf)} style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#818cf8', fontSize:'11px', fontWeight:700, fontFamily:'inherit' }}>
                  <Eye size={12} style={{ display:'inline', marginRight:3 }}/>Explain
                </button>
                <button onClick={()=>deletePdf(pdf.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Trash2 size={13} color="#f87171"/>
                </button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  CODE BLOCK — Mobile Optimized
// ═══════════════════════════════════════════════
const CodeBlock = ({ lang, content, onOpenCompiler }) => {
  const [copied, setCopied]   = useState(false);
  const [justRan, setJustRan] = useState(false);
  const isPy = ['python','py',''].includes((lang||'').toLowerCase());

  const copy = () => {
    navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  const run = () => {
    if (onOpenCompiler) {
      setJustRan(true);
      setTimeout(() => setJustRan(false), 1500);
      onOpenCompiler(content);
    }
  };

  return (
    <div style={{ borderRadius:10, overflow:'hidden', margin:'8px 0', border:'1px solid #333', width:'100%', boxSizing:'border-box' }}>
      <div style={{ background:'#2a2a2a', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:6 }}>
        <span style={{ fontSize:'12px', color:'#aaa', fontWeight:700, fontFamily:'"Fira Code",monospace', textTransform:'uppercase' }}>
          {lang || 'code'}
        </span>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {isPy && onOpenCompiler && (
            <button onClick={run} style={{ background:'none', border:'none', cursor:'pointer', color:justRan?'#4ade80':'#ccc', fontSize:'12px', fontWeight:700, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, padding:0 }}>
              <Play size={12} fill={justRan?'#4ade80':'#ccc'} color={justRan?'#4ade80':'#ccc'}/>
              {justRan ? 'Opening...' : 'Run'}
            </button>
          )}
          <button onClick={copy} style={{ background:'none', border:'none', cursor:'pointer', color:copied?'#4ade80':'#ccc', fontSize:'12px', fontWeight:700, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, padding:0 }}>
            {copied ? <Check size={12}/> : <Copy size={12}/>}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div style={{ background:'#1a1a1a', padding:'12px', width:'100%', boxSizing:'border-box', overflow:'hidden' }}>
        <HiCode code={content}/>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  QUIZ CARD
// ═══════════════════════════════════════════════
const QuizCard = ({ question, options, answer, explanation, codeSnippet, isDark }) => {
  const [sel, setSel]           = useState(null);
  const [revealed, setRevealed] = useState(false);
  const LBL = ['A','B','C','D'];

  const btnStyle = (l) => {
    const base = { width:'100%', padding:'10px 12px', borderRadius:9, cursor:revealed?'default':'pointer', display:'flex', alignItems:'center', gap:8, fontSize:'13px', fontWeight:500, lineHeight:1.45, transition:'all 0.2s', border:'2px solid transparent', textAlign:'left', fontFamily:'inherit', background:'transparent', boxSizing:'border-box' };
    if (!revealed) return sel===l ? {...base,background:'rgba(99,102,241,0.16)',border:'2px solid #6366f1',color:isDark?'#c7d2fe':'#4338ca'} : {...base,background:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)',color:isDark?'#cbd5e1':'#475569'};
    if (l===answer) return {...base,background:'rgba(74,222,128,0.12)',border:'2px solid #4ade80',color:isDark?'#86efac':'#15803d'};
    if (l===sel)    return {...base,background:'rgba(239,68,68,0.09)',border:'2px solid #ef4444',color:isDark?'#fca5a5':'#b91c1c'};
    return {...base,color:isDark?'#1e293b':'#cbd5e1',opacity:0.4};
  };

  return (
    <div style={{ borderRadius:14, overflow:'hidden', margin:'8px 0', border:'1.5px solid rgba(99,102,241,0.2)' }}>
      <div style={{ background:'linear-gradient(135deg,#6366f1,#7c3aed,#ec4899)', padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <HelpCircle size={14} color="rgba(255,255,255,0.9)"/>
        <span style={{ fontSize:'11px', fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'0.07em' }}>🧠 Python Quiz</span>
      </div>
      <div style={{ background:isDark?'#131c2e':'#fff', padding:'14px' }}>
        <div style={{ fontSize:'14px', fontWeight:700, color:isDark?'#e2e8f0':'#1e293b', lineHeight:1.6, marginBottom:12 }}>❓ {question}</div>
        {codeSnippet && (
          <div style={{ marginBottom:12, borderRadius:9, overflow:'hidden', border:'1px solid rgba(99,102,241,0.18)' }}>
            <div style={{ background:'#2d2d2d', padding:'4px 10px' }}><span style={{ fontSize:'10px', color:'#888', fontWeight:700, textTransform:'uppercase', fontFamily:'"Fira Code",monospace' }}>python</span></div>
            <div style={{ background:'#1e1e1e', padding:'10px' }}><HiCode code={codeSnippet}/></div>
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {LBL.map(l => (
            <button key={l} onClick={()=>{ if(!revealed) setSel(l); }} style={btnStyle(l)}>
              <span style={{ width:24, height:24, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, background:revealed&&l===answer?'rgba(74,222,128,0.22)':revealed&&l===sel?'rgba(239,68,68,0.16)':sel===l&&!revealed?'rgba(99,102,241,0.25)':isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)', color:revealed&&l===answer?'#4ade80':revealed&&l===sel?'#ef4444':sel===l&&!revealed?'#6366f1':isDark?'#334155':'#94a3b8' }}>{l}</span>
              <span style={{flex:1}}>{options[l]}</span>
              {revealed&&l===answer&&<span>✅</span>}
              {revealed&&l===sel&&l!==answer&&<span>❌</span>}
            </button>
          ))}
        </div>
        {!revealed
          ? <button onClick={()=>{ if(sel) setRevealed(true); }} disabled={!sel} style={{ marginTop:12, width:'100%', padding:'10px', background:sel?'linear-gradient(135deg,#6366f1,#7c3aed)':isDark?'#0f172a':'#f1f5f9', border:`1.5px solid ${sel?'transparent':isDark?'#1e293b':'#e2e8f0'}`, borderRadius:9, color:sel?'#fff':isDark?'#1e293b':'#94a3b8', fontWeight:800, fontSize:'13px', cursor:sel?'pointer':'not-allowed', fontFamily:'inherit' }}>
              {sel ? '🎯 Check Answer' : '👆 Select an option first'}
            </button>
          : <div style={{ marginTop:12, padding:'10px 14px', borderRadius:11, background:isDark?'rgba(99,102,241,0.09)':'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.16)' }}>
              <div style={{ fontSize:'11px', fontWeight:800, color:'#6366f1', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>💡 Explanation</div>
              <div style={{ fontSize:'13px', color:isDark?'#cbd5e1':'#475569', lineHeight:1.6 }}>{explanation}</div>
              {sel===answer
                ? <div style={{ marginTop:6, fontSize:'13px', fontWeight:800, color:'#4ade80' }}>🎉 Correct! Keep it up! 🔥</div>
                : <div style={{ marginTop:6, fontSize:'12px', fontWeight:700, color:'#f87171' }}>Correct: <strong style={{color:'#4ade80'}}>{answer}</strong> — {options[answer]}</div>
              }
            </div>
        }
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  MESSAGE PARSER
// ═══════════════════════════════════════════════
const parseMessage = (text) => {
  const segs  = [];
  const regex = /```(\w*)\n?([\s\S]*?)```|\[\[QUIZ\]\]([\s\S]*?)\[\[\/QUIZ\]\]/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) segs.push({ type:'text', content:text.slice(last, m.index) });
    if (m[0].startsWith('```')) {
      segs.push({ type:'code', lang:m[1]||'plaintext', content:m[2].trim() });
    } else {
      const raw = m[3];
      const get = k => { const r = raw.match(new RegExp(`${k}:\\s*(.+)`)); return r?r[1].trim():''; };
      const cm  = raw.match(/\[\[CODE\]\]([\s\S]*?)\[\[\/CODE\]\]/);
      const opts = {}; ['A','B','C','D'].forEach(l=>{ opts[l]=get(l); });
      segs.push({ type:'quiz', question:get('QUESTION'), options:opts, answer:get('ANSWER').toUpperCase(), explanation:get('EXPLANATION'), codeSnippet:cm?cm[1].trim():null });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ type:'text', content:text.slice(last) });
  return segs;
};

const cleanText = raw => raw
  .replace(/\*\*(.+?)\*\*/g,'**$1**').replace(/#{1,6}\s+/g,'').replace(/`([^`]+)`/g,'$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/^\|.*\|$/gm,'').replace(/^\s*[-:]+\s*\|.*$/gm,'')
  .replace(/^\s*\|[-:| ]+\|?\s*$/gm,'').replace(/^\s*[-*+]\s/gm,'• ').replace(/\n{3,}/g,'\n\n')
  .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();

const MessageContent = ({ text, isDark, onOpenCompiler }) => {
  const segs = parseMessage(text);
  return (
    <div style={{ width:'100%', minWidth:0, maxWidth:'100%', overflow:'hidden' }}>
      {segs.map((seg,i) => {
        if (seg.type==='code') return <CodeBlock key={i} lang={seg.lang} content={seg.content} onOpenCompiler={onOpenCompiler}/>;
        if (seg.type==='quiz') return <QuizCard  key={i} {...seg} isDark={isDark}/>;
        const c = cleanText(seg.content);
        if (!c) return null;
        return (
          <div key={i} style={{ whiteSpace:'pre-wrap', wordBreak:'break-word', overflowWrap:'break-word', color:isDark?'#e2e8f0':'#1e293b', fontSize:'14px', lineHeight:1.7 }}>
            {c.split(/(\*\*[^*]+\*\*)/g).map((p,j) =>
              p.startsWith('**')&&p.endsWith('**')
                ? <strong key={j} style={{color:isDark?'#c7d2fe':'#4338ca',fontWeight:700}}>{p.slice(2,-2)}</strong>
                : p
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════
//  PROGRESS DRAWER
// ═══════════════════════════════════════════════
const ProgressPanel = ({ completedTopics, onToggle, isDark, onClose }) => (
  <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
    <div style={{ width:'100%', maxWidth:'500px', background:isDark?'#0d1117':'#fff', borderRadius:'20px 20px 0 0', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ background:'linear-gradient(135deg,#6366f1,#7c3aed)', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ color:'#fff', fontWeight:800, fontSize:'15px' }}>📚 Learning Progress</div>
          <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'11px' }}>{completedTopics.length}/{PYTHON_TOPICS.length} topics done</div>
        </div>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.18)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
      </div>
      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.05)':'#f0f0f0'}` }}>
        <div style={{ height:6, background:isDark?'#1e293b':'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(completedTopics.length/PYTHON_TOPICS.length)*100}%`, background:'linear-gradient(90deg,#6366f1,#ec4899)', borderRadius:99, transition:'width 0.5s ease' }}/>
        </div>
        <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:6, textAlign:'center' }}>
          {Math.round((completedTopics.length/PYTHON_TOPICS.length)*100)}% Complete 🚀
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
        {PYTHON_TOPICS.map(t => {
          const done = completedTopics.includes(t.id);
          return (
            <button key={t.id} onClick={()=>onToggle(t.id)} style={{ width:'100%', padding:'10px 12px', borderRadius:11, marginBottom:6, border:`1.5px solid ${done?t.color+'40':isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'}`, background:done?`${t.color}12`:'transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:10, textAlign:'left', fontFamily:'inherit' }}>
              <span style={{fontSize:'18px'}}>{t.emoji}</span>
              <span style={{flex:1,fontSize:'13px',fontWeight:700,color:done?t.color:isDark?'#e2e8f0':'#1e293b'}}>{t.label}</span>
              <span style={{fontSize:'16px'}}>{done?'✅':'⭕'}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════
//  GLOBAL MESSAGE STORE
// ═══════════════════════════════════════════════
const MSG_STORE_KEY = 'fuz_chat_messages';
const saveMessages  = (msgs) => { try { sessionStorage.setItem(MSG_STORE_KEY, JSON.stringify(msgs.slice(-60))); } catch {} };
const loadMessages  = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(MSG_STORE_KEY) || 'null');
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
  } catch {}
  return null;
};

const DEFAULT_MSG = [{
  from:'bot',
  text:"Hey! 👋✨ I'm **ZEHRA** — your FaizUpyZone AI mentor! 🤖🔥\n\nFrom Python basics to advanced OOP, live quizzes, code compiler, PDF explainer — everything is right here!\n\nAsk me anything — technical or otherwise! 😄",
  time: new Date().toISOString()
}];

// ═══════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════
const AIChatPage = ({ setCurrentPage, user, openCompiler }) => {
  const { isDark } = useTheme();

  const [messages,        setMessages]       = useState(() => loadMessages() || DEFAULT_MSG);
  const [input,           setInput]          = useState('');
  const [isLoading,       setIsLoading]      = useState(false);
  const [streamingText,   setStreamingText]  = useState('');
  const [historyLoaded,   setHistoryLoaded]  = useState(false);
  const [showProgress,    setShowProgress]   = useState(false);
  const [showPdf,         setShowPdf]        = useState(false);
  const [completedTopics, setCompletedTopics]= useState(() => { try { return JSON.parse(localStorage.getItem('fuz_topics')||'[]'); } catch { return []; } });
  const [quizStreak,      setQuizStreak]     = useState(() => parseInt(localStorage.getItem('fuz_streak')||'0'));
  const [reactions,       setReactions]      = useState({});

  const abortRef  = useRef(null);
  const msgEnd    = useRef(null);
  const inputRef  = useRef(null);
  const streamRef = useRef('');

  useEffect(() => { saveMessages(messages); }, [messages]);

  useEffect(() => {
    if (user?.email && !historyLoaded) {
      loadHistoryFromDb(user.email).then(hist => {
        if (hist.length > 0 && !loadMessages()) {
          setMessages([DEFAULT_MSG[0], ...hist.slice(-10).map(m=>({...m,time:new Date().toISOString()}))]);
        }
        setHistoryLoaded(true);
      });
    }
  }, [user?.email, historyLoaded]);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, streamingText]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 350); }, []);

  const toggleTopic = id => {
    setCompletedTopics(prev => {
      const u = prev.includes(id) ? prev.filter(t=>t!==id) : [...prev,id];
      localStorage.setItem('fuz_topics', JSON.stringify(u));
      return u;
    });
  };

  const addReaction = (idx, em) => {
    setReactions(p => ({...p,[idx]:p[idx]===em?null:em}));
    if (em==='🔥') { setQuizStreak(s => { const n=s+1; localStorage.setItem('fuz_streak',n); return n; }); }
  };

  const stopGeneration = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current=null; }
    if (streamRef.current) setMessages(p => [...p,{from:'bot',text:streamRef.current,time:new Date().toISOString()}]);
    streamRef.current=''; setStreamingText(''); setIsLoading(false);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const msg = (text||input).trim();
    if (!msg || isLoading) return;
    setInput('');
    const userMsg = { from:'user', text:msg, time:new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true); setStreamingText(''); streamRef.current='';
    saveMsgToDb(user?.email,'user',msg);

    const apiMsgs = [
      { role:'system', content:SYSTEM_PROMPT },
      ...updated.map(m=>({ role:m.from==='user'?'user':'assistant', content:m.text })),
    ];
    abortRef.current = new AbortController();
    try {
      const resp = await fetch(`${BASE_URL}/chat/completions`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${HF_TOKEN}`, 'Content-Type':'application/json' },
        body:JSON.stringify({ model:MODEL, messages:apiMsgs, stream:true, max_tokens:700, temperature:0.65 }),
        signal:abortRef.current.signal,
      });
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, {stream:true});
        const lines = buf.split('\n'); buf = lines.pop()??'';
        for (const line of lines) {
          const t = line.trim();
          if (!t || t==='data: [DONE]' || !t.startsWith('data: ')) continue;
          try {
            const delta = JSON.parse(t.slice(6))?.choices?.[0]?.delta?.content??'';
            if (!delta) continue;
            for (const part of delta.split(/(\s+)/)) {
              streamRef.current += part; setStreamingText(streamRef.current);
              if (part.trim()) await new Promise(r=>setTimeout(r,18));
            }
          } catch {}
        }
      }
      const final = streamRef.current || "Hmm, didn't get a response 😅 Please try again!";
      setMessages(p => [...p,{from:'bot',text:final,time:new Date().toISOString()}]);
      saveMsgToDb(user?.email,'assistant',final);
      setStreamingText(''); streamRef.current='';
    } catch(err) {
      if (err.name==='AbortError') return;
      setMessages(p => [...p,{from:'bot',text:err.message?.includes('429')?'⚠️ Too many requests! Please wait a moment and try again 😅':'Oops! 😅 Something went wrong. Please try again!',time:new Date().toISOString()}]);
      setStreamingText(''); streamRef.current='';
    } finally {
      setIsLoading(false); abortRef.current=null;
      setTimeout(() => inputRef.current?.focus(), 160);
    }
  }, [input, messages, isLoading, user?.email]);

  const handleExplainPdf = useCallback(async (pdf) => {
    setShowPdf(false);
    sendMessage(`Maine ek PDF upload ki hai jiska naam hai "${pdf.name}". Please is PDF ke naam se guess karo ke yeh kis topic ke baare mein hai, aur mujhse puchho ke main PDF ka text paste karun taake tum detail mein explain kar sako.`);
  }, [sendMessage]);

  const handleOpenCompiler = useCallback((code = '') => {
    if (openCompiler) openCompiler(code);
  }, [openCompiler]);

  const handleKey  = e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const clearChat  = () => {
    stopGeneration();
    const fresh = [{ from:'bot', text:'Chat cleared! 🔄 Fresh start — let\'s learn something new! 😊', time:new Date().toISOString() }];
    setMessages(fresh);
    saveMessages(fresh);
  };
  const exportChat = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([messages.map(m=>`[${m.from.toUpperCase()}]\n${m.text}`).join('\n\n---\n\n')],{type:'text/plain'}));
    a.download = 'faizupyzone-chat.txt'; a.click();
  };
  const fmt = iso => { try { return new Date(iso).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}); } catch { return ''; } };

  const botBg  = isDark ? 'rgba(17,24,39,0.9)' : 'rgba(241,245,249,0.9)';
  const text   = isDark ? '#e2e8f0' : '#1e293b';

  return (
    <div style={{ position:'fixed', inset:0, background:'transparent', display:'flex', flexDirection:'column', alignItems:'center', width:'100%', boxSizing:'border-box', zIndex:500 }}>

      {showProgress && <ProgressPanel completedTopics={completedTopics} onToggle={toggleTopic} isDark={isDark} onClose={()=>setShowProgress(false)}/>}
      {showPdf      && <PdfPanel isDark={isDark} onClose={()=>setShowPdf(false)} onExplain={handleExplainPdf}/>}

      <div style={{ width:'100%', maxWidth:'680px', display:'flex', flexDirection:'column', height:'100%', boxSizing:'border-box' }}>

        {/* ══════ HEADER ══════ */}
        <div style={{
          position: 'relative',
          flexShrink: 0,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: isDark
            ? 'rgba(12,8,32,0.75)'
            : 'rgba(255,255,255,0.6)',
          borderBottom: isDark
            ? '1px solid rgba(139,92,246,0.2)'
            : '1px solid rgba(139,92,246,0.15)',
        }}>

          {/* Thin accent line top */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.6) 30%, rgba(236,72,153,0.5) 70%, transparent 100%)', pointerEvents:'none' }}/>

          {/* Row 1 */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px 10px' }}>

            {/* Back */}
            <button onClick={() => setCurrentPage && setCurrentPage('home')}
              style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.2s', border: isDark ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(139,92,246,0.25)', background: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.06)' }}
              onMouseEnter={e=>e.currentTarget.style.background= isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.12)'}
              onMouseLeave={e=>e.currentTarget.style.background= isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.06)'}
              onTouchStart={e=>e.currentTarget.style.opacity='0.7'}
              onTouchEnd={e=>e.currentTarget.style.opacity='1'}
            >
              <ArrowLeft size={16} color={isDark ? '#a5b4fc' : '#6d28d9'}/>
            </button>

            {/* Avatar — simple ring, no rotation */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:42, height:42, background:'linear-gradient(135deg,#818cf8,#ec4899)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow: isDark ? '0 2px 12px rgba(99,102,241,0.35)' : '0 2px 10px rgba(99,102,241,0.2)' }}>👩‍💻</div>
              {/* Simple online dot */}
              <span style={{ position:'absolute', bottom:1, right:1, width:9, height:9, borderRadius:'50%', background: isLoading ? '#f59e0b' : '#22c55e', border: isDark ? '2px solid rgba(12,8,32,0.9)' : '2px solid rgba(255,255,255,0.9)', display:'block' }}/>
            </div>

            {/* Name + status */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:'15px', letterSpacing:'0.01em', color: isDark ? '#e2e8f0' : '#1e293b', lineHeight:1.2 }}>
                ZEHRA <span style={{ fontSize:'13px' }}>🌸</span>
              </div>
              <div style={{ fontSize:'11px', fontWeight:500, color: isDark ? 'rgba(167,139,250,0.8)' : 'rgba(109,40,217,0.7)', marginTop:2 }}>
                {isLoading ? 'Typing...' : 'Online · GPT-OSS 120B'}
              </div>
            </div>

            {/* Streak */}
            <div style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:9, border: isDark ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(245,158,11,0.3)', background: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.06)' }}>
              <Flame size={13} color="#f59e0b"/>
              <span style={{ fontSize:'13px', fontWeight:700, color: isDark ? '#fbbf24' : '#d97706' }}>{quizStreak}</span>
            </div>
          </div>

          {/* Row 2: Buttons */}
          <div style={{ display:'flex', gap:6, padding:'0 14px 12px' }}>
            {[
              { label:'Progress', icon:<BookOpen size={15}/>, color:'#818cf8', border:'rgba(99,102,241,0.3)',  bg: isDark ? 'rgba(99,102,241,0.09)' : 'rgba(99,102,241,0.06)', onClick:()=>setShowProgress(true), badge: completedTopics.length || null },
              { label:'Compiler', icon:<Terminal size={15}/>,  color:'#34d399', border:'rgba(16,185,129,0.3)', bg: isDark ? 'rgba(16,185,129,0.09)' : 'rgba(16,185,129,0.06)', onClick:()=>handleOpenCompiler('') },
              { label:'PDF',      icon:<FileText size={15}/>,  color:'#f472b6', border:'rgba(236,72,153,0.3)', bg: isDark ? 'rgba(236,72,153,0.09)' : 'rgba(236,72,153,0.06)', onClick:()=>setShowPdf(true) },
              { label:'Export',   icon:<Download size={15}/>,  color:'#38bdf8', border:'rgba(14,165,233,0.3)', bg: isDark ? 'rgba(14,165,233,0.09)' : 'rgba(14,165,233,0.06)', onClick:exportChat },
              { label:'Clear',    icon:<RotateCcw size={15}/>, color:'#f87171', border:'rgba(239,68,68,0.28)',  bg: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)', onClick:clearChat },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick}
                style={{ flex:1, padding:'9px 4px 7px', borderRadius:11, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer', transition:'all 0.18s', border:`1px solid ${btn.border}`, background: btn.bg, position:'relative' }}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.8'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                onTouchStart={e=>e.currentTarget.style.opacity='0.7'}
                onTouchEnd={e=>e.currentTarget.style.opacity='1'}
              >
                <span style={{ color: btn.color, display:'flex' }}>{btn.icon}</span>
                <span style={{ fontSize:'9px', fontWeight:700, color: btn.color, letterSpacing:'0.03em' }}>{btn.label}</span>
                {btn.badge ? <span style={{ position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:'50%', background:'#6366f1', color:'#fff', fontSize:'9px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border: isDark ? '2px solid rgba(12,8,32,1)' : '2px solid #fff' }}>{btn.badge}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {/* ── MESSAGES AREA ── */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'12px', display:'flex', flexDirection:'column', gap:10, WebkitOverflowScrolling:'touch', background:'transparent' }}>
          {messages.map((msg,i) => (
            <div key={i} style={{ display:'flex', justifyContent:msg.from==='user'?'flex-end':'flex-start', alignItems:'flex-start', gap:8, animation:'msgIn 0.25s ease' }}>
              {msg.from==='bot' && (
                <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#6366f1,#ec4899)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, marginTop:2 }}>👩‍💻</div>
              )}

              <div style={{ maxWidth:msg.from==='user'?'82%':'92%', display:'flex', flexDirection:'column', gap:3, minWidth:0, overflow:'hidden', width:msg.from==='bot'?'92%':undefined }}>
                <div style={{ padding:'10px 12px', borderRadius:msg.from==='user'?'14px 14px 3px 14px':'14px 14px 14px 3px', background:msg.from==='user'?'linear-gradient(135deg,#6366f1,#7c3aed)':botBg, color:msg.from==='user'?'#fff':text, boxShadow:msg.from==='user'?'0 3px 12px rgba(99,102,241,0.3)':isDark?'0 2px 8px rgba(0,0,0,0.25)':'0 2px 6px rgba(0,0,0,0.04)', width:'100%', boxSizing:'border-box', overflow:'hidden', wordBreak:'break-word' }}>
                  {msg.from==='user'
                    ? <span style={{ fontSize:'14px', fontWeight:600, lineHeight:1.55, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.text}</span>
                    : <MessageContent text={msg.text} isDark={isDark} onOpenCompiler={handleOpenCompiler}/>
                  }
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:msg.from==='user'?'flex-end':'flex-start', padding:'0 4px' }}>
                  <span style={{ fontSize:'10px', color:isDark?'rgba(255,255,255,0.25)':'#d0d9e8' }}>{fmt(msg.time)}</span>
                  {msg.from==='bot' && (
                    <div style={{ display:'flex', gap:3 }}>
                      {['👍','❤️','🔥'].map(em => (
                        <button key={em} onClick={()=>addReaction(i,em)} style={{ background:reactions[i]===em?'rgba(99,102,241,0.15)':'transparent', border:reactions[i]===em?'1px solid rgba(99,102,241,0.25)':'1px solid transparent', borderRadius:5, padding:'2px 5px', cursor:'pointer', fontSize:'12px' }}>{em}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {msg.from==='user' && (
                <div style={{ width:30, height:30, borderRadius:9, background:isDark?'rgba(255,255,255,0.08)':'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                  <User size={13} color={isDark?'rgba(255,255,255,0.5)':'#94a3b8'}/>
                </div>
              )}
            </div>
          ))}

          {/* Streaming bubble */}
          {(isLoading || streamingText) && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#6366f1,#ec4899)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, marginTop:2, animation:'botPulse 1.5s ease-in-out infinite' }}>👩‍💻</div>
              <div style={{ maxWidth:'92%', padding:'10px 12px', borderRadius:'14px 14px 14px 3px', background:botBg, minWidth:60, overflow:'hidden', boxSizing:'border-box', wordBreak:'break-word' }}>
                {streamingText
                  ? <><MessageContent text={streamingText} isDark={isDark} onOpenCompiler={handleOpenCompiler}/><span style={{ display:'inline-block', width:2, height:14, background:'#6366f1', marginLeft:2, verticalAlign:'middle', animation:'blink 0.6s ease-in-out infinite' }}/></>
                  : <span style={{ display:'inline-flex', gap:4, alignItems:'center', padding:'4px 0' }}>
                      {[0,1,2].map(j => <span key={j} style={{ width:7, height:7, borderRadius:'50%', background:`hsl(${j*40+240},72%,60%)`, display:'inline-block', animation:'typDot 1.2s ease-in-out infinite', animationDelay:`${j*0.2}s` }}/>)}
                    </span>
                }
              </div>
            </div>
          )}
          <div ref={msgEnd}/>
        </div>

        {/* ── INPUT BAR ── */}
        <div style={{ background:'transparent', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderTop:`1px solid rgba(255,255,255,0.08)`, padding:'10px 12px', paddingBottom:'max(10px, env(safe-area-inset-bottom))', display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isLoading ? 'Thinking... 🌸' : 'Ask me anything! 🌸'}
            disabled={isLoading}
            style={{ flex:1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', border:`1.5px solid rgba(255,255,255,0.12)`, borderRadius:12, padding:'11px 14px', fontSize:'14px', color: isDark ? '#e2e8f0' : '#1e293b', outline:'none', fontFamily:'inherit', minWidth:0, WebkitAppearance:'none', appearance:'none' }}
            onFocus={e => { e.target.style.borderColor='rgba(99,102,241,0.6)'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'; }}
            onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.12)'; e.target.style.boxShadow='none'; }}
          />
          {isLoading
            ? <button onClick={stopGeneration} style={{ width:44, height:44, background:'linear-gradient(135deg,#ef4444,#dc2626)', border:'none', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}><StopCircle size={18} color="#fff"/></button>
            : <button onClick={()=>sendMessage()} disabled={!input.trim()} style={{ width:44, height:44, background:input.trim()?'linear-gradient(135deg,#6366f1,#ec4899)':'rgba(255,255,255,0.08)', border:'none', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:input.trim()?'pointer':'not-allowed', flexShrink:0, transition:'all 0.2s' }}><Send size={17} color={input.trim()?'#fff':'rgba(255,255,255,0.3)'}/></button>
          }
        </div>
      </div>

      <style>{`
        @keyframes msgIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typDot { 0%,100%{opacity:.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-4px)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes botPulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.3)} 50%{box-shadow:0 0 0 5px rgba(99,102,241,0)} }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.2); border-radius:2px }
      `}</style>
    </div>
  );
};

export default AIChatPage;