import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, Sun, Moon, User, LogOut } from 'lucide-react';

const Navbar = ({ 
  currentPage, 
  setCurrentPage, 
  searchQuery, 
  setSearchQuery, 
  mobileMenuOpen, 
  setMobileMenuOpen,
  user,
  logout,
  cartCount 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
      zIndex: 1000,
      padding: '0.75rem 2rem',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem'
      }}>
        
        {/* Logo */}
        <div 
          onClick={() => setCurrentPage('home')} 
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
            width: '42px',
            height: '42px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
          }}>🎓</div>
          <div>
            <div style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>FaizUpyZone</div>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <div style={{
          flex: 1,
          maxWidth: '500px',
          display: window.innerWidth > 768 ? 'block' : 'none'
        }}>
          <div style={{position: 'relative'}}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }} 
            />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 1rem 0.7rem 2.75rem',
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '25px',
                color: '#1e293b',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Desktop Menu */}
        <div style={{
          display: window.innerWidth > 768 ? 'flex' : 'none',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <button 
            onClick={() => setCurrentPage('products')} 
            style={{
              background: currentPage === 'products' ? 'rgba(99,102,241,0.1)' : 'transparent',
              border: 'none',
              color: currentPage === 'products' ? '#6366f1' : '#64748b',
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
          
          {user?.isAdmin && (
            <button 
              onClick={() => setCurrentPage('admin')} 
              style={{
                background: currentPage === 'admin' ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: 'none',
                color: currentPage === 'admin' ? '#6366f1' : '#64748b',
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
                  background: currentPage === 'orders' ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: 'none',
                  color: currentPage === 'orders' ? '#6366f1' : '#64748b',
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
              
              {/* User Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    background: 'rgba(99,102,241,0.1)',
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
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '0.5rem',
                    minWidth: '200px',
                    zIndex: 1000
                  }}>
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #e2e8f0',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Signed in as</div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
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
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
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
          
          {/* Cart Button */}
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

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: window.innerWidth <= 768 ? 'flex' : 'none',
            background: 'rgba(99,102,241,0.1)',
            border: '1.5px solid rgba(99,102,241,0.3)',
            borderRadius: '10px',
            width: '40px',
            height: '40px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {mobileMenuOpen ? <X size={24} color="#6366f1" /> : <Menu size={24} color="#6366f1" />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;