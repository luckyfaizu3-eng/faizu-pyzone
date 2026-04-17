import React, { useState, useEffect } from 'react';
import { useTheme, useGeo } from '../App';
import ProductDetailPage from '../components/ProductDetailPage';
import { CATEGORIES } from '../App';
import { Search, X, ChevronDown, Grid } from 'lucide-react';

// ✅ Convert INR product price to geo currency
export function geoPrice(inrPrice, geoData) {
  if (!inrPrice || inrPrice === 0) {
    return { symbol: '', display: 'FREE' };
  }
  if (!geoData || geoData.country === 'IN') {
    return { symbol: '₹', display: `₹${inrPrice}` };
  }
  const inrBase = 49;
  const ratio   = inrPrice / inrBase;
  const raw     = geoData.basic * ratio;
  const rounded = raw < 10
    ? Math.round(raw * 100) / 100
    : Math.floor(raw) + 0.99;
  return {
    symbol:  geoData.symbol,
    display: `${geoData.symbol}${rounded.toFixed(2)}`,
  };
}

// ✅ FIXED: Proper responsive hook that listens to resize events
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    handleResize(); // run once on mount
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

// ✅ Blocked categories — add any name you want to hide
const BLOCKED_CATEGORIES = ['jk bose', 'jkbose', 'j&k bose'];

