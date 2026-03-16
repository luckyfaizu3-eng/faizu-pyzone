import { useState, useEffect, useRef, useCallback } from "react";
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { useGeo } from '../App';

// ═══════════════════════════════════════════════════════════════
// FALLBACK QUESTIONS
// ═══════════════════════════════════════════════════════════════
const FALLBACK_QUESTIONS = [
  { id:1,  code:"x = 5\nprint(x + 3)",answer:"8",options:["8","53","83","Error"],trap:false,explanation:"Simple addition. x=5, 5+3=8",difficulty:"easy"},
  { id:2,  code:"print(type(5))",answer:"<class 'int'>",options:["int","<class 'int'>","number","5"],trap:false,explanation:"type() returns the class object representation",difficulty:"easy"},
  { id:3,  code:"a = 'Hello'\nprint(len(a))",answer:"5",options:["5","6","4","Error"],trap:false,explanation:"Hello has exactly 5 characters",difficulty:"easy"},
  { id:4,  code:"print(0.1 + 0.2 == 0.3)",answer:"False",options:["True","False","Error","0.3"],trap:true,explanation:"Floating point precision! 0.1+0.2 = 0.30000000000000004",difficulty:"trap"},
  { id:5,  code:"x = [1,2,3]\ny = x\ny.append(4)\nprint(x)",answer:"[1, 2, 3, 4]",options:["[1,2,3]","[1, 2, 3, 4]","[4]","Error"],trap:true,explanation:"Lists are mutable references. x and y point to the same list",difficulty:"trap"},
  { id:6,  code:"print(bool(''))",answer:"False",options:["True","False","Error","''"],trap:true,explanation:"Empty string is Falsy in Python",difficulty:"trap"},
  { id:7,  code:"x = 10\ndef f():\n    x = 20\nf()\nprint(x)",answer:"10",options:["10","20","Error","None"],trap:false,explanation:"Local scope! The function's x is separate from the outer x",difficulty:"medium"},
  { id:8,  code:"print(2 ** 3 ** 2)",answer:"512",options:["64","512","72","Error"],trap:true,explanation:"** is right-associative! 3**2=9, then 2**9=512",difficulty:"trap"},
  { id:9,  code:"a = []\nfor i in range(3):\n    a.append(i*2)\nprint(a)",answer:"[0, 2, 4]",options:["[0,2,4]","[0,1,2]","[2,4,6]","Error"],trap:false,explanation:"0*2=0, 1*2=2, 2*2=4",difficulty:"medium"},
  { id:10, code:"x = 256\ny = 256\nprint(x is y)",answer:"True",options:["True","False","Error","None"],trap:true,explanation:"Python caches integers -5 to 256! 'is' checks identity, not equality",difficulty:"mega"},
  { id:11, code:"def f(x=[]):\n    x.append(1)\n    return x\nprint(f())\nprint(f())",answer:"[1]\n[1, 1]",options:["[1]\n[1]","[1]\n[1, 1]","Error","[1]\n[2]"],trap:true,explanation:"Mutable default argument! The default list is shared across all calls",difficulty:"mega"},
  { id:12, code:"print(1 == 1.0)",answer:"True",options:["True","False","TypeError","1"],trap:false,explanation:"Python compares values across compatible types",difficulty:"easy"},
  { id:13, code:"x = 'abc'\nprint(x * 3)",answer:"abcabcabc",options:["abc3","abcabcabc","abc abc abc","Error"],trap:false,explanation:"String multiplication means repetition",difficulty:"easy"},
  { id:14, code:"print(list(range(5)))",answer:"[0, 1, 2, 3, 4]",options:["[1,2,3,4,5]","[0,1,2,3,4]","[0,1,2,3,4,5]","Error"],trap:false,explanation:"range(5) produces 0,1,2,3,4 — starts at zero",difficulty:"easy"},
  { id:15, code:"a = (1,)\nprint(type(a))",answer:"<class 'tuple'>",options:["list","tuple","<class 'tuple'>","int"],trap:true,explanation:"Trailing comma makes it a tuple, not an int!",difficulty:"trap"},
  { id:16, code:"x = None\nprint(bool(x))",answer:"False",options:["True","False","None","Error"],trap:true,explanation:"None is Falsy in Python",difficulty:"trap"},
  { id:17, code:"print('5' + '3')",answer:"53",options:["8","53","Error","\"53\""],trap:false,explanation:"String + String = concatenation, not addition",difficulty:"easy"},
  { id:18, code:"x = [1,2,3]\nprint(x[-1])",answer:"3",options:["1","-1","3","Error"],trap:false,explanation:"Negative indexing: -1 means the last element",difficulty:"easy"},
  { id:19, code:"print(10 / 3)",answer:"3.3333333333333335",options:["3","3.33","3.3333333333333335","Error"],trap:true,explanation:"/ always returns a float! Use // for integer division",difficulty:"trap"},
  { id:20, code:"a = {1,1,2,2,3}\nprint(len(a))",answer:"3",options:["5","3","2","Error"],trap:true,explanation:"Sets automatically remove duplicates: {1,2,3} = 3 elements",difficulty:"trap"},
  { id:21, code:"x = 'Python'\nprint(x[1:4])",answer:"yth",options:["Pyt","yth","ytho","Error"],trap:false,explanation:"Slicing [1:4] = characters at index 1, 2, 3",difficulty:"medium"},
  { id:22, code:"d = {'a':1,'b':2}\nprint(d.get('c', 0))",answer:"0",options:["None","0","KeyError","Error"],trap:false,explanation:".get() returns the default value when key doesn't exist",difficulty:"medium"},
  { id:23, code:"print('hello'.upper().lower())",answer:"hello",options:["HELLO","hello","Hello","Error"],trap:false,explanation:"upper() then lower() brings it back to lowercase",difficulty:"easy"},
  { id:24, code:"x = [1,2,3]\nprint(x.pop())\nprint(x)",answer:"3\n[1, 2]",options:["1\n[2,3]","3\n[1, 2]","3\n[1,2,3]","Error"],trap:false,explanation:".pop() removes and returns the last element by default",difficulty:"medium"},
  { id:25, code:"print(3 * '0' == '000')",answer:"True",options:["True","False","Error","'000'"],trap:false,explanation:"'0' * 3 = '000', and '000' == '000' is True",difficulty:"easy"},
  { id:26, code:"a = [1,2]\nb = [3,4]\nprint(a + b)",answer:"[1, 2, 3, 4]",options:["[4,6]","[1, 2, 3, 4]","[1,2]+[3,4]","Error"],trap:false,explanation:"List + List = concatenation",difficulty:"easy"},
  { id:27, code:"print(type(None))",answer:"<class 'NoneType'>",options:["None","null","<class 'NoneType'>","Error"],trap:true,explanation:"None's type is NoneType, not None itself",difficulty:"trap"},
  { id:28, code:"x = 5\ny = 2\nprint(x // y, x % y)",answer:"2 1",options:["2.5 1","2 1","2 0","Error"],trap:false,explanation:"5//2=2 (floor division), 5%2=1 (remainder)",difficulty:"medium"},
  { id:29, code:"lst = [1,2,3,4,5]\nprint(lst[::2])",answer:"[1, 3, 5]",options:["[2,4]","[1, 3, 5]","[1,2]","Error"],trap:false,explanation:"[::2] = every second element starting from index 0",difficulty:"medium"},
  { id:30, code:"print(''.join(['a','b','c']))",answer:"abc",options:["['a','b','c']","abc","a b c","Error"],trap:false,explanation:".join() concatenates list elements using the separator string",difficulty:"medium"},
  { id:31, code:"x = 257\ny = 257\nprint(x is y)",answer:"False",options:["True","False","Error","None"],trap:true,explanation:"Python only caches integers up to 256. 257 creates new objects",difficulty:"mega"},
  { id:32, code:"print(bool([]))",answer:"False",options:["True","False","Error","[]"],trap:true,explanation:"Empty collections (list, dict, set, tuple) are all Falsy",difficulty:"trap"},
  { id:33, code:"def greet(name='World'):\n    return 'Hello ' + name\nprint(greet())",answer:"Hello World",options:["Hello","Hello World","Error","None"],trap:false,explanation:"Default parameter is used when no argument is passed",difficulty:"easy"},
  { id:34, code:"print(sorted([3,1,4,1,5,9,2,6]))",answer:"[1, 1, 2, 3, 4, 5, 6, 9]",options:["[3,1,4,1,5,9,2,6]","[1, 1, 2, 3, 4, 5, 6, 9]","[9,6,5,4,3,2,1,1]","Error"],trap:false,explanation:"sorted() returns a new sorted list, ascending by default",difficulty:"easy"},
  { id:35, code:"class Dog:\n    tricks = []\n    def add(self,t):\n        self.tricks.append(t)\nd1=Dog()\nd2=Dog()\nd1.add('roll')\nprint(d2.tricks)",answer:"['roll']",options:["[]","['roll']","Error","None"],trap:true,explanation:"Class-level mutable attributes are shared across all instances!",difficulty:"mega"},
];

