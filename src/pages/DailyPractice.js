import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { saveDay, getAllDays, resetStreak, getStreakUser, createStreakUser } from '../streakService';

const API_URL     = 'https://white-limit-e2fe.luckyfaizu3.workers.dev/chat';
const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

// ── 30-Day Curriculum ─────────────────────────────────────────────────────────
const CURRICULUM = [
  { day:1,  topic:'Variables and Data Types',          level:'Beginner'     },
  { day:2,  topic:'Strings and String Methods',        level:'Beginner'     },
  { day:3,  topic:'Lists and List Operations',         level:'Beginner'     },
  { day:4,  topic:'Dictionaries and Sets',             level:'Beginner'     },
  { day:5,  topic:'Conditional Statements',            level:'Beginner'     },
  { day:6,  topic:'For Loops and While Loops',         level:'Beginner'     },
  { day:7,  topic:'Functions and Arguments',           level:'Beginner'     },
  { day:8,  topic:'List Comprehensions',               level:'Intermediate' },
  { day:9,  topic:'Lambda and Higher Order Functions', level:'Intermediate' },
  { day:10, topic:'File Handling',                     level:'Intermediate' },
  { day:11, topic:'Exception Handling',                level:'Intermediate' },
  { day:12, topic:'Classes and Objects',               level:'Intermediate' },
  { day:13, topic:'Inheritance and Polymorphism',      level:'Intermediate' },
  { day:14, topic:'Modules and Packages',              level:'Intermediate' },
  { day:15, topic:'Regular Expressions',               level:'Intermediate' },
  { day:16, topic:'Decorators',                        level:'Advanced'     },
  { day:17, topic:'Generators and Iterators',          level:'Advanced'     },
  { day:18, topic:'Async Programming',                 level:'Advanced'     },
  { day:19, topic:'APIs and JSON Handling',            level:'Advanced'     },
  { day:20, topic:'NumPy Basics',                      level:'Intermediate' },
  { day:21, topic:'Pandas DataFrames',                 level:'Intermediate' },
  { day:22, topic:'Flask Web Development',             level:'Intermediate' },
  { day:23, topic:'SQLite Database',                   level:'Intermediate' },
  { day:24, topic:'Selenium Automation',               level:'Advanced'     },
  { day:25, topic:'Data Structures',                   level:'Advanced'     },
  { day:26, topic:'Sorting and Searching Algorithms',  level:'Advanced'     },
  { day:27, topic:'Recursion and Dynamic Programming', level:'Advanced'     },
  { day:28, topic:'Machine Learning with Sklearn',     level:'Advanced'     },
  { day:29, topic:'Python Best Practices and PEP8',    level:'Intermediate' },
  { day:30, topic:'Full Python Review and Interview',  level:'Advanced'     },
];

// ── Claude AI ─────────────────────────────────────────────────────────────────
const callClaude = async (prompt) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error('API error');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '', leftover = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = leftover + decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    leftover = lines.pop() || '';
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data: ')) continue;
      const d = t.slice(6).trim();
      if (d === '[DONE]' || !d) continue;
      try {
        const delta = JSON.parse(d).choices?.[0]?.delta?.content;
        if (typeof delta === 'string') full += delta;
      } catch {}
    }
  }
  return full;
};

const generateQuestions = async (topic, level, prevQs = []) => {
  const avoidList = prevQs.length > 0
    ? `\nNEVER repeat these:\n${prevQs.slice(-20).join('\n')}`
    : '';

  const prompt = `You are a Python quiz generator. Generate exactly 10 unique Python questions.
Topic: ${topic}
Level: ${level}
${avoidList}

Mix ALL these types (at least 1-2 each):
- MCQ: 4 options A B C D
- OUTPUT: show code, ask what it prints
- CODE: write a Python function
- FILL: fill in the blank
- DEBUG: find and fix the bug

Return ONLY valid JSON array, zero text outside.

[
  {"type":"MCQ","q":"Question?","options":["A) opt1","B) opt2","C) opt3","D) opt4"],"answer":"A) opt1","explanation":"reason"},
  {"type":"OUTPUT","q":"What prints?","code":"x=[1,2,3]\\nprint(x[-1])","options":["A) 1","B) 2","C) 3","D) Error"],"answer":"C) 3","explanation":"x[-1] is last element"},
  {"type":"CODE","q":"Write function to return sum of digits.","answer":"def digit_sum(n):\\n    return sum(int(d) for d in str(n))","explanation":"Convert to string, iterate"},
  {"type":"FILL","q":"Open file for writing: f = open('f.txt', ____)","answer":"'w'","explanation":"w mode for writing"},
  {"type":"DEBUG","q":"Fix this:","code":"def sq(n)\\n    return n*n","answer":"Missing colon: def sq(n):","explanation":"Colon required after def"}
]`;

  const raw   = await callClaude(prompt);
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Bad JSON');
  return JSON.parse(match[0]);
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);

