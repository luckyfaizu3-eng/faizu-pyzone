import React from 'react';
import { X, Star, Download, ShoppingCart, Zap, CheckCircle, Shield, FileText } from 'lucide-react';
import { useCart } from '../App';
import ReviewSection from './ReviewSection';

function ProductDetailPage({ product, onClose, onBuyNow, onAddReview }) {
  const { addToCart } = useCart();

  if (!product) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(10px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      animation: 'fadeIn 0.3s ease'
    }}
    onClick={onClose}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '32px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 30px 90px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.4s ease'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <X size={24} color="#1e293b" />
        </button>

        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '3rem',
          padding: '3rem'
        }}>
          {/* Left: Image & Preview */}
          <div>
            <div style={{
              background: product.thumbnail 
                ? `url(${product.thumbnail})` 
                : 'linear-gradient(135deg, #6366f1, #ec4899)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '400px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: product.thumbnail ? '0' : '8rem',
              marginBottom: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
            }}>
              {!product.thumbnail && (product.image || '📚')}
            </div>

            {/* Trust Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              {[
                { icon: Shield, text: 'Secure Payment', color: '#10b981' },
                { icon: Download, text: 'Instant Download', color: '#6366f1' },
                { icon: FileText, text: `${product.pages || 0} Pages`, color: '#ec4899' },
                { icon: Star, text: `${product.rating || 4.5}★ Rating`, color: '#fbbf24' }
              ].map((badge, i) => (
                <div key={i} style={{
                  background: `${badge.color}10`,
                  border: `1px solid ${badge.color}30`,
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: badge.color
                }}>
                  <badge.icon size={20} />
                  {badge.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Details */}
          <div>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              fontWeight: '900',
              marginBottom: '1rem',
              color: '#1e293b',
              lineHeight: 1.2
            }}>
              {product.title}
            </h1>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                padding: '0.5rem 1.25rem',
                borderRadius: '50px',
                fontSize: '0.9rem',
                fontWeight: '700',
                border: '1px solid rgba(99,102,241,0.3)'
              }}>
                {product.category}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(251,191,36,0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '50px',
                border: '1px solid rgba(251,191,36,0.3)'
              }}>
                <Star size={18} fill="#fbbf24" color="#fbbf24" />
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: '#fbbf24'
                }}>
                  {product.rating || '4.5'}
                </span>
              </div>
            </div>

            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              lineHeight: 1.8,
              marginBottom: '2rem'
            }}>
              {product.description}
            </p>

            {/* What's Included */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '800',
                color: '#1e293b',
                marginBottom: '1.25rem'
              }}>
                📦 What's Included
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {[
                  `${product.pages || 0} pages of comprehensive content`,
                  `${product.fileSize || 'Optimized'} file size`,
                  `${product.language || 'English'} language`,
                  'Lifetime access',
                  'Instant download after payment',
                  'Mobile & Desktop compatible'
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '1rem',
                    color: '#475569'
                  }}>
                    <CheckCircle size={20} color="#10b981" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Price */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.05))',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid rgba(99,102,241,0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#64748b'
                }}>
                  Total Price
                </span>
                <span style={{
                  fontSize: '3rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ₹{product.price}
                </span>
              </div>
              
              {/* Bundle Info */}
              {product.isBundle && product.bundleInfo && (
                <div style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.95rem',
                    color: '#10b981',
                    fontWeight: '700',
                    marginBottom: '0.5rem'
                  }}>
                    🎁 Bundle Discount Applied!
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#64748b'
                  }}>
                    Save ₹{product.bundleInfo.savings} ({product.bundleInfo.discount}% OFF)
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
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
                  padding: '1.5rem',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '1.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  boxShadow: '0 10px 40px rgba(16,185,129,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 15px 50px rgba(16,185,129,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(16,185,129,0.4)';
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Zap size={28} />
                Proceed to Payment
              </button>

              <button 
                onClick={() => {
                  addToCart(product);
                  onClose();
                }}
                style={{
                  width: '100%',
                  background: 'rgba(99,102,241,0.1)',
                  border: '2px solid rgba(99,102,241,0.3)',
                  color: '#6366f1',
                  padding: '1.25rem',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
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
              >
                <ShoppingCart size={24} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ padding: '0 3rem 3rem' }}>
          <ReviewSection 
            product={product}
            reviews={product.reviews || []}
            onAddReview={onAddReview}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default ProductDetailPage;