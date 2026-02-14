import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, User, LogOut, Moon, Sun, Palette } from 'lucide-react';
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

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  // Theme names for display
  const themeNames = [
    'Purple',
    'Blue', 
    'Green',
    'Orange',
    'Red',
    'Violet',
    'Teal',
    'Indigo',
    'Lime',
    'Fuchsia',
    'Sky',
    'Yellow'
  ];

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: isDark 
          ? 'rgba(15, 23, 42, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: isDark
          ? '1px solid rgba(99, 102, 241, 0.2)'
          : '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: scrolled ? (isDark 
          ? '0 4px 20px rgba(0,0,0,0.5)' 
          : '0 4px 20px rgba(0,0,0,0.08)') 
          : 'none',
        zIndex: 1000,
        padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.5rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('home')} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: isMobile ? '36px' : '42px',
              height: isMobile ? '36px' : '42px',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '18px' : '20px',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
            }}>🎓</div>
            {!isMobile && (
              <div style={{
                fontSize: '1.3rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>FaizUpyZone</div>
            )}
          </div>

          {/* Running Marquee Text - Desktop only */}
          {!isMobile && (
            <div style={{ 
              flex: 1, 
              maxWidth: '500px',
              overflow: 'hidden',
              position: 'relative',
              background: isDark ? '#1e293b' : '#f8fafc',
              border: isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
              borderRadius: '25px',
              padding: '0.7rem 1rem',
              height: '42px'
            }}>
              <div style={{
                display: 'inline-block',
                whiteSpace: 'nowrap',
                animation: 'marquee 20s linear infinite',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: isDark ? '#94a3b8' : '#64748b'
              }}>
                Welcome to FaizUpyZone • Best Python Notes • 100% Original Content • Instant Download • Quality Study Materials • JKBOSE Materials • Job Preparation • Secure Payment
              </div>
            </div>
          )}

          {/* Desktop Menu */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {/* Background Theme Toggle */}
              <button
                onClick={toggleBackground}
                title={`Theme: ${themeNames[backgroundTheme]}`}
                style={{
                  background: isDark ? '#1e293b' : '#f1f5f9',
                  border: isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
                  e.currentTarget.style.borderColor = '#6366f1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0';
                }}
              >
                <Palette size={18} color="#6366f1" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  background: isDark ? '#1e293b' : '#f1f5f9',
                  border: isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.borderColor = '#6366f1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0';
                }}
              >
                {isDark ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
              </button>

              <button 
                onClick={() => setCurrentPage('products')} 
                style={{
                  background: currentPage === 'products' 
                    ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') 
                    : 'transparent',
                  border: 'none',
                  color: currentPage === 'products' ? '#6366f1' : (isDark ? '#cbd5e1' : '#64748b'),
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease'
                }}
              >
                Browse Notes
              </button>

              {/* ✅ MOCK TESTS BUTTON */}
              <button 
                onClick={() => setCurrentPage('mocktests')} 
                style={{
                  background: currentPage === 'mocktests' 
                    ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') 
                    : 'transparent',
                  border: 'none',
                  color: currentPage === 'mocktests' ? '#6366f1' : (isDark ? '#cbd5e1' : '#64748b'),
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease'
                }}
              >
                🐍 Mock Tests
              </button>
              
              {user?.isAdmin && (
                <button 
                  onClick={() => setCurrentPage('admin')} 
                  style={{
                    background: currentPage === 'admin' 
                      ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') 
                      : 'transparent',
                    border: 'none',
                    color: currentPage === 'admin' ? '#6366f1' : (isDark ? '#cbd5e1' : '#64748b'),
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Admin
                </button>
              )}
              
              {user ? (
                <>
                  <button 
                    onClick={() => setCurrentPage('orders')} 
                    style={{
                      background: currentPage === 'orders' 
                        ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') 
                        : 'transparent',
                      border: 'none',
                      color: currentPage === 'orders' ? '#6366f1' : (isDark ? '#cbd5e1' : '#64748b'),
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Orders
                  </button>
                  
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      style={{
                        background: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
                        border: '1.5px solid rgba(99,102,241,0.3)',
                        borderRadius: '50%',
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <User size={18} color="#6366f1" />
                    </button>
                    
                    {showUserMenu && (
                      <div style={{
                        position: 'absolute',
                        top: '50px',
                        right: 0,
                        background: isDark ? '#1e293b' : '#fff',
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: isDark 
                          ? '0 10px 40px rgba(0,0,0,0.5)' 
                          : '0 10px 40px rgba(0,0,0,0.1)',
                        padding: '0.5rem',
                        minWidth: '200px',
                        zIndex: 1000
                      }}>
                        <div style={{
                          padding: '0.75rem 1rem',
                          borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                            Signed in as
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: '600', color: isDark ? '#e2e8f0' : '#1e293b' }}>
                            {user.email}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#991b1b' : '#fef2f2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => setCurrentPage('login')} 
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: 'white',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)';
                  }}
                >
                  Login
                </button>
              )}
              
              <button 
                onClick={() => setCurrentPage('cart')} 
                style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  border: 'none',
                  color: 'white',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)';
                }}
              >
                <ShoppingCart size={18} />
                Cart
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.5)'
                  }}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Mobile Menu Icons */}
          {isMobile && (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {/* Background Toggle - Mobile */}
              <button
                onClick={toggleBackground}
                style={{
                  background: isDark ? '#1e293b' : 'rgba(99,102,241,0.1)',
                  border: isDark ? '1.5px solid #334155' : '1.5px solid rgba(99,102,241,0.3)',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Palette size={18} color="#6366f1" />
              </button>

              {/* Dark Mode Toggle - Mobile */}
              <button
                onClick={toggleTheme}
                style={{
                  background: isDark ? '#1e293b' : 'rgba(99,102,241,0.1)',
                  border: isDark ? '1.5px solid #334155' : '1.5px solid rgba(99,102,241,0.3)',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isDark ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
              </button>

              <button 
                onClick={() => setCurrentPage('cart')} 
                style={{
                  position: 'relative',
                  background: isDark ? '#1e293b' : 'rgba(99,102,241,0.1)',
                  border: isDark ? '1.5px solid #334155' : '1.5px solid rgba(99,102,241,0.3)',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ShoppingCart size={18} color="#6366f1" />
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.5)'
                  }}>
                    {cartCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: isDark ? '#1e293b' : 'rgba(99,102,241,0.1)',
                  border: isDark ? '1.5px solid #334155' : '1.5px solid rgba(99,102,241,0.3)',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {mobileMenuOpen ? <X size={22} color="#6366f1" /> : <Menu size={22} color="#6366f1" />}
              </button>
            </div>
          )}
        </div>

        {/* Running Marquee - Mobile (below navbar) */}
        {isMobile && (
          <div style={{
            marginTop: '0.5rem',
            overflow: 'hidden',
            background: isDark ? '#1e293b' : '#f8fafc',
            border: isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
            borderRadius: '20px',
            padding: '0.5rem 0.75rem',
            height: '32px'
          }}>
            <div style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              animation: 'marquee 20s linear infinite',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: isDark ? '#94a3b8' : '#64748b'
            }}>
              Welcome to FaizUpyZone • Best Python Notes • 100% Original • Instant Download • Quality Materials
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '112px',
          left: 0,
          right: 0,
          background: isDark 
            ? 'rgba(15, 23, 42, 0.98)' 
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          boxShadow: isDark 
            ? '0 10px 30px rgba(0,0,0,0.5)' 
            : '0 10px 30px rgba(0,0,0,0.1)',
          zIndex: 999,
          padding: '1rem',
          animation: 'slideDown 0.3s ease',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}>
          {/* Mobile Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => handleNavClick('products')} 
              style={{
                background: currentPage === 'products' 
                  ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') 
                  : 'transparent',
                border: 'none',
                color: currentPage === 'products' ? '#6366f1' : (isDark ? '#cbd5e1' : '#64748b'),
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              📚 Browse Notes
            </button>

            {/* ✅ MOCK TESTS BUTTON - MOBILE */}
            <button 
              onClick={() => handleNavClick('mocktests')} 
              style={{
                background: currentPage === 'mocktests' 
                  ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') 
                  : 'transparent',
                border: 'none',
                color: currentPage === 'mocktests' ? '#6366f1' : (isDark ? '#cbd5e1' : '#64748b'),
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              🐍 Mock Tests
            </button>
            
            {user?.isAdmin && (
              <button 
                onClick={() => handleNavClick('admin')} 
                style={{
                  background: currentPage === 'admin' 
                    ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') 
                    : 'transparent',
                  border: 'none',
                  color: currentPage === 'admin' ? '#6366f1' : (isDark ? '#cbd5e1' : '#64748b'),
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  padding: '1rem',
                  borderRadius: '12px',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                ⚙️ Admin Panel
              </button>
            )}
            
            {user ? (
              <>
                <button 
                  onClick={() => handleNavClick('orders')} 
                  style={{
                    background: currentPage === 'orders' 
                      ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') 
                      : 'transparent',
                    border: 'none',
                    color: currentPage === 'orders' ? '#6366f1' : (isDark ? '#cbd5e1' : '#64748b'),
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    padding: '1rem',
                    borderRadius: '12px',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  📦 My Orders
                </button>
                
                <div style={{
                  background: isDark ? '#1e293b' : '#f8fafc',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '0.25rem' }}>
                    Signed in as
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '0.75rem' }}>
                    {user.email}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDark ? '#991b1b' : '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#ef4444',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '600'
                    }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => handleNavClick('login')} 
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '1rem',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                  marginTop: '0.5rem'
                }}
              >
                🔐 Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;