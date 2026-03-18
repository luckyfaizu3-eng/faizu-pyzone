import React, { useState, useEffect, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import {
  saveDay, getAllDays, resetStreak, getStreakUser, createStreakUser,
  isPracticeWindowOpen, secondsUntilOpen, secondsUntilClose, formatTime,
  getStreakState, restoreStreak, getTodayQuestions, saveTodayQuestions,
  todayDateStr, ADMIN_EMAIL, getRestorePrice,
  getUserRank, getUserRival, getTopicMastery,
  BADGES, calculateSessionXP, XP_VALUES,
} from '../streakService';
import PythonLogo from './PythonLogo';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const WORKER_URL    = 'https://white-limit-e2fe.luckyfaizu3.workers.dev/chat';
const TOTAL_QUESTIONS = 15;

// ─────────────────────────────────────────────────────────────────────────────
// 30-DAY CURRICULUM
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// AI CALL — streaming
// ─────────────────────────────────────────────────────────────────────────────
const callAI = async (prompt, maxTokens = 4000) => {
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
  const reader  = res.body.getReader();
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

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE QUESTIONS — 15 questions, mixed types
// ─────────────────────────────────────────────────────────────────────────────
const generateQuestions = async (topic, level) => {
  const prompt = `You are a Python teacher. Generate exactly 15 Python questions for topic: "${topic}" (Level: ${level}).

Return ONLY valid JSON, no extra text:

{
  "questions": [
    {"type":"MCQ",    "q":"Question?", "options":["A) opt1","B) opt2","C) opt3","D) opt4"], "answer":"A) opt1", "explanation":"Why correct"},
    {"type":"OUTPUT", "q":"What will this print?", "code":"x=5\\nprint(x+3)", "options":["A) 8","B) 53","C) Error","D) None"], "answer":"A) 8", "explanation":"x is 5, 5+3=8"},
    {"type":"CODE",   "q":"Write a function to...", "answer":"def solution():\\n    pass", "explanation":"How to write this"},
    {"type":"FILL",   "q":"Complete: x = ____", "answer":"correct value", "explanation":"Why this answer"},
    {"type":"DEBUG",  "q":"Find the bug:", "code":"def f(x)\\n  return x", "answer":"Missing colon: def f(x):", "explanation":"Colon required after def"}
  ]
}

STRICT RULES:
- Return ONLY valid JSON
- Exactly 15 questions: 6 MCQ + 3 OUTPUT + 3 CODE + 2 FILL + 1 DEBUG
- All code strings use \\n not actual newlines
- explanations: super simple, like explaining to a 10-year-old`;

  const raw = await callAI(prompt, 5000);

  const cleanJSON = (str) => {
    const match = str.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    return match[0]
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  };

  try {
    return JSON.parse(cleanJSON(raw));
  } catch {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON');
      let fixed = match[0];
      fixed = fixed.replace(/([":,[{]\s*")([^"]*?)"/gs, (m, pre, val) =>
        pre + val.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"'
      );
      return JSON.parse(fixed);
    } catch (e2) {
      throw new Error('JSON parse failed: ' + e2.message);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// WRONG ANSWER EXPLANATION
// ─────────────────────────────────────────────────────────────────────────────
const getWrongExplanation = async (question, userAnswer, correctAnswer, topic) => {
  const prompt = `A student got this Python question wrong. Explain simply like talking to a 10-year-old.

Topic: ${topic}
Question: ${question}
Student answered: ${userAnswer}
Correct answer: ${correctAnswer}

Explain:
1. Why their answer was wrong (1-2 simple sentences)
2. Why the correct answer is right (2-3 simple sentences)
3. A simple tip to remember this

Use very simple words. Be encouraging. Maximum 80 words.`;
  try {
    return (await callAI(prompt, 300)).trim();
  } catch {
    return `The correct answer is: ${correctAnswer}. Keep practicing! 😊`;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
const makePDF = (userName, results) => {
  const doc   = new jsPDF();
  const OR    = [255, 107, 0];
  const DARK  = [17, 24, 39];
  const GRAY  = [107, 114, 128];
  const GREEN = [34, 197, 94];
  const RED   = [239, 68, 68];
  const AMB   = [245, 158, 11];

  doc.setFillColor(...OR);
  doc.rect(0, 0, 210, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('Zehra AI — 30-Day Python Mastery Report', 15, 22);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text(`Student: ${userName || 'Student'}`, 15, 34);
  doc.text(`Completed: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}`, 15, 42);
  doc.text('Zehra AI', 15, 50);

  const totalQ  = results.reduce((a, r) => a + (r.total || 0), 0);
  const correct = results.reduce((a, r) => a + (r.score || 0), 0);
  const pct     = totalQ ? Math.round((correct / totalQ) * 100) : 0;

  doc.setTextColor(...DARK); doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  doc.text('Overall Performance', 15, 78);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
  doc.text(`Days Completed: ${results.length} / 30`, 15, 90);
  doc.text(`Total Questions: ${totalQ}`, 15, 98);
  doc.text(`Correct Answers: ${correct}`, 15, 106);
  doc.text(`Overall Score: ${pct}%`, 15, 114);

  doc.setFillColor(229, 231, 235); doc.rect(15, 120, 180, 8, 'F');
  doc.setFillColor(...(pct >= 70 ? GREEN : pct >= 50 ? AMB : OR));
  doc.rect(15, 120, (180 * pct) / 100, 8, 'F');

  const topicMap = {};
  results.forEach(r => {
    if (!topicMap[r.topic]) topicMap[r.topic] = { score: 0, total: 0 };
    topicMap[r.topic].score += r.score || 0;
    topicMap[r.topic].total += r.total || 0;
  });

  const strong = Object.entries(topicMap).filter(([, v]) => v.total && v.score / v.total >= 0.7).map(([k]) => k);
  const weak   = Object.entries(topicMap).filter(([, v]) => v.total && v.score / v.total < 0.5).map(([k]) => k);

  let y = 150;
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
  doc.text('Topic Analysis', 15, y); y += 12;

  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN);
  doc.text('Strong Topics (>= 70%)', 15, y); y += 8;
  doc.setFont('helvetica', 'normal');
  strong.forEach(t => { if (y > 270) { doc.addPage(); y = 20; } doc.text(`  • ${t}`, 15, y); y += 7; });
  if (!strong.length) { doc.setTextColor(...GRAY); doc.text('  None yet', 15, y); y += 7; }

  y += 4;
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...RED);
  doc.text('Needs Revision (< 50%)', 15, y); y += 8;
  doc.setFont('helvetica', 'normal');
  weak.forEach(t => { if (y > 270) { doc.addPage(); y = 20; } doc.text(`  • ${t}`, 15, y); y += 7; });
  if (!weak.length) { doc.setTextColor(...GREEN); doc.text('  No weak topics — Excellent!', 15, y); }

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
    doc.text(`${r.day || i + 1}`, xPos[0], y);
    doc.text(r.date || '', xPos[1], y);
    doc.text((r.topic || '').substring(0, 24), xPos[2], y);
    doc.text((r.level || '').substring(0, 10), xPos[3], y);
    doc.text(`${r.score || 0}/${r.total || 0}`, xPos[4], y);
    doc.setTextColor(...(p >= 70 ? GREEN : p >= 50 ? AMB : RED));
    doc.text(`${p}%`, xPos[5], y);
    y += 9;
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setTextColor(...GRAY); doc.setFontSize(8);
    doc.text('Generated by Zehra AI', 105, 290, { align: 'center' });
    doc.text(`Page ${p} of ${pages}`, 190, 290, { align: 'right' });
  }

  doc.save(`ZehraAI_30Day_${userName || 'Student'}_${todayDateStr()}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION TYPE STYLES
// ─────────────────────────────────────────────────────────────────────────────
const TS = {
  MCQ:    { bg:'rgba(99,102,241,0.12)',  border:'rgba(99,102,241,0.3)',  color:'#6366f1', label:'Multiple Choice' },
  OUTPUT: { bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)', color:'#10b981', label:'Guess Output'    },
  CODE:   { bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.3)', color:'#f59e0b', label:'Write Code'      },
  FILL:   { bg:'rgba(236,72,153,0.12)', border:'rgba(236,72,153,0.3)', color:'#ec4899', label:'Fill Blank'      },
  DEBUG:  { bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.3)',  color:'#ef4444', label:'Debug Code'      },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const DailyPractice = ({ isDark, user, setCurrentPage }) => {
  const uid      = user?.uid;
  const isAdmin  = user?.email === ADMIN_EMAIL;
  const today    = todayDateStr();
  const userName = user?.displayName || user?.email || 'Student';

  // Screens: home | locked | loading | quiz | result | restore
  const [screen,        setScreen]        = useState('home');
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [todayInfo,     setTodayInfo]     = useState(null);
  const [streakState,   setStreakState]   = useState('safe');
  const [restorePrice,  setRestorePrice]  = useState(29);

  // Window countdown
  const [windowOpen,    setWindowOpen]    = useState(false);
  const [countdown,     setCountdown]     = useState('');
  const [closeCountdown,setCloseCountdown]= useState('');

  // Content
  const [topicContent,  setTopicContent]  = useState(null);
  const [theoryPage,    setTheoryPage]    = useState(0);

  // Quiz state
  const [questions,     setQuestions]     = useState([]);
  const [current,       setCurrent]       = useState(0);
  const [selected,      setSelected]      = useState(null);
  const [codeAns,       setCodeAns]       = useState('');
  const [submitted,     setSubmitted]     = useState(false);
  const [skipped,       setSkipped]       = useState(false);
  const [score,         setScore]         = useState(0);
  const [answers,       setAnswers]       = useState([]);
  const [wrongExplain,  setWrongExplain]  = useState('');
  const [loadingExpl,   setLoadingExpl]   = useState(false);

  // XP + gamification
  const [sessionXP,     setSessionXP]     = useState(0);
  const [xpPopups,      setXpPopups]      = useState([]); // [{id, value, x, y}]
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [showOnFire,    setShowOnFire]    = useState(false);
  const [userRank,      setUserRank]      = useState(null);
  const [rival,         setRival]         = useState(null);
  const [topicMastery,  setTopicMastery]  = useState([]);
  const [newBadgesEarned, setNewBadgesEarned] = useState([]);
  const [showConfetti,  setShowConfetti]  = useState(false);
  const [streakUserData,setStreakUserData] = useState(null);
  const practiceStartTime = useRef(null);

  // Anti-cheat
  const [tabWarnings,   setTabWarnings]   = useState(0);
  const [disqualified,  setDisqualified]  = useState(false);
  const tabWarningsRef  = useRef(0);
  const isQuizActive    = useRef(false);

  // Restore
  const [restoring,     setRestoring]     = useState(false);

  const [mobile,        setMobile]        = useState(window.innerWidth <= 768);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) { setCurrentPage('login'); return; }
    init();
    const h = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []); // eslint-disable-line

  // Window open/close countdown tick
  useEffect(() => {
    const tick = () => {
      const open = isAdmin ? true : isPracticeWindowOpen();
      setWindowOpen(open);
      if (!open) {
        setCountdown(formatTime(secondsUntilOpen()));
      } else {
        setCloseCountdown(formatTime(secondsUntilClose()));
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line

  // ── Anti-Cheat: Tab Switch Detection ─────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isQuizActive.current) return;
      if (document.hidden) {
        tabWarningsRef.current += 1;
        setTabWarnings(tabWarningsRef.current);
        if (tabWarningsRef.current >= 3) {
          setDisqualified(true);
          isQuizActive.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ── Anti-Cheat: Copy-Paste Block on quiz screen ───────────────────────────
  useEffect(() => {
    const blockCopy = (e) => {
      if (!isQuizActive.current) return;
      e.preventDefault();
      window.showToast?.('Copy-paste is not allowed during practice!', 'warning');
    };
    const blockRightClick = (e) => {
      if (!isQuizActive.current) return;
      e.preventDefault();
    };

    document.addEventListener('copy',  blockCopy);
    document.addEventListener('paste', blockCopy);
    document.addEventListener('cut',   blockCopy);
    document.addEventListener('contextmenu', blockRightClick);
    return () => {
      document.removeEventListener('copy',  blockCopy);
      document.removeEventListener('paste', blockCopy);
      document.removeEventListener('cut',   blockCopy);
      document.removeEventListener('contextmenu', blockRightClick);
    };
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const streakUser = await getStreakUser(uid);
      if (!isAdmin && !streakUser?.purchased && !localStorage.getItem(`streak_purchased_${uid}`)) {
        setCurrentPage('streak');
        return;
      }
      if (!streakUser) await createStreakUser(uid, user.email, user.displayName);
      const [days, price, rank, rivalData] = await Promise.all([
        getAllDays(uid),
        getRestorePrice(),
        getUserRank(uid),
        getUserRival(uid),
      ]);
      setResults(days);
      setRestorePrice(price);
      setUserRank(rank);
      setRival(rivalData);
      setTopicMastery(getTopicMastery(days));
      setStreakUserData(streakUser);
      computeTodayInfo(days, streakUser);

      const state = await getStreakState(uid);
      setStreakState(state);

      if (state === 'broken' && !isAdmin) {
        setScreen('restore');
      }
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

  // ── Load Content ──────────────────────────────────────────────────────────
  const loadContent = useCallback(async () => {
    if (!todayInfo) return;

    // Window check for normal users
    if (!isAdmin && !isPracticeWindowOpen()) {
      setScreen('locked');
      return;
    }

    setScreen('loading');
    try {
      let content = null;

      if (isAdmin) {
        // Admin always gets fresh AI questions — never cached
        content = await generateQuestions(todayInfo.topic, todayInfo.level);
      } else {
        // Normal user: try Firebase cache first
        content = await getTodayQuestions(todayInfo.dayNum);

        if (!content || !content.questions || content.questions.length < 10) {
          // First user of the day — generate and save for everyone
          content = await generateQuestions(todayInfo.topic, todayInfo.level);
          await saveTodayQuestions(todayInfo.dayNum, content, todayInfo.topic, todayInfo.level);
        }
      }

      // Limit to 15 questions
      if (content.questions && content.questions.length > TOTAL_QUESTIONS) {
        content.questions = content.questions.slice(0, TOTAL_QUESTIONS);
      }

      setTopicContent(content);
      setQuestions(content.questions || []);
      // Go directly to quiz — no theory screen
      setCurrent(0); setSelected(null); setCodeAns('');
      setSubmitted(false); setSkipped(false);
      setScore(0); setAnswers([]); setWrongExplain('');
      setTabWarnings(0); setDisqualified(false);
      tabWarningsRef.current = 0;
      isQuizActive.current   = true;
      setScreen('quiz');
    } catch (e) {
      console.error(e);
      window.showToast?.('Failed to load content. Please try again!', 'error');
      setScreen('home');
    }
  }, [todayInfo, isAdmin]);

  // ── Start Quiz ────────────────────────────────────────────────────────────
  const startQuiz = () => {
    setCurrent(0); setSelected(null); setCodeAns('');
    setSubmitted(false); setSkipped(false);
    setScore(0); setAnswers([]); setWrongExplain('');
    setTabWarnings(0); setDisqualified(false);
    setSessionXP(0); setXpPopups([]); setConsecutiveCorrect(0);
    setShowOnFire(false); setNewBadgesEarned([]);
    tabWarningsRef.current = 0;
    isQuizActive.current   = true;
    practiceStartTime.current = Date.now();
    setScreen('quiz');
  };

  // XP popup trigger
  const triggerXpPopup = (value) => {
    const id = Date.now() + Math.random();
    setXpPopups(prev => [...prev, { id, value }]);
    setTimeout(() => setXpPopups(prev => prev.filter(p => p.id !== id)), 1200);
  };

  // ── Submit Answer ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (disqualified) return;
    const q     = questions[current];
    const isMCQ = q.type === 'MCQ' || q.type === 'OUTPUT';
    if (isMCQ && !selected) return;
    if (!isMCQ && !codeAns.trim()) return;

    const userAns  = isMCQ ? selected : codeAns;
    let isCorrect  = false;

    if (isMCQ) {
      isCorrect = selected === q.answer;
    } else {
      const ua  = codeAns.toLowerCase().replace(/\s+/g, ' ').trim();
      const ans = (q.answer || '').toLowerCase().replace(/\s+/g, ' ').trim();
      isCorrect = ua.includes(ans.slice(0, 20)) || ans.includes(ua.slice(0, 20));
    }

    setAnswers(a => [...a, { type:q.type, q:q.q, selected:userAns, correct:q.answer, isCorrect, skipped:false }]);

    if (isCorrect) {
      setScore(s => s + 1);
      setSessionXP(x => x + XP_VALUES.CORRECT_ANSWER);
      triggerXpPopup(XP_VALUES.CORRECT_ANSWER);
      // Consecutive correct tracking
      setConsecutiveCorrect(c => {
        const next = c + 1;
        if (next >= 3) setShowOnFire(true);
        return next;
      });
    } else {
      setConsecutiveCorrect(0);
      setShowOnFire(false);
    }

    setSubmitted(true);

    if (!isCorrect) {
      setLoadingExpl(true);
      setWrongExplain('');
      try {
        const expl = await getWrongExplanation(q.q, userAns, q.answer, todayInfo?.topic || '');
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
    setConsecutiveCorrect(0); setShowOnFire(false);
  };

  const handleNext = async () => {
    if (current + 1 >= questions.length || disqualified) {
      isQuizActive.current = false;
      const finalAnswers   = disqualified ? answers : [...answers];
      const finalScore     = finalAnswers.filter(a => a.isCorrect).length;
      const durationSecs   = practiceStartTime.current
        ? Math.round((Date.now() - practiceStartTime.current) / 1000)
        : null;
      const practiceHour   = new Date().getHours();

      const result = {
        date:            today,
        day:             todayInfo?.dayNum || results.length + 1,
        topic:           todayInfo?.topic  || '',
        level:           todayInfo?.level  || '',
        score:           disqualified ? 0 : finalScore,
        total:           questions.length,
        skipped:         finalAnswers.filter(a => a.skipped).length,
        pct:             disqualified ? 0 : Math.round((finalScore / questions.length) * 100),
        disqualified,
        durationSeconds: durationSecs,
        practiceHour,
      };

      const saveResult = await saveDay(uid, result);
      if (saveResult?.newBadges?.length) {
        setNewBadgesEarned(saveResult.newBadges);
      }

      const updated = await getAllDays(uid);
      setResults(updated);
      computeTodayInfo(updated, { startDate: today });

      // Refresh rank
      const [newRank, newRival] = await Promise.all([getUserRank(uid), getUserRival(uid)]);
      setUserRank(newRank);
      setRival(newRival);
      setTopicMastery(getTopicMastery(updated));

      // Milestone confetti
      const dayNum = todayInfo?.dayNum || updated.length;
      if ([7, 14, 21, 30].includes(dayNum) || result.score === result.total) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }

      if (updated.length >= 30) {
        setTimeout(async () => {
          makePDF(userName, updated);
          setTimeout(async () => {
            await resetStreak(uid);
            window.showToast?.('30 days complete! New cycle started!', 'success');
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

  // ── Restore Streak ────────────────────────────────────────────────────────
  const handleRestore = async () => {
    setRestoring(true);
    const ok = await restoreStreak(uid);
    if (ok) {
      setStreakState('safe');
      window.showToast?.('Streak restored successfully!', 'success');
      setScreen('home');
      await init();
    } else {
      window.showToast?.('Restore failed. Please try again.', 'error');
    }
    setRestoring(false);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const cardBg      = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border      = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
  const textPrimary = isDark ? '#f0f2ff' : '#111827';
  const textSec     = isDark ? '#8b93a8' : '#6b7280';
  const pageBg      = isDark ? 'linear-gradient(160deg,#060b14,#0d1117)' : 'linear-gradient(160deg,#f5f7ff,#ffffff)';
  const codeBg      = '#1e1e2e';

  const wrap = (children, maxW = '700px') => (
    <div style={{ minHeight:'100vh', background:pageBg, fontFamily:"'Syne',sans-serif", color:textPrimary, paddingTop:mobile?'80px':'100px', paddingBottom:'60px', paddingLeft:mobile?'16px':'24px', paddingRight:mobile?'16px':'24px', boxSizing:'border-box' }}>
      <div style={{ maxWidth:maxW, margin:'0 auto' }}>{children}</div>
    </div>
  );

  const alreadyDoneToday = isAdmin ? false : results.some(r => r.date === today);
  const totalDays        = results.length;
  const avgScore         = totalDays ? Math.round(results.reduce((a, r) => a + (r.pct || 0), 0) / totalDays) : 0;

  // ── Loading Init ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:'100vh', background:pageBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", flexDirection:'column', gap:'14px' }}>
      <div style={{ animation:'spin 1.5s linear infinite' }}>
        <PythonLogo size={56} />
      </div>
      <div style={{ color:textPrimary, fontWeight:'700' }}>Loading your progress...</div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: RESTORE (streak broken)
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'restore') return wrap(
    <>
      <div style={{ textAlign:'center', marginBottom:'24px' }}>
        <div style={{ fontSize:'3rem', marginBottom:'8px' }}>😢</div>
        <h1 style={{ fontSize:mobile?'1.5rem':'2rem', fontWeight:'900', margin:'0 0 6px', color:'#ef4444' }}>
          Your Streak Broke!
        </h1>
        <p style={{ color:textSec, fontSize:'0.85rem', margin:0 }}>
          You missed a day — but you can restore your streak
        </p>
      </div>

      {/* Streak count */}
      <div style={{ background:cardBg, border:'2px solid rgba(239,68,68,0.3)', borderRadius:'20px', padding:'28px', textAlign:'center', marginBottom:'20px' }}>
        <div style={{ fontSize:'3.5rem', fontWeight:'900', color:'#ef4444', marginBottom:'4px' }}>
          {totalDays}
        </div>
        <div style={{ color:textSec, fontSize:'0.9rem', marginBottom:'20px' }}>
          days of streak at risk
        </div>

        {/* Restore option */}
        <div style={{ background:isDark?'rgba(255,107,0,0.1)':'rgba(255,107,0,0.06)', border:'2px solid rgba(255,107,0,0.3)', borderRadius:'16px', padding:'20px', marginBottom:'16px' }}>
          <div style={{ fontWeight:'800', fontSize:'1rem', marginBottom:'4px' }}>
            🛡️ Restore Your Streak
          </div>
          <div style={{ color:textSec, fontSize:'0.82rem', marginBottom:'16px' }}>
            Pay Rs.{restorePrice} to continue from where you left off
          </div>
          <button
            onClick={handleRestore}
            disabled={restoring}
            style={{ width:'100%', padding:'14px', background:restoring?'#6b7280':'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'1rem', fontWeight:'800', cursor:restoring?'wait':'pointer', boxShadow:'0 8px 25px rgba(255,107,0,0.4)' }}
          >
            {restoring ? '⏳ Restoring...' : `🔥 Restore Streak — Rs.${restorePrice}`}
          </button>
        </div>

        <button
          onClick={() => setScreen('home')}
          style={{ width:'100%', padding:'12px', background:'transparent', color:textSec, border:`1px solid ${border}`, borderRadius:'12px', fontSize:'0.88rem', fontWeight:'700', cursor:'pointer' }}
        >
          Start Over from Day 1
        </button>
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: LOCKED (outside 6AM-11PM)
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'locked' || (!isAdmin && !windowOpen && screen === 'home')) {
    const isBeforeOpen = new Date().getHours() < 6;
    return wrap(
      <>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'3rem', marginBottom:'12px' }}>{isBeforeOpen ? '🌙' : '🌛'}</div>
          <h1 style={{ fontSize:mobile?'1.5rem':'2rem', fontWeight:'900', margin:'0 0 8px' }}>
            {isBeforeOpen ? 'Practice Opens at 6:00 AM' : 'Practice Closed for Today'}
          </h1>
          <p style={{ color:textSec, fontSize:'0.85rem' }}>
            {isBeforeOpen
              ? 'Come back in the morning to start your daily practice'
              : "Today's window has closed — see you tomorrow at 6:00 AM"}
          </p>
        </div>

        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:'32px', textAlign:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'0.75rem', color:textSec, fontWeight:'600', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px' }}>
            {isBeforeOpen ? 'Opens In' : 'Next Session In'}
          </div>
          <div style={{ fontFamily:'"Fira Code",monospace', fontSize:mobile?'2rem':'2.8rem', fontWeight:'900', color:'#ff6b00', letterSpacing:'4px' }}>
            {countdown}
          </div>
          <div style={{ marginTop:'16px', fontSize:'0.78rem', color:textSec }}>
            Practice Window: 6:00 AM – 11:00 PM daily
          </div>
        </div>

        {/* Today stats still visible */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
          {[
            { label:'Day',       value:`${todayInfo?.dayNum||1}/30`, color:'#ff6b00' },
            { label:'Sessions',  value:totalDays,                    color:'#6366f1' },
            { label:'Avg Score', value:totalDays?`${avgScore}%`:'—', color:'#22c55e' },
          ].map((s, i) => (
            <div key={i} style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px', textAlign:'center' }}>
              <div style={{ fontSize:'1.4rem', fontWeight:'900', color:s.color }}>{s.value}</div>
              <div style={{ fontSize:'0.68rem', color:textSec, marginTop:'2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: HOME
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'home') return wrap(
    <>
      <div style={{ textAlign:'center', marginBottom:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'8px' }}>
          <PythonLogo size={40} />
        </div>
        <h1 style={{ fontSize:mobile?'1.5rem':'2rem', fontWeight:'900', margin:'0 0 4px', background:'linear-gradient(135deg,#ff6b00,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          Daily Python Practice
        </h1>
        <p style={{ color:textSec, fontSize:'0.85rem', margin:0 }}>
          Zehra AI — Learn daily, master Python in 30 days
        </p>
      </div>

      {/* Stats — 6 cards including XP and Rank */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${mobile?'3':'6'},1fr)`, gap:'8px', marginBottom:'18px' }}>
        {[
          { label:'Day',      value:`${todayInfo?.dayNum||1}/30`,                              color:'#ff6b00' },
          { label:'Sessions', value:totalDays,                                                  color:'#6366f1' },
          { label:'Avg',      value:totalDays?`${avgScore}%`:'—',                              color:'#22c55e' },
          { label:'XP',       value:streakUserData?.totalXP||0,                                color:'#f59e0b' },
          { label:'Rank',     value:userRank?`#${userRank}`:'—',                               color:'#ec4899' },
          { label:'Badges',   value:(streakUserData?.badges||[]).length,                       color:'#10b981' },
        ].map((s, i) => (
          <div key={i} style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'12px', padding:'12px 6px', textAlign:'center' }}>
            <div style={{ fontSize:mobile?'1rem':'1.3rem', fontWeight:'900', color:s.color }}>{s.value}</div>
            <div style={{ fontSize:'0.6rem', color:textSec, marginTop:'2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Rank card — rival motivation */}
      {userRank && rival && (
        <div style={{ background:isDark?'rgba(236,72,153,0.08)':'rgba(236,72,153,0.05)', border:'1px solid rgba(236,72,153,0.2)', borderRadius:'14px', padding:'12px 16px', marginBottom:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
          <div>
            <div style={{ fontSize:'0.72rem', color:'#ec4899', fontWeight:'800', marginBottom:'2px' }}>YOUR RIVAL — #{userRank - 1}</div>
            <div style={{ fontWeight:'700', fontSize:'0.9rem' }}>{rival.name} • {rival.city}</div>
            <div style={{ fontSize:'0.7rem', color:textSec }}>Beat them: {rival.avgScore}% avg • {rival.totalDays} days</div>
          </div>
          <div style={{ fontSize:'1.5rem' }}>⚔️</div>
        </div>
      )}

      {/* Top 12% badge if rank is good */}
      {userRank && userRank <= 20 && (
        <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'12px', padding:'10px 16px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'1.2rem' }}>🌟</span>
          <span style={{ fontSize:'0.82rem', color:'#22c55e', fontWeight:'700' }}>
            You are in the TOP {Math.round((userRank / Math.max(totalDays * 5, 20)) * 100)}% of all challengers!
          </span>
        </div>
      )}

      {/* Badges earned */}
      {(streakUserData?.badges||[]).length > 0 && (
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px 16px', marginBottom:'14px' }}>
          <div style={{ fontSize:'0.72rem', color:textSec, fontWeight:'700', marginBottom:'8px' }}>YOUR BADGES</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {(streakUserData.badges||[]).map(bid => {
              const badge = BADGES.find(b => b.id === bid);
              if (!badge) return null;
              return (
                <div key={bid} title={badge.desc} style={{ background:isDark?'rgba(255,255,255,0.06)':'#f1f5f9', border:`1px solid ${border}`, borderRadius:'20px', padding:'4px 10px', fontSize:'0.72rem', fontWeight:'700', display:'flex', alignItems:'center', gap:'4px' }}>
                  <span>{badge.icon}</span>
                  {!mobile && <span style={{ color:textPrimary }}>{badge.name}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Topic mastery — top 3 */}
      {topicMastery.length > 0 && (
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px 16px', marginBottom:'14px' }}>
          <div style={{ fontSize:'0.72rem', color:textSec, fontWeight:'700', marginBottom:'10px' }}>TOPIC MASTERY</div>
          {topicMastery.slice(0, 3).map((t, i) => (
            <div key={i} style={{ marginBottom:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                <span style={{ fontSize:'0.75rem', fontWeight:'600' }}>Day {results.find(r=>r.topic===t.topic)?.day || '?'}</span>
                <span style={{ fontSize:'0.75rem', fontWeight:'800', color:t.mastery>=70?'#22c55e':t.mastery>=50?'#f59e0b':'#ef4444' }}>{t.mastery}%</span>
              </div>
              <div style={{ height:'4px', background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb', borderRadius:'4px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${t.mastery}%`, background:t.mastery>=70?'#22c55e':t.mastery>=50?'#f59e0b':'#ef4444', borderRadius:'4px', transition:'width 0.6s' }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin badge */}
      {isAdmin && (
        <div style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:'12px', padding:'10px 16px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
          <span>🛡️</span>
          <span style={{ fontSize:'0.82rem', color:'#6366f1', fontWeight:'700' }}>Admin Mode — 24/7 access, unlimited attempts, fresh AI questions</span>
        </div>
      )}

      {/* Today info — day + level only, no topic */}
      {todayInfo && (
        <div style={{ background:isDark?'linear-gradient(135deg,rgba(255,107,0,0.12),rgba(99,102,241,0.08))':'linear-gradient(135deg,rgba(255,107,0,0.07),rgba(99,102,241,0.05))', border:`1px solid ${isDark?'rgba(255,107,0,0.25)':'rgba(255,107,0,0.2)'}`, borderRadius:'18px', padding:'18px', marginBottom:'16px' }}>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ background:'rgba(255,107,0,0.15)', border:'1px solid rgba(255,107,0,0.3)', color:'#ff6b00', padding:'3px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'800' }}>
              Day {todayInfo.dayNum} / 30
            </span>
            <span style={{ background:isDark?'rgba(255,255,255,0.06)':'#f1f5f9', color:textSec, padding:'3px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'700' }}>
              {todayInfo.level}
            </span>
            <span style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'#6366f1', padding:'3px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'700' }}>
              {TOTAL_QUESTIONS} Questions
            </span>
          </div>
          {/* Window close countdown for normal users */}
          {!isAdmin && windowOpen && (
            <div style={{ marginTop:'10px', fontSize:'0.72rem', color:'#f59e0b', fontWeight:'700' }}>
              ⏰ Window closes in {closeCountdown}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {alreadyDoneToday ? (
        <div style={{ background:isDark?'rgba(255,107,0,0.08)':'rgba(255,107,0,0.05)', border:'2px solid rgba(255,107,0,0.2)', borderRadius:'18px', padding:'22px', textAlign:'center', marginBottom:'16px' }}>
          <div style={{ fontSize:'2rem', marginBottom:'8px' }}>✅</div>
          <div style={{ fontWeight:'900', fontSize:'1rem', marginBottom:'6px' }}>Practice done for today!</div>
          <div style={{ color:textSec, fontSize:'0.82rem', marginBottom:'14px' }}>
            Come back tomorrow at 6:00 AM for Day {(todayInfo?.dayNum||1)+1}
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:isDark?'rgba(0,0,0,0.2)':'rgba(0,0,0,0.05)', borderRadius:'12px', padding:'10px 18px' }}>
            <span>🔒</span>
            <span style={{ fontFamily:'"Fira Code",monospace', fontSize:'1.1rem', fontWeight:'900', color:'#ff6b00', letterSpacing:'2px' }}>
              {countdown}
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={loadContent}
          style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'1.05rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 10px 28px rgba(255,107,0,0.4)', marginBottom:'16px' }}
        >
          🚀 Start Today's Practice
        </button>
      )}

      {/* PDF progress or download */}
      {totalDays >= 30 ? (
        <button
          onClick={() => makePDF(userName, results)}
          style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'0.95rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 8px 20px rgba(34,197,94,0.4)', marginBottom:'16px' }}
        >
          🎉 Download Your 30-Day PDF Report
        </button>
      ) : (
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px 16px', marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
            <span style={{ fontWeight:'700', fontSize:'0.88rem' }}>PDF Report Progress</span>
            <span style={{ fontSize:'0.78rem', color:'#ff6b00', fontWeight:'800' }}>{totalDays}/30</span>
          </div>
          <div style={{ height:'6px', background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb', borderRadius:'10px', overflow:'hidden', marginBottom:'6px' }}>
            <div style={{ height:'100%', width:`${Math.min((totalDays/30)*100,100)}%`, background:'linear-gradient(90deg,#ff6b00,#f59e0b)', borderRadius:'10px' }}/>
          </div>
          <div style={{ fontSize:'0.72rem', color:textSec }}>{30-totalDays} more days to unlock PDF</div>
        </div>
      )}

      {/* 30-Day Roadmap */}
      <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'16px', overflow:'hidden', marginBottom:'16px' }}>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${border}`, fontWeight:'800', fontSize:'0.88rem' }}>
          🗺️ 30-Day Roadmap
        </div>
        <div style={{ maxHeight:'260px', overflowY:'auto' }}>
          {CURRICULUM.map((c, i) => {
            const done    = results.some(r => r.day === c.day);
            const isToday = todayInfo?.dayNum === c.day;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 16px', borderBottom:i<29?`1px solid ${border}`:'none', background:isToday?(isDark?'rgba(255,107,0,0.08)':'rgba(255,107,0,0.04)'):'' }}>
                <span style={{ fontSize:'0.9rem' }}>{done?'✅':isToday?'🔥':'⭕'}</span>
                <span style={{ fontSize:'0.72rem', color:isToday?'#ff6b00':done?'#22c55e':textSec, fontWeight:isToday?'800':'600' }}>
                  Day {c.day}
                </span>
                <span style={{ marginLeft:'auto', fontSize:'0.62rem', color:textSec, background:isDark?'rgba(255,255,255,0.05)':'#f1f5f9', padding:'2px 8px', borderRadius:'10px' }}>
                  {c.level}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      {results.length > 0 && (
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'16px', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${border}`, fontWeight:'800', fontSize:'0.88rem' }}>
            Recent Sessions
          </div>
          {results.slice(-5).reverse().map((r, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:i<4?`1px solid ${border}`:'none' }}>
              <div>
                <div style={{ fontWeight:'700', fontSize:'0.82rem' }}>Day {r.day}</div>
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

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: LOADING CONTENT
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'loading') return (
    <div style={{ minHeight:'100vh', background:pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", gap:'14px', padding:'24px', textAlign:'center' }}>
      <div style={{ animation:'spin 1.5s linear infinite' }}>
        <PythonLogo size={56} />
      </div>
      <div style={{ fontWeight:'800', fontSize:'1.05rem', color:textPrimary }}>
        {isAdmin ? 'Generating fresh questions...' : 'Loading today\'s practice...'}
      </div>
      <div style={{ color:textSec, fontSize:'0.82rem' }}>{todayInfo?.level} • Day {todayInfo?.dayNum}</div>
      {!isAdmin && (
        <div style={{ color:textSec, fontSize:'0.75rem', marginTop:'4px' }}>
          First visit today? AI generates content → saved for all users
        </div>
      )}
      <div style={{ display:'flex', gap:'6px', marginTop:'4px' }}>
        {[0,1,2].map(i => <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ff6b00', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: THEORY
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'theory' && topicContent) {
    const theoryLines = (topicContent.theory || '').split('\n').filter(l => l.trim());
    const examples    = topicContent.codeExamples || [];
    const totalPages  = 1 + examples.length;
    const isLastPage  = theoryPage >= totalPages - 1;

    return wrap(
      <>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <div>
            <span style={{ background:'rgba(255,107,0,0.15)', border:'1px solid rgba(255,107,0,0.3)', color:'#ff6b00', padding:'3px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'800' }}>
              Theory — Day {todayInfo?.dayNum}
            </span>
            <div style={{ fontWeight:'900', fontSize:'1rem', marginTop:'6px' }}>{todayInfo?.topic}</div>
          </div>
          <div style={{ textAlign:'right', fontSize:'0.72rem', color:textSec }}>
            {theoryPage+1} / {totalPages}
          </div>
        </div>

        <div style={{ display:'flex', gap:'6px', marginBottom:'16px' }}>
          {Array.from({length:totalPages}).map((_, i) => (
            <div key={i} style={{ flex:1, height:'4px', borderRadius:'4px', background:i<=theoryPage?'#ff6b00':(isDark?'rgba(255,255,255,0.1)':'#e5e7eb'), transition:'background 0.3s' }}/>
          ))}
        </div>

        {theoryPage === 0 && (
          <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:mobile?'18px':'26px', marginBottom:'16px' }}>
            <div style={{ fontSize:'0.72rem', color:'#ff6b00', fontWeight:'800', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              What is {todayInfo?.topic}?
            </div>
            {theoryLines.map((line, i) => (
              <p key={i} style={{ fontSize:mobile?'0.88rem':'0.94rem', lineHeight:'1.8', color:textPrimary, margin:'0 0 10px' }}>
                {line}
              </p>
            ))}
          </div>
        )}

        {theoryPage > 0 && examples[theoryPage - 1] && (
          <div style={{ marginBottom:'16px' }}>
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:mobile?'16px':'22px', marginBottom:'12px' }}>
              <div style={{ fontSize:'0.72rem', color:'#10b981', fontWeight:'800', marginBottom:'8px', textTransform:'uppercase' }}>
                Code Example {theoryPage}
              </div>
              <div style={{ fontWeight:'700', fontSize:'0.95rem', marginBottom:'12px' }}>
                {examples[theoryPage-1].title}
              </div>
              <div style={{ background:codeBg, borderRadius:'12px', padding:'14px 16px', marginBottom:'12px', position:'relative' }}>
                <div style={{ position:'absolute', top:'10px', right:'12px', display:'flex', gap:'5px' }}>
                  {['#ff5f57','#ffbd2e','#28c840'].map((c,i)=><div key={i} style={{width:'9px',height:'9px',borderRadius:'50%',background:c}}/>)}
                </div>
                <pre style={{ margin:0, color:'#f1f5f9', fontFamily:'"Fira Code","Courier New",monospace', fontSize:mobile?'0.78rem':'0.88rem', lineHeight:'1.7', whiteSpace:'pre-wrap', paddingTop:'4px' }}>
                  {examples[theoryPage-1].code}
                </pre>
              </div>
              {examples[theoryPage-1].output && (
                <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'0.65rem', color:'#10b981', fontWeight:'800', marginBottom:'4px' }}>OUTPUT</div>
                  <code style={{ fontFamily:'"Fira Code",monospace', fontSize:'0.85rem', color:'#10b981' }}>
                    {examples[theoryPage-1].output}
                  </code>
                </div>
              )}
              <div style={{ background:isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'10px', padding:'10px 14px' }}>
                <div style={{ fontSize:'0.65rem', color:'#6366f1', fontWeight:'800', marginBottom:'4px' }}>EXPLANATION</div>
                <div style={{ fontSize:'0.85rem', color:textSec, lineHeight:'1.6' }}>
                  {examples[theoryPage-1].explanation}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:'10px' }}>
          {theoryPage > 0 && (
            <button onClick={() => setTheoryPage(p=>p-1)} style={{ padding:'13px 20px', background:'transparent', border:`1px solid ${border}`, borderRadius:'12px', color:textSec, fontSize:'0.9rem', fontWeight:'700', cursor:'pointer' }}>
              ← Back
            </button>
          )}
          {!isLastPage ? (
            <button onClick={() => setTheoryPage(p=>p+1)} style={{ flex:1, padding:'14px', background:'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 6px 20px rgba(255,107,0,0.35)' }}>
              Next →
            </button>
          ) : (
            <button onClick={startQuiz} style={{ flex:1, padding:'14px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 6px 20px rgba(99,102,241,0.4)' }}>
              Start Practice ({questions.length} Questions) →
            </button>
          )}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: QUIZ
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'quiz' && questions.length > 0) {
    const q     = questions[current];
    const isMCQ = q.type === 'MCQ' || q.type === 'OUTPUT';
    const ts    = TS[q.type] || TS.MCQ;
    const can   = isMCQ ? !!selected : !!codeAns.trim();

    // ── WATERMARK — quiz screen only ─────────────────────────────────────────
    const watermarkText = `${userName} • ${(user?.phoneNumber || user?.email || '').slice(-4)} • Zehra AI`;

    return (
      <div style={{ minHeight:'100vh', background:pageBg, fontFamily:"'Syne',sans-serif", color:textPrimary, paddingTop:mobile?'80px':'100px', paddingBottom:'40px', paddingLeft:mobile?'14px':'24px', paddingRight:mobile?'14px':'24px', boxSizing:'border-box', position:'relative', userSelect:'none', WebkitUserSelect:'none', MozUserSelect:'none' }}>

        {/* ── CONFETTI OVERLAY ── */}
        {showConfetti && (
          <div aria-hidden="true" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:10000, overflow:'hidden' }}>
            {Array.from({length:60}).map((_, i) => (
              <div key={i} style={{
                position:'absolute',
                left:`${Math.random()*100}%`,
                top:`-${Math.random()*20}%`,
                width:`${6+Math.random()*8}px`,
                height:`${6+Math.random()*8}px`,
                background:['#ff6b00','#f59e0b','#22c55e','#6366f1','#ec4899','#10b981'][Math.floor(Math.random()*6)],
                borderRadius:Math.random()>0.5?'50%':'2px',
                animation:`confettiFall ${1.5+Math.random()*2}s linear ${Math.random()*0.5}s forwards`,
              }}/>
            ))}
          </div>
        )}

        {/* ── XP POPUP FLOATS ── */}
        <div aria-hidden="true" style={{ position:'fixed', top:'30%', right:'20px', zIndex:9998, pointerEvents:'none' }}>
          {xpPopups.map(p => (
            <div key={p.id} style={{ fontSize:'1.1rem', fontWeight:'900', color:'#f59e0b', animation:'xpFloat 1.2s ease-out forwards', marginBottom:'4px' }}>
              +{p.value} XP
            </div>
          ))}
        </div>

        {/* ── ON FIRE BANNER ── */}
        {showOnFire && !submitted && (
          <div style={{ position:'fixed', top: mobile?'70px':'80px', left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#ff6b00,#f59e0b)', color:'#fff', padding:'8px 20px', borderRadius:'30px', fontSize:'0.85rem', fontWeight:'900', zIndex:9997, boxShadow:'0 4px 20px rgba(255,107,0,0.5)', whiteSpace:'nowrap' }}>
            🔥 On Fire! {consecutiveCorrect} in a row!
          </div>
        )}

        {/* ── SESSION XP BAR ── */}
        <div style={{ position:'fixed', top:mobile?'56px':'64px', left:0, right:0, height:'3px', background:isDark?'rgba(255,255,255,0.06)':'#e5e7eb', zIndex:9996 }}>
          <div style={{ height:'100%', width:`${Math.min((sessionXP / 100) * 100, 100)}%`, background:'linear-gradient(90deg,#f59e0b,#ff6b00)', transition:'width 0.4s ease' }}/>
        </div>

        {/* ── INVISIBLE WATERMARK ── */}
        <div aria-hidden="true" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:9999, overflow:'hidden' }}>
          {Array.from({length:12}).map((_, i) => (
            <div key={i} style={{ position:'absolute', left:`${(i % 4) * 28}%`, top:`${Math.floor(i / 4) * 36}%`, transform:'rotate(-35deg)', fontSize:mobile?'11px':'13px', fontWeight:'700', color:isDark?'rgba(255,255,255,0.045)':'rgba(0,0,0,0.045)', whiteSpace:'nowrap', letterSpacing:'1px', fontFamily:'monospace' }}>
              {watermarkText}
            </div>
          ))}
        </div>

        <div style={{ maxWidth:'700px', margin:'0 auto' }}>

          {/* Disqualified banner */}
          {disqualified && (
            <div style={{ background:'rgba(239,68,68,0.12)', border:'2px solid rgba(239,68,68,0.4)', borderRadius:'16px', padding:'16px 20px', marginBottom:'16px', textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:'4px' }}>❌</div>
              <div style={{ fontWeight:'900', color:'#ef4444', fontSize:'1rem' }}>Disqualified!</div>
              <div style={{ color:textSec, fontSize:'0.82rem', marginTop:'4px' }}>
                You switched tabs 3 times. Your score has been marked as 0.
              </div>
              <button onClick={handleNext} style={{ marginTop:'12px', padding:'10px 24px', background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.9rem', fontWeight:'800', cursor:'pointer' }}>
                See Result
              </button>
            </div>
          )}

          {/* Tab warning banner */}
          {tabWarnings > 0 && !disqualified && (
            <div style={{ background:'rgba(245,158,11,0.12)', border:'2px solid rgba(245,158,11,0.4)', borderRadius:'12px', padding:'10px 16px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'1.2rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight:'800', color:'#f59e0b', fontSize:'0.88rem' }}>
                  Tab Switch Warning {tabWarnings}/3
                </div>
                <div style={{ fontSize:'0.72rem', color:textSec }}>
                  {3 - tabWarnings} more switches will disqualify you!
                </div>
              </div>
            </div>
          )}

          {!disqualified && (
            <>
              {/* Top bar */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', gap:'8px' }}>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ background:ts.bg, border:`1px solid ${ts.border}`, color:ts.color, padding:'3px 10px', borderRadius:'20px', fontSize:'0.68rem', fontWeight:'800' }}>{ts.label}</span>
                  <span style={{ background:isDark?'rgba(255,255,255,0.05)':'#f1f5f9', color:textSec, padding:'3px 10px', borderRadius:'20px', fontSize:'0.65rem', fontWeight:'600' }}>
                    Day {todayInfo?.dayNum} / 30
                  </span>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:'800', fontSize:'0.9rem' }}>{current+1}/{questions.length}</div>
                  <div style={{ fontSize:'0.68rem', color:textSec }}>Score: {score}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height:'5px', background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb', borderRadius:'10px', marginBottom:'14px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(current/questions.length)*100}%`, background:'linear-gradient(90deg,#ff6b00,#f59e0b)', borderRadius:'10px', transition:'width 0.4s' }}/>
              </div>

              {/* Question card */}
              <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:mobile?'18px 16px':'24px', marginBottom:'12px', boxShadow:'0 6px 20px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize:mobile?'0.95rem':'1.05rem', fontWeight:'700', lineHeight:'1.65', margin:'0 0 14px' }}>
                  {q.q}
                </p>

                {q.code && (
                  <div style={{ background:codeBg, borderRadius:'12px', padding:'14px', marginBottom:'14px', fontFamily:'"Fira Code","Consolas",monospace', fontSize:mobile?'0.78rem':'0.86rem', color:'#d4d4d4', lineHeight:'1.6', overflowX:'auto', whiteSpace:'pre', position:'relative' }}>
                    <div style={{ position:'absolute', top:'8px', right:'10px', display:'flex', gap:'4px' }}>
                      {['#ff5f57','#ffbd2e','#28c840'].map((c,i)=><div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:c}}/>)}
                    </div>
                    <div style={{ paddingTop:'4px' }}>{q.code}</div>
                  </div>
                )}

                {isMCQ && q.options && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {q.options.map((opt, i) => {
                      let bg = isDark?'rgba(255,255,255,0.04)':'#f9fafb', bc = isDark?'rgba(255,255,255,0.08)':'#e5e7eb', color = textPrimary;
                      if (submitted) {
                        if (opt === q.answer)       { bg='rgba(34,197,94,0.15)';  bc='#22c55e'; color='#22c55e'; }
                        else if (opt === selected)  { bg='rgba(239,68,68,0.1)';   bc='#ef4444'; color='#ef4444'; }
                      } else if (selected === opt) { bg='rgba(255,107,0,0.12)';  bc='#ff6b00'; color='#ff6b00'; }
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

                {!isMCQ && (
                  <>
                    <div style={{ fontSize:'0.72rem', color:textSec, marginBottom:'6px', fontWeight:'600' }}>
                      {q.type==='CODE'&&'Write your Python code:'}
                      {q.type==='FILL'&&'Fill in the blank:'}
                      {q.type==='DEBUG'&&'Describe the bug and fix:'}
                    </div>
                    <textarea
                      value={codeAns}
                      onChange={e => !submitted && setCodeAns(e.target.value)}
                      readOnly={submitted}
                      onCopy={e => e.preventDefault()}
                      onPaste={e => e.preventDefault()}
                      onCut={e => e.preventDefault()}
                      placeholder={q.type==='CODE'?'def solution():\n    pass':q.type==='FILL'?'Type the missing value...':'Describe the bug and write the fix...'}
                      rows={q.type==='CODE'?6:3}
                      style={{ width:'100%', boxSizing:'border-box', background:submitted?(isDark?'rgba(255,255,255,0.03)':'#f9fafb'):(isDark?'#1e1e2e':'#f9fafb'), border:`2px solid ${submitted?'#f59e0b':codeAns?'#ff6b00':(isDark?'rgba(255,255,255,0.1)':'#e5e7eb')}`, borderRadius:'12px', padding:'12px', fontFamily:q.type==='CODE'?'"Fira Code",monospace':"'Syne',sans-serif", fontSize:mobile?'0.82rem':'0.86rem', lineHeight:'1.6', color:isDark?'#d4d4d4':'#111827', resize:'vertical', outline:'none' }}
                    />
                    {submitted && (
                      <div style={{ marginTop:'10px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'10px', padding:'10px 12px' }}>
                        <div style={{ fontSize:'0.68rem', color:'#22c55e', fontWeight:'800', marginBottom:'3px' }}>CORRECT ANSWER</div>
                        <div style={{ fontFamily:q.type==='CODE'?'"Fira Code",monospace':'inherit', fontSize:'0.82rem', color:isDark?'#d4d4d4':'#111827', whiteSpace:'pre-wrap', lineHeight:'1.6' }}>
                          {q.answer}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {submitted && skipped && (
                  <div style={{ marginTop:'12px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'10px', padding:'10px 12px' }}>
                    <div style={{ fontSize:'0.68rem', color:'#f59e0b', fontWeight:'800', marginBottom:'3px' }}>SKIPPED</div>
                    <div style={{ fontSize:'0.82rem', color:textSec }}>
                      Correct: <strong style={{ color:isDark?'#d4d4d4':'#111827' }}>{q.answer}</strong>
                    </div>
                  </div>
                )}

                {submitted && !skipped && selected === q.answer && (
                  <div style={{ marginTop:'12px', background:isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'10px', padding:'10px 12px' }}>
                    <div style={{ fontSize:'0.68rem', color:'#6366f1', fontWeight:'800', marginBottom:'3px' }}>EXPLANATION</div>
                    <div style={{ fontSize:'0.82rem', color:textSec, lineHeight:'1.5' }}>{q.explanation}</div>
                  </div>
                )}

                {submitted && !skipped && selected !== q.answer && (
                  <div style={{ marginTop:'12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'10px', padding:'12px 14px' }}>
                    <div style={{ fontSize:'0.68rem', color:'#ef4444', fontWeight:'800', marginBottom:'6px' }}>WHY YOU GOT IT WRONG</div>
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
                    <button onClick={handleSkip} style={{ padding:mobile?'13px 14px':'14px 18px', background:'transparent', border:`1px solid ${border}`, borderRadius:'12px', color:textSec, fontSize:'0.85rem', fontWeight:'700', cursor:'pointer', flexShrink:0 }}>
                      Skip
                    </button>
                    <button onClick={handleSubmit} disabled={!can || loadingExpl} style={{ flex:1, padding:'13px', background:can?'linear-gradient(135deg,#ff6b00,#ff3d00)':(isDark?'#1f2937':'#e5e7eb'), color:can?'#fff':textSec, border:'none', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'800', cursor:can?'pointer':'not-allowed' }}>
                      Submit Answer
                    </button>
                  </>
                ) : (
                  <button onClick={handleNext} disabled={loadingExpl} style={{ flex:1, padding:'13px', background:loadingExpl?'#6b7280':'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'800', cursor:loadingExpl?'wait':'pointer', boxShadow:'0 6px 20px rgba(99,102,241,0.4)' }}>
                    {loadingExpl ? 'Explaining...' : current+1>=questions.length ? 'See Results' : 'Next →'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <style>{`
          @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
          @keyframes xpFloat{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-60px)}}
          @keyframes confettiFall{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(100vh) rotate(720deg)}}
          @keyframes badgePopIn{0%{transform:scale(0) rotate(-10deg);opacity:0}70%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: RESULT
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'result') {
    const todayRes = results.find(r => r.date === today) || { score:0, total:questions.length, pct:0, skipped:0 };
    const pct      = todayRes.pct || 0;
    const isPerfect = pct === 100 && !todayRes.disqualified;
    const emoji    = todayRes.disqualified ? '❌' : isPerfect ? '🌟' : pct>=80?'🏆':pct>=60?'👍':pct>=40?'💪':'📚';
    const msg      = todayRes.disqualified ? 'Disqualified — Tab Switching Detected' : isPerfect ? 'Perfect Score! Flawless!' : pct>=80?'Outstanding!':pct>=60?'Good job!':pct>=40?'Keep going!':'Review this topic!';
    const doneAll  = results.length >= 30;
    const xpEarned = calculateSessionXP(todayRes.score || 0, todayRes.total || 15, todayInfo?.dayNum || 1);

    return wrap(
      <>
        {/* Confetti on result too for perfect/milestone */}
        {showConfetti && (
          <div aria-hidden="true" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:10000, overflow:'hidden' }}>
            {Array.from({length:80}).map((_, i) => (
              <div key={i} style={{ position:'absolute', left:`${Math.random()*100}%`, top:`-10%`, width:`${6+Math.random()*8}px`, height:`${6+Math.random()*8}px`, background:['#ff6b00','#f59e0b','#22c55e','#6366f1','#ec4899'][Math.floor(Math.random()*5)], borderRadius:Math.random()>0.5?'50%':'2px', animation:`confettiFall ${1.5+Math.random()*2}s linear ${Math.random()*0.5}s forwards` }}/>
            ))}
          </div>
        )}

        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'24px', padding:mobile?'28px 20px':'36px', textAlign:'center', marginBottom:'16px' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'8px', animation: isPerfect ? 'badgePopIn 0.6s ease forwards' : 'none' }}>{emoji}</div>
          <h2 style={{ fontSize:mobile?'1.3rem':'1.7rem', fontWeight:'900', margin:'0 0 4px', color:todayRes.disqualified?'#ef4444':isPerfect?'#f59e0b':textPrimary }}>{msg}</h2>
          <p style={{ color:textSec, fontSize:'0.82rem', margin:'0 0 16px' }}>Day {todayInfo?.dayNum} / 30 • {todayInfo?.level}</p>

          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:isDark?'rgba(255,107,0,0.12)':'rgba(255,107,0,0.08)', border:'2px solid rgba(255,107,0,0.25)', borderRadius:'20px', padding:'12px 24px', marginBottom:'14px' }}>
            <span style={{ fontSize:mobile?'2.5rem':'3rem', fontWeight:'900', background:'linear-gradient(135deg,#ff6b00,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {todayRes.disqualified ? '0' : todayRes.score}/{todayRes.total}
            </span>
            <span style={{ fontSize:'1rem', color:textSec, fontWeight:'700' }}>({pct}%)</span>
          </div>

          {/* XP earned this session */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'14px' }}>
            <div style={{ background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'20px', padding:'6px 16px', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'1rem' }}>⚡</span>
              <span style={{ fontWeight:'900', color:'#f59e0b', fontSize:'0.92rem' }}>+{xpEarned} XP earned</span>
            </div>
            {userRank && (
              <div style={{ background:'rgba(236,72,153,0.1)', border:'1px solid rgba(236,72,153,0.3)', borderRadius:'20px', padding:'6px 16px' }}>
                <span style={{ fontWeight:'900', color:'#ec4899', fontSize:'0.92rem' }}>Rank #{userRank}</span>
              </div>
            )}
          </div>

          {/* New badges earned */}
          {newBadgesEarned.length > 0 && (
            <div style={{ background:isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.06)', border:'2px solid rgba(99,102,241,0.3)', borderRadius:'16px', padding:'16px', marginBottom:'14px' }}>
              <div style={{ fontWeight:'800', fontSize:'0.82rem', color:'#6366f1', marginBottom:'10px' }}>
                🎖️ NEW BADGE{newBadgesEarned.length > 1 ? 'S' : ''} UNLOCKED!
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center' }}>
                {newBadgesEarned.map(bid => {
                  const badge = BADGES.find(b => b.id === bid);
                  if (!badge) return null;
                  return (
                    <div key={bid} style={{ textAlign:'center', animation:'badgePopIn 0.6s ease forwards' }}>
                      <div style={{ fontSize:'2rem', marginBottom:'2px' }}>{badge.icon}</div>
                      <div style={{ fontSize:'0.68rem', fontWeight:'800', color:textPrimary }}>{badge.name}</div>
                      <div style={{ fontSize:'0.6rem', color:textSec }}>{badge.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rival gap — motivation */}
          {rival && !todayRes.disqualified && (
            <div style={{ background:isDark?'rgba(255,107,0,0.08)':'rgba(255,107,0,0.05)', border:'1px solid rgba(255,107,0,0.2)', borderRadius:'12px', padding:'10px 16px', marginBottom:'14px', textAlign:'left' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:'800', color:'#ff6b00', marginBottom:'2px' }}>CATCH YOUR RIVAL</div>
              <div style={{ fontSize:'0.85rem', fontWeight:'700' }}>{rival.name} is #{userRank - 1} — {rival.avgScore}% avg</div>
              <div style={{ fontSize:'0.72rem', color:textSec }}>Gap to close: {Math.max(0, rival.avgScore - pct)}% score difference</div>
            </div>
          )}

          {/* Restore option on result screen */}
          {streakState === 'broken' && !isAdmin && (
            <div style={{ background:isDark?'rgba(255,107,0,0.1)':'rgba(255,107,0,0.06)', border:'2px solid rgba(255,107,0,0.3)', borderRadius:'14px', padding:'16px', margin:'14px 0', textAlign:'left' }}>
              <div style={{ fontWeight:'800', fontSize:'0.9rem', marginBottom:'4px' }}>🛡️ Streak Shield Available</div>
              <div style={{ color:textSec, fontSize:'0.78rem', marginBottom:'12px' }}>
                Your streak broke — restore it for Rs.{restorePrice}
              </div>
              <button
                onClick={handleRestore}
                disabled={restoring}
                style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.9rem', fontWeight:'800', cursor:'pointer' }}
              >
                {restoring ? 'Restoring...' : `Restore Streak — Rs.${restorePrice}`}
              </button>
            </div>
          )}

          <div style={{ background:isDark?'rgba(0,0,0,0.2)':'rgba(0,0,0,0.04)', borderRadius:'12px', padding:'12px 16px' }}>
            {doneAll ? (
              <div style={{ fontWeight:'700', fontSize:'0.88rem', color:'#22c55e' }}>
                All 30 days complete! Your PDF is downloading...
              </div>
            ) : (
              <>
                <div style={{ fontWeight:'700', fontSize:'0.85rem', marginBottom:'4px' }}>
                  Next practice opens at 6:00 AM
                </div>
                <div style={{ fontSize:'0.72rem', color:textSec }}>
                  Tomorrow: Day {(todayInfo?.dayNum||1)+1}
                </div>
              </>
            )}
          </div>
        </div>

        <style>{`
          @keyframes badgePopIn{0%{transform:scale(0) rotate(-10deg);opacity:0}70%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        `}</style>

        {doneAll && (
          <button onClick={() => makePDF(userName, results)} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'0.95rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 8px 20px rgba(34,197,94,0.4)', marginBottom:'14px' }}>
            Download Your 30-Day PDF Report
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