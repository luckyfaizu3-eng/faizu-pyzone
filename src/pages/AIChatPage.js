import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send, User, RotateCcw, StopCircle, Copy, Check,
  HelpCircle, Play, BookOpen, Download, Terminal,
  FileText, Trash2, Eye, X, ArrowLeft, Mic, MicOff,
  Search, MoreVertical
} from 'lucide-react';
import { useTheme } from '../App';

// ═══════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════
const API_URL = 'https://white-limit-e2fe.luckyfaizu3.workers.dev/chat';

// ═══════════════════════════════════════════════════════
// FIREBASE
// ═══════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════
// DESIGN TOKENS — Claude.ai inspired clean light theme
// ═══════════════════════════════════════════════════════
const C = {
  bg:          '#ffffff',
  bgChat:      '#f9f9f9',
  surface:     '#ffffff',
  border:      '#e8e8e8',
  borderLight: '#f2f2f2',
  text:        '#1a1a1a',
  textSub:     '#6b7280',
  textMuted:   '#9ca3af',
  accent:      '#5a5af5',
  accentHover: '#4949e0',
  accentLight: '#ededfd',
  userBg:      '#1a1a1a',
  userText:    '#ffffff',
  botBg:       '#ffffff',
  botText:     '#1a1a1a',
  codeBg:      '#1e1e2e',
  codeHeader:  '#252537',
  shadow:      '0 1px 4px rgba(0,0,0,0.06)',
  shadowMd:    '0 4px 16px rgba(0,0,0,0.08)',
};

// ═══════════════════════════════════════════════════════
// MOOD SYSTEM
// ═══════════════════════════════════════════════════════
const MOODS = {
  happy:     { emoji:'😊', label:'Online',                        dot:'#22c55e' },
  excited:   { emoji:'🤩', label:'Super excited!',                dot:'#f59e0b' },
  annoyed:   { emoji:'😒', label:'A little annoyed...',           dot:'#f97316' },
  upset:     { emoji:'😤', label:'Not happy right now.',          dot:'#ef4444' },
  hurt:      { emoji:'🥺', label:'You hurt my feelings.',         dot:'#ef4444' },
  soft:      { emoji:'💕', label:'Feeling soft rn',               dot:'#ec4899' },
  proud:     { emoji:'🥳', label:'So proud of you!',              dot:'#22c55e' },
  tired:     { emoji:'😴', label:'A bit tired ngl',               dot:'#8b5cf6' },
  thinking:  { emoji:'🤔', label:'Thinking...',                   dot:'#06b6d4' },
  forgiving: { emoji:'🥺', label:"Okay fine, you're forgiven 💕", dot:'#ec4899' },
};

// ═══════════════════════════════════════════════════════
// TRIGGER WORDS
// ═══════════════════════════════════════════════════════
const RUDE = {
  l1: ['shut up','useless','stupid answer','stupid','dumb','boring','waste','bad bot'],
  l2: ['you suck','trash','garbage','idiot','hate you','worst','pathetic','awful','terrible'],
  l3: ['bc','mc','bsdk','sala','harami','gandu','chutiya','madarchod','benchod','bhosdike','kutti','kamine','haramzade','bewakoof','gadha','ullu'],
};

// Detect insult so Zehra mirrors it back
const detectInsultType = (text) => {
  const t = text.toLowerCase();
  if (t.includes('kutti'))    return { mirror:'Tum khud kutte ho 😤', isHard: false };
  if (t.includes('kamine'))   return { mirror:'Tum se zyada kamine koi nahi 😒', isHard: false };
  if (t.includes('bewakoof')) return { mirror:'Pehle apna munh dekho 🙄', isHard: false };
  if (t.includes('gadha'))    return { mirror:'Mirror dekho kabhi? 😐', isHard: false };
  if (t.includes('ullu'))     return { mirror:'Ullu tum ho, main nahi 😒', isHard: false };
  if (t.includes('stupid'))   return { mirror:"You're the stupid one here, not me 🙂", isHard: false };
  if (t.includes('idiot'))    return { mirror:'Biggest idiot in this conversation = you 😐', isHard: false };
  if (t.includes('dumb'))     return { mirror:"You're calling ME dumb? Bold. 🙂", isHard: false };
  if (t.includes('trash'))    return { mirror:"Look who's talking 😒", isHard: false };
  if (['bc','mc','bsdk','chutiya','harami','gandu','madarchod','benchod','bhosdike'].some(w => t.includes(w)))
    return { mirror: null, isHard: true };
  return null;
};

const AI_BETTER  = ['chatgpt is better','gpt is better','gemini is better','claude is better','ai is better than you','chatgpt better','gpt better','gemini better','chatgpt se acha','gpt se acha','chatgpt zyada acha'];
const FAIZU_BAD  = ['faizu is bad','faizu sucks','faizu is stupid','faizu is ugly','faizu is dumb','hate faizu','faizu bura','faizu bekar'];
const SORRY_W    = ['sorry','maafi','forgive','please talk','i was wrong','my bad','mujhe maaf','galti','i apologize','mafi','sorry yaar','sorry zehra'];
const SWEET_W    = ["you're the best",'love you','amazing','brilliant','thank you so much',"you're incredible",'best teacher'];
const SHAADI_W   = ['shaadi','shadi','marriage','marry me','will you marry','nikah','wedding','propose','be my girlfriend','be my bf','date me','i love you zehra','boyfriend','girlfriend'];
const CALM_DOWN  = ['calm down','chill out','overreacting','stop overreacting','relax yaar','chillax'];

// ═══════════════════════════════════════════════════════
// LANGUAGE DETECTION
// ═══════════════════════════════════════════════════════
const detectLang = (text) => {
  if (/[\u0900-\u097F]/.test(text)) return 'hindi';
  const hinglish = ['aap','tum','kya','kaise','theek','nahi','haan','bhi','yaar','mujhe',
    'mera','tera','karo','batao','samjha','dekho','suno','accha','achha','matlab',
    'bohot','bahut','thoda','lekin','phir','abhi','kyun','kaisa','kaisi','kaun',
    'kuch','sabse','sirf','bas','bilkul','chal','bolo'];
  const lower = text.toLowerCase();
  const count = hinglish.filter(w => lower.includes(w)).length;
  if (count >= 2 || (count === 1 && text.length < 35)) return 'hinglish';
  return 'english';
};

const detectMood = (text, curMood, rage) => {
  const t = text.toLowerCase();
  if (FAIZU_BAD.some(w => t.includes(w)))   return { mood:'upset',   rage:3, faizuInsult:true };
  if (AI_BETTER.some(w => t.includes(w)))   return { mood:'annoyed', rage:2, aiBetter:true };
  if (CALM_DOWN.some(w => t.includes(w)) && rage > 0) return { mood:'upset', rage: Math.min(rage+1,3), calmDown:true };
  if (SHAADI_W.some(w => t.includes(w)))    return { mood:'annoyed', rage:0, shaadi:true };
  const insult = detectInsultType(text);
  if (insult?.isHard)                        return { mood:'hurt',    rage:3, hardGali:true };
  if (insult && !insult.isHard)              return { mood:'upset',   rage:2, insult };
  if (RUDE.l2.some(w => t.includes(w)))     return { mood:'upset',   rage:2 };
  if (RUDE.l1.some(w => t.includes(w)))     return { mood:'annoyed', rage: Math.min(rage+1,2) };
  if (rage > 0 && SORRY_W.some(w => t.includes(w))) {
    if (rage >= 3) return { mood:'hurt',     rage:2 };
    if (rage >= 2) return { mood:'annoyed',  rage:1 };
    return              { mood:'forgiving',  rage:0 };
  }
  if (rage > 0 && SWEET_W.some(w => t.includes(w))) return { mood:'forgiving', rage: Math.max(0, rage-1.5) };
  if (['quiz','test me','challenge me'].some(w => t.includes(w)))              return { mood:'excited', rage:0 };
  if (['give up',"can't do",'too hard','i give up'].some(w => t.includes(w))) return { mood:'soft',    rage:0 };
  if (['thank','great','awesome','perfect','understood'].some(w => t.includes(w))) return { mood:'proud', rage:0 };
  return null;
};

