import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import { saveDay, getAllDays, resetStreak, getStreakUser, createStreakUser } from '../streakService';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const WORKER_URL  = 'https://white-limit-e2fe.luckyfaizu3.workers.dev/chat';
const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

// ═══════════════════════════════════════════════════════════════
// 30-DAY CURRICULUM
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// AI CALL — streaming
// ═══════════════════════════════════════════════════════════════
const callAI = async (prompt, maxTokens = 3000) => {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
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

// ═══════════════════════════════════════════════════════════════
// GENERATE TOPIC CONTENT (theory + questions)
// ═══════════════════════════════════════════════════════════════
const generateTopicContent = async (topic, level) => {
  const prompt = `You are a Python teacher. Generate complete learning content for topic: "${topic}" (Level: ${level}).

Return ONLY valid JSON, no extra text:

{
  "theory": "Complete explanation of ${topic} in simple nursery-class style. Start from absolute basics. Use simple words. Include what it is, why we use it, how it works. Minimum 300 words. Use \\n for new lines.",
  "codeExamples": [
    {"title": "Example title", "code": "# Python code here\\nprint('hello')", "output": "hello", "explanation": "What this code does in simple words"}
  ],
  "questions": [
    {"type":"MCQ",    "q":"Question text?",           "options":["A) opt1","B) opt2","C) opt3","D) opt4"], "answer":"A) opt1",       "explanation":"Simple baby explanation why this is correct"},
    {"type":"OUTPUT", "q":"What will this print?",    "code":"x=5\\nprint(x+3)",                          "options":["A) 8","B) 53","C) Error","D) None"], "answer":"A) 8", "explanation":"x is 5, 5+3=8, so it prints 8"},
    {"type":"CODE",   "q":"Write a function to...",   "answer":"def solution():\\n    pass",              "explanation":"Step by step how to write this"},
    {"type":"FILL",   "q":"Complete: x = ____",       "answer":"correct value",                           "explanation":"Why this is the answer"},
    {"type":"DEBUG",  "q":"Find the bug:",             "code":"def f(x)\\n  return x",                    "answer":"Missing colon: def f(x):", "explanation":"In Python, colon is required after def"}
  ]
}

CRITICAL JSON RULES:
- Return ONLY valid JSON — no text outside the JSON object
- In "theory" field: use literal text, NO actual newline characters
- In "code" fields: use \\n for line breaks (double backslash n)
- NO special control characters inside any string
- Generate exactly 30 questions total
- Mix: 10 MCQ + 6 OUTPUT + 6 CODE + 4 FILL + 4 DEBUG
- All explanations super simple like explaining to a 10-year-old
- theory: detailed beginner-friendly text in ONE continuous string
- codeExamples: at least 3 examples
- questions array: exactly 30 items`;

  const raw = await callAI(prompt, 4000);

  // Clean bad control characters before parsing
  const cleanJSON = (str) => {
    // Extract JSON object
    const match = str.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    return match[0]
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // remove bad control chars
      .replace(/\n/g, '\\n')                              // escape newlines inside strings
      .replace(/\r/g, '\\r')                              // escape carriage returns
      .replace(/\t/g, '\\t');                             // escape tabs
  };

  try {
    const cleaned = cleanJSON(raw);
    return JSON.parse(cleaned);
  } catch(e1) {
    // Try extracting with more aggressive cleaning
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON');
      // Replace actual newlines inside JSON string values
      let fixed = match[0];
      fixed = fixed.replace(/([":,[{]\s*")([^"]*?)"/gs, (m, pre, val) => {
        return pre + val.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"';
      });
      return JSON.parse(fixed);
    } catch(e2) {
      throw new Error('JSON parse failed: ' + e1.message);
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// FIREBASE CACHE — get/save topic content
// ═══════════════════════════════════════════════════════════════
const getTopicFromFirebase = async (dayNum) => {
  try {
    const ref = doc(db, 'dailyPracticeContent', `day_${dayNum}`);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    return null;
  } catch { return null; }
};

const saveTopicToFirebase = async (dayNum, content, topic, level) => {
  try {
    const ref = doc(db, 'dailyPracticeContent', `day_${dayNum}`);
    await setDoc(ref, {
      ...content,
      topic,
      level,
      dayNum,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) { console.error('Save failed:', e); }
};

// ═══════════════════════════════════════════════════════════════
// WRONG ANSWER EXPLANATION — baby style
// ═══════════════════════════════════════════════════════════════
const getWrongAnswerExplanation = async (question, userAnswer, correctAnswer, topic) => {
  const prompt = `A student got this Python question wrong. Explain in the simplest possible way — like talking to a 10-year-old child.

Topic: ${topic}
Question: ${question}
Student answered: ${userAnswer}
Correct answer: ${correctAnswer}

Explain:
1. Why their answer was wrong (in 1-2 simple sentences)
2. Why the correct answer is right (in 2-3 simple sentences)
3. A simple tip to remember this forever

Use very simple words. No jargon. Be encouraging and kind. Maximum 100 words.`;

  try {
    const explanation = await callAI(prompt, 300);
    return explanation.trim();
  } catch {
    return `The correct answer is: ${correctAnswer}. Don't worry, keep practicing! 😊`;
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// PDF GENERATOR
// ═══════════════════════════════════════════════════════════════
const makePDF = (userName, results) => {
  const doc   = new jsPDF();
  const OR    = [255, 107, 0];
  const DARK  = [17, 24, 39];
  const GRAY  = [107, 114, 128];
  const GREEN = [34, 197, 94];
  const RED   = [239, 68, 68];
  const AMB   = [245, 158, 11];

  // Cover page
  doc.setFillColor(...OR);
  doc.rect(0, 0, 210, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('PySkill — 30-Day Python Mastery Report', 15, 22);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text(`Student: ${userName || 'Student'}`, 15, 34);
  doc.text(`Completed: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}`, 15, 42);
  doc.text(`faizupyzone.shop`, 15, 50);

  // Overall stats
  const totalQ  = results.reduce((a, r) => a + (r.total || 0), 0);
  const correct = results.reduce((a, r) => a + (r.score || 0), 0);
  const pct     = totalQ ? Math.round((correct / totalQ) * 100) : 0;

  doc.setTextColor(...DARK); doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  doc.text('Overall Performance', 15, 78);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
  doc.text(`Days Completed: ${results.length} / 30`, 15, 90);
  doc.text(`Total Questions Attempted: ${totalQ}`, 15, 98);
  doc.text(`Correct Answers: ${correct}`, 15, 106);
  doc.text(`Overall Score: ${pct}%`, 15, 114);

  // Progress bar
  doc.setFillColor(229, 231, 235); doc.rect(15, 120, 180, 8, 'F');
  doc.setFillColor(...(pct >= 70 ? GREEN : pct >= 50 ? AMB : OR));
  doc.rect(15, 120, (180 * pct) / 100, 8, 'F');
  doc.setTextColor(...DARK); doc.setFontSize(9);
  doc.text(`${pct}%`, 200, 126, { align: 'right' });

  // Performance badge
  const badge = pct >= 80 ? '🏆 Outstanding' : pct >= 60 ? '👍 Good Job' : pct >= 40 ? '💪 Keep Going' : '📚 Needs More Practice';
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...OR);
  doc.text(badge, 15, 142);

  // Topic analysis
  const topicMap = {};
  results.forEach(r => {
    if (!topicMap[r.topic]) topicMap[r.topic] = { score: 0, total: 0 };
    topicMap[r.topic].score += r.score || 0;
    topicMap[r.topic].total += r.total || 0;
  });
  const strong = Object.entries(topicMap).filter(([, v]) => v.total && v.score / v.total >= 0.7).map(([k]) => k);
  const medium = Object.entries(topicMap).filter(([, v]) => v.total && v.score / v.total >= 0.5 && v.score / v.total < 0.7).map(([k]) => k);
  const weak   = Object.entries(topicMap).filter(([, v]) => v.total && v.score / v.total < 0.5).map(([k]) => k);

  let y = 158;
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
  doc.text('Topic Analysis', 15, y); y += 12;

  const section = (title, list, color) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...color);
    doc.text(title, 15, y); y += 8;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    if (list.length) {
      list.forEach(t => {
        if (y > 270) { doc.addPage(); y = 20; }
        const tp  = topicMap[t];
        const p   = Math.round((tp.score / tp.total) * 100);
        doc.setTextColor(...color); doc.text(`  • ${t}`, 15, y);
        doc.setTextColor(...GRAY);  doc.text(`${tp.score}/${tp.total} (${p}%)`, 160, y);
        y += 7;
      });
    } else {
      doc.setTextColor(...GRAY); doc.text('  None', 15, y); y += 7;
    }
    y += 6;
  };

  section('STRONG  (≥ 70%)', strong, GREEN);
  section('AVERAGE (50–69%)', medium, AMB);
  section('NEEDS REVISION  (< 50%)', weak, RED);

  // Recommendations
  if (weak.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text('Recommendations', 15, y); y += 10;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
    weak.forEach(t => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`  → Revise "${t}" — practice more exercises on this topic.`, 15, y); y += 7;
    });
  }

  // Day-wise table
  doc.addPage();
  doc.setFillColor(...OR); doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('Day-wise Performance', 15, 14);

  y = 30;
  const xPos = [15, 28, 60, 120, 152, 172];
  doc.setFontSize(9); doc.setFillColor(...OR); doc.rect(15, y - 6, 180, 9, 'F');
  doc.setTextColor(255, 255, 255);
  ['Day', 'Date', 'Topic', 'Level', 'Score', 'Pct'].forEach((h, i) => doc.text(h, xPos[i], y));
  y += 6;

  results.forEach((r, i) => {
    if (y > 272) { doc.addPage(); y = 20; }
    const p = r.total ? Math.round((r.score / r.total) * 100) : 0;
    doc.setFillColor(...(i % 2 === 0 ? [249, 250, 251] : [255, 255, 255]));
    doc.rect(15, y - 5, 180, 9, 'F');
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'normal');
    doc.text(`${r.day || i + 1}`,                xPos[0], y);
    doc.text(r.date || '',                        xPos[1], y);
    doc.text((r.topic || '').substring(0, 24),   xPos[2], y);
    doc.text((r.level || '').substring(0, 10),   xPos[3], y);
    doc.text(`${r.score || 0}/${r.total || 0}`,  xPos[4], y);
    doc.setTextColor(...(p >= 70 ? GREEN : p >= 50 ? AMB : RED));
    doc.text(`${p}%`, xPos[5], y);
    y += 9;
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setTextColor(...GRAY); doc.setFontSize(8);
    doc.text('Generated by PySkill — faizupyzone.shop', 105, 290, { align: 'center' });
    doc.text(`Page ${p} of ${pages}`, 190, 290, { align: 'right' });
  }

  doc.save(`PySkill_30Day_${userName || 'Student'}_${todayStr()}.pdf`);
};

// ═══════════════════════════════════════════════════════════════
// TYPE STYLES
// ═══════════════════════════════════════════════════════════════
const TS = {
  MCQ:    { bg:'rgba(99,102,241,0.12)',  border:'rgba(99,102,241,0.3)',  color:'#6366f1', label:'🔵 Multiple Choice' },
  OUTPUT: { bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)', color:'#10b981', label:'🟢 Guess Output'    },
  CODE:   { bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.3)', color:'#f59e0b', label:'🟡 Write Code'      },
  FILL:   { bg:'rgba(236,72,153,0.12)', border:'rgba(236,72,153,0.3)', color:'#ec4899', label:'🩷 Fill Blank'       },
  DEBUG:  { bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.3)',  color:'#ef4444', label:'🔴 Debug Code'      },
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const DailyPractice = ({ isDark, user, setCurrentPage }) => {
  const uid     = user?.uid;
  const isAdmin = user?.email === ADMIN_EMAIL;
  const today   = todayStr();

  // Screens: home | loading | theory | quiz | result
  const [screen,       setScreen]       = useState('home');
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [todayInfo,    setTodayInfo]    = useState(null);
  const [countdown,    setCountdown]    = useState('');

  // Content
  const [topicContent, setTopicContent] = useState(null); // { theory, codeExamples, questions }

  // Quiz state
  const [questions,    setQuestions]    = useState([]);
  const [current,      setCurrent]      = useState(0);
  const [selected,     setSelected]     = useState(null);
  const [codeAns,      setCodeAns]      = useState('');
  const [submitted,    setSubmitted]    = useState(false);
  const [skipped,      setSkipped]      = useState(false);
  const [score,        setScore]        = useState(0);
  const [answers,      setAnswers]      = useState([]);
  const [wrongExplain, setWrongExplain] = useState('');
  const [loadingExpl,  setLoadingExpl]  = useState(false);
  const [mobile,       setMobile]       = useState(window.innerWidth <= 768);
  const [theoryPage,   setTheoryPage]   = useState(0); // for theory pagination

  // ── Init ──────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!uid) { setCurrentPage('login'); return; }
    init();
    const h = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []); // eslint-disable-line

  // Countdown
  useEffect(() => {
    const tick = () => setCountdown(formatCountdown());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line

  const init = async () => {
    setLoading(true);
    try {
      const streakUser = await getStreakUser(uid);
      if (!isAdmin && !streakUser?.purchased && !localStorage.getItem(`streak_purchased_${uid}`)) {
        setCurrentPage('streak');
        return;
      }
      if (!streakUser) await createStreakUser(uid, user.email, user.displayName);
      const days = await getAllDays(uid);
      setResults(days);
      computeTodayInfo(days, streakUser);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const computeTodayInfo = (res, streakUser) => {
    const startDate = streakUser?.startDate || today;
    const dayNum    = Math.min(
      Math.floor((new Date(today) - new Date(startDate)) / 86400000) + 1,
      30
    );
    const assigned = CURRICULUM[Math.min(dayNum - 1, 29)];
    setTodayInfo({ ...assigned, dayNum });
  };

  // ── Load content (Firebase first, then AI) ────────────────────
  const loadContent = useCallback(async () => {
    if (!todayInfo) return;
    setScreen('loading');
    try {
      let content = null;

      if (isAdmin) {
        // ✅ Admin: always generate fresh from AI — never save to Firebase
        content = await generateTopicContent(todayInfo.topic, todayInfo.level);
      } else {
        // ✅ Normal user: try Firebase cache first
        content = await getTopicFromFirebase(todayInfo.dayNum);

        if (!content || !content.questions || content.questions.length < 10) {
          // Not cached — generate with AI and save for all future users
          content = await generateTopicContent(todayInfo.topic, todayInfo.level);
          await saveTopicToFirebase(todayInfo.dayNum, content, todayInfo.topic, todayInfo.level);
        }
      }

      setTopicContent(content);
      setQuestions(content.questions || []);
      setTheoryPage(0);
      setScreen('theory');
    } catch (e) {
      console.error(e);
      window.showToast?.('Failed to load content. Try again!', 'error');
      setScreen('home');
    }
  }, [todayInfo, isAdmin]);

  // ── Quiz handlers ─────────────────────────────────────────────
  const startQuiz = () => {
    setCurrent(0); setSelected(null); setCodeAns('');
    setSubmitted(false); setSkipped(false);
    setScore(0); setAnswers([]); setWrongExplain('');
    setScreen('quiz');
  };

  const handleSubmit = async () => {
    const q     = questions[current];
    const isMCQ = q.type === 'MCQ' || q.type === 'OUTPUT';
    if (isMCQ && !selected) return;
    if (!isMCQ && !codeAns.trim()) return;

    let isCorrect = false;
    const userAns = isMCQ ? selected : codeAns;

    if (isMCQ) {
      isCorrect = selected === q.answer;
    } else {
      const ua  = codeAns.toLowerCase().replace(/\s+/g, ' ').trim();
      const ans = (q.answer || '').toLowerCase().replace(/\s+/g, ' ').trim();
      isCorrect = ua.includes(ans.slice(0, 20)) || ans.includes(ua.slice(0, 20));
    }

    setAnswers(a => [...a, { type:q.type, q:q.q, selected:userAns, correct:q.answer, isCorrect, skipped:false }]);
    if (isCorrect) setScore(s => s + 1);
    setSubmitted(true);

    // If wrong — get baby explanation from AI
    if (!isCorrect) {
      setLoadingExpl(true);
      setWrongExplain('');
      try {
        const expl = await getWrongAnswerExplanation(q.q, userAns, q.answer, todayInfo?.topic || '');
        setWrongExplain(expl);
      } catch { setWrongExplain(q.explanation || `Correct answer: ${q.answer}`); }
      setLoadingExpl(false);
    } else {
      setWrongExplain('');
    }
  };

  const handleSkip = () => {
    const q = questions[current];
    setAnswers(a => [...a, { type:q.type, q:q.q, selected:'—', correct:q.answer, isCorrect:false, skipped:true }]);
    setSkipped(true); setSubmitted(true); setWrongExplain('');
  };

  const handleNext = async () => {
    if (current + 1 >= questions.length) {
      // Save result
      const finalAnswers = [...answers];
      const finalScore   = finalAnswers.filter(a => a.isCorrect).length;
      const result = {
        date:    today,
        day:     todayInfo?.dayNum || results.length + 1,
        topic:   todayInfo?.topic  || '',
        level:   todayInfo?.level  || '',
        score:   finalScore,
        total:   questions.length,
        skipped: finalAnswers.filter(a => a.skipped).length,
        pct:     Math.round((finalScore / questions.length) * 100),
      };
      await saveDay(uid, result);
      const updated = await getAllDays(uid);
      setResults(updated);
      computeTodayInfo(updated, { startDate: localStorage.getItem(`streak_start_${uid}`)?.slice(0, 10) || today });

      // Day 30 → PDF + reset
      if (updated.length >= 30) {
        setTimeout(async () => {
          makePDF(user?.displayName || user?.email, updated);
          setTimeout(async () => {
            await resetStreak(uid);
            CURRICULUM.forEach(c => localStorage.removeItem(`pq_${uid}_${c.topic.replace(/\s/g, '_')}`));
            window.showToast?.('🎉 30 days complete! New cycle started!', 'success');
            const fresh = await getAllDays(uid);
            setResults(fresh);
          }, 2000);
        }, 1000);
      }
      setScreen('result');
    } else {
      setCurrent(c => c + 1);
      setSelected(null); setCodeAns('');
      setSubmitted(false); setSkipped(false); setWrongExplain('');
    }
  };

  // ── Styles ────────────────────────────────────────────────────
  const cardBg      = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border      = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
  const textPrimary = isDark ? '#f0f2ff' : '#111827';
  const textSec     = isDark ? '#8b93a8' : '#6b7280';
  const pageBg      = isDark ? 'linear-gradient(160deg,#060b14,#0d1117)' : 'linear-gradient(160deg,#f5f7ff,#ffffff)';
  const codeBg      = isDark ? '#1e1e2e' : '#1e1e2e';

  const wrap = (children, maxW = '700px') => (
    <div style={{ minHeight:'100vh', background:pageBg, fontFamily:"'Syne',sans-serif", color:textPrimary, paddingTop:mobile?'80px':'100px', paddingBottom:'60px', paddingLeft:mobile?'16px':'24px', paddingRight:mobile?'16px':'24px', boxSizing:'border-box' }}>
      <div style={{ maxWidth:maxW, margin:'0 auto' }}>{children}</div>
    </div>
  );

  const alreadyDoneToday = results.some(r => r.date === today);
  const totalDays        = results.length;
  const avgScore         = totalDays ? Math.round(results.reduce((a, r) => a + (r.pct || 0), 0) / totalDays) : 0;

  // ════════════════════════════════════════════════
  // LOADING INIT
  // ════════════════════════════════════════════════
  if (loading) return (
    <div style={{ minHeight:'100vh', background:pageBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", flexDirection:'column', gap:'14px' }}>
      <div style={{ fontSize:'2.5rem', animation:'spin 1.5s linear infinite' }}>🔥</div>
      <div style={{ color:textPrimary, fontWeight:'700' }}>Loading your progress...</div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ════════════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════════════
  if (screen === 'home') return wrap(
    <>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:'24px' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'8px' }}>🔥</div>
        <h1 style={{ fontSize:mobile?'1.5rem':'2rem', fontWeight:'900', margin:'0 0 4px', background:'linear-gradient(135deg,#ff6b00,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          Daily Python Practice
        </h1>
        <p style={{ color:textSec, fontSize:'0.85rem', margin:0 }}>Learn deeply • AI explains everything • Results saved forever</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'18px' }}>
        {[
          { label:'Day',       value:`${todayInfo?.dayNum||1}/30`, color:'#ff6b00' },
          { label:'Sessions',  value:totalDays,                    color:'#6366f1' },
          { label:'Avg Score', value:totalDays?`${avgScore}%`:'—', color:'#22c55e' },
        ].map((s, i) => (
          <div key={i} style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px 10px', textAlign:'center' }}>
            <div style={{ fontSize:'1.5rem', fontWeight:'900', color:s.color }}>{s.value}</div>
            <div style={{ fontSize:'0.68rem', color:textSec, marginTop:'2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today topic */}
      {todayInfo && (
        <div style={{ background:isDark?'linear-gradient(135deg,rgba(255,107,0,0.12),rgba(99,102,241,0.08))':'linear-gradient(135deg,rgba(255,107,0,0.07),rgba(99,102,241,0.05))', border:`1px solid ${isDark?'rgba(255,107,0,0.25)':'rgba(255,107,0,0.2)'}`, borderRadius:'18px', padding:'18px', marginBottom:'16px' }}>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'10px' }}>
            <span style={{ background:'rgba(255,107,0,0.15)', border:'1px solid rgba(255,107,0,0.3)', color:'#ff6b00', padding:'3px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'800' }}>📅 Day {todayInfo.dayNum}</span>
            <span style={{ background:isDark?'rgba(255,255,255,0.06)':'#f1f5f9', color:textSec, padding:'3px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'700' }}>{todayInfo.level}</span>
          </div>
          <div style={{ fontWeight:'900', fontSize:mobile?'1rem':'1.1rem', marginBottom:'4px' }}>Today: {todayInfo.topic}</div>
          <div style={{ fontSize:'0.76rem', color:textSec }}>Deep theory + 30 questions (MCQ + Code + Output + Debug + Fill)</div>
          <div style={{ fontSize:'0.72rem', color:'#10b981', marginTop:'4px', fontWeight:'700' }}>✅ Wrong answers get baby-style explanation</div>
        </div>
      )}

      {/* CTA */}
      {alreadyDoneToday && !isAdmin ? (
        <div style={{ background:isDark?'rgba(255,107,0,0.08)':'rgba(255,107,0,0.05)', border:'2px solid rgba(255,107,0,0.2)', borderRadius:'18px', padding:'22px', textAlign:'center', marginBottom:'16px' }}>
          <div style={{ fontSize:'2rem', marginBottom:'8px' }}>✅</div>
          <div style={{ fontWeight:'900', fontSize:'1rem', marginBottom:'6px' }}>Practice done for today!</div>
          <div style={{ color:textSec, fontSize:'0.82rem', marginBottom:'14px' }}>Come back tomorrow for Day {(todayInfo?.dayNum||1)+1}</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:isDark?'rgba(0,0,0,0.2)':'rgba(0,0,0,0.05)', borderRadius:'12px', padding:'10px 18px' }}>
            <span style={{ fontSize:'1.1rem' }}>🔒</span>
            <span style={{ fontFamily:'"Fira Code",monospace', fontSize:'1.1rem', fontWeight:'900', color:'#ff6b00', letterSpacing:'2px' }}>{countdown}</span>
          </div>
        </div>
      ) : (
        <button onClick={loadContent} style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'1.05rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 10px 28px rgba(255,107,0,0.4)', marginBottom:'16px' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
        >
          🚀 Start Today's Practice
        </button>
      )}

      {/* PDF button */}
      {totalDays >= 30 ? (
        <button onClick={() => makePDF(user?.displayName||user?.email, results)} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'0.95rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 8px 20px rgba(34,197,94,0.4)', marginBottom:'16px' }}>
          🎉 Download Your 30-Day PDF Report
        </button>
      ) : (
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px 16px', marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
            <span style={{ fontWeight:'700', fontSize:'0.88rem' }}>📄 PDF Report</span>
            <span style={{ fontSize:'0.78rem', color:'#ff6b00', fontWeight:'800' }}>{totalDays}/30 days</span>
          </div>
          <div style={{ height:'6px', background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb', borderRadius:'10px', overflow:'hidden', marginBottom:'6px' }}>
            <div style={{ height:'100%', width:`${Math.min((totalDays/30)*100,100)}%`, background:'linear-gradient(90deg,#ff6b00,#f59e0b)', borderRadius:'10px', transition:'width 0.6s' }}/>
          </div>
          <div style={{ fontSize:'0.72rem', color:textSec }}>{30-totalDays} more days to unlock PDF • Auto-downloads on Day 30 ☁️</div>
        </div>
      )}

      {/* 30 Day Roadmap */}
      <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'16px', overflow:'hidden', marginBottom:'16px' }}>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${border}`, fontWeight:'800', fontSize:'0.88rem' }}>🗺️ 30-Day Roadmap</div>
        <div style={{ maxHeight:'280px', overflowY:'auto' }}>
          {CURRICULUM.map((c, i) => {
            const done   = results.some(r => r.day === c.day);
            const isToday = todayInfo?.dayNum === c.day;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 16px', borderBottom:i<29?`1px solid ${border}`:'none', background:isToday?(isDark?'rgba(255,107,0,0.08)':'rgba(255,107,0,0.04)'):'' }}>
                <span style={{ fontSize:'0.9rem' }}>{done?'✅':isToday?'🔥':'⭕'}</span>
                <span style={{ fontSize:'0.72rem', color:isToday?'#ff6b00':done?'#22c55e':textSec, fontWeight:isToday?'800':'600' }}>
                  Day {c.day}: {c.topic}
                </span>
                <span style={{ marginLeft:'auto', fontSize:'0.62rem', color:textSec, background:isDark?'rgba(255,255,255,0.05)':'#f1f5f9', padding:'2px 8px', borderRadius:'10px' }}>{c.level}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      {results.length > 0 && (
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'16px', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${border}`, fontWeight:'800', fontSize:'0.88rem' }}>📅 Recent Sessions</div>
          {results.slice(-5).reverse().map((r, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:i<4?`1px solid ${border}`:'none' }}>
              <div>
                <div style={{ fontWeight:'700', fontSize:'0.82rem' }}>{r.topic}</div>
                <div style={{ fontSize:'0.68rem', color:textSec, marginTop:'2px' }}>{r.level} • {r.date}</div>
              </div>
              <span style={{ fontWeight:'800', fontSize:'0.85rem', color:r.pct>=70?'#22c55e':r.pct>=50?'#f59e0b':'#ef4444' }}>
                {r.score}/{r.total} ({r.pct}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ════════════════════════════════════════════════
  // LOADING CONTENT
  // ════════════════════════════════════════════════
  if (screen === 'loading') return (
    <div style={{ minHeight:'100vh', background:pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", gap:'14px', padding:'24px', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', animation:'spin 1.5s linear infinite' }}>🤖</div>
      <div style={{ fontWeight:'800', fontSize:'1.05rem', color:textPrimary }}>AI is preparing your lesson...</div>
      <div style={{ color:textSec, fontSize:'0.82rem' }}>{todayInfo?.level} • {todayInfo?.topic}</div>
      <div style={{ color:textSec, fontSize:'0.75rem', marginTop:'4px' }}>
        First time? AI generates deep content → saved for everyone 💾
      </div>
      <div style={{ display:'flex', gap:'6px', marginTop:'4px' }}>
        {[0,1,2].map(i => <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ff6b00', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
    </div>
  );

  // ════════════════════════════════════════════════
  // THEORY SCREEN
  // ════════════════════════════════════════════════
  if (screen === 'theory' && topicContent) {
    const theoryLines  = (topicContent.theory || '').split('\n').filter(l => l.trim());
    const examples     = topicContent.codeExamples || [];
    const totalPages   = 1 + examples.length;
    const isLastPage   = theoryPage >= totalPages - 1;

    return wrap(
      <>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <div>
            <span style={{ background:'rgba(255,107,0,0.15)', border:'1px solid rgba(255,107,0,0.3)', color:'#ff6b00', padding:'3px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'800' }}>📖 Theory — Day {todayInfo?.dayNum}</span>
            <div style={{ fontWeight:'900', fontSize:'1rem', marginTop:'6px' }}>{todayInfo?.topic}</div>
          </div>
          <div style={{ textAlign:'right', fontSize:'0.72rem', color:textSec }}>
            {theoryPage+1} / {totalPages}
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'16px' }}>
          {Array.from({length:totalPages}).map((_, i) => (
            <div key={i} style={{ flex:1, height:'4px', borderRadius:'4px', background:i<=theoryPage?'#ff6b00':(isDark?'rgba(255,255,255,0.1)':'#e5e7eb'), transition:'background 0.3s' }}/>
          ))}
        </div>

        {/* Theory page 0 — main explanation */}
        {theoryPage === 0 && (
          <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:mobile?'18px':'26px', marginBottom:'16px' }}>
            <div style={{ fontSize:'0.72rem', color:'#ff6b00', fontWeight:'800', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>📚 What is {todayInfo?.topic}?</div>
            {theoryLines.map((line, i) => (
              <p key={i} style={{ fontSize:mobile?'0.88rem':'0.94rem', lineHeight:'1.8', color:textPrimary, margin:'0 0 10px' }}>
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Code examples pages */}
        {theoryPage > 0 && examples[theoryPage - 1] && (
          <div style={{ marginBottom:'16px' }}>
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:mobile?'16px':'22px', marginBottom:'12px' }}>
              <div style={{ fontSize:'0.72rem', color:'#10b981', fontWeight:'800', marginBottom:'8px', textTransform:'uppercase' }}>💻 Code Example {theoryPage}</div>
              <div style={{ fontWeight:'700', fontSize:'0.95rem', marginBottom:'12px' }}>{examples[theoryPage-1].title}</div>

              {/* Code block */}
              <div style={{ background:codeBg, borderRadius:'12px', padding:'14px 16px', marginBottom:'12px', position:'relative' }}>
                <div style={{ position:'absolute', top:'10px', right:'12px', display:'flex', gap:'5px' }}>
                  {['#ff5f57','#ffbd2e','#28c840'].map((c,i)=><div key={i} style={{width:'9px',height:'9px',borderRadius:'50%',background:c}}/>)}
                </div>
                <pre style={{ margin:0, color:'#f1f5f9', fontFamily:'"Fira Code","Courier New",monospace', fontSize:mobile?'0.78rem':'0.88rem', lineHeight:'1.7', whiteSpace:'pre-wrap', paddingTop:'4px' }}>
                  {examples[theoryPage-1].code}
                </pre>
              </div>

              {/* Output */}
              {examples[theoryPage-1].output && (
                <div style={{ background:isDark?'rgba(16,185,129,0.1)':'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'0.65rem', color:'#10b981', fontWeight:'800', marginBottom:'4px' }}>📤 OUTPUT</div>
                  <code style={{ fontFamily:'"Fira Code","Courier New",monospace', fontSize:'0.85rem', color:'#10b981' }}>
                    {examples[theoryPage-1].output}
                  </code>
                </div>
              )}

              {/* Explanation */}
              <div style={{ background:isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'10px', padding:'10px 14px' }}>
                <div style={{ fontSize:'0.65rem', color:'#6366f1', fontWeight:'800', marginBottom:'4px' }}>💡 EXPLANATION</div>
                <div style={{ fontSize:'0.85rem', color:textSec, lineHeight:'1.6' }}>{examples[theoryPage-1].explanation}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:'flex', gap:'10px' }}>
          {theoryPage > 0 && (
            <button onClick={() => setTheoryPage(p=>p-1)} style={{ padding:'13px 20px', background:'transparent', border:`1px solid ${border}`, borderRadius:'12px', color:textSec, fontSize:'0.9rem', fontWeight:'700', cursor:'pointer' }}>← Back</button>
          )}
          {!isLastPage ? (
            <button onClick={() => setTheoryPage(p=>p+1)} style={{ flex:1, padding:'14px', background:'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 6px 20px rgba(255,107,0,0.35)' }}>
              Next →
            </button>
          ) : (
            <button onClick={startQuiz} style={{ flex:1, padding:'14px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 6px 20px rgba(99,102,241,0.4)' }}>
              🧠 Start Practice ({questions.length} Questions) →
            </button>
          )}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════
  // QUIZ
  // ════════════════════════════════════════════════
  if (screen === 'quiz' && questions.length > 0) {
    const q     = questions[current];
    const isMCQ = q.type === 'MCQ' || q.type === 'OUTPUT';
    const ts    = TS[q.type] || TS.MCQ;
    const can   = isMCQ ? !!selected : !!codeAns.trim();

    return (
      <div style={{ minHeight:'100vh', background:pageBg, fontFamily:"'Syne',sans-serif", color:textPrimary, paddingTop:mobile?'80px':'100px', paddingBottom:'40px', paddingLeft:mobile?'14px':'24px', paddingRight:mobile?'14px':'24px', boxSizing:'border-box' }}>
        <div style={{ maxWidth:'700px', margin:'0 auto' }}>

          {/* Top bar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', gap:'8px' }}>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ background:ts.bg, border:`1px solid ${ts.border}`, color:ts.color, padding:'3px 10px', borderRadius:'20px', fontSize:'0.68rem', fontWeight:'800' }}>{ts.label}</span>
              <span style={{ background:isDark?'rgba(255,255,255,0.05)':'#f1f5f9', color:textSec, padding:'3px 10px', borderRadius:'20px', fontSize:'0.65rem', fontWeight:'600' }}>Day {todayInfo?.dayNum} • {todayInfo?.topic}</span>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontWeight:'800', fontSize:'0.9rem' }}>{current+1}/{questions.length}</div>
              <div style={{ fontSize:'0.68rem', color:textSec }}>Score: {score}</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ height:'5px', background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb', borderRadius:'10px', marginBottom:'14px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(current/questions.length)*100}%`, background:'linear-gradient(90deg,#ff6b00,#f59e0b)', borderRadius:'10px', transition:'width 0.4s' }}/>
          </div>

          {/* Question card */}
          <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:mobile?'18px 16px':'24px', marginBottom:'12px', boxShadow:'0 6px 20px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:mobile?'0.95rem':'1.05rem', fontWeight:'700', lineHeight:'1.65', margin:'0 0 14px' }}>{q.q}</p>

            {/* Code snippet */}
            {q.code && (
              <div style={{ background:codeBg, borderRadius:'12px', padding:'14px', marginBottom:'14px', fontFamily:'"Fira Code","Consolas",monospace', fontSize:mobile?'0.78rem':'0.86rem', color:'#d4d4d4', lineHeight:'1.6', overflowX:'auto', whiteSpace:'pre', position:'relative' }}>
                <div style={{ position:'absolute', top:'8px', right:'10px', display:'flex', gap:'4px' }}>
                  {['#ff5f57','#ffbd2e','#28c840'].map((c,i)=><div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:c}}/>)}
                </div>
                <div style={{ paddingTop:'4px' }}>{q.code}</div>
              </div>
            )}

            {/* MCQ options */}
            {isMCQ && q.options && (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {q.options.map((opt, i) => {
                  let bg = isDark?'rgba(255,255,255,0.04)':'#f9fafb', bc = isDark?'rgba(255,255,255,0.08)':'#e5e7eb', color = textPrimary;
                  if (submitted) {
                    if (opt === q.answer)         { bg='rgba(34,197,94,0.15)';  bc='#22c55e'; color='#22c55e'; }
                    else if (opt === selected)    { bg='rgba(239,68,68,0.1)';   bc='#ef4444'; color='#ef4444'; }
                  } else if (selected === opt)   { bg='rgba(255,107,0,0.12)';  bc='#ff6b00'; color='#ff6b00'; }
                  return (
                    <div key={i} onClick={() => !submitted && setSelected(opt)}
                      style={{ background:bg, border:`2px solid ${bc}`, borderRadius:'12px', padding:mobile?'11px 13px':'12px 15px', cursor:submitted?'default':'pointer', color, fontWeight:submitted&&opt===q.answer?'700':'500', transition:'all 0.15s', fontSize:mobile?'0.85rem':'0.9rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>{opt}</span>
                      {submitted && opt === q.answer && <span>✅</span>}
                      {submitted && opt === selected && opt !== q.answer && <span>❌</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Text answer */}
            {!isMCQ && (
              <>
                <div style={{ fontSize:'0.72rem', color:textSec, marginBottom:'6px', fontWeight:'600' }}>
                  {q.type==='CODE'&&'✏️ Write your Python code:'}
                  {q.type==='FILL'&&'✏️ Fill in the blank:'}
                  {q.type==='DEBUG'&&'✏️ Describe the bug and fix:'}
                </div>
                <textarea value={codeAns} onChange={e=>!submitted&&setCodeAns(e.target.value)} readOnly={submitted}
                  placeholder={q.type==='CODE'?'def solution():\n    pass':q.type==='FILL'?'Type the missing word...':'Describe the bug and write the fix...'}
                  rows={q.type==='CODE'?6:3}
                  style={{ width:'100%', boxSizing:'border-box', background:submitted?(isDark?'rgba(255,255,255,0.03)':'#f9fafb'):(isDark?'#1e1e2e':'#f9fafb'), border:`2px solid ${submitted?'#f59e0b':codeAns?'#ff6b00':(isDark?'rgba(255,255,255,0.1)':'#e5e7eb')}`, borderRadius:'12px', padding:'12px', fontFamily:q.type==='CODE'?'"Fira Code",monospace':"'Syne',sans-serif", fontSize:mobile?'0.82rem':'0.86rem', lineHeight:'1.6', color:isDark?'#d4d4d4':'#111827', resize:'vertical', outline:'none' }}
                />
                {/* Correct answer shown after submit */}
                {submitted && (
                  <div style={{ marginTop:'10px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'10px', padding:'10px 12px' }}>
                    <div style={{ fontSize:'0.68rem', color:'#22c55e', fontWeight:'800', marginBottom:'3px' }}>✅ CORRECT ANSWER</div>
                    <div style={{ fontFamily:q.type==='CODE'?'"Fira Code",monospace':'inherit', fontSize:'0.82rem', color:isDark?'#d4d4d4':'#111827', whiteSpace:'pre-wrap', lineHeight:'1.6' }}>{q.answer}</div>
                  </div>
                )}
              </>
            )}

            {/* Skipped */}
            {submitted && skipped && (
              <div style={{ marginTop:'12px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'10px', padding:'10px 12px' }}>
                <div style={{ fontSize:'0.68rem', color:'#f59e0b', fontWeight:'800', marginBottom:'3px' }}>⏭️ SKIPPED</div>
                <div style={{ fontSize:'0.82rem', color:textSec }}>Correct: <strong style={{ color:isDark?'#d4d4d4':'#111827' }}>{q.answer}</strong></div>
              </div>
            )}

            {/* ✅ Correct — show original explanation */}
            {submitted && !skipped && selected === q.answer && (
              <div style={{ marginTop:'12px', background:isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'10px', padding:'10px 12px' }}>
                <div style={{ fontSize:'0.68rem', color:'#6366f1', fontWeight:'800', marginBottom:'3px' }}>💡 EXPLANATION</div>
                <div style={{ fontSize:'0.82rem', color:textSec, lineHeight:'1.5' }}>{q.explanation}</div>
              </div>
            )}

            {/* ❌ Wrong — AI baby explanation */}
            {submitted && !skipped && selected !== q.answer && (
              <div style={{ marginTop:'12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'10px', padding:'12px 14px' }}>
                <div style={{ fontSize:'0.68rem', color:'#ef4444', fontWeight:'800', marginBottom:'6px' }}>🧒 WHY YOU GOT IT WRONG (Simple Explanation)</div>
                {loadingExpl ? (
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#ef4444', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
                    <span style={{ fontSize:'0.78rem', color:textSec }}>AI is explaining...</span>
                  </div>
                ) : (
                  <div style={{ fontSize:'0.85rem', color:textSec, lineHeight:'1.7', whiteSpace:'pre-wrap' }}>{wrongExplain}</div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:'10px' }}>
            {!submitted ? (
              <>
                <button onClick={handleSkip} style={{ padding:mobile?'13px 14px':'14px 18px', background:'transparent', border:`1px solid ${border}`, borderRadius:'12px', color:textSec, fontSize:'0.85rem', fontWeight:'700', cursor:'pointer', flexShrink:0 }}>⏭️ Skip</button>
                <button onClick={handleSubmit} disabled={!can || loadingExpl} style={{ flex:1, padding:'13px', background:can?'linear-gradient(135deg,#ff6b00,#ff3d00)':(isDark?'#1f2937':'#e5e7eb'), color:can?'#fff':textSec, border:'none', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'800', cursor:can?'pointer':'not-allowed' }}>
                  Submit Answer
                </button>
              </>
            ) : (
              <button onClick={handleNext} disabled={loadingExpl} style={{ flex:1, padding:'13px', background:loadingExpl?'#6b7280':'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'800', cursor:loadingExpl?'wait':'pointer', boxShadow:'0 6px 20px rgba(99,102,241,0.4)' }}>
                {loadingExpl ? '⏳ Explaining...' : current+1>=questions.length ? '🏁 See Results' : 'Next →'}
              </button>
            )}
          </div>
        </div>
        <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════
  // RESULT
  // ════════════════════════════════════════════════
  if (screen === 'result') {
    const todayRes = results.find(r => r.date === today) || { score:0, total:questions.length, pct:0, skipped:0 };
    const pct      = todayRes.pct || 0;
    const emoji    = pct>=80?'🏆':pct>=60?'👍':pct>=40?'💪':'📚';
    const msg      = pct>=80?'Outstanding!':pct>=60?'Good job!':pct>=40?'Keep going!':'Review this topic!';
    const doneAll  = results.length >= 30;

    return wrap(
      <>
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'24px', padding:mobile?'28px 20px':'36px', textAlign:'center', marginBottom:'16px' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'8px' }}>{emoji}</div>
          <h2 style={{ fontSize:mobile?'1.3rem':'1.7rem', fontWeight:'900', margin:'0 0 4px' }}>{msg}</h2>
          <p style={{ color:textSec, fontSize:'0.82rem', margin:'0 0 16px' }}>Day {todayInfo?.dayNum} • {todayInfo?.topic}</p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:isDark?'rgba(255,107,0,0.12)':'rgba(255,107,0,0.08)', border:'2px solid rgba(255,107,0,0.25)', borderRadius:'20px', padding:'12px 24px', marginBottom:'14px' }}>
            <span style={{ fontSize:mobile?'2.5rem':'3rem', fontWeight:'900', background:'linear-gradient(135deg,#ff6b00,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{todayRes.score}/{todayRes.total}</span>
            <span style={{ fontSize:'1rem', color:textSec, fontWeight:'700' }}>({pct}%)</span>
          </div>
          {todayRes.skipped>0 && <div style={{ fontSize:'0.76rem', color:'#f59e0b', marginBottom:'8px' }}>⏭️ {todayRes.skipped} skipped</div>}

          {/* Answered breakdown */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
            {[
              { label:'Correct', value:todayRes.score, color:'#22c55e' },
              { label:'Wrong',   value:(todayRes.total - todayRes.score - (todayRes.skipped||0)), color:'#ef4444' },
              { label:'Skipped', value:todayRes.skipped||0, color:'#f59e0b' },
            ].map((s,i) => (
              <div key={i} style={{ background:isDark?'rgba(255,255,255,0.05)':'#f9fafb', border:`1px solid ${border}`, borderRadius:'12px', padding:'10px 6px', textAlign:'center' }}>
                <div style={{ fontSize:'1.3rem', fontWeight:'900', color:s.color }}>{s.value}</div>
                <div style={{ fontSize:'0.65rem', color:textSec }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background:isDark?'rgba(0,0,0,0.2)':'rgba(0,0,0,0.04)', borderRadius:'12px', padding:'12px 16px' }}>
            {doneAll ? (
              <div style={{ fontWeight:'700', fontSize:'0.88rem', color:'#22c55e' }}>🎉 All 30 days done! PDF downloading...</div>
            ) : (
              <>
                <div style={{ fontWeight:'700', fontSize:'0.85rem', marginBottom:'4px' }}>🔒 Next practice in <span style={{ color:'#ff6b00' }}>{countdown}</span></div>
                <div style={{ fontSize:'0.72rem', color:textSec }}>Tomorrow: Day {(todayInfo?.dayNum||1)+1} — {CURRICULUM[Math.min(todayInfo?.dayNum||1, 29)]?.topic}</div>
              </>
            )}
          </div>
        </div>

        {/* PDF progress */}
        {!doneAll && (
          <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px 16px', marginBottom:'14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
              <span style={{ fontWeight:'700', fontSize:'0.85rem' }}>📄 PDF Progress</span>
              <span style={{ fontSize:'0.78rem', color:'#ff6b00', fontWeight:'800' }}>{results.length}/30</span>
            </div>
            <div style={{ height:'6px', background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb', borderRadius:'10px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(results.length/30)*100}%`, background:'linear-gradient(90deg,#ff6b00,#f59e0b)', borderRadius:'10px' }}/>
            </div>
            <div style={{ fontSize:'0.7rem', color:textSec, marginTop:'5px' }}>{30-results.length} more days → PDF on Day 30 ☁️</div>
          </div>
        )}

        {doneAll && (
          <button onClick={() => makePDF(user?.displayName||user?.email, results)} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'0.95rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 8px 20px rgba(34,197,94,0.4)', marginBottom:'14px' }}>
            📥 Download Your 30-Day PDF Report
          </button>
        )}

        <button onClick={() => setCurrentPage('streak')} style={{ width:'100%', padding:'13px', background:'transparent', color:textSec, border:`1px solid ${border}`, borderRadius:'12px', fontSize:'0.88rem', fontWeight:'700', cursor:'pointer' }}>
          ← Back to Streak
        </button>
      </>
    );
  }

  return null;
};

export default DailyPractice;