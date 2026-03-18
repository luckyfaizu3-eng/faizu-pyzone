import React from 'react';
import { Instagram, Shield } from 'lucide-react';
import { useTheme } from '../App';

const Footer = ({ setCurrentPage }) => {
  const { isDark } = useTheme();
  const isMobile = window.innerWidth <= 768;

  return (
    <footer style={{
      background: isDark 
        ? 'linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.95) 100%)'
        : 'linear-gradient(180deg, transparent 0%, #f0f4ff 100%)',
      borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      padding: isMobile ? '3rem 1.5rem 1.5rem' : '4rem 2rem 2rem',
      position: 'relative',
      zIndex: 1,
      marginTop: '5rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: isMobile ? '2rem' : '3rem'
      }}>

        {/* Brand Section */}
        <div>
          {/* PySkill Logo */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '38px', height: '38px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>🎓</div>
            <h3 style={{
              fontSize: isMobile ? '1.6rem' : '2rem',
              fontWeight: '900',
              margin: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              PySkill
            </h3>
          </div>

          <div style={{
            fontSize: '0.72rem',
            color: isDark ? '#475569' : '#94a3b8',
            fontWeight: '600',
            marginBottom: '1rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Premium Study Platform
          </div>

          <p style={{
            color: isDark ? '#94a3b8' : '#64748b',
            marginBottom: '1.5rem',
            lineHeight: 1.7,
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Empowering students with premium study materials, mock tests & verified certificates for a brighter future.
          </p>

          <a 
            href="https://instagram.com/code_with_06" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#6366f1',
              fontWeight: '600',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)',
              padding: '0.5rem 1rem',
              borderRadius: '50px',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(5px)';
              e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.background = isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)';
            }}
          >
            <Instagram size={isMobile ? 18 : 20} /> @code_with_06
          </a>
        </div>
        
        {/* Quick Links */}
        <div>
          <h4 style={{
            fontWeight: '800',
            marginBottom: '1.5rem',
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            color: isDark ? '#e2e8f0' : '#1e293b'
          }}>
            Quick Links
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { page: 'home',           label: '🏠 Home' },
              { page: 'products',       label: '📚 Browse Notes' },
              { page: 'mocktests',      label: '🐍 Mock Tests' },
              { page: 'leaderboard',    label: '🏆 Leaderboard' },
              { page: 'blog-mock-test', label: '📝 Python Mock Test Blog' },
            ].map(({ page, label }) => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#94a3b8' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  transition: 'all 0.3s ease',
                  padding: '0.25rem 0',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#6366f1';
                  e.currentTarget.style.paddingLeft = '8px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b';
                  e.currentTarget.style.paddingLeft = '0';
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Support */}
        <div>
          <h4 style={{
            fontWeight: '800',
            marginBottom: '1.5rem',
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            color: isDark ? '#e2e8f0' : '#1e293b'
          }}>
            Support
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a 
              href="https://t.me/FAIZU_PYZONE" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                color: isDark ? '#94a3b8' : '#64748b',
                textDecoration: 'none',
                fontSize: isMobile ? '0.95rem' : '1rem',
                transition: 'color 0.3s ease',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0088cc'}
              onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'}
            >
              💬 Telegram Support
            </a>
            <a 
              href="mailto:luckyfaizu3@gmail.com" 
              style={{
                color: isDark ? '#94a3b8' : '#64748b',
                textDecoration: 'none',
                fontSize: isMobile ? '0.95rem' : '1rem',
                transition: 'color 0.3s ease',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'}
            >
              📧 Email Us
            </a>
            <a
              href="https://faizupyzone.shop"
              style={{
                color: isDark ? '#94a3b8' : '#64748b',
                textDecoration: 'none',
                fontSize: isMobile ? '0.95rem' : '1rem',
                transition: 'color 0.3s ease',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'}
            >
              🌐 faizupyzone.shop
            </a>
          </div>
        </div>
        
        {/* Secure Payment */}
        <div>
          <h4 style={{
            fontWeight: '800',
            marginBottom: '1.5rem',
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            color: isDark ? '#e2e8f0' : '#1e293b'
          }}>
            Trust & Security
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#10b981',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '700',
              background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              border: '1px solid rgba(16,185,129,0.25)'
            }}>
              <Shield size={isMobile ? 18 : 20} />
              Razorpay Protected
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#6366f1',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '700',
              background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              border: '1px solid rgba(99,102,241,0.2)'
            }}>
              🔒 Anti-Cheat System
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#f59e0b',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '700',
              background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              border: '1px solid rgba(245,158,11,0.2)'
            }}>
              🏆 Verified Certificates
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom bar */}
      <div style={{
        borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        marginTop: isMobile ? '3rem' : '4rem',
        paddingTop: isMobile ? '1.5rem' : '2rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        color: isDark ? '#94a3b8' : '#64748b',
        fontSize: isMobile ? '0.82rem' : '0.9rem'
      }}>
        <p style={{ margin: 0 }}>
          &copy; 2026 <span style={{ color: '#6366f1', fontWeight: '700' }}>PySkill</span> — faizupyzone.shop. All rights reserved.
        </p>
        <p style={{ margin: 0 }}>
          Made with 💜 by <span style={{ color: '#6366f1', fontWeight: '700' }}>@code_with_06</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;