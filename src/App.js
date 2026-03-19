import React, { useState, useEffect, useCallback } from 'react';
import ReactGA from 'react-ga4';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { registerUser, loginUser, logoutUser, isAdmin as isAdminAuth, resetPassword } from './authService';
import { 
  addProduct as addProductDB, 
  getAllProducts, 
  deleteProduct as deleteProductDB, 
  getUserOrders,
  updateProduct as updateProductDB,
  addOrder
} from './dbService';

// ✅ Import Analytics Tracker
import { trackPageView, trackAction, ACTIONS } from './Analytics/AnalyticsTracker';

// Import Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Background from './components/Background';
import AIChatBot from './components/AIChatBot';
import ToastContainer from './components/ToastContainer';
import SplashScreen from './components/SplashScreen';
import Leaderboard from './components/Leaderboard';

// Import Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import MockTestPage from './pages/MockTestPage';
import AIChatPage from './pages/AIChatPage';
import PythonCompiler from './pages/PythonCompiler';

// ✅ Streak Challenge Imports
import StreakChallengePage from './pages/StreakChallengePage';
import DailyPractice from './pages/DailyPractice';
import StreakResult from './pages/StreakResult';
import AdminStreak from './pages/AdminStreak';

// ✅ Blog Post Import
import BlogPostMockTest from './pages/BlogPostMockTest';

// ✅ Streak price service
import { getStreakPrice } from './streakService';

// ✅ Geo Price Service
import { detectGeoPrice } from './services/geoPrice';

// Contexts
export const CartContext = React.createContext();
export const AuthContext = React.createContext();
export const ThemeContext = React.createContext();
export const GeoContext = React.createContext();

export const useCart = () => React.useContext(CartContext);
export const useAuth = () => React.useContext(AuthContext);
export const useTheme = () => React.useContext(ThemeContext);
export const useGeo = () => React.useContext(GeoContext);

export const RAZORPAY_KEY_ID = "rzp_live_SAvdBqaaBDr2qS";

export const CATEGORIES = [
  { id: 'all',       name: 'All Notes',         icon: '📚', color: '#6366f1' },
  { id: 'python',    name: 'Python Notes',       icon: '🐍', color: '#3776ab' },
  { id: 'jkbose',   name: 'JKBOSE Materials',   icon: '🎓', color: '#ec4899' },
  { id: 'job',       name: 'Job Preparation',    icon: '💼', color: '#10b981' },
  { id: 'web',       name: 'Web Development',    icon: '🌐', color: '#3b82f6' },
  { id: 'hacking',   name: 'Ethical Hacking',    icon: '🔐', color: '#ef4444' },
  { id: 'data',      name: 'Data Science',       icon: '📊', color: '#f59e0b' },
  { id: 'ai',        name: 'AI & ML',            icon: '🤖', color: '#8b5cf6' },
  { id: 'marketing', name: 'Digital Marketing',  icon: '📱', color: '#06b6d4' },
];

const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

