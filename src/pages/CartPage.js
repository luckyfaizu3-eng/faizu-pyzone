import React, { useState } from 'react';
import { ShoppingCart, Trash2, Download, Zap, Loader } from 'lucide-react';
import { useCart } from '../App';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function CartPage({ setCurrentPage, completeOrder, user }) {
  const { cart, removeFromCart, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!user) {
      alert('Please login first to complete purchase!');
      setCurrentPage('login');
      return;
    }

    setLoading(true);

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      setLoading(false);
      return;
    }

    // Razorpay options
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: cartTotal * 100, // Convert to paise
      currency: 'INR',
      name: 'FaizUpyZone',
      description: 'Purchase Study Notes',
      image: '/logo192.png',
      handler: async function (response) {
        try {
          // Payment successful - Save order to Firebase
          const orderData = {
            userId: user.uid,
            userEmail: user.email,
            items: cart,
            total: cartTotal,
            paymentId: response.razorpay_payment_id,
            status: 'completed',
            createdAt: new Date().toISOString()
          };

          await addDoc(collection(db, 'orders'), orderData);
          
          window.showToast?.('✅ Payment Successful! Your notes are ready to download.', 'success');
          clearCart();
          setCurrentPage('orders');
        } catch (error) {
          console.error('Error saving order:', error);
          alert('Payment received but order save failed. Please contact support with Payment ID: ' + response.razorpay_payment_id);
        }
        setLoading(false);
      },
      prefill: {
        email: user?.email || '',
        contact: user?.phoneNumber || ''
      },
      theme: {
        color: '#6366f1'
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
          window.showToast?.('Payment cancelled 🛒', 'info');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  if (cart.length === 0) {
    return (
      <div style={{
        paddingTop: '120px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'fadeInUp 0.6s ease'
        }}>
          <ShoppingCart 
            size={120} 
            color="#cbd5e1" 
            style={{
              margin: '0 auto 2rem',
              opacity: 0.5
            }} 
          />
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            Your cart is empty
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '1.2rem',
            marginBottom: '3rem'
          }}>
            Start shopping now!
          </p>
          <button 
            onClick={() => setCurrentPage('products')} 
            style={{
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              border: 'none',
              color: 'white',
              padding: '1.25rem 3rem',
              fontSize: '1.25rem',
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
            <Download size={24} />
            Browse Notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      paddingTop: '120px',
      paddingBottom: '5rem',
      minHeight: '100vh',
      padding: '120px 1.5rem 5rem'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: '900',
          textAlign: 'center',
          marginBottom: '3rem',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Shopping Cart
        </h1>
        
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          {cart.map((item, index) => (
            <div 
              key={item.id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                paddingBottom: '2rem',
                marginBottom: '2rem',
                borderBottom: index !== cart.length - 1 
                  ? '1px solid #e2e8f0' 
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
                width: '100px',
                height: '100px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: item.thumbnail ? '0' : '3rem'
              }}>
                {!item.thumbnail && (item.image || '📚')}
              </div>
              
              <div style={{
                flex: 1,
                minWidth: '200px'
              }}>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '800',
                  color: '#1e293b',
                  marginBottom: '0.5rem'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: '#6366f1',
                  fontWeight: '700',
                  fontSize: '1.1rem'
                }}>
                  ₹{item.price}
                </p>
              </div>
              
              <div style={{
                fontSize: '1.8rem',
                fontWeight: '900',
                color: '#1e293b'
              }}>
                ₹{item.price * item.quantity}
              </div>
              
              <button 
                onClick={() => removeFromCart(item.id)} 
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '2px solid rgba(239,68,68,0.3)',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Trash2 size={24} color="#ef4444" />
              </button>
            </div>
          ))}
        </div>
        
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '2rem',
            fontWeight: '900',
            marginBottom: '2.5rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <span style={{ color: '#64748b' }}>Total:</span>
            <span style={{
              fontSize: '3.5rem',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ₹{cartTotal}
            </span>
          </div>
          <button 
            onClick={handlePayment}
            disabled={loading}
            style={{
              width: '100%',
              background: loading 
                ? '#94a3b8' 
                : 'linear-gradient(135deg, #6366f1, #ec4899)',
              border: 'none',
              color: 'white',
              padding: '1.5rem',
              fontSize: '1.5rem',
              borderRadius: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              boxShadow: '0 10px 40px rgba(99,102,241,0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 50px rgba(99,102,241,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(99,102,241,0.4)';
              }
            }}
          >
            {loading ? (
              <>
                <Loader size={28} className="spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap size={28} />
                Pay ₹{cartTotal} - Proceed to Checkout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;