import React, { useState, useEffect, useRef } from 'react';
import { Download, Shield, Zap, Instagram } from 'lucide-react';

function HomePage({ setCurrentPage }) {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  
  const phrases = useRef([
    "Premium Study Notes for Success",
    "Master Python • Excel in Exams",
    "Land Your Dream Job Today",
    "Quality Content • Instant Access"
  ]).current;

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const typingSpeed = isDeleting ? 30 : 80;
    const pauseTime = 2000;

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
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        padding: 'clamp(60px, 12vw, 120px) 1.5rem',
        textAlign: 'center',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 7vw, 5rem)',
          fontWeight: '900',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #1e40af, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
          minHeight: 'clamp(100px, 20vw, 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeInUp 0.8s ease'
        }}>
          {currentText}
          <span style={{
            borderRight: '4px solid #6366f1',
            animation: 'blink 0.7s infinite',
            marginLeft: '8px'
          }}>‎</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
          color: '#64748b',
          maxWidth: '800px',
          margin: '0 auto 3rem',
          lineHeight: 1.7,
          padding: '0 1rem',
          animation: 'fadeInUp 0.8s ease 0.2s backwards'
        }}>
          Master JKBOSE • Excel Python • Land Your Dream Job
        </p>

        {/* Trust Badges - REAL ONLY */}
        <div style={{
          display: 'flex',
          gap: 'clamp(1rem, 3vw, 2rem)',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '3rem',
          padding: '0 1rem',
          animation: 'fadeInUp 0.8s ease 0.4s backwards'
        }}>
          {[
            { icon: Shield, color: '#10b981', text: 'Secure Payment' },
            { icon: Zap, color: '#6366f1', text: 'Instant Access' }
          ].map((badge, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: `${badge.color}15`,
              padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.25rem, 3vw, 1.75rem)',
              borderRadius: '50px',
              border: `1.5px solid ${badge.color}40`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 8px 25px ${badge.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <badge.icon size={20} color={badge.color} />
              <span style={{
                fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
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
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            border: 'none',
            color: 'white',
            padding: 'clamp(1rem, 3vw, 1.35rem) clamp(2.5rem, 6vw, 3.5rem)',
            fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)',
            borderRadius: '50px',
            cursor: 'pointer',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 20px 60px rgba(30, 64, 175, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'fadeInUp 0.8s ease 0.6s backwards',
            minHeight: '56px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 70px rgba(30, 64, 175, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(30, 64, 175, 0.4)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        >
          <Download size={24} />
          Browse Notes Now
        </button>
      </section>

      {/* Features Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '6rem auto',
        padding: '0 1.5rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(2rem, 4vw, 3rem)'
        }}>
          {[
            {
              icon: '📚',
              title: 'Quality Content',
              desc: 'Handpicked study materials curated by experts',
              gradient: 'linear-gradient(135deg, #1e40af, #3b82f6)'
            },
            {
              icon: '🔒',
              title: 'Secure & Safe',
              desc: 'Protected payments via Razorpay gateway',
              gradient: 'linear-gradient(135deg, #10b981, #059669)'
            },
            {
              icon: '⚡',
              title: 'Instant Download',
              desc: 'Get your PDFs immediately after payment',
              gradient: 'linear-gradient(135deg, #6366f1, #ec4899)'
            }
          ].map((feature, i) => (
            <div key={i} style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: 'clamp(2.5rem, 5vw, 3rem)',
              textAlign: 'center',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-12px)';
              e.currentTarget.style.boxShadow = '0 20px 50px rgba(99,102,241,0.15)';
              e.currentTarget.style.borderColor = '#6366f1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}>
              <div style={{
                width: 'clamp(75px, 18vw, 90px)',
                height: 'clamp(75px, 18vw, 90px)',
                margin: '0 auto 1.75rem',
                background: 'rgba(99,102,241,0.1)',
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(2.5rem, 6vw, 3rem)',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(360deg) scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0) scale(1)'}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: '900',
                background: feature.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.75rem'
              }}>
                {feature.title}
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
                lineHeight: 1.6
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Info Cards Section - Policy, Payment, About, Why Choose, Better */}
      <section style={{
        maxWidth: '1400px',
        margin: '8rem auto',
        padding: '0 1.5rem'
      }}>
        <h2 style={{
          fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
          fontWeight: '900',
          textAlign: 'center',
          marginBottom: '4rem',
          background: 'linear-gradient(135deg, #1e40af, #6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Why FaizUpyZone?
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem'
        }}>
          {[
            {
              icon: '📜',
              title: 'Our Policy',
              desc: 'We provide genuine, quality-checked study materials. All notes are carefully reviewed before upload. No refund for digital products once downloaded, but we ensure 100% satisfaction with preview options.',
              color: '#6366f1'
            },
            {
              icon: '💳',
              title: 'Secure Payment',
              desc: 'All transactions are processed through Razorpay, India\'s most trusted payment gateway. We accept UPI, Cards, Net Banking, and Wallets. Your payment information is encrypted and secure.',
              color: '#10b981'
            },
            {
              icon: '👨‍💻',
              title: 'About Us',
              desc: 'Started by Faizan Tariq, a Software Engineering student at ILS Srinagar. Our mission is to provide quality study materials to students at affordable prices. We understand student needs because we are students.',
              color: '#ec4899'
            },
            {
              icon: '🎯',
              title: 'Why Choose Us',
              desc: 'Instant access after payment, lifetime downloads, mobile-friendly PDFs, expert-curated content, affordable pricing, and 24/7 WhatsApp support. We focus on what students actually need.',
              color: '#f59e0b'
            },
            {
              icon: '⭐',
              title: 'What Makes Us Better',
              desc: 'Unlike others, we don\'t sell outdated or copied content. Every note is filtered for important questions. Real reviews from real students. No hidden charges. Direct support from founders.',
              color: '#8b5cf6'
            }
          ].map((card, i) => (
            <div key={i} style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '2.5rem',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = `0 20px 50px ${card.color}30`;
              e.currentTarget.style.borderColor = card.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}>
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                background: `${card.color}10`,
                borderRadius: '50%',
                opacity: 0.5
              }} />
              
              <div style={{
                width: '70px',
                height: '70px',
                background: `${card.color}15`,
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                fontSize: '2.5rem',
                border: `2px solid ${card.color}30`,
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0)'}
              >
                {card.icon}
              </div>
              
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: '900',
                color: card.color,
                marginBottom: '1rem'
              }}>
                {card.title}
              </h3>
              
              <p style={{
                color: '#64748b',
                fontSize: '1.05rem',
                lineHeight: 1.8
              }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder Section */}
      <section style={{
        maxWidth: '1000px',
        margin: '8rem auto',
        padding: '0 1.5rem'
      }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 5vw, 2.5rem)',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '3rem',
          color: '#1e293b'
        }}>
          Meet the Founder
        </h2>
        
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: 'clamp(2.5rem, 5vw, 3.5rem)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
          transition: 'transform 0.3s ease',
          animation: 'fadeInUp 0.8s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth > 768 ? 'auto 1fr' : '1fr',
            gap: 'clamp(2rem, 4vw, 3rem)',
            alignItems: 'center'
          }}>
            {/* Professional Photo */}
            <div style={{
              margin: window.innerWidth > 768 ? '0' : '0 auto',
              position: 'relative'
            }}>
              <div style={{
                width: 'clamp(140px, 22vw, 180px)',
                height: 'clamp(140px, 22vw, 180px)',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 12px 40px rgba(99, 102, 241, 0.2)',
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))'
              }}>
                <img 
                  src="https://i.ibb.co/WWW1ttkx/Whats-App-Image-2026-01-31-at-1-57-14-PM.jpg"
                  alt="Faizan Tariq - Founder" 
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    parent.style.display = 'flex';
                    parent.style.alignItems = 'center';
                    parent.style.justifyContent = 'center';
                    parent.style.fontSize = 'clamp(3rem, 8vw, 4rem)';
                    parent.innerHTML = '👨‍💻';
                  }}
                />
              </div>
            </div>
            
            {/* Professional Content */}
            <div style={{
              textAlign: window.innerWidth > 768 ? 'left' : 'center'
            }}>
              <h3 style={{
                fontSize: 'clamp(1.6rem, 3.5vw, 2rem)',
                fontWeight: '700',
                marginBottom: '0.75rem',
                color: '#1e293b',
                letterSpacing: '-0.02em'
              }}>
                Faizan Tariq
              </h3>
              
              <div style={{
                fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                color: '#6366f1',
                fontWeight: '600',
                marginBottom: '1.75rem',
                lineHeight: 1.4
              }}>
                Software Engineering Student<br/>
                ILS Srinagar Institute
              </div>
              
              <p style={{
                color: '#64748b',
                fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                lineHeight: 1.8,
                marginBottom: '2rem',
                maxWidth: '550px',
                margin: window.innerWidth > 768 ? '0 0 2rem 0' : '0 auto 2rem'
              }}>
                Currently pursuing Software Engineering at ILS Srinagar Institute. My goal is to provide quality study materials and important filtered questions to help students excel in their academic journey.
              </p>
              
              {/* Instagram Link */}
              <a
                href="https://instagram.com/code_with_06"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                  color: '#fff',
                  padding: '0.9rem 2rem',
                  borderRadius: '50px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 6px 20px rgba(240, 147, 251, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(240, 147, 251, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 147, 251, 0.3)';
                }}
              >
                <Instagram size={22} />
                Follow on Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default HomePage;