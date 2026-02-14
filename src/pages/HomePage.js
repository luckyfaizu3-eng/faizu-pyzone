import React, { useState, useEffect, useRef } from 'react';
import { Download, Shield, Zap, Instagram, BookOpen } from 'lucide-react';
import { useTheme, useAuth } from '../App';

function HomePage({ setCurrentPage }) {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { isDark } = useTheme();
  const { user, logout } = useAuth();

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
        {/* Decorative blobs */}
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
                if (card.action) {
                  card.action();
                } else {
                  setCurrentPage(card.page);
                }
              }}
              style={{
                background: isDark ? '#1e293b' : '#ffffff',
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

      {/* ===== 🔥 MOCK TEST ADVERTISEMENT ===== */}
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
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #2d1b69 70%, #0f172a 100%)',
            border: '1.5px solid rgba(139,92,246,0.4)',
            boxShadow: '0 20px 60px rgba(99,102,241,0.25), 0 0 0 1px rgba(139,92,246,0.1)',
            transition: 'all 0.35s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 30px 80px rgba(99,102,241,0.4), 0 0 0 1px rgba(139,92,246,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(99,102,241,0.25), 0 0 0 1px rgba(139,92,246,0.1)';
          }}
        >
          {/* Animated glow orbs */}
          <div style={{
            position: 'absolute', top: '-40px', left: '-40px',
            width: isMobile ? '160px' : '220px', height: isMobile ? '160px' : '220px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
            animation: 'float1 4s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute', bottom: '-30px', right: '-30px',
            width: isMobile ? '140px' : '200px', height: isMobile ? '140px' : '200px',
            background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
            animation: 'float2 5s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '200px' : '300px', height: isMobile ? '200px' : '300px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none'
          }} />

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 2,
            padding: isMobile ? '24px 20px' : '40px 48px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: isMobile ? '20px' : '40px'
          }}>
            {/* Left: Icon + badge */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              {/* Pulsing icon */}
              <div style={{
                width: isMobile ? '70px' : '90px',
                height: isMobile ? '70px' : '90px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: isMobile ? '20px' : '26px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? '2rem' : '2.8rem',
                margin: '0 auto',
                boxShadow: '0 12px 40px rgba(99,102,241,0.5)',
                animation: 'pulse 2.5s ease-in-out infinite',
                border: '2px solid rgba(139,92,246,0.5)'
              }}>
                🐍
              </div>
              {/* Price badge */}
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
                boxShadow: '0 4px 12px rgba(16,185,129,0.5)',
              }}>
                सिर्फ ₹12
              </div>
            </div>

            {/* Right: Text content */}
            <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
              {/* Eyebrow label */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(139,92,246,0.2)',
                border: '1px solid rgba(139,92,246,0.4)',
                borderRadius: '50px',
                padding: '4px 12px',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#a78bfa',
                  animation: 'ping 1.5s ease-in-out infinite'
                }} />
                <span style={{ color: '#c4b5fd', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em' }}>
                  MOCK TESTS — LIVE NOW
                </span>
              </div>

              <h2 style={{
                fontSize: isMobile ? '1.35rem' : '2rem',
                fontWeight: '900',
                color: '#fff',
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
                color: 'rgba(203,213,225,0.85)',
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
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '50px',
                    padding: '5px 12px',
                    fontSize: isMobile ? '0.72rem' : '0.78rem',
                    fontWeight: '700',
                    color: 'rgba(226,232,240,0.9)'
                  }}>
                    <span>{pill.icon}</span>
                    <span>{pill.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
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
                  boxShadow: '0 8px 25px rgba(99,102,241,0.5)',
                  letterSpacing: '0.02em',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(99,102,241,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.5)';
                }}
              >
                Start Test @ ₹12 Only →
              </button>
            </div>
          </div>

          {/* Bottom strip */}
          <div style={{
            position: 'relative', zIndex: 2,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.25)',
            padding: isMobile ? '10px 20px' : '12px 48px',
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
                <span style={{ color: '#a78bfa', fontWeight: '900', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
                  {stat.val}
                </span>
                <span style={{ color: 'rgba(148,163,184,0.8)', fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: '600' }}>
                  {stat.label}
                </span>
                {i < 3 && !isMobile && (
                  <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: '6px' }}>•</span>
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
              background: isDark ? '#1e293b' : '#fff',
              border: isDark ? '1.5px solid #334155' : '1.5px solid #e8ecf0',
              borderRadius: '18px',
              padding: isMobile ? '16px 14px' : '24px',
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              boxShadow: isDark 
                ? '0 2px 12px rgba(0,0,0,0.3)' 
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
                ? '0 2px 12px rgba(0,0,0,0.3)' 
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
            { icon: '💳', title: 'Secure Payment', desc: 'Transactions via Razorpay — India\'s most trusted gateway. UPI, Cards, Net Banking & Wallets. Fully encrypted & secure.', color: '#10b981' },
            { icon: '🎯', title: 'Why Choose Us', desc: 'Instant access, lifetime downloads, mobile-friendly PDFs, expert content, affordable pricing & 24/7 WhatsApp support.', color: '#f59e0b' },
            { icon: '⭐', title: 'What Makes Us Better', desc: 'No outdated or copied content. Every note filtered for important questions. Real reviews, no hidden charges, direct founder support.', color: '#8b5cf6' }
          ].map((card, i) => (
            <div key={i} style={{
              background: isDark ? '#1e293b' : '#fff',
              border: isDark ? '1.5px solid #334155' : '1.5px solid #e8ecf0',
              borderRadius: '18px',
              padding: isMobile ? '16px 14px' : '22px',
              boxShadow: isDark 
                ? '0 2px 12px rgba(0,0,0,0.3)' 
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
                ? '0 2px 12px rgba(0,0,0,0.3)' 
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
            ? 'linear-gradient(135deg, rgba(30,27,75,0.5), rgba(88,28,135,0.3))'
            : 'linear-gradient(135deg, #f0f4ff, #fdf2f8)',
          border: isDark ? '1.5px solid #334155' : '1.5px solid #e0e4f0',
          borderRadius: '22px',
          padding: isMobile ? '20px 16px' : '32px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'flex-start',
          gap: isMobile ? '16px' : '24px',
          textAlign: isMobile ? 'center' : 'left',
          boxShadow: isDark 
            ? '0 4px 20px rgba(0,0,0,0.4)' 
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
        @keyframes blink2 {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 12px 40px rgba(99,102,241,0.5); transform: scale(1); }
          50% { box-shadow: 0 16px 50px rgba(99,102,241,0.7); transform: scale(1.04); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, 20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-12px, -15px); }
        }
        @keyframes ping {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

export default HomePage