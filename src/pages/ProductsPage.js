import React, { useState } from 'react';
import { useTheme } from '../App';
import ProductDetailPage from '../components/ProductDetailPage'; // ✅ FIXED: Import from components
import { CATEGORIES } from '../App';

function ProductsPage({ 
  products, 
  buyNow, 
  selectedCategory, 
  setSelectedCategory, 
  searchQuery,
  isProductPurchased,
  user,
  onAddReview // ✅ Add this prop
}) {
  const { isDark } = useTheme();
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ✅ Handle review submission - pass productId correctly
  const handleAddReview = (reviewData) => {
    if (selectedProduct && onAddReview) {
      onAddReview(selectedProduct.id, reviewData);
    }
  };

  if (selectedProduct) {
    return (
      <ProductDetailPage
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyNow={() => buyNow(selectedProduct)}
        onAddReview={handleAddReview} // ✅ Pass the handler
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

      {/* Category Filters */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        overflowX: 'auto',
        padding: '1rem 0',
        marginBottom: '2rem',
        scrollbarWidth: 'thin',
        WebkitOverflowScrolling: 'touch'
      }}>
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
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
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: selectedCategory === category.id 
                ? '0 4px 15px rgba(99,102,241,0.3)' 
                : 'none'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

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
                    {product.category}
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
                    <div style={{
                      fontSize: '1.75rem',
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      ₹{product.price}
                    </div>

                    {/* Pages count */}
                    <div style={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      📄 {product.pages} pages
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
    </div>
  );
}

export default ProductsPage;