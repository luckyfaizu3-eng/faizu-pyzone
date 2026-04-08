// @ts-nocheck
// FILE LOCATION: src/components/MockTestInterface.jsx
//
// ============================================================
// ALL BUGS FIXED — COMPLETE AUDIT LOG
// ============================================================
// ✅ ORIG-FIX 1:  IsolatedTimer stale closure — onExpire/onTick refs (retained)
// ✅ ORIG-FIX 2:  SecurityManager stale handleSubmit — ref se pass (retained)
// ✅ ORIG-FIX 3:  handleAnswer setTimeout race — direct functional setState (retained)
// ✅ ORIG-FIX 4:  handleSubmit useEffect dep loop — securityRef se call (retained)
// ✅ ORIG-FIX 5:  DevTools detection — warning + auto-submit (retained + patched)
// ✅ ORIG-FIX 6:  window.innerWidth in IsolatedTimer render — state mein (retained)
// ✅ ORIG-FIX 7:  OS screen record false sense — note added (retained)
// ✅ ORIG-FIX 8:  @keyframes global CSS mein inject ek baar (retained)
// ✅ ORIG-FIX 9:  Firebase silent fail — retry + console warning (retained)
// ✅ ORIG-FIX 10: handleSubmit useCallback deps stable (retained)
//
// ✅ NEW-FIX T:   PER-QUESTION TIMER — har question ka apna countdown timer
// ✅ NEW-FIX V:   CAMERA / PROCTORING REMOVED
// ✅ NEW-FIX W:   ESLint warnings fixed — unused vars removed
// ✅ NEW-FIX E:   APPROACH E — Hybrid Strict (forward only, expired = done)
// ✅ NEW-FIX P:   PROGRESS BAR — slim animated bar + tick markers
//
// FILE STRUCTURE:
//   utils.js              — configs, classes, pure utilities
//   ExamComponents.jsx    — Watermark, WarningModal, SyntaxHighlight,
//                           IsolatedTimer, QuestionTimer, ExamProgressBar
//   ExamScreens.jsx       — InstructionScreen, TestInterface
//   MockTestInterface.jsx — main export (this file)
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  injectGlobalCSS,
  LeaderboardStorage,
  TestUtils,
  shuffleQuestions,
  FullscreenManager,
  CleanupManager,
} from './utils';

import { InstructionScreen, TestInterface } from './ExamScreens';

// Inject global CSS once at module load
injectGlobalCSS();

// ==========================================
// MAIN EXPORT
// Props:
//   questions         - array of question objects
//   testTitle         - string
//   timeLimit         - total minutes
//   userEmail         - string
//   testLevel         - 'basic' | 'intermediate' | 'advanced' | 'pro'
//   onExit            - callback
//   onComplete        - callback
//   studentInfo       - object
//   passPercent       - number (default 55)
//   timePerQuestion   - seconds per question (optional; if not passed, auto-calculated)
// ==========================================
export default function MockTestInterface({
  questions,
  testTitle,
  timeLimit,
  userEmail,
  testLevel,
  onExit,
  onComplete,
  studentInfo,
  passPercent,
  timePerQuestion: timePerQuestionProp,
}) {
  const [shuffledQuestions] = useState(() => shuffleQuestions(questions));
  const [started, setStarted]   = useState(false);
  const hasCompletedRef     = useRef(false);

  const isAdmin = TestUtils.isAdmin(userEmail);

  const timePerQuestion = timePerQuestionProp
    ? timePerQuestionProp
    : Math.max(30, Math.floor((timeLimit * 60) / shuffledQuestions.length));

  useEffect(() => {
    if (!isAdmin) FullscreenManager.enter();
    window.onbeforeunload = null;
    return () => CleanupManager.performFullCleanup();
  }, [isAdmin]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      const ok = window.confirm('Are you sure you want to exit the test?\n\n• Your progress will be lost\n• Payment is non-refundable');
      if (ok) { CleanupManager.performFullCleanup(); if (onExit) onExit(); }
      else window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [onExit]);

  const onCompleteRef   = useRef(onComplete);
  const studentInfoRef  = useRef(studentInfo);
  const testTitleRef    = useRef(testTitle);
  const testLevelRef    = useRef(testLevel);
  const userEmailRef    = useRef(userEmail);
  useEffect(() => { onCompleteRef.current  = onComplete;  }, [onComplete]);
  useEffect(() => { studentInfoRef.current = studentInfo; }, [studentInfo]);
  useEffect(() => { testTitleRef.current   = testTitle;   }, [testTitle]);
  useEffect(() => { testLevelRef.current   = testLevel;   }, [testLevel]);
  useEffect(() => { userEmailRef.current   = userEmail;   }, [userEmail]);

  const handleAccept = useCallback(() => {
    if (!isAdmin) FullscreenManager.enter();
    setStarted(true);
  }, [isAdmin]);

  const handleTestComplete = useCallback((testResults) => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    CleanupManager.performFullCleanup();
    const data = {
      ...testResults,
      studentInfo: studentInfoRef.current,
      userName:    studentInfoRef.current?.fullName,
      testTitle:   testTitleRef.current,
      testLevel:   testLevelRef.current,
      userEmail:   userEmailRef.current,
      completedAt: Date.now(),
      timestamp:   new Date().toISOString(),
    };
    LeaderboardStorage.saveEntry(data).then(result => {
      if (!result?.success) {
        console.warn('[MockTest] Could not save to leaderboard:', result?.error);
      }
    });
    if (onCompleteRef.current) onCompleteRef.current(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!started && (
        <InstructionScreen
          testTitle={testTitle}
          timeLimit={timeLimit}
          totalQuestions={shuffledQuestions.length}
          passPercent={passPercent || 55}
          timePerQuestion={timePerQuestion}
          onAccept={handleAccept}
        />
      )}
      {started && (
        <TestInterface
          questions={shuffledQuestions}
          testTitle={testTitle}
          timeLimit={timeLimit}
          userEmail={userEmail}
          studentInfo={studentInfo}
          passPercent={passPercent || 55}
          timePerQuestion={timePerQuestion}
          onComplete={handleTestComplete}
        />
      )}
    </>
  );
}