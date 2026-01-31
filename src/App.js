import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Upload, X, Plus, Trash2, Star, Download, Instagram, Users, Shield, Search, Menu, CheckCircle, Zap, Package, BarChart, FileText, MessageCircle, Sun, Moon, Image as ImageIcon, Loader } from 'lucide-react';

// Import your Firebase services (make sure these files exist)
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { registerUser, loginUser, logoutUser, isAdmin, resetPassword } from './authService';
import { addProduct as addProductDB, getAllProducts, deleteProduct as deleteProductDB, addOrder as addOrderDB, getUserOrders, uploadPDF } from './dbService';

// =====================================================
// DYNAMIC ISLAND TOAST NOTIFICATIONS
// =====================================================
const DynamicIslandToast = ({ message, type, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsExpanded(true), 50);
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 400);
    }, 3500);
    return () => clearTimeout(exitTimer);
  }, [onClose]);

  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10b981', icon: '✓' },
    error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444', icon: '✕' },
    info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6', icon: 'ℹ' },
    warning: { bg: 'rgba(245, 158, 11, 0.95)', border: '#f59e0b', icon: '⚠' }
  };

  const config = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: `translateX(-50%) scale(${isExpanded && !isExiting ? 1 : 0.8})`,
      background: config.bg,
      backdropFilter: 'blur(20px) saturate(180%)',
      border: `2px solid ${config.border}`,
      borderRadius: '50px',
      padding: isExpanded ? '1rem 2rem' : '0.5rem 1rem',
      minWidth: isExpanded ? '300px' : '120px',
      maxWidth: '90vw',
      boxShadow: `0 20px 60px ${config.border}40, 0 0 0 1px rgba(255,255,255,0.1) inset`,
      zIndex: 10000,
      opacity: isExiting ? 0 : 1,
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      color: '#fff',
      fontWeight: '600',
      fontSize: '0.95rem',
      cursor: 'pointer'
    }}
    onClick={() => {
      setIsExiting(true);
      setTimeout(onClose, 400);
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '900'
      }}>{config.icon}</div>
      <div style={{ flex: 1, opacity: isExpanded ? 1 : 0, transition: 'opacity 0.3s' }}>
        {message}
      </div>
    </div>
  );
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.showToast = (message, type = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
    };
    return () => { delete window.showToast; };
  }, []);

  return (
    <>
      {toasts.map(toast => (
        <DynamicIslandToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}
    </>
  );
};

const showToast = (message, type = 'info') => {
  if (window.showToast) window.showToast(message, type);
};

// =====================================================
// CONTEXTS
// =====================================================
const CartContext = React.createContext();
const AuthContext = React.createContext();
const ThemeContext = React.createContext();
const useCart = () => React.useContext(CartContext);
const useAuth = () => React.useContext(AuthContext);
const useTheme = () => React.useContext(ThemeContext);

// =====================================================
// CONSTANTS
// =====================================================
const CATEGORIES = [
  { id: 'all', name: 'All Notes', icon: '📚', color: '#8b5cf6' },
  { id: 'python', name: 'Python Notes', icon: '🐍', color: '#3776ab' },
  { id: 'jkbose', name: 'JKBOSE Materials', icon: '🎓', color: '#ec4899' },
  { id: 'job', name: 'Job Preparation', icon: '💼', color: '#10b981' },
  { id: 'web', name: 'Web Development', icon: '🌐', color: '#3b82f6' },
  { id: 'hacking', name: 'Ethical Hacking', icon: '🔐', color: '#ef4444' },
  { id: 'data', name: 'Data Science', icon: '📊', color: '#f59e0b' },
  { id: 'ai', name: 'AI & ML', icon: '🤖', color: '#8b5cf6' },
  { id: 'marketing', name: 'Digital Marketing', icon: '📱', color: '#06b6d4' }
];

const RAZORPAY_KEY_ID = "rzp_test_S6ZxzqSocanX62";

// =====================================================
// MODERN 3D BACKGROUND WITH LIVE PARTICLES
// =====================================================
const MaturedBackground = ({ isDark }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      const count = window.innerWidth < 768 ? 40 : 80;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        speedZ: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? 'rgba(139, 92, 246, 0.6)' : 'rgba(236, 72, 153, 0.6)'
      }));
    };

    const draw = () => {
      // Modern gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0a0a0f');
      gradient.addColorStop(0.5, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles (3D effect)
      particles.forEach((particle, i) => {
        // Update 3D position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.z -= particle.speedZ;

        // Reset if too close or out of bounds
        if (particle.z < 1) {
          particle.z = 1000;
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
        }
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        // 3D projection
        const scale = 1000 / particle.z;
        const x2d = (particle.x - canvas.width / 2) * scale + canvas.width / 2;
        const y2d = (particle.y - canvas.height / 2) * scale + canvas.height / 2;
        const size = particle.size * scale;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby particles
        particles.slice(i + 1).forEach(other => {
          const otherScale = 1000 / other.z;
          const otherX = (other.x - canvas.width / 2) * otherScale + canvas.width / 2;
          const otherY = (other.y - canvas.height / 2) * otherScale + canvas.height / 2;
          
          const dx = x2d - otherX;
          const dy = y2d - otherY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(x2d, y2d);
            ctx.lineTo(otherX, otherY);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

// =====================================================
// WHATSAPP FLOATING BUTTON
// =====================================================
const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/918899843797"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg, #25d366, #128c7e)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 30px rgba(37, 211, 102, 0.5)',
        zIndex: 999,
        animation: 'bounce 2s ease-in-out infinite',
        cursor: 'pointer',
        transition: 'transform 0.3s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <MessageCircle size={30} color="#fff" />
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </a>
  );
};

// =====================================================
// MAIN APP COMPONENT
// =====================================================
function App() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDark, setIsDark] = useState(true);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Load products from Firebase
  useEffect(() => {
    const loadProducts = async () => {
      const result = await getAllProducts();
      if (result.success) {
        setProducts(result.products);
      }
    };
    loadProducts();
  }, []);

  // Load user orders
  useEffect(() => {
    const loadOrders = async () => {
      if (user?.email) {
        const result = await getUserOrders(user.email);
        if (result.success) {
          setOrders(result.orders);
        }
      } else {
        setOrders([]);
      }
    };
    loadOrders();
  }, [user]);

  // Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          uid: firebaseUser.uid,
          isAdmin: isAdmin(firebaseUser.email)
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const initiatePayment = (amount, items, onSuccess) => {
    if (!window.Razorpay) {
      showToast('Payment system loading... Please try again! ⏳', 'error');
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: "INR",
      name: "FaizUpyZone",
      description: "Premium Study Materials",
      image: "https://img.icons8.com/fluency/96/000000/graduation-cap.png",
      handler: async function (response) {
        showToast('🎉 Payment Successful! Redirecting to orders...', 'success');
        setTimeout(async () => {
          await onSuccess(response);
        }, 1500);
      },
      prefill: {
        name: user?.displayName || user?.email?.split('@')[0] || "Student",
        email: user?.email || "",
        contact: ""
      },
      theme: {
        color: "#8b5cf6"
      },
      modal: {
        ondismiss: function() {
          showToast('Payment cancelled 🛒', 'info');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function () {
      showToast('❌ Payment Failed! Please try again.', 'error');
    });
    rzp.open();
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item));
    } else {
      setCart([...cart, {...product, quantity: 1}]);
    }
    showToast('Added to cart! 🛒', 'success');
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    showToast('Removed from cart', 'info');
  };

  const buyNow = async (product) => {
    if (!user) {
      showToast('Please login first! 🔐', 'error');
      setCurrentPage('login');
      return;
    }

    initiatePayment(product.price, [product], async (response) => {
      const newOrder = {
        userEmail: user.email,
        items: [{
          id: product.id,
          title: product.title,
          price: product.price,
          pdfUrl: product.pdfUrl,
          pdfFileName: product.pdfFileName,
          thumbnail: product.thumbnail
        }],
        total: product.price,
        date: new Date().toLocaleDateString(),
        status: 'completed',
        paymentId: response.razorpay_payment_id
      };
      
      const result = await addOrderDB(newOrder);
      if (result.success) {
        const updatedOrders = await getUserOrders(user.email);
        if (updatedOrders.success) {
          setOrders(updatedOrders.orders);
        }
        setCurrentPage('orders');
        showToast('🎊 Order placed! Download your PDF now!', 'success');
      }
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const login = async (email, password) => {
    const result = await loginUser(email, password);
    if (result.success) {
      showToast('Welcome back! 🎉', 'success');
      setCurrentPage('home');
      return true;
    } else {
      showToast('Login failed! Check credentials', 'error');
      return false;
    }
  };

  const register = async (email, password, name) => {
    const result = await registerUser(email, password, name);
    if (result.success) {
      showToast('Account created! 🎊', 'success');
      setCurrentPage('home');
      return true;
    } else {
      showToast('Registration failed: ' + result.error, 'error');
      return false;
    }
  };

  const logout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);
      setCart([]);
      setCurrentPage('home');
      showToast('Logged out! 👋', 'info');
    }
  };

  const completeOrder = () => {
    if (!user) {
      showToast('⚠️ Please login first!', 'warning');
      setCurrentPage('login');
      return;
    }

    initiatePayment(cartTotal, cart, async (response) => {
      const newOrder = {
        userEmail: user.email,
        items: cart.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          pdfUrl: item.pdfUrl,
          pdfFileName: item.pdfFileName,
          thumbnail: item.thumbnail
        })),
        total: cartTotal,
        date: new Date().toLocaleDateString(),
        status: 'completed',
        paymentId: response.razorpay_payment_id
      };
      
      const result = await addOrderDB(newOrder);
      if (result.success) {
        const updatedOrders = await getUserOrders(user.email);
        if (updatedOrders.success) {
          setOrders(updatedOrders.orders);
        }
        setCart([]);
        setCurrentPage('orders');
        showToast('🎊 Order placed! Download your PDFs!', 'success');
      }
    });
  };

  const addProduct = async (product) => {
    const productData = { 
      ...product, 
      uploadDate: new Date().toISOString(),
      totalDownloads: 0
    };
    
    const result = await addProductDB(productData);
    if (result.success) {
      setProducts([...products, { id: result.id, ...productData }]);
      showToast('✅ Product uploaded!', 'success');
    } else {
      showToast('❌ Upload failed: ' + result.error, 'error');
    }
  };

  const deleteProduct = async (id) => {
    const result = await deleteProductDB(id);
    if (result.success) {
      setProducts(products.filter(p => p.id !== id));
      showToast('✅ Product deleted!', 'success');
    } else {
      showToast('❌ Delete failed: ' + result.error, 'error');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, cartTotal, cartCount }}>
        <ThemeContext.Provider value={{ isDark, setIsDark }}>
          <div style={{
            minHeight: '100vh',
            background: isDark ? '#000' : '#f5f5f5',
            color: isDark ? '#fff' : '#000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.5s ease'
          }}>
            
            <ToastContainer />
            <MaturedBackground isDark={isDark} />
            <WhatsAppButton />
            
            <Navbar 
              currentPage={currentPage} 
              setCurrentPage={setCurrentPage}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
            />
            
            {mobileMenuOpen && (
              <MobileMenu 
                setCurrentPage={setCurrentPage} 
                setMobileMenuOpen={setMobileMenuOpen}
                user={user}
                logout={logout}
              />
            )}
            
            <main style={{position: 'relative', zIndex: 1}}>
              {currentPage === 'home' && <HomePage setCurrentPage={setCurrentPage} />}
              {currentPage === 'products' && <ProductsPage products={products} buyNow={buyNow} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} searchQuery={searchQuery} />}
              {currentPage === 'cart' && <CartPage setCurrentPage={setCurrentPage} completeOrder={completeOrder} />}
              {currentPage === 'login' && <LoginPage />}
              {currentPage === 'orders' && <OrdersPage orders={orders} />}
              {currentPage === 'admin' && user?.isAdmin && <AdminPanel products={products} addProduct={addProduct} deleteProduct={deleteProduct} orders={orders} />}
            </main>
            
            <Footer setCurrentPage={setCurrentPage} />
          </div>
        </ThemeContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

