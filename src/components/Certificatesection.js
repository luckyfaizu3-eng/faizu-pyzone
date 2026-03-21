import React from 'react';
import {
  Award, Download, XCircle, History, CheckCircle,
  Clock, Trophy, AlertTriangle, Star, Shield, Zap, Brain
} from 'lucide-react';
import DownloadAIReportButton from './AITestReport';

// =============================================
// PREMIUM CERTIFICATE CARD
// =============================================
function PremiumCertificateCard({ cert, isDark, onViewCertificate, onDeleteCertificate }) {
  const levelConfig = {
    basic:    { color: '#059669', bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', border: '#6ee7b7', badge: '#10b981', label: 'BASIC',    star: '🥉' },
    advanced: { color: '#4f46e5', bg: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', border: '#a5b4fc', badge: '#6366f1', label: 'ADVANCED', star: '🥇' },
    pro:      { color: '#b45309', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '#fbbf24', badge: '#f59e0b', label: 'PRO',      star: '🏆' },
  };
  const cfg    = levelConfig[cert.level] || levelConfig.basic;
  const passed = (cert.score ?? 0) >= 55;

  return (
    <div
      style={{
        position: 'relative', borderRadius: '20px', overflow: 'hidden',
        border: `2px solid ${cfg.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        background: '#fff', transition: 'all 0.3s ease', cursor: 'pointer',
      }}
      onClick={() => onViewCertificate(cert)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; }}
    >
      {/* Header gradient */}
      <div style={{ background: `linear-gradient(135deg,${cfg.badge},${cfg.color})`, padding: '1.25rem 1.25rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.7rem', fontWeight: '800', color: '#fff', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              <Zap size={10} fill="#fff" /> PYSKILL
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: '0.05em' }}>CERTIFICATE OF ACHIEVEMENT</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0.5rem', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Award size={24} color="#fff" />
          </div>
        </div>
      </div>

      {/* Medal */}
      <div style={{ position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)', width: '56px', height: '56px', borderRadius: '50%', background: `linear-gradient(135deg,${cfg.badge},${cfg.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '3px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 5 }}>
        {cfg.star}
      </div>

      {/* Body */}
      <div style={{ padding: '2rem 1.25rem 1.25rem', marginTop: '0.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{ display: 'inline-block', padding: '0.2rem 0.9rem', background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: '20px', fontSize: '0.65rem', fontWeight: '900', color: cfg.color, letterSpacing: '0.12em' }}>
            {cfg.label} LEVEL
          </span>
        </div>

        <h3 style={{ fontSize: 'clamp(0.95rem,2.5vw,1.1rem)', fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: '0.5rem', lineHeight: 1.3 }}>
          {cert.testName}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.3rem 1rem', background: passed ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${passed ? '#86efac' : '#fca5a5'}`, borderRadius: '20px', fontSize: '1rem', fontWeight: '900', color: passed ? '#15803d' : '#b91c1c', fontFamily: 'monospace' }}>
            {cert.score}%
          </div>
          <div style={{ padding: '0.3rem 0.75rem', background: passed ? '#dcfce7' : '#fee2e2', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800', color: passed ? '#166534' : '#991b1b' }}>
            {passed ? '✅ PASSED' : '❌ FAILED'}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
          <Clock size={11} /> {cert.date}
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(to right,transparent,#e2e8f0,transparent)', marginBottom: '1rem' }} />

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem', marginBottom: '1rem' }}>
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={14}
              color={i <= Math.round((cert.score / 100) * 5) ? '#f59e0b' : '#e2e8f0'}
              fill={i  <= Math.round((cert.score / 100) * 5) ? '#f59e0b' : '#e2e8f0'}
            />
          ))}
        </div>

        {/* View button */}
        <button
          onClick={e => { e.stopPropagation(); onViewCertificate(cert); }}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${cfg.badge},${cfg.color})`, color: '#fff', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Download size={16} /> View & Download
        </button>

        {/* Delete button */}
        <button
          onClick={e => { e.stopPropagation(); onDeleteCertificate(cert); }}
          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #fecaca', background: '#fff5f5', color: '#b91c1c', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}
        >
          <XCircle size={14} /> Delete Certificate
        </button>
      </div>

      {/* Verified seal */}
      <div style={{ padding: '0.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
        <Shield size={10} color="#94a3b8" />
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.08em' }}>PYSKILL VERIFIED CERTIFICATE</span>
      </div>
    </div>
  );
}

// =============================================
// AI REPORT BANNER (above results list)
// =============================================
function AIReportBanner({ isDark, savedReport }) {
  if (!savedReport?.pdfUrl) return null;
  return (
    <div style={{
      background:     isDark
        ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))'
        : 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))',
      border:         `2px solid ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.25)'}`,
      borderRadius:   '16px',
      padding:        '1rem 1.25rem',
      marginBottom:   '1.5rem',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      flexWrap:       'wrap',
      gap:            '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Brain size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '0.15rem' }}>
            🎉 Your AI Performance Report is Ready!
          </div>
          <div style={{ fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
            Personalized analysis • Weak areas • Study tips • Motivation
          </div>
        </div>
      </div>
      <DownloadAIReportButton isDark={isDark} savedReport={savedReport} />
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
  onDeleteTest,
  aiReports = {},
}) {
  if (!userCertificates.length && !testHistory.length) return null;

  return (
    <>
      {/* ══ CERTIFICATES SECTION ══ */}
      {userCertificates.length > 0 && (
        <div style={{
          background:   isDark ? '#1e293b' : '#fff',
          borderRadius: '24px',
          padding:      'clamp(1.5rem,4vw,2rem)',
          marginBottom: '3rem',
          boxShadow:    '0 10px 40px rgba(0,0,0,0.1)',
          border:       isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '20px', padding: '0.25rem 0.9rem', fontSize: '0.62rem', fontWeight: '900', color: '#fff', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>
              <Zap size={10} fill="#fff" /> PYSKILL PLATFORM
            </div>
            <h2 style={{ fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', margin: 0 }}>
              <Award size={26} color="#6366f1" /> My Certificates
            </h2>
            <p style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '0.25rem', fontWeight: '500' }}>
              {userCertificates.length} certificate{userCertificates.length !== 1 ? 's' : ''} earned
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: '1.5rem' }}>
            {userCertificates.map((cert, i) => (
              <PremiumCertificateCard
                key={i} cert={cert} isDark={isDark}
                onViewCertificate={onViewCertificate}
                onDeleteCertificate={onDeleteCertificate}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ TEST RESULTS SECTION ══ */}
      {testHistory.length > 0 && (
        <div style={{
          background:   isDark ? '#1e293b' : '#fff',
          borderRadius: '24px',
          padding:      'clamp(1.5rem,4vw,2rem)',
          boxShadow:    '0 10px 40px rgba(0,0,0,0.1)',
          marginBottom: '3rem',
          border:       isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '20px', padding: '0.25rem 0.9rem', fontSize: '0.62rem', fontWeight: '900', color: '#fff', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>
              <Zap size={10} fill="#fff" /> PYSKILL PLATFORM
            </div>
            <h2 style={{ fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', margin: 0 }}>
              <History size={26} color="#6366f1" /> Complete Test Results
            </h2>
            <p style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '0.25rem', fontWeight: '500' }}>
              {testHistory.length} test{testHistory.length !== 1 ? 's' : ''} completed
            </p>
          </div>

          {/* AI Report Banner — top of results list */}
          <AIReportBanner isDark={isDark} savedReport={aiReports?.latest} />

          {/* Results list */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {testHistory.map((test, i) => (
              <div key={i} style={{
                padding:      'clamp(1rem,3vw,1.5rem)',
                background:   isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                borderRadius: '20px',
                border:       isDark
                  ? '2px solid rgba(99,102,241,0.2)'
                  : '2px solid #e0e7ff',
                boxShadow:    isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.06)',
                position:     'relative',
                overflow:     'hidden',
              }}>

                {/* Latest badge */}
                {i === 0 && (
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.06em' }}>
                    LATEST
                  </div>
                )}

                {/* ── Test Header ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}` }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '10px', padding: '0.15rem 0.6rem', fontSize: '0.58rem', fontWeight: '900', color: '#fff', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                      <Zap size={8} fill="#fff" /> PYSKILL
                    </div>
                    <h3 style={{ fontSize: 'clamp(1rem,3vw,1.25rem)', fontWeight: '800', color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {test.level === 'basic' ? '🌱' : test.level === 'advanced' ? '🔥' : '⭐'} {test.planName}
                    </h3>
                    <div style={{ fontSize: 'clamp(0.75rem,2vw,0.82rem)', color: isDark ? '#64748b' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Clock size={13} /> {test.testDate || test.date}
                      {test.testTime && <><span>•</span><span>{test.testTime}</span></>}
                      <span>•</span>
                      <span style={{ textTransform: 'uppercase', fontWeight: '700', color: isDark ? '#94a3b8' : '#6366f1' }}>{test.level}</span>
                    </div>
                  </div>

                  {/* Score badge */}
                  <div style={{ padding: '0.75rem 1.5rem', background: test.score >= 55 ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '14px', fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: '900', color: '#fff', boxShadow: test.score >= 55 ? '0 4px 14px rgba(16,185,129,0.4)' : '0 4px 14px rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {test.score >= 55 ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {test.score}%
                  </div>
                </div>

                {/* ── Stats Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(140px,100%),1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: '✅ Correct',  value: test.correct,   color: '#10b981', bg: '#f0fdf4', bdr: '#bbf7d0' },
                    { label: '❌ Wrong',    value: test.wrong,     color: '#ef4444', bg: '#fef2f2', bdr: '#fecaca' },
                    { label: '📊 Total',   value: test.total,     color: '#6366f1', bg: '#eef2ff', bdr: '#c7d2fe' },
                    { label: '⏱️ Duration',value: test.timeTaken, color: '#f59e0b', bg: '#fffbeb', bdr: '#fde68a' },
                  ].map((s, idx) => (
                    <div key={idx} style={{ padding: '1rem', background: isDark ? 'rgba(255,255,255,0.04)' : s.bg, borderRadius: '12px', textAlign: 'center', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : s.bdr}` }}>
                      <div style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: '900', color: s.color, marginBottom: '0.25rem' }}>{s.value}</div>
                      <div style={{ fontSize: 'clamp(0.65rem,2vw,0.75rem)', color: isDark ? '#64748b' : '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* ── Question Analysis ── */}
                {(test.correctQuestions?.length > 0 || test.wrongQuestions?.length > 0) && (
                  <div style={{ padding: '1rem', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px', marginBottom: '1rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}` }}>
                    <div style={{ fontSize: 'clamp(0.8rem,2.5vw,0.85rem)', fontWeight: '800', color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      📋 Question-wise Analysis
                    </div>
                    {test.correctQuestions?.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: '700', marginBottom: '0.5rem' }}>
                          ✅ Correct ({test.correctQuestions.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {test.correctQuestions.map((qNum, idx) => (
                            <span key={idx} style={{ background: isDark ? 'rgba(16,185,129,0.2)' : '#dcfce7', border: `1px solid ${isDark ? 'rgba(16,185,129,0.4)' : '#10b981'}`, color: isDark ? '#6ee7b7' : '#065f46', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.78rem', fontWeight: '700' }}>
                              Q{qNum}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {test.wrongQuestions?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: '700', marginBottom: '0.5rem' }}>
                          ❌ Wrong ({test.wrongQuestions.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {test.wrongQuestions.map((qNum, idx) => (
                            <span key={idx} style={{ background: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.4)' : '#ef4444'}`, color: isDark ? '#fca5a5' : '#991b1b', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.78rem', fontWeight: '700' }}>
                              Q{qNum}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab Switches warning ── */}
                {(test.tabSwitches > 0 || test.penalized) && (
                  <div style={{ padding: '0.75rem', background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} color="#f59e0b" />
                    <span style={{ fontSize: 'clamp(0.75rem,2vw,0.85rem)', color: '#92400e', fontWeight: '600' }}>
                      ⚠️ Tab switches: {test.tabSwitches || 0}/3{test.penalized && ' (Penalized)'}
                    </span>
                  </div>
                )}

                {/* ── Pass / Fail banner ── */}
                <div style={{ padding: '1rem', background: test.passed ? (isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4') : (isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'), border: `2px solid ${test.passed ? (isDark ? 'rgba(16,185,129,0.3)' : '#bbf7d0') : (isDark ? 'rgba(239,68,68,0.3)' : '#fecaca')}`, borderRadius: '12px', marginBottom: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(0.85rem,2.5vw,1rem)', fontWeight: '700', color: test.passed ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {test.passed
                      ? <><Trophy size={20} /> 🎉 PASSED!</>
                      : <><XCircle size={20} /> 💪 Not Passed — Keep Trying! (Need 55%)</>
                    }
                  </div>
                </div>

                {/* ── Student Info ── */}
                {test.studentInfo && (
                  <div style={{ padding: '1rem', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px', marginBottom: '1rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}` }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: isDark ? '#64748b' : '#475569', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      👤 Student Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.4rem 1.5rem' }}>
                      {[
                        ['Name',     test.studentInfo.fullName || test.studentInfo.name],
                        ['Email',    test.studentInfo.email],
                        ['Age',      test.studentInfo.age],
                        ['Address',  test.studentInfo.address],
                      ].filter(([, val]) => val && val !== 'N/A').map(([lbl, val]) => (
                        <div key={lbl} style={{ fontSize: '0.85rem', color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.6 }}>
                          <span style={{ fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>{lbl}: </span>
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── AI Report Download — latest test only ── */}
                {i === 0 && aiReports?.latest?.pdfUrl && (
                  <div style={{
                    padding:      '1rem 1.1rem',
                    background:   isDark
                      ? 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))'
                      : 'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(139,92,246,0.04))',
                    border:       `1.5px solid ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.22)'}`,
                    borderRadius: '14px',
                    marginBottom: '1rem',
                  }}>
                    {/* Label row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Brain size={16} color="#6366f1" />
                      <span style={{ fontSize: '0.84rem', fontWeight: '800', color: isDark ? '#c7d2fe' : '#4338ca' }}>
                        AI Performance Report Ready
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.6rem', fontWeight: '800', background: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.12)', color: '#6366f1', padding: '0.15rem 0.55rem', borderRadius: '20px', letterSpacing: '0.05em' }}>
                        NEW
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      Personalized analysis with strengths, weak areas &amp; improvement tips
                    </div>
                    <DownloadAIReportButton isDark={isDark} savedReport={aiReports.latest} />
                  </div>
                )}

                {/* ── Delete Result ── */}
                <button
                  onClick={e => { e.stopPropagation(); onDeleteTest(test); }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #fecaca', background: isDark ? 'rgba(239,68,68,0.08)' : '#fff5f5', color: '#b91c1c', fontSize: 'clamp(0.8rem,2vw,0.88rem)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.08)' : '#fff5f5'}
                >
                  <XCircle size={16} /> Delete Result
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default CertificateSection;