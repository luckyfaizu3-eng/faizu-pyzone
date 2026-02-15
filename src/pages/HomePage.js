import React, { useState, useEffect, useRef } from 'react';
import { Download, Shield, Zap, Instagram, BookOpen } from 'lucide-react';
import { useTheme, useAuth } from '../App';

// ─── LIVE STUDENT COUNTER HOOK ────────────────────────────────────────────────
function useLiveStudentCount() {
  const [displayCount, setDisplayCount] = useState(213);
  const targetRef = useRef(213);
  const displayRef = useRef(213);

  // Tick display toward target one step at a time (count-up feel)
  useEffect(() => {
    const ticker = setInterval(() => {
      const curr = displayRef.current;
      const tgt  = targetRef.current;
      if (curr === tgt) return;
      displayRef.current = curr + (curr < tgt ? 1 : -1);
      setDisplayCount(displayRef.current);
    }, 60);
    return () => clearInterval(ticker);
  }, []);

  // Every 10–15 sec shift target ±2–5, hard cap 150–299
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        const delta = (Math.floor(Math.random() * 4) + 2) * (Math.random() > 0.45 ? 1 : -1);
        targetRef.current = Math.min(299, Math.max(150, targetRef.current + delta));
        schedule();
      }, 10000 + Math.random() * 5000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return displayCount;
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ setCurrentPage }) {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const studentCount = useLiveStudentCount();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const phrases = useRef([
    "Premium Study Notes",
    "Master Python",
    "Excel in Exams",
    "Land Your Dream Job"
  ]).current;

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const typingSpeed = isDeleting ? 25 : 70;
    const pauseTime = 1800;

    const timeout = setTimeout(() => {
      if (!isDeleting && currentIndex < currentPhrase.length) {
        setCurrentText(currentPhrase.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      } else if (isDeleting && currentIndex > 0) {
        setCurrentText(currentPhrase.substring(0, currentIndex - 1));
        setCurrentIndex(currentIndex - 1);
      } else if (!isDeleting && currentIndex === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), pauseTime);
      } else if (isDeleting && currentIndex === 0) {
        setIsDeleting(false);
        setPhraseIndex((phraseIndex + 1) % phrases.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, phraseIndex, phrases]);

  return (
    <div style={{ paddingTop: isMobile ? '62px' : '70px', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ===== HERO SECTION ===== */}
      <section style={{
        padding: isMobile ? '32px 16px 28px' : '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        background: isDark
          ? 'linear-gradient(180deg, rgba(30,27,75,0.6) 0%, transparent 70%)'
          : 'linear-gradient(180deg, #f0f4ff 0%, transparent 70%)',
        borderRadius: '0 0 32px 32px'
      }}>
        <div style={{
          position: 'absolute', top: '-20px', left: '-40px',
          width: isMobile ? '150px' : '200px',
          height: isMobile ? '150px' : '200px',
          background: isDark
            ? 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '10px', right: '-30px',
          width: isMobile ? '140px' : '180px',
          height: isMobile ? '140px' : '180px',
          background: isDark
            ? 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        {/* Logo badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
          border: isDark ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(99,102,241,0.2)',
          borderRadius: '50px',
          padding: '6px 14px 6px 6px',
          marginBottom: isMobile ? '16px' : '24px'
        }}>
          <div style={{
            width: '30px', height: '30px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px'
          }}>🎓</div>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6366f1' }}>FaizUpyZone</span>
        </div>

        {/* Typing heading */}
        <h1 style={{
          fontSize: isMobile ? '1.8rem' : '3.8rem',
          fontWeight: '900',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #1e40af, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
          minHeight: isMobile ? '50px' : '96px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 10px'
        }}>
          {currentText}
          <span style={{
            borderRight: '3px solid #6366f1',
            animation: 'blink 0.7s infinite',
            marginLeft: '6px',
            height: isMobile ? '28px' : '56px',
            display: 'inline-block'
          }} />
        </h1>

        <p style={{
          fontSize: isMobile ? '0.9rem' : '1.15rem',
          color: isDark ? '#94a3b8' : '#64748b',
          maxWidth: '560px',
          margin: '0 auto 20px',
          lineHeight: 1.6,
          fontWeight: '500',
          padding: '0 10px'
        }}>
          Quality study materials for JKBOSE, Python & Job Prep — delivered instantly after payment.
        </p>

        {/* Trust badges */}
        <div style={{
          display: 'flex', gap: '8px', justifyContent: 'center',
          flexWrap: 'wrap', marginBottom: '24px', padding: '0 10px'
        }}>
          {[
            { icon: Shield, color: '#10b981', text: 'Secure Payment' },
            { icon: Zap, color: '#6366f1', text: 'Instant Access' },
            { icon: BookOpen, color: '#ec4899', text: '100% Original' }
          ].map((badge, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: `${badge.color}${isDark ? '18' : '10'}`,
              padding: isMobile ? '6px 12px' : '7px 14px',
              borderRadius: '50px',
              border: `1px solid ${badge.color}${isDark ? '40' : '30'}`
            }}>
              <badge.icon size={isMobile ? 14 : 15} color={badge.color} />
              <span style={{
                fontSize: isMobile ? '0.75rem' : '0.82rem',
                fontWeight: '600',
                color: badge.color
              }}>
                {badge.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setCurrentPage('products')}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            border: 'none', color: 'white',
            padding: isMobile ? '12px 28px' : '16px 40px',
            fontSize: isMobile ? '0.95rem' : '1.15rem',
            borderRadius: '50px', cursor: 'pointer', fontWeight: '700',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.35)';
          }}
        >
          <Download size={isMobile ? 18 : 20} />
          Browse Notes Now
        </button>
      </section>

      {/* ===== QUICK ACTION CARDS ===== */}
      <section style={{
        padding: isMobile ? '20px 16px' : '40px 24px',
        maxWidth: '1000px', margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? '10px' : '14px'
        }}>
          {[
            { icon: '📚', label: 'Browse Notes', page: 'products', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
            { icon: '🐍', label: 'Mock Tests', page: 'mocktests', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
            { icon: '📦', label: 'My Orders', page: 'orders', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
            user ?
              { icon: '👤', label: 'Logout', page: null, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', action: logout } :
              { icon: '🔐', label: 'Login', page: 'login', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' }
          ].map((card, i) => (
            <button
              key={i}
              onClick={() => {
                if (card.action) card.action();
                else setCurrentPage(card.page);
              }}
              style={{
                background: isDark ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: isDark ? '1.5px solid #334155' : '1.5px solid #e8ecf0',
                borderRadius: isMobile ? '14px' : '16px',
                padding: isMobile ? '14px 8px' : '20px 14px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: isMobile ? '8px' : '10px',
                transition: 'all 0.25s ease',
                boxShadow: isDark
                  ? '0 2px 12px rgba(0,0,0,0.3)'
                  : '0 2px 12px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = isDark
                  ? '0 8px 24px rgba(0,0,0,0.5)'
                  : '0 8px 24px rgba(0,0,0,0.12)';
                e.currentTarget.style.borderColor = '#6366f1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isDark
                  ? '0 2px 12px rgba(0,0,0,0.3)'
                  : '0 2px 12px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = isDark ? '#334155' : '#e8ecf0';
              }}
            >
              <div style={{
                width: isMobile ? '38px' : '44px',
                height: isMobile ? '38px' : '44px',
                background: card.gradient,
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? '1.2rem' : '1.4rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {card.icon}
              </div>
              <span style={{
                fontSize: isMobile ? '0.72rem' : '0.85rem',
                fontWeight: '700',
                color: isDark ? '#e2e8f0' : '#1e293b'
              }}>
                {card.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== 🔥 MOCK TEST BANNER ===== */}
      <section style={{
        padding: isMobile ? '0 16px 24px' : '0 24px 40px',
        maxWidth: '1000px', margin: '0 auto'
      }}>
        <div
          onClick={() => setCurrentPage('mocktests')}
          style={{
            position: 'relative',
            borderRadius: isMobile ? '20px' : '28px',
            overflow: 'hidden',
            cursor: 'pointer',
            // Glass — lets the animated canvas bg show through
            background: isDark
              ? 'rgba(15, 10, 40, 0.52)'
              : 'rgba(238, 235, 255, 0.58)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: isDark
              ? '1.5px solid rgba(139,92,246,0.32)'
              : '1.5px solid rgba(99,102,241,0.22)',
            boxShadow: isDark
              ? '0 8px 40px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 8px 40px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.85)',
            transition: 'all 0.35s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = isDark
              ? '0 20px 60px rgba(99,102,241,0.32), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 20px 60px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.9)';
            e.currentTarget.style.borderColor = isDark
              ? 'rgba(139,92,246,0.55)'
              : 'rgba(99,102,241,0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDark
              ? '0 8px 40px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 8px 40px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.85)';
            e.currentTarget.style.borderColor = isDark
              ? 'rgba(139,92,246,0.32)'
              : 'rgba(99,102,241,0.22)';
          }}
        >
          {/* Soft inner glow orbs — subtle, don't fight canvas */}
          <div style={{
            position: 'absolute', top: '-60px', left: '-60px',
            width: isMobile ? '180px' : '260px',
            height: isMobile ? '180px' : '260px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
            animation: 'float1 4s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', right: '-40px',
            width: isMobile ? '160px' : '220px',
            height: isMobile ? '160px' : '220px',
            background: 'radial-gradient(circle, rgba(236,72,153,0.13) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
            animation: 'float2 5s ease-in-out infinite'
          }} />

          {/* ── MAIN CONTENT ── */}
          <div style={{
            position: 'relative', zIndex: 2,
            padding: isMobile ? '24px 20px' : '36px 44px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: isMobile ? '20px' : '40px'
          }}>

            {/* Left: icon + price badge */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{
                width: isMobile ? '70px' : '88px',
                height: isMobile ? '70px' : '88px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: isMobile ? '20px' : '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? '2rem' : '2.8rem',
                margin: '0 auto',
                boxShadow: '0 10px 35px rgba(99,102,241,0.45)',
                animation: 'pulse 2.5s ease-in-out infinite',
                border: isDark
                  ? '1.5px solid rgba(139,92,246,0.45)'
                  : '1.5px solid rgba(99,102,241,0.3)'
              }}>
                🐍
              </div>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: '900',
                padding: '4px 12px',
                borderRadius: '50px',
                marginTop: '10px',
                letterSpacing: '0.08em',
                boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
              }}>
                Only ₹12
              </div>
            </div>

            {/* Right: text content */}
            <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>

              {/* ── LIVE badge row + student count ── */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                justifyContent: isMobile ? 'center' : 'flex-start',
                marginBottom: '12px'
              }}>
                {/* LIVE NOW pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  background: isDark
                    ? 'rgba(139,92,246,0.16)'
                    : 'rgba(99,102,241,0.09)',
                  border: isDark
                    ? '1px solid rgba(139,92,246,0.38)'
                    : '1px solid rgba(99,102,241,0.28)',
                  borderRadius: '50px',
                  padding: isMobile ? '5px 12px' : '6px 14px',
                  backdropFilter: 'blur(8px)'
                }}>
                  <span style={{
                    width: '7px', height: '7px',
                    borderRadius: '50%',
                    background: '#f87171',
                    display: 'inline-block',
                    flexShrink: 0,
                    animation: 'liveDot 1.2s ease-in-out infinite'
                  }} />
                  <span style={{
                    color: isDark ? '#c4b5fd' : '#6366f1',
                    fontSize: isMobile ? '0.72rem' : '0.76rem',
                    fontWeight: '800',
                    letterSpacing: '0.08em'
                  }}>
                    MOCK TESTS — LIVE NOW
                  </span>
                </div>

                {/* 👥 Student count pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: isDark
                    ? 'rgba(167,139,250,0.12)'
                    : 'rgba(99,102,241,0.07)',
                  border: isDark
                    ? '1px solid rgba(167,139,250,0.28)'
                    : '1px solid rgba(99,102,241,0.18)',
                  borderRadius: '50px',
                  padding: isMobile ? '4px 11px' : '5px 13px',
                  backdropFilter: 'blur(8px)'
                }}>
                  <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem' }}>👥</span>
                  <span
                    key={studentCount}
                    style={{
                      fontSize: isMobile ? '0.8rem' : '0.88rem',
                      fontWeight: '900',
                      color: isDark ? '#a78bfa' : '#6366f1',
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: isMobile ? '26px' : '30px',
                      textAlign: 'center',
                      display: 'inline-block',
                      animation: 'countPop 0.22s ease-out'
                    }}
                  >
                    {studentCount}
                  </span>
                  <span style={{
                    fontSize: isMobile ? '0.68rem' : '0.72rem',
                    color: isDark ? 'rgba(203,213,225,0.65)' : '#64748b',
                    fontWeight: '600'
                  }}>
                    students online
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h2 style={{
                fontSize: isMobile ? '1.35rem' : '2rem',
                fontWeight: '900',
                color: isDark ? '#f1f5f9' : '#1e293b',
                margin: '0 0 8px',
                lineHeight: 1.25,
                letterSpacing: '-0.02em'
              }}>
                Test Your Python Skills
                <span style={{
                  display: 'block',
                  background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  & Earn a Certificate! 🏆
                </span>
              </h2>

              <p style={{
                fontSize: isMobile ? '0.82rem' : '0.95rem',
                color: isDark ? 'rgba(203,213,225,0.8)' : '#475569',
                margin: '0 0 18px',
                lineHeight: 1.6,
                maxWidth: '460px'
              }}>
                Timed mock tests with instant results, question-wise analysis & official certificate for 55%+ scores. Real exam feel at just ₹12!
              </p>

              {/* Feature pills */}
              <div style={{
                display: 'flex', flexWrap: 'wrap',
                gap: '8px', marginBottom: '20px',
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                {[
                  { icon: '⏱️', text: 'Timed Test' },
                  { icon: '📊', text: 'Result Analysis' },
                  { icon: '🏆', text: 'Certificate' },
                  { icon: '🔒', text: 'Secure Exam' }
                ].map((pill, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(99,102,241,0.06)',
                    border: isDark
                      ? '1px solid rgba(255,255,255,0.1)'
                      : '1px solid rgba(99,102,241,0.14)',
                    borderRadius: '50px',
                    padding: isMobile ? '5px 11px' : '6px 13px',
                    fontSize: isMobile ? '0.72rem' : '0.78rem',
                    fontWeight: '700',
                    color: isDark ? 'rgba(226,232,240,0.88)' : '#475569'
                  }}>
                    <span>{pill.icon}</span>
                    <span>{pill.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentPage('mocktests'); }}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', color: '#fff',
                  padding: isMobile ? '11px 24px' : '13px 32px',
                  borderRadius: '50px',
                  fontSize: isMobile ? '0.88rem' : '1rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
                  letterSpacing: '0.02em',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(99,102,241,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.4)';
                }}
              >
                Start Test @ ₹12 Only →
              </button>
            </div>
          </div>

          {/* ── BOTTOM STRIP ── */}
          <div style={{
            position: 'relative', zIndex: 2,
            borderTop: isDark
              ? '1px solid rgba(139,92,246,0.14)'
              : '1px solid rgba(99,102,241,0.1)',
            background: isDark
              ? 'rgba(0,0,0,0.15)'
              : 'rgba(99,102,241,0.03)',
            backdropFilter: 'blur(8px)',
            padding: isMobile ? '10px 20px' : '12px 44px',
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {[
              { val: '₹12', label: 'Only' },
              { val: '55%+', label: 'Get Certificate' },
              { val: '⚡', label: 'Instant Results' },
              { val: '🔐', label: 'Secure Exam' }
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign: 'center', display: 'flex',
                alignItems: 'center', gap: '6px'
              }}>
                <span style={{
                  color: isDark ? '#a78bfa' : '#6366f1',
                  fontWeight: '900',
                  fontSize: isMobile ? '0.85rem' : '0.95rem'
                }}>
                  {stat.val}
                </span>
                <span style={{
                  color: isDark ? 'rgba(148,163,184,0.75)' : '#64748b',
                  fontSize: isMobile ? '0.72rem' : '0.78rem',
                  fontWeight: '600'
                }}>
                  {stat.label}
                </span>
                {i < 3 && !isMobile && (
                  <span style={{
                    color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    marginLeft: '6px'
                  }}>•</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section style={{
        padding: isMobile ? '24px 16px' : '40px 24px',
        maxWidth: '1000px', margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.4rem' : '2rem',
          fontWeight: '900', textAlign: 'center',
          marginBottom: isMobile ? '16px' : '28px',
          color: isDark ? '#e2e8f0' : '#1e293b'
        }}>
          Why Students Love Us
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '12px' : '18px'
        }}>
          {[
            { icon: '📚', title: 'Quality Content', desc: 'Expert-curated notes & filtered important questions.', color: '#6366f1' },
            { icon: '🔒', title: 'Secure & Safe', desc: 'Razorpay protected payments — UPI, Cards & more.', color: '#10b981' },
            { icon: '⚡', title: 'Instant Download', desc: 'Get your PDFs the second payment is done.', color: '#ec4899' }
          ].map((f, i) => (
            <div key={i} style={{
              background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: isDark ? '1.5px solid #334155' : '1.5px solid #e8ecf0',
              borderRadius: '18px',
              padding: isMobile ? '16px 14px' : '24px',
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              boxShadow: isDark
                ? '0 2px 12px rgba(0,0,0,0.25)'
                : '0 2px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = f.color;
              e.currentTarget.style.boxShadow = `0 6px 20px ${f.color}${isDark ? '30' : '20'}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDark ? '#334155' : '#e8ecf0';
              e.currentTarget.style.boxShadow = isDark
                ? '0 2px 12px rgba(0,0,0,0.25)'
                : '0 2px 12px rgba(0,0,0,0.05)';
            }}>
              <div style={{
                width: isMobile ? '38px' : '42px',
                height: isMobile ? '38px' : '42px',
                flexShrink: 0,
                background: `${f.color}${isDark ? '20' : '12'}`,
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? '1.2rem' : '1.3rem'
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: '800',
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  marginBottom: '3px'
                }}>{f.title}</div>
                <div style={{
                  fontSize: isMobile ? '0.78rem' : '0.82rem',
                  color: isDark ? '#94a3b8' : '#64748b',
                  lineHeight: 1.5
                }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== INFO CARDS SECTION ===== */}
      <section style={{
        padding: isMobile ? '24px 16px' : '40px 24px',
        maxWidth: '1000px', margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.4rem' : '2rem',
          fontWeight: '900', textAlign: 'center',
          marginBottom: isMobile ? '16px' : '28px',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Why FaizUpyZone?
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '12px' : '18px'
        }}>
          {[
            { icon: '📜', title: 'Our Policy', desc: 'Genuine, quality-checked study materials reviewed before upload. No refund after download, but we guarantee satisfaction with preview options.', color: '#6366f1' },
            { icon: '💳', title: 'Secure Payment', desc: "Transactions via Razorpay — India's most trusted gateway. UPI, Cards, Net Banking & Wallets. Fully encrypted & secure.", color: '#10b981' },
            { icon: '🎯', title: 'Why Choose Us', desc: 'Instant access, lifetime downloads, mobile-friendly PDFs, expert content, affordable pricing & 24/7 WhatsApp support.', color: '#f59e0b' },
            { icon: '⭐', title: 'What Makes Us Better', desc: 'No outdated or copied content. Every note filtered for important questions. Real reviews, no hidden charges, direct founder support.', color: '#8b5cf6' }
          ].map((card, i) => (
            <div key={i} style={{
              background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: isDark ? '1.5px solid #334155' : '1.5px solid #e8ecf0',
              borderRadius: '18px',
              padding: isMobile ? '16px 14px' : '22px',
              boxShadow: isDark
                ? '0 2px 12px rgba(0,0,0,0.25)'
                : '0 2px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              position: 'relative', overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.boxShadow = `0 6px 20px ${card.color}${isDark ? '30' : '20'}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDark ? '#334155' : '#e8ecf0';
              e.currentTarget.style.boxShadow = isDark
                ? '0 2px 12px rgba(0,0,0,0.25)'
                : '0 2px 12px rgba(0,0,0,0.05)';
            }}>
              <div style={{
                position: 'absolute', top: '-30px', right: '-30px',
                width: '100px', height: '100px',
                background: `${card.color}${isDark ? '10' : '08'}`,
                borderRadius: '50%'
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{
                  width: isMobile ? '34px' : '38px',
                  height: isMobile ? '34px' : '38px',
                  background: `${card.color}${isDark ? '20' : '12'}`,
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isMobile ? '1.1rem' : '1.2rem'
                }}>
                  {card.icon}
                </div>
                <h3 style={{
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '800',
                  color: card.color
                }}>{card.title}</h3>
              </div>
              <p style={{
                fontSize: isMobile ? '0.78rem' : '0.82rem',
                color: isDark ? '#94a3b8' : '#64748b',
                lineHeight: 1.6,
                margin: 0
              }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOUNDER SECTION ===== */}
      <section style={{
        padding: isMobile ? '24px 16px 32px' : '40px 24px 60px',
        maxWidth: '700px', margin: '0 auto'
      }}>
        <div style={{
          background: isDark
            ? 'rgba(30,27,75,0.42)'
            : 'rgba(240,244,255,0.68)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isDark ? '1.5px solid #334155' : '1.5px solid #e0e4f0',
          borderRadius: '22px',
          padding: isMobile ? '20px 16px' : '32px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'flex-start',
          gap: isMobile ? '16px' : '24px',
          textAlign: isMobile ? 'center' : 'left',
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(99,102,241,0.08)'
        }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: isMobile ? '80px' : '110px',
              height: isMobile ? '80px' : '110px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid rgba(99,102,241,0.3)',
              boxShadow: '0 6px 20px rgba(99,102,241,0.2)',
              background: 'linear-gradient(135deg, #6366f120, #ec489920)'
            }}>
              <img
                src="https://i.ibb.co/WWW1ttkx/Whats-App-Image-2026-01-31-at-1-57-14-PM.jpg"
                alt="Faizan Tariq"
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.style.display = 'flex';
                  e.target.parentElement.style.alignItems = 'center';
                  e.target.parentElement.style.justifyContent = 'center';
                  e.target.parentElement.style.fontSize = '2.5rem';
                  e.target.parentElement.innerHTML = '👨‍💻';
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: isMobile ? '1.15rem' : '1.4rem',
              fontWeight: '800',
              color: isDark ? '#e2e8f0' : '#1e293b',
              marginBottom: '2px'
            }}>
              Faizan Tariq
            </h3>
            <div style={{
              fontSize: isMobile ? '0.78rem' : '0.82rem',
              color: '#6366f1',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              Software Engineering • ILS Srinagar
            </div>
            <p style={{
              fontSize: isMobile ? '0.78rem' : '0.82rem',
              color: isDark ? '#94a3b8' : '#64748b',
              lineHeight: 1.6,
              margin: '0 0 14px'
            }}>
              Providing quality study materials & filtered important questions to help students excel — because we are students too.
            </p>
            <a
              href="https://instagram.com/code_with_06"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                color: '#fff',
                padding: isMobile ? '7px 16px' : '8px 18px',
                borderRadius: '50px', textDecoration: 'none',
                fontWeight: '600', fontSize: isMobile ? '0.78rem' : '0.82rem',
                boxShadow: '0 4px 14px rgba(240,147,251,0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(240,147,251,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(240,147,251,0.3)';
              }}
            >
              <Instagram size={isMobile ? 14 : 16} /> Follow on Instagram
            </a>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 10px 35px rgba(99,102,241,0.45); transform: scale(1); }
          50%       { box-shadow: 0 14px 45px rgba(99,102,241,0.65); transform: scale(1.04); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(15px, 20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-12px, -15px); }
        }
        @keyframes liveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.2; transform: scale(1.7); }
        }
        @keyframes countPop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.22); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default HomePage;