// =====================================================
// NAVBAR
// =====================================================
function Navbar({ currentPage, setCurrentPage, searchQuery, setSearchQuery, mobileMenuOpen, setMobileMenuOpen }) {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDark, setIsDark } = useTheme();
  const [scrolled, setScrolled] = useState(false);

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
      background: scrolled 
        ? 'rgba(0, 0, 0, 0.95)' 
        : 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(30px) saturate(180%)',
      borderBottom: scrolled ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(139,92,246,0.2)',
      boxShadow: scrolled ? '0 10px 40px rgba(139,92,246,0.3)' : 'none',
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
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 15px rgba(139,92,246,0.5)'
          }}>🎓</div>
          <div>
            <div style={{
              fontSize: '1.3rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>FaizUpyZone</div>
            <div style={{
              fontSize: '0.7rem',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Instagram size={10} /> @code_with_06
            </div>
          </div>
        </div>

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
                color: '#94a3b8'
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
                background: 'rgba(139,92,246,0.1)',
                border: '1.5px solid rgba(139,92,246,0.3)',
                borderRadius: '25px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139,92,246,0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        <div style={{
          display: window.innerWidth > 768 ? 'flex' : 'none',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <button 
            onClick={() => setCurrentPage('products')} 
            style={{
              background: currentPage === 'products' ? 'rgba(139,92,246,0.2)' : 'none',
              border: 'none',
              color: currentPage === 'products' ? '#8b5cf6' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 'products') {
                e.currentTarget.style.background = 'rgba(139,92,246,0.1)';
                e.currentTarget.style.color = '#8b5cf6';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 'products') {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            Notes
          </button>
          
          {user?.isAdmin && (
            <button 
              onClick={() => setCurrentPage('admin')} 
              style={{
                background: currentPage === 'admin' ? 'rgba(139,92,246,0.2)' : 'none',
                border: 'none',
                color: currentPage === 'admin' ? '#8b5cf6' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 'admin') {
                  e.currentTarget.style.background = 'rgba(139,92,246,0.1)';
                  e.currentTarget.style.color = '#8b5cf6';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'admin') {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#94a3b8';
                }
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
                  background: currentPage === 'orders' ? 'rgba(139,92,246,0.2)' : 'none',
                  border: 'none',
                  color: currentPage === 'orders' ? '#8b5cf6' : '#94a3b8',
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
              <button 
                onClick={logout} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button 
              onClick={() => setCurrentPage('login')} 
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                transition: 'all 0.3s ease'
              }}
            >
              Login
            </button>
          )}
          
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              background: 'rgba(139,92,246,0.1)',
              border: '1.5px solid rgba(139,92,246,0.3)',
              borderRadius: '20px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#8b5cf6" />}
          </button>
          
          <button 
            onClick={() => setCurrentPage('cart')} 
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
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
              boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,92,246,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(139,92,246,0.4)';
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

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: window.innerWidth <= 768 ? 'flex' : 'none',
            background: 'rgba(139,92,246,0.1)',
            border: '1.5px solid rgba(139,92,246,0.3)',
            borderRadius: '10px',
            width: '40px',
            height: '40px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {mobileMenuOpen ? <X size={24} color="#fff" /> : <Menu size={24} color="#fff" />}
        </button>
      </div>
    </nav>
  );
}

// =====================================================
// MOBILE MENU
// =====================================================
function MobileMenu({ setCurrentPage, setMobileMenuOpen, user, logout }) {
  const handleClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      left: 0,
      right: 0,
      background: 'rgba(0, 0, 0, 0.98)',
      backdropFilter: 'blur(30px) saturate(180%)',
      padding: '1.5rem',
      zIndex: 999,
      borderBottom: '1px solid rgba(139,92,246,0.3)',
      animation: 'slideDown 0.3s ease'
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <button 
        onClick={() => handleClick('products')} 
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '1rem',
          background: 'rgba(139,92,246,0.1)',
          border: 'none',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          borderRadius: '12px',
          marginBottom: '0.75rem',
          transition: 'all 0.3s ease'
        }}
      >
        📚 Browse Notes
      </button>
      
      {user?.isAdmin && (
        <button 
          onClick={() => handleClick('admin')} 
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '1rem',
            background: 'rgba(139,92,246,0.1)',
            border: 'none',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            borderRadius: '12px',
            marginBottom: '0.75rem'
          }}
        >
          ⚙️ Admin Panel
        </button>
      )}
      
      {user ? (
        <>
          <button 
            onClick={() => handleClick('orders')} 
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '1rem',
              background: 'rgba(139,92,246,0.1)',
              border: 'none',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '12px',
              marginBottom: '0.75rem'
            }}
          >
            📦 My Orders
          </button>
          <button 
            onClick={handleLogout} 
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '1rem',
              background: 'rgba(239,68,68,0.1)',
              border: 'none',
              color: '#ef4444',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '12px'
            }}
          >
            🚪 Logout
          </button>
        </>
      ) : (
        <button 
          onClick={() => handleClick('login')} 
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '1rem',
            background: 'rgba(139,92,246,0.1)',
            border: 'none',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            borderRadius: '12px'
          }}
        >
          🔐 Login
        </button>
      )}
      
      <button 
        onClick={() => handleClick('cart')} 
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '1rem',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          border: 'none',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          borderRadius: '12px',
          marginTop: '0.75rem'
        }}
      >
        🛒 Cart
      </button>
    </div>
  );
}

