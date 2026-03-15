import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, User, LogOut, Moon, Sun, Palette, Send } from 'lucide-react';
import { useTheme } from '../App';

const Navbar = ({ 
  currentPage, 
  setCurrentPage, 
  mobileMenuOpen, 
  setMobileMenuOpen,
  user,
  logout,
  cartCount 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { isDark, toggleTheme, toggleBackground, backgroundTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (currentPage === 'compiler' || currentPage === 'aichat') return null;

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const themeNames = [
    'Purple', 'Blue', 'Green', 'Orange', 'Red', 'Violet',
    'Teal', 'Indigo', 'Lime', 'Fuchsia', 'Sky', 'Yellow'
  ];

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        background: isDark
          ? scrolled ? 'rgba(10, 15, 30, 0.97)' : 'rgba(15, 23, 42, 0.95)'
          : scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: isDark
          ? '1px solid rgba(99, 102, 241, 0.15)'
          : '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: scrolled
          ? isDark ? '0 4px 24px rgba(0,0,0,0.6)' : '0 4px 24px rgba(99,102,241,0.1)'
          : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>

        {/* Gradient top accent line */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #6366f1)',
          backgroundSize: '200% 100%',
          animation: 'gradientShift 4s linear infinite'
        }} />

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '0.55rem 0.875rem' : '0.7rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>

          {/* ── LOGO ── */}
          <div
            onClick={() => handleNavClick('home')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              cursor: 'pointer', flexShrink: 0,
              transition: 'transform 0.25s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: isMobile ? '34px' : '40px',
              height: isMobile ? '34px' : '40px',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? '17px' : '20px',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              flexShrink: 0
            }}>🎓</div>

            <div>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.3px',
                lineHeight: 1.1
              }}>PySkill</div>
              {isMobile && (
                <div style={{
                  fontSize: '0.55rem', fontWeight: '700',
                  color: isDark ? '#64748b' : '#94a3b8',
                  letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>Study Hub</div>
              )}
            </div>
          </div>

          {/* ── MARQUEE (Desktop only) ── */}
          {!isMobile && (
            <div style={{
              flex: 1, maxWidth: '480px', overflow: 'hidden',
              background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(248,250,252,0.9)',
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
              borderRadius: '30px', padding: '0.55rem 1rem',
              height: '36px', display: 'flex', alignItems: 'center'
            }}>
              <div style={{
                display: 'inline-block', whiteSpace: 'nowrap',
                animation: 'marquee 22s linear infinite',
                fontSize: '0.85rem', fontWeight: '600',
                color: isDark ? '#94a3b8' : '#64748b'
              }}>
                ✨ Welcome to PySkill &nbsp;•&nbsp; 🐍 Best Python Notes &nbsp;•&nbsp; ✅ 100% Original &nbsp;•&nbsp; ⚡ Instant Download &nbsp;•&nbsp; 💼 Job Prep &nbsp;•&nbsp; 🔒 Secure Payment &nbsp;&nbsp;&nbsp;
              </div>
            </div>
          )}

          {/* ── DESKTOP MENU ── */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconBtn onClick={toggleBackground} title={`Theme: ${themeNames[backgroundTheme]}`} isDark={isDark}>
                <Palette size={17} color="#8b5cf6" />
              </IconBtn>
              <IconBtn onClick={toggleTheme} isDark={isDark}>
                {isDark ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#6366f1" />}
              </IconBtn>

              {['products', 'mocktests'].map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} style={{
                  background: currentPage === page ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  border: 'none',
                  color: currentPage === page ? '#fff' : isDark ? '#cbd5e1' : '#64748b',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700',
                  padding: '0.5rem 1rem', borderRadius: '20px',
                  transition: 'all 0.25s ease',
                  boxShadow: currentPage === page ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
                }}>
                  {page === 'products' ? '📚 Notes' : '🐍 Tests'}
                </button>
              ))}

              {user?.isAdmin && (
                <button onClick={() => setCurrentPage('admin')} style={{
                  background: currentPage === 'admin' ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: 'none', color: '#6366f1', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '700',
                  padding: '0.5rem 1rem', borderRadius: '20px', transition: 'all 0.25s'
                }}>⚙️ Admin</button>
              )}

              {user ? (
                <>
                  <button onClick={() => setCurrentPage('orders')} style={{
                    background: currentPage === 'orders' ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: 'none', color: isDark ? '#cbd5e1' : '#64748b',
                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700',
                    padding: '0.5rem 1rem', borderRadius: '20px', transition: 'all 0.25s'
                  }}>📦 Orders</button>

                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowUserMenu(!showUserMenu)} style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                      border: '1.5px solid rgba(99,102,241,0.4)',
                      borderRadius: '50%', width: '36px', height: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.25s'
                    }}>
                      <User size={17} color="#6366f1" />
                    </button>

                    {showUserMenu && (
                      <div style={{
                        position: 'absolute', top: '46px', right: 0,
                        background: isDark ? '#1e293b' : '#fff',
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        borderRadius: '16px',
                        boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.6)' : '0 12px 48px rgba(0,0,0,0.12)',
                        padding: '0.5rem', minWidth: '210px', zIndex: 1001,
                        animation: 'dropIn 0.2s ease'
                      }}>
                        <div style={{
                          padding: '0.75rem 1rem',
                          borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
                          marginBottom: '0.4rem'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signed in as</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                        </div>
                        <MenuBtn onClick={() => window.open('https://t.me/FaizUpyZone', '_blank')} color="#0088cc" hoverBg={isDark ? '#0c2233' : '#e8f4fd'}>
                          <Send size={15} /> Telegram Support
                        </MenuBtn>
                        <MenuBtn onClick={() => { logout(); setShowUserMenu(false); }} color="#ef4444" hoverBg={isDark ? '#3b0a0a' : '#fef2f2'}>
                          <LogOut size={15} /> Logout
                        </MenuBtn>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button onClick={() => setCurrentPage('login')} style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', color: 'white',
                  padding: '0.55rem 1.25rem', borderRadius: '20px',
                  cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  transition: 'all 0.25s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; }}
                >Login</button>
              )}

              <button onClick={() => setCurrentPage('cart')} style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                border: 'none', color: 'white',
                padding: '0.55rem 1.1rem', borderRadius: '20px',
                cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                transition: 'all 0.25s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; }}
              >
                <ShoppingCart size={17} /> Cart
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: '#ef4444', borderRadius: '50%',
                    width: '19px', height: '19px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: '800',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.5)'
                  }}>{cartCount}</span>
                )}
              </button>
            </div>
          )}

          {/* ── MOBILE RIGHT ICONS ── */}
          {isMobile && (
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <MobileIconBtn onClick={toggleBackground} isDark={isDark}>
                <Palette size={16} color="#8b5cf6" />
              </MobileIconBtn>
              <MobileIconBtn onClick={toggleTheme} isDark={isDark}>
                {isDark ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
              </MobileIconBtn>
              <div style={{ position: 'relative' }}>
                <MobileIconBtn onClick={() => setCurrentPage('cart')} isDark={isDark}>
                  <ShoppingCart size={16} color="#6366f1" />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-5px', right: '-5px',
                      background: '#ef4444', borderRadius: '50%',
                      width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: '800', color: 'white',
                      boxShadow: '0 2px 6px rgba(239,68,68,0.5)'
                    }}>{cartCount}</span>
                  )}
                </MobileIconBtn>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: mobileMenuOpen
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                  border: '1.5px solid rgba(99,102,241,0.3)',
                  borderRadius: '10px', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.25s ease'
                }}
              >
                {mobileMenuOpen ? <X size={20} color="#fff" /> : <Menu size={20} color="#6366f1" />}
              </button>
            </div>
          )}
        </div>

        {/* ── MOBILE MARQUEE ── */}
        {isMobile && (
          <div style={{
            overflow: 'hidden',
            background: isDark
              ? 'linear-gradient(90deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))'
              : 'linear-gradient(90deg, rgba(99,102,241,0.05), rgba(236,72,153,0.05))',
            borderTop: isDark ? '1px solid rgba(99,102,241,0.12)' : '1px solid rgba(99,102,241,0.08)',
            padding: '0.3rem 0', height: '26px',
            display: 'flex', alignItems: 'center'
          }}>
            <div style={{
              display: 'inline-block', whiteSpace: 'nowrap',
              animation: 'marquee 18s linear infinite',
              fontSize: '0.7rem', fontWeight: '700',
              color: isDark ? '#818cf8' : '#6366f1',
              letterSpacing: '0.02em'
            }}>
              ✨ PySkill &nbsp;•&nbsp; 🐍 Python Notes &nbsp;•&nbsp; ✅ 100% Original &nbsp;•&nbsp; ⚡ Instant Download &nbsp;•&nbsp; 🔒 Secure Payment &nbsp;&nbsp;&nbsp;
            </div>
          </div>
        )}
      </nav>

      {/* ── MOBILE MENU DROPDOWN ── */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '88px', left: 0, right: 0,
          background: isDark ? 'rgba(10,15,30,0.98)' : 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(24px)',
          borderBottom: isDark ? '1px solid rgba(99,102,241,0.2)' : '1px solid #e2e8f0',
          boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.6)' : '0 16px 48px rgba(99,102,241,0.12)',
          zIndex: 999, padding: '1rem',
          animation: 'slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          maxHeight: '85vh', overflowY: 'auto'
        }}>

          {/* User info pill */}
          {user && (
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))'
                : 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.06))',
              border: isDark ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(99,102,241,0.15)',
              borderRadius: '14px', padding: '0.75rem 1rem',
              marginBottom: '0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', flexShrink: 0
              }}>👤</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.7rem', color: isDark ? '#64748b' : '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signed in as</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
            </div>
          )}

          {/* Nav Items Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '0.6rem', marginBottom: '0.75rem'
          }}>
            {[
              { page: 'products', icon: '📚', label: 'Browse Notes' },
              { page: 'mocktests', icon: '🐍', label: 'Mock Tests' },
              ...(user ? [{ page: 'orders', icon: '📦', label: 'My Orders' }] : []),
              ...(user?.isAdmin ? [{ page: 'admin', icon: '⚙️', label: 'Admin Panel' }] : []),
            ].map(({ page, icon, label }) => (
              <button key={page}
                onClick={() => handleNavClick(page)}
                style={{
                  background: currentPage === page
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.05)',
                  border: currentPage === page ? 'none' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.1)',
                  color: currentPage === page ? '#fff' : isDark ? '#cbd5e1' : '#475569',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700',
                  padding: '0.875rem 0.75rem', borderRadius: '14px',
                  textAlign: 'center', transition: 'all 0.2s ease',
                  boxShadow: currentPage === page ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                <span style={{ fontSize: '0.78rem' }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Telegram */}
          <button
            onClick={() => window.open('https://t.me/FaizUpyZone', '_blank')}
            style={{
              width: '100%',
              background: isDark ? 'rgba(0,136,204,0.12)' : 'rgba(0,136,204,0.07)',
              border: '1.5px solid rgba(0,136,204,0.25)',
              color: '#0088cc', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: '700',
              padding: '0.875rem 1rem', borderRadius: '14px',
              marginBottom: '0.6rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              transition: 'all 0.2s'
            }}
          >
            <Send size={17} /> Telegram Support
          </button>

          {/* Login / Logout */}
          {user ? (
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              style={{
                width: '100%',
                background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
                border: '1.5px solid rgba(239,68,68,0.25)',
                color: '#ef4444', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '700',
                padding: '0.875rem 1rem', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                transition: 'all 0.2s'
              }}
            >
              <LogOut size={17} /> Logout
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('login')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', color: 'white',
                padding: '0.95rem', borderRadius: '14px',
                cursor: 'pointer', fontWeight: '800', fontSize: '0.95rem',
                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
            >
              🔐 Login / Sign Up
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes marquee {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

/* ── Helper Components ── */
function IconBtn({ children, onClick, title, isDark }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: isDark ? 'rgba(30,41,59,0.8)' : '#f1f5f9',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      borderRadius: '10px', width: '36px', height: '36px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'all 0.25s ease'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.borderColor = '#6366f1'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0'; }}
    >{children}</button>
  );
}

function MobileIconBtn({ children, onClick, isDark }) {
  return (
    <button onClick={onClick} style={{
      background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
      border: '1.5px solid rgba(99,102,241,0.2)',
      borderRadius: '10px', width: '36px', height: '36px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
    }}>{children}</button>
  );
}

function MenuBtn({ children, onClick, color, hoverBg }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '0.7rem 1rem',
        background: hovered ? hoverBg : 'transparent',
        border: 'none', color, textAlign: 'left', cursor: 'pointer',
        borderRadius: '10px', display: 'flex', alignItems: 'center',
        gap: '0.6rem', fontSize: '0.9rem', fontWeight: '700',
        transition: 'background 0.2s'
      }}
    >{children}</button>
  );
}

export default Navbar;