const formatCountdown = () => {
  const now  = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  const diff = next - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

const getPrevQs  = (uid, topic) => { try { return JSON.parse(localStorage.getItem(`pq_${uid}_${topic.replace(/\s/g,'_')}`) || '[]'); } catch { return []; } };
const savePrevQs = (uid, topic, qs) => {
  const prev = getPrevQs(uid, topic);
  localStorage.setItem(`pq_${uid}_${topic.replace(/\s/g,'_')}`, JSON.stringify([...prev, ...qs.map(q=>q.q)].slice(-30)));
};

// ── PDF Generator ─────────────────────────────────────────────────────────────
const makePDF = (userName, results) => {
  const doc   = new jsPDF();
  const OR    = [255, 107, 0];
  const DARK  = [17, 24, 39];
  const GRAY  = [107, 114, 128];
  const GREEN = [34, 197, 94];
  const RED   = [239, 68, 68];
  const AMB   = [245, 158, 11];

  // Cover
  doc.setFillColor(...OR);
  doc.rect(0, 0, 210, 50, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(20); doc.setFont('helvetica','bold');
  doc.text('PySkill - 30-Day Python Report', 15, 20);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text(`Student: ${userName || 'Student'}`, 15, 32);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`, 15, 40);
  doc.setFontSize(8); doc.text('faizupyzone.shop', 160, 40);

  // Stats
  const totalQ  = results.reduce((a,r)=>a+r.total, 0);
  const correct = results.reduce((a,r)=>a+r.score, 0);
  const pct     = totalQ ? Math.round((correct/totalQ)*100) : 0;

  doc.setTextColor(...DARK); doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text('Overall Summary', 15, 62);
  doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
  doc.text(`Sessions Completed: ${results.length} / 30`, 15, 72);
  doc.text(`Total Questions: ${totalQ}`, 15, 80);
  doc.text(`Correct Answers: ${correct}`, 15, 88);
  doc.text(`Overall Score: ${pct}%`, 15, 96);

  doc.setFillColor(229,231,235); doc.rect(15,102,180,8,'F');
  doc.setFillColor(...OR); doc.rect(15,102,(180*pct)/100,8,'F');
  doc.setTextColor(...DARK); doc.setFontSize(9);
  doc.text(`${pct}%`, 200, 108, {align:'right'});

  // Topic analysis
  const topicMap = {};
  results.forEach(r => {
    if (!topicMap[r.topic]) topicMap[r.topic] = {score:0,total:0};
    topicMap[r.topic].score += r.score;
    topicMap[r.topic].total += r.total;
  });
  const strong = Object.entries(topicMap).filter(([,v])=>v.total&&v.score/v.total>=0.7).map(([k])=>k);
  const medium = Object.entries(topicMap).filter(([,v])=>v.total&&v.score/v.total>=0.5&&v.score/v.total<0.7).map(([k])=>k);
  const weak   = Object.entries(topicMap).filter(([,v])=>v.total&&v.score/v.total<0.5).map(([k])=>k);

  let y = 120;
  doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
  doc.text('Topic Analysis', 15, y); y += 10;

  const section = (title, list, color) => {
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...color);
    doc.text(title, 15, y); y += 8;
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    if (list.length) {
      list.forEach(t => {
        if (y>270){doc.addPage();y=20;}
        const tp = topicMap[t];
        const p  = Math.round((tp.score/tp.total)*100);
        doc.setTextColor(...color); doc.text(`  • ${t}`, 15, y);
        doc.setTextColor(...GRAY);  doc.text(`${tp.score}/${tp.total} (${p}%)`, 175, y);
        y += 7;
      });
    } else {
      doc.setTextColor(...GRAY); doc.text('  None', 15, y); y += 7;
    }
    y += 4;
  };

  section('STRONG  (>= 70%)',  strong, GREEN);
  section('AVERAGE (50-69%)',  medium, AMB);
  section('WEAK    (< 50%) - NEEDS REVISION', weak, RED);

  if (weak.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
    doc.text('Recommendations', 15, y); y += 8;
    doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
    weak.forEach(t => {
      if (y>270){doc.addPage();y=20;}
      doc.text('  -> Revise "' + t + '" and practice more on this topic.', 15, y); y += 7;
    });
  }

  // Day-wise table
  doc.addPage();
  doc.setFillColor(...OR); doc.rect(0,0,210,22,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text('Day-wise Performance', 15, 14);

  y = 30;
  const xPos = [15,28,60,118,150,170];
  doc.setFontSize(9); doc.setFillColor(...OR); doc.rect(15,y-6,180,9,'F');
  doc.setTextColor(255,255,255);
  ['Day','Date','Topic','Level','Score','Pct'].forEach((h,i) => doc.text(h, xPos[i], y));
  y += 6;

  results.forEach((r,i) => {
    if (y>272){doc.addPage();y=20;}
    const p  = Math.round((r.score/r.total)*100);
    doc.setFillColor(...(i%2===0?[249,250,251]:[255,255,255]));
    doc.rect(15,y-5,180,9,'F');
    doc.setTextColor(...DARK); doc.setFont('helvetica','normal');
    doc.text(`${r.day||i+1}`, xPos[0], y);
    doc.text(r.date, xPos[1], y);
    doc.text(r.topic.substring(0,24), xPos[2], y);
    doc.text((r.level||'').substring(0,10), xPos[3], y);
    doc.text(`${r.score}/${r.total}`, xPos[4], y);
    doc.setTextColor(...(p>=70?GREEN:p>=50?AMB:RED));
    doc.text(`${p}%`, xPos[5], y);
    y += 9;
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let p=1;p<=pages;p++) {
    doc.setPage(p);
    doc.setTextColor(...GRAY); doc.setFontSize(8);
    doc.text('Generated by PySkill — faizupyzone.shop', 105, 290, {align:'center'});
    doc.text(`Page ${p} of ${pages}`, 190, 290, {align:'right'});
  }

  doc.save(`PySkill_30Day_${userName||'Student'}_${todayStr()}.pdf`);
};

// ── TYPE STYLES ───────────────────────────────────────────────────────────────
const TS = {
  MCQ:    {bg:'rgba(99,102,241,0.12)', border:'rgba(99,102,241,0.3)', color:'#6366f1', label:'🔵 Multiple Choice'},
  OUTPUT: {bg:'rgba(16,185,129,0.12)',border:'rgba(16,185,129,0.3)',color:'#10b981', label:'🟢 Guess Output'},
  CODE:   {bg:'rgba(245,158,11,0.12)',border:'rgba(245,158,11,0.3)',color:'#f59e0b', label:'🟡 Write Code'},
  FILL:   {bg:'rgba(236,72,153,0.12)',border:'rgba(236,72,153,0.3)',color:'#ec4899', label:'🩷 Fill Blank'},
  DEBUG:  {bg:'rgba(239,68,68,0.12)', border:'rgba(239,68,68,0.3)', color:'#ef4444', label:'🔴 Debug Code'},
};

// ══════════════════════════════════════════════════════════════════════════════
const DailyPractice = ({ isDark, user, setCurrentPage }) => {
  const uid     = user?.uid;
  const isAdmin = user?.email === ADMIN_EMAIL;
  const today   = todayStr();

  const [screen,    setScreen]    = useState('home');
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [todayInfo, setTodayInfo] = useState(null);
  const [countdown, setCountdown] = useState('');

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [current,   setCurrent]   = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [codeAns,   setCodeAns]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [skipped,   setSkipped]   = useState(false);
  const [score,     setScore]     = useState(0);
  const [answers,   setAnswers]   = useState([]);
  const [mobile,    setMobile]    = useState(window.innerWidth <= 768);

  // Load from Firestore on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!uid) { setCurrentPage('login'); return; } // eslint-disable-line
    init(); // eslint-disable-line
    const h = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    const tick = () => setCountdown(formatCountdown());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const init = async () => {
    setLoading(true);
    try {
      // Check purchased
      const streakUser = await getStreakUser(uid);
      if (!isAdmin && !streakUser?.purchased && !localStorage.getItem(`streak_purchased_${uid}`)) {
        setCurrentPage('streak');
        return;
      }
      // Create user doc if not exists
      if (!streakUser) {
        await createStreakUser(uid, user.email, user.displayName);
      }
      // Load results from Firestore
      const days = await getAllDays(uid);
      setResults(days);
      computeTodayInfo(days, streakUser);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const computeTodayInfo = (res, streakUser) => {
    const startDate = streakUser?.startDate || today;
    const dayNum    = Math.min(
      Math.floor((new Date(today) - new Date(startDate)) / 86400000) + 1,
      30
    );
    // Detect weak topic
    const topicMap = {};
    res.forEach(r => {
      if (!topicMap[r.topic]) topicMap[r.topic] = {score:0,total:0};
      topicMap[r.topic].score += r.score;
      topicMap[r.topic].total += r.total;
    });
    const weakTopics = Object.entries(topicMap)
      .filter(([,v]) => v.total>=5 && v.score/v.total < 0.5)
      .map(([k]) => k);

    let assigned = CURRICULUM[Math.min(dayNum-1, 29)];
    // Every 3rd session revisit weak topic
    if (weakTopics.length > 0 && res.length > 6 && res.length % 3 === 0) {
      assigned = { day: dayNum, topic: weakTopics[0], level: 'Intermediate', isRevision: true };
    }
    setTodayInfo({ ...assigned, dayNum });
  };

  const alreadyDoneToday = results.some(r => r.date === today);
  const totalDays        = results.length;
  const avgScore         = totalDays ? Math.round(results.reduce((a,r)=>a+r.pct,0)/totalDays) : 0;

  const cardBg      = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border      = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
  const textPrimary = isDark ? '#f0f2ff' : '#111827';
  const textSec     = isDark ? '#8b93a8' : '#6b7280';
  const pageBg      = isDark ? 'linear-gradient(160deg,#060b14,#0d1117)' : 'linear-gradient(160deg,#f5f7ff,#ffffff)';

  const wrap = (children, maxW='680px') => (
    <div style={{minHeight:'100vh',background:pageBg,fontFamily:"'Syne',sans-serif",color:textPrimary,paddingTop:mobile?'80px':'100px',paddingBottom:'60px',paddingLeft:mobile?'16px':'24px',paddingRight:mobile?'16px':'24px',boxSizing:'border-box'}}>
      <div style={{maxWidth:maxW,margin:'0 auto'}}>{children}</div>
    </div>
  );

  // Start Quiz
  const startPractice = async () => {
    if (!todayInfo) return;
    setScreen('loading');
    try {
      const prev = getPrevQs(uid, todayInfo.topic);
      const qs   = await generateQuestions(todayInfo.topic, todayInfo.level, prev);
      savePrevQs(uid, todayInfo.topic, qs);
      setQuestions(qs);
      setCurrent(0); setSelected(null); setCodeAns('');
      setSubmitted(false); setSkipped(false); setScore(0); setAnswers([]);
      setScreen('quiz');
    } catch(e) {
      console.error(e);
      setScreen('home');
      window.showToast?.('Failed to generate questions. Try again!', 'error');
    }
  };

  const handleSubmit = () => {
    const q = questions[current];
    const isMCQ = q.type === 'MCQ' || q.type === 'OUTPUT';
    if (isMCQ && !selected) return;
    if (!isMCQ && !codeAns.trim()) return;
    let isCorrect = false;
    if (isMCQ) {
      isCorrect = selected === q.answer;
    } else {
      const ua  = codeAns.toLowerCase().replace(/\s+/g,' ').trim();
      const ans = q.answer.toLowerCase().replace(/\s+/g,' ').trim();
      isCorrect = ua.includes(ans.slice(0,20)) || ans.includes(ua.slice(0,20));
    }
    setAnswers(a => [...a, {type:q.type,q:q.q,selected:selected||codeAns,correct:q.answer,isCorrect,skipped:false}]);
    if (isCorrect) setScore(s=>s+1);
    setSubmitted(true);
  };

  const handleSkip = () => {
    const q = questions[current];
    setAnswers(a => [...a, {type:q.type,q:q.q,selected:'—',correct:q.answer,isCorrect:false,skipped:true}]);
    setSkipped(true); setSubmitted(true);
  };

  const handleNext = async () => {
    if (current + 1 >= questions.length) {
      const finalAnswers = [...answers];
      const finalScore   = finalAnswers.filter(a=>a.isCorrect).length;
      const result = {
        date:       today,
        day:        todayInfo?.dayNum || totalDays+1,
        topic:      todayInfo?.topic  || '',
        level:      todayInfo?.level  || '',
        score:      finalScore,
        total:      questions.length,
        skipped:    finalAnswers.filter(a=>a.skipped).length,
        pct:        Math.round((finalScore/questions.length)*100),
        isRevision: todayInfo?.isRevision || false,
      };

      // Save to Firestore
      await saveDay(uid, result);
      const updated = await getAllDays(uid);
      setResults(updated);
      computeTodayInfo(updated, { startDate: localStorage.getItem(`streak_start_${uid}`)?.slice(0,10) || today });

      // Day 30 → auto PDF + reset Firestore
      if (updated.length >= 30) {
        setTimeout(async () => {
          makePDF(user?.displayName || user?.email, updated);
          // Reset after 2s delay
          setTimeout(async () => {
            await resetStreak(uid);
            // clear local prev questions
            CURRICULUM.forEach(c => {
              localStorage.removeItem(`pq_${uid}_${c.topic.replace(/\s/g,'_')}`);
            });
            window.showToast?.('🎉 30 days complete! New cycle started!', 'success');
            const fresh = await getAllDays(uid);
            setResults(fresh);
          }, 2000);
        }, 1000);
      }

      setScreen('result');
    } else {
      setCurrent(c=>c+1);
      setSelected(null); setCodeAns(''); setSubmitted(false); setSkipped(false);
    }
  };

  // ════════════ LOADING INIT ════════════
  if (loading) return (
    <div style={{minHeight:'100vh',background:pageBg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Syne',sans-serif",flexDirection:'column',gap:'14px'}}>
      <div style={{fontSize:'2.5rem',animation:'spin 1.5s linear infinite'}}>🔥</div>
      <div style={{color:isDark?'#f0f2ff':'#111827',fontWeight:'700'}}>Loading your progress...</div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ════════════ HOME ════════════
  if (screen === 'home') return wrap(
    <>
      <div style={{textAlign:'center',marginBottom:'24px'}}>
        <div style={{fontSize:'2.5rem',marginBottom:'8px'}}>🔥</div>
        <h1 style={{fontSize:mobile?'1.5rem':'2rem',fontWeight:'900',margin:'0 0 4px',background:'linear-gradient(135deg,#ff6b00,#6366f1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          Daily Python Practice
        </h1>
        <p style={{color:textSec,fontSize:'0.85rem',margin:0}}>Fully automatic • AI picks your topic • Results saved to cloud</p>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'18px'}}>
        {[
          {label:'Day',      value:`${todayInfo?.dayNum||1}/30`, color:'#ff6b00'},
          {label:'Sessions', value:totalDays,                    color:'#6366f1'},
          {label:'Avg Score',value:totalDays?`${avgScore}%`:'—', color:'#22c55e'},
        ].map((s,i)=>(
          <div key={i} style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'14px',padding:'14px 10px',textAlign:'center'}}>
            <div style={{fontSize:'1.5rem',fontWeight:'900',color:s.color}}>{s.value}</div>
            <div style={{fontSize:'0.68rem',color:textSec,marginTop:'2px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today's topic */}
      {todayInfo && (
        <div style={{background:isDark?'linear-gradient(135deg,rgba(255,107,0,0.12),rgba(99,102,241,0.08))':'linear-gradient(135deg,rgba(255,107,0,0.07),rgba(99,102,241,0.05))',border:`1px solid ${isDark?'rgba(255,107,0,0.25)':'rgba(255,107,0,0.2)'}`,borderRadius:'18px',padding:'18px',marginBottom:'16px'}}>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'10px'}}>
            <span style={{background:'rgba(255,107,0,0.15)',border:'1px solid rgba(255,107,0,0.3)',color:'#ff6b00',padding:'3px 12px',borderRadius:'20px',fontSize:'0.7rem',fontWeight:'800'}}>📅 Day {todayInfo.dayNum}</span>
            <span style={{background:isDark?'rgba(255,255,255,0.06)':'#f1f5f9',color:textSec,padding:'3px 12px',borderRadius:'20px',fontSize:'0.7rem',fontWeight:'700'}}>{todayInfo.level}</span>
            {todayInfo.isRevision && <span style={{background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',color:'#ef4444',padding:'3px 12px',borderRadius:'20px',fontSize:'0.7rem',fontWeight:'800'}}>🔁 Revision</span>}
          </div>
          <div style={{fontWeight:'900',fontSize:mobile?'1rem':'1.1rem',marginBottom:'4px'}}>Today: {todayInfo.topic}</div>
          <div style={{fontSize:'0.76rem',color:textSec}}>10 questions • MCQ + Code + Output + Debug + Fill in Blank</div>
        </div>
      )}

      {/* CTA or Lock */}
      {alreadyDoneToday && !isAdmin ? (
        <div style={{background:isDark?'rgba(255,107,0,0.08)':'rgba(255,107,0,0.05)',border:'2px solid rgba(255,107,0,0.2)',borderRadius:'18px',padding:'22px',textAlign:'center',marginBottom:'16px'}}>
          <div style={{fontSize:'2rem',marginBottom:'8px'}}>✅</div>
          <div style={{fontWeight:'900',fontSize:'1rem',marginBottom:'6px'}}>Practice done for today!</div>
          <div style={{color:textSec,fontSize:'0.82rem',marginBottom:'14px'}}>Come back tomorrow for Day {(todayInfo?.dayNum||1)+1}</div>
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:isDark?'rgba(0,0,0,0.2)':'rgba(0,0,0,0.05)',borderRadius:'12px',padding:'10px 18px'}}>
            <span style={{fontSize:'1.1rem'}}>🔒</span>
            <span style={{fontFamily:'"Fira Code",monospace',fontSize:'1.1rem',fontWeight:'900',color:'#ff6b00',letterSpacing:'2px'}}>{countdown}</span>
          </div>
        </div>
      ) : (
        <button onClick={startPractice} style={{width:'100%',padding:'16px',background:'linear-gradient(135deg,#ff6b00,#ff3d00)',color:'#fff',border:'none',borderRadius:'14px',fontSize:'1.05rem',fontWeight:'800',cursor:'pointer',boxShadow:'0 10px 28px rgba(255,107,0,0.4)',marginBottom:'16px'}}
          onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
          onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
        >🚀 Start Today's Practice</button>
      )}

      {/* PDF */}
      {totalDays >= 30 ? (
        <button onClick={() => makePDF(user?.displayName||user?.email, results)} style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',border:'none',borderRadius:'14px',fontSize:'0.95rem',fontWeight:'800',cursor:'pointer',boxShadow:'0 8px 20px rgba(34,197,94,0.4)',marginBottom:'16px'}}>
          🎉 Download Your 30-Day PDF Report
        </button>
      ) : (
        <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'14px',padding:'14px 16px',marginBottom:'16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
            <span style={{fontWeight:'700',fontSize:'0.88rem'}}>📄 PDF Report</span>
            <span style={{fontSize:'0.78rem',color:'#ff6b00',fontWeight:'800'}}>{totalDays}/30 days</span>
          </div>
          <div style={{height:'6px',background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb',borderRadius:'10px',overflow:'hidden',marginBottom:'6px'}}>
            <div style={{height:'100%',width:`${Math.min((totalDays/30)*100,100)}%`,background:'linear-gradient(90deg,#ff6b00,#f59e0b)',borderRadius:'10px',transition:'width 0.6s'}}/>
          </div>
          <div style={{fontSize:'0.72rem',color:textSec}}>{30-totalDays} more days to unlock • Auto-downloads on Day 30 • Saved to cloud ☁️</div>
        </div>
      )}

      {/* Admin */}
      {isAdmin && (
        <button onClick={() => makePDF(user?.displayName||user?.email, results)} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',borderRadius:'14px',fontSize:'0.9rem',fontWeight:'800',cursor:'pointer',boxShadow:'0 6px 16px rgba(99,102,241,0.4)',marginBottom:'16px'}}>
          🛡️ Admin — Download PDF Anytime
        </button>
      )}

      {/* Recent sessions */}
      {results.length > 0 && (
        <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'16px',overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${border}`,fontWeight:'800',fontSize:'0.88rem'}}>📅 Recent Sessions</div>
          {results.slice(-5).reverse().map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderBottom:i<4?`1px solid ${border}`:'none'}}>
              <div>
                <div style={{fontWeight:'700',fontSize:'0.82rem'}}>{r.topic}</div>
                <div style={{fontSize:'0.68rem',color:textSec,marginTop:'2px'}}>{r.level} • {r.date}{r.isRevision?' • 🔁':''}</div>
              </div>
              <span style={{fontWeight:'800',fontSize:'0.85rem',color:r.pct>=70?'#22c55e':r.pct>=50?'#f59e0b':'#ef4444'}}>
                {r.score}/{r.total} ({r.pct}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ════════════ LOADING QUIZ ════════════
  if (screen === 'loading') return (
    <div style={{minHeight:'100vh',background:pageBg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'Syne',sans-serif",gap:'14px',padding:'24px',textAlign:'center'}}>
      <div style={{fontSize:'3rem',animation:'spin 1.5s linear infinite'}}>🤖</div>
      <div style={{fontWeight:'800',fontSize:'1.05rem',color:textPrimary}}>Claude AI is generating your questions...</div>
      <div style={{color:textSec,fontSize:'0.82rem'}}>{todayInfo?.level} • {todayInfo?.topic}</div>
      <div style={{display:'flex',gap:'6px',marginTop:'4px'}}>
        {[0,1,2].map(i=><div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:'#ff6b00',animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
    </div>
  );

  // ════════════ QUIZ ════════════
  if (screen === 'quiz' && questions.length > 0) {
    const q     = questions[current];
    const isMCQ = q.type === 'MCQ' || q.type === 'OUTPUT';
    const ts    = TS[q.type] || TS.MCQ;
    const can   = isMCQ ? !!selected : !!codeAns.trim();

    return (
      <div style={{minHeight:'100vh',background:pageBg,fontFamily:"'Syne',sans-serif",color:textPrimary,paddingTop:mobile?'80px':'100px',paddingBottom:'40px',paddingLeft:mobile?'14px':'24px',paddingRight:mobile?'14px':'24px',boxSizing:'border-box'}}>
        <div style={{maxWidth:'700px',margin:'0 auto'}}>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px',gap:'8px'}}>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
              <span style={{background:ts.bg,border:`1px solid ${ts.border}`,color:ts.color,padding:'3px 10px',borderRadius:'20px',fontSize:'0.68rem',fontWeight:'800'}}>{ts.label}</span>
              <span style={{background:isDark?'rgba(255,255,255,0.05)':'#f1f5f9',color:textSec,padding:'3px 10px',borderRadius:'20px',fontSize:'0.65rem',fontWeight:'600'}}>Day {todayInfo?.dayNum} • {todayInfo?.topic}</span>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontWeight:'800',fontSize:'0.9rem'}}>{current+1}/{questions.length}</div>
              <div style={{fontSize:'0.68rem',color:textSec}}>Score: {score}</div>
            </div>
          </div>

          <div style={{height:'5px',background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb',borderRadius:'10px',marginBottom:'14px',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(current/questions.length)*100}%`,background:'linear-gradient(90deg,#ff6b00,#f59e0b)',borderRadius:'10px',transition:'width 0.4s'}}/>
          </div>

          <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'20px',padding:mobile?'18px 16px':'24px',marginBottom:'12px',boxShadow:'0 6px 20px rgba(0,0,0,0.06)'}}>
            <p style={{fontSize:mobile?'0.95rem':'1.05rem',fontWeight:'700',lineHeight:'1.65',margin:'0 0 14px'}}>{q.q}</p>

            {q.code && (
              <div style={{background:'#1e1e2e',borderRadius:'12px',padding:'14px',marginBottom:'14px',fontFamily:'"Fira Code","Consolas",monospace',fontSize:mobile?'0.78rem':'0.86rem',color:'#d4d4d4',lineHeight:'1.6',overflowX:'auto',whiteSpace:'pre'}}>{q.code}</div>
            )}

            {isMCQ && q.options && (
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {q.options.map((opt,i)=>{
                  let bg=isDark?'rgba(255,255,255,0.04)':'#f9fafb', bc=isDark?'rgba(255,255,255,0.08)':'#e5e7eb', color=textPrimary;
                  if(submitted){
                    if(opt===q.answer){bg='rgba(34,197,94,0.15)';bc='#22c55e';color='#22c55e';}
                    else if(opt===selected){bg='rgba(239,68,68,0.1)';bc='#ef4444';color='#ef4444';}
                  } else if(selected===opt){bg='rgba(255,107,0,0.12)';bc='#ff6b00';color='#ff6b00';}
                  return(
                    <div key={i} onClick={()=>!submitted&&setSelected(opt)} style={{background:bg,border:`2px solid ${bc}`,borderRadius:'12px',padding:mobile?'11px 13px':'12px 15px',cursor:submitted?'default':'pointer',color,fontWeight:submitted&&opt===q.answer?'700':'500',transition:'all 0.15s',fontSize:mobile?'0.85rem':'0.9rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span>{opt}</span>
                      {submitted&&opt===q.answer&&<span>✅</span>}
                      {submitted&&opt===selected&&opt!==q.answer&&<span>❌</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {!isMCQ && (
              <>
                <div style={{fontSize:'0.72rem',color:textSec,marginBottom:'6px',fontWeight:'600'}}>
                  {q.type==='CODE'&&'✏️ Write your Python code:'}{q.type==='FILL'&&'✏️ Fill in the blank:'}{q.type==='DEBUG'&&'✏️ Describe the bug and fix:'}{q.type==='THEORY'&&'✏️ Your answer:'}
                </div>
                <textarea value={codeAns} onChange={e=>!submitted&&setCodeAns(e.target.value)} readOnly={submitted}
                  placeholder={q.type==='CODE'?'def solution():\n    pass':q.type==='FILL'?'Type missing word...':'Write your answer...'}
                  rows={q.type==='CODE'?6:3}
                  style={{width:'100%',boxSizing:'border-box',background:submitted?(isDark?'rgba(255,255,255,0.03)':'#f9fafb'):(isDark?'#1e1e2e':'#f9fafb'),border:`2px solid ${submitted?'#f59e0b':codeAns?'#ff6b00':(isDark?'rgba(255,255,255,0.1)':'#e5e7eb')}`,borderRadius:'12px',padding:'12px',fontFamily:q.type==='CODE'?'"Fira Code",monospace':"'Syne',sans-serif",fontSize:mobile?'0.82rem':'0.86rem',lineHeight:'1.6',color:isDark?'#d4d4d4':'#111827',resize:'vertical',outline:'none'}}/>
                {submitted&&(
                  <div style={{marginTop:'10px',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:'10px',padding:'10px 12px'}}>
                    <div style={{fontSize:'0.68rem',color:'#22c55e',fontWeight:'800',marginBottom:'3px'}}>✅ CORRECT ANSWER</div>
                    <div style={{fontFamily:q.type==='CODE'?'"Fira Code",monospace':'inherit',fontSize:'0.82rem',color:isDark?'#d4d4d4':'#111827',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{q.answer}</div>
                  </div>
                )}
              </>
            )}

            {submitted&&skipped&&(
              <div style={{marginTop:'12px',background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'10px',padding:'10px 12px'}}>
                <div style={{fontSize:'0.68rem',color:'#f59e0b',fontWeight:'800',marginBottom:'3px'}}>⏭️ SKIPPED</div>
                <div style={{fontSize:'0.82rem',color:textSec}}>Correct: <strong style={{color:isDark?'#d4d4d4':'#111827'}}>{q.answer}</strong></div>
              </div>
            )}
            {submitted&&!skipped&&(
              <div style={{marginTop:'12px',background:isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:'10px',padding:'10px 12px'}}>
                <div style={{fontSize:'0.68rem',color:'#6366f1',fontWeight:'800',marginBottom:'3px'}}>💡 EXPLANATION</div>
                <div style={{fontSize:'0.82rem',color:textSec,lineHeight:'1.5'}}>{q.explanation}</div>
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:'10px'}}>
            {!submitted ? (
              <>
                <button onClick={handleSkip} style={{padding:mobile?'13px 14px':'14px 18px',background:'transparent',border:`1px solid ${border}`,borderRadius:'12px',color:textSec,fontSize:'0.85rem',fontWeight:'700',cursor:'pointer',flexShrink:0}}>⏭️ Skip</button>
                <button onClick={handleSubmit} disabled={!can} style={{flex:1,padding:'13px',background:can?'linear-gradient(135deg,#ff6b00,#ff3d00)':(isDark?'#1f2937':'#e5e7eb'),color:can?'#fff':textSec,border:'none',borderRadius:'12px',fontSize:'0.95rem',fontWeight:'800',cursor:can?'pointer':'not-allowed'}}>Submit Answer</button>
              </>
            ) : (
              <button onClick={handleNext} style={{flex:1,padding:'13px',background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'0.95rem',fontWeight:'800',cursor:'pointer',boxShadow:'0 6px 20px rgba(99,102,241,0.4)'}}>
                {current+1>=questions.length?'🏁 See Results':'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════ RESULT ════════════
  if (screen === 'result') {
    const todayRes = results.find(r=>r.date===today) || {score:0,total:10,pct:0,skipped:0};
    const pct      = todayRes.pct;
    const emoji    = pct>=80?'🏆':pct>=60?'👍':pct>=40?'💪':'📚';
    const msg      = pct>=80?'Outstanding!':pct>=60?'Good job!':pct>=40?'Keep going!':'Review this topic!';
    const doneAll  = results.length >= 30;

    return wrap(
      <>
        <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'24px',padding:mobile?'28px 20px':'36px',textAlign:'center',marginBottom:'16px',boxShadow:'0 16px 40px rgba(0,0,0,0.08)'}}>
          <div style={{fontSize:'3.5rem',marginBottom:'8px'}}>{emoji}</div>
          <h2 style={{fontSize:mobile?'1.3rem':'1.7rem',fontWeight:'900',margin:'0 0 4px'}}>{msg}</h2>
          <p style={{color:textSec,fontSize:'0.82rem',margin:'0 0 16px'}}>Day {todayInfo?.dayNum} • {todayInfo?.topic}</p>
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:isDark?'rgba(255,107,0,0.12)':'rgba(255,107,0,0.08)',border:'2px solid rgba(255,107,0,0.25)',borderRadius:'20px',padding:'12px 24px',marginBottom:'14px'}}>
            <span style={{fontSize:mobile?'2.5rem':'3rem',fontWeight:'900',background:'linear-gradient(135deg,#ff6b00,#f59e0b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{todayRes.score}/{todayRes.total}</span>
            <span style={{fontSize:'1rem',color:textSec,fontWeight:'700'}}>({pct}%)</span>
          </div>
          {todayRes.skipped>0&&<div style={{fontSize:'0.76rem',color:'#f59e0b',marginBottom:'8px'}}>⏭️ {todayRes.skipped} skipped</div>}
          <div style={{background:isDark?'rgba(0,0,0,0.2)':'rgba(0,0,0,0.04)',borderRadius:'12px',padding:'12px 16px',marginTop:'8px'}}>
            {doneAll ? (
              <div style={{fontWeight:'700',fontSize:'0.88rem',color:'#22c55e'}}>🎉 All 30 days done! PDF downloading + fresh cycle starting...</div>
            ) : (
              <>
                <div style={{fontWeight:'700',fontSize:'0.85rem',marginBottom:'4px'}}>🔒 Next practice in <span style={{color:'#ff6b00'}}>{countdown}</span></div>
                <div style={{fontSize:'0.72rem',color:textSec}}>Tomorrow: Day {(todayInfo?.dayNum||1)+1} — {CURRICULUM[Math.min(todayInfo?.dayNum||1, 29)]?.topic}</div>
              </>
            )}
          </div>
        </div>

        {!doneAll && (
          <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'14px',padding:'14px 16px',marginBottom:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
              <span style={{fontWeight:'700',fontSize:'0.85rem'}}>📄 PDF Progress</span>
              <span style={{fontSize:'0.78rem',color:'#ff6b00',fontWeight:'800'}}>{results.length}/30</span>
            </div>
            <div style={{height:'6px',background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb',borderRadius:'10px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${(results.length/30)*100}%`,background:'linear-gradient(90deg,#ff6b00,#f59e0b)',borderRadius:'10px',transition:'width 0.6s'}}/>
            </div>
            <div style={{fontSize:'0.7rem',color:textSec,marginTop:'5px'}}>{30-results.length} more days → PDF auto-downloads on Day 30 ☁️</div>
          </div>
        )}

        {doneAll && (
          <button onClick={()=>makePDF(user?.displayName||user?.email, results)} style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',border:'none',borderRadius:'14px',fontSize:'0.95rem',fontWeight:'800',cursor:'pointer',boxShadow:'0 8px 20px rgba(34,197,94,0.4)',marginBottom:'14px'}}>
            📥 Download Your 30-Day PDF Report
          </button>
        )}

        <button onClick={()=>setCurrentPage('streak')} style={{width:'100%',padding:'13px',background:'transparent',color:textSec,border:`1px solid ${border}`,borderRadius:'12px',fontSize:'0.88rem',fontWeight:'700',cursor:'pointer'}}>
          ← Back to Streak
        </button>
      </>
    );
  }
  return null;
};

export default DailyPractice;