function ProductsPage({ 
  products, 
  buyNow, 
  selectedCategory, 
  setSelectedCategory, 
  searchQuery,
  isProductPurchased,
  user,
  onAddReview,
  aiReady,
  onStartMockTest
}) {
  const { isDark } = useTheme();
  const { geoData, isIndia } = useGeo();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // ✅ FIXED: Reactive isMobile via resize listener
  const isMobile = useIsMobile(768);

  // ✅ FIXED: Filter out blocked categories (JK Bose etc.)
  const customCategories = [...new Set(
    products
      .filter(p => {
        if (!p.customCategory || p.customCategory.trim() === '') return false;
        const lower = p.customCategory.toLowerCase().trim();
        return !BLOCKED_CATEGORIES.some(blocked => lower.includes(blocked));
      })
      .map(p => p.customCategory)
  )].map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name: name,
    icon: '📝',
    color: '#8b5cf6'
  }));

  // ✅ FIXED: Also filter blocked from CATEGORIES list
  const allCategories = [
    ...CATEGORIES.filter(c => {
      if (c.id === 'all') return false;
      const lower = (c.name || '').toLowerCase().trim();
      return !BLOCKED_CATEGORIES.some(blocked => lower.includes(blocked));
    }),
    ...customCategories
  ];

  useEffect(() => {
    const handlePopState = () => {
      if (selectedProduct) setSelectedProduct(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      window.history.pushState(
        { page: 'products', productDetail: true, productId: selectedProduct.id },
        '',
        `#products/${selectedProduct.id}`
      );
    }
  }, [selectedProduct]);

  const handleAddReview = (reviewData) => {
    if (selectedProduct && onAddReview) {
      onAddReview(selectedProduct.id, reviewData);
    }
  };

  const filteredProducts = products.filter(product => {
    // ✅ Also filter blocked categories from product listing
    const productCategoryLower = (product.customCategory || '').toLowerCase().trim();
    if (BLOCKED_CATEGORIES.some(blocked => productCategoryLower.includes(blocked))) return false;

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

  const getCurrentCategoryName = () => {
    if (selectedCategory === 'all') return 'All Notes';
    const category = allCategories.find(cat => 
      cat.id === selectedCategory || 
      cat.name.toLowerCase().replace(/\s+/g, '-') === selectedCategory
    );
    return category ? category.name : 'All Notes';
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryModal(false);
  };

  const isFree = (price) => !price || price === 0;

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
        geoData={geoData}
        isIndia={isIndia}
        geoPrice={geoPrice}
      />
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      // ✅ FIXED: Better padding — less horizontal padding on mobile
      padding: isMobile ? '4.5rem 0.75rem 3rem' : '5rem 1.5rem 3rem',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 5vw, 3.5rem)',
          fontWeight: '900',
          background: isDark 
            ? 'linear-gradient(135deg, #a78bfa, #ec4899)' 
            : 'linear-gradient(135deg, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          📚 Premium Study Materials
        </h1>
        <p style={{
          fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
          color: isDark ? '#94a3b8' : '#64748b',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          High-quality notes for your success
        </p>
        {!isIndia && geoData && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '10px',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '20px',
            padding: '5px 14px',
            fontSize: '0.78rem',
            fontWeight: '700',
            color: isDark ? '#a78bfa' : '#6366f1',
          }}>
            {geoData.flag} Prices in {geoData.currency} • 🅿️ PayPal
          </div>
        )}
      </div>

      {/* ✅ FIXED: Search Bar + Category — stacks vertically on mobile */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        // ✅ FIXED: was 'flex' (invalid), now 'wrap'
        flexWrap: 'wrap',
        alignItems: 'stretch'
      }}>
        {/* Category Button */}
        <button
          onClick={() => setShowCategoryModal(true)}
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            color: '#fff',
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
            transition: 'all 0.3s ease',
            // ✅ FIXED: On mobile full width, on desktop auto
            flex: isMobile ? '1 1 100%' : '0 0 auto',
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <Grid size={16} style={{ flexShrink: 0 }} />
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isMobile ? 'calc(100vw - 120px)' : '160px'
            }}>
              {getCurrentCategoryName()}
            </span>
          </div>
          <ChevronDown size={16} style={{ flexShrink: 0 }} />
        </button>

        {/* ✅ FIXED: Search — full width on mobile, flex-grow on desktop */}
        <div style={{
          flex: isMobile ? '1 1 100%' : '1 1 180px',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          <Search 
            size={18} 
            style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? '#94a3b8' : '#64748b',
              pointerEvents: 'none',
              zIndex: 1
            }} 
          />
          <input
            type="text"
            placeholder="Search notes..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            style={{
              // ✅ FIXED: was '50%', now '100%' — fills container properly
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.875rem 2.75rem 0.875rem 2.75rem',
              background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
              border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '12px',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              display: 'block'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
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
                alignItems: 'center',
                zIndex: 1
              }}
            >
              <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </button>
          )}
        </div>
      </div>

      {/* Active Filters */}
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
              padding: '0.4rem 0.875rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              maxWidth: '100%'
            }}>
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: isMobile ? '140px' : '200px'
              }}>
                {getCurrentCategoryName()}
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', color: 'inherit', flexShrink: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          )}
          {localSearchQuery && (
            <div style={{
              background: isDark ? 'rgba(236,72,153,0.2)' : 'rgba(236,72,153,0.1)',
              color: isDark ? '#fbcfe8' : '#ec4899',
              padding: '0.4rem 0.875rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              maxWidth: '100%'
            }}>
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobile ? '120px' : '180px'
              }}>
                "{localSearchQuery}"
              </span>
              <button
                onClick={() => setLocalSearchQuery('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', color: 'inherit', flexShrink: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: isDark ? '#64748b' : '#94a3b8' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '700' }}>No products found</h3>
          <p style={{ fontSize: '0.95rem' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          // ✅ FIXED: min 260px so cards fit on small phones, max 1fr
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
          gap: isMobile ? '1.25rem' : '2rem'
        }}>
          {filteredProducts.map(product => {
            const isPurchased   = isProductPurchased(product.id);
            const priceInfo     = geoPrice(product.price, geoData);
            const origPriceInfo = product.originalPrice ? geoPrice(product.originalPrice, geoData) : null;
            const savingsInfo   = product.isBundle && product.bundleInfo?.savings
                                    ? geoPrice(product.bundleInfo.savings, geoData)
                                    : null;
            const productIsFree = isFree(product.price);

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: isMobile ? '170px' : '200px',
                  background: product.thumbnail 
                    ? `url(${product.thumbnail})` 
                    : 'linear-gradient(135deg, #6366f1, #ec4899)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: product.thumbnail ? '0' : '3.5rem',
                  position: 'relative'
                }}>
                  {!product.thumbnail && (product.image || '📚')}
                  
                  {productIsFree && !isPurchased && (
                    <div style={{
                      position: 'absolute', top: '0.75rem', left: '0.75rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.8rem', fontWeight: '900',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.5)'
                    }}>
                      FREE
                    </div>
                  )}

                  {product.discountPercent && !isPurchased && !productIsFree && (
                    <div style={{
                      position: 'absolute', top: '0.75rem', left: '0.75rem',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.8rem', fontWeight: '900',
                      boxShadow: '0 4px 12px rgba(239,68,68,0.5)'
                    }}>
                      {product.discountPercent}% OFF
                    </div>
                  )}
                  
                  {isPurchased && (
                    <div style={{
                      position: 'absolute', top: '0.75rem', right: '0.75rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.8rem', fontWeight: '800',
                      boxShadow: '0 4px 10px rgba(16,185,129,0.4)'
                    }}>
                      ✓ Purchased
                    </div>
                  )}

                  <div style={{
                    position: 'absolute', bottom: '0.75rem', left: '0.75rem',
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                    color: '#fbbf24', padding: '0.375rem 0.75rem', borderRadius: '10px',
                    fontSize: '0.8rem', fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '0.25rem'
                  }}>
                    ⭐ {product.rating || '4.5'}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                  <div style={{
                    display: 'inline-block',
                    background: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.1)',
                    color: isDark ? '#c4b5fd' : '#6366f1',
                    padding: '0.3rem 0.75rem', borderRadius: '16px',
                    fontSize: '0.7rem', fontWeight: '700', marginBottom: '0.75rem',
                    maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {product.customCategory || product.category}
                  </div>

                  <h3 style={{
                    fontSize: isMobile ? '1.05rem' : '1.25rem',
                    fontWeight: '800', marginBottom: '0.5rem',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4
                  }}>
                    {product.title}
                  </h3>

                  <p style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: isMobile ? '0.82rem' : '0.9rem',
                    marginBottom: '1rem',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6
                  }}>
                    {product.description}
                  </p>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: '0.875rem',
                    borderTop: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
                  }}>
                    <div>
                      {!productIsFree && origPriceInfo && (
                        <div style={{
                          fontSize: '0.82rem',
                          color: isDark ? '#64748b' : '#94a3b8',
                          textDecoration: 'line-through',
                          marginBottom: '0.2rem'
                        }}>
                          {origPriceInfo.display}
                        </div>
                      )}
                      <div style={{
                        fontSize: productIsFree ? '1.2rem' : isMobile ? '1.4rem' : '1.75rem',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1
                      }}>
                        {priceInfo.display}
                      </div>
                      {savingsInfo && !productIsFree && (
                        <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700', marginTop: '0.2rem' }}>
                          Save {savingsInfo.display}
                        </div>
                      )}
                    </div>

                    <div style={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: '0.82rem', fontWeight: '600', textAlign: 'right'
                    }}>
                      {product.isBundle
                        ? <div>📦 {product.bundleInfo?.productCount || 0} items</div>
                        : <div>📄 {product.pages} pages</div>
                      }
                    </div>
                  </div>

                  {product.reviews && product.reviews.length > 0 && (
                    <div style={{ marginTop: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>
                      💬 {product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div 
          onClick={() => setShowCategoryModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)',
            zIndex: 9999, display: 'flex', alignItems: 'flex-end',
            // ✅ FIXED: On mobile opens from bottom (sheet), on desktop centered
            justifyContent: isMobile ? 'center' : 'center',
            padding: isMobile ? '0' : '1rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? '#1e293b' : '#fff',
              // ✅ FIXED: On mobile, bottom sheet style; on desktop, modal style
              borderRadius: isMobile ? '24px 24px 0 0' : '24px',
              padding: isMobile ? '1.25rem' : '2rem',
              width: '100%',
              maxWidth: isMobile ? '100%' : '600px',
              maxHeight: isMobile ? '88vh' : '85vh',
              overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
              animation: isMobile ? 'slideUpMobile 0.3s ease' : 'slideUp 0.3s ease',
              boxSizing: 'border-box'
            }}
          >
            {/* ✅ Mobile drag handle */}
            {isMobile && (
              <div style={{
                width: '40px', height: '4px',
                background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                borderRadius: '2px',
                margin: '0 auto 1rem',
              }} />
            )}

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1.25rem'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.75rem',
                fontWeight: '900',
                color: isDark ? '#e2e8f0' : '#1e293b',
                margin: 0
              }}>
                📚 Categories
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                  border: 'none', borderRadius: '10px', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0
                }}
              >
                <X size={18} color={isDark ? '#e2e8f0' : '#1e293b'} />
              </button>
            </div>

            {/* All Notes button */}
            <button
              onClick={() => handleCategorySelect('all')}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: selectedCategory === 'all'
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: selectedCategory === 'all'
                  ? 'none'
                  : `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                color: selectedCategory === 'all' ? '#fff' : isDark ? '#e2e8f0' : '#1e293b',
                padding: '0.875rem 1rem', borderRadius: '14px', cursor: 'pointer',
                fontSize: '0.95rem', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem',
                boxShadow: selectedCategory === 'all' ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
                textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>📚</span>
              <span style={{ flex: 1 }}>All Notes</span>
              <span style={{
                background: selectedCategory === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.1)',
                padding: '0.2rem 0.65rem', borderRadius: '10px',
                fontSize: '0.8rem', color: selectedCategory === 'all' ? '#fff' : '#6366f1',
                flexShrink: 0
              }}>
                {products.length}
              </span>
            </button>

            {/* ✅ FIXED: Grid is always 2-col on mobile too since cards are compact */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {allCategories.map(category => {
                const categoryProducts = products.filter(p => 
                  p.category === category.id || p.customCategory === category.name
                );
                const isActive = selectedCategory === category.id ||
                  category.name.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      border: isActive
                        ? 'none'
                        : `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      color: isActive ? '#fff' : isDark ? '#e2e8f0' : '#1e293b',
                      padding: isMobile ? '0.75rem 0.875rem' : '1rem',
                      borderRadius: '14px', cursor: 'pointer',
                      fontSize: isMobile ? '0.82rem' : '0.95rem', fontWeight: '700',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'flex-start', gap: '0.4rem', textAlign: 'left',
                      boxShadow: isActive ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
                      boxSizing: 'border-box', width: '100%'
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      width: '100%', minWidth: 0
                    }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{category.icon}</span>
                      <span style={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flex: 1, minWidth: 0
                      }}>
                        {category.name}
                      </span>
                    </div>
                    <div style={{
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.1)',
                      padding: '0.2rem 0.6rem', borderRadius: '10px',
                      fontSize: '0.72rem',
                      color: isActive ? '#fff' : '#6366f1'
                    }}>
                      {categoryProducts.length} items
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpMobile { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
}

export default ProductsPage;