function App() {
  useEffect(() => {
    ReactGA.initialize('G-4677K2HY57');
    ReactGA.send('pageview');
  }, []);

  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('pyskill_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [user,              setUser]              = useState(null);
  const [currentPage,       setCurrentPage]       = useState('home');
  const [products,          setProducts]          = useState([]);
  const [orders,            setOrders]            = useState([]);
  const [searchQuery,       setSearchQuery]       = useState('');
  const [mobileMenuOpen,    setMobileMenuOpen]    = useState(false);
  const [selectedCategory,  setSelectedCategory]  = useState('all');
  const [razorpayLoaded,    setRazorpayLoaded]    = useState(false);
  const [razorpayError,     setRazorpayError]     = useState(false);
  const [compilerInitialCode, setCompilerInitialCode] = useState('');
  const [streakPrice,       setStreakPrice]       = useState(99);

  // ✅ Geo State
  const [geoData,       setGeoData]       = useState(null);
  const [showGeoBanner, setShowGeoBanner] = useState(true);

  // ✅ Detect IP on first visit
  useEffect(() => {
    detectGeoPrice().then(data => {
      setGeoData(data);
      console.log(`🌍 User from: ${data.flag} ${data.countryName} — ${data.symbol}${data.basic}`);
    });
  }, []);

  // ✅ Browser back button fix
  useEffect(() => {
    const getInitialPage = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return 'home';
      if (hash.startsWith('products/')) return 'products';
      const validPages = [
        'home', 'products', 'cart', 'orders', 'admin', 'login',
        'mocktests', 'leaderboard', 'aichat', 'compiler',
        'streak', 'streak-practice', 'streak-result', 'admin-streak',
        'blog-mock-test',
      ];
      return validPages.includes(hash) ? hash : 'home';
    };

    const initialPage = getInitialPage();
    setCurrentPage(initialPage);
    window.history.replaceState({ page: initialPage }, '', `#${initialPage}`);

    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.page !== 'products') setSelectedCategory('all');
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('products/')) return;
    if (currentPage !== window.history.state?.page) {
      window.history.pushState({ page: currentPage }, '', `#${currentPage}`);
    }
    trackPageView(`/${currentPage}`);
  }, [currentPage]);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('pyskill_theme');
    return saved === 'dark';
  });

  const [backgroundTheme, setBackgroundTheme] = useState(() => {
    const saved = localStorage.getItem('pyskill_background');
    return saved ? parseInt(saved) : 0;
  });

  const [showSplash, setShowSplash] = useState(() => {
    const splashShown = sessionStorage.getItem('splashShown');
    return !splashShown;
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('pyskill_theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  const toggleBackground = () => {
    setBackgroundTheme(prev => {
      const next = (prev + 1) % 12;
      localStorage.setItem('pyskill_background', next.toString());
      return next;
    });
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  useEffect(() => {
    localStorage.setItem('pyskill_cart', JSON.stringify(cart));
  }, [cart]);

  // ✅ Razorpay loader
  useEffect(() => {
    if (window.Razorpay) { setRazorpayLoaded(true); return; }
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.Razorpay) { setRazorpayLoaded(true); clearInterval(checkLoaded); }
      }, 100);
      setTimeout(() => { clearInterval(checkLoaded); if (!window.Razorpay) setRazorpayError(true); }, 10000);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => { setRazorpayLoaded(true); setRazorpayError(false); };
    script.onerror = () => { setRazorpayError(true); window.showToast?.('Payment system failed to load. Please refresh!', 'error'); };
    document.body.appendChild(script);
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const result = await getAllProducts();
      if (result.success) setProducts(result.products);
    } catch (error) {
      console.error('Error loading products:', error);
      window.showToast?.('Failed to load products', 'error');
    }
  }, []);

  useEffect(() => {
    loadProducts();
    getStreakPrice().then(p => { if (p) setStreakPrice(p); });
  }, [loadProducts]);

  const loadOrders = useCallback(async () => {
    if (user?.uid) {
      try {
        const result = await getUserOrders(user.uid);
        if (result.success) setOrders(result.orders);
        else setOrders([]);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      }
    } else {
      setOrders([]);
    }
  }, [user?.uid]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ✅ Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email:       firebaseUser.email,
          displayName: firebaseUser.displayName,
          uid:         firebaseUser.uid,
          isAdmin:     isAdminAuth(firebaseUser.email),
        });
        // Admin gets free streak access automatically
        if (firebaseUser.email === ADMIN_EMAIL) {
          localStorage.setItem(`streak_purchased_${firebaseUser.uid}`, 'true');
          if (!localStorage.getItem(`streak_start_${firebaseUser.uid}`)) {
            localStorage.setItem(`streak_start_${firebaseUser.uid}`, new Date().toISOString());
            localStorage.setItem(`streak_count_${firebaseUser.uid}`, '0');
          }
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Razorpay payment
  const initiatePayment = (amount, items, onSuccess) => {
    if (razorpayError) { window.showToast?.('Payment system failed to load. Please refresh!', 'error'); return; }
    if (!window.Razorpay || !razorpayLoaded) {
      window.showToast?.('Payment system loading... Please wait!', 'warning');
      setTimeout(() => {
        if (window.Razorpay && razorpayLoaded) { setTimeout(() => initiatePayment(amount, items, onSuccess), 500); }
        else { window.showToast?.('Payment system not ready. Please refresh!', 'error'); }
      }, 2000);
      return;
    }
    const options = {
      key:      RAZORPAY_KEY_ID,
      amount:   amount * 100,
      currency: 'INR',
      name:     'PySkill',
      description: items.length === 0
        ? `Brain Trap Game — ₹${amount}/month Unlimited Access`
        : items.length === 1
          ? items[0].title || 'Premium Study Material'
          : `${items.length} Study Materials Bundle`,
      image: 'https://img.icons8.com/fluency/96/000000/graduation-cap.png',
      handler: async function (response) {
        window.showToast?.('Payment Successful! Processing...', 'success');
        setTimeout(async () => { await onSuccess(response); }, 1000);
      },
      prefill: {
        name:    user?.displayName || user?.email?.split('@')[0] || 'Student',
        email:   user?.email || '',
        contact: '',
      },
      theme: { color: isDark ? '#8b5cf6' : '#6366f1' },
      modal: { ondismiss: function () { window.showToast?.('Payment cancelled', 'info'); } },
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () { window.showToast?.('Payment Failed! Please try again.', 'error'); });
      rzp.open();
    } catch (error) {
      console.error('Error opening Razorpay:', error);
      window.showToast?.('Failed to open payment. Please refresh!', 'error');
    }
  };

  // ✅ PayPal for foreign users
  const initiatePayPal = (geo, level = 'basic', onSuccess) => {
    const price    = geo[level] || geo.price;
    const currency = geo.currency;
    const paypalUrl = `https://www.paypal.com/paypalme/pyskill/${price}${currency}`;
    window.open(paypalUrl, '_blank');
    window.showToast?.(`PayPal opened — ${geo.symbol}${price} ${currency}`, 'info');
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      window.showToast?.('Quantity updated!', 'success');
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
      window.showToast?.('Added to cart!', 'success');
    }
    trackAction(ACTIONS.ADD_TO_CART, { productId: product.id, productName: product.title, price: product.price, category: product.category });
  };

  const removeFromCart = (productId) => {
    const product = cart.find(item => item.id === productId);
    setCart(cart.filter(item => item.id !== productId));
    window.showToast?.('Removed from cart', 'info');
    if (product) trackAction(ACTIONS.REMOVE_FROM_CART, { productId: product.id, productName: product.title });
  };

  const buyNow = async (product) => {
    if (!user) { window.showToast?.('Please login first to purchase!', 'warning'); setCurrentPage('login'); return; }
    trackAction(ACTIONS.PURCHASE_INITIATED, { productId: product.id, productName: product.title, price: product.price, isBundle: product.isBundle || false });
    const itemData = { id: product.id, title: product.title, price: product.price, isBundle: product.isBundle || false, pdfFiles: product.pdfFiles || [], bundledProducts: product.bundledProducts || [] };
    if (product.thumbnail) itemData.thumbnail = product.thumbnail;
    initiatePayment(product.price, [product], async (response) => {
      try {
        const orderResult = await addOrder({
          userEmail: user.email, userId: user.uid, items: [itemData],
          total: product.price,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          paymentId: response.razorpay_payment_id, status: 'completed',
        }, user.uid);
        if (!orderResult.success) { window.showToast?.('Payment successful but order not saved! Contact admin with payment ID: ' + response.razorpay_payment_id, 'error'); return; }
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadOrders();
        await new Promise(resolve => setTimeout(resolve, 500));
        setCurrentPage('orders');
        window.showToast?.('Payment successful! Download your PDFs now!', 'success');
      } catch (error) {
        console.error('Payment handler error:', error);
        window.showToast?.('Payment successful but error occurred. Check orders or contact admin!', 'warning');
        await loadOrders();
        setCurrentPage('orders');
      }
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const login = async (email, password) => {
    const result = await loginUser(email, password);
    if (result.success) { window.showToast?.('Welcome back!', 'success'); setCurrentPage('home'); trackAction(ACTIONS.LOGIN, { email }); return { success: true }; }
    else { window.showToast?.(result.error, 'error'); return { success: false }; }
  };

  const register = async (email, password, name) => {
    const result = await registerUser(email, password, name);
    if (result.success) { window.showToast?.('Account created successfully!', 'success'); setCurrentPage('home'); trackAction(ACTIONS.REGISTER, { email, name }); return { success: true }; }
    else { window.showToast?.(result.error, 'error'); return { success: false }; }
  };

  const logout = async () => {
    const result = await logoutUser();
    if (result.success) { trackAction(ACTIONS.LOGOUT, { email: user?.email }); setUser(null); setOrders([]); setCurrentPage('home'); window.showToast?.('Logged out successfully!', 'info'); }
  };

  const isProductPurchased = (productId) => {
    if (!user || !orders || orders.length === 0) return false;
    return orders.some(order => order.status === 'completed' && order.items && order.items.some(item => item.id === productId));
  };

  const completeOrder = async () => {
    if (!user) { window.showToast?.('Please login first!', 'warning'); setCurrentPage('login'); return; }
    if (cart.length === 0) { window.showToast?.('Your cart is empty!', 'warning'); return; }
    const orderItems = cart.map(item => {
      const itemData = { id: item.id, title: item.title, price: item.price, isBundle: item.isBundle || false, pdfFiles: item.pdfFiles || [], bundledProducts: item.bundledProducts || [] };
      if (item.thumbnail) itemData.thumbnail = item.thumbnail;
      return itemData;
    });
    initiatePayment(cartTotal, cart, async (response) => {
      try {
        const orderResult = await addOrder({
          userEmail: user.email, userId: user.uid, items: orderItems, total: cartTotal,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          paymentId: response.razorpay_payment_id, status: 'completed',
        }, user.uid);
        if (!orderResult.success) { window.showToast?.('Payment successful but order not saved! Contact admin with payment ID: ' + response.razorpay_payment_id, 'error'); return; }
        setCart([]); localStorage.removeItem('pyskill_cart');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadOrders();
        await new Promise(resolve => setTimeout(resolve, 500));
        setCurrentPage('orders');
        window.showToast?.('Order completed! Download your PDFs now!', 'success');
      } catch (error) {
        console.error('Payment handler error:', error);
        window.showToast?.('Payment successful but error occurred. Check orders!', 'warning');
        setCart([]); localStorage.removeItem('pyskill_cart');
        await loadOrders();
        setCurrentPage('orders');
      }
    });
  };

  const addProduct = async (product) => {
    if (!user) { window.showToast?.('Please login first!', 'error'); return; }
    const productData = { ...product, userId: user.uid, userEmail: user.email, uploadDate: new Date().toISOString(), totalDownloads: 0, totalRevenue: 0, reviews: [] };
    const result = await addProductDB(productData, user.uid);
    if (result.success) { await loadProducts(); window.showToast?.('Product uploaded successfully!', 'success'); }
    else { window.showToast?.('Upload failed: ' + result.error, 'error'); }
  };

  const deleteProduct = async (id) => {
    const result = await deleteProductDB(id);
    if (result.success) { await loadProducts(); window.showToast?.('Product deleted!', 'success'); }
    else { window.showToast?.('Delete failed: ' + result.error, 'error'); }
  };

  const handleAddReview = async (productId, reviewData) => {
    if (!user) { window.showToast?.('Please login to add review!', 'error'); return; }
    try {
      const product = products.find(p => p.id === productId);
      if (!product) { window.showToast?.('Product not found!', 'error'); return; }
      const newReview = { ...reviewData, id: Date.now(), date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), likes: 0 };
      const updatedProduct = { ...product, reviews: [...(product.reviews || []), newReview] };
      const result = await updateProductDB(productId, updatedProduct);
      if (result.success) { setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p)); window.showToast?.('Review added!', 'success'); }
      else { window.showToast?.('Failed to add review: ' + result.error, 'error'); }
    } catch (error) {
      console.error('Error adding review:', error);
      window.showToast?.('Failed to add review!', 'error');
    }
  };

  const openCompiler = useCallback((code = '') => {
    setCompilerInitialCode(code);
    setCurrentPage('compiler');
  }, []);

  // ✅ Streak payment handler
  const handleStreakPayment = (dynamicPrice) => {
    if (!user) { window.showToast?.('Please login first!', 'warning'); setCurrentPage('login'); return; }
    const finalPrice = dynamicPrice || streakPrice;
    initiatePayment(finalPrice, [], async (response) => {
      localStorage.setItem(`streak_purchased_${user.uid}`, 'true');
      localStorage.setItem(`streak_start_${user.uid}`, new Date().toISOString());
      localStorage.setItem(`streak_count_${user.uid}`, '0');
      window.showToast?.('Streak Challenge unlocked! Let\'s go!', 'success');
      setCurrentPage('streak-practice');
    });
  };

  const isIndia = geoData?.country === 'IN' || !geoData;

  return (
    <AuthContext.Provider value={{ user, login, logout, register, resetPassword }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, cartTotal, cartCount }}>
        <ThemeContext.Provider value={{ isDark, toggleTheme, backgroundTheme, toggleBackground }}>
          <GeoContext.Provider value={{ geoData, isIndia, initiatePayPal }}>
            {showSplash ? (
              <SplashScreen onComplete={handleSplashComplete} />
            ) : (
              <div style={{
                minHeight:  '100vh',
                background: isDark ? 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' : '#ffffff',
                color:      isDark ? '#e2e8f0' : '#1e293b',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                position:   'relative',
                transition: 'background 0.3s ease, color 0.3s ease',
              }}>

                <ToastContainer />
                <Background />
                <AIChatBot setCurrentPage={setCurrentPage} currentPage={currentPage} />

                {/* Payment loading indicator */}
                {!razorpayLoaded && !razorpayError && (
                  <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(99,102,241,0.9)', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    <div style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Loading payment system...
                  </div>
                )}

                {/* ✅ Foreign Country Banner */}
                {!isIndia && geoData && showGeoBanner && (
                  <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', zIndex: 9998, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.2rem' }}>{geoData.flag}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e2e8f0' }}>
                        Visiting from <strong style={{ color: '#fbbf24' }}>{geoData.countryName}</strong>?
                        Prices shown in <strong style={{ color: '#fbbf24' }}>{geoData.currency}</strong>
                      </span>
                      <span style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '20px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: '700', color: '#34d399' }}>
                        PayPal accepted
                      </span>
                    </div>
                    <button onClick={() => setShowGeoBanner(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>✕</button>
                  </div>
                )}

                <Navbar
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  user={user}
                  logout={logout}
                  cartCount={cartCount}
                />

                <main style={{ position: 'relative', zIndex: 1 }}>

                  {currentPage === 'home' && (
                    <HomePage setCurrentPage={setCurrentPage} />
                  )}

                  {currentPage === 'products' && (
                    <ProductsPage
                      products={products}
                      setProducts={setProducts}
                      refreshProducts={loadProducts}
                      buyNow={buyNow}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      searchQuery={searchQuery}
                      isProductPurchased={isProductPurchased}
                      user={user}
                      onAddReview={handleAddReview}
                    />
                  )}

                  {currentPage === 'cart' && (
                    <CartPage setCurrentPage={setCurrentPage} completeOrder={completeOrder} user={user} />
                  )}

                  {currentPage === 'login' && <LoginPage />}

                  {currentPage === 'orders' && (
                    <OrdersPage orders={orders} user={user} refreshOrders={loadOrders} />
                  )}

                  {currentPage === 'admin' && user?.isAdmin && (
                    <AdminPanel products={products} addProduct={addProduct} deleteProduct={deleteProduct} orders={orders} />
                  )}

                  {currentPage === 'mocktests' && <MockTestPage />}

                  {currentPage === 'leaderboard' && (
                    <Leaderboard userEmail={user?.email} />
                  )}

                  {currentPage === 'aichat' && (
                    <AIChatPage setCurrentPage={setCurrentPage} user={user} openCompiler={openCompiler} />
                  )}

                  {currentPage === 'compiler' && (
                    <PythonCompiler initialCode={compilerInitialCode} onClose={() => setCurrentPage('aichat')} />
                  )}

                  {/* ✅ STREAK PAGES */}
                  {currentPage === 'streak' && (
                    <StreakChallengePage
                      isMobile={window.innerWidth <= 768}
                      isDark={isDark}
                      user={user}
                      setCurrentPage={setCurrentPage}
                      onBuy={handleStreakPayment}
                    />
                  )}

                  {currentPage === 'streak-practice' && (
                    <DailyPractice
                      isMobile={window.innerWidth <= 768}
                      isDark={isDark}
                      user={user}
                      setCurrentPage={setCurrentPage}
                    />
                  )}

                  {currentPage === 'streak-result' && (
                    <StreakResult
                      isMobile={window.innerWidth <= 768}
                      isDark={isDark}
                      user={user}
                      setCurrentPage={setCurrentPage}
                    />
                  )}

                  {/* ✅ ADMIN STREAK — full panel, only for admin */}
                  {currentPage === 'admin-streak' && user?.email === ADMIN_EMAIL && (
                    <AdminStreak
                      isMobile={window.innerWidth <= 768}
                      isDark={isDark}
                      user={user}
                    />
                  )}

                  {/* ✅ Blog Post */}
                  {currentPage === 'blog-mock-test' && (
                    <BlogPostMockTest setCurrentPage={setCurrentPage} />
                  )}

                </main>

                {currentPage === 'home' && <Footer setCurrentPage={setCurrentPage} />}

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </GeoContext.Provider>
        </ThemeContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;