import React, { useState } from 'react';
import { Award, Download, XCircle, History, CheckCircle, Clock, Trophy, AlertTriangle } from 'lucide-react';

const NEET_SECTIONS = [
  { id: 'Physics',   label: '⚡ Physics',   color: '#2563eb', lightBg: '#eff6ff', border: '#bfdbfe' },
  { id: 'Chemistry', label: '🧪 Chemistry', color: '#7c3aed', lightBg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'Botany',    label: '🌿 Botany',    color: '#16a34a', lightBg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'Zoology',   label: '🐾 Zoology',   color: '#ea580c', lightBg: '#fff7ed', border: '#fed7aa' },
];

// =============================================
// NEET SUBJECT BREAKDOWN — ALL WHITE/LIGHT
// =============================================
function NEETSubjectBreakdown({ test }) {
  const [openSubject, setOpenSubject] = useState(null);
  const subjectScores = test.subjectScores || {};
  const rawScore   = test.rawScore ?? 0;
  const percentage = test.score ?? 0;
  const passed     = percentage >= 55;

  return (
    <div style={{ marginTop: '1rem' }}>

      {/* Score Banner — white bg, dark text */}
      <div style={{
        padding: '1rem 1.25rem',
        background: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#dc2626', marginBottom: '0.2rem', letterSpacing: '0.06em' }}>
            🧬 NEET TOTAL SCORE
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e293b', fontFamily: 'monospace' }}>
            {rawScore}
            <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '600' }}> / 720</span>
          </div>
        </div>
        <div style={{
          padding: '0.4rem 1rem',
          background: passed ? '#dcfce7' : '#fee2e2',
          border: `2px solid ${passed ? '#16a34a' : '#dc2626'}`,
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '800',
          color: passed ? '#15803d' : '#b91c1c'
        }}>
          {percentage}% — {passed ? '✅ PASSED' : '❌ FAILED'}
        </div>
      </div>

      {/* Subject Cards */}
      {NEET_SECTIONS.map(s => {
        const sc = subjectScores[s.id];
        if (!sc) return null;
        const pct          = sc.total > 0 ? Math.round((sc.correct / sc.total) * 100) : 0;
        const wrongDetails = sc.wrongDetails || [];
        const isOpen       = openSubject === s.id;

        return (
          <div key={s.id} style={{
            background: '#ffffff',
            border: `2px solid ${s.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}>

            {/* Subject Header — colored light bg */}
            <div style={{
              padding: '0.9rem 1rem',
              background: s.lightBg,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <div style={{ fontWeight: '800', color: s.color, fontSize: '0.95rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>
                  {sc.total} Questions • Max {sc.total * 4} marks
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: sc.marks >= 0 ? '#15803d' : '#b91c1c', fontFamily: 'monospace' }}>
                  {sc.marks > 0 ? '+' : ''}{sc.marks} marks
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.2rem 0.5rem', background: '#dcfce7', border: '1px solid #16a34a', borderRadius: '5px', fontSize: '0.7rem', fontWeight: '700', color: '#15803d' }}>✅ {sc.correct}</span>
                  <span style={{ padding: '0.2rem 0.5rem', background: '#fee2e2', border: '1px solid #dc2626', borderRadius: '5px', fontSize: '0.7rem', fontWeight: '700', color: '#b91c1c' }}>❌ {sc.wrong}</span>
                  <span style={{ padding: '0.2rem 0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.7rem', fontWeight: '700', color: '#475569' }}>⬜ {sc.skipped}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '6px', background: '#e2e8f0' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: s.color, transition: 'width 1s' }} />
            </div>
            <div style={{ padding: '0.35rem 1rem', fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>
              {pct}% accuracy
            </div>

            {/* Toggle Button */}
            {wrongDetails.length > 0 && (
              <>
                <button
                  onClick={() => setOpenSubject(isOpen ? null : s.id)}
                  style={{
                    width: '100%', padding: '0.65rem 1rem',
                    background: '#fff5f5',
                    border: 'none', borderTop: '1px solid #fecaca',
                    cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#b91c1c' }}>
                    ❌ {wrongDetails.length} Wrong Answers — {isOpen ? 'Hide Details ▲' : 'View Details ▼'}
                  </span>
                </button>

                {/* Wrong Questions */}
                {isOpen && (
                  <div style={{ padding: '1rem', background: '#fffbfb', borderTop: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {wrongDetails.map((item, idx) => (
                      <div key={idx} style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderLeft: '4px solid #dc2626',
                        borderRadius: '10px',
                        padding: '1rem'
                      }}>

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                          <span style={{ padding: '0.15rem 0.5rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '5px', fontSize: '0.68rem', fontWeight: '800', color: '#b91c1c' }}>❌ Q{idx + 1}</span>
                          {item.neetClass && (
                            <span style={{ padding: '0.15rem 0.5rem', background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '5px', fontSize: '0.68rem', fontWeight: '700', color: '#1d4ed8' }}>
                              Class {item.neetClass}th NCERT
                            </span>
                          )}
                          {item.chapterNo && item.chapterName && (
                            <span style={{ padding: '0.15rem 0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.68rem', fontWeight: '700', color: '#334155' }}>
                              Ch.{item.chapterNo} — {item.chapterName}
                            </span>
                          )}
                          {item.topic && (
                            <span style={{ padding: '0.15rem 0.5rem', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: '5px', fontSize: '0.68rem', fontWeight: '700', color: '#5b21b6' }}>
                              📌 {item.topic}
                            </span>
                          )}
                        </div>

                        {/* Question */}
                        <div style={{
                          fontSize: '0.92rem', fontWeight: '600', color: '#1e293b',
                          lineHeight: 1.65, marginBottom: '0.85rem',
                          padding: '0.75rem', background: '#f8fafc',
                          borderRadius: '8px', border: '1px solid #e2e8f0'
                        }}>
                          {item.question}
                        </div>

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem' }}>
                          {item.options?.map((opt, optIdx) => {
                            const isUserAns    = optIdx === item.userAnswer;
                            const isCorrectAns = optIdx === item.correctAnswer;
                            let bg = '#f8fafc', border = '#e2e8f0', color = '#334155', icon = '○';
                            if (isCorrectAns) { bg = '#f0fdf4'; border = '#16a34a'; color = '#15803d'; icon = '✅'; }
                            else if (isUserAns) { bg = '#fef2f2'; border = '#dc2626'; color = '#b91c1c'; icon = '❌'; }

                            return (
                              <div key={optIdx} style={{
                                padding: '0.65rem 0.9rem', background: bg,
                                border: `1px solid ${border}`, borderRadius: '8px',
                                fontSize: '0.88rem', fontWeight: isCorrectAns || isUserAns ? '700' : '500',
                                color, display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
                              }}>
                                <span style={{ flexShrink: 0, fontWeight: '800' }}>{icon} {String.fromCharCode(65 + optIdx)}.</span>
                                <span style={{ flex: 1 }}>{opt}</span>
                                {isUserAns && !isCorrectAns && (
                                  <span style={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: '800', background: '#fee2e2', color: '#b91c1c', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Your Ans</span>
                                )}
                                {isCorrectAns && (
                                  <span style={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Correct</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* NCERT Reference */}
                        {(item.chapterName || item.topic) && (
                          <div style={{
                            padding: '0.65rem 0.85rem', background: '#eef2ff',
                            border: '1px solid #c7d2fe', borderRadius: '8px',
                            fontSize: '0.8rem', color: '#3730a3', fontWeight: '600',
                            lineHeight: 1.55, marginBottom: item.explanation ? '0.75rem' : 0
                          }}>
                            📖 <strong>NCERT Reference:</strong> Class {item.neetClass}th {item.subject}
                            {item.chapterNo && <> — Ch.{item.chapterNo}: {item.chapterName}</>}
                            {item.topic && <> — <strong>Topic:</strong> {item.topic}</>}
                          </div>
                        )}

                        {/* Explanation */}
                        {item.explanation && (
                          <div style={{
                            padding: '0.85rem', background: '#fffbeb',
                            border: '2px solid #fcd34d', borderRadius: '8px'
                          }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#92400e', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                              💡 EXPLANATION
                            </div>
                            <div style={{ fontSize: '0.88rem', color: '#78350f', fontWeight: '500', lineHeight: 1.7 }}>
                              {item.explanation}
                            </div>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================
function CertificateSection({
  userCertificates,
  testHistory,
  isDark,
  onViewCertificate,
  onDeleteCertificate,
  onDeleteTest
}) {
  if (!userCertificates.length && !testHistory.length) return null;

  return (
    <>
      {/* Certificates — untouched */}
      {userCertificates.length > 0 && (
        <div style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: '24px', padding: 'clamp(1.5rem,4vw,2rem)', marginBottom: '3rem', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          <h2 style={{ fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Award size={28} color="#6366f1" /> My Certificates
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: '1.5rem' }}>
            {userCertificates.map((cert, i) => (
              <div key={i} style={{ background: isDark ? 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(236,72,153,0.1))' : 'linear-gradient(135deg,rgba(99,102,241,0.05),rgba(236,72,153,0.05))', border: `2px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`, borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => onViewCertificate(cert)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ padding: '0.5rem 1rem', background: cert.level === 'basic' ? 'rgba(16,185,129,0.2)' : cert.level === 'advanced' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: cert.level === 'basic' ? '#10b981' : cert.level === 'advanced' ? '#6366f1' : '#f59e0b' }}>{cert.level}</div>
                  <Award size={24} color="#6366f1" />
                </div>
                <h3 style={{ fontSize: 'clamp(0.95rem,2.5vw,1.1rem)', fontWeight: '800', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '0.5rem' }}>{cert.testName}</h3>
                <div style={{ fontSize: 'clamp(0.75rem,2vw,0.85rem)', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '1rem' }}>Score: <strong style={{ color: '#10b981' }}>{cert.score}%</strong> • {cert.date}</div>
                <button onClick={e => { e.stopPropagation(); onViewCertificate(cert); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 'clamp(0.8rem,2vw,0.9rem)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Download size={18} /> View & Download
                </button>
                <button onClick={e => { e.stopPropagation(); onDeleteCertificate(cert); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 'clamp(0.8rem,2vw,0.9rem)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(239,68,68,0.3)', transition: 'all 0.3s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <XCircle size={18} /> Delete Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {testHistory.length > 0 && (
        <div style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: '24px', padding: 'clamp(1.5rem,4vw,2rem)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <History size={28} color="#6366f1" /> Complete Test Results
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {testHistory.map((test, i) => {
              const isNeet = test.testType === 'neet';
              return (
                <div key={i} style={{
                  padding: 'clamp(1rem,3vw,1.5rem)',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: `2px solid ${isNeet ? '#fecaca' : 'rgba(99,102,241,0.2)'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9' }}>
                    <div>
                      <h3 style={{ fontSize: 'clamp(1rem,3vw,1.3rem)', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {isNeet ? '🧬' : test.level === 'basic' ? '🌱' : test.level === 'advanced' ? '🔥' : '⭐'}
                        {test.planName}
                        {isNeet && <span style={{ padding: '0.1rem 0.55rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', color: '#b91c1c' }}>NEET</span>}
                      </h3>
                      <div style={{ fontSize: 'clamp(0.75rem,2vw,0.85rem)', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Clock size={14} /> {test.testDate || test.date}
                        {test.testTime && <><span>•</span><span>{test.testTime}</span></>}
                      </div>
                    </div>
                    <div style={{ padding: '0.75rem 1.5rem', background: test.score >= 55 ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '12px', fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: '900', color: '#fff', boxShadow: test.score >= 55 ? '0 4px 12px rgba(16,185,129,0.4)' : '0 4px 12px rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {test.score >= 55 ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      {test.score}%
                      {isNeet && test.rawScore !== undefined && <span style={{ fontSize: '0.72rem', opacity: 0.9, fontFamily: 'monospace' }}>({test.rawScore}/720)</span>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(140px,100%),1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { label: '✅ Correct',   value: test.correct,   color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                      { label: '❌ Wrong',     value: test.wrong,     color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                      { label: '📊 Total',    value: test.total,     color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
                      { label: '⏱️ Duration', value: test.timeTaken, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                    ].map((s, idx) => (
                      <div key={idx} style={{ padding: '1rem', background: s.bg, borderRadius: '12px', textAlign: 'center', border: `1px solid ${s.border}` }}>
                        <div style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: '900', color: s.color, marginBottom: '0.25rem' }}>{s.value}</div>
                        <div style={{ fontSize: 'clamp(0.7rem,2vw,0.8rem)', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* NEET Subject Breakdown */}
                  {isNeet && test.subjectScores && <NEETSubjectBreakdown test={test} />}

                  {/* Python Question Analysis */}
                  {!isNeet && (test.correctQuestions?.length > 0 || test.wrongQuestions?.length > 0) && (
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 'clamp(0.8rem,2.5vw,0.9rem)', fontWeight: '800', color: '#1e293b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 Question-wise Analysis</div>
                      {test.correctQuestions?.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700', marginBottom: '0.5rem' }}>✅ Correct ({test.correctQuestions.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {test.correctQuestions.map((qNum, idx) => (
                              <span key={idx} style={{ background: '#dcfce7', border: '1px solid #10b981', color: '#065f46', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontWeight: '700' }}>Q{qNum}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {test.wrongQuestions?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '700', marginBottom: '0.5rem' }}>❌ Wrong ({test.wrongQuestions.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {test.wrongQuestions.map((qNum, idx) => (
                              <span key={idx} style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontWeight: '700' }}>Q{qNum}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Switches */}
                  {(test.tabSwitches > 0 || test.penalized) && (
                    <div style={{ padding: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={16} color="#f59e0b" />
                      <span style={{ fontSize: 'clamp(0.75rem,2vw,0.85rem)', color: '#92400e', fontWeight: '600' }}>
                        ⚠️ Tab switches: {test.tabSwitches || 0}/3{test.penalized && ' (Penalized)'}
                      </span>
                    </div>
                  )}

                  {/* Pass/Fail */}
                  <div style={{ padding: '1rem', background: test.passed ? '#f0fdf4' : '#fef2f2', border: `2px solid ${test.passed ? '#bbf7d0' : '#fecaca'}`, borderRadius: '12px', marginBottom: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(0.85rem,2.5vw,1rem)', fontWeight: '700', color: test.passed ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {test.passed ? <><Trophy size={20} /> 🎉 PASSED!</> : <><XCircle size={20} /> 💪 Not Passed — Keep Trying! (Need 55%)</>}
                    </div>
                  </div>

                  {/* Student Info */}
                  {test.studentInfo && (
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem' }}>👤 Student Details</div>
                      <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
                        <div><strong>Name:</strong> {test.studentInfo.fullName || test.studentInfo.name}</div>
                        {test.studentInfo.email && <div><strong>Email:</strong> {test.studentInfo.email}</div>}
                        {test.studentInfo.age && <div><strong>Age:</strong> {test.studentInfo.age}</div>}
                      </div>
                    </div>
                  )}

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteTest(test); }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 'clamp(0.8rem,2vw,0.9rem)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(239,68,68,0.3)', transition: 'all 0.3s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <XCircle size={18} /> Delete Result
                  </button>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default CertificateSection;