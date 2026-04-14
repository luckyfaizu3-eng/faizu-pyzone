import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, User, LogOut, Moon, Sun, Palette, Send, Package } from 'lucide-react';
import { useTheme } from '../App';

/* ─────────────────────────────────────────
   PYSKILL NAVBAR  — White / Light Theme
   Font: DM Sans (Google Fonts)
───────────────────────────────────────── */

const NAV_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&display=swap');

  .psk-nav * { font-family: 'DM Sans', sans-serif !important; }

  @keyframes psk-gradient-bar {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes psk-marquee {
    0%   { transform: translateX(100vw); }
    100% { transform: translateX(-100%); }
  }
  @keyframes psk-slide-down {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes psk-drop {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes psk-badge-pulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.2); }
  }

  /* ── NAV LINK BUTTONS ── */
  .psk-link {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.42rem 0.9rem;
    border-radius: 8px;
    transition: background 0.18s, color 0.18s;
    color: #64748b;
    display: flex; align-items: center; gap: 0.35rem;
    white-space: nowrap;
  }
  .psk-link:hover  { background: #f1f5f9; color: #334155; }
  .psk-link.active { background: #ede9fe; color: #6d28d9; }

  /* ── ICON BUTTONS ── */
  .psk-icon-btn {
    width: 36px; height: 36px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.18s;
  }
  .psk-icon-btn:hover { background: #f1f5f9; border-color: #c7d2fe; transform: scale(1.06); }

  /* ── DROPDOWN ── */
  .psk-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 215px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
    padding: 0.45rem;
    z-index: 1002;
    animation: psk-drop 0.18s ease;
  }
  .psk-dropdown-item {
    width: 100%;
    padding: 0.6rem 0.85rem;
    background: transparent;
    border: none;
    border-radius: 9px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    display: flex; align-items: center; gap: 0.55rem;
    text-align: left;
    transition: background 0.15s;
  }
  .psk-dropdown-item:hover { background: #f8fafc; }

  /* ── MOBILE MENU ── */
  .psk-mobile-menu {
    position: fixed;
    top: 82px; left: 0; right: 0;
    background: rgba(255,255,255,0.99);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 12px 40px rgba(0,0,0,0.08);
    z-index: 998;
    padding: 1rem;
    animation: psk-slide-down 0.28s cubic-bezier(0.34,1.56,0.64,1);
    max-height: 85vh;
    overflow-y: auto;
  }
  .psk-mobile-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.85rem 0.75rem;
    border-radius: 12px;
    text-align: center;
    transition: all 0.2s ease;
    display: flex; flex-direction: column;
    align-items: center; gap: 0.3rem;
  }
  .psk-mobile-btn:hover  { background: #f1f5f9; border-color: #c7d2fe; }
  .psk-mobile-btn.active { background: #ede9fe; border-color: #a78bfa; color: #6d28d9; }
`;

const Navbar = ({
  currentPage,
  setCurrentPage,
  mobileMenuOpen,
  setMobileMenuOpen,
  user,
  logout,
  cartCount
}) => {
  const [scrolled, setScrolled]       = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile]       = useState(window.innerWidth <= 768);
  const { isDark, toggleTheme, toggleBackground, backgroundTheme } = useTheme();

  useEffect(() => {
    const onScroll  = () => setScrolled(window.scrollY > 40);
    const onResize  = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('#psk-user-wrap')) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (currentPage === 'compiler' || currentPage === 'aichat') return null;

  const go = (page) => { setCurrentPage(page); setMobileMenuOpen(false); };

  const themeNames = [
    'Purple','Blue','Green','Orange','Red','Violet',
    'Teal','Indigo','Lime','Fuchsia','Sky','Yellow'
  ];

  /* ── Shared styles ── */
  const navBg = scrolled
    ? 'rgba(255,255,255,0.98)'
    : 'rgba(255,255,255,0.95)';

  const shadow = scrolled
    ? '0 2px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)'
    : 'none';

  return (
    <>
      <style>{NAV_STYLE}</style>

      <nav
        className="psk-nav"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          background: navBg,
          backdropFilter: 'blur(24px) saturate(160%)',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: shadow,
          transition: 'background 0.3s, box-shadow 0.3s'
        }}
      >
        {/* ── Gradient top stripe ── */}
        <div style={{
          height: '2.5px',
          background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)',
          backgroundSize: '300% 100%',
          animation: 'psk-gradient-bar 4s linear infinite'
        }} />

        {/* ── Main row ── */}
        <div style={{
          maxWidth: '1380px',
          margin: '0 auto',
          padding: isMobile ? '0 0.9rem' : '0 1.75rem',
          height: isMobile ? '58px' : '64px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>

          {/* LOGO */}
          <div
            onClick={() => go('home')}
            style={{ display:'flex', alignItems:'center', gap:'0.55rem', cursor:'pointer', flexShrink:0 }}
          >
            <div style={{
              width: isMobile ? '36px' : '42px',
              height: isMobile ? '36px' : '42px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              borderRadius: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? '18px' : '21px',
              boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              flexShrink: 0,
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(-5deg) scale(1.07)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.3)'; }}
            >🎓</div>

            <div>
              <div style={{
                fontSize: isMobile ? '1.05rem' : '1.3rem',
                fontWeight: '900',
                letterSpacing: '-0.4px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1
              }}>PySkill</div>
              <div style={{
                fontSize: '0.58rem',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94a3b8',
                marginTop: '2px'
              }}>Study Hub</div>
            </div>
          </div>

          {/* MARQUEE — desktop only */}
          {!isMobile && (
            <div style={{
              flex: 1,
              maxWidth: '440px',
              overflow: 'hidden',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '100px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 1rem'
            }}>
              <span style={{
                display: 'inline-block',
                whiteSpace: 'nowrap',
                animation: 'psk-marquee 22s linear infinite',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#94a3b8',
                letterSpacing: '0.015em'
              }}>
                ✦ Welcome to PySkill &nbsp;•&nbsp; 🐍 Best Python Notes &nbsp;•&nbsp; ✅ 100% Original &nbsp;•&nbsp; ⚡ Instant Download &nbsp;•&nbsp; 💼 Job Prep &nbsp;•&nbsp; 🔒 Secure Payment &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            </div>
          )}

          {/* ── DESKTOP MENU ── */}
          {!isMobile && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', marginLeft:'auto' }}>

              {/* Theme buttons */}
              <button
                className="psk-icon-btn"
                onClick={toggleBackground}
                title={`Background: ${themeNames[backgroundTheme]}`}
              >
                <Palette size={16} color="#a78bfa" />
              </button>
              <button className="psk-icon-btn" onClick={toggleTheme}>
                {isDark
                  ? <Sun size={16} color="#f59e0b" />
                  : <Moon size={16} color="#6366f1" />
                }
              </button>

              {/* Divider */}
              <div style={{ width:'1px', height:'20px', background:'#e2e8f0', margin:'0 0.2rem' }} />

              {/* Notes */}
              <button
                className={`psk-link ${currentPage === 'products' ? 'active' : ''}`}
                onClick={() => setCurrentPage('products')}
              >
                📚 Notes
              </button>

              {/* Tests */}
              <button
                className={`psk-link ${currentPage === 'mocktests' ? 'active' : ''}`}
                onClick={() => setCurrentPage('mocktests')}
              >
                🐍 Tests
              </button>

              {/* Admin */}
              {user?.isAdmin && (
                <button
                  className={`psk-link ${currentPage === 'admin' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('admin')}
                >
                  ⚙️ Admin
                </button>
              )}

              {/* Divider */}
              <div style={{ width:'1px', height:'20px', background:'#e2e8f0', margin:'0 0.2rem' }} />

              {user ? (
                <>
                  <button
                    className={`psk-link ${currentPage === 'orders' ? 'active' : ''}`}
                    onClick={() => setCurrentPage('orders')}
                  >
                    <Package size={15} /> Orders
                  </button>

                  {/* User avatar + dropdown */}
                  <div id="psk-user-wrap" style={{ position:'relative' }}>
                    <button
                      onClick={() => setShowUserMenu(v => !v)}
                      style={{
                        width: '36px', height: '36px',
                        background: 'linear-gradient(135deg, #ede9fe, #fce7f3)',
                        border: '1.5px solid #c4b5fd',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: showUserMenu ? '0 0 0 3px rgba(139,92,246,0.15)' : 'none'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <User size={16} color="#7c3aed" />
                    </button>

                    {showUserMenu && (
                      <div className="psk-dropdown">
                        <div style={{
                          padding: '0.65rem 0.85rem',
                          borderBottom: '1px solid #f1f5f9',
                          marginBottom: '0.3rem'
                        }}>
                          <div style={{ fontSize:'0.67rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:'#94a3b8' }}>Signed in as</div>
                          <div style={{ fontSize:'0.875rem', fontWeight:'700', color:'#1e293b', marginTop:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {user.email}
                          </div>
                        </div>
                        <button
                          className="psk-dropdown-item"
                          style={{ color:'#0088cc' }}
                          onClick={() => window.open('https://t.me/FaizUpyZone','_blank')}
                        >
                          <Send size={15} /> Telegram Support
                        </button>
                        <button
                          className="psk-dropdown-item"
                          style={{ color:'#ef4444' }}
                          onClick={() => { logout(); setShowUserMenu(false); }}
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setCurrentPage('login')}
                  style={{
                    background: 'white',
                    border: '1.5px solid #e2e8f0',
                    color: '#334155',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    padding: '0.42rem 1.1rem',
                    borderRadius: '9px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.color = '#6d28d9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'none'; }}
                >
                  Login
                </button>
              )}

              {/* Cart */}
              <button
                onClick={() => setCurrentPage('cart')}
                style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  padding: '0.42rem 1.1rem',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(99,102,241,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(99,102,241,0.3)'; }}
              >
                <ShoppingCart size={16} /> Cart
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-7px', right: '-7px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    width: '18px', height: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: '800',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.45)',
                    animation: 'psk-badge-pulse 2s ease-in-out infinite'
                  }}>{cartCount}</span>
                )}
              </button>
            </div>
          )}

          {/* ── MOBILE RIGHT ── */}
          {isMobile && (
            <div style={{ display:'flex', gap:'0.4rem', alignItems:'center', marginLeft:'auto' }}>
              <button className="psk-icon-btn" onClick={toggleBackground}>
                <Palette size={15} color="#a78bfa" />
              </button>
              <button className="psk-icon-btn" onClick={toggleTheme}>
                {isDark ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
              </button>
              <div style={{ position:'relative' }}>
                <button
                  className="psk-icon-btn"
                  onClick={() => setCurrentPage('cart')}
                >
                  <ShoppingCart size={15} color="#6366f1" />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-5px', right: '-5px',
                      background: '#ef4444', borderRadius: '50%',
                      width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.58rem', fontWeight: '800', color: 'white',
                      animation: 'psk-badge-pulse 2s ease-in-out infinite'
                    }}>{cartCount}</span>
                  )}
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                style={{
                  background: mobileMenuOpen ? 'linear-gradient(135deg,#6366f1,#a855f7)' : '#f1f5f9',
                  border: '1.5px solid',
                  borderColor: mobileMenuOpen ? 'transparent' : '#e2e8f0',
                  borderRadius: '9px',
                  width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.22s'
                }}
              >
                {mobileMenuOpen
                  ? <X size={19} color="white" />
                  : <Menu size={19} color="#6366f1" />
                }
              </button>
            </div>
          )}
        </div>

        {/* ── MOBILE MARQUEE ── */}
        {isMobile && (
          <div style={{
            overflow: 'hidden',
            background: '#fafafa',
            borderTop: '1px solid #f1f5f9',
            height: '24px',
            display: 'flex', alignItems: 'center'
          }}>
            <span style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              animation: 'psk-marquee 18s linear infinite',
              fontSize: '0.68rem', fontWeight: '700',
              color: '#94a3b8', letterSpacing: '0.025em'
            }}>
              ✦ PySkill &nbsp;•&nbsp; 🐍 Python Notes &nbsp;•&nbsp; ✅ 100% Original &nbsp;•&nbsp; ⚡ Instant Download &nbsp;•&nbsp; 🔒 Secure &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        )}
      </nav>

      {/* ── MOBILE DROPDOWN MENU ── */}
      {isMobile && mobileMenuOpen && (
        <div className="psk-nav psk-mobile-menu">

          {/* User pill */}
          {user && (
            <div style={{
              background: 'linear-gradient(135deg, #ede9fe, #fce7f3)',
              border: '1px solid #ddd6fe',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              marginBottom: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg,#6366f1,#ec4899)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.95rem', flexShrink: 0
              }}>👤</div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:'0.67rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:'#a78bfa' }}>Signed in as</div>
                <div style={{ fontSize:'0.875rem', fontWeight:'700', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
              </div>
            </div>
          )}

          {/* Grid items */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.55rem', marginBottom:'0.75rem' }}>
            {[
              { page:'products',  icon:'📚', label:'Browse Notes' },
              { page:'mocktests', icon:'🐍', label:'Mock Tests' },
              ...(user ? [{ page:'orders', icon:'📦', label:'My Orders' }] : []),
              ...(user?.isAdmin ? [{ page:'admin', icon:'⚙️', label:'Admin Panel' }] : []),
            ].map(({ page, icon, label }) => (
              <button
                key={page}
                className={`psk-mobile-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => go(page)}
              >
                <span style={{ fontSize:'1.35rem' }}>{icon}</span>
                <span style={{ fontSize:'0.78rem' }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Telegram */}
          <button
            onClick={() => window.open('https://t.me/FaizUpyZone','_blank')}
            style={{
              width: '100%',
              background: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              color: '#0284c7',
              cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: '700',
              padding: '0.85rem 1rem', borderRadius: '12px',
              marginBottom: '0.55rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              transition: 'all 0.18s'
            }}
          >
            <Send size={16} /> Telegram Support
          </button>

          {/* Login / Logout */}
          {user ? (
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              style={{
                width: '100%',
                background: '#fff5f5',
                border: '1.5px solid #fecaca',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: '700',
                padding: '0.85rem 1rem', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                transition: 'all 0.18s'
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <button
              onClick={() => go('login')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                border: 'none', color: 'white',
                padding: '0.9rem', borderRadius: '12px',
                cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              🔐 Login / Sign Up
            </button>
          )}
        </div>
      )}
    </>
  );
};

/* ── Small helper components ── */

export function IconBtn({ children, onClick, title }) {
  return (
    <button
      className="psk-icon-btn"
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export function MobileIconBtn({ children, onClick }) {
  return (
    <button
      className="psk-icon-btn"
      onClick={onClick}
      style={{ position:'relative' }}
    >
      {children}
    </button>
  );
}

export function MenuBtn({ children, onClick, color, hoverBg }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '0.65rem 0.85rem',
        background: hovered ? hoverBg : 'transparent',
        border: 'none', color,
        textAlign: 'left', cursor: 'pointer',
        borderRadius: '9px',
        display: 'flex', alignItems: 'center', gap: '0.55rem',
        fontSize: '0.875rem', fontWeight: '700',
        transition: 'background 0.15s',
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {children}
    </button>
  );
}

export default Navbar;