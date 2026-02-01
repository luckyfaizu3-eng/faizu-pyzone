import React, { useState } from 'react';
import { ShoppingCart, Star, Zap, ChevronDown } from 'lucide-react';
import { useCart } from '../App';
import { CATEGORIES } from '../App';
import ProductDetailPage from '../components/ProductDetailPage';

function ProductsPage({ products, buyNow, selectedCategory, setSelectedCategory, searchQuery, addReview }) {
  const { addToCart } = useCart();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const selectedCat = allCategories.find(c => c.id === selectedCategory) || allCategories[0];

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
        background: 'linear-gradient(135deg, #6366f1, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'fadeInUp 0.6s ease'
      }}>
        Browse Study Notes
      </h1>
      
      {/* Category Dropdown - CLEAN & PROFESSIONAL */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 3rem',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 1rem'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '1.05rem',
              fontWeight: '600',
              color: '#1e293b',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{selectedCat.icon}</span>
              <span>{selectedCat.name}</span>
            </div>
            <ChevronDown 
              size={20} 
              style={{
                transform: showCategoryDropdown ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease'
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {showCategoryDropdown && (
            <div style={{
              position: 'absolute',
              top: '70px',
              left: 0,
              right: 0,
              background: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              zIndex: 100,
              maxHeight: '400px',
              overflowY: 'auto',
              animation: 'slideDown 0.3s ease'
            }}>
              {allCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setShowCategoryDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem 1.5rem',
                    background: selectedCategory === cat.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: selectedCategory === cat.id ? '#6366f1' : '#64748b',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== cat.id) {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.05)';
                      e.currentTarget.style.color = '#6366f1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== cat.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
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
            color: '#64748b'
          }}>
            {searchQuery ? 'No results found' : 'No notes in this category yet'}
          </h2>
          <p style={{
            color: '#94a3b8',
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
          {filteredProducts.map((product, index) => {
            const productCategory = CATEGORIES.find(c => c.id === product.category) || 
                                   { name: product.customCategory || product.category, color: '#6366f1' };
            
            return (
              <div 
                key={product.id} 
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  padding: '1.5rem',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredCard === index ? 'translateY(-15px)' : 'translateY(0)',
                  boxShadow: hoveredCard === index 
                    ? '0 25px 60px rgba(99,102,241,0.2)' 
                    : '0 4px 20px rgba(0,0,0,0.05)',
                  animation: `fadeInUp 0.6s ease ${index * 0.1}s backwards`
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Category Badge at Top */}
                <div style={{
                  display: 'inline-block',
                  background: `${productCategory.color}15`,
                  color: productCategory.color,
                  padding: '0.4rem 1rem',
                  borderRadius: '50px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  border: `1px solid ${productCategory.color}30`
                }}>
                  {productCategory.name}
                </div>

                {/* Thumbnail */}
                <div style={{
                  background: product.thumbnail 
                    ? `url(${product.thumbnail})` 
                    : 'linear-gradient(135deg, #6366f1, #ec4899)',
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
                    background: 'rgba(0,0,0,0.5)',
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
                  color: '#1e293b',
                  minHeight: '3rem',
                  lineHeight: 1.3
                }}>
                  {product.title}
                </h3>
                
                <p style={{
                  color: '#64748b',
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
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    ₹{product.price}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(251,191,36,0.1)',
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
                      background: 'rgba(99,102,241,0.1)',
                      border: '2px solid rgba(99,102,241,0.3)',
                      color: '#6366f1',
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
                      e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <ShoppingCart size={20} />
                    Add to Cart
                  </button>
                  
                  <button 
                    onClick={() => setSelectedProduct(product)}
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
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.3)';
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Zap size={20} />
                    Buy Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailPage 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuyNow={() => buyNow(selectedProduct)}
          onAddReview={(reviewData) => addReview(selectedProduct.id, reviewData)}
        />
      )}

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
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
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