import React, { useState, useEffect } from 'react';
import { useTheme } from '../App';
import ProductDetailPage from '../components/ProductDetailPage';
import { CATEGORIES } from '../App';
import { Search, X, ChevronDown, Grid } from 'lucide-react';

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

  // ✅ Get all unique custom categories from products
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

  // ✅ Combine default categories with custom ones
  const allCategories = [...CATEGORIES.filter(c => c.id !== 'all'), ...customCategories];

  // ✅ Browser Back Button Support for Product Detail Page
  useEffect(() => {
    const handlePopState = (event) => {
      if (selectedProduct) {
        // User pressed back from product detail
        setSelectedProduct(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProduct]);

  // ✅ Update history when product is selected
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

  // ✅ Handle review submission
  const handleAddReview = (reviewData) => {
    if (selectedProduct && onAddReview) {
      onAddReview(selectedProduct.id, reviewData);
    }
  };

  // ✅ Filter products based on category and search
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

  // ✅ Get current category name
  const getCurrentCategoryName = () => {
    if (selectedCategory === 'all') return 'All Notes';
    const category = allCategories.find(cat => 
      cat.id === selectedCategory || 
      cat.name.toLowerCase().replace(/\s+/g, '-') === selectedCategory
    );
    return category ? category.name : 'All Notes';
  };

  // ✅ Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryModal(false);
  };

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
      padding: '6rem 1.5rem 3rem',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: '900',
          background: isDark 
            ? 'linear-gradient(135deg, #a78bfa, #ec4899)' 
            : 'linear-gradient(135deg, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          📚 Premium Study Materials
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: isDark ? '#94a3b8' : '#64748b',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          High-quality notes and resources for your success
        </p>
      </div>

      {/* Search Bar and Category Selector */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        alignItems: 'center'
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
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
            transition: 'all 0.3s ease',
            minWidth: '180px',
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
            <Grid size={18} />
            {getCurrentCategoryName()}
          </div>
          <ChevronDown size={18} />
        </button>

        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search 
            size={20} 
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? '#94a3b8' : '#64748b'
            }} 
          />
          <input
            type="text"
            placeholder="Search notes, categories..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 3rem 0.75rem 3rem',
              background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
              border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '12px',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: '0.95rem',
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
                right: '1rem',
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
              <X size={18} color={isDark ? '#94a3b8' : '#64748b'} />
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
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Category: {getCurrentCategoryName()}
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
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Search: "{localSearchQuery}"
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

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: isDark ? '#64748b' : '#94a3b8'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No products found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {filteredProducts.map(product => {
            const isPurchased = isProductPurchased(product.id);

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                style={{
                  background: isDark 
                    ? 'rgba(255,255,255,0.03)' 
                    : '#fff',
                  borderRadius: '20px',
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
                  e.currentTarget.style.transform = 'translateY(-8px)';
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
                  height: '200px',
                  background: product.thumbnail 
                    ? `url(${product.thumbnail})` 
                    : 'linear-gradient(135deg, #6366f1, #ec4899)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: product.thumbnail ? '0' : '4rem',
                  position: 'relative'
                }}>
                  {!product.thumbnail && (product.image || '📚')}
                  
                  {/* Discount Badge */}
                  {product.discountPercent && !isPurchased && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: '#fff',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}>
                      🔥 {product.discountPercent}% OFF
                    </div>
                  )}
                  
                  {/* Bundle Badge */}
                  {product.isBundle && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: '#fff',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      boxShadow: '0 4px 12px rgba(139,92,246,0.4)'
                    }}>
                      📦 BUNDLE
                    </div>
                  )}
                  
                  {/* Purchased Badge */}
                  {isPurchased && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
                    }}>
                      ✓ Purchased
                    </div>
                  )}

                  {/* Rating Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(10px)',
                    color: '#fbbf24',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    ⭐ {product.rating || '4.5'}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                  {/* Category Badge */}
                  <div style={{
                    display: 'inline-block',
                    background: isDark 
                      ? 'rgba(139,92,246,0.2)' 
                      : 'rgba(99,102,241,0.1)',
                    color: isDark ? '#c4b5fd' : '#6366f1',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    marginBottom: '0.75rem'
                  }}>
                    {product.customCategory || product.category}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '800',
                    marginBottom: '0.5rem',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {product.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.5
                  }}>
                    {product.description}
                  </p>

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                  }}>
                    {/* Price */}
                    <div>
                      {product.originalPrice && (
                        <div style={{
                          fontSize: '0.9rem',
                          color: isDark ? '#64748b' : '#94a3b8',
                          textDecoration: 'line-through',
                          marginBottom: '0.25rem'
                        }}>
                          ₹{product.originalPrice}
                        </div>
                      )}
                      <div style={{
                        fontSize: '1.75rem',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        ₹{product.price}
                      </div>
                      {product.isBundle && product.bundleInfo && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#10b981',
                          fontWeight: '700',
                          marginTop: '0.25rem'
                        }}>
                          Save ₹{product.bundleInfo.savings}
                        </div>
                      )}
                    </div>

                    {/* Pages count or Bundle info */}
                    <div style={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textAlign: 'right'
                    }}>
                      {product.isBundle ? (
                        <div>
                          <div>📦 {product.bundleInfo?.productCount || 0} items</div>
                          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
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
                      marginTop: '0.75rem',
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: '0.8rem',
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

      {/* Category Modal */}
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
              borderRadius: '24px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
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
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.75rem',
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
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
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
                <X size={20} color={isDark ? '#e2e8f0' : '#1e293b'} />
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
                padding: '1rem 1.25rem',
                borderRadius: '14px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                boxShadow: selectedCategory === 'all' 
                  ? '0 4px 15px rgba(99,102,241,0.3)' 
                  : 'none',
                marginBottom: '1.5rem'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== 'all') {
                  e.currentTarget.style.transform = 'translateX(5px)';
                  e.currentTarget.style.borderColor = '#6366f1';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== 'all') {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                }
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>📚</span>
              <span>All Notes</span>
              <span style={{
                marginLeft: 'auto',
                background: selectedCategory === 'all' 
                  ? 'rgba(255,255,255,0.2)' 
                  : (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'),
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: selectedCategory === 'all' ? '#fff' : '#6366f1'
              }}>
                {products.length}
              </span>
            </button>

            {/* Category Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem'
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
                      padding: '1rem',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      boxShadow: selectedCategory === category.id 
                        ? '0 4px 15px rgba(99,102,241,0.3)' 
                        : 'none',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== category.id) {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = category.color || '#6366f1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== category.id) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                      <span style={{ fontSize: '1.3rem' }}>{category.icon}</span>
                      <span style={{ flex: 1 }}>{category.name}</span>
                    </div>
                    <div style={{
                      background: selectedCategory === category.id 
                        ? 'rgba(255,255,255,0.2)' 
                        : (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
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
      `}</style>
    </div>
  );
}

export default ProductsPage;