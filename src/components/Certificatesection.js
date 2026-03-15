import React, { useState } from 'react';
import { Award, Download, XCircle, History, CheckCircle, Clock, Trophy, AlertTriangle, Star, Shield, Zap } from 'lucide-react';

const NEET_SECTIONS = [
  { id: 'Physics',   label: '⚡ Physics',   color: '#2563eb', lightBg: '#eff6ff', border: '#bfdbfe' },
  { id: 'Chemistry', label: '🧪 Chemistry', color: '#7c3aed', lightBg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'Botany',    label: '🌿 Botany',    color: '#16a34a', lightBg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'Zoology',   label: '🐾 Zoology',   color: '#ea580c', lightBg: '#fff7ed', border: '#fed7aa' },
];

// =============================================
// NEET SUBJECT BREAKDOWN
// =============================================
function NEETSubjectBreakdown({ test }) {
  const [openSubject, setOpenSubject] = useState(null);
  const subjectScores = test.subjectScores || {};
  const rawScore   = test.rawScore ?? 0;
  const percentage = test.score ?? 0;
  const passed     = percentage >= 55;

  return (
    <div style={{ marginTop: '1rem' }}>
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
            <div style={{ height: '6px', background: '#e2e8f0' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: s.color, transition: 'width 1s' }} />
            </div>
            <div style={{ padding: '0.35rem 1rem', fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>
              {pct}% accuracy
            </div>

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

                        <div style={{
                          fontSize: '0.92rem', fontWeight: '600', color: '#1e293b',
                          lineHeight: 1.65, marginBottom: '0.85rem',
                          padding: '0.75rem', background: '#f8fafc',
                          borderRadius: '8px', border: '1px solid #e2e8f0'
                        }}>
                          {item.question}
                        </div>

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
                                {isUserAns && !isCorrectAns && <span style={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: '800', background: '#fee2e2', color: '#b91c1c', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Your Ans</span>}
                                {isCorrectAns && <span style={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Correct</span>}
                              </div>
                            );
                          })}
                        </div>

                        {(item.chapterName || item.topic) && (
                          <div style={{ padding: '0.65rem 0.85rem', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', fontSize: '0.8rem', color: '#3730a3', fontWeight: '600', lineHeight: 1.55, marginBottom: item.explanation ? '0.75rem' : 0 }}>
                            📖 <strong>NCERT Reference:</strong> Class {item.neetClass}th {item.subject}
                            {item.chapterNo && <> — Ch.{item.chapterNo}: {item.chapterName}</>}
                            {item.topic && <> — <strong>Topic:</strong> {item.topic}</>}
                          </div>
                        )}

                        {item.explanation && (
                          <div style={{ padding: '0.85rem', background: '#fffbeb', border: '2px solid #fcd34d', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#92400e', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>💡 EXPLANATION</div>
                            <div style={{ fontSize: '0.88rem', color: '#78350f', fontWeight: '500', lineHeight: 1.7 }}>{item.explanation}</div>
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
// PREMIUM CERTIFICATE CARD
// =============================================
function PremiumCertificateCard({ cert, isDark, onViewCertificate, onDeleteCertificate }) {
  const levelConfig = {
    basic:    { color: '#059669', bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', border: '#6ee7b7', badge: '#10b981', label: 'BASIC',    star: '🥉' },
    advanced: { color: '#4f46e5', bg: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', border: '#a5b4fc', badge: '#6366f1', label: 'ADVANCED', star: '🥇' },
    expert:   { color: '#b45309', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '#fbbf24', badge: '#f59e0b', label: 'EXPERT',   star: '🏆' },
  };
  const cfg = levelConfig[cert.level] || levelConfig.basic;
  const passed = (cert.score ?? 0) >= 55;

  return (
    <div style={{
      position: 'relative',
      borderRadius: '20px',
      overflow: 'hidden',
      border: `2px solid ${cfg.border}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      background: '#fff',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    }}
      onClick={() => onViewCertificate(cert)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 48px rgba(0,0,0,0.18)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; }}
    >
      {/* Header gradient strip */}
      <div style={{
        background: `linear-gradient(135deg, ${cfg.badge}, ${cfg.color})`,
        padding: '1.25rem 1.25rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          {/* PySkill branding */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: '20px', padding: '0.25rem 0.75rem',
              fontSize: '0.7rem', fontWeight: '800', color: '#fff',
              letterSpacing: '0.08em', marginBottom: '0.5rem'
            }}>
              <Zap size={10} fill="#fff" /> PYSKILL
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: '0.05em' }}>
              CERTIFICATE OF ACHIEVEMENT
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)', borderRadius: '12px',
            padding: '0.5rem', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <Award size={24} color="#fff" />
          </div>
        </div>
      </div>

      {/* Medal floating over the fold */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '56px', height: '56px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${cfg.badge}, ${cfg.color})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem',
        border: '3px solid #fff',
        boxShadow: `0 4px 16px rgba(0,0,0,0.2)`,
        zIndex: 5
      }}>
        {cfg.star}
      </div>

      {/* Body */}
      <div style={{ padding: '2rem 1.25rem 1.25rem', marginTop: '0.5rem' }}>
        {/* Level badge */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.2rem 0.9rem',
            background: cfg.bg,
            border: `1.5px solid ${cfg.border}`,
            borderRadius: '20px',
            fontSize: '0.65rem', fontWeight: '900',
            color: cfg.color,
            letterSpacing: '0.12em'
          }}>{cfg.label} LEVEL</span>
        </div>

        {/* Test name */}
        <h3 style={{
          fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
          fontWeight: '900',
          color: '#0f172a',
          textAlign: 'center',
          marginBottom: '0.5rem',
          lineHeight: 1.3
        }}>{cert.testName}</h3>

        {/* Score row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', marginBottom: '1rem'
        }}>
          <div style={{
            padding: '0.3rem 1rem',
            background: passed ? '#f0fdf4' : '#fef2f2',
            border: `1.5px solid ${passed ? '#86efac' : '#fca5a5'}`,
            borderRadius: '20px',
            fontSize: '1rem', fontWeight: '900',
            color: passed ? '#15803d' : '#b91c1c',
            fontFamily: 'monospace'
          }}>{cert.score}%</div>
          <div style={{
            padding: '0.3rem 0.75rem',
            background: passed ? '#dcfce7' : '#fee2e2',
            borderRadius: '20px',
            fontSize: '0.72rem', fontWeight: '800',
            color: passed ? '#166534' : '#991b1b'
          }}>{passed ? '✅ PASSED' : '❌ FAILED'}</div>
        </div>

        {/* Date */}
        <div style={{
          textAlign: 'center', fontSize: '0.72rem',
          color: '#94a3b8', fontWeight: '600', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
        }}>
          <Clock size={11} /> {cert.date}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)', marginBottom: '1rem' }} />

        {/* Stars row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem', marginBottom: '1rem' }}>
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={14}
              color={i <= Math.round((cert.score / 100) * 5) ? '#f59e0b' : '#e2e8f0'}
              fill={i <= Math.round((cert.score / 100) * 5) ? '#f59e0b' : '#e2e8f0'}
            />
          ))}
        </div>

        {/* Buttons */}
        <button
          onClick={e => { e.stopPropagation(); onViewCertificate(cert); }}
          style={{
            width: '100%', padding: '0.75rem',
            borderRadius: '10px', border: 'none',
            background: `linear-gradient(135deg, ${cfg.badge}, ${cfg.color})`,
            color: '#fff', fontSize: '0.85rem', fontWeight: '800',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            marginBottom: '0.5rem',
            boxShadow: `0 4px 14px rgba(0,0,0,0.15)`,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Download size={16} /> View & Download
        </button>

        <button
          onClick={e => { e.stopPropagation(); onDeleteCertificate(cert); }}
          style={{
            width: '100%', padding: '0.65rem',
            borderRadius: '10px', border: '1.5px solid #fecaca',
            background: '#fff5f5', color: '#b91c1c',
            fontSize: '0.82rem', fontWeight: '700',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; }}
        >
          <XCircle size={14} /> Delete Certificate
        </button>
      </div>

      {/* Bottom seal */}
      <div style={{
        padding: '0.5rem',
        background: '#f8fafc',
        borderTop: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
      }}>
        <Shield size={10} color="#94a3b8" />
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.08em' }}>
          PYSKILL VERIFIED CERTIFICATE
        </span>
      </div>
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
      {/* Certificates */}
      {userCertificates.length > 0 && (
        <div style={{
          background: isDark ? '#1e293b' : '#fff',
          borderRadius: '24px',
          padding: 'clamp(1.5rem,4vw,2rem)',
          marginBottom: '3rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9'
        }}>
          {/* Section header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: '20px', padding: '0.25rem 0.9rem',
              fontSize: '0.62rem', fontWeight: '900', color: '#fff',
              letterSpacing: '0.1em', marginBottom: '0.6rem'
            }}>
              <Zap size={10} fill="#fff" /> PYSKILL PLATFORM
            </div>
            <h2 style={{
              fontSize: 'clamp(1.2rem,3vw,1.5rem)',
              fontWeight: '900',
              color: isDark ? '#e2e8f0' : '#0f172a',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              flexWrap: 'wrap', margin: 0
            }}>
              <Award size={26} color="#6366f1" /> My Certificates
            </h2>
            <p style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '0.25rem', fontWeight: '500' }}>
              {userCertificates.length} certificate{userCertificates.length !== 1 ? 's' : ''} earned
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: '1.5rem' }}>
            {userCertificates.map((cert, i) => (
              <PremiumCertificateCard
                key={i}
                cert={cert}
                isDark={isDark}
                onViewCertificate={onViewCertificate}
                onDeleteCertificate={onDeleteCertificate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      {testHistory.length > 0 && (
        <div style={{
          background: isDark ? '#1e293b' : '#fff',
          borderRadius: '24px',
          padding: 'clamp(1.5rem,4vw,2rem)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          marginBottom: '3rem',
          border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9'
        }}>
          {/* Section header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: '20px', padding: '0.25rem 0.9rem',
              fontSize: '0.62rem', fontWeight: '900', color: '#fff',
              letterSpacing: '0.1em', marginBottom: '0.6rem'
            }}>
              <Zap size={10} fill="#fff" /> PYSKILL PLATFORM
            </div>
            <h2 style={{
              fontSize: 'clamp(1.2rem,3vw,1.5rem)',
              fontWeight: '900',
              color: isDark ? '#e2e8f0' : '#0f172a',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              flexWrap: 'wrap', margin: 0
            }}>
              <History size={26} color="#6366f1" /> Complete Test Results
            </h2>
            <p style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '0.25rem', fontWeight: '500' }}>
              {testHistory.length} test{testHistory.length !== 1 ? 's' : ''} completed
            </p>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {testHistory.map((test, i) => {
              const isNeet = test.testType === 'neet';
              return (
                <div key={i} style={{
                  padding: 'clamp(1rem,3vw,1.5rem)',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: `2px solid ${isNeet ? '#fecaca' : '#e0e7ff'}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9' }}>
                    <div>
                      {/* PySkill tag */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        borderRadius: '10px', padding: '0.15rem 0.6rem',
                        fontSize: '0.58rem', fontWeight: '900', color: '#fff',
                        letterSpacing: '0.1em', marginBottom: '0.4rem'
                      }}>
                        <Zap size={8} fill="#fff" /> PYSKILL
                      </div>
                      <h3 style={{ fontSize: 'clamp(1rem,3vw,1.25rem)', fontWeight: '800', color: '#0f172a', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {isNeet ? '🧬' : test.level === 'basic' ? '🌱' : test.level === 'advanced' ? '🔥' : '⭐'}
                        {test.planName}
                        {isNeet && <span style={{ padding: '0.1rem 0.55rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '20px', fontSize: '0.62rem', fontWeight: '800', color: '#b91c1c' }}>NEET</span>}
                      </h3>
                      <div style={{ fontSize: 'clamp(0.75rem,2vw,0.82rem)', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Clock size={13} /> {test.testDate || test.date}
                        {test.testTime && <><span>•</span><span>{test.testTime}</span></>}
                      </div>
                    </div>
                    <div style={{ padding: '0.75rem 1.5rem', background: test.score >= 55 ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '14px', fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: '900', color: '#fff', boxShadow: test.score >= 55 ? '0 4px 14px rgba(16,185,129,0.4)' : '0 4px 14px rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                        <div style={{ fontSize: 'clamp(0.65rem,2vw,0.75rem)', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* NEET Subject Breakdown */}
                  {isNeet && test.subjectScores && <NEETSubjectBreakdown test={test} />}

                  {/* Python Question Analysis */}
                  {!isNeet && (test.correctQuestions?.length > 0 || test.wrongQuestions?.length > 0) && (
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 'clamp(0.8rem,2.5vw,0.85rem)', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📋 Question-wise Analysis</div>
                      {test.correctQuestions?.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: '700', marginBottom: '0.5rem' }}>✅ Correct ({test.correctQuestions.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {test.correctQuestions.map((qNum, idx) => (
                              <span key={idx} style={{ background: '#dcfce7', border: '1px solid #10b981', color: '#065f46', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.78rem', fontWeight: '700' }}>Q{qNum}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {test.wrongQuestions?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: '700', marginBottom: '0.5rem' }}>❌ Wrong ({test.wrongQuestions.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {test.wrongQuestions.map((qNum, idx) => (
                              <span key={idx} style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.78rem', fontWeight: '700' }}>Q{qNum}</span>
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
                      <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>👤 Student Details</div>
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
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #fecaca', background: '#fff5f5', color: '#b91c1c', fontSize: 'clamp(0.8rem,2vw,0.88rem)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#fecaca'; }}
                  >
                    <XCircle size={16} /> Delete Result
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