import React from 'react';
import { Award, Download, XCircle, History, CheckCircle, Clock, Trophy, AlertTriangle } from 'lucide-react';

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
      {/* Certificates Section */}
      {userCertificates.length > 0 && (
        <div style={{
          background: isDark ? '#1e293b' : '#fff',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 4vw, 2rem)',
          marginBottom: '3rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{
            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
            fontWeight: '900',
            color: isDark ? '#e2e8f0' : '#1e293b',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <Award size={28} color="#6366f1" />
            My Certificates
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
            gap: '1.5rem'
          }}>
            {userCertificates.map((cert, i) => (
              <div
                key={i}
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1))'
                    : 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.05))',
                  border: `2px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => onViewCertificate(cert)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: cert.level === 'basic'
                      ? 'rgba(16,185,129,0.2)'
                      : cert.level === 'advanced'
                      ? 'rgba(99,102,241,0.2)'
                      : 'rgba(245,158,11,0.2)',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: cert.level === 'basic'
                      ? '#10b981'
                      : cert.level === 'advanced'
                      ? '#6366f1'
                      : '#f59e0b'
                  }}>
                    {cert.level}
                  </div>
                  <Award size={24} color="#6366f1" />
                </div>

                <h3 style={{
                  fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                  fontWeight: '800',
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  marginBottom: '0.5rem'
                }}>
                  {cert.testName}
                </h3>

                <div style={{
                  fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                  color: isDark ? '#94a3b8' : '#64748b',
                  marginBottom: '1rem'
                }}>
                  Score: <strong style={{ color: '#10b981' }}>{cert.score}%</strong> • {cert.date}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewCertificate(cert);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <Download size={18} />
                  View & Download
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCertificate(cert);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
                  }}
                >
                  <XCircle size={18} />
                  Delete Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test History Section */}
      {testHistory.length > 0 && (
        <div style={{
          background: isDark ? '#1e293b' : '#fff',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 4vw, 2rem)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          marginBottom: '3rem'
        }}>
          <h2 style={{
            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
            fontWeight: '900',
            color: isDark ? '#e2e8f0' : '#1e293b',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <History size={28} color="#6366f1" />
            Complete Test Results
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {testHistory.map((test, i) => (
              <div
                key={i}
                style={{
                  padding: 'clamp(1rem, 3vw, 1.5rem)',
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.05))' 
                    : 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.02))',
                  borderRadius: '16px',
                  border: `2px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: `2px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'}`
                }}>
                  <div>
                    <h3 style={{
                      fontSize: 'clamp(1rem, 3vw, 1.3rem)',
                      fontWeight: '800',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {test.level === 'basic' ? '🌱' : test.level === 'advanced' ? '🔥' : '⭐'}
                      {test.planName}
                    </h3>
                    <div style={{
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      color: isDark ? '#94a3b8' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} />
                        {test.testDate || test.date}
                      </span>
                      {test.testTime && (
                        <>
                          <span>•</span>
                          <span>{test.testTime}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{
                    padding: '0.75rem 1.5rem',
                    background: test.score >= 55
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    borderRadius: '12px',
                    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                    fontWeight: '900',
                    color: '#fff',
                    boxShadow: test.score >= 55
                      ? '0 4px 12px rgba(16,185,129,0.4)'
                      : '0 4px 12px rgba(239,68,68,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {test.score >= 55 ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {test.score}%
                  </div>
                </div>

                {/* Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    padding: '1rem',
                    background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}`
                  }}>
                    <div style={{
                      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                      fontWeight: '900',
                      color: '#10b981',
                      marginBottom: '0.25rem'
                    }}>
                      {test.correct}
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      ✅ Correct
                    </div>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'}`
                  }}>
                    <div style={{
                      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                      fontWeight: '900',
                      color: '#ef4444',
                      marginBottom: '0.25rem'
                    }}>
                      {test.wrong}
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      ❌ Wrong
                    </div>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`
                  }}>
                    <div style={{
                      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                      fontWeight: '900',
                      color: '#6366f1',
                      marginBottom: '0.25rem'
                    }}>
                      {test.total}
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      📊 Total
                    </div>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)'}`
                  }}>
                    <div style={{
                      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                      fontWeight: '900',
                      color: '#f59e0b',
                      marginBottom: '0.25rem'
                    }}>
                      {test.timeTaken}
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      ⏱️ Duration
                    </div>
                  </div>
                </div>

                {/* Question Analysis */}
                {(test.correctQuestions?.length > 0 || test.wrongQuestions?.length > 0) && (
                  <div style={{
                    padding: '1rem',
                    background: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'}`
                  }}>
                    <div style={{
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      fontWeight: '800',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      marginBottom: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      📋 Question-wise Analysis
                    </div>

                    {test.correctQuestions?.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{
                          fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                          color: '#10b981',
                          fontWeight: '700',
                          marginBottom: '0.5rem'
                        }}>
                          ✅ Correct ({test.correctQuestions.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {test.correctQuestions.map((qNum, idx) => (
                            <span key={idx} style={{
                              background: '#dcfce7',
                              border: '1px solid #10b981',
                              color: '#065f46',
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                              fontWeight: '700'
                            }}>
                              Q{qNum}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {test.wrongQuestions?.length > 0 && (
                      <div>
                        <div style={{
                          fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                          color: '#ef4444',
                          fontWeight: '700',
                          marginBottom: '0.5rem'
                        }}>
                          ❌ Wrong/Unattempted ({test.wrongQuestions.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {test.wrongQuestions.map((qNum, idx) => (
                            <span key={idx} style={{
                              background: '#fee2e2',
                              border: '1px solid #ef4444',
                              color: '#991b1b',
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                              fontWeight: '700'
                            }}>
                              Q{qNum}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Switches Warning */}
                {(test.tabSwitches > 0 || test.penalized) && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(245,158,11,0.1)',
                    border: `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)'}`,
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={16} color="#f59e0b" />
                    <span style={{
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      color: '#92400e',
                      fontWeight: '600'
                    }}>
                      ⚠️ Tab switches: {test.tabSwitches || 0}/3
                      {test.penalized && ' (Penalized)'}
                    </span>
                  </div>
                )}

                {/* Pass/Fail Status */}
                <div style={{
                  padding: '1rem',
                  background: test.passed
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                  border: `2px solid ${test.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: '12px',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                    fontWeight: '700',
                    color: test.passed ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    {test.passed ? (
                      <>
                        <Trophy size={20} />
                        🎉 PASSED - Certificate Issued!
                      </>
                    ) : (
                      <>
                        <XCircle size={20} />
                        💪 Not Passed - Keep Trying! (Need 55%)
                      </>
                    )}
                  </div>
                </div>

                {/* Student Info */}
                {test.studentInfo && (
                  <div style={{
                    padding: '1rem',
                    background: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'}`
                  }}>
                    <div style={{
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '700',
                      color: isDark ? '#94a3b8' : '#64748b',
                      marginBottom: '0.5rem'
                    }}>
                      👤 Student Details
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      color: isDark ? '#cbd5e1' : '#475569',
                      lineHeight: '1.6'
                    }}>
                      <div><strong>Name:</strong> {test.studentInfo.fullName}</div>
                      <div><strong>Email:</strong> {test.studentInfo.email}</div>
                      {test.studentInfo.age && <div><strong>Age:</strong> {test.studentInfo.age}</div>}
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTest(test);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
                  }}
                >
                  <XCircle size={18} />
                  Delete Result
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