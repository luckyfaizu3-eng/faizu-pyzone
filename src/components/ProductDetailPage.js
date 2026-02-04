import React from 'react';
import { X, Star, Download, ShoppingCart, Zap, CheckCircle, Shield, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../App';
import ReviewSection from './ReviewSection';

function ProductDetailPage({ product, onClose, onBuyNow, onAddReview }) {
  const { addToCart } = useCart();
  const [selectedPreviewPage, setSelectedPreviewPage] = React.useState(0);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [addingToCart, setAddingToCart] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState(0);
  const [touchEnd, setTouchEnd] = React.useState(0);

  if (!product) return null;

  const hasPreviewPages = product.previewPages && product.previewPages.length > 0;

  // Touch swipe handler for preview

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!hasPreviewPages) return;
    
    if (touchStart - touchEnd > 75) {
      // Swipe left - next
      setSelectedPreviewPage((prev) => 
        prev < product.previewPages.length - 1 ? prev + 1 : prev
      );
    }

    if (touchStart - touchEnd < -75) {
      // Swipe right - previous
      setSelectedPreviewPage((prev) => prev > 0 ? prev - 1 : prev);
    }
  };

  const handleAddToCart = () => {
    setAddingToCart(true);
    addToCart(product);
    setTimeout(() => {
      setAddingToCart(false);
      onClose();
    }, 800);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#f8fafc',
        zIndex: 2000,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      {/* Premium Header - Sticky */}
      <div style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '12px',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            color: '#fff',
            fontWeight: '700',
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <ArrowLeft size={18} />
          Home
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={20} color="#1e293b" />
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        paddingBottom: '2rem'
      }}>
        {/* Thumbnail - Full Width at Top */}
        <div 
          style={{
            background: product.thumbnail 
              ? `url(${product.thumbnail})` 
              : 'linear-gradient(135deg, #6366f1, #ec4899)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: product.thumbnail ? '0' : '6rem',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
          onLoad={() => setImageLoaded(true)}
        >
          {!product.thumbnail && (product.image || '📚')}
          
          {/* Premium Overlay Badge */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'rgba(16,185,129,0.95)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
          }}>
            <Shield size={14} />
            PREMIUM
          </div>

          {/* Rating Badge - Bottom Right */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            borderRadius: '16px',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 8px 24px rgba(251,191,36,0.4)'
          }}>
            <Star size={16} fill="#fff" color="#fff" />
            <span style={{ 
              fontWeight: '800', 
              fontSize: '1rem',
              color: '#fff'
            }}>
              {product.rating || '4.5'}
            </span>
          </div>
        </div>

        {/* Content Area with Padding */}
        <div style={{
          padding: '1.5rem'
        }}>
        {/* Preview Pages Carousel - Mobile Optimized */}
        {hasPreviewPages && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '4px',
                height: '20px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: '2px'
              }}></div>
              Preview Pages
            </h3>

            <div 
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#f8fafc',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={product.previewPages[selectedPreviewPage].imageData}
                alt={`Preview ${selectedPreviewPage + 1}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  transition: 'opacity 0.3s ease'
                }}
              />

              {/* Page Number - Premium Style */}
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                padding: '0.4rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '800',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {selectedPreviewPage + 1}/{product.previewPages.length}
              </div>

              {/* Navigation Arrows - Touch Friendly */}
              {product.previewPages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedPreviewPage(prev => Math.max(0, prev - 1))}
                    disabled={selectedPreviewPage === 0}
                    style={{
                      position: 'absolute',
                      left: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: selectedPreviewPage === 0 ? 0.4 : 1,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ChevronLeft size={24} color="#1e293b" />
                  </button>

                  <button
                    onClick={() => setSelectedPreviewPage(prev => 
                      Math.min(product.previewPages.length - 1, prev + 1)
                    )}
                    disabled={selectedPreviewPage === product.previewPages.length - 1}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: selectedPreviewPage === product.previewPages.length - 1 ? 0.4 : 1,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ChevronRight size={24} color="#1e293b" />
                  </button>
                </>
              )}
            </div>

            {/* Page Dots - Premium */}
            {product.previewPages.length > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.4rem',
                marginTop: '1rem'
              }}>
                {product.previewPages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPreviewPage(index)}
                    style={{
                      width: selectedPreviewPage === index ? '28px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: selectedPreviewPage === index 
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                        : '#cbd5e1',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: selectedPreviewPage === index 
                        ? '0 2px 8px rgba(99,102,241,0.4)' 
                        : 'none'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product Info - Premium Card */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          {/* Title */}
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '900',
            marginBottom: '1rem',
            color: '#1e293b',
            lineHeight: 1.2,
            letterSpacing: '-0.02em'
          }}>
            {product.title}
          </h1>

          {/* Category Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#6366f1',
            padding: '0.5rem 1.25rem',
            borderRadius: '50px',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '1.25rem'
          }}>
            {product.category}
          </div>

          {/* Description */}
          <p style={{
            color: '#64748b',
            fontSize: '0.95rem',
            lineHeight: 1.7,
            marginBottom: '1.5rem'
          }}>
            {product.description}
          </p>

          {/* What's Included - Compact */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.05))',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(16,185,129,0.2)'
          }}>
            <h3 style={{
              fontSize: '0.95rem',
              fontWeight: '800',
              color: '#10b981',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={18} />
              What You Get
            </h3>
            <div style={{
              display: 'grid',
              gap: '0.75rem'
            }}>
              {[
                `${product.pages || 0} pages`,
                'Instant download',
                'Lifetime access',
                'Mobile friendly'
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  color: '#475569',
                  fontWeight: '600'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981'
                  }}></div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price Card - Premium Glassmorphism */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9))',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 20px 60px rgba(99,102,241,0.2)'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#64748b',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Total Price
            </div>
            <div style={{
              fontSize: '3.5rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
              marginBottom: '0.5rem',
              letterSpacing: '-0.03em'
            }}>
              ₹{product.price}
            </div>
            
            {/* Bundle Savings */}
            {product.isBundle && product.bundleInfo && (
              <div style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                padding: '0.6rem 1.25rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.75rem',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
              }}>
                🎁 Save ₹{product.bundleInfo.savings}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Premium & Touch Friendly */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <button 
            onClick={() => {
              onBuyNow();
              onClose();
            }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#fff',
              padding: '1.25rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 12px 40px rgba(16,185,129,0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '0.01em',
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
              overflow: 'hidden'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Zap size={24} />
            Buy Now
          </button>

          <button 
            onClick={handleAddToCart}
            disabled={addingToCart}
            style={{
              width: '100%',
              background: addingToCart 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : '#fff',
              border: '2px solid #6366f1',
              color: addingToCart ? '#fff' : '#6366f1',
              padding: '1.15rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1.05rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: addingToCart ? '0 12px 40px rgba(16,185,129,0.4)' : 'none'
            }}
            onTouchStart={(e) => {
              if (!addingToCart) {
                e.currentTarget.style.transform = 'scale(0.97)';
              }
            }}
            onTouchEnd={(e) => {
              if (!addingToCart) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {addingToCart ? (
              <>
                <CheckCircle size={22} />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart size={22} />
                Add to Cart
              </>
            )}
          </button>
        </div>

        {/* Trust Badges - Minimal & Premium */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}>
          {[
            { icon: Shield, text: 'Secure', color: '#10b981' },
            { icon: Download, text: 'Instant', color: '#6366f1' },
            { icon: Star, text: `${product.rating}★`, color: '#fbbf24' },
            { icon: CheckCircle, text: `${product.pages}p`, color: '#ec4899' }
          ].map((badge, i) => (
            <div key={i} style={{
              background: `${badge.color}08`,
              border: `1px solid ${badge.color}20`,
              borderRadius: '14px',
              padding: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: badge.color
            }}>
              <badge.icon size={16} />
              {badge.text}
            </div>
          ))}
        </div>
        </div>
        {/* End of padded content */}
      </div>

      {/* Reviews Section - Full Width at Bottom */}
      <div style={{
        background: '#fff',
        padding: '1.5rem',
        borderTop: '1px solid #e2e8f0'
      }}>
        <ReviewSection 
          product={product}
          reviews={product.reviews || []}
          onAddReview={onAddReview}
        />
      </div>

      {/* Animations */}
      <style>{`
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
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Smooth scrolling */
        * {
          -webkit-overflow-scrolling: touch;
        }

        /* Remove button tap highlight on mobile */
        button {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        /* Optimize for low-end devices */
        img {
          image-rendering: -webkit-optimize-contrast;
        }
      `}</style>
    </div>
  );
}

export default ProductDetailPage;