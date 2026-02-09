import React, { useState, useEffect } from 'react';
import { useTheme } from '../App';
import ProductDetailPage from '../components/ProductDetailPage';
import { CATEGORIES } from '../App';
import { Search, X, ChevronDown, Grid, Clock, TrendingUp, Zap } from 'lucide-react';

function ProductsPage({ 
  products, 
  buyNow, 
  selectedCategory, 
  setSelectedCategory, 
  searchQuery,
  isProductPurchased,
  user,
  onAddReview
}) {
  const { isDark } = useTheme();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentPurchases, setRecentPurchases] = useState([]);

  // ✅ Real-time clock update for countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Simulate recent purchase notifications with Muslim names
  useEffect(() => {
    const muslimNames = [
      { name: 'Zehra', gender: 'F' },
      { name: 'Aiman', gender: 'F' },
      { name: 'Basit', gender: 'M' },
      { name: 'Zainab', gender: 'F' },
      { name: 'Ahmed', gender: 'M' },
      { name: 'Fatima', gender: 'F' },
      { name: 'Hassan', gender: 'M' },
      { name: 'Ayesha', gender: 'F' },
      { name: 'Omar', gender: 'M' },
      { name: 'Maryam', gender: 'F' },
      { name: 'Ali', gender: 'M' },
      { name: 'Khadija', gender: 'F' },
      { name: 'Bilal', gender: 'M' },
      { name: 'Hafsa', gender: 'F' },
      { name: 'Usman', gender: 'M' },
      { name: 'Ruqayya', gender: 'F' },
      { name: 'Hamza', gender: 'M' },
      { name: 'Safiya', gender: 'F' }
    ];
    
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Lucknow', 'Agra'];
    
    const showRandomPurchase = () => {
      if (products.length === 0) return;
      
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomPerson = muslimNames[Math.floor(Math.random() * muslimNames.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      
      const purchase = {
        id: Date.now(),
        name: randomPerson.name,
        gender: randomPerson.gender,
        city: randomCity,
        product: randomProduct.title,
        time: 'just now'
      };
      
      setRecentPurchases(prev => [purchase, ...prev.slice(0, 4)]);
      
      // Remove after 5 seconds
      setTimeout(() => {
        setRecentPurchases(prev => prev.filter(p => p.id !== purchase.id));
      }, 5000);
    };

    const interval = setInterval(showRandomPurchase, 10000); // Show every 10 seconds
    return () => clearInterval(interval);
  }, [products]);

  // ✅ Calculate time remaining until midnight (flash sale ends)
  const getTimeUntilMidnight = () => {
    const now = currentTime;
    const midnight = new Date(currentTime);
    midnight.setHours(24, 0, 0, 0);
    
    const diff = midnight - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  };

  // ✅ Get random stock count (simulated scarcity)
  const getStockCount = (productId) => {
    // Generate consistent "random" number based on product ID
    const seed = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (seed % 8) + 2; // Between 2-9 items left
  };

  // ✅ Get sold count in last 24 hours (simulated social proof)
  const getSoldCount = (productId) => {
    const seed = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (seed % 50) + 10; // Between 10-59 sold
  };

  // Get all unique custom categories from products
  const customCategories = [...new Set(
    products
      .filter(p => p.customCategory && p.customCategory.trim() !== '')
      .map(p => p.customCategory)
  )].map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name: name,
    icon: '📝',
    color: '#8b5cf6'
  }));

  // Combine default categories with custom ones
  const allCategories = [...CATEGORIES.filter(c => c.id !== 'all'), ...customCategories];

  // Browser Back Button Support for Product Detail Page
  useEffect(() => {
    const handlePopState = (event) => {
      if (selectedProduct) {
        setSelectedProduct(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProduct]);

  // Update history when product is selected
  useEffect(() => {
    if (selectedProduct) {
      window.history.pushState(
        { 
          page: 'products', 
          productDetail: true,
          productId: selectedProduct.id 
        }, 
        '', 
        `#products/${selectedProduct.id}`
      );
    }
  }, [selectedProduct]);

  // Handle review submission
  const handleAddReview = (reviewData) => {
    if (selectedProduct && onAddReview) {
      onAddReview(selectedProduct.id, reviewData);
    }
  };

  // Filter products based on category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || 
                           product.category === selectedCategory ||
                           product.customCategory === selectedCategory ||
                           product.customCategory?.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    
    const searchTerm = (localSearchQuery || searchQuery || '').toLowerCase();
    const matchesSearch = !searchTerm || 
                         product.title.toLowerCase().includes(searchTerm) ||
                         product.description?.toLowerCase().includes(searchTerm) ||
                         product.category.toLowerCase().includes(searchTerm) ||
                         product.customCategory?.toLowerCase().includes(searchTerm);
    
    return matchesCategory && matchesSearch;
  });

  // Get current category name
  const getCurrentCategoryName = () => {
    if (selectedCategory === 'all') return 'All Notes';
    const category = allCategories.find(cat => 
      cat.id === selectedCategory || 
      cat.name.toLowerCase().replace(/\s+/g, '-') === selectedCategory
    );
    return category ? category.name : 'All Notes';
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryModal(false);
  };

  const timeLeft = getTimeUntilMidnight();

  if (selectedProduct) {
    return (
      <ProductDetailPage
        product={selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          window.history.back();
        }}
        onBuyNow={() => buyNow(selectedProduct)}
        onAddReview={handleAddReview}
      />
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '5rem 1rem 3rem',
      minHeight: '100vh'
    }}>
      {/* 🔥 MEGA FLASH SALE BANNER - Mobile Optimized */}
      <div style={{
        background: 'linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)',
        borderRadius: '16px',
        padding: '1.25rem 1rem',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 40px rgba(239,68,68,0.4)',
        border: '2px solid rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: 'shimmer 2s infinite'
        }} />
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative',
          zIndex: 1,
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <Zap size={24} color="#fff" fill="#fff" />
              <h2 style={{
                fontSize: 'clamp(1.1rem, 4vw, 2rem)',
                fontWeight: '900',
                color: '#fff',
                margin: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}>
                🔥 FLASH SALE - Up to 85% OFF!
              </h2>
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: 'clamp(0.85rem, 2vw, 1rem)',
              margin: 0,
              fontWeight: '600'
            }}>
              Limited time offer! Grab now 🚀
            </p>
          </div>
          
          {/* Countdown Timer - Mobile Optimized */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} color="#fff" />
            <div style={{
              display: 'flex',
              gap: '0.4rem'
            }}>
              {[
                { label: 'HRS', value: String(timeLeft.hours).padStart(2, '0') },
                { label: 'MIN', value: String(timeLeft.minutes).padStart(2, '0') },
                { label: 'SEC', value: String(timeLeft.seconds).padStart(2, '0') }
              ].map((unit, idx) => (
                <React.Fragment key={unit.label}>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.5rem 0.4rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    minWidth: 'clamp(45px, 12vw, 55px)',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    <div style={{
                      fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
                      fontWeight: '900',
                      color: '#fff',
                      lineHeight: 1,
                      fontFamily: 'monospace'
                    }}>
                      {unit.value}
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.55rem, 1.5vw, 0.65rem)',
                      color: 'rgba(255,255,255,0.8)',
                      marginTop: '0.2rem',
                      fontWeight: '700'
                    }}>
                      {unit.label}
                    </div>
                  </div>
                  {idx < 2 && (
                    <div style={{
                      color: '#fff',
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: '900',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      :
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
          fontWeight: '900',
          background: isDark 
            ? 'linear-gradient(135deg, #a78bfa, #ec4899)' 
            : 'linear-gradient(135deg, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em'
        }}>
          📚 Premium Study Materials
        </h1>
        <p style={{
          fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
          color: isDark ? '#94a3b8' : '#64748b',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          High-quality notes for your success
        </p>
      </div>

      {/* Search Bar and Category Selector - Mobile Optimized */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'stretch'
      }}>
        {/* Category Selector Button */}
        <button
          onClick={() => setShowCategoryModal(true)}
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            color: '#fff',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
            transition: 'all 0.3s ease',
            flex: '1 1 auto',
            minWidth: '140px',
            justifyContent: 'space-between'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Grid size={16} />
            <span style={{ 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {getCurrentCategoryName()}
            </span>
          </div>
          <ChevronDown size={16} />
        </button>

        {/* Search Input */}
        <div style={{ flex: '1 1 auto', minWidth: '200px', position: 'relative' }}>
          <Search 
            size={18} 
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? '#94a3b8' : '#64748b'
            }} 
          />
          <input
            type="text"
            placeholder="Search notes..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 2.5rem 0.75rem 2.5rem',
              background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
              border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '12px',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {localSearchQuery && (
            <button
              onClick={() => setLocalSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Display */}
      {(selectedCategory !== 'all' || localSearchQuery) && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {selectedCategory !== 'all' && (
            <div style={{
              background: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.1)',
              color: isDark ? '#c4b5fd' : '#6366f1',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                {getCurrentCategoryName()}
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
          {localSearchQuery && (
            <div style={{
              background: isDark ? 'rgba(236,72,153,0.2)' : 'rgba(236,72,153,0.1)',
              color: isDark ? '#fbcfe8' : '#ec4899',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '150px'
              }}>
                "{localSearchQuery}"
              </span>
              <button
                onClick={() => setLocalSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Grid - Mobile Optimized */}
      {filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: isDark ? '#64748b' : '#94a3b8'
        }}>
          <div style={{ fontSize: 'clamp(3rem, 10vw, 4rem)', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', marginBottom: '0.5rem' }}>No products found</h3>
          <p style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(1rem, 3vw, 2rem)'
        }}>
          {filteredProducts.map(product => {
            const isPurchased = isProductPurchased(product.id);
            const stockCount = getStockCount(product.id);
            const soldCount = getSoldCount(product.id);
            const isLowStock = stockCount <= 5;

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                style={{
                  background: isDark 
                    ? 'rgba(255,255,255,0.03)' 
                    : '#fff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: isDark 
                    ? '0 4px 20px rgba(0,0,0,0.3)' 
                    : '0 4px 20px rgba(0,0,0,0.08)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = isDark 
                    ? '0 12px 40px rgba(0,0,0,0.5)' 
                    : '0 12px 40px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDark 
                    ? '0 4px 20px rgba(0,0,0,0.3)' 
                    : '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 'clamp(160px, 30vw, 200px)',
                  background: product.thumbnail 
                    ? `url(${product.thumbnail})` 
                    : 'linear-gradient(135deg, #6366f1, #ec4899)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: product.thumbnail ? '0' : 'clamp(2.5rem, 8vw, 4rem)',
                  position: 'relative'
                }}>
                  {!product.thumbnail && (product.image || '📚')}
                  
                  {/* 🔥 FLASH SALE + DISCOUNT Badge */}
                  {product.discountPercent && !isPurchased && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff',
                        padding: '0.4rem 0.7rem',
                        borderRadius: '10px',
                        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        boxShadow: '0 4px 15px rgba(239,68,68,0.5)',
                        animation: 'pulse 2s ease-in-out infinite',
                        border: '2px solid rgba(255,255,255,0.3)'
                      }}>
                        <Zap size={12} fill="#fff" />
                        {product.discountPercent}% OFF
                      </div>
                    </div>
                  )}
                  
                  {/* Bundle Badge */}
                  {product.isBundle && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: '#fff',
                      padding: '0.35rem 0.7rem',
                      borderRadius: '16px',
                      fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: '0 4px 12px rgba(139,92,246,0.4)'
                    }}>
                      📦 BUNDLE
                    </div>
                  )}
                  
                  {/* Purchased Badge */}
                  {isPurchased && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      padding: '0.35rem 0.7rem',
                      borderRadius: '16px',
                      fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
                    }}>
                      ✓ Purchased
                    </div>
                  )}

                  {/* Rating Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0.75rem',
                    left: '0.75rem',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(10px)',
                    color: '#fbbf24',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '10px',
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    ⭐ {product.rating || '4.5'}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                  {/* Category Badge */}
                  <div style={{
                    display: 'inline-block',
                    background: isDark 
                      ? 'rgba(139,92,246,0.2)' 
                      : 'rgba(99,102,241,0.1)',
                    color: isDark ? '#c4b5fd' : '#6366f1',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '16px',
                    fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)',
                    fontWeight: '700',
                    marginBottom: '0.6rem'
                  }}>
                    {product.customCategory || product.category}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                    fontWeight: '800',
                    marginBottom: '0.5rem',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.3
                  }}>
                    {product.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.5
                  }}>
                    {product.description}
                  </p>

                  {/* 🚨 URGENCY INDICATORS */}
                  {!isPurchased && (
                    <div style={{
                      marginBottom: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      {/* Low Stock Warning */}
                      {isLowStock && (
                        <div style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: '#fff',
                          padding: '0.45rem 0.7rem',
                          borderRadius: '8px',
                          fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          animation: 'pulse 2s ease-in-out infinite'
                        }}>
                          ⚠️ Only {stockCount} left!
                        </div>
                      )}

                      {/* High Demand Indicator */}
                      <div style={{
                        background: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)',
                        color: '#f59e0b',
                        padding: '0.4rem 0.7rem',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <TrendingUp size={13} />
                        🔥 {soldCount} sold today
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                  }}>
                    {/* Price */}
                    <div>
                      {product.originalPrice && (
                        <div style={{
                          fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                          color: isDark ? '#64748b' : '#94a3b8',
                          textDecoration: 'line-through',
                          marginBottom: '0.2rem'
                        }}>
                          ₹{product.originalPrice}
                        </div>
                      )}
                      <div style={{
                        fontSize: 'clamp(1.4rem, 4vw, 1.75rem)',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1
                      }}>
                        ₹{product.price}
                      </div>
                      {product.isBundle && product.bundleInfo && (
                        <div style={{
                          fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)',
                          color: '#10b981',
                          fontWeight: '700',
                          marginTop: '0.2rem'
                        }}>
                          Save ₹{product.bundleInfo.savings}
                        </div>
                      )}
                      {/* Lowest Price Badge */}
                      {product.discountPercent && (
                        <div style={{
                          fontSize: 'clamp(0.65rem, 1.6vw, 0.7rem)',
                          color: '#ef4444',
                          fontWeight: '800',
                          marginTop: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}>
                          📉 Lowest price!
                        </div>
                      )}
                    </div>

                    {/* Pages count or Bundle info */}
                    <div style={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      textAlign: 'right'
                    }}>
                      {product.isBundle ? (
                        <div>
                          <div>📦 {product.bundleInfo?.productCount || 0} items</div>
                          <div style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)', marginTop: '0.2rem' }}>
                            {product.bundleInfo?.discount}% OFF
                          </div>
                        </div>
                      ) : (
                        <div>📄 {product.pages} pages</div>
                      )}
                    </div>
                  </div>

                  {/* Reviews count */}
                  {product.reviews && product.reviews.length > 0 && (
                    <div style={{
                      marginTop: '0.6rem',
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                      fontWeight: '600'
                    }}>
                      💬 {product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🔔 Recent Purchase Notifications - Mobile Optimized */}
      <div style={{
        position: 'fixed',
        bottom: 'clamp(1rem, 3vw, 2rem)',
        left: 'clamp(0.5rem, 2vw, 2rem)',
        right: 'clamp(0.5rem, 2vw, auto)',
        maxWidth: '350px',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem'
      }}>
        {recentPurchases.map(purchase => (
          <div
            key={purchase.id}
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, #1e293b, #334155)' 
                : 'linear-gradient(135deg, #fff, #f8fafc)',
              border: `2px solid ${isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}`,
              borderRadius: '14px',
              padding: 'clamp(0.75rem, 2.5vw, 1rem)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(10px)',
              animation: 'slideInLeft 0.5s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <div style={{
              width: 'clamp(35px, 8vw, 40px)',
              height: 'clamp(35px, 8vw, 40px)',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              flexShrink: 0
            }}>
              ✓
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                fontWeight: '700',
                color: isDark ? '#e2e8f0' : '#1e293b',
                marginBottom: '0.2rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {purchase.name} from {purchase.city}
              </div>
              <div style={{
                fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)',
                color: isDark ? '#94a3b8' : '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Purchased: {purchase.product}
              </div>
              <div style={{
                fontSize: 'clamp(0.65rem, 1.6vw, 0.7rem)',
                color: '#10b981',
                fontWeight: '600',
                marginTop: '0.15rem'
              }}>
                {purchase.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal - Mobile Optimized */}
      {showCategoryModal && (
        <div 
          onClick={() => setShowCategoryModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? '#1e293b' : '#fff',
              borderRadius: '20px',
              padding: 'clamp(1.25rem, 4vw, 2rem)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: isDark 
                ? '0 20px 60px rgba(0,0,0,0.6)' 
                : '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.3s ease',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}>
              <h2 style={{
                fontSize: 'clamp(1.3rem, 4vw, 1.75rem)',
                fontWeight: '900',
                color: isDark ? '#e2e8f0' : '#1e293b',
                margin: 0
              }}>
                📚 Browse Categories
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  border: 'none',
                  borderRadius: '10px',
                  width: 'clamp(36px, 10vw, 40px)',
                  height: 'clamp(36px, 10vw, 40px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                }}
              >
                <X size={18} color={isDark ? '#e2e8f0' : '#1e293b'} />
              </button>
            </div>

            {/* All Notes Button */}
            <button
              onClick={() => handleCategorySelect('all')}
              style={{
                width: '100%',
                background: selectedCategory === 'all'
                  ? (isDark 
                      ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)')
                  : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                border: selectedCategory === 'all' 
                  ? 'none' 
                  : `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                color: selectedCategory === 'all' 
                  ? '#fff' 
                  : (isDark ? '#e2e8f0' : '#1e293b'),
                padding: 'clamp(0.75rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                transition: 'all 0.3s ease',
                boxShadow: selectedCategory === 'all' 
                  ? '0 4px 15px rgba(99,102,241,0.3)' 
                  : 'none',
                marginBottom: '1.25rem'
              }}
            >
              <span style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.5rem)' }}>📚</span>
              <span>All Notes</span>
              <span style={{
                marginLeft: 'auto',
                background: selectedCategory === 'all' 
                  ? 'rgba(255,255,255,0.2)' 
                  : (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'),
                padding: '0.25rem 0.6rem',
                borderRadius: '10px',
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                fontWeight: '700',
                color: selectedCategory === 'all' ? '#fff' : '#6366f1'
              }}>
                {products.length}
              </span>
            </button>

            {/* Category Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
              gap: 'clamp(0.75rem, 2vw, 1rem)'
            }}>
              {allCategories.map(category => {
                const categoryProducts = products.filter(p => 
                  p.category === category.id || 
                  p.customCategory === category.name ||
                  p.customCategory?.toLowerCase().replace(/\s+/g, '-') === category.id
                );
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    style={{
                      background: selectedCategory === category.id
                        ? (isDark 
                            ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                            : 'linear-gradient(135deg, #6366f1, #8b5cf6)')
                        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                      border: selectedCategory === category.id 
                        ? 'none' 
                        : `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      color: selectedCategory === category.id 
                        ? '#fff' 
                        : (isDark ? '#e2e8f0' : '#1e293b'),
                      padding: 'clamp(0.75rem, 2.5vw, 1rem)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)',
                      fontWeight: '700',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '0.4rem',
                      transition: 'all 0.3s ease',
                      boxShadow: selectedCategory === category.id 
                        ? '0 4px 15px rgba(99,102,241,0.3)' 
                        : 'none',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                      <span style={{ fontSize: 'clamp(1.1rem, 3vw, 1.3rem)' }}>{category.icon}</span>
                      <span style={{ flex: 1, lineHeight: 1.3 }}>{category.name}</span>
                    </div>
                    <div style={{
                      background: selectedCategory === category.id 
                        ? 'rgba(255,255,255,0.2)' 
                        : (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'),
                      padding: '0.25rem 0.6rem',
                      borderRadius: '10px',
                      fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)',
                      fontWeight: '700',
                      color: selectedCategory === category.id ? '#fff' : '#6366f1',
                      alignSelf: 'flex-start'
                    }}>
                      {categoryProducts.length} {categoryProducts.length === 1 ? 'item' : 'items'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Mobile Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(139,92,246,0.5)' : 'rgba(99,102,241,0.5)'};
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(139,92,246,0.7)' : 'rgba(99,102,241,0.7)'};
          }
        }

        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}

export default ProductsPage;