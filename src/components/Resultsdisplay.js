// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Award, Download } from 'lucide-react';

const PYTHON_PASS_PERCENTAGE = 55;

// ══════════════════════════════════════════════════════
// MAIN ResultsDisplay
// ══════════════════════════════════════════════════════
function ResultsDisplay({
  testResults,
  selectedPlan,
  userCertificates,
  isDark,
  onBackToPlans,
  onViewCertificate,
  passPercent = 55,
  certPrice = 29,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const handleBackToMockTests = () => {
    if (onBackToPlans) onBackToPlans();
    else window.location.href = '/mocktests';
  };

  if (!testResults) return null;

  const passed = testResults.percentage >= (passPercent || PYTHON_PASS_PERCENTAGE);

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
        : 'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 100%)',
      padding: isMobile ? '80px 0.75rem 2rem' : '100px 1rem 3rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Main result card */}
        <div style={{
          background: isDark ? '#1e293b' : '#fff',
          borderRadius: '24px',
          padding: isMobile ? '1.5rem 1rem' : '3rem',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          marginBottom: '2rem'
        }}>
          {/* Pass/Fail icon */}
          <div style={{
            width: isMobile ? '80px' : '120px', height: isMobile ? '80px' : '120px',
            margin: '0 auto 1.25rem', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: passed ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
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
            {passed ? 'You passed the test!' : `You need ${passPercent || PYTHON_PASS_PERCENTAGE}% to pass`}
          </p>

          {/* Score */}
          <div style={{ display: 'inline-block', padding: isMobile ? '1rem 1.5rem' : '1.5rem 3rem', background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: '900', color: passed ? '#10b981' : '#ef4444' }}>
              {testResults.percentage}%
            </div>
            <div style={{ fontSize: isMobile ? '0.78rem' : '0.9rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Your Score</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? '0.5rem' : '1.5rem', marginBottom: '1.5rem' }}>
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

          {/* Lock notice — only for paid tests */}
          {selectedPlan?.level !== 'basic' && (
            <div style={{ padding: isMobile ? '1rem' : '1.5rem', background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.2)', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
              <Clock size={isMobile ? 20 : 28} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: isMobile ? '0.82rem' : '1rem', color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: '600', margin: 0 }}>
                🔒 Test locked for 7 days. You can retake it after the lock period ends.
              </p>
            </div>
          )}

          {/* Certificate notice */}
          {passed && (
            <div style={{ padding: isMobile ? '1rem' : '1.5rem', background: 'rgba(99,102,241,0.08)', border: '2px solid rgba(99,102,241,0.2)', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
              <Award size={isMobile ? 20 : 28} color="#6366f1" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: isMobile ? '0.82rem' : '1rem', color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: '600', margin: 0 }}>
                {selectedPlan?.level === 'basic'
                  ? `🎓 Certificate earned! Go to the Certificates tab → Pay ₹${certPrice} to download.`
                  : userCertificates?.find(c => c.level === selectedPlan?.level)
                    ? '✅ Certificate already issued for this level.'
                    : '🎓 Certificate issued! Check below to download.'}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleBackToMockTests}
              style={{ flex: isMobile ? 1 : 'unset', minWidth: isMobile ? 0 : '150px', padding: isMobile ? '0.85rem 0.75rem' : '1rem 2rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: isMobile ? '0.85rem' : '1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              🔙 Mock Tests
            </button>

            {passed && selectedPlan?.level !== 'basic' && userCertificates?.find(c => c.level === selectedPlan?.level) && (
              <button onClick={() => onViewCertificate(selectedPlan.level)}
                style={{ flex: isMobile ? 1 : 'unset', minWidth: isMobile ? 0 : '150px', padding: isMobile ? '0.85rem 0.75rem' : '1rem 2rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: isMobile ? '0.85rem' : '1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Download size={16} /> Certificate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;