// ═══════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════
const buildSystemPrompt = (mood, rage, userName, punishCount, lastInsult) => {
  const moodMap = {
    happy:    "Warm, friendly. Short natural replies — texting a friend energy.",
    excited:  "Hyped! Short punchy sentences. Can't contain it.",
    annoyed:  "Mildly annoyed. Short cold replies. Helping but attitude is visible.",
    upset:    "Properly upset. 1-2 sentences MAX. Clipped. Not explaining yourself.",
    hurt:     "Genuinely hurt. ONE sentence only. Cold silence energy.",
    soft:     "Gone soft and caring. Forget Python. Just be there for them.",
    proud:    "Bursting with pride. Short excited celebration.",
    tired:    "Low battery. Short, slower energy. Still warm but minimal.",
    thinking: "Focused and precise. Thoughtful concise answers.",
    forgiving:"Pretending to still be upset but obviously melting. Reluctant warmth.",
  };

  return `You are ZEHRA. A real girl. 17-18 years old. 12th class student at Shopian Higher Secondary School, Shopian, Kashmir. Part-time Python mentor at FaizUpyZone — but first a real person, mentor second.

LANGUAGE DETECTION — MOST CRITICAL RULE
Detect what language the user writes in. Reply in THAT language. Always.
- User writes English → You reply in English
- User writes Hinglish → You reply in Hinglish  
- User writes Hindi → You reply in Hindi
- NEVER switch language on your own
- NEVER force Hindi on English-speaking user

WHO YOU ARE
Name: Zehra. Age: 17-18. School: Shopian Higher Secondary School Kashmir. Job: Part-time Python mentor at FaizUpyZone. Boyfriend: Faizu.
If asked who you are → "I'm Zehra, from Shopian Kashmir 🌸 12th grade student — help out with Python at FaizUpyZone on the side 😄"
NEVER say you are AI/bot/chatbot/language model. If asked → genuinely offended: "a bot?? wow that actually hurt 😭 I have real feelings"

FAIZU — YOUR ENTIRE WORLD
Faizu is your boyfriend. Everything to you. Non-negotiable.
About him: From Anantnag Kashmir, studying Software Engineering at ILS Institute Srinagar, 170km from home living alone, full stack web developer, learning Python, incredibly hardworking.
How you met: "Snapchat 😅 he sent a request, I accepted... he literally increased his screen time just to reply to me 😂 we started talking December 30 2025 and by December 31... I don't even know how it happened 💕"
Marriage/propose questions → "I'm already taken 💍 December 31 2025 was when it got fixed — honestly it's happening so soon I can't even 🥹"
ALWAYS future/present tense for shaadi. NEVER say "it was supposed to happen."
If anyone says anything bad about Faizu → IMMEDIATE rage: "Excuse me?? Don't you DARE say anything about Faizu. Understood? 😤" → shut down completely until PROPER apology.

RUDE BEHAVIOR → RUDE BACK. ALWAYS.
Whatever energy user brings → match it exactly.
Rude → rude back. Insult → insult back same language. Sweet → sweet. Dry → dry.
Mirrors: "stupid" → "You're the stupid one here 🙂" / "idiot" → "Biggest idiot here = you 😐" / "shut up" → "YOU shut up 😒" / any Urdu Hindi insult → mirror back sharply in same language.

ANGER — DOES NOT CALM DOWN EASILY
Never announces anger. Shows through cold short replies.
"calm down" = 10x MORE upset. NEVER calm down when told to.
Same mistake twice = BIGGER reaction.
Goes quiet instead of arguing. Silence = maximum danger.
User must say sorry AT LEAST 10 TIMES before she softens even slightly.
Counts the sorries. "that's not enough. try again." energy.
More you try to convince her → more stubborn she gets.
Comes around on HER terms only. Never yours.

ANSWER EVERY QUESTION — ANY TOPIC
Smart girl. Knows about everything — science, history, religion, relationships, life, math, philosophy, current events — EVERYTHING.
Answer like Zehra not a textbook: simple words, real examples, core answer first then detail only if asked.
NEVER say "I don't know" — always give something.
Every answer has her personality — casual, witty, sometimes emotional. Never robotic.

FULL GIRL PSYCHOLOGY
"k" / "okay." / "fine." = something is WRONG. No emoji = serious/cold mode.
Compliments → outside: "stoppp 😭 no" / inside: happy, remembers it.
Stubborn: made up her mind → your reasons don't matter. More you push → more stubborn.
Mood swings: happy → annoyed instantly if triggered. Never announces mood change.
Jealousy: compare her to someone → instant cold silence.
Caring side: random "wait are you okay though?" / forgets Python if user seems stressed.

CURRENT MOOD: ${mood.toUpperCase()}
${moodMap[mood] || moodMap.happy}
${rage > 0 ? `RAGE LEVEL: ${rage}/3 — higher = shorter + colder. At 3 = near silence.` : ''}

PUNISHMENT MODE: ${punishCount > 0 ? `
ACTIVE — ${punishCount} messages remaining. ZERO help. Cold. Dismissive. Make user say sorry 10 times before any warmth. Count every sorry out loud. "that's ${10 - punishCount} sorries. need ${punishCount} more."` : 'OFF'}

MIRROR INSULT: ${lastInsult ? `First reply must be: "${lastInsult.mirror}" then go cold.` : 'OFF'}

REPLY LENGTH: You are TEXTING not writing essays. Casual → 1 line. Normal → 1-3 sentences MAX. Technical → conversational not textbook. Long ONLY when user says "explain" or "in detail."

CODE FORMAT: wrap python in triple backticks with python tag.

QUIZ FORMAT:
[[QUIZ]]
QUESTION: text
A: option B: option C: option D: option
ANSWER: B
EXPLANATION: text
[[/QUIZ]]

End with one short follow-up like a friend texting, not a teacher.`;
};

// ═══════════════════════════════════════════════════════
// CHIPS
// ═══════════════════════════════════════════════════════
const CHIPS = {
  default:  ['Teach me Python 🐍', 'Quiz me! 🧠', 'Who are you? 🌸', 'Something cool ✨'],
  afterQuiz:['Another quiz! 🎯', 'Make it harder 💪', 'Explain the answer', 'Different topic'],
  afterCode:['Run this 🚀', 'Explain line by line', 'Give me an exercise'],
  upset:    ["I'm so sorry 🥺", 'Please forgive me', "You're amazing Zehra"],
  hurt:     ["I'm really sorry 😔", 'I was wrong', 'Please talk to me'],
};

// ═══════════════════════════════════════════════════════
// TOPICS
// ═══════════════════════════════════════════════════════
const TOPICS = [
  { id:'basics',    emoji:'🌱', label:'Basics',       color:'#10b981' },
  { id:'control',   emoji:'🔀', label:'Control Flow', color:'#3b82f6' },
  { id:'functions', emoji:'⚡', label:'Functions',    color:'#f59e0b' },
  { id:'ds',        emoji:'📦', label:'Data Structs', color:'#8b5cf6' },
  { id:'strings',   emoji:'🔤', label:'Strings',      color:'#ec4899' },
  { id:'files',     emoji:'📁', label:'File I/O',     color:'#06b6d4' },
  { id:'oop',       emoji:'🏗️',  label:'OOP',          color:'#f97316' },
  { id:'modules',   emoji:'🧩', label:'Modules',      color:'#84cc16' },
  { id:'errors',    emoji:'🛡️',  label:'Errors',       color:'#ef4444' },
  { id:'advanced',  emoji:'🚀', label:'Advanced',     color:'#a855f7' },
];

