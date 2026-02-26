import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Award, Download } from 'lucide-react';

const NEET_SUBJECT_COLORS = {
  Physics:   { color: '#3b82f6', light: '#dbeafe', dark: '#1d4ed8' },
  Chemistry: { color: '#a855f7', light: '#f3e8ff', dark: '#7e22ce' },
  Botany:    { color: '#22c55e', light: '#dcfce7', dark: '#15803d' },
  Zoology:   { color: '#f97316', light: '#ffedd5', dark: '#c2410c' },
};

const NEET_SECTIONS = [
  { id: 'Physics',   label: '⚡ Physics' },
  { id: 'Chemistry', label: '🧪 Chemistry' },
  { id: 'Botany',    label: '🌿 Botany' },
  { id: 'Zoology',   label: '🐾 Zoology' },
];

const NEET_PASS_PERCENTAGE = 88;
const PYTHON_PASS_PERCENTAGE = 55;

function ResultsDisplay({
  testResults,
  selectedPlan,
  userCertificates,
  isDark,
  onBackToPlans,
  onViewCertificate,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showWrong, setShowWrong] = useState({});

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ✅ FIX: MockTestPage par wapas jaao — homepage nahi
  const handleBackToMockTests = () => {
    if (onBackToPlans) onBackToPlans();
    else window.location.href = '/mocktests';
  };

  if (!testResults) return null;

  const isNeetTest = selectedPlan?.level === 'neet';

  if (isNeetTest) {
    return (
      <NEETResult
        result={testResults}
        onBackToMockTests={handleBackToMockTests}
        isMobile={isMobile}
        showWrong={showWrong}
        setShowWrong={setShowWrong}
        isDark={isDark}
      />
    );
  }

  // PYTHON RESULT
  const passed = testResults.percentage >= PYTHON_PASS_PERCENTAGE;

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
        : 'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 100%)',
      padding: isMobile ? '80px 0.75rem 2rem' : '100px 1rem 3rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: isDark ? '#1e293b' : '#fff',
          borderRadius: '24px',
          padding: isMobile ? '1.5rem 1rem' : '3rem',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: isMobile ? '80px' : '120px',
            height: isMobile ? '80px' : '120px',
            margin: '0 auto 1.25rem',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: passed ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
            boxShadow: passed ? '0 8px 24px rgba(16,185,129,0.4)' : '0 8px 24px rgba(239,68,68,0.4)'
          }}>
            {passed
              ? <CheckCircle size={isMobile ? 38 : 56} color="#fff" />
              : <XCircle size={isMobile ? 38 : 56} color="#fff" />}
          </div>

          <h1 style={{ fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: '900', marginBottom: '0.5rem', color: passed ? '#10b981' : '#ef4444' }}>
            {passed ? '🎉 Congratulations!' : '💪 Keep Trying!'}
          </h1>
          <p style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '1.5rem' }}>
            {passed ? 'You passed the test!' : `You need ${PYTHON_PASS_PERCENTAGE}% to pass`}
          </p>

          <div style={{ display: 'inline-block', padding: isMobile ? '1rem 1.5rem' : '1.5rem 3rem', background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: '900', color: passed ? '#10b981' : '#ef4444' }}>
              {testResults.percentage}%
            </div>
            <div style={{ fontSize: isMobile ? '0.78rem' : '0.9rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Your Score</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '0.5rem' : '1.5rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Correct', value: testResults.correct, color: '#6366f1', bg: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)' },
              { label: 'Wrong',   value: testResults.wrong,   color: '#ef4444', bg: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)' },
              { label: 'Total',   value: testResults.total,   color: '#10b981', bg: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.06)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: isMobile ? '0.75rem 0.5rem' : '1.5rem', background: s.bg, borderRadius: '12px' }}>
                <div style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: '900', color: s.color, marginBottom: '0.25rem' }}>{s.value}</div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.85rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '600' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: isMobile ? '1rem' : '1.5rem', background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.2)', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
            <Clock size={isMobile ? 20 : 28} color="#ef4444" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: isMobile ? '0.82rem' : '1rem', color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: '600', margin: 0 }}>
              🔒 Test locked for 7 days. You can take it again after the lock period.
            </p>
          </div>

          {passed && (
            <div style={{ padding: isMobile ? '1rem' : '1.5rem', background: 'rgba(99,102,241,0.08)', border: '2px solid rgba(99,102,241,0.2)', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
              <Award size={isMobile ? 20 : 28} color="#6366f1" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: isMobile ? '0.82rem' : '1rem', color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: '600', margin: 0 }}>
                {userCertificates?.find(c => c.level === selectedPlan?.level)
                  ? '✅ Certificate already issued for this level'
                  : '🎓 Certificate issued! Check below to download.'}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleBackToMockTests}
              style={{ flex: isMobile ? 1 : 'unset', minWidth: isMobile ? 0 : '150px', padding: isMobile ? '0.85rem 0.75rem' : '1rem 2rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: isMobile ? '0.85rem' : '1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
            >🔙 Mock Tests</button>

            {passed && userCertificates?.find(c => c.level === selectedPlan?.level) && (
              <button onClick={() => onViewCertificate(selectedPlan.level)}
                style={{ flex: isMobile ? 1 : 'unset', minWidth: isMobile ? 0 : '150px', padding: isMobile ? '0.85rem 0.75rem' : '1rem 2rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: isMobile ? '0.85rem' : '1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
              ><Download size={16} /> Certificate</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// NEET RESULT
// ==========================================
function NEETResult({ result, onBackToMockTests, isMobile, showWrong, setShowWrong, isDark }) {
  const toggleWrong = (subject) => setShowWrong(p => ({ ...p, [subject]: !p[subject] }));

  const { score, correct, wrong, skipped, total, subjectScores, userName, timeTaken, tabSwitches, violations, penalized } = result;

  const percentage = Math.round(Math.max(0, (score / 720)) * 100);
  const passed = percentage >= NEET_PASS_PERCENTAGE;

  const bg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 100%)';

  const cardBg = isDark ? '#1e293b' : '#fff';
  const cardBorder = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#e2e8f0' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const innerCardBg = isDark ? '#0f172a' : '#f8fafc';
  const innerCardBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: isMobile ? '80px 0.75rem 2rem' : '2rem', overflowY: 'auto' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* HEADER CARD */}
        <div style={{
          background: penalized
            ? (isDark ? 'linear-gradient(135deg,#7f1d1d,#450a0a)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)')
            : passed
              ? (isDark ? 'linear-gradient(135deg,#052e16,#065f46)' : 'linear-gradient(135deg,#f0fdf4,#dcfce7)')
              : cardBg,
          border: `2px solid ${penalized ? '#ef4444' : passed ? '#10b981' : cardBorder}`,
          borderRadius: '20px', padding: isMobile ? '1.25rem' : '2.5rem',
          marginBottom: '1rem', textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', marginBottom: '0.5rem' }}>
            {penalized ? '🚫' : percentage >= 90 ? '🏆' : passed ? '✅' : '📊'}
          </div>
          <h1 style={{ margin: '0 0 0.4rem', fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: '900', color: textPrimary }}>
            {penalized ? 'Test Disqualified' : passed ? '🎉 Congratulations!' : 'Test Completed!'}
          </h1>
          {!penalized && (
            <p style={{ margin: '0 0 0.4rem', fontSize: isMobile ? '0.82rem' : '0.95rem', color: passed ? '#10b981' : '#ef4444', fontWeight: '700' }}>
              {passed ? `You passed! (${NEET_PASS_PERCENTAGE}%+ required)` : `You need ${NEET_PASS_PERCENTAGE}% to pass`}
            </p>
          )}
          <div style={{ fontSize: isMobile ? '0.78rem' : '0.9rem', color: textSecondary, marginBottom: '1.25rem' }}>{userName}</div>

          {/* Score Box */}
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: isMobile ? '0.85rem 1.5rem' : '1.5rem 3rem', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '16px', border: `1px solid ${cardBorder}`, marginBottom: '1.25rem' }}>
            <div style={{ fontSize: isMobile ? '2.8rem' : '4.5rem', fontWeight: '900', color: passed ? '#10b981' : '#f59e0b', fontFamily: 'monospace', lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', color: textSecondary, fontWeight: '700' }}>out of 720</div>
            <div style={{ fontSize: isMobile ? '0.72rem' : '0.85rem', color: passed ? '#10b981' : '#ef4444', fontWeight: '800', marginTop: '0.2rem' }}>{percentage}%</div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? '0.5rem' : '0.75rem', marginBottom: '0.85rem' }}>
            {[
              { label: 'Correct',    value: correct,   color: '#10b981', sub: `+${correct * 4} marks` },
              { label: 'Wrong',      value: wrong,     color: '#ef4444', sub: `-${wrong} marks` },
              { label: 'Skipped',    value: skipped,   color: '#94a3b8', sub: '0 marks' },
              { label: 'Time Taken', value: timeTaken, color: '#6366f1', sub: `${total} questions` },
            ].map((item, i) => (
              <div key={i} style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '10px', padding: isMobile ? '0.65rem' : '1rem', border: `1px solid ${cardBorder}` }}>
                <div style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: '900', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.78rem', color: textSecondary, fontWeight: '700' }}>{item.label}</div>
                <div style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', color: item.color, fontWeight: '600', opacity: 0.85 }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* 30 days lock */}
          <div style={{ padding: isMobile ? '0.65rem' : '0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', fontSize: isMobile ? '0.72rem' : '0.82rem', color: '#ef4444', fontWeight: '600', marginBottom: tabSwitches > 0 || violations > 0 ? '0.6rem' : 0 }}>
            🔒 Test locked for 30 days. You can take it again after the lock period.
          </div>

          {(tabSwitches > 0 || violations > 0) && (
            <div style={{ padding: isMobile ? '0.65rem' : '0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', fontSize: isMobile ? '0.72rem' : '0.82rem', color: '#ef4444', fontWeight: '600', marginTop: '0.5rem' }}>
              ⚠️ Tab switches: {tabSwitches} | Violations: {violations}{penalized && ' | ❌ DISQUALIFIED'}
            </div>
          )}
        </div>

        {/* SUBJECT BREAKDOWN */}
        <div style={{ background: cardBg, border: `2px solid ${cardBorder}`, borderRadius: '16px', padding: isMobile ? '1rem' : '1.75rem', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: isMobile ? '0.95rem' : '1.2rem', fontWeight: '900', color: textPrimary }}>📊 Subject-wise Score</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {NEET_SECTIONS.map(s => {
              const sc = subjectScores?.[s.id];
              if (!sc) return null;
              const c = NEET_SUBJECT_COLORS[s.id];
              const pct = sc.total > 0 ? Math.round((sc.correct / sc.total) * 100) : 0;
              return (
                <div key={s.id} style={{ background: innerCardBg, border: `2px solid ${c.color}33`, borderRadius: '12px', padding: isMobile ? '0.85rem' : '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div>
                      <div style={{ fontSize: isMobile ? '0.88rem' : '1rem', fontWeight: '800', color: c.color }}>{s.label}</div>
                      <div style={{ fontSize: '0.65rem', color: textSecondary }}>{sc.total} Questions • Max {sc.total * 4} marks</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: '900', color: sc.marks >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                        {sc.marks > 0 ? '+' : ''}{sc.marks}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: textSecondary }}>marks</div>
                    </div>
                  </div>
                  <div style={{ height: '7px', background: isDark ? '#334155' : '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: '99px', transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ padding: '0.15rem 0.5rem', background: 'rgba(16,185,129,0.12)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', color: '#10b981' }}>✅ {sc.correct} (+{sc.correct * 4})</span>
                    <span style={{ padding: '0.15rem 0.5rem', background: 'rgba(239,68,68,0.12)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', color: '#ef4444' }}>❌ {sc.wrong} (-{sc.wrong})</span>
                    <span style={{ padding: '0.15rem 0.5rem', background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(100,116,139,0.1)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', color: textSecondary }}>⬜ {sc.skipped}</span>
                    <span style={{ padding: '0.15rem 0.5rem', background: `${c.color}18`, borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', color: c.color }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* WRONG QUESTIONS */}
        {NEET_SECTIONS.map(s => {
          const sc = subjectScores?.[s.id];
          const wrongDetails = sc?.wrongDetails || [];
          if (wrongDetails.length === 0) return null;
          const c = NEET_SUBJECT_COLORS[s.id];
          const isOpen = showWrong[s.id];
          return (
            <div key={s.id} style={{ background: cardBg, border: `2px solid ${c.color}44`, borderRadius: '14px', marginBottom: '0.75rem', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <button onClick={() => toggleWrong(s.id)} style={{ width: '100%', padding: isMobile ? '0.85rem 1rem' : '1.25rem 1.75rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: '900', color: c.color }}>{s.label}</span>
                  <span style={{ padding: '0.15rem 0.55rem', background: 'rgba(239,68,68,0.12)', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', color: '#ef4444' }}>❌ {wrongDetails.length} Wrong</span>
                </div>
                <span style={{ color: textSecondary, fontSize: '1rem' }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div style={{ borderTop: `2px solid ${c.color}22`, padding: isMobile ? '0.85rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {wrongDetails.map((item, idx) => (
                    <div key={idx} style={{ background: innerCardBg, border: `1px solid ${innerCardBorder}`, borderLeft: '4px solid #ef4444', borderRadius: '10px', padding: isMobile ? '0.85rem' : '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                        <span style={{ padding: '0.12rem 0.45rem', background: isDark ? '#7f1d1d' : '#fee2e2', borderRadius: '5px', fontSize: '0.62rem', fontWeight: '800', color: '#ef4444' }}>❌ Q{idx + 1}</span>
                        {item.neetClass && <span style={{ padding: '0.12rem 0.45rem', background: isDark ? '#1e3a5f' : '#eff6ff', borderRadius: '5px', fontSize: '0.62rem', fontWeight: '700', color: '#3b82f6' }}>Class {item.neetClass}th</span>}
                        {item.chapterNo && item.chapterName && <span style={{ padding: '0.12rem 0.45rem', background: isDark ? '#1e293b' : '#f1f5f9', border: `1px solid ${innerCardBorder}`, borderRadius: '5px', fontSize: '0.62rem', fontWeight: '700', color: textSecondary }}>Ch.{item.chapterNo} — {item.chapterName}</span>}
                        {item.topic && <span style={{ padding: '0.12rem 0.45rem', background: isDark ? '#2e1065' : '#faf5ff', borderRadius: '5px', fontSize: '0.62rem', fontWeight: '700', color: '#a855f7' }}>📌 {item.topic}</span>}
                      </div>
                      <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '600', color: textPrimary, lineHeight: 1.6, marginBottom: '0.85rem' }}>{item.question}</div>
                      {item.code && (
                        <div style={{ background: isDark ? '#0f172a' : '#f1f5f9', border: `1px solid ${innerCardBorder}`, borderRadius: '8px', padding: '0.75rem', marginBottom: '0.85rem', overflowX: 'auto' }}>
                          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: isMobile ? '0.75rem' : '0.88rem', color: textSecondary, whiteSpace: 'pre' }}>{item.code}</pre>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
                        <div style={{ padding: '0.65rem', background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#ef4444', marginBottom: '0.25rem' }}>❌ Your Answer</div>
                          <div style={{ fontSize: isMobile ? '0.78rem' : '0.88rem', fontWeight: '700', color: '#ef4444', lineHeight: 1.4 }}>{String.fromCharCode(65 + item.userAnswer)}. {item.options?.[item.userAnswer]}</div>
                        </div>
                        <div style={{ padding: '0.65rem', background: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#10b981', marginBottom: '0.25rem' }}>✅ Correct Answer</div>
                          <div style={{ fontSize: isMobile ? '0.78rem' : '0.88rem', fontWeight: '700', color: '#10b981', lineHeight: 1.4 }}>{String.fromCharCode(65 + item.correctAnswer)}. {item.options?.[item.correctAnswer]}</div>
                        </div>
                      </div>
                      {(item.chapterName || item.topic) && (
                        <div style={{ padding: '0.55rem 0.75rem', background: isDark ? 'rgba(99,102,241,0.1)' : '#eff6ff', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '7px', fontSize: isMobile ? '0.68rem' : '0.78rem', color: '#6366f1', fontWeight: '600', lineHeight: 1.6, marginBottom: item.explanation ? '0.6rem' : 0 }}>
                          📖 Class {item.neetClass}th {item.subject} — Ch.{item.chapterNo}: {item.chapterName}{item.topic && ` — ${item.topic}`}
                        </div>
                      )}
                      {item.explanation && (
                        <div style={{ padding: '0.85rem', background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', border: '2px solid rgba(245,158,11,0.3)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: '800', color: '#f59e0b', marginBottom: '0.3rem' }}>💡 EXPLANATION</div>
                          <div style={{ fontSize: isMobile ? '0.78rem' : '0.88rem', color: isDark ? '#fde68a' : '#92400e', fontWeight: '500', lineHeight: 1.7 }}>{item.explanation}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* ✅ FIX: "Back to Mock Tests" — MockTestPage par jaata hai, homepage nahi */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ padding: isMobile ? '0.85rem' : '1.25rem', background: isDark ? 'rgba(99,102,241,0.12)' : '#eff6ff', border: '2px solid rgba(99,102,241,0.3)', borderRadius: '12px', marginBottom: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>📊</span>
            <div>
              <div style={{ fontWeight: '800', color: '#6366f1', fontSize: isMobile ? '0.82rem' : '0.92rem', marginBottom: '0.2rem' }}>
                Where to see your results?
              </div>
              <div style={{ color: textSecondary, fontSize: isMobile ? '0.75rem' : '0.82rem', lineHeight: 1.5 }}>
                Go to <strong style={{ color: '#6366f1' }}>Mock Tests → Results tab</strong> to see your full result history.
              </div>
            </div>
          </div>

          {/* ✅ FIX: onBackToMockTests() call hoga — window.location.href = '/' nahi */}
          <button
            onClick={onBackToMockTests}
            style={{
              width: '100%', padding: isMobile ? '0.9rem' : '1.25rem',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border: 'none', borderRadius: '12px', color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: '900',
              cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.4)'
            }}
          >
            🔙 Back to Mock Tests
          </button>
        </div>

      </div>
    </div>
  );
}

export default ResultsDisplay;