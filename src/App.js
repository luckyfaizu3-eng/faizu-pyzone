import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { registerUser, loginUser, logoutUser, isAdmin, resetPassword } from './authService';
import { 
  addProduct as addProductDB, 
  getAllProducts, 
  deleteProduct as deleteProductDB, 
  addOrder as addOrderDB, 
  getUserOrders
} from './dbService';

// Import Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Background from './components/Background';
import TelegramButton from './components/TelegramButton';
import ToastContainer from './components/ToastContainer';
import SplashScreen from './components/SplashScreen';

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

// ✅ LIVE RAZORPAY KEY
export const RAZORPAY_KEY_ID = "rzp_live_SAvdBqaaBDr2qS";

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
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('faizupyzone_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDark] = useState(false); // Always light theme
  const [showSplash, setShowSplash] = useState(() => {
    // Check if splash was shown before
    const splashShown = sessionStorage.getItem('splashShown');
    return !splashShown;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('faizupyzone_cart', JSON.stringify(cart));
  }, [cart]);

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

  // ✅ FIXED: Create loadProducts function with useCallback
  const loadProducts = useCallback(async () => {
    try {
      const result = await getAllProducts();
      if (result.success) {
        setProducts(result.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      window.showToast?.('❌ Failed to load products', 'error');
    }
  }, []);

  // Load products from Firebase
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ✅ FIXED: Create loadOrders function with useCallback
  const loadOrders = useCallback(async () => {
    if (user?.uid) {
      try {
        console.log('🔄 Loading orders for user:', user.uid);
        const result = await getUserOrders(user.uid);
        if (result.success) {
          console.log('✅ Orders loaded:', result.orders.length);
          setOrders(result.orders);
        } else {
          console.error('❌ Failed to load orders:', result.error);
          setOrders([]);
        }
      } catch (error) {
        console.error('❌ Error loading orders:', error);
        setOrders([]);
      }
    } else {
      console.log('ℹ️ No user, clearing orders');
      setOrders([]);
    }
  }, [user?.uid]);

  // Load user orders
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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
      window.showToast?.('⏳ Payment system loading... Please try again!', 'error');
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
        window.showToast?.('🎉 Payment Successful! Processing order...', 'success');
        setTimeout(async () => {
          await onSuccess(response);
        }, 1000);
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
          window.showToast?.('❌ Payment cancelled', 'info');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.error('Payment failed:', response);
      window.showToast?.('❌ Payment Failed! Please try again.', 'error');
    });
    rzp.open();
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item));
      window.showToast?.('✅ Quantity updated!', 'success');
    } else {
      setCart([...cart, {...product, quantity: 1}]);
      window.showToast?.('✅ Added to cart!', 'success');
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    window.showToast?.('🗑️ Removed from cart', 'info');
  };

  const buyNow = async (product) => {
    if (!user) {
      window.showToast?.('⚠️ Please login first to purchase!', 'warning');
      setCurrentPage('login');
      return;
    }

    initiatePayment(product.price, [product], async (response) => {
      // Create item object and only include defined fields
      const itemData = {
        id: product.id,
        title: product.title,
        price: product.price
      };

      // Only add optional fields if they exist
      if (product.pdfUrl) itemData.pdfUrl = product.pdfUrl;
      if (product.pdfFileName) itemData.pdfFileName = product.pdfFileName;
      if (product.thumbnail) itemData.thumbnail = product.thumbnail;

      const newOrder = {
        userEmail: user.email,
        userId: user.uid,
        items: [itemData],
        total: product.price,
        date: new Date().toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        status: 'completed',
        paymentId: response.razorpay_payment_id
      };
      
      console.log('💳 Creating order:', newOrder);
      const result = await addOrderDB(newOrder, user.uid);
      
      if (result.success) {
        console.log('✅ Order created successfully, reloading orders...');
        // ✅ CRITICAL: Wait for orders to reload before changing page
        await loadOrders();
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          setCurrentPage('orders');
          window.showToast?.('🎊 Order placed successfully! Download your PDF now!', 'success');
        }, 500);
      } else {
        console.error('❌ Order creation failed:', result.error);
        window.showToast?.('❌ Order failed: ' + result.error, 'error');
      }
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ✅ Simple Login - No verification check
  const login = async (email, password) => {
    const result = await loginUser(email, password);
    
    if (result.success) {
      window.showToast?.('🎉 Welcome back!', 'success');
      setCurrentPage('home');
      return { success: true };
    } else {
      window.showToast?.('❌ ' + result.error, 'error');
      return { success: false };
    }
  };

  // ✅ Simple Register - No verification needed
  const register = async (email, password, name) => {
    const result = await registerUser(email, password, name);
    
    if (result.success) {
      window.showToast?.('🎊 Account created successfully!', 'success');
      setCurrentPage('home');
      return { success: true };
    } else {
      window.showToast?.('❌ ' + result.error, 'error');
      return { success: false };
    }
  };

  const logout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);
      setCart([]);
      setOrders([]);
      localStorage.removeItem('faizupyzone_cart'); // Clear cart from localStorage
      setCurrentPage('home');
      window.showToast?.('👋 Logged out successfully!', 'info');
    }
  };

  // Check if product is already purchased by user
  const isProductPurchased = (productId) => {
    if (!user || !orders || orders.length === 0) return false;
    
    return orders.some(order => 
      order.items && order.items.some(item => item.id === productId)
    );
  };

  const completeOrder = () => {
    if (!user) {
      window.showToast?.('⚠️ Please login first to complete order!', 'warning');
      setCurrentPage('login');
      return;
    }

    if (cart.length === 0) {
      window.showToast?.('⚠️ Your cart is empty!', 'warning');
      return;
    }

    initiatePayment(cartTotal, cart, async (response) => {
      // Map cart items and only include defined fields
      const orderItems = cart.map(item => {
        const itemData = {
          id: item.id,
          title: item.title,
          price: item.price
        };

        // Only add optional fields if they exist
        if (item.pdfUrl) itemData.pdfUrl = item.pdfUrl;
        if (item.pdfFileName) itemData.pdfFileName = item.pdfFileName;
        if (item.thumbnail) itemData.thumbnail = item.thumbnail;

        return itemData;
      });

      const newOrder = {
        userEmail: user.email,
        userId: user.uid,
        items: orderItems,
        total: cartTotal,
        date: new Date().toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        status: 'completed',
        paymentId: response.razorpay_payment_id
      };
      
      console.log('💳 Creating cart order:', newOrder);
      const result = await addOrderDB(newOrder, user.uid);
      
      if (result.success) {
        console.log('✅ Cart order created successfully, reloading orders...');
        // ✅ CRITICAL: Wait for orders to reload before changing page
        await loadOrders();
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          setCart([]);
          setCurrentPage('orders');
          window.showToast?.('🎊 Order completed! Download your PDFs now!', 'success');
        }, 500);
      } else {
        console.error('❌ Cart order creation failed:', result.error);
        window.showToast?.('❌ Order failed: ' + result.error, 'error');
      }
    });
  };

  const addProduct = async (product) => {
    if (!user) {
      window.showToast?.('❌ Please login first!', 'error');
      return;
    }

    const productData = { 
      ...product,
      userId: user.uid,
      userEmail: user.email,
      uploadDate: new Date().toISOString(),
      totalDownloads: 0
    };
    
    const result = await addProductDB(productData, user.uid);
    if (result.success) {
      await loadProducts();
      window.showToast?.('✅ Product uploaded successfully!', 'success');
    } else {
      window.showToast?.('❌ Upload failed: ' + result.error, 'error');
    }
  };

  const deleteProduct = async (id) => {
    const result = await deleteProductDB(id);
    if (result.success) {
      await loadProducts();
      window.showToast?.('✅ Product deleted successfully!', 'success');
    } else {
      window.showToast?.('❌ Delete failed: ' + result.error, 'error');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, resetPassword }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, cartTotal, cartCount }}>
        <ThemeContext.Provider value={{ isDark }}>
          {showSplash ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
          <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            color: '#1e293b',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
            position: 'relative'
          }}>
            
            <ToastContainer />
            <Background />
            <TelegramButton />
            
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
                  setProducts={setProducts}
                  refreshProducts={loadProducts}
                  buyNow={buyNow} 
                  selectedCategory={selectedCategory} 
                  setSelectedCategory={setSelectedCategory} 
                  searchQuery={searchQuery}
                  isProductPurchased={isProductPurchased}
                  user={user}
                />
              )}
              {currentPage === 'cart' && <CartPage setCurrentPage={setCurrentPage} completeOrder={completeOrder} user={user} />}
              {currentPage === 'login' && <LoginPage />}
              {currentPage === 'orders' && (
                <OrdersPage 
                  orders={orders} 
                  user={user}
                  refreshOrders={loadOrders}
                />
              )}
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
          )}
        </ThemeContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;