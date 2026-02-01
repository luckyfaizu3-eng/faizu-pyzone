import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { registerUser, loginUser, logoutUser, isAdmin, resetPassword } from './authService';
import { 
  addProduct as addProductDB, 
  getAllProducts, 
  deleteProduct as deleteProductDB, 
  addOrder as addOrderDB, 
  getUserOrders,
  addReview as addReviewDB
} from './dbService';

// Import Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Background from './components/Background';
import WhatsAppButton from './components/WhatsAppButton';
import ToastContainer from './components/ToastContainer';
import MobileBanner from './components/MobileBanner';

// Import Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';

// Contexts
export const CartContext = React.createContext();
export const AuthContext = React.createContext();
export const ThemeContext = React.createContext();

export const useCart = () => React.useContext(CartContext);
export const useAuth = () => React.useContext(AuthContext);
export const useTheme = () => React.useContext(ThemeContext);

// Constants - UPDATED TO LIVE KEY
export const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_live_SAr5MEE3k1QCDz";

export const CATEGORIES = [
  { id: 'all', name: 'All Notes', icon: '📚', color: '#6366f1' },
  { id: 'python', name: 'Python Notes', icon: '🐍', color: '#3776ab' },
  { id: 'jkbose', name: 'JKBOSE Materials', icon: '🎓', color: '#ec4899' },
  { id: 'job', name: 'Job Preparation', icon: '💼', color: '#10b981' },
  { id: 'web', name: 'Web Development', icon: '🌐', color: '#3b82f6' },
  { id: 'hacking', name: 'Ethical Hacking', icon: '🔐', color: '#ef4444' },
  { id: 'data', name: 'Data Science', icon: '📊', color: '#f59e0b' },
  { id: 'ai', name: 'AI & ML', icon: '🤖', color: '#8b5cf6' },
  { id: 'marketing', name: 'Digital Marketing', icon: '📱', color: '#06b6d4' }
];

function App() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDark] = useState(false); // Always light theme

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
      window.showToast?.('Payment system loading... Please try again! ⏳', 'error');
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
        window.showToast?.('🎉 Payment Successful! Redirecting to orders...', 'success');
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
        color: "#6366f1"
      },
      modal: {
        ondismiss: function() {
          window.showToast?.('Payment cancelled 🛒', 'info');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function () {
      window.showToast?.('❌ Payment Failed! Please try again.', 'error');
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
    window.showToast?.('Added to cart! 🛒', 'success');
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    window.showToast?.('Removed from cart', 'info');
  };

  // ✅ CLEAR CART FUNCTION ADDED
  const clearCart = () => {
    setCart([]);
  };

  const buyNow = async (product) => {
    if (!user) {
      window.showToast?.('Please login first! 🔐', 'error');
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
        // FORCE RELOAD ORDERS
        const updatedOrders = await getUserOrders(user.email);
        if (updatedOrders.success) {
          setOrders(updatedOrders.orders);
          console.log('✅ Orders updated:', updatedOrders.orders);
        }
        
        // Navigate to orders page
        setCurrentPage('orders');
        
        // Show success message
        setTimeout(() => {
          window.showToast?.('🎊 Order placed! Download your PDF now!', 'success');
        }, 500);
      } else {
        window.showToast?.('❌ Order failed: ' + result.error, 'error');
      }
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const login = async (email, password) => {
    const result = await loginUser(email, password);
    if (result.success) {
      window.showToast?.('Welcome back! 🎉', 'success');
      setCurrentPage('home');
      return true;
    } else {
      window.showToast?.('Login failed! Check credentials', 'error');
      return false;
    }
  };

  const register = async (email, password, name) => {
    const result = await registerUser(email, password, name);
    if (result.success) {
      window.showToast?.('Account created! 🎊', 'success');
      setCurrentPage('home');
      return true;
    } else {
      window.showToast?.('Registration failed: ' + result.error, 'error');
      return false;
    }
  };

  const logout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);
      setCart([]);
      setCurrentPage('home');
      window.showToast?.('Logged out! 👋', 'info');
    }
  };

  const completeOrder = () => {
    if (!user) {
      window.showToast?.('⚠️ Please login first!', 'warning');
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
        // FORCE RELOAD ORDERS
        const updatedOrders = await getUserOrders(user.email);
        if (updatedOrders.success) {
          setOrders(updatedOrders.orders);
          console.log('✅ Orders updated:', updatedOrders.orders);
        }
        
        // Clear cart
        setCart([]);
        
        // Navigate to orders
        setCurrentPage('orders');
        
        // Show success message
        setTimeout(() => {
          window.showToast?.('🎊 Order placed! Download your PDFs!', 'success');
        }, 500);
      } else {
        window.showToast?.('❌ Order failed: ' + result.error, 'error');
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
      window.showToast?.('✅ Product uploaded!', 'success');
    } else {
      window.showToast?.('❌ Upload failed: ' + result.error, 'error');
    }
  };

  const deleteProduct = async (id) => {
    const result = await deleteProductDB(id);
    if (result.success) {
      setProducts(products.filter(p => p.id !== id));
      window.showToast?.('✅ Product deleted!', 'success');
    } else {
      window.showToast?.('❌ Delete failed: ' + result.error, 'error');
    }
  };

  const addReview = async (productId, reviewData) => {
    const result = await addReviewDB(productId, reviewData);
    if (result.success) {
      // Reload products to get updated reviews
      const updatedProducts = await getAllProducts();
      if (updatedProducts.success) {
        setProducts(updatedProducts.products);
      }
      window.showToast?.('✅ Review added!', 'success');
    } else {
      window.showToast?.('❌ Failed to add review: ' + result.error, 'error');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, resetPassword }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}>
        <ThemeContext.Provider value={{ isDark }}>
          <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            color: '#1e293b',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
            position: 'relative'
          }}>
            
            <ToastContainer />
            <Background />
            <WhatsAppButton />
            <MobileBanner />
            
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
            
            <main style={{position: 'relative', zIndex: 1}}>
              {currentPage === 'home' && <HomePage setCurrentPage={setCurrentPage} />}
              {currentPage === 'products' && (
                <ProductsPage 
                  products={products} 
                  buyNow={buyNow} 
                  selectedCategory={selectedCategory} 
                  setSelectedCategory={setSelectedCategory} 
                  searchQuery={searchQuery}
                  addReview={addReview}
                />
              )}
              {currentPage === 'cart' && <CartPage setCurrentPage={setCurrentPage} completeOrder={completeOrder} user={user} />}
              {currentPage === 'login' && <LoginPage />}
              {currentPage === 'orders' && <OrdersPage orders={orders} />}
              {currentPage === 'admin' && user?.isAdmin && (
                <AdminPanel 
                  products={products} 
                  addProduct={addProduct} 
                  deleteProduct={deleteProduct} 
                  orders={orders} 
                />
              )}
            </main>
            
            <Footer setCurrentPage={setCurrentPage} />
          </div>
        </ThemeContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;