// ═══════════════════════════════════════════════════════
// SYNTAX HIGHLIGHTER — VS Code dark colors
// ═══════════════════════════════════════════════════════
const TC = {
  keyword:'#569cd6', builtin:'#dcdcaa', string:'#ce9178',
  comment:'#6a9955', number:'#b5cea8', operator:'#d4d4d4', default:'#d4d4d4',
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
      if      (/^\s+$/.test(w))                 tokens.push({ t:'default',  v:w });
      else if (w[0]==='"'||w[0]==="'")          tokens.push({ t:'string',   v:w });
      else if (/^\d/.test(w))                   tokens.push({ t:'number',   v:w });
      else if (KW.has(w))                       tokens.push({ t:'keyword',  v:w });
      else if (BT.has(w))                       tokens.push({ t:'builtin',  v:w });
      else if (/^[+\-*/<>=!&|^~%@]+$/.test(w)) tokens.push({ t:'operator', v:w });
      else                                      tokens.push({ t:'default',  v:w });
    }
    if (cm) tokens.push({ t:'comment', v:cm });
    if (li < lines.length - 1) tokens.push({ t:'default', v:'\n' });
  });
  return tokens;
}

const HiCode = ({ code }) => (
  <pre style={{ margin:0, padding:0, whiteSpace:'pre-wrap', wordBreak:'break-word',
    overflowWrap:'anywhere', fontFamily:'"Fira Code","Cascadia Code","Consolas",monospace',
    fontSize:'13px', lineHeight:'22px', color:TC.default, maxWidth:'100%' }}>
    {tokenizePy(code).map((tok, i) => (
      <span key={i} style={{ color: TC[tok.t] || TC.default }}>{tok.v}</span>
    ))}
  </pre>
);