// ═══════════════════════════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════
const STORAGE_KEY = "braintrap_v3";
const PAID_DAILY_LIMIT = 30;

function getStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
function saveStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}
function initStorage() {
  const today = getTodayKey();
  const existing = getStorage();
  if (existing && existing.date === today) return existing;
  const fresh = {
    date: today, questionsAnswered: 0, hasPlayedFree: false,
    isPaid: existing?.isPaid || false, highScore: existing?.highScore || 0,
  };
  saveStorage(fresh);
  return fresh;
}

// ═══════════════════════════════════════════════════════════════
// DEVICE FINGERPRINT & IP
// ═══════════════════════════════════════════════════════════════
function getDeviceFingerprint() {
  try {
    const data = [navigator.userAgent, navigator.language,
      window.screen.width+'x'+window.screen.height, window.screen.colorDepth,
      new Date().getTimezoneOffset(), navigator.hardwareConcurrency||'',
      navigator.platform||'', !!window.indexedDB, !!window.localStorage].join('|');
    let hash = 0;
    for (let i = 0; i < data.length; i++) { hash = ((hash<<5)-hash)+data.charCodeAt(i); hash|=0; }
    return Math.abs(hash).toString(36);
  } catch { return 'unknown'; }
}
async function getIPAddress() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    return (await res.json()).ip || 'unknown';
  } catch { return 'unknown'; }
}
async function checkDeviceLimitFirebase(fp, ip, today) {
  try {
    const fpSnap = await getDoc(doc(db,'braintrapDevices',`fp_${fp}`));
    if (fpSnap.exists() && fpSnap.data().date===today && fpSnap.data().hasPlayed) return { blocked:true };
    if (ip!=='unknown' && !ip.startsWith('192.') && !ip.startsWith('10.') && !ip.startsWith('127.')) {
      const ipSnap = await getDoc(doc(db,'braintrapDevices',`ip_${ip.replace(/\./g,'_')}`));
      if (ipSnap.exists() && ipSnap.data().date===today && ipSnap.data().hasPlayed) return { blocked:true };
    }
    return { blocked:false };
  } catch { return { blocked:false }; }
}
async function markDevicePlayed(fp, ip, today, uid) {
  try {
    const data = { hasPlayed:true, date:today, uid, updatedAt:new Date().toISOString() };
    setDoc(doc(db,'braintrapDevices',`fp_${fp}`), data, { merge:true }).catch(()=>{});
    if (ip!=='unknown' && !ip.startsWith('192.') && !ip.startsWith('10.') && !ip.startsWith('127.'))
      setDoc(doc(db,'braintrapDevices',`ip_${ip.replace(/\./g,'_')}`), data, { merge:true }).catch(()=>{});
  } catch {}
}

