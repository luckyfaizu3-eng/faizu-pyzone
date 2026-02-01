import React, { useState, useEffect, useRef } from 'react';
import { Download, Shield, Zap, Instagram, BookOpen } from 'lucide-react';

function HomePage({ setCurrentPage }) {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
    <div style={{ paddingTop: '70px', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ===== HERO SECTION ===== */}
      <section style={{
        padding: isMobile ? '32px 18px 28px' : '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        background: 'linear-gradient(180deg, #f0f4ff 0%, #ffffff 70%)',
        borderRadius: '0 0 32px 32px'
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '-20px', left: '-40px',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '10px', right: '-30px',
          width: '180px', height: '180px',
          background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        {/* Logo badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
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
          fontSize: isMobile ? '2.2rem' : '3.8rem',
          fontWeight: '900',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #1e40af, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
          minHeight: isMobile ? '58px' : '96px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {currentText}
          <span style={{
            borderRight: '3px solid #6366f1',
            animation: 'blink 0.7s infinite',
            marginLeft: '6px',
            height: isMobile ? '34px' : '56px',
            display: 'inline-block'
          }} />
        </h1>

        <p style={{
          fontSize: isMobile ? '0.95rem' : '1.15rem',
          color: '#64748b',
          maxWidth: '560px',
          margin: '0 auto 20px',
          lineHeight: 1.6,
          fontWeight: '500'
        }}>
          Quality study materials for JKBOSE, Python & Job Prep — delivered instantly after payment.
        </p>

        {/* Trust badges */}
        <div style={{
          display: 'flex', gap: '10px', justifyContent: 'center',
          flexWrap: 'wrap', marginBottom: '24px'
        }}>
          {[
            { icon: Shield, color: '#10b981', text: 'Secure Payment' },
            { icon: Zap, color: '#6366f1', text: 'Instant Access' },
            { icon: BookOpen, color: '#ec4899', text: '100% Original' }
          ].map((badge, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: `${badge.color}10`,
              padding: '7px 14px',
              borderRadius: '50px',
              border: `1px solid ${badge.color}30`
            }}>
              <badge.icon size={15} color={badge.color} />
              <span style={{ fontSize: '0.82rem', fontWeight: '600', color: badge.color }}>
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
            padding: isMobile ? '14px 32px' : '16px 40px',
            fontSize: isMobile ? '1rem' : '1.15rem',
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
          <Download size={20} />
          Browse Notes Now
        </button>
      </section>

      {/* ===== QUICK ACTION CARDS (Mobile highlight) ===== */}
      <section style={{
        padding: isMobile ? '20px 18px' : '40px 24px',
        maxWidth: '1000px', margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? '10px' : '14px'
        }}>
          {[
            { icon: '📚', label: 'Browse Notes', page: 'products', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
            { icon: '🛒', label: 'My Cart', page: 'cart', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
            { icon: '📦', label: 'My Orders', page: 'orders', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
            { icon: '🔐', label: 'Login', page: 'login', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }
          ].map((card, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(card.page)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e8ecf0',
                borderRadius: '16px',
                padding: isMobile ? '16px 10px' : '20px 14px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '10px',
                transition: 'all 0.25s ease',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                e.currentTarget.style.borderColor = '#6366f1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = '#e8ecf0';
              }}
            >
              <div style={{
                width: '44px', height: '44px',
                background: card.gradient,
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {card.icon}
              </div>
              <span style={{
                fontSize: isMobile ? '0.78rem' : '0.85rem',
                fontWeight: '700', color: '#1e293b'
              }}>
                {card.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section style={{
        padding: isMobile ? '24px 18px' : '40px 24px',
        maxWidth: '1000px', margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900', textAlign: 'center',
          marginBottom: isMobile ? '16px' : '28px',
          color: '#1e293b'
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
              background: '#fff',
              border: '1.5px solid #e8ecf0',
              borderRadius: '18px',
              padding: isMobile ? '18px 16px' : '24px',
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = f.color;
              e.currentTarget.style.boxShadow = `0 6px 20px ${f.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e8ecf0';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
            }}>
              <div style={{
                width: '42px', height: '42px', flexShrink: 0,
                background: `${f.color}12`,
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem'
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', marginBottom: '3px' }}>{f.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== INFO CARDS SECTION ===== */}
      <section style={{
        padding: isMobile ? '24px 18px' : '40px 24px',
        maxWidth: '1000px', margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
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
              background: '#fff',
              border: '1.5px solid #e8ecf0',
              borderRadius: '18px',
              padding: isMobile ? '18px 16px' : '22px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              position: 'relative', overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.boxShadow = `0 6px 20px ${card.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e8ecf0';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
            }}>
              <div style={{
                position: 'absolute', top: '-30px', right: '-30px',
                width: '100px', height: '100px',
                background: `${card.color}08`, borderRadius: '50%'
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{
                  width: '38px', height: '38px',
                  background: `${card.color}12`,
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  {card.icon}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: card.color }}>{card.title}</h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOUNDER SECTION ===== */}
      <section style={{
        padding: isMobile ? '24px 18px 32px' : '40px 24px 60px',
        maxWidth: '700px', margin: '0 auto'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f0f4ff, #fdf2f8)',
          border: '1.5px solid #e0e4f0',
          borderRadius: '22px',
          padding: isMobile ? '22px 18px' : '32px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'flex-start',
          gap: isMobile ? '16px' : '24px',
          textAlign: isMobile ? 'center' : 'left',
          boxShadow: '0 4px 20px rgba(99,102,241,0.08)'
        }}>
          {/* Photo */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: isMobile ? '90px' : '110px',
              height: isMobile ? '90px' : '110px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid rgba(99,102,241,0.3)',
              boxShadow: '0 6px 20px rgba(99,102,241,0.2)',
              background: 'linear-gradient(135deg, #6366f120, #ec4899 20%)'
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

          {/* Content */}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: '800', color: '#1e293b', marginBottom: '2px' }}>
              Faizan Tariq
            </h3>
            <div style={{ fontSize: '0.82rem', color: '#6366f1', fontWeight: '600', marginBottom: '10px' }}>
              Software Engineering • ILS Srinagar
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 14px' }}>
              Providing quality study materials & filtered important questions to help students excel — because we are students too.
            </p>
            <a
              href="https://instagram.com/code_with_06"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                color: '#fff', padding: '8px 18px',
                borderRadius: '50px', textDecoration: 'none',
                fontWeight: '600', fontSize: '0.82rem',
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
              <Instagram size={16} /> Follow on Instagram
            </a>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default HomePage;