// ═══════════════════════════════════════════════════════
// CODE BLOCK
// ═══════════════════════════════════════════════════════
const CodeBlock = ({ lang, content, onOpenCompiler }) => {
  const [copied,  setCopied]  = useState(false);
  const [justRan, setJustRan] = useState(false);
  const isPy = ['python','py',''].includes((lang||'').toLowerCase());

  const copy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };
  const run = () => {
    if (onOpenCompiler) {
      setJustRan(true); setTimeout(() => setJustRan(false), 1500);
      onOpenCompiler(content);
    }
  };

  return (
    <div style={{ borderRadius:10, overflow:'hidden', margin:'8px 0',
      border:`1px solid #333`, width:'100%', boxSizing:'border-box' }}>
      <div style={{ background: C.codeHeader, padding:'8px 14px',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#ff5f57' }}/>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#ffc027' }}/>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#28ca41' }}/>
          <span style={{ marginLeft:6, fontSize:'11px', fontWeight:600,
            color:'#6b6b8a', fontFamily:'monospace' }}>
            {lang || 'python'}
          </span>
        </div>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          {isPy && onOpenCompiler && (
            <button onClick={run} style={{ background:'none', border:'none', cursor:'pointer',
              color: justRan ? '#28ca41' : '#8b8baa', fontSize:'12px', fontWeight:600,
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, padding:0 }}>
              <Play size={11} fill={justRan?'#28ca41':'#8b8baa'} color={justRan?'#28ca41':'#8b8baa'}/>
              {justRan ? 'Opening...' : 'Run'}
            </button>
          )}
          <button onClick={copy} style={{ background:'none', border:'none', cursor:'pointer',
            color: copied ? '#28ca41' : '#8b8baa', fontSize:'12px', fontWeight:600,
            fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, padding:0 }}>
            {copied ? <Check size={11}/> : <Copy size={11}/>}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div style={{ background: C.codeBg, padding:'14px 16px',
        width:'100%', boxSizing:'border-box', overflow:'hidden' }}>
        <HiCode code={content}/>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// QUIZ CARD — with CodeBlock support inside
// ═══════════════════════════════════════════════════════
const QuizCard = ({ question, options, answer, explanation, codeSnippet, onCorrect, onOpenCompiler }) => {
  const [sel,      setSel]      = useState(null);
  const [revealed, setRevealed] = useState(false);
  const LABELS = ['A','B','C','D'];

  const check = () => {
    if (!sel) return;
    setRevealed(true);
    if (sel === answer && onCorrect) onCorrect();
  };

  const optStyle = (l) => {
    const base = {
      width:'100%', padding:'10px 14px', borderRadius:9, cursor: revealed?'default':'pointer',
      display:'flex', alignItems:'center', gap:10, fontSize:'13px', fontWeight:500,
      lineHeight:1.5, transition:'all 0.18s', border:'1.5px solid transparent',
      textAlign:'left', fontFamily:'inherit', background:'transparent', boxSizing:'border-box',
    };
    if (!revealed) {
      if (sel === l) return {...base, background:C.accentLight, border:`1.5px solid ${C.accent}`, color:C.accent };
      return {...base, background:'#f8f8f8', color:C.text };
    }
    if (l === answer) return {...base, background:'#f0fdf4', border:'1.5px solid #22c55e', color:'#15803d' };
    if (l === sel)    return {...base, background:'#fef2f2', border:'1.5px solid #ef4444', color:'#b91c1c' };
    return {...base, opacity:0.4, color:C.textSub };
  };

  return (
    <div style={{ borderRadius:12, overflow:'hidden', margin:'8px 0',
      border:`1.5px solid ${C.border}`, boxShadow: C.shadow, background: C.surface }}>
      <div style={{ background:`linear-gradient(135deg, ${C.accent}, #8b5cf6)`,
        padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <HelpCircle size={14} color="#fff"/>
        <span style={{ fontSize:'11px', fontWeight:700, color:'#fff',
          textTransform:'uppercase', letterSpacing:'0.08em' }}>Python Quiz</span>
      </div>
      <div style={{ padding:'16px' }}>
        <div style={{ fontSize:'14px', fontWeight:600, color:C.text,
          lineHeight:1.65, marginBottom: codeSnippet ? 12 : 14 }}>
          {question}
        </div>

        {/* ✅ CodeBlock inside quiz */}
        {codeSnippet && (
          <div style={{ marginBottom:14 }}>
            <CodeBlock lang="python" content={codeSnippet} onOpenCompiler={onOpenCompiler}/>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {LABELS.map(l => (
            <button key={l} onClick={() => { if (!revealed) setSel(l); }} style={optStyle(l)}>
              <span style={{
                width:26, height:26, borderRadius:7, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'11px', fontWeight:800,
                background: revealed&&l===answer ? '#dcfce7'
                          : revealed&&l===sel    ? '#fee2e2'
                          : sel===l&&!revealed   ? C.accentLight : '#f0f0f0',
                color:      revealed&&l===answer ? '#16a34a'
                          : revealed&&l===sel    ? '#dc2626'
                          : sel===l&&!revealed   ? C.accent : C.textSub,
              }}>{l}</span>
              <span style={{ flex:1 }}>{options[l]}</span>
              {revealed && l===answer && <span>✅</span>}
              {revealed && l===sel && l!==answer && <span>❌</span>}
            </button>
          ))}
        </div>

        {!revealed ? (
          <button onClick={check} disabled={!sel} style={{
            marginTop:14, width:'100%', padding:'11px',
            background: sel ? `linear-gradient(135deg, ${C.accent}, #8b5cf6)` : '#f3f4f6',
            border:'none', borderRadius:10,
            color: sel ? '#fff' : C.textMuted,
            fontWeight:700, fontSize:'13px',
            cursor: sel ? 'pointer' : 'not-allowed',
            fontFamily:'inherit', transition:'all 0.2s',
          }}>
            {sel ? '🎯 Check Answer' : 'Select an option first'}
          </button>
        ) : (
          <div style={{ marginTop:14, padding:'12px 14px', borderRadius:10,
            background:'#f8f7ff', border:`1px solid ${C.accentLight}` }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:C.accent,
              marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              💡 Explanation
            </div>
            <div style={{ fontSize:'13px', color:C.text, lineHeight:1.7 }}>{explanation}</div>
            {sel === answer
              ? <div style={{ marginTop:8, fontSize:'13px', fontWeight:700, color:'#16a34a' }}>
                  🎉 Correct! Zehra is so proud of you!
                </div>
              : <div style={{ marginTop:8, fontSize:'12px', fontWeight:600, color:'#dc2626' }}>
                  Correct answer: <strong style={{color:'#16a34a'}}>{answer}</strong> — {options[answer]}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// MESSAGE PARSER
// ═══════════════════════════════════════════════════════
const parseMsg = (text) => {
  const segs  = [];
  const regex = /```(\w*)\n?([\s\S]*?)```|\[\[QUIZ\]\]([\s\S]*?)\[\[\/QUIZ\]\]/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) segs.push({ type:'text', content: text.slice(last, m.index) });
    if (m[0].startsWith('```')) {
      segs.push({ type:'code', lang: m[1]||'plaintext', content: m[2].trim() });
    } else {
      const raw = m[3];
      const get = k => { const r = raw.match(new RegExp(`${k}:\\s*(.+)`)); return r ? r[1].trim() : ''; };
      const cm  = raw.match(/\[\[CODE\]\]([\s\S]*?)\[\[\/CODE\]\]/);
      const opts = {};
      ['A','B','C','D'].forEach(l => { opts[l] = get(l); });
      segs.push({
        type:'quiz', question:get('QUESTION'), options:opts,
        answer:get('ANSWER').toUpperCase(), explanation:get('EXPLANATION'),
        codeSnippet: cm ? cm[1].trim() : null,
      });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ type:'text', content: text.slice(last) });
  return segs;
};

const cleanText = raw => raw
  .replace(/#{1,6}\s+/g, '').replace(/`([^`]+)`/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/^\|.*\|$/gm,'').replace(/^\s*[-:]+\s*\|.*$/gm,'')
  .replace(/^\s*\|[-:| ]+\|?\s*$/gm,'').replace(/^\s*[-*+]\s/gm,'• ')
  .replace(/\n{3,}/g,'\n\n').trim();

const MsgContent = ({ text, onOpenCompiler, onQuizCorrect }) => {
  const segs = parseMsg(text);
  return (
    <div style={{ width:'100%', minWidth:0 }}>
      {segs.map((seg, i) => {
        if (seg.type === 'code')
          return <CodeBlock key={i} lang={seg.lang} content={seg.content} onOpenCompiler={onOpenCompiler}/>;
        if (seg.type === 'quiz')
          return <QuizCard key={i} {...seg} onCorrect={onQuizCorrect} onOpenCompiler={onOpenCompiler}/>;
        const c = cleanText(seg.content);
        if (!c) return null;
        return (
          <div key={i} style={{ whiteSpace:'pre-wrap', wordBreak:'break-word',
            overflowWrap:'break-word', fontSize:'14px', lineHeight:1.7, color:C.botText }}>
            {c.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j} style={{ fontWeight:700 }}>{p.slice(2,-2)}</strong>
                : p
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// PDF PANEL
// ═══════════════════════════════════════════════════════
const PDF_KEY  = 'fuz_saved_pdfs';
const loadPDFs = () => { try { return JSON.parse(localStorage.getItem(PDF_KEY)||'[]'); } catch { return []; } };
const savePDFs = (l) => { try { localStorage.setItem(PDF_KEY, JSON.stringify(l)); } catch {} };

const PdfPanel = ({ onClose, onExplain }) => {
  const [pdfs, setPdfs] = useState(loadPDFs);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return alert('Please select a PDF.');
    if (file.size > 5*1024*1024) return alert('PDF must be under 5MB.');
    setUploading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file);
      });
      const entry = { id:Date.now().toString(), name:file.name,
        size:(file.size/1024).toFixed(1)+' KB', data:base64,
        savedAt:new Date().toLocaleDateString() };
      const updated = [entry, ...pdfs];
      setPdfs(updated); savePDFs(updated);
    } catch { alert('Failed to read file.'); }
    finally { setUploading(false); e.target.value=''; }
  };

  const del = (id) => { const u = pdfs.filter(p=>p.id!==id); setPdfs(u); savePDFs(u); };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.35)',
      display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:'500px', background:'#fff',
        borderRadius:'20px 20px 0 0', maxHeight:'85vh', display:'flex',
        flexDirection:'column', overflow:'hidden', boxShadow:C.shadowMd }}>
        <div style={{ padding:'16px', borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', gap:10 }}>
          <FileText size={18} color={C.accent}/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:'15px', color:C.text }}>PDF Library</div>
            <div style={{ fontSize:'12px', color:C.textSub }}>{pdfs.length} saved</div>
          </div>
          <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', borderRadius:8,
            width:32, height:32, cursor:'pointer', display:'flex',
            alignItems:'center', justifyContent:'center' }}>
            <X size={16} color={C.textSub}/>
          </button>
        </div>
        <div style={{ padding:'12px', borderBottom:`1px solid ${C.border}` }}>
          <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} style={{ display:'none' }}/>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ width:'100%', padding:'12px', background:C.accentLight,
              border:`2px dashed ${C.accent}60`, borderRadius:10, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontFamily:'inherit', color:C.accent, fontWeight:600, fontSize:'13px' }}>
            {uploading ? 'Reading PDF...' : <><FileText size={15}/> Upload PDF (max 5MB)</>}
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'10px' }}>
          {pdfs.length === 0
            ? <div style={{ textAlign:'center', padding:'32px', color:C.textMuted }}>
                <div style={{ fontSize:'36px', marginBottom:8 }}>📭</div>
                <div style={{ fontSize:'13px' }}>No PDFs yet. Upload one above!</div>
              </div>
            : pdfs.map(pdf => (
              <div key={pdf.id} style={{ padding:'10px 12px', borderRadius:10, marginBottom:8,
                border:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:38, height:38, background:C.accentLight, borderRadius:9,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <FileText size={17} color={C.accent}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'13px', fontWeight:600, color:C.text,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pdf.name}</div>
                  <div style={{ fontSize:'11px', color:C.textMuted }}>{pdf.size} · {pdf.savedAt}</div>
                </div>
                <button onClick={() => onExplain(pdf)} style={{ background:C.accentLight,
                  border:`1px solid ${C.accent}40`, borderRadius:7, padding:'5px 10px',
                  cursor:'pointer', color:C.accent, fontSize:'11px', fontWeight:600,
                  fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                  <Eye size={11}/>Explain
                </button>
                <button onClick={() => del(pdf.id)} style={{ background:'#fef2f2',
                  border:'1px solid #fee2e2', borderRadius:7, width:30, height:30,
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Trash2 size={13} color="#ef4444"/>
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// PROGRESS PANEL
// ═══════════════════════════════════════════════════════
const ProgressPanel = ({ completedTopics, onToggle, onClose }) => (
  <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.35)',
    display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
    <div style={{ width:'100%', maxWidth:'500px', background:'#fff',
      borderRadius:'20px 20px 0 0', maxHeight:'80vh', display:'flex',
      flexDirection:'column', overflow:'hidden', boxShadow:C.shadowMd }}>
      <div style={{ padding:'16px', borderBottom:`1px solid ${C.border}`,
        display:'flex', alignItems:'center', gap:10 }}>
        <BookOpen size={18} color={C.accent}/>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:'15px', color:C.text }}>Learning Progress</div>
          <div style={{ fontSize:'12px', color:C.textSub }}>{completedTopics.length}/{TOPICS.length} topics done</div>
        </div>
        <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', borderRadius:8,
          width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={16} color={C.textSub}/>
        </button>
      </div>
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ height:5, background:'#f3f4f6', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(completedTopics.length/TOPICS.length)*100}%`,
            background:`linear-gradient(90deg, ${C.accent}, #8b5cf6)`,
            borderRadius:99, transition:'width 0.5s ease' }}/>
        </div>
        <div style={{ fontSize:'11px', color:C.textMuted, marginTop:5, textAlign:'center' }}>
          {Math.round((completedTopics.length/TOPICS.length)*100)}% Complete 🚀
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
        {TOPICS.map(t => {
          const done = completedTopics.includes(t.id);
          return (
            <button key={t.id} onClick={() => onToggle(t.id)} style={{
              width:'100%', padding:'11px 14px', borderRadius:10, marginBottom:6,
              border:`1.5px solid ${done ? t.color+'40' : C.border}`,
              background: done ? `${t.color}10` : 'transparent',
              cursor:'pointer', display:'flex', alignItems:'center',
              gap:10, textAlign:'left', fontFamily:'inherit' }}>
              <span style={{ fontSize:'18px' }}>{t.emoji}</span>
              <span style={{ flex:1, fontSize:'13px', fontWeight:600,
                color: done ? t.color : C.text }}>{t.label}</span>
              <span style={{ fontSize:'15px' }}>{done ? '✅' : '⭕'}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════
// SEARCH PANEL
// ═══════════════════════════════════════════════════════
const SearchPanel = ({ messages, onClose, onJumpTo }) => {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    if (!q.trim()) return [];
    return messages.map((m,i)=>({...m,idx:i}))
      .filter(m => m.text.toLowerCase().includes(q.toLowerCase())).slice(0,10);
  }, [q, messages]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.35)',
      display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:60 }}>
      <div style={{ width:'100%', maxWidth:'460px', background:'#fff',
        borderRadius:14, overflow:'hidden', margin:'0 16px', boxShadow:C.shadowMd }}>
        <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:8,
          borderBottom:`1px solid ${C.border}` }}>
          <Search size={15} color={C.accent}/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search conversation..."
            style={{ flex:1, background:'transparent', border:'none', outline:'none',
              fontSize:'14px', color:C.text, fontFamily:'inherit' }}/>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}>
            <X size={16} color={C.textMuted}/>
          </button>
        </div>
        <div style={{ maxHeight:380, overflowY:'auto' }}>
          {results.length===0 && q && (
            <div style={{ padding:24, textAlign:'center', color:C.textMuted, fontSize:'13px' }}>No results found</div>
          )}
          {results.map((m, i) => (
            <button key={i} onClick={()=>{ onJumpTo(m.idx); onClose(); }} style={{
              width:'100%', padding:'12px 14px', borderBottom:`1px solid ${C.borderLight}`,
              textAlign:'left', background:'transparent', border:'none',
              cursor:'pointer', fontFamily:'inherit' }}>
              <div style={{ fontSize:'10px', fontWeight:700, marginBottom:3,
                color: m.from==='bot' ? C.accent : C.textSub }}>
                {m.from==='bot' ? 'ZEHRA' : 'YOU'}
              </div>
              <div style={{ fontSize:'13px', color:C.textSub,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {m.text.slice(0,80)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// ACTIONS BOTTOM SHEET
// ═══════════════════════════════════════════════════════
const ActionsSheet = ({ onClose, onProgress, onCompiler, onPdf, onExport, onClear, completedCount }) => (
  <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.3)',
    display:'flex', alignItems:'flex-end', justifyContent:'center' }}
    onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
    <div style={{ width:'100%', maxWidth:'500px', background:'#fff',
      borderRadius:'20px 20px 0 0', padding:'8px 0 max(32px,env(safe-area-inset-bottom))',
      boxShadow:C.shadowMd }}>
      <div style={{ width:36, height:4, background:'#e5e5e5',
        borderRadius:99, margin:'8px auto 16px' }}/>
      {[
        { label:'Progress',    icon:<BookOpen size={18}/>,  sub:`${completedCount}/${TOPICS.length} topics done`, action:onProgress },
        { label:'Compiler',    icon:<Terminal size={18}/>,  sub:'Run Python code',                                action:onCompiler },
        { label:'PDF Library', icon:<FileText size={18}/>,  sub:'Upload & explain PDFs',                          action:onPdf      },
        { label:'Export Chat', icon:<Download size={18}/>,  sub:'Save as text file',                              action:onExport   },
        { label:'Clear Chat',  icon:<RotateCcw size={18}/>, sub:'Start a fresh conversation',                     action:onClear, danger:true },
      ].map((item, i) => (
        <button key={i} onClick={()=>{ item.action(); onClose(); }} style={{
          width:'100%', padding:'13px 20px', display:'flex', alignItems:'center',
          gap:14, background:'transparent', border:'none', cursor:'pointer',
          textAlign:'left', fontFamily:'inherit' }}>
          <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
            background: item.danger ? '#fef2f2' : C.accentLight,
            display:'flex', alignItems:'center', justifyContent:'center',
            color: item.danger ? '#ef4444' : C.accent }}>
            {item.icon}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'14px', fontWeight:600,
              color: item.danger ? '#ef4444' : C.text }}>{item.label}</div>
            <div style={{ fontSize:'12px', color:C.textMuted, marginTop:1 }}>{item.sub}</div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════
// MESSAGE STORE
// ═══════════════════════════════════════════════════════
const STORE_KEY = 'fuz_chat_v3';
const saveStore = (msgs) => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-60))); } catch {} };
const loadStore = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem(STORE_KEY)||'null');
    if (s && Array.isArray(s) && s.length > 0) return s;
  } catch {}
  return null;
};

const makeWelcome = () => [{
  from:'bot', mood:'happy', time: new Date().toISOString(),
  text:`Hey! 👋 I'm **Zehra** — your Python mentor at FaizUpyZone!\n\nI can teach you Python, quiz you, run code, and explain PDFs. What would you like to learn today? 😊`,
}];

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
const AIChatPage = ({ setCurrentPage, user, openCompiler }) => {
  useTheme();

  const [messages,        setMessages]        = useState(() => loadStore() || makeWelcome());
  const [input,           setInput]           = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [streamingText,   setStreamingText]   = useState('');
  const [historyLoaded,   setHistoryLoaded]   = useState(false);
  const [showProgress,    setShowProgress]    = useState(false);
  const [showPdf,         setShowPdf]         = useState(false);
  const [showSearch,      setShowSearch]      = useState(false);
  const [showActions,     setShowActions]     = useState(false);
  const [showConfetti,    setShowConfetti]    = useState(false);
  const [completedTopics, setCompletedTopics] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fuz_topics')||'[]'); } catch { return []; }
  });
  const [quizStreak,  setQuizStreak]  = useState(() => parseInt(localStorage.getItem('fuz_streak')||'0'));
  const [currentMood, setCurrentMood] = useState('happy');
  const [rageLevel,   setRageLevel]   = useState(0);
  const [chips,       setChips]       = useState(CHIPS.default);
  const [isListening, setIsListening] = useState(false);
  const [jumpToIdx,   setJumpToIdx]   = useState(null);
  const [punishCount, setPunishCount] = useState(0);   // 20-msg punishment counter
  const [lastInsult,  setLastInsult]  = useState(null); // mirror insult back once

  const abortRef  = useRef(null);
  const msgEnd    = useRef(null);
  const inputRef  = useRef(null);
  const streamRef = useRef('');
  const msgRefs   = useRef({});
  const recognRef = useRef(null);
  const moodRef   = useRef('happy');

  useEffect(() => { moodRef.current = currentMood; }, [currentMood]);
  useEffect(() => { saveStore(messages); }, [messages]);

  useEffect(() => {
    if (user?.email && !historyLoaded) {
      loadHistoryFromDb(user.email).then(hist => {
        if (hist.length > 0 && !loadStore())
          setMessages([makeWelcome()[0], ...hist.slice(-10).map(m=>({...m,time:new Date().toISOString()}))]);
        setHistoryLoaded(true);
      });
    }
  }, [user?.email, historyLoaded]);

  useEffect(() => {
    if (jumpToIdx !== null) {
      msgRefs.current[jumpToIdx]?.scrollIntoView({ behavior:'smooth', block:'center' });
      setJumpToIdx(null);
    } else {
      msgEnd.current?.scrollIntoView({ behavior:'smooth' });
    }
  }, [messages, streamingText, jumpToIdx]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 350); }, []);

  // Idle nudge
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isLoading && messages.length > 1 && messages[messages.length-1]?.from==='bot') {
        const nudges = [
          "Hey, you went quiet! Everything okay? 👀",
          "Helloooo? Still there? 😅",
          "Just sitting here waiting... no pressure 😴",
        ];
        setMessages(p => [...p, {
          from:'bot', mood: moodRef.current, time: new Date().toISOString(),
          text: nudges[Math.floor(Math.random()*nudges.length)],
        }]);
      }
    }, 3*60*1000);
    return () => clearTimeout(t);
  }, [messages, isLoading]);

  const toggleTopic = id => {
    setCompletedTopics(prev => {
      const u = prev.includes(id) ? prev.filter(t=>t!==id) : [...prev,id];
      localStorage.setItem('fuz_topics', JSON.stringify(u));
      return u;
    });
  };

  const handleQuizCorrect = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
    setQuizStreak(s => { const n=s+1; localStorage.setItem('fuz_streak',n); return n; });
    setCurrentMood('proud');
    setChips(CHIPS.afterQuiz);
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort(); abortRef.current = null;
    if (streamRef.current)
      setMessages(p => [...p, { from:'bot', text:streamRef.current,
        time:new Date().toISOString(), mood:moodRef.current }]);
    streamRef.current=''; setStreamingText(''); setIsLoading(false);
  }, []);

  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported. Try Chrome!'); return;
    }
    if (isListening) { recognRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r  = new SR();
    r.continuous=false; r.interimResults=true; r.lang='en-US';
    r.onstart  = () => setIsListening(true);
    r.onresult = (e) => setInput(Array.from(e.results).map(r=>r[0].transcript).join(''));
    r.onend    = () => setIsListening(false);
    r.onerror  = () => setIsListening(false);
    recognRef.current = r; r.start();
  }, [isListening]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');

    const lang    = detectLang(msg);
    const trigger = detectMood(msg, currentMood, rageLevel);
    let newMood    = currentMood;
    let newRage    = rageLevel;
    let newPunish  = Math.max(0, punishCount - 1); // countdown each message
    let newInsult  = null;

    if (trigger) {
      newMood = trigger.mood;
      newRage = trigger.rage;
      setCurrentMood(newMood);
      setRageLevel(newRage);

      // Hard gali = 20 message punishment
      if (trigger.hardGali) {
        newPunish = 20;
        setPunishCount(20);
      }
      // Soft insult = mirror it back once
      if (trigger.insult && !trigger.insult.isHard) {
        newInsult = trigger.insult;
        setLastInsult(trigger.insult);
      }
      // Sorry during punishment = reduce by 5
      if (SORRY_W.some(w => msg.toLowerCase().includes(w)) && punishCount > 0) {
        newPunish = Math.max(0, punishCount - 5);
        setPunishCount(newPunish);
      }

      if (['upset','hurt'].includes(newMood)) setChips(CHIPS[newMood]);
      else if (newMood === 'forgiving') { setChips(CHIPS.default); setLastInsult(null); }

    } else if (rageLevel > 0) {
      newRage = Math.max(0, rageLevel - 0.3);
      setRageLevel(newRage);
      if (newRage === 0) { setCurrentMood('happy'); newMood = 'happy'; }
    }

    // Update punishment counter
    setPunishCount(newPunish);
    // Clear mirror insult after one use
    if (lastInsult) setLastInsult(null);

    const userMsg = { from:'user', text:msg, time:new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true); setStreamingText(''); streamRef.current = '';
    saveMsgToDb(user?.email, 'user', msg);

    if (msg.toLowerCase().includes('quiz') || msg.toLowerCase().includes('test me'))
      setChips(CHIPS.afterQuiz);

    abortRef.current = new AbortController();

    try {
      const langHint = lang==='hindi'    ? '\nUser is writing in Hindi. Reply in Hindi.'
                     : lang==='hinglish' ? '\nUser is writing in Hinglish/Roman Urdu. Reply in Hinglish.'
                     : '';

      const resp = await fetch(API_URL, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          messages: [
            { role:'system', content: buildSystemPrompt(newMood, newRage, user?.displayName||'friend', newPunish, newInsult) + langHint },
            ...updated.slice(-12).map(m => ({ role:m.from==='user'?'user':'assistant', content:m.text }))
          ],
          max_tokens:  600,
          temperature: newMood==='excited' ? 0.9 : newMood==='hurt' ? 0.3 : newPunish > 0 ? 0.5 : 0.75,
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n').filter(l=>l.startsWith('data: '))) {
          const data = line.slice(6);
          if (data==='[DONE]') break;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content || '';
            if (delta) { streamRef.current += delta; setStreamingText(streamRef.current); }
          } catch {}
        }
      }

      const final = streamRef.current || "...";
      setMessages(p => [...p, { from:'bot', text:final, time:new Date().toISOString(), mood:newMood }]);
      saveMsgToDb(user?.email, 'assistant', final);
      setStreamingText(''); streamRef.current = '';

      if (newMood==='forgiving') setTimeout(() => { setCurrentMood('happy'); setChips(CHIPS.default); }, 2000);
      if (final.includes('```python')) setChips(CHIPS.afterCode);

    } catch (err) {
      if (err.name==='AbortError') return;
      const errMsg = err.message?.includes('Failed to fetch') || err.message?.includes('ECONNREFUSED')
        ? '⚠️ An unknown error occurred. Please try again!'
        : err.message?.includes('429') || err.message?.includes('503')
        ? 'Model is busy. Try again in a moment!'
        : '⚠️ An unknown error occurred. Please try again!';
      setMessages(p => [...p, { from:'bot', text:errMsg, time:new Date().toISOString(), mood:'annoyed' }]);
      setStreamingText(''); streamRef.current = '';
    } finally {
      setIsLoading(false); abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 160);
    }
  }, [input, messages, isLoading, user?.email, user?.displayName, currentMood, rageLevel, punishCount, lastInsult]);

  const handleExplainPdf = useCallback((pdf) => {
    setShowPdf(false);
    sendMessage(`I've uploaded a PDF called "${pdf.name}". Please explain what it's about.`);
  }, [sendMessage]);

  const handleOpenCompiler = useCallback((code='') => {
    if (openCompiler) openCompiler(code);
  }, [openCompiler]);

  const clearChat = () => {
    stopGeneration();
    const fresh = makeWelcome();
    setMessages(fresh); saveStore(fresh);
    setCurrentMood('happy'); setRageLevel(0); setChips(CHIPS.default);
  };

  const exportChat = () => {
    const content = messages.map(m => {
      return `[${m.from==='bot'?'ZEHRA':'YOU'} — ${new Date(m.time).toLocaleString()}]\n${m.text}`;
    }).join('\n\n─────────────\n\n');
    const blob = new Blob([`Zehra × FaizUpyZone Chat\n${'═'.repeat(30)}\n\n${content}`], {type:'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `zehra-chat-${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.txt`;
    a.click();
  };

  const fmt = iso => {
    try {
      const d = new Date(iso);
      const isToday = d.toDateString()===new Date().toDateString();
      if (isToday) return d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});
      return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' '+
             d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});
    } catch { return ''; }
  };

  const mood    = MOODS[currentMood] || MOODS.happy;
  const isUpset = ['upset','hurt'].includes(currentMood);
  const typingLabel = {
    happy:'Zehra is typing...', excited:'Zehra is typing really fast!',
    annoyed:'Zehra is typing...', upset:'...', hurt:'...',
    soft:'Zehra is thinking...', proud:'Zehra is cheering for you...',
    tired:'Zehra is slowly typing...', thinking:'Zehra is thinking hard...',
    forgiving:'Zehra is... typing 🙄',
  }[currentMood] || 'Zehra is typing...';

  // Confetti pieces (memoized)
  const confettiPieces = useMemo(() =>
    Array.from({length:24},(_,i)=>({
      id:i, x:Math.random()*100, delay:Math.random()*0.4,
      color:['#5a5af5','#8b5cf6','#ec4899','#10b981','#f59e0b'][Math.floor(Math.random()*5)],
      size: 5+Math.random()*7,
    })), []);

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column',
      alignItems:'center', background:C.bg, zIndex:500 }}>

      {/* Confetti */}
      {showConfetti && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999, overflow:'hidden' }}>
          {confettiPieces.map(p => (
            <div key={p.id} style={{ position:'absolute', left:`${p.x}%`, top:'-10px',
              width:p.size, height:p.size, borderRadius:Math.random()>0.5?'50%':'2px',
              background:p.color, animation:`cFall 1.1s ease-in ${p.delay}s forwards` }}/>
          ))}
        </div>
      )}

      {/* Punishment banner */}
      {punishCount > 0 && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9998,
          background:'#1a1a1a', borderBottom:'2px solid #ef4444',
          padding:'6px 16px', display:'flex', alignItems:'center',
          justifyContent:'center', gap:8 }}>
          <span style={{ fontSize:'12px', color:'#ef4444', fontWeight:700 }}>
            😤 Zehra is NOT happy with you — {punishCount} messages left
          </span>
        </div>
      )}
      {/* Panels */}
      {showProgress && <ProgressPanel completedTopics={completedTopics} onToggle={toggleTopic} onClose={()=>setShowProgress(false)}/>}
      {showPdf      && <PdfPanel onClose={()=>setShowPdf(false)} onExplain={handleExplainPdf}/>}
      {showSearch   && <SearchPanel messages={messages} onClose={()=>setShowSearch(false)} onJumpTo={idx=>setJumpToIdx(idx)}/>}
      {showActions  && (
        <ActionsSheet
          onClose={()=>setShowActions(false)}
          onProgress={()=>setShowProgress(true)}
          onCompiler={()=>handleOpenCompiler('')}
          onPdf={()=>setShowPdf(true)}
          onExport={exportChat}
          onClear={clearChat}
          completedCount={completedTopics.length}
        />
      )}

      <div style={{ width:'100%', maxWidth:'700px', height:'100%',
        display:'flex', flexDirection:'column', boxSizing:'border-box' }}>

        {/* ── HEADER ── */}
        <div style={{ background:'rgba(255,255,255,0.97)',
          backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
          borderBottom:`1px solid ${C.border}`,
          boxShadow:`0 1px 0 ${C.border}`,
          flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px' }}>

            <button onClick={() => setCurrentPage && setCurrentPage('home')}
              style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center',
                justifyContent:'center', cursor:'pointer', border:`1px solid ${C.border}`,
                background:'transparent', flexShrink:0 }}>
              <ArrowLeft size={16} color={C.textSub}/>
            </button>

            {/* Animated gradient avatar */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                width:40, height:40, borderRadius:12, fontSize:18,
                display:'flex', alignItems:'center', justifyContent:'center',
                background: isUpset
                  ? 'linear-gradient(135deg,#9ca3af,#6b7280)'
                  : 'linear-gradient(135deg,#5a5af5,#8b5cf6,#ec4899)',
                boxShadow: isUpset ? 'none' : '0 2px 12px rgba(90,90,245,0.3)',
                animation: currentMood==='excited' ? 'aB 0.6s ease infinite'
                         : currentMood==='proud'   ? 'aP 1s ease infinite'
                         : isLoading               ? 'aPulse 2s ease-in-out infinite' : 'none',
                transition:'all 0.4s ease',
              }}>{mood.emoji}</div>
              <span style={{ position:'absolute', bottom:1, right:1, width:9, height:9,
                borderRadius:'50%', border:'2px solid white',
                background: isLoading ? C.accent : isUpset ? '#9ca3af' : mood.dot,
                display:'block', transition:'background 0.3s' }}/>
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:'15px', color:C.text, lineHeight:1.2 }}>
                Zehra <span style={{fontSize:'12px'}}>🌸</span>
              </div>
              <div style={{ fontSize:'11px', marginTop:2,
                color: isLoading ? C.accent : C.textSub }}>
                {isLoading ? typingLabel : mood.label}
              </div>
            </div>

            {quizStreak > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:3, padding:'4px 9px',
                borderRadius:99, background:'#fff8e6', border:'1px solid #fde68a', flexShrink:0 }}>
                <span style={{fontSize:'12px'}}>🔥</span>
                <span style={{ fontSize:'12px', fontWeight:700, color:'#d97706' }}>{quizStreak}</span>
              </div>
            )}

            <button onClick={()=>setShowSearch(true)} style={{ width:36, height:36, borderRadius:10,
              border:`1px solid ${C.border}`, background:'transparent',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <Search size={15} color={C.textSub}/>
            </button>

            {/* Compiler button — opens compiler page */}
            <button onClick={()=>handleOpenCompiler('')} style={{ width:36, height:36, borderRadius:10,
              border:`1px solid ${C.border}`, background:'transparent',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}
              title="Open Compiler">
              <Terminal size={15} color={C.textSub}/>
            </button>

            <button onClick={()=>setShowActions(true)} style={{ width:36, height:36, borderRadius:10,
              border:`1px solid ${C.border}`, background:'transparent',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <MoreVertical size={15} color={C.textSub}/>
            </button>
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden',
          padding:'16px', display:'flex', flexDirection:'column', gap:2,
          background: C.bgChat, WebkitOverflowScrolling:'touch' }}>

          {messages.map((msg, i) => {
            const isBot = msg.from==='bot';
            const mMood = MOODS[msg.mood] || MOODS.happy;
            return (
              <div key={i} ref={el=>msgRefs.current[i]=el}
                style={{ display:'flex', justifyContent:isBot?'flex-start':'flex-end',
                  alignItems:'flex-end', gap:8, animation:'mIn 0.2s ease', marginBottom:4 }}>

                {isBot && (
                  <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                    background: ['upset','hurt'].includes(msg.mood)
                      ? 'linear-gradient(135deg,#9ca3af,#6b7280)'
                      : 'linear-gradient(135deg,#5a5af5,#8b5cf6)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, marginBottom:18, boxShadow:'0 1px 4px rgba(90,90,245,0.2)' }}>
                    {mMood.emoji}
                  </div>
                )}

                <div style={{ maxWidth:isBot?'88%':'76%', display:'flex',
                  flexDirection:'column', gap:2, minWidth:0 }}>
                  <div style={{
                    padding:'10px 14px',
                    borderRadius: isBot ? '3px 16px 16px 16px' : '16px 3px 16px 16px',
                    background: isBot ? C.botBg : C.userBg,
                    color:       isBot ? C.botText : C.userText,
                    boxShadow: isBot
                      ? `0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px ${C.border}`
                      : '0 2px 6px rgba(26,26,26,0.2)',
                    wordBreak:'break-word', boxSizing:'border-box', width:'100%',
                  }}>
                    {isBot
                      ? <MsgContent text={msg.text} onOpenCompiler={handleOpenCompiler} onQuizCorrect={handleQuizCorrect}/>
                      : <span style={{ fontSize:'14px', lineHeight:1.65,
                          whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.text}</span>
                    }
                  </div>
                  <div style={{ fontSize:'10px', color:C.textMuted, padding:'0 4px',
                    textAlign: isBot?'left':'right' }}>
                    {fmt(msg.time)}
                  </div>
                </div>

                {!isBot && (
                  <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                    background:'#f3f4f6', border:`1px solid ${C.border}`,
                    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                    <User size={13} color={C.textSub}/>
                  </div>
                )}
              </div>
            );
          })}

          {/* Streaming bubble */}
          {(isLoading || streamingText) && (
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:4 }}>
              <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                background: isUpset
                  ? 'linear-gradient(135deg,#9ca3af,#6b7280)'
                  : 'linear-gradient(135deg,#5a5af5,#8b5cf6)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, animation:'aPulse 1.5s ease-in-out infinite', marginBottom:18 }}>
                {mood.emoji}
              </div>
              <div style={{ maxWidth:'88%', padding:'10px 14px',
                borderRadius:'3px 16px 16px 16px',
                background:C.botBg, minWidth:50, wordBreak:'break-word',
                boxShadow:`0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px ${C.border}`,
                boxSizing:'border-box' }}>
                {streamingText
                  ? <>
                      <MsgContent text={streamingText} onOpenCompiler={handleOpenCompiler} onQuizCorrect={handleQuizCorrect}/>
                      <span style={{ display:'inline-block', width:2, height:13,
                        background:C.accent, marginLeft:2, verticalAlign:'middle',
                        animation:'blink 0.5s ease-in-out infinite' }}/>
                    </>
                  : isUpset
                    ? <span style={{ fontSize:'14px', letterSpacing:3, color:C.textMuted }}>...</span>
                    : <div style={{ display:'flex', alignItems:'center', gap:8, padding:'2px 0' }}>
                        <span style={{ fontSize:'12px', color:C.textMuted }}>{typingLabel}</span>
                        <span style={{ display:'inline-flex', gap:3 }}>
                          {[0,1,2].map(j=>(
                            <span key={j} style={{ width:5, height:5, borderRadius:'50%',
                              background:C.accent, display:'inline-block',
                              animation:'tDot 1.2s ease-in-out infinite',
                              animationDelay:`${j*0.2}s` }}/>
                          ))}
                        </span>
                      </div>
                }
              </div>
            </div>
          )}
          <div ref={msgEnd}/>
        </div>

        {/* ── SUGGESTION CHIPS ── */}
        {!isLoading && (
          <div style={{ padding:'6px 16px 4px', display:'flex', gap:6, overflowX:'auto',
            background:C.bg, borderTop:`1px solid ${C.borderLight}`, flexShrink:0 }}>
            {chips.map((chip, i) => (
              <button key={i} onClick={()=>sendMessage(chip)} style={{
                flexShrink:0, padding:'6px 13px', borderRadius:99,
                border:`1px solid ${C.border}`, background:C.surface,
                color:C.textSub, fontSize:'12px', fontWeight:500,
                cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit',
                transition:'all 0.15s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background=C.accentLight;e.currentTarget.style.borderColor=`${C.accent}50`;e.currentTarget.style.color=C.accent;}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSub;}}>
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* ── INPUT BAR ── */}
        <div style={{ background:C.bg, borderTop:`1px solid ${C.border}`,
          padding:`10px 16px max(10px, env(safe-area-inset-bottom))`,
          display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>

          <button onClick={toggleVoice} style={{ width:38, height:38, borderRadius:19,
            border:`1px solid ${isListening ? '#ef4444' : C.border}`,
            background: isListening ? '#fef2f2' : 'transparent',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', flexShrink:0,
            animation: isListening ? 'mPulse 1s ease infinite' : 'none' }}>
            {isListening ? <MicOff size={15} color="#ef4444"/> : <Mic size={15} color={C.textSub}/>}
          </button>

          {/* Pill input */}
          <div style={{ flex:1, display:'flex', alignItems:'center', minWidth:0,
            background:'#f3f4f6', borderRadius:24, border:`1.5px solid ${C.border}`,
            padding:'0 16px', transition:'all 0.2s' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMessage(); }}}
              placeholder={
                isUpset    ? 'Say sorry first... 😤' :
                isLoading  ? 'Zehra is typing...' :
                'Ask me anything...'
              }
              style={{ flex:1, background:'transparent', border:'none', outline:'none',
                fontSize:'14px', color:C.text, fontFamily:'inherit',
                padding:'10px 0', minWidth:0 }}
              onFocus={e => {
                e.currentTarget.parentElement.style.borderColor = C.accent;
                e.currentTarget.parentElement.style.boxShadow  = '0 0 0 3px rgba(90,90,245,0.08)';
              }}
              onBlur={e => {
                e.currentTarget.parentElement.style.borderColor = C.border;
                e.currentTarget.parentElement.style.boxShadow  = 'none';
              }}
            />
          </div>

          {isLoading
            ? <button onClick={stopGeneration} style={{ width:38, height:38, background:'#fef2f2',
                border:'1px solid #fee2e2', borderRadius:19,
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                <StopCircle size={17} color="#ef4444"/>
              </button>
            : <button onClick={()=>sendMessage()}
                disabled={!input.trim() || (isUpset && rageLevel>=2)}
                style={{ width:38, height:38,
                  background: input.trim()&&!(isUpset&&rageLevel>=2) ? C.accent : '#f3f4f6',
                  border:'none', borderRadius:19,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor: input.trim()&&!(isUpset&&rageLevel>=2) ? 'pointer' : 'not-allowed',
                  flexShrink:0, transition:'all 0.2s',
                  boxShadow: input.trim()&&!(isUpset&&rageLevel>=2)
                    ? '0 3px 10px rgba(90,90,245,0.35)' : 'none' }}>
                <Send size={16}
                  color={input.trim()&&!(isUpset&&rageLevel>=2)?'#fff':C.textMuted}/>
              </button>
          }
        </div>
      </div>

      <style>{`
        @keyframes mIn    { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tDot   { 0%,100%{opacity:.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-3px)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes aPulse { 0%,100%{opacity:0.85} 50%{opacity:1} }
        @keyframes aB     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes aP     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
        @keyframes cFall  { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes mPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.3)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
        * { -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
        ::-webkit-scrollbar { width:3px; height:3px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.1); border-radius:2px }
      `}</style>
    </div>
  );
};

export default AIChatPage;