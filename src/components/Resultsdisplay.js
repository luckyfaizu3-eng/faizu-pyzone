import React from 'react';
import { CheckCircle, XCircle, Clock, Award, Download } from 'lucide-react';

function ResultsDisplay({ 
  testResults, 
  selectedPlan, 
  userCertificates, 
  isDark, 
  onBackToPlans, 
  onViewCertificate 
}) {
  if (!testResults) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
        : 'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 100%)',
      paddingTop: '100px',
      paddingBottom: '3rem',
      padding: '100px 1rem 3rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          background: isDark ? '#1e293b' : '#fff',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 5vw, 3rem)',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          marginBottom: '2rem'
        }}>
          {/* Success/Fail Icon */}
          <div style={{
            width: 'clamp(80px, 20vw, 120px)',
            height: 'clamp(80px, 20vw, 120px)',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: testResults.percentage >= 55
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, #ef4444, #dc2626)',
            boxShadow: testResults.percentage >= 55
              ? '0 8px 24px rgba(16,185,129,0.4)'
              : '0 8px 24px rgba(239,68,68,0.4)'
          }}>
            {testResults.percentage >= 55 ? (
              <CheckCircle size={window.innerWidth < 768 ? 40 : 60} color="#fff" />
            ) : (
              <XCircle size={window.innerWidth < 768 ? 40 : 60} color="#fff" />
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            fontWeight: '900',
            marginBottom: '0.5rem',
            color: testResults.percentage >= 55 ? '#10b981' : '#ef4444'
          }}>
            {testResults.percentage >= 55 ? '🎉 Congratulations!' : '💪 Keep Trying!'}
          </h1>

          <p style={{
            fontSize: 'clamp(0.9rem, 3vw, 1.2rem)',
            color: isDark ? '#94a3b8' : '#64748b',
            marginBottom: '2rem'
          }}>
            {testResults.percentage >= 55
              ? 'You passed the test!'
              : 'You need 55% to pass'}
          </p>

          {/* Score Display */}
          <div style={{
            display: 'inline-block',
            padding: 'clamp(1rem, 3vw, 1.5rem) clamp(2rem, 5vw, 3rem)',
            background: testResults.percentage >= 55
              ? 'rgba(16,185,129,0.1)'
              : 'rgba(239,68,68,0.1)',
            borderRadius: '16px',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              fontWeight: '900',
              color: testResults.percentage >= 55 ? '#10b981' : '#ef4444'
            }}>
              {testResults.percentage}%
            </div>
            <div style={{
              fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: '600'
            }}>
              Your Score
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(0.75rem, 2vw, 1.5rem)',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
              borderRadius: '16px'
            }}>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: '900',
                color: '#6366f1',
                marginBottom: '0.5rem'
              }}>
                {testResults.correct}
              </div>
              <div style={{
                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: '600'
              }}>
                Correct
              </div>
            </div>

            <div style={{
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
              borderRadius: '16px'
            }}>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: '900',
                color: '#ef4444',
                marginBottom: '0.5rem'
              }}>
                {testResults.wrong}
              </div>
              <div style={{
                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: '600'
              }}>
                Wrong
              </div>
            </div>

            <div style={{
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
              borderRadius: '16px'
            }}>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: '900',
                color: '#10b981',
                marginBottom: '0.5rem'
              }}>
                {testResults.total}
              </div>
              <div style={{
                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: '600'
              }}>
                Total
              </div>
            </div>
          </div>

          {/* Lock Notice */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.1))',
            border: `2px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: '16px',
            marginBottom: '2rem'
          }}>
            <Clock size={32} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
            <p style={{
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontWeight: '600',
              margin: 0
            }}>
              🔒 Test locked for 7 days. You can take it again after the lock period.
            </p>
          </div>

          {/* Certificate Notice */}
          {testResults.percentage >= 55 && (
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1))',
              border: `2px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
              borderRadius: '16px',
              marginBottom: '2rem'
            }}>
              <Award size={32} color="#6366f1" style={{ marginBottom: '0.75rem' }} />
              <p style={{
                fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontWeight: '600',
                margin: 0
              }}>
                {userCertificates.find(c => c.level === selectedPlan.level)
                  ? '✅ Certificate already issued for this level (One per level)'
                  : '🎓 Certificate issued! Check below to download.'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={onBackToPlans}
              style={{
                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                minWidth: '150px'
              }}
            >
              Back to Tests
            </button>

            {testResults.percentage >= 55 && userCertificates.find(c => c.level === selectedPlan.level) && (
              <button
                onClick={() => onViewCertificate(selectedPlan.level)}
                style={{
                  padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minWidth: '150px',
                  justifyContent: 'center'
                }}
              >
                <Download size={20} />
                View Certificate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;