// ═══════════════════════════════════════════════════════════════
// CONFETTI
// ═══════════════════════════════════════════════════════════════
function Confetti() {
  const colors = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444"];
  return (
    <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden" }}>
      {Array.from({length:30}).map((_,i)=>(
        <div key={i} style={{ position:"absolute",left:`${Math.random()*100}%`,top:"-10px",
          width:`${6+Math.random()*6}px`,height:`${6+Math.random()*6}px`,
          background:colors[i%colors.length],borderRadius:Math.random()>.5?"50%":"2px",
          animation:`confettiFall ${0.8+Math.random()*1.2}s ease-in ${Math.random()*0.6}s forwards`,
          transform:`rotate(${Math.random()*360}deg)` }}/>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DIFFICULTY BADGE
// ═══════════════════════════════════════════════════════════════
function DiffBadge({ diff }) {
  const map = {
    easy:  {label:"Easy",  bg:"rgba(16,185,129,0.15)",color:"#10b981",border:"rgba(16,185,129,0.3)"},
    medium:{label:"Medium",bg:"rgba(245,158,11,0.15)",color:"#f59e0b",border:"rgba(245,158,11,0.3)"},
    trap:  {label:"Trap",  bg:"rgba(239,68,68,0.15)", color:"#ef4444",border:"rgba(239,68,68,0.3)"},
    mega:  {label:"Mega Trap",bg:"rgba(139,92,246,0.15)",color:"#a78bfa",border:"rgba(139,92,246,0.3)"},
  };
  const s = map[diff]||map.easy;
  return <span style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:"20px",padding:"3px 10px",fontSize:"0.65rem",fontWeight:"800",color:s.color,letterSpacing:"0.05em",textTransform:"uppercase"}}>{s.label}</span>;
}

// ═══════════════════════════════════════════════════════════════
// ✅ REAL LEADERBOARD
// ═══════════════════════════════════════════════════════════════
function LeaderboardInline({ isAdmin, currentUserId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const medals = ['🥇','🥈','🥉'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db,'brainTrapLeaderboard'), orderBy('score','desc'), limit(200));
      const snap = await getDocs(q);
      setEntries(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const removeEntry = async (entryId, entryName) => {
    if (!window.confirm(`Remove "${entryName}" from leaderboard?`)) return;
    setRemoving(entryId);
    try {
      await deleteDoc(doc(db,'brainTrapLeaderboard',entryId));
      setEntries(prev => prev.filter(e => e.id !== entryId));
      window.showToast?.('✅ Entry removed!','success');
    } catch(e) { window.showToast?.('❌ Failed to remove','error'); }
    setRemoving(null);
  };

  return (
    <div style={{marginTop:"16px",background:"rgba(255,255,255,0.75)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"18px",overflow:"hidden"}}>
      <div style={{background:"linear-gradient(135deg,#6366f1,#ec4899)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontWeight:"900",color:"#fff",fontSize:"0.95rem"}}>🏆 Leaderboard</div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.8)",fontWeight:"700"}}>Top 200 · Real players only</div>
          <button onClick={fetchData} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"8px",padding:"3px 8px",color:"#fff",fontSize:"0.65rem",fontWeight:"700",cursor:"pointer"}}>🔄</button>
        </div>
      </div>
      <div style={{padding:"8px 16px",background:"rgba(99,102,241,0.05)",borderBottom:"1px solid rgba(99,102,241,0.1)",display:"flex",gap:"12px",flexWrap:"wrap"}}>
        <span style={{fontSize:"0.65rem",color:"#6366f1",fontWeight:"700"}}>👑 Paid member</span>
        <span style={{fontSize:"0.65rem",color:"#94a3b8",fontWeight:"600"}}>· Free player</span>
        {isAdmin && <span style={{fontSize:"0.65rem",color:"#ef4444",fontWeight:"700"}}>🗑️ Admin: click to remove entry</span>}
      </div>
      <div style={{maxHeight:"400px",overflowY:"auto",padding:"8px"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:"28px",color:"#6366f1",fontWeight:"700",fontSize:"0.85rem"}}>Loading... ⏳</div>
        ) : entries.length === 0 ? (
          <div style={{textAlign:"center",padding:"28px"}}>
            <div style={{fontSize:"2rem",marginBottom:"8px"}}>🫥</div>
            <div style={{fontWeight:"800",color:"#1e1b4b",fontSize:"0.85rem"}}>No champions yet — be the first!</div>
          </div>
        ) : entries.map((entry, i) => {
          const isPaidUser = entry.isPaid || false;
          const isCurrentUser = entry.userId === currentUserId;
          return (
            <div key={entry.id} style={{
              display:"flex",alignItems:"center",gap:"10px",padding:"10px 10px",
              borderRadius:"12px",marginBottom:"4px",
              background: isCurrentUser ? "rgba(99,102,241,0.12)" : i<3 ? `rgba(${i===0?'245,158,11':i===1?'148,163,184':'249,115,22'},0.08)` : isPaidUser ? "rgba(99,102,241,0.06)" : "rgba(0,0,0,0.02)",
              border: isCurrentUser ? "1.5px solid rgba(99,102,241,0.4)" : i<3 ? `1px solid rgba(${i===0?'245,158,11':i===1?'148,163,184':'249,115,22'},0.25)` : isPaidUser ? "1px solid rgba(99,102,241,0.15)" : "1px solid rgba(0,0,0,0.05)",
              position:"relative"
            }}>
              <div style={{fontSize:i<3?"1.2rem":"0.8rem",fontWeight:"900",minWidth:"28px",textAlign:"center",color:i<3?['#f59e0b','#94a3b8','#f97316'][i]:'#94a3b8'}}>
                {i<3?medals[i]:`#${i+1}`}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  {isPaidUser && <span style={{fontSize:"0.6rem"}}>👑</span>}
                  <div style={{fontWeight:"800",fontSize:"0.85rem",color:"#1e1b4b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",background:isPaidUser?"linear-gradient(135deg,#6366f1,#ec4899)":undefined,WebkitBackgroundClip:isPaidUser?"text":undefined,WebkitTextFillColor:isPaidUser?"transparent":undefined}}>
                    {entry.name}
                    {isCurrentUser && <span style={{fontSize:"0.6rem",marginLeft:"4px",color:"#6366f1",WebkitTextFillColor:"#6366f1"}}>← You</span>}
                  </div>
                </div>
                <div style={{fontSize:"0.62rem",color:"#6366f1",marginTop:"1px"}}>
                  {entry.correct}/{entry.total} correct · {entry.maxStreak}🔥 streak · {entry.date}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:"1rem",fontWeight:"900",background:isPaidUser?"linear-gradient(135deg,#6366f1,#ec4899)":"none",WebkitBackgroundClip:isPaidUser?"text":"unset",WebkitTextFillColor:isPaidUser?"transparent":"#1e1b4b",color:isPaidUser?"transparent":"#1e1b4b"}}>
                  {entry.score}
                </div>
                <div style={{fontSize:"0.58rem",color:"#94a3b8",fontWeight:"700"}}>PTS</div>
              </div>
              {isAdmin && (
                <button onClick={()=>removeEntry(entry.id, entry.name)} disabled={removing===entry.id}
                  style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"8px",padding:"4px 8px",color:"#ef4444",fontSize:"0.65rem",fontWeight:"700",cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
                  {removing===entry.id?"...":"🗑️"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {entries.length > 0 && (
        <div style={{padding:"8px 16px",borderTop:"1px solid rgba(99,102,241,0.1)",textAlign:"center",fontSize:"0.68rem",color:"#94a3b8"}}>
          {entries.length} players on leaderboard
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADMIN CONTROLS
// ═══════════════════════════════════════════════════════════════
function AdminControls({ livePrice, setLivePrice }) {
  const [inputPrice, setInputPrice] = useState(livePrice.toString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  const generateAndCache = async () => {
    setGenerating(true);
    setGenStatus('🤖 Generating fresh questions...');
    try {
      const response = await fetch('https://white-limit-e2fe.luckyfaizu3.workers.dev/braintrap', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({})
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error||'Failed');
      const today = new Date().toISOString().split("T")[0];
      await setDoc(doc(db,'questionCache','braintrap_daily'), {
        questions:result.questions, generatedAt:new Date().toISOString(), date:today, count:result.count
      });
      setGenStatus(`✅ ${result.count} questions saved!`);
    } catch(e) { setGenStatus('❌ Failed: '+(e.message||'Unknown')); }
    finally { setGenerating(false); setTimeout(()=>setGenStatus(''),5000); }
  };

  const savePrice = async () => {
    if (!inputPrice||isNaN(inputPrice)||parseInt(inputPrice)<=0) return;
    setSaving(true);
    try {
      await setDoc(doc(db,'settings','braintrap'),{price:parseInt(inputPrice),updatedAt:new Date().toISOString()},{merge:true});
      localStorage.setItem('braintrap_price',inputPrice);
      setLivePrice(parseInt(inputPrice));
      setSaved(true); setTimeout(()=>{setSaved(false);setIsOpen(false);},2000);
    } catch(e) {
      localStorage.setItem('braintrap_price',inputPrice);
      setLivePrice(parseInt(inputPrice));
      setSaved(true); setTimeout(()=>{setSaved(false);setIsOpen(false);},2000);
    } finally { setSaving(false); }
  };

  return (
    <div style={{marginBottom:"12px",background:"rgba(30,27,75,0.06)",border:"1.5px dashed rgba(99,102,241,0.35)",borderRadius:"16px",overflow:"hidden"}}>
      <button onClick={()=>setIsOpen(o=>!o)} style={{width:"100%",padding:"12px 16px",background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span>👑</span>
          <span style={{fontSize:"0.82rem",fontWeight:"800",color:"#3730a3"}}>Admin Controls</span>
          <span style={{background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:"20px",padding:"2px 8px",fontSize:"0.65rem",fontWeight:"700",color:"#6366f1"}}>₹{livePrice}/month</span>
        </div>
        <span style={{fontSize:"0.8rem",color:"#6366f1",fontWeight:"800"}}>{isOpen?"▲":"▼"}</span>
      </button>
      {isOpen && (
        <div style={{padding:"0 16px 16px",borderTop:"1px solid rgba(99,102,241,0.15)"}}>
          <div style={{marginTop:"12px",marginBottom:"14px"}}>
            <div style={{fontSize:"0.72rem",fontWeight:"700",color:"#4338ca",marginBottom:"8px"}}>🤖 Generate Fresh Questions</div>
            <button onClick={generateAndCache} disabled={generating}
              style={{width:"100%",padding:"10px",background:generating?"rgba(99,102,241,0.2)":"linear-gradient(135deg,#6366f1,#ec4899)",border:"none",borderRadius:"12px",color:generating?"#6366f1":"#fff",fontWeight:"800",fontSize:"0.82rem",cursor:generating?"wait":"pointer"}}>
              {generating?"⏳ Generating...":"🤖 Generate & Save 30 Questions"}
            </button>
            {genStatus&&<div style={{fontSize:"0.7rem",marginTop:"6px",color:genStatus.startsWith('✅')?"#059669":"#dc2626",fontWeight:"700"}}>{genStatus}</div>}
          </div>
          <div style={{borderTop:"1px solid rgba(99,102,241,0.1)",paddingTop:"12px"}}>
            <div style={{fontSize:"0.72rem",fontWeight:"700",color:"#4338ca",marginBottom:"8px"}}>💰 Set Monthly Price (INR base)</div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:"4px",flex:1,background:"rgba(255,255,255,0.9)",border:"1.5px solid rgba(99,102,241,0.3)",borderRadius:"12px",padding:"0 12px"}}>
                <span style={{fontSize:"0.9rem",fontWeight:"800",color:"#6366f1"}}>₹</span>
                <input value={inputPrice} onChange={e=>setInputPrice(e.target.value)} type="number" min="1"
                  style={{flex:1,padding:"10px 4px",border:"none",background:"transparent",color:"#1e1b4b",fontSize:"1rem",fontWeight:"800",outline:"none"}}/>
                <span style={{fontSize:"0.72rem",color:"#94a3b8"}}>/month</span>
              </div>
              <button onClick={savePrice} disabled={saving||!inputPrice}
                style={{padding:"10px 18px",background:saved?"rgba(5,150,105,0.9)":"linear-gradient(135deg,#6366f1,#ec4899)",border:"none",borderRadius:"12px",color:"#fff",fontWeight:"900",fontSize:"0.85rem",cursor:"pointer",minWidth:"80px"}}>
                {saving?"⏳":saved?"✅ Saved!":"Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ✅ GEO-AWARE PAYWALL MODAL
// ═══════════════════════════════════════════════════════════════
function PaywallModal({ onClose, onUnlock, displayPrice, isIndia, geoData }) {
  const features = [
    {icon:"♾️",title:"30 Questions/Day",desc:"10 Easy + 10 Medium + 10 Hard"},
    {icon:"🤖",title:"AI-Generated Daily",desc:"Fresh questions every session"},
    {icon:"🏆",title:"Leaderboard Access",desc:"Compete with real players"},
    {icon:"🔥",title:"Streak Multipliers",desc:"Bigger streaks, bigger points"},
  ];
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",backdropFilter:"blur(8px)"}}>
      <div style={{background:"linear-gradient(160deg,#0f0a1e,#1a0f35)",borderRadius:"28px",padding:"36px 28px",maxWidth:"420px",width:"100%",border:"1.5px solid rgba(99,102,241,0.4)",boxShadow:"0 40px 80px rgba(0,0,0,0.6)"}}>
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <div style={{fontSize:"3.5rem",marginBottom:"8px"}}>🔐</div>
          <div style={{fontSize:"1.6rem",fontWeight:"900",color:"#fff",marginBottom:"6px"}}>Unlock Full Access</div>
          <div style={{fontSize:"0.82rem",color:"#94a3b8"}}>You've used your 10 free questions today</div>
          {/* ✅ Foreign currency notice */}
          {!isIndia && geoData && (
            <div style={{marginTop:"8px",display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:"20px",padding:"4px 12px",fontSize:"0.72rem",fontWeight:"700",color:"#a78bfa"}}>
              {geoData.flag} {geoData.countryName} • 🅿️ PayPal
            </div>
          )}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"24px"}}>
          {features.map((f,i)=>(
            <div key={i} style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"14px",padding:"12px"}}>
              <div style={{fontSize:"1.3rem",marginBottom:"4px"}}>{f.icon}</div>
              <div style={{fontSize:"0.78rem",fontWeight:"800",color:"#c4b5fd",marginBottom:"2px"}}>{f.title}</div>
              <div style={{fontSize:"0.68rem",color:"#64748b"}}>{f.desc}</div>
            </div>
          ))}
        </div>
        {/* ✅ Geo price display */}
        <div style={{textAlign:"center",marginBottom:"20px"}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:"6px"}}>
            <span style={{fontSize:"3rem",fontWeight:"900",background:"linear-gradient(135deg,#6366f1,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{displayPrice}</span>
            <span style={{fontSize:"0.82rem",color:"#64748b"}}>/month</span>
          </div>
          {!isIndia && geoData && (
            <div style={{fontSize:"0.72rem",color:"#64748b",marginTop:"4px"}}>via PayPal • {geoData.currency}</div>
          )}
        </div>
        <button onClick={onUnlock} style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#6366f1,#ec4899)",border:"none",borderRadius:"16px",color:"#fff",fontSize:"1rem",fontWeight:"900",cursor:"pointer",marginBottom:"10px"}}>
          🚀 Unlock for {displayPrice}/month {!isIndia && geoData ? "via PayPal" : ""}
        </button>
        <button onClick={onClose} style={{width:"100%",padding:"10px",background:"transparent",border:"none",color:"#64748b",fontSize:"0.8rem",cursor:"pointer"}}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AI LOADING SCREEN
// ═══════════════════════════════════════════════════════════════
function AILoadingScreen() {
  const [dots, setDots] = useState(1);
  const msgs = ["Summoning the AI question master...","Crafting devious Python traps...","Building your daily challenge..."];
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(()=>{
    const d=setInterval(()=>setDots(x=>x%3+1),500);
    const m=setInterval(()=>setMsgIdx(x=>(x+1)%msgs.length),1800);
    return()=>{clearInterval(d);clearInterval(m);};
  },[msgs.length]);
  return (
    <div style={{minHeight:"100vh",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"24px",padding:"2rem"}}>
      <div style={{position:"relative",width:"80px",height:"80px"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid transparent",borderTopColor:"#6366f1",borderRightColor:"#ec4899",animation:"spin 1s linear infinite"}}/>
        <div style={{position:"absolute",inset:"12px",borderRadius:"50%",border:"2px solid transparent",borderBottomColor:"#f59e0b",animation:"spinR 1.5s linear infinite"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem"}}>🤖</div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"0.85rem",fontWeight:"700",color:"#c4b5fd",marginBottom:"6px"}}>{msgs[msgIdx]}{".".repeat(dots)}</div>
        <div style={{fontSize:"0.72rem",color:"#475569"}}>AI is generating fresh questions for you</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes spinR{to{transform:rotate(-360deg)}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN GAME
// ═══════════════════════════════════════════════════════════════
const ADMIN_EMAIL = "luckyfaizu3@gmail.com";

export default function BrainTrapGame({ user, onPayment }) {
  // ✅ Geo hook
  const { geoData, isIndia, initiatePayPal } = useGeo();

  const [screen, setScreen] = useState("intro");
  const [storage, setStorage] = useState(()=>initStorage());
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timer, setTimer] = useState(12);
  const [reaction, setReaction] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [aiStatus, setAiStatus] = useState("idle");
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [livePrice, setLivePrice] = useState(parseInt(localStorage.getItem('braintrap_price')||'49'));
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');

  const deviceFpRef = useRef(getDeviceFingerprint());
  const ipRef = useRef('unknown');
  const warningsRef = useRef(0);
  const timerRef = useRef(null);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isPaid = storage.isPaid || isAdmin;

  // ✅ Geo-aware price display
  // livePrice is always INR base (set by admin). Convert for foreign users.
  const getDisplayPrice = () => {
    if (isIndia || !geoData) return `₹${livePrice}`;
    // Scale: livePrice / 49 (INR base) * geoData.basic
    const ratio = livePrice / 49;
    const raw = geoData.basic * ratio;
    const rounded = raw < 10
      ? Math.round(raw * 100) / 100
      : Math.floor(raw) + 0.99;
    return `${geoData.symbol}${rounded.toFixed(2)}`;
  };
  const displayPrice = getDisplayPrice();

  // Load live price
  useEffect(()=>{
    const loadPrice=async()=>{
      try {
        const snap=await getDoc(doc(db,'settings','braintrap'));
        if(snap.exists()&&snap.data().price){const p=snap.data().price;setLivePrice(p);localStorage.setItem('braintrap_price',p.toString());}
      } catch{}
    };
    loadPrice();
  },[]);

  // Device check
  useEffect(()=>{
    if(isAdmin) return;
    const check=async()=>{
      const today=getTodayKey();
      const ip=await getIPAddress();
      ipRef.current=ip;
      const result=await checkDeviceLimitFirebase(deviceFpRef.current,ip,today);
      if(result.blocked) setDeviceBlocked(true);
    };
    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isAdmin]);

  // Load user data
  useEffect(()=>{
    if(!user?.uid){
      const fresh={date:getTodayKey(),questionsAnswered:0,hasPlayedFree:false,isPaid:false,highScore:getStorage()?.highScore||0};
      saveStorage(fresh);setStorage(fresh);return;
    }
    if(isAdmin) return;
    const load=async()=>{
      try {
        const today=getTodayKey();
        const snap=await getDoc(doc(db,'users',user.uid,'braintrapSubscription','status'));
        if(snap.exists()){
          const data=snap.data();
          const isToday=data.date===today;
          const updated={date:today,questionsAnswered:isToday?(data.questionsAnswered||0):0,hasPlayedFree:isToday?(data.hasPlayedFree||false):false,disqualifiedDate:data.disqualifiedDate||null,isPaid:data.isPaid||false,highScore:Math.max(data.highScore||0,getStorage()?.highScore||0)};
          saveStorage(updated);setStorage(updated);
        } else {
          const fresh={date:getTodayKey(),questionsAnswered:0,hasPlayedFree:false,isPaid:false,highScore:getStorage()?.highScore||0};
          saveStorage(fresh);setStorage(fresh);
        }
      } catch(e){console.error(e);}
    };
    load();
  },[user?.uid,isAdmin]);

  const freeBlocked = !isPaid && storage.hasPlayedFree;
  const paidQuestionsLeft = Math.max(0,PAID_DAILY_LIMIT-(storage.questionsAnswered||0));
  const paidBlocked = isPaid && !isAdmin && paidQuestionsLeft===0;
  const isDisqualifiedToday = !isAdmin && storage.disqualifiedDate===getTodayKey();
  const canPlay = !freeBlocked && !paidBlocked && !isDisqualifiedToday && !deviceBlocked;

  const loadQuestions = useCallback(async()=>{
    setAiStatus("loading");
    try {
      const response=await fetch('https://white-limit-e2fe.luckyfaizu3.workers.dev/braintrap',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});
      const result=await response.json();
      if(result.success&&result.questions?.length>=20){
        setAiStatus("ready");
        const today=new Date().toISOString().split("T")[0];
        setDoc(doc(db,'questionCache','braintrap_daily'),{questions:result.questions,generatedAt:new Date().toISOString(),date:today,count:result.questions.length}).catch(()=>{});
        return result.questions;
      }
    } catch(e){console.error("AI failed:",e);}
    try {
      const snap=await getDoc(doc(db,'questionCache','braintrap_daily'));
      if(snap.exists()&&snap.data().questions?.length>=20){setAiStatus("cached");return snap.data().questions;}
    } catch{}
    setAiStatus("failed");
    return FALLBACK_QUESTIONS;
  },[]);

  const startGame = useCallback(async()=>{
    if(!user){window.showToast?.('⚠️ Please login first!','warning');return;}
    const today=getTodayKey();
    let st=storage;
    if(st.date!==today){st={...st,date:today,questionsAnswered:0,hasPlayedFree:false};saveStorage(st);setStorage(st);}
    setScreen("loading");
    const allQs=await loadQuestions();
    const normalized=allQs.map((q,idx)=>({
      id:q.id||idx+1,code:q.code||q.question||'',answer:q.answer||(q.options&&q.options[q.correct])||'',
      options:q.options||[],explanation:q.explanation||'',difficulty:q.difficulty||'easy',
      trap:q.difficulty==='trap'||q.difficulty==='mega',
    }));
    const easy=normalized.filter(q=>q.difficulty==='easy').sort(()=>Math.random()-.5);
    const medium=normalized.filter(q=>q.difficulty==='medium').sort(()=>Math.random()-.5);
    const hard=normalized.filter(q=>q.difficulty==='hard'||q.difficulty==='trap'||q.difficulty==='mega').sort(()=>Math.random()-.5);
    let sel;
    if(isPaid||isAdmin){
      sel=[...easy.slice(0,10),...medium.slice(0,10),...hard.slice(0,10)];
      if(sel.length<20) sel=normalized.sort(()=>Math.random()-.5).slice(0,30);
    } else {
      sel=[...easy.slice(0,4),...medium.slice(0,3),...hard.slice(0,3)];
      if(sel.length<8) sel=normalized.sort(()=>Math.random()-.5).slice(0,10);
    }
    sel=sel.sort(()=>Math.random()-.5);
    setQuestions(sel);setQIndex(0);setScore(0);setCorrect(0);setStreak(0);setMaxStreak(0);
    setSelected(null);setAnswered(false);setTimer(12);setSessionAnswers([]);setReaction("");setSaved(false);setPlayerName('');
    resetAntiCheat();setScreen("playing");
  },[isPaid,isAdmin,loadQuestions,storage,user]);

  useEffect(()=>{
    if(screen!=="playing"||answered) return;
    timerRef.current=setInterval(()=>{
      setTimer(t=>{if(t<=1){clearInterval(timerRef.current);handleAnswerRef.current(null);return 0;}return t-1;});
    },1000);
    return()=>clearInterval(timerRef.current);
  },[screen,answered,qIndex]);

  useEffect(()=>{if(screen==="playing"&&!answered)setTimer(12);},[qIndex,screen,answered]);

  useEffect(()=>{
    if(screen!=="playing") return;
    warningsRef.current=warnings;
    const trigger=(msg)=>{
      const n=warningsRef.current+1;warningsRef.current=n;setWarnings(n);
      if(n>=3){
        setDisqualified(true);setScreen("disqualified");clearInterval(timerRef.current);
        const today=getTodayKey();
        const updStorage={...getStorage(),disqualifiedDate:today};saveStorage(updStorage);
        if(user?.uid) setDoc(doc(db,'users',user.uid,'braintrapSubscription','status'),{disqualifiedDate:today},{merge:true}).catch(()=>{});
      } else {
        setWarningMsg(`⚠️ Warning ${n}/3: ${msg}`);setShowWarning(true);
        setTimeout(()=>setShowWarning(false),3500);
      }
    };
    const onVis=()=>{if(document.hidden)trigger('Tab switch detected!');};
    const onBlur=()=>trigger('Window focus lost!');
    const onKey=(e)=>{
      if(e.key==='PrintScreen'){e.preventDefault();trigger('Screenshot blocked!');document.body.style.filter='blur(20px)';setTimeout(()=>{document.body.style.filter='';},1500);}
      if(e.ctrlKey&&['c','s','p','a'].includes(e.key.toLowerCase())){e.preventDefault();trigger('Copy blocked!');}
    };
    const onCtx=(e)=>{e.preventDefault();trigger('Right-click blocked!');};
    const onCopy=(e)=>{e.preventDefault();trigger('Copying blocked!');};
    document.addEventListener('visibilitychange',onVis);window.addEventListener('blur',onBlur);
    document.addEventListener('keydown',onKey);document.addEventListener('contextmenu',onCtx);document.addEventListener('copy',onCopy);
    return()=>{
      document.removeEventListener('visibilitychange',onVis);window.removeEventListener('blur',onBlur);
      document.removeEventListener('keydown',onKey);document.removeEventListener('contextmenu',onCtx);document.removeEventListener('copy',onCopy);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[screen,warnings]);

  const resetAntiCheat = ()=>{
    setWarnings(0);warningsRef.current=0;setShowWarning(false);setDisqualified(false);
  };

  const handleAnswerRef = useRef(null);
  handleAnswerRef.current = useCallback((option)=>{
    if(answered) return;
    clearInterval(timerRef.current);setSelected(option);setAnswered(true);
    const q=questions[qIndex];if(!q) return;
    const isCorrect=option===q.answer;
    let ns=score,nc=correct,nst=streak,nms=maxStreak;
    if(isCorrect){
      const base=q.difficulty==="mega"?300:q.difficulty==="trap"?200:100;
      ns=score+base+timer*8;nc=correct+1;nst=streak+1;nms=Math.max(maxStreak,nst);
      setShowConfetti(true);setTimeout(()=>setShowConfetti(false),1800);
      const rs=["Excellent! 🧠","On fire! 🔥","Python master! 🐍","Nailed it! ✅"];
      setReaction(rs[Math.floor(Math.random()*rs.length)]);
    } else {
      nst=0;setScreenShake(true);setTimeout(()=>setScreenShake(false),600);
      setReaction(option===null?"⏰ Time's up! Too slow!":q.trap?"Classic Python trap! 😈":"Incorrect!");
    }
    setScore(ns);setCorrect(nc);setStreak(nst);setMaxStreak(nms);
    setSessionAnswers(prev=>[...prev,{code:q.code,selected:option,correct:q.answer,isCorrect,explanation:q.explanation}]);
    const newQCount=(getStorage()?.questionsAnswered||0)+1;
    const updStorage={...getStorage(),questionsAnswered:newQCount};
    saveStorage(updStorage);setStorage(updStorage);
    if(user?.uid&&!isAdmin) setDoc(doc(db,'users',user.uid,'braintrapSubscription','status'),{questionsAnswered:newQCount,date:getTodayKey(),isPaid:updStorage.isPaid||false,highScore:updStorage.highScore||0},{merge:true}).catch(()=>{});
    setTimeout(()=>{
      setAnswered(false);setSelected(null);setReaction("");
      const next=qIndex+1;
      if(next>=questions.length){
        if(!isPaid){
          const markFree={...getStorage(),hasPlayedFree:true};saveStorage(markFree);setStorage(markFree);
          if(user?.uid) setDoc(doc(db,'users',user.uid,'braintrapSubscription','status'),{hasPlayedFree:true,date:getTodayKey()},{merge:true}).catch(()=>{});
          markDevicePlayed(deviceFpRef.current,ipRef.current,getTodayKey(),user?.uid||'anonymous');
          setDeviceBlocked(true);
        }
        setScreen("result");
      } else setQIndex(next);
    },2400);
  },[answered,questions,qIndex,timer,score,correct,streak,maxStreak,isPaid,isAdmin,user?.uid]);

  const handleAnswer=(opt)=>handleAnswerRef.current(opt);

  useEffect(()=>{
    if(screen==="result"&&playerName.trim()&&!saved&&!saving&&!disqualified&&user?.uid){
      saveScore(score,correct,maxStreak,questions.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[screen]);

  const saveScore = useCallback(async(finalScore, finalCorrect, finalMaxStreak, finalQuestions)=>{
    if(!playerName.trim()||saving||saved) return;
    if(!user?.uid) return;
    setSaving(true);
    try {
      await addDoc(collection(db,'brainTrapLeaderboard'),{
        name:playerName.trim(),score:finalScore,correct:finalCorrect,total:finalQuestions,
        maxStreak:finalMaxStreak,date:new Date().toLocaleDateString('en-IN'),timestamp:Date.now(),
        userId:user.uid,userEmail:user.email||'',isPaid:isPaid||false,
      });
      setSaved(true);
    } catch(e){console.error(e);}
    finally{setSaving(false);}
  },[playerName,saving,saved,user,isPaid]);

  // ✅ Unified unlock: Razorpay for India, PayPal for foreign
  const unlockPaid = async () => {
    if (!user) { window.showToast?.('⚠️ Please login first!', 'warning'); return; }
    let price = 49;
    try {
      const snap = await getDoc(doc(db, 'settings', 'braintrap'));
      if (snap.exists() && snap.data().price) {
        price = snap.data().price;
        localStorage.setItem('braintrap_price', price.toString());
      } else {
        price = parseInt(localStorage.getItem('braintrap_price') || '49');
      }
    } catch { price = parseInt(localStorage.getItem('braintrap_price') || '49'); }

    if (!isIndia && geoData) {
      // ✅ Foreign user → PayPal
      initiatePayPal(geoData, 'basic', null);
      // Optimistically mark as paid after PayPal redirect (manual confirm flow)
      window.showToast?.(`🅿️ Complete payment via PayPal then refresh to unlock!`, 'info');
      return;
    }

    // Indian user → Razorpay
    onPayment(price, [], async (response) => {
      try {
        await setDoc(doc(db, 'users', user.uid, 'braintrapSubscription', 'status'), {
          isPaid: true, paidAt: new Date().toISOString(),
          paymentId: response?.razorpay_payment_id || 'manual',
          email: user.email, price
        });
        const updated = { ...storage, isPaid: true, questionsAnswered: 0, hasPlayedFree: false };
        saveStorage(updated); setStorage(updated); setShowPaywall(false);
        window.showToast?.('🎉 Brain Trap unlocked!', 'success');
      } catch (e) {
        const updated = { ...storage, isPaid: true, questionsAnswered: 0, hasPlayedFree: false };
        saveStorage(updated); setStorage(updated); setShowPaywall(false);
        window.showToast?.('🎉 Unlocked!', 'success');
      }
    });
  };

  const q = questions[qIndex];
  const progress = questions.length > 0 ? (qIndex / questions.length) * 100 : 0;

  if(screen==="loading") return <AILoadingScreen/>;

  // ── INTRO ──
  if(screen==="intro") return (
    <div style={{minHeight:"100vh",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&display=swap" rel="stylesheet"/>
      {showPaywall && <PaywallModal onClose={()=>setShowPaywall(false)} onUnlock={unlockPaid} displayPrice={displayPrice} isIndia={isIndia} geoData={geoData} />}
      <div style={{maxWidth:"500px",width:"100%",textAlign:"center"}}>
        <div style={{marginBottom:"6px",fontSize:"4.5rem",animation:"floatBob 3s ease-in-out infinite"}}>🧠</div>
        <h1 style={{fontSize:"clamp(2.2rem,6vw,3.2rem)",fontWeight:"900",margin:"0 0 4px",background:"linear-gradient(135deg,#6366f1,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.04em"}}>Brain Trap</h1>
        <div style={{fontSize:"0.78rem",fontWeight:"800",color:"#1e1b4b",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:"16px"}}>Python's Most Dangerous Quiz</div>

        {/* ✅ Foreign currency pill */}
        {!isIndia && geoData && (
          <div style={{display:"inline-flex",alignItems:"center",gap:"6px",marginBottom:"16px",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:"20px",padding:"5px 14px",fontSize:"0.75rem",fontWeight:"700",color:"#6366f1"}}>
            {geoData.flag} {geoData.countryName} • Prices in {geoData.currency} • 🅿️ PayPal
          </div>
        )}

        {!user && (
          <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"14px",padding:"12px 16px",marginBottom:"14px"}}>
            <div style={{fontSize:"0.85rem",color:"#dc2626",fontWeight:"700"}}>⚠️ You must be logged in to play!</div>
          </div>
        )}

        <div style={{display:"flex",gap:"10px",marginBottom:"24px"}}>
          {[{val:"AI",label:"Fresh Questions"},{val:"🤖",label:"Every Session"},{val:"12s",label:"Per Question"}].map((s,i)=>(
            <div key={i} style={{flex:1,background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:"14px",padding:"12px 6px"}}>
              <div style={{fontSize:"1.2rem",fontWeight:"900",color:"#1e1b4b",marginBottom:"2px"}}>{s.val}</div>
              <div style={{fontSize:"0.65rem",color:"#4338ca",fontWeight:"700"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {user && (
          <div style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:"16px",padding:"14px 18px",marginBottom:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.82rem"}}>
              <span style={{color:"#1e1b4b",fontWeight:"700"}}>
                {isAdmin?"👑 Admin — Unlimited Access"
                  :isDisqualifiedToday?"🚫 Disqualified — try again tomorrow"
                  :deviceBlocked?"🔒 Device limit reached today"
                  :isPaid?paidBlocked?"⛔ 30/30 questions used today":`🎮 ${paidQuestionsLeft}/30 left`
                  :freeBlocked?"⛔ Free session used today":"🎮 Free: 10 questions/day"}
              </span>
              {/* ✅ Geo-aware upgrade prompt */}
              {!isPaid && <span style={{color:"#6366f1",fontWeight:"800",fontSize:"0.78rem",cursor:"pointer"}} onClick={()=>setShowPaywall(true)}>Upgrade — {displayPrice} →</span>}
            </div>
            {isPaid&&!isAdmin&&(
              <div style={{height:"4px",background:"rgba(99,102,241,0.15)",borderRadius:"4px",marginTop:"8px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(100,((storage.questionsAnswered||0)/PAID_DAILY_LIMIT)*100)}%`,background:"linear-gradient(90deg,#6366f1,#ec4899)",borderRadius:"4px"}}/>
              </div>
            )}
          </div>
        )}

        <div style={{marginBottom:"12px"}}>
          <input value={playerName} onChange={e=>setPlayerName(e.target.value)} placeholder="Enter your name to play 🏆"
            style={{width:"100%",padding:"13px 16px",borderRadius:"14px",border:"1.5px solid rgba(99,102,241,0.35)",background:"rgba(255,255,255,0.85)",color:"#1e1b4b",fontSize:"0.92rem",fontWeight:"700",outline:"none",boxSizing:"border-box"}}/>
          {!playerName.trim()&&<div style={{fontSize:"0.7rem",color:"#6366f1",fontWeight:"600",marginTop:"5px",textAlign:"left"}}>⚠️ Name is required</div>}
        </div>

        {storage.highScore>0&&<div style={{fontSize:"0.78rem",color:"#1e1b4b",fontWeight:"700",marginBottom:"12px"}}>🏆 Your best score: <strong style={{color:"#d97706"}}>{storage.highScore} pts</strong></div>}

        <button onClick={()=>{if(playerName.trim())startGame();}} disabled={!canPlay||!playerName.trim()||!user}
          style={{width:"100%",padding:"16px",background:(!canPlay||!playerName.trim()||!user)?"rgba(99,102,241,0.2)":"linear-gradient(135deg,#6366f1,#ec4899)",border:"none",borderRadius:"18px",color:(!canPlay||!playerName.trim()||!user)?"#6366f1":"#fff",fontSize:"1.05rem",fontWeight:"900",cursor:(!canPlay||!playerName.trim()||!user)?"not-allowed":"pointer",marginBottom:"10px"}}>
          {!user?"⚠️ Please login first"
            :!playerName.trim()?"Enter your name first 👆"
            :isDisqualifiedToday?"🚫 Disqualified — try again tomorrow"
            :deviceBlocked?`🔒 Upgrade — ${displayPrice}/month`
            :isAdmin?"👑 Start (Admin Mode)"
            :freeBlocked?"Come back tomorrow 🌅"
            :paidBlocked?"30 questions done today!"
            :isPaid?`🧠 Start (${paidQuestionsLeft} remaining)`
            :"🧠 Start Free — 10 Questions"}
        </button>

        {/* ✅ Geo-aware upgrade button */}
        {!isPaid&&user&&(
          <button onClick={()=>setShowPaywall(true)}
            style={{width:"100%",padding:"12px",background:"transparent",border:"1.5px solid rgba(99,102,241,0.4)",borderRadius:"14px",color:"#6366f1",fontSize:"0.9rem",fontWeight:"700",cursor:"pointer",marginBottom:"8px"}}>
            🚀 Unlock 30 Questions/Day — {displayPrice}/month{!isIndia&&geoData?" via PayPal":""}
          </button>
        )}

        {isAdmin&&<AdminControls livePrice={livePrice} setLivePrice={setLivePrice}/>}
        <LeaderboardInline isAdmin={isAdmin} currentUserId={user?.uid}/>
      </div>
      <style>{`@keyframes floatBob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-14px) rotate(2deg)}}`}</style>
    </div>
  );

  // ── DISQUALIFIED ──
  if(screen==="disqualified") return (
    <div style={{minHeight:"100vh",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
      <div style={{maxWidth:"420px",width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"5rem",marginBottom:"12px"}}>🚫</div>
        <h2 style={{fontSize:"2rem",fontWeight:"900",color:"#dc2626",margin:"0 0 8px"}}>Disqualified!</h2>
        <div style={{fontSize:"0.9rem",color:"#7f1d1d",fontWeight:"700",marginBottom:"20px",lineHeight:1.5}}>
          3 anti-cheat violations detected. Your session has been terminated.
        </div>
        <div style={{background:"rgba(220,38,38,0.06)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:"14px",padding:"14px 16px",marginBottom:"20px"}}>
          <div style={{fontSize:"1.5rem",marginBottom:"6px"}}>🕐</div>
          <div style={{fontSize:"0.88rem",fontWeight:"800",color:"#dc2626",marginBottom:"4px"}}>Banned for today</div>
          <div style={{fontSize:"0.75rem",color:"#7f1d1d",lineHeight:1.5}}>Come back tomorrow and play fairly.</div>
        </div>
        <button onClick={()=>setScreen("intro")}
          style={{width:"100%",padding:"14px",background:"rgba(99,102,241,0.1)",border:"1.5px solid rgba(99,102,241,0.3)",borderRadius:"16px",color:"#3730a3",fontSize:"0.95rem",fontWeight:"800",cursor:"pointer"}}>
          ← Back to Home
        </button>
      </div>
    </div>
  );

  // ── PLAYING ──
  if(screen==="playing"&&q){
    const timerColor=timer<=3?"#ef4444":timer<=6?"#f59e0b":"#10b981";
    const codeToShow=q.code||q.question||'';
    return (
      <div style={{minHeight:"100vh",background:"transparent",padding:"clamp(12px,3vw,24px)",fontFamily:"'Space Grotesk',system-ui,sans-serif",animation:screenShake?"shake 0.5s ease":"none"}}>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
        {showConfetti&&<Confetti/>}
        {showWarning&&(
          <div style={{position:'fixed',top:0,left:0,right:0,zIndex:99999,background:'linear-gradient(135deg,#dc2626,#b91c1c)',padding:'14px 20px',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 4px 20px rgba(220,38,38,0.5)'}}>
            <span style={{fontSize:'1.5rem'}}>🚨</span>
            <div>
              <div style={{color:'#fff',fontWeight:'900',fontSize:'0.92rem'}}>{warningMsg}</div>
              <div style={{color:'rgba(255,255,255,0.8)',fontSize:'0.72rem'}}>{3-warnings} more = DISQUALIFIED</div>
            </div>
          </div>
        )}
        <div style={{maxWidth:"620px",margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
            <button onClick={()=>{if(window.confirm('Quit?')){setScreen("intro");}}} style={{background:"rgba(255,255,255,0.6)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"10px",padding:"8px 14px",color:"#3730a3",fontWeight:"700",fontSize:"0.78rem",cursor:"pointer"}}>← Back</button>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              {streak>=3&&<div style={{background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.4)",borderRadius:"20px",padding:"4px 12px",fontSize:"0.72rem",fontWeight:"800",color:"#b45309"}}>🔥 {streak}x</div>}
              <div style={{background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:"12px",padding:"6px 14px",fontSize:"0.88rem",fontWeight:"900",color:"#4338ca"}}>⚡ {score}</div>
            </div>
          </div>
          <div style={{height:"3px",background:"rgba(255,255,255,0.06)",borderRadius:"3px",marginBottom:"20px"}}>
            <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#6366f1,#ec4899)",borderRadius:"3px",transition:"width 0.4s ease"}}/>
          </div>
          <div style={{background:"rgba(255,255,255,0.75)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"22px",padding:"clamp(16px,4vw,26px)",marginBottom:"14px",backdropFilter:"blur(10px)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <span style={{fontSize:"0.75rem",fontWeight:"700",color:"#3730a3"}}>{qIndex+1}/{questions.length}</span>
                <DiffBadge diff={q.difficulty}/>
              </div>
              <div style={{width:"42px",height:"42px",borderRadius:"50%",border:`2.5px solid ${timerColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",fontWeight:"900",color:timerColor,animation:timer<=3?"timerPanic 0.4s ease-in-out infinite":"none"}}>
                {timer}
              </div>
            </div>
            <div style={{fontSize:"0.85rem",fontWeight:"700",color:"#1e1b4b",marginBottom:"10px"}}>What will this code output?</div>
            <div style={{background:"#1e1b4b",borderRadius:"14px",padding:"16px 18px",marginBottom:"12px",border:"1px solid rgba(99,102,241,0.3)",position:"relative"}}>
              <div style={{position:"absolute",top:"10px",right:"12px",display:"flex",gap:"5px"}}>
                {["#ff5f57","#ffbd2e","#28c840"].map((c,i)=><div key={i} style={{width:"9px",height:"9px",borderRadius:"50%",background:c}}/>)}
              </div>
              <pre style={{margin:0,color:"#f1f5f9",fontFamily:"'JetBrains Mono','Courier New',monospace",fontSize:"clamp(0.78rem,2.5vw,0.9rem)",lineHeight:"1.7",whiteSpace:"pre-wrap",paddingTop:"6px"}}>{codeToShow}</pre>
            </div>
            {answered&&reaction&&(
              <div style={{background:selected===q.answer?"rgba(5,150,105,0.1)":"rgba(220,38,68,0.08)",border:`1px solid ${selected===q.answer?"rgba(5,150,105,0.4)":"rgba(220,38,68,0.3)"}`,borderRadius:"12px",padding:"10px 14px",fontSize:"0.82rem",fontWeight:"800",color:selected===q.answer?"#059669":"#dc2626"}}>
                {reaction}
              </div>
            )}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
            {q.options.map((opt,i)=>{
              const isSel=selected===opt,isCorr=opt===q.answer;
              let bg,border,color;
              if(answered){if(isCorr){bg="rgba(5,150,105,0.12)";border="2px solid #059669";color="#059669";}
              else if(isSel){bg="rgba(220,38,38,0.1)";border="2px solid #dc2626";color="#dc2626";}
              else{bg="rgba(255,255,255,0.5)";border="1px solid rgba(99,102,241,0.1)";color="#94a3b8";}}
              else{bg="rgba(255,255,255,0.7)";border="1.5px solid rgba(99,102,241,0.2)";color="#1e1b4b";}
              return (
                <button key={i} onClick={()=>!answered&&handleAnswer(opt)} disabled={answered}
                  style={{background:bg,border,borderRadius:"16px",padding:"14px 12px",cursor:answered?"default":"pointer",display:"flex",alignItems:"center",gap:"10px",textAlign:"left",fontFamily:"'Space Grotesk',system-ui"}}
                  onMouseEnter={e=>{if(!answered){e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.borderColor="#6366f1";}}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";if(!answered)e.currentTarget.style.borderColor="rgba(99,102,241,0.2)";}}>
                  <div style={{width:"26px",height:"26px",borderRadius:"8px",background:answered&&isCorr?"rgba(5,150,105,0.2)":answered&&isSel?"rgba(220,38,38,0.2)":"rgba(99,102,241,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",fontWeight:"900",color:answered&&isCorr?"#059669":answered&&isSel?"#dc2626":"#6366f1",flexShrink:0}}>
                    {answered&&isCorr?"✓":answered&&isSel?"✗":String.fromCharCode(65+i)}
                  </div>
                  <span style={{fontSize:"0.82rem",fontWeight:"700",color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.4,wordBreak:"break-all"}}>{opt}</span>
                </button>
              );
            })}
          </div>
          {answered&&(
            <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:"14px",padding:"12px 16px",fontSize:"0.8rem",color:"#3730a3",fontWeight:"700",lineHeight:1.5}}>
              💡 {q.explanation}
            </div>
          )}
        </div>
        <style>{`
          @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
          @keyframes timerPanic{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        `}</style>
      </div>
    );
  }

  // ── RESULT ──
  if(screen==="result"){
    const pct=questions.length>0?Math.round((correct/questions.length)*100):0;
    const emoji=pct===100?"🏆":pct>=70?"🔥":pct>=40?"😅":"💀";
    const title=pct===100?"Perfect Score!":pct>=70?"Great Performance!":pct>=40?"Decent Effort!":"Keep Practicing!";
    if(score>storage.highScore){const u={...storage,highScore:score};saveStorage(u);setStorage(u);}
    return (
      <div style={{minHeight:"100vh",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
        {showPaywall && <PaywallModal onClose={()=>setShowPaywall(false)} onUnlock={unlockPaid} displayPrice={displayPrice} isIndia={isIndia} geoData={geoData} />}
        <div style={{maxWidth:"480px",width:"100%",textAlign:"center"}}>
          <div style={{fontSize:"4rem",marginBottom:"10px"}}>{emoji}</div>
          <h2 style={{fontSize:"clamp(1.5rem,5vw,2rem)",fontWeight:"900",margin:"0 0 4px",background:"linear-gradient(135deg,#6366f1,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{title}</h2>
          {playerName&&<div style={{fontSize:"0.82rem",color:"#6366f1",fontWeight:"700",marginBottom:"4px"}}>Player: {playerName}</div>}
          <div style={{fontSize:"0.82rem",color:"#3730a3",fontWeight:"600",marginBottom:"20px"}}>{pct}% accuracy</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"16px"}}>
            {[{label:"Score",value:score,icon:"⚡",color:"#4338ca"},{label:"Correct",value:`${correct}/${questions.length}`,icon:"✅",color:"#059669"},{label:"Streak",value:`${maxStreak}🔥`,icon:"🔥",color:"#d97706"}].map((s,i)=>(
              <div key={i} style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:"16px",padding:"14px 10px"}}>
                <div style={{fontSize:"1.1rem",marginBottom:"4px"}}>{s.icon}</div>
                <div style={{fontSize:"clamp(1rem,3vw,1.3rem)",fontWeight:"900",color:s.color}}>{s.value}</div>
                <div style={{fontSize:"0.65rem",color:"#3730a3",fontWeight:"700",textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
          {saved&&<div style={{background:"rgba(5,150,105,0.1)",border:"1px solid rgba(5,150,105,0.3)",borderRadius:"12px",padding:"10px 14px",fontSize:"0.82rem",fontWeight:"700",color:"#059669",marginBottom:"12px"}}>🏆 Score saved to leaderboard as <strong>{playerName}</strong>!</div>}
          {saving&&<div style={{background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"12px",padding:"10px 14px",fontSize:"0.78rem",color:"#4338ca",marginBottom:"12px"}}>⏳ Saving score to leaderboard...</div>}
          {!isPaid&&(
            <div style={{background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"12px",padding:"10px 14px",fontSize:"0.78rem",color:"#4338ca",marginBottom:"12px"}}>
              👑 Upgrade to {displayPrice}/month{!isIndia&&geoData?" via PayPal":""} — get a gold name on the leaderboard!
            </div>
          )}
          <div style={{background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"16px",padding:"14px",marginBottom:"16px",maxHeight:"180px",overflowY:"auto"}}>
            <div style={{fontSize:"0.72rem",fontWeight:"800",color:"#3730a3",textTransform:"uppercase",marginBottom:"8px"}}>Review</div>
            {sessionAnswers.map((a,i)=>(
              <div key={i} style={{display:"flex",gap:"8px",padding:"5px 0",borderBottom:i<sessionAnswers.length-1?"1px solid rgba(99,102,241,0.1)":"none"}}>
                <span style={{fontSize:"0.75rem"}}>{a.isCorrect?"✅":"❌"}</span>
                <div style={{flex:1,textAlign:"left"}}>
                  <div style={{fontSize:"0.68rem",color:"#4338ca",fontFamily:"monospace"}}>{(a.code||'').split("\n")[0]}...</div>
                  {!a.isCorrect&&<div style={{fontSize:"0.65rem",color:"#dc2626",fontWeight:"700"}}>Correct: {a.correct}</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {isPaid?(
              paidBlocked?
                <div style={{padding:"14px",background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"16px",color:"#4338ca",fontSize:"0.88rem",fontWeight:"700"}}>✅ 30 questions done today! Come back tomorrow 🌅</div>
                :<button onClick={startGame} style={{padding:"15px",background:"linear-gradient(135deg,#6366f1,#ec4899)",border:"none",borderRadius:"16px",color:"#fff",fontSize:"1rem",fontWeight:"900",cursor:"pointer"}}>
                  {isAdmin?"👑 Play Again":`🧠 Play Again (${paidQuestionsLeft} remaining)`}
                </button>
            ):(
              <button onClick={()=>setShowPaywall(true)} style={{padding:"15px",background:"linear-gradient(135deg,#6366f1,#ec4899)",border:"none",borderRadius:"16px",color:"#fff",fontSize:"1rem",fontWeight:"900",cursor:"pointer"}}>
                🚀 Unlock 30 Questions/Day — {displayPrice}/month{!isIndia&&geoData?" via PayPal":""}
              </button>
            )}
            <button onClick={()=>setScreen("intro")} style={{padding:"12px",background:"transparent",border:"1px solid rgba(99,102,241,0.3)",borderRadius:"14px",color:"#3730a3",fontSize:"0.88rem",fontWeight:"700",cursor:"pointer"}}>← Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}