import React from 'react';
import { ShoppingCart, Trash2, Download, Zap } from 'lucide-react';
import { useCart, useTheme } from '../App';

function CartPage({ setCurrentPage, completeOrder, user }) {
  const { cart, removeFromCart, cartTotal } = useCart();
  const { isDark } = useTheme();
  const isMobile = window.innerWidth <= 768;

  const handleCheckout = () => {
    if (!user) {
      window.showToast?.('Please login first! 🔐', 'error');
      setCurrentPage('login');
      return;
    }
    
    completeOrder();
  };

  if (cart.length === 0) {
    return (
      <div style={{
        paddingTop: isMobile ? '100px' : '120px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '100px 1.5rem 2rem' : '120px 1.5rem 2rem'
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'fadeInUp 0.6s ease'
        }}>
          <ShoppingCart 
            size={isMobile ? 80 : 120} 
            color={isDark ? '#475569' : '#cbd5e1'} 
            style={{
              margin: '0 auto 2rem',
              opacity: 0.5
            }} 
          />
          <h2 style={{
            fontSize: isMobile ? '1.6rem' : '2.5rem',
            fontWeight: '900',
            marginBottom: '1rem',
            color: isDark ? '#e2e8f0' : '#1e293b'
          }}>
            Your cart is empty
          </h2>
          <p style={{
            color: isDark ? '#94a3b8' : '#64748b',
            fontSize: isMobile ? '0.95rem' : '1.2rem',
            marginBottom: '2rem'
          }}>
            Start shopping now!
          </p>
          <button 
            onClick={() => setCurrentPage('products')} 
            style={{
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              border: 'none',
              color: 'white',
              padding: isMobile ? '1rem 2.5rem' : '1.25rem 3rem',
              fontSize: isMobile ? '0.95rem' : '1.25rem',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 30px rgba(99,102,241,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(99,102,241,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.3)';
            }}
          >
            <Download size={isMobile ? 20 : 24} />
            Browse Notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      paddingTop: isMobile ? '90px' : '120px',
      paddingBottom: '3rem',
      minHeight: '100vh',
      padding: isMobile ? '90px 1rem 3rem' : '120px 1.5rem 5rem'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.8rem' : '4rem',
          fontWeight: '900',
          textAlign: 'center',
          marginBottom: isMobile ? '2rem' : '3rem',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Shopping Cart
        </h1>
        
        <div style={{
          background: isDark ? '#1e293b' : '#ffffff',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          borderRadius: isMobile ? '18px' : '24px',
          padding: isMobile ? '1.25rem' : '2.5rem',
          marginBottom: '2rem',
          boxShadow: isDark 
            ? '0 4px 20px rgba(0,0,0,0.3)' 
            : '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          {cart.map((item, index) => (
            <div 
              key={item.id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.75rem' : '2rem',
                paddingBottom: isMobile ? '1.25rem' : '2rem',
                marginBottom: isMobile ? '1.25rem' : '2rem',
                borderBottom: index !== cart.length - 1 
                  ? (isDark ? '1px solid #334155' : '1px solid #e2e8f0') 
                  : 'none',
                flexWrap: 'wrap'
              }}
            >
              <div style={{
                background: item.thumbnail 
                  ? `url(${item.thumbnail})` 
                  : 'linear-gradient(135deg, #6366f1, #ec4899)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: isMobile ? '70px' : '100px',
                height: isMobile ? '70px' : '100px',
                borderRadius: isMobile ? '12px' : '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: item.thumbnail ? '0' : (isMobile ? '1.8rem' : '3rem')
              }}>
                {!item.thumbnail && (item.image || '📚')}
              </div>
              
              <div style={{
                flex: 1,
                minWidth: isMobile ? '120px' : '150px'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '0.95rem' : '1.3rem',
                  fontWeight: '800',
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  marginBottom: '0.5rem'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: '#6366f1',
                  fontWeight: '700',
                  fontSize: isMobile ? '0.85rem' : '1.1rem'
                }}>
                  ₹{item.price}
                </p>
              </div>
              
              <div style={{
                fontSize: isMobile ? '1.2rem' : '1.8rem',
                fontWeight: '900',
                color: isDark ? '#e2e8f0' : '#1e293b'
              }}>
                ₹{item.price * item.quantity}
              </div>
              
              <button 
                onClick={() => removeFromCart(item.id)} 
                style={{
                  background: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
                  border: '2px solid rgba(239,68,68,0.3)',
                  padding: isMobile ? '0.6rem' : '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Trash2 size={isMobile ? 20 : 24} color="#ef4444" />
              </button>
            </div>
          ))}
        </div>
        
        <div style={{
          background: isDark ? '#1e293b' : '#ffffff',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          borderRadius: isMobile ? '18px' : '24px',
          padding: isMobile ? '1.5rem' : '3rem',
          boxShadow: isDark 
            ? '0 4px 20px rgba(0,0,0,0.3)' 
            : '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: isMobile ? '1.2rem' : '2rem',
            fontWeight: '900',
            marginBottom: isMobile ? '1.5rem' : '2.5rem',
            paddingBottom: isMobile ? '1.25rem' : '2rem',
            borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Total:</span>
            <span style={{
              fontSize: isMobile ? '1.8rem' : '3.5rem',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ₹{cartTotal}
            </span>
          </div>
          <button 
            onClick={handleCheckout}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              border: 'none',
              color: 'white',
              padding: isMobile ? '1rem' : '1.5rem',
              fontSize: isMobile ? '1rem' : '1.5rem',
              borderRadius: '16px',
              cursor: 'pointer',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 40px rgba(99,102,241,0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 15px 50px rgba(99,102,241,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(99,102,241,0.4)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Zap size={isMobile ? 24 : 28} />
            Pay ₹{cartTotal} - Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;