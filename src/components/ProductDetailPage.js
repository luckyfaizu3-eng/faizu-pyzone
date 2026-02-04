import React from 'react';
import { X, Star, Download, ShoppingCart, Zap, CheckCircle, Shield, FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useCart } from '../App';
import ReviewSection from './ReviewSection';

function ProductDetailPage({ product, onClose, onBuyNow, onAddReview }) {
  const { addToCart } = useCart();
  const [selectedPreviewPage, setSelectedPreviewPage] = React.useState(0);
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);

  if (!product) return null;

  const hasPreviewPages = product.previewPages && product.previewPages.length > 0;
  const isMobile = window.innerWidth <= 768;

  // Navigate preview pages
  const nextPreviewPage = () => {
    if (hasPreviewPages) {
      setSelectedPreviewPage((prev) => (prev + 1) % product.previewPages.length);
    }
  };

  const prevPreviewPage = () => {
    if (hasPreviewPages) {
      setSelectedPreviewPage((prev) => (prev - 1 + product.previewPages.length) % product.previewPages.length);
    }
  };

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
      padding: isMobile ? '1rem' : '2rem',
      animation: 'fadeIn 0.3s ease',
      overflowY: 'auto'
    }}
    onClick={onClose}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: isMobile ? '24px' : '32px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '95vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 30px 90px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.4s ease',
        margin: isMobile ? '1rem 0' : 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'sticky',
            top: isMobile ? '1rem' : '1.5rem',
            right: isMobile ? '1rem' : '1.5rem',
            float: 'right',
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
            zIndex: 10,
            marginRight: isMobile ? '1rem' : '1.5rem',
            marginTop: isMobile ? '1rem' : '1.5rem'
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
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '2rem' : '3rem',
          padding: isMobile ? '1.5rem' : '3rem',
          clear: 'both'
        }}>
          {/* Left: Image & Preview */}
          <div>
            <div style={{
              background: product.thumbnail 
                ? `url(${product.thumbnail})` 
                : 'linear-gradient(135deg, #6366f1, #ec4899)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: isMobile ? '250px' : '400px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: product.thumbnail ? '0' : (isMobile ? '5rem' : '8rem'),
              marginBottom: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
            }}>
              {!product.thumbnail && (product.image || '📚')}
            </div>

            {/* ✅ Preview Pages Section */}
            {hasPreviewPages && (
              <div style={{
                background: 'rgba(139,92,246,0.05)',
                border: '2px solid rgba(139,92,246,0.2)',
                borderRadius: '16px',
                padding: isMobile ? '1rem' : '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '700',
                    color: '#8b5cf6',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Eye size={20} />
                    Preview Pages ({product.previewPages.length})
                  </h3>
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      border: 'none',
                      color: '#fff',
                      padding: isMobile ? '0.5rem 1rem' : '0.5rem 1.25rem',
                      borderRadius: '20px',
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    View Full
                  </button>
                </div>

                {/* Preview Carousel */}
                <div style={{
                  position: 'relative',
                  background: '#fff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0'
                }}>
                  <img
                    src={product.previewPages[selectedPreviewPage].imageData}
                    alt={`Preview page ${selectedPreviewPage + 1}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                  
                  {/* Page Number Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(139,92,246,0.9)',
                    color: '#fff',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '700'
                  }}>
                    Page {product.previewPages[selectedPreviewPage].pageNumber}
                  </div>

                  {/* Navigation Arrows */}
                  {product.previewPages.length > 1 && (
                    <>
                      <button
                        onClick={prevPreviewPage}
                        style={{
                          position: 'absolute',
                          left: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.5)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                      >
                        <ChevronLeft size={24} color="#fff" />
                      </button>
                      <button
                        onClick={nextPreviewPage}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.5)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                      >
                        <ChevronRight size={24} color="#fff" />
                      </button>
                    </>
                  )}
                </div>

                {/* Page Dots */}
                {product.previewPages.length > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem'
                  }}>
                    {product.previewPages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPreviewPage(index)}
                        style={{
                          width: selectedPreviewPage === index ? '24px' : '8px',
                          height: '8px',
                          borderRadius: '4px',
                          background: selectedPreviewPage === index ? '#8b5cf6' : '#cbd5e1',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trust Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
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
                  padding: isMobile ? '0.75rem' : '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  color: badge.color
                }}>
                  <badge.icon size={isMobile ? 18 : 20} />
                  {badge.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Details */}
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.75rem' : 'clamp(2rem, 5vw, 2.75rem)',
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
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.25rem',
                borderRadius: '50px',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
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
                padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                borderRadius: '50px',
                border: '1px solid rgba(251,191,36,0.3)'
              }}>
                <Star size={isMobile ? 16 : 18} fill="#fbbf24" color="#fbbf24" />
                <span style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: '700',
                  color: '#fbbf24'
                }}>
                  {product.rating || '4.5'}
                </span>
              </div>
            </div>

            <p style={{
              color: '#64748b',
              fontSize: isMobile ? '1rem' : '1.1rem',
              lineHeight: 1.8,
              marginBottom: '2rem'
            }}>
              {product.description}
            </p>

            {/* What's Included */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '16px',
              padding: isMobile ? '1.25rem' : '2rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
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
                  ...(product.pdfFiles ? [`${product.pdfFiles.length} PDF file${product.pdfFiles.length > 1 ? 's' : ''}`] : []),
                  'Lifetime access',
                  'Instant download after payment',
                  'Mobile & Desktop compatible'
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    color: '#475569'
                  }}>
                    <CheckCircle size={isMobile ? 18 : 20} color="#10b981" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Price */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.05))',
              borderRadius: '16px',
              padding: isMobile ? '1.5rem' : '2rem',
              marginBottom: '2rem',
              border: '1px solid rgba(99,102,241,0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <span style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '600',
                  color: '#64748b'
                }}>
                  Total Price
                </span>
                <span style={{
                  fontSize: isMobile ? '2.5rem' : '3rem',
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
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    color: '#10b981',
                    fontWeight: '700',
                    marginBottom: '0.5rem'
                  }}>
                    🎁 Bundle Discount Applied!
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
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
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: isMobile ? '1.1rem' : '1.3rem',
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
                <Zap size={isMobile ? 24 : 28} />
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
                  padding: isMobile ? '1rem' : '1.25rem',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: isMobile ? '1rem' : '1.1rem',
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
                <ShoppingCart size={isMobile ? 20 : 24} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ 
          padding: isMobile ? '0 1.5rem 1.5rem' : '0 3rem 3rem'
        }}>
          <ReviewSection 
            product={product}
            reviews={product.reviews || []}
            onAddReview={onAddReview}
          />
        </div>
      </div>

      {/* ✅ Full Preview Modal */}
      {showPreviewModal && hasPreviewPages && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '1rem' : '2rem',
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={() => setShowPreviewModal(false)}
        >
          <button
            onClick={() => setShowPreviewModal(false)}
            style={{
              position: 'absolute',
              top: isMobile ? '1rem' : '2rem',
              right: isMobile ? '1rem' : '2rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={28} color="#fff" />
          </button>

          <div style={{
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <img
              src={product.previewPages[selectedPreviewPage].imageData}
              alt={`Preview page ${selectedPreviewPage + 1}`}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
            />
            
            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={prevPreviewPage}
                disabled={selectedPreviewPage === 0}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: selectedPreviewPage === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedPreviewPage === 0 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={28} color="#fff" />
              </button>

              <div style={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: 'rgba(0,0,0,0.5)',
                padding: '0.75rem 1.5rem',
                borderRadius: '30px'
              }}>
                Page {selectedPreviewPage + 1} of {product.previewPages.length}
              </div>

              <button
                onClick={nextPreviewPage}
                disabled={selectedPreviewPage === product.previewPages.length - 1}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: selectedPreviewPage === product.previewPages.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: selectedPreviewPage === product.previewPages.length - 1 ? 0.5 : 1
                }}
              >
                <ChevronRight size={28} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      )}

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