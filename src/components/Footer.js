import React from 'react';
import { Instagram, Shield } from 'lucide-react';
import { useTheme } from '../App';

const Footer = ({ setCurrentPage }) => {
  const { isDark } = useTheme();
  const isMobile = window.innerWidth <= 768;

  return (
    <footer style={{
      background: isDark 
        ? 'linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.8) 100%)'
        : '#f8fafc',
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
        <div>
          <h3 style={{
            fontSize: isMobile ? '1.6rem' : '2rem',
            fontWeight: '900',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            FaizUpyZone
          </h3>
          <p style={{
            color: isDark ? '#94a3b8' : '#64748b',
            marginBottom: '1.5rem',
            lineHeight: 1.7,
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Empowering students with premium study materials for a brighter future.
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
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <Instagram size={isMobile ? 22 : 24} /> @code_with_06
          </a>
        </div>
        
        <div>
          <h4 style={{
            fontWeight: '800',
            marginBottom: '1.5rem',
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            color: isDark ? '#e2e8f0' : '#1e293b'
          }}>
            Quick Links
          </h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {['home', 'products'].map((page) => (
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
                  transition: 'color 0.3s ease',
                  padding: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'}
              >
                {page === 'products' ? 'Browse Notes' : 'Home'}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h4 style={{
            fontWeight: '800',
            marginBottom: '1.5rem',
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            color: isDark ? '#e2e8f0' : '#1e293b'
          }}>
            Support
          </h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <a 
              href="https://wa.me/918899843797" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                color: isDark ? '#94a3b8' : '#64748b',
                textDecoration: 'none',
                fontSize: isMobile ? '0.95rem' : '1rem',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
              onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'}
            >
              WhatsApp Support
            </a>
            <a 
              href="mailto:luckyfaizu3@gmail.com" 
              style={{
                color: isDark ? '#94a3b8' : '#64748b',
                textDecoration: 'none',
                fontSize: isMobile ? '0.95rem' : '1rem',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'}
            >
              Email Us
            </a>
          </div>
        </div>
        
        <div>
          <h4 style={{
            fontWeight: '800',
            marginBottom: '1.5rem',
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            color: isDark ? '#e2e8f0' : '#1e293b'
          }}>
            Secure Payment
          </h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#10b981',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '700',
            background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            padding: isMobile ? '0.85rem' : '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Shield size={isMobile ? 18 : 20} />
            Razorpay Protected
          </div>
        </div>
      </div>
      
      <div style={{
        borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        marginTop: isMobile ? '3rem' : '4rem',
        paddingTop: isMobile ? '2rem' : '2.5rem',
        textAlign: 'center',
        color: isDark ? '#94a3b8' : '#64748b',
        fontSize: isMobile ? '0.85rem' : '1rem'
      }}>
        <p>&copy; 2026 FaizUpyZone. All rights reserved. Made with 💜 by @code_with_06</p>
      </div>
    </footer>
  );
};

export default Footer;