// =====================================================
// HOME PAGE  
// =====================================================
function HomePage({ setCurrentPage }) {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  
  // Define phrases outside useEffect to avoid dependency issues
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
          background: 'linear-gradient(135deg, #1e40af, #8b5cf6, #ec4899)',
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
            borderRight: '4px solid #8b5cf6',
            animation: 'blink 0.7s infinite',
            marginLeft: '8px'
          }}>‎</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
          color: '#94a3b8',
          maxWidth: '800px',
          margin: '0 auto 3rem',
          lineHeight: 1.7,
          padding: '0 1rem',
          animation: 'fadeInUp 0.8s ease 0.2s backwards'
        }}>
          Master JKBOSE • Excel Python • Land Your Dream Job
        </p>

        {/* Trust Badges */}
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
            { icon: Zap, color: '#8b5cf6', text: 'Instant Access' },
            { icon: MessageCircle, color: '#f59e0b', text: '24/7 Support' }
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
            boxShadow: '0 20px 60px rgba(30, 64, 175, 0.5)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'fadeInUp 0.8s ease 0.6s backwards',
            minHeight: '56px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 70px rgba(30, 64, 175, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(30, 64, 175, 0.5)';
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
              gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)'
            }
          ].map((feature, i) => (
            <div key={i} style={{
              background: 'rgba(139,92,246,0.05)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1.5px solid rgba(139,92,246,0.2)',
              borderRadius: '24px',
              padding: 'clamp(2.5rem, 5vw, 3rem)',
              textAlign: 'center',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-12px) rotateX(5deg)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.8)';
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(139,92,246,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) rotateX(0)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                width: 'clamp(75px, 18vw, 90px)',
                height: 'clamp(75px, 18vw, 90px)',
                margin: '0 auto 1.75rem',
                background: 'rgba(139,92,246,0.15)',
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
                color: '#94a3b8',
                fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
                lineHeight: 1.6
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Professional Founder Section */}
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
          color: '#fff'
        }}>
          Meet the Founder
        </h2>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: 'clamp(2.5rem, 5vw, 3.5rem)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
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
            {/* Professional Photo with Real Image */}
            <div style={{
              margin: window.innerWidth > 768 ? '0' : '0 auto',
              position: 'relative'
            }}>
              <div style={{
                width: 'clamp(140px, 22vw, 180px)',
                height: 'clamp(140px, 22vw, 180px)',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid rgba(139, 92, 246, 0.4)',
                boxShadow: '0 12px 40px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))'
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
                    // Fallback to emoji if image fails to load
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
            
            {/* Professional Content - English */}
            <div style={{
              textAlign: window.innerWidth > 768 ? 'left' : 'center'
            }}>
              <h3 style={{
                fontSize: 'clamp(1.6rem, 3.5vw, 2rem)',
                fontWeight: '700',
                marginBottom: '0.75rem',
                color: '#fff',
                letterSpacing: '-0.02em'
              }}>
                Faizan Tariq
              </h3>
              
              <div style={{
                fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                color: '#8b5cf6',
                fontWeight: '600',
                marginBottom: '1.75rem',
                lineHeight: 1.4
              }}>
                Software Engineering Student<br/>
                ILS Srinagar Institute
              </div>
              
              <p style={{
                color: '#cbd5e1',
                fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                lineHeight: 1.8,
                marginBottom: '2rem',
                maxWidth: '550px',
                margin: window.innerWidth > 768 ? '0 0 2rem 0' : '0 auto 2rem'
              }}>
                Currently pursuing Software Engineering at ILS Srinagar Institute. My goal is to provide quality study materials and important filtered questions to help students excel in their academic journey.
              </p>
              
              {/* Instagram Link - Clean & Professional */}
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
                  boxShadow: '0 6px 20px rgba(240, 147, 251, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(240, 147, 251, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 147, 251, 0.4)';
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

// =====================================================
// PRODUCTS PAGE WITH BUY NOW
// =====================================================
function ProductsPage({ products, buyNow, selectedCategory, setSelectedCategory, searchQuery }) {
  const { addToCart } = useCart();
  const [hoveredCard, setHoveredCard] = useState(null);

  const customCategories = [...new Set(products.filter(p => p.customCategory).map(p => p.customCategory))];
  const allCategories = [...CATEGORIES, ...customCategories.map(name => ({ 
    id: name.toLowerCase(), 
    name, 
    icon: '📂', 
    color: '#6366f1' 
  }))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || 
      (p.customCategory || p.category)?.toLowerCase() === selectedCategory?.toLowerCase();
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{
      paddingTop: '100px',
      minHeight: '100vh',
      padding: '100px 1.5rem 5rem'
    }}>
      <h1 style={{
        fontSize: 'clamp(2.5rem, 6vw, 4rem)',
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: '3rem',
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'fadeInUp 0.6s ease'
      }}>
        Browse Study Notes
      </h1>
      
      {/* Category Pills */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 3rem',
        overflowX: 'auto',
        padding: '1rem 0'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          minWidth: 'min-content'
        }}>
          {allCategories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                background: selectedCategory === cat.id 
                  ? `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` 
                  : 'rgba(139,92,246,0.1)',
                border: selectedCategory === cat.id 
                  ? 'none' 
                  : '2px solid rgba(139,92,246,0.3)',
                color: '#fff',
                padding: '0.85rem 1.75rem',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: selectedCategory === cat.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedCategory === cat.id 
                  ? `0 10px 30px ${cat.color}50` 
                  : 'none',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat.id) {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139,92,246,0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat.id) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '5rem 2rem',
          animation: 'fadeInUp 0.6s ease'
        }}>
          <div style={{
            fontSize: '5rem',
            marginBottom: '1.5rem',
            opacity: 0.3
          }}>📚</div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '900',
            marginBottom: '1rem',
            color: '#94a3b8'
          }}>
            {searchQuery ? 'No results found' : 'No notes in this category yet'}
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '1.1rem'
          }}>
            {searchQuery ? 'Try different keywords' : 'Check back soon or browse other categories!'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {filteredProducts.map((product, index) => (
            <div 
              key={product.id} 
              style={{
                background: 'rgba(139,92,246,0.05)',
                backdropFilter: 'blur(20px) saturate(180%)',
                border: '1.5px solid rgba(139,92,246,0.2)',
                borderRadius: '24px',
                padding: '1.5rem',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === index ? 'translateY(-15px) rotateX(5deg)' : 'translateY(0)',
                boxShadow: hoveredCard === index 
                  ? '0 25px 60px rgba(139,92,246,0.35)' 
                  : 'none',
                animation: `fadeInUp 0.6s ease ${index * 0.1}s backwards`
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Thumbnail */}
              <div style={{
                background: product.thumbnail 
                  ? `url(${product.thumbnail})` 
                  : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '200px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
                fontSize: product.thumbnail ? '0' : '5rem',
                transition: 'transform 0.3s ease'
              }}>
                {!product.thumbnail && (product.image || '📚')}
                
                {/* Overlay on hover */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(5px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: hoveredCard === index ? 1 : 0,
                  transition: 'opacity 0.3s ease'
                }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Star size={20} fill="#fbbf24" color="#fbbf24" />
                    {product.rating || '4.5'} Rating
                  </div>
                </div>
              </div>
              
              {/* Product Info */}
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                marginBottom: '0.75rem',
                color: '#fff',
                minHeight: '3rem',
                lineHeight: 1.3
              }}>
                {product.title}
              </h3>
              
              <p style={{
                color: '#94a3b8',
                fontSize: '0.95rem',
                marginBottom: '1rem',
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {product.description}
              </p>
              
              {/* Price & Rating */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}>
                <span style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ₹{product.price}
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(251,191,36,0.15)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(251,191,36,0.3)'
                }}>
                  <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  <span style={{
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: '#fbbf24'
                  }}>
                    {product.rating || '4.5'}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <button 
                  onClick={() => addToCart(product)} 
                  style={{
                    width: '100%',
                    background: 'rgba(139,92,246,0.15)',
                    border: '2px solid rgba(139,92,246,0.4)',
                    color: '#8b5cf6',
                    padding: '1rem',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139,92,246,0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139,92,246,0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
                
                <button 
                  onClick={() => buyNow(product)} 
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#fff',
                    padding: '1rem',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(16,185,129,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.4)';
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Zap size={20} />
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// CART PAGE
// =====================================================
function CartPage({ setCurrentPage, completeOrder }) {
  const { cart, removeFromCart, cartTotal } = useCart();

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
            color="#475569" 
            style={{
              margin: '0 auto 2rem',
              opacity: 0.3
            }} 
          />
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            marginBottom: '1rem'
          }}>
            Your cart is empty
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '1.2rem',
            marginBottom: '3rem'
          }}>
            Start shopping now!
          </p>
          <button 
            onClick={() => setCurrentPage('products')} 
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
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
              boxShadow: '0 10px 30px rgba(139,92,246,0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(139,92,246,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(139,92,246,0.4)';
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
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Shopping Cart
        </h1>
        
        <div style={{
          background: 'rgba(139,92,246,0.05)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1.5px solid rgba(139,92,246,0.2)',
          borderRadius: '24px',
          padding: '2.5rem',
          marginBottom: '2rem'
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
                  ? '1px solid rgba(139,92,246,0.2)' 
                  : 'none',
                flexWrap: 'wrap'
              }}
            >
              <div style={{
                background: item.thumbnail 
                  ? `url(${item.thumbnail})` 
                  : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
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
                  color: '#fff',
                  marginBottom: '0.5rem'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: '#8b5cf6',
                  fontWeight: '700',
                  fontSize: '1.1rem'
                }}>
                  ₹{item.price}
                </p>
              </div>
              
              <div style={{
                fontSize: '1.8rem',
                fontWeight: '900',
                color: '#fff'
              }}>
                ₹{item.price * item.quantity}
              </div>
              
              <button 
                onClick={() => removeFromCart(item.id)} 
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '2px solid rgba(239,68,68,0.3)',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Trash2 size={24} color="#ef4444" />
              </button>
            </div>
          ))}
        </div>
        
        <div style={{
          background: 'rgba(139,92,246,0.05)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1.5px solid rgba(139,92,246,0.2)',
          borderRadius: '24px',
          padding: '3rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '2rem',
            fontWeight: '900',
            marginBottom: '2.5rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(139,92,246,0.2)',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <span style={{ color: '#94a3b8' }}>Total:</span>
            <span style={{
              fontSize: '3.5rem',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ₹{cartTotal}
            </span>
          </div>
          <button 
            onClick={completeOrder} 
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              border: 'none',
              color: 'white',
              padding: '1.5rem',
              fontSize: '1.5rem',
              borderRadius: '16px',
              cursor: 'pointer',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              boxShadow: '0 10px 40px rgba(139,92,246,0.5)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 15px 50px rgba(139,92,246,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(139,92,246,0.5)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Zap size={28} />
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// ORDERS PAGE
// =====================================================
function OrdersPage({ orders }) {
  if (orders.length === 0) {
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
          <Download 
            size={120} 
            color="#475569" 
            style={{
              margin: '0 auto 2rem',
              opacity: 0.3
            }} 
          />
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            marginBottom: '1rem'
          }}>
            No orders yet
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '1.2rem'
          }}>
            Start shopping to see your orders here!
          </p>
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
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          My Orders
        </h1>
        
        {orders.map((order, index) => (
          <div 
            key={order.id} 
            style={{
              background: 'rgba(139,92,246,0.05)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1.5px solid rgba(139,92,246,0.2)',
              borderRadius: '24px',
              padding: '2.5rem',
              marginBottom: '2rem',
              animation: `fadeInUp 0.6s ease ${index * 0.1}s backwards`
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '900'
                }}>
                  Order #{order.id?.substring(0, 8)}
                </h3>
                <p style={{
                  color: '#94a3b8',
                  marginTop: '0.5rem'
                }}>
                  {order.date}
                </p>
              </div>
              <span style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                padding: '0.75rem 1.5rem',
                borderRadius: '50px',
                fontSize: '0.95rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                height: 'fit-content'
              }}>
                <CheckCircle size={18} />
                {order.status}
              </span>
            </div>
            
            <div style={{
              borderTop: '1px solid rgba(139,92,246,0.2)',
              paddingTop: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Total: ₹{order.total}
              </span>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                {order.items.map(item => (
                  <a 
                    key={item.id} 
                    href={item.pdfUrl} 
                    download={item.pdfFileName || `${item.title}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                    onClick={() => showToast(`📥 Downloading ${item.title}...`, 'info')}
                  >
                    <button style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: 'white',
                      padding: '1rem 2rem',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(16,185,129,0.4)',
                      fontSize: '1rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.4)';
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Download size={20} /> 
                      Download PDF
                    </button>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// ADMIN PANEL WITH THUMBNAIL UPLOAD
// =====================================================
function AdminPanel({ products, addProduct, deleteProduct, orders }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    pages: '',
    rating: '4.5',
    fileSize: '',
    language: 'English',
    image: '📚',
    customCategory: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      showToast('PDF selected: ' + file.name, 'success');
    } else {
      showToast('Please select a PDF file only!', 'error');
    }
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
      showToast('Thumbnail selected!', 'success');
    } else {
      showToast('Please select an image file!', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pdfFile) {
      showToast('⚠️ Please upload PDF file!', 'error');
      return;
    }

    if (!formData.category && !formData.customCategory) {
      showToast('⚠️ Please select a category!', 'error');
      return;
    }

    setUploading(true);
    showToast('⏳ Uploading... Please wait!', 'info');

    try {
      let pdfUrl = '';
      let thumbnailUrl = '';

      // Upload PDF using uploadPDF from dbService
      if (typeof uploadPDF === 'function') {
        const pdfResult = await uploadPDF(pdfFile);
        if (pdfResult.success) {
          pdfUrl = pdfResult.url;
        }
      } else {
        // Fallback: create object URL
        pdfUrl = URL.createObjectURL(pdfFile);
      }

      // Upload Thumbnail (you may need to add uploadImage to dbService)
      if (thumbnailFile) {
        // For now using object URL, you can implement uploadImage in dbService
        thumbnailUrl = URL.createObjectURL(thumbnailFile);
      }

      // FIXED: Remove undefined fields
      const productData = {
        title: formData.title,
        category: formData.category === 'custom' ? formData.customCategory : formData.category,
        price: parseInt(formData.price),
        description: formData.description,
        pages: parseInt(formData.pages),
        rating: parseFloat(formData.rating),
        fileSize: formData.fileSize,
        language: formData.language,
        image: formData.image,
        pdfUrl: pdfUrl,
        pdfFileName: pdfFile.name,
        thumbnail: thumbnailUrl || null,
        thumbnailFileName: thumbnailFile?.name || null
      };

      // Only add customCategory if it exists
      if (formData.category === 'custom' && formData.customCategory) {
        productData.customCategory = formData.customCategory;
      }

      await addProduct(productData);
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        price: '',
        description: '',
        pages: '',
        rating: '4.5',
        fileSize: '',
        language: 'English',
        image: '📚',
        customCategory: ''
      });
      setPdfFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setShowUploadForm(false);
      
    } catch (error) {
      showToast('❌ Upload failed: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      paddingTop: '120px',
      paddingBottom: '5rem',
      minHeight: '100vh',
      padding: '120px 1.5rem 5rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '3rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              Admin Dashboard
            </h1>
            <p style={{
              color: '#94a3b8',
              fontSize: '1.1rem'
            }}>
              Upload & manage study materials
            </p>
          </div>
          
          <button 
            onClick={() => setShowUploadForm(!showUploadForm)} 
            style={{
              background: showUploadForm 
                ? 'rgba(239,68,68,0.2)' 
                : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              border: showUploadForm ? '2px solid #ef4444' : 'none',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 25px rgba(139,92,246,0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(139,92,246,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(139,92,246,0.4)';
            }}
          >
            {showUploadForm ? <X size={20} /> : <Plus size={20} />}
            {showUploadForm ? 'Cancel' : 'Upload New PDF'}
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {[
            {
              icon: Package,
              value: products.length,
              label: 'Total Products',
              color: '#8b5cf6'
            },
            {
              icon: ShoppingCart,
              value: orders.length,
              label: 'Total Orders',
              color: '#ec4899'
            },
            {
              icon: Users,
              value: products.reduce((sum, p) => sum + (p.totalDownloads || 0), 0),
              label: 'Downloads',
              color: '#3b82f6'
            },
            {
              icon: BarChart,
              value: `₹${orders.reduce((sum, o) => sum + o.total, 0)}`,
              label: 'Revenue',
              color: '#10b981'
            }
          ].map((stat, i) => (
            <div 
              key={i} 
              style={{
                background: 'rgba(139,92,246,0.05)',
                backdropFilter: 'blur(20px) saturate(180%)',
                border: '1.5px solid rgba(139,92,246,0.2)',
                borderRadius: '20px',
                padding: '2rem',
                transition: 'all 0.3s ease',
                animation: `fadeInUp 0.6s ease ${i * 0.1}s backwards`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = `0 15px 40px ${stat.color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <stat.icon size={32} color={stat.color} style={{ marginBottom: '1rem' }} />
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                background: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                {stat.value}
              </div>
              <div style={{
                color: '#94a3b8',
                fontWeight: '600'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div style={{
            background: 'rgba(139,92,246,0.05)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1.5px solid rgba(139,92,246,0.2)',
            borderRadius: '24px',
            padding: '3rem',
            marginBottom: '3rem',
            animation: 'fadeInUp 0.5s ease'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '900',
              marginBottom: '2rem',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📤 Upload New Product
            </h2>
            
            <form onSubmit={handleSubmit} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              
              <input 
                type="text" 
                placeholder="Product Title *" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
                style={{
                  padding: '1rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
              />
              
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value, customCategory: ''})} 
                required 
                style={{
                  padding: '1rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              >
                <option value="" style={{ background: '#1a1a1a' }}>-- Select Category --</option>
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id} style={{ background: '#1a1a1a', color: '#fff' }}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
                <option value="custom" style={{ background: '#1a1a1a', color: '#10b981' }}>
                  ➕ Create Custom Category
                </option>
              </select>

              {formData.category === 'custom' && (
                <input 
                  type="text" 
                  placeholder="Enter Custom Category (e.g., Psychology)" 
                  value={formData.customCategory} 
                  onChange={(e) => setFormData({...formData, customCategory: e.target.value})} 
                  required
                  style={{
                    padding: '1rem',
                    background: 'rgba(16,185,129,0.1)',
                    border: '2px solid rgba(16,185,129,0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '1rem',
                    gridColumn: '1 / -1'
                  }}
                />
              )}
              
              <input 
                type="number" 
                placeholder="Price (₹) *" 
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                required 
                min="1" 
                style={{
                  padding: '1rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
              
              <input 
                type="text" 
                placeholder="Description *" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                required 
                style={{
                  padding: '1rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
              
              <input 
                type="number" 
                placeholder="Total Pages *" 
                value={formData.pages} 
                onChange={(e) => setFormData({...formData, pages: e.target.value})} 
                required 
                min="1" 
                style={{
                  padding: '1rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
              
              <input 
                type="text" 
                placeholder="File Size (e.g., 5 MB) *" 
                value={formData.fileSize} 
                onChange={(e) => setFormData({...formData, fileSize: e.target.value})} 
                required 
                style={{
                  padding: '1rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
              
              <select 
                value={formData.language} 
                onChange={(e) => setFormData({...formData, language: e.target.value})} 
                style={{
                  padding: '1rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              >
                <option value="English" style={{ background: '#1a1a1a' }}>English</option>
                <option value="Hindi" style={{ background: '#1a1a1a' }}>Hindi</option>
                <option value="Hindi & English" style={{ background: '#1a1a1a' }}>Hindi & English</option>
              </select>

              {/* Thumbnail Upload */}
              <div style={{
                gridColumn: '1 / -1',
                background: 'rgba(139,92,246,0.1)',
                border: '2px dashed rgba(139,92,246,0.3)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleThumbnailUpload} 
                  style={{ display: 'none' }} 
                  id="thumbnail-upload" 
                />
                <label 
                  htmlFor="thumbnail-upload" 
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  {thumbnailPreview ? (
                    <div style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '3px solid #8b5cf6'
                    }}>
                      <img 
                        src={thumbnailPreview} 
                        alt="Thumbnail Preview" 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ) : (
                    <ImageIcon size={48} color="#8b5cf6" />
                  )}
                  <div>
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: thumbnailFile ? '#10b981' : '#fff'
                    }}>
                      {thumbnailFile ? '✅ ' + thumbnailFile.name : '🖼️ Click to upload Thumbnail (Optional)'}
                    </p>
                    <p style={{
                      color: '#94a3b8',
                      fontSize: '0.9rem',
                      marginTop: '0.5rem'
                    }}>
                      PNG, JPG, JPEG - Recommended: 400x300px
                    </p>
                  </div>
                </label>
              </div>
              
              {/* PDF Upload */}
              <div style={{
                gridColumn: '1 / -1',
                background: 'rgba(139,92,246,0.1)',
                border: '2px dashed rgba(139,92,246,0.3)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handlePdfUpload} 
                  required 
                  style={{ display: 'none' }} 
                  id="pdf-upload" 
                />
                <label 
                  htmlFor="pdf-upload" 
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <Upload size={48} color="#8b5cf6" />
                  {pdfFile ? (
                    <p style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#10b981'
                    }}>
                      ✅ {pdfFile.name}
                    </p>
                  ) : (
                    <>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: '700'
                      }}>
                        📄 Click to upload PDF *
                      </p>
                      <p style={{
                        color: '#94a3b8',
                        fontSize: '0.9rem'
                      }}>
                        Required - Downloadable file
                      </p>
                    </>
                  )}
                </label>
              </div>
              
              <button 
                type="submit" 
                disabled={uploading}
                style={{
                  gridColumn: '1 / -1',
                  background: uploading 
                    ? 'rgba(139,92,246,0.5)' 
                    : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  border: 'none',
                  color: 'white',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
              >
                {uploading ? (
                  <>
                    <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Product
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Products List */}
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '900',
          marginBottom: '2rem'
        }}>
          📚 Uploaded Products ({products.length})
        </h2>
        
        {products.length === 0 ? (
          <div style={{
            background: 'rgba(139,92,246,0.05)',
            border: '1.5px solid rgba(139,92,246,0.2)',
            borderRadius: '24px',
            padding: '4rem',
            textAlign: 'center'
          }}>
            <FileText size={80} color="#475569" style={{ margin: '0 auto 1.5rem', opacity: 0.3 }} />
            <p style={{
              fontSize: '1.3rem',
              color: '#94a3b8'
            }}>
              No products uploaded yet. Click "Upload New PDF" to start!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1.5rem'
          }}>
            {products.map((product, index) => (
              <div 
                key={product.id} 
                style={{
                  background: 'rgba(139,92,246,0.05)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1.5px solid rgba(139,92,246,0.2)',
                  borderRadius: '20px',
                  padding: '2rem',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '2rem',
                  alignItems: 'center',
                  animation: `fadeInUp 0.6s ease ${index * 0.05}s backwards`
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  background: product.thumbnail 
                    ? `url(${product.thumbnail})` 
                    : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: product.thumbnail ? '0' : '2.5rem'
                }}>
                  {!product.thumbnail && (product.image || '📚')}
                </div>
                
                <div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    marginBottom: '0.5rem'
                  }}>
                    {product.title}
                  </h3>
                  <p style={{
                    color: '#94a3b8',
                    marginBottom: '0.5rem'
                  }}>
                    {product.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '2rem',
                    flexWrap: 'wrap',
                    fontSize: '0.95rem'
                  }}>
                    <span style={{ color: '#8b5cf6', fontWeight: '700' }}>₹{product.price}</span>
                    <span style={{ color: '#94a3b8' }}>{product.pages} pages</span>
                    <span style={{ color: '#94a3b8' }}>{product.fileSize}</span>
                    <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>
                      {CATEGORIES.find(c => c.id === product.category)?.name || product.category}
                    </span>
                    {product.pdfFileName && (
                      <span style={{ color: '#10b981', fontWeight: '600' }}>
                        📄 {product.pdfFileName}
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (window.confirm('Delete this product?')) deleteProduct(product.id);
                  }} 
                  style={{
                    background: 'rgba(239,68,68,0.15)',
                    border: '2px solid rgba(239,68,68,0.3)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Trash2 size={20} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// =====================================================
// LOGIN PAGE
// =====================================================
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isRegistering) {
      await register(email, password, name);
    } else {
      await login(email, password);
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    
    if (result.success) {
      showToast('Password reset link sent! 📧', 'success');
      setShowForgotPassword(false);
    } else {
      showToast('Error: ' + result.error, 'error');
    }
    setLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div style={{
        paddingTop: '120px',
        paddingBottom: '5rem',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 1.5rem 5rem'
      }}>
        <div style={{ maxWidth: '500px', width: '100%' }}>
          <div style={{
            background: 'rgba(139,92,246,0.05)',
            backdropFilter: 'blur(30px) saturate(180%)',
            border: '1.5px solid rgba(139,92,246,0.2)',
            borderRadius: '32px',
            padding: '3rem'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Reset Password
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#94a3b8',
              marginBottom: '2rem',
              fontSize: '1rem'
            }}>
              Enter your email to receive a reset link
            </p>
            
            <form onSubmit={handleForgotPassword} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading 
                    ? 'rgba(139,92,246,0.5)' 
                    : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  border: 'none',
                  color: 'white',
                  padding: '1.25rem',
                  fontSize: '1.2rem',
                  borderRadius: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '700'
                }}
              >
                {loading ? '⏳ Sending...' : 'Send Reset Link'}
              </button>
              <button 
                type="button"
                onClick={() => setShowForgotPassword(false)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: '2px solid rgba(139,92,246,0.3)',
                  color: '#8b5cf6',
                  padding: '1rem',
                  fontSize: '1rem',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      paddingTop: '120px',
      paddingBottom: '5rem',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 1.5rem 5rem'
    }}>
      <div style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{
          background: 'rgba(139,92,246,0.05)',
          backdropFilter: 'blur(30px) saturate(180%)',
          border: '1.5px solid rgba(139,92,246,0.2)',
          borderRadius: '32px',
          padding: '3rem',
          animation: 'fadeInUp 0.6s ease'
        }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '900',
            textAlign: 'center',
            marginBottom: '2.5rem',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {isRegistering ? 'Create Account' : 'Welcome Back!'}
          </h2>
          
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {isRegistering && (
              <input 
                type="text" 
                placeholder="Full Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  outline: 'none'
                }}
              />
            )}
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{
                width: '100%',
                padding: '1.25rem',
                background: 'rgba(139,92,246,0.1)',
                border: '2px solid rgba(139,92,246,0.3)',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '1.1rem',
                outline: 'none'
              }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength={6}
              style={{
                width: '100%',
                padding: '1.25rem',
                background: 'rgba(139,92,246,0.1)',
                border: '2px solid rgba(139,92,246,0.3)',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '1.1rem',
                outline: 'none'
              }}
            />

            {!isRegistering && (
              <div style={{ textAlign: 'right' }}>
                <button 
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    textDecoration: 'underline'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                background: loading 
                  ? 'rgba(139,92,246,0.5)' 
                  : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                border: 'none',
                color: 'white',
                padding: '1.25rem',
                fontSize: '1.2rem',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(139,92,246,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? '⏳ Processing...' : (isRegistering ? 'Create Account' : 'Login')}
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b5cf6',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                textDecoration: 'underline'
              }}
            >
              {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
          </div>
          
          {!isRegistering && (
            <div style={{
              marginTop: '2.5rem',
              padding: '1.5rem',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: '16px'
            }}>
              <p style={{
                fontWeight: '700',
                marginBottom: '1rem',
                fontSize: '1.1rem'
              }}>
                Admin Access:
              </p>
              <p style={{
                fontSize: '0.95rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                📧 Email: admin@faiz.com
              </p>
              <p style={{
                fontSize: '0.95rem',
                color: '#94a3b8'
              }}>
                🔐 Password: admin123
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// FOOTER
// =====================================================
function Footer({ setCurrentPage }) {
  return (
    <footer style={{
      background: 'rgba(0,0,0,0.98)',
      borderTop: '2px solid rgba(139,92,246,0.3)',
      padding: '4rem 2rem 2rem',
      position: 'relative',
      zIndex: 1,
      boxShadow: '0 -10px 40px rgba(139,92,246,0.2)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '3rem'
      }}>
        <div>
          <h3 style={{
            fontSize: '2rem',
            fontWeight: '900',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #1e40af, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            FaizUpyZone
          </h3>
          <p style={{
            color: '#94a3b8',
            marginBottom: '1.5rem',
            lineHeight: 1.7
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
              color: '#8b5cf6',
              fontWeight: '600',
              fontSize: '1.1rem',
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <Instagram size={24} /> @code_with_06
          </a>
        </div>
        
        <div>
          <h4 style={{
            fontWeight: '800',
            marginBottom: '1.5rem',
            fontSize: '1.2rem'
          }}>
            Quick Links
          </h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {['products', 'home'].map((page) => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '1rem',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#8b5cf6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
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
            fontSize: '1.2rem'
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
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '1rem',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              WhatsApp Support
            </a>
            <a 
              href="mailto:luckyfaizu3@gmail.com" 
              style={{
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '1rem',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#8b5cf6'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              Email Us
            </a>
          </div>
        </div>
        
        <div>
          <h4 style={{
            fontWeight: '800',
            marginBottom: '1.5rem',
            fontSize: '1.2rem'
          }}>
            Secure Payment
          </h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#10b981',
            fontSize: '1rem',
            fontWeight: '700',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Shield size={20} />
            Razorpay Protected
          </div>
        </div>
      </div>
      
      <div style={{
        borderTop: '1px solid rgba(139,92,246,0.2)',
        marginTop: '4rem',
        paddingTop: '2.5rem',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '1rem'
      }}>
        <p>&copy; 2026 FaizUpyZone. All rights reserved. Made with 💜 by @code_with_06</p>
      </div>
    </footer>
  );
}

export default App;