import React from 'react';
import { X, Star, Download, ShoppingCart, Zap, CheckCircle, Shield, ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Send, Tag, Loader } from 'lucide-react';
import { useCart } from '../App';
import { useAuth } from '../App';
import ReviewSection from './ReviewSection';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

function ProductDetailPage({ product, onClose, onBuyNow, onAddReview, geoData, isIndia, geoPrice }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [selectedPreviewPage, setSelectedPreviewPage] = React.useState(0);
  const [addingToCart, setAddingToCart] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState(0);
  const [touchEnd, setTouchEnd] = React.useState(0);
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [newReview, setNewReview] = React.useState({ rating: 5, comment: '' });

  // ── Coupon states ──
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState(null);
  const [couponError, setCouponError] = React.useState('');
  const [couponLoading, setCouponLoading] = React.useState(false);

  if (!product) return null;

  const resolvePrice = (inrPrice) => {
    if (geoPrice && geoData) return geoPrice(inrPrice, geoData);
    return { symbol: '₹', display: `₹${inrPrice}` };
  };

  // ── Coupon discount calculation ──
  const getDiscountedINRPrice = () => {
    if (!appliedCoupon) return product.price;
    if (appliedCoupon.discountType === 'percent') {
      return Math.round(product.price - (product.price * appliedCoupon.discountValue / 100));
    }
    return Math.max(0, product.price - appliedCoupon.discountValue);
  };

  const discountedINRPrice = getDiscountedINRPrice();
  const priceInfo         = resolvePrice(discountedINRPrice);
  const origPriceInfo     = product.originalPrice ? resolvePrice(product.originalPrice) : null;
  // If coupon is applied, show the pre-coupon product price as strikethrough
  const couponStrikeInfo  = appliedCoupon ? resolvePrice(product.price) : null;
  const savingsInfo       = product.isBundle && product.bundleInfo?.savings
                              ? resolvePrice(product.bundleInfo.savings)
                              : null;

  const isFreeProduct = !product.price || product.price === 0;

  // ── Apply coupon ──
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const q = query(
        collection(db, 'coupons'),
        where('code', '==', code),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setCouponError('Invalid or inactive coupon code.');
        setCouponLoading(false);
        return;
      }

      const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

      // Check expiry
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        setCouponError('This coupon has expired.');
        setCouponLoading(false);
        return;
      }

      // Check max uses
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        setCouponError('This coupon has reached its usage limit.');
        setCouponLoading(false);
        return;
      }

      // Check minimum order value (using INR base price)
      if (coupon.minOrderValue && product.price < coupon.minOrderValue) {
        setCouponError(`Minimum order value of ₹${coupon.minOrderValue} required.`);
        setCouponLoading(false);
        return;
      }

      // Check if coupon applies to this product
      if (coupon.applicableProducts === 'selected') {
        if (!coupon.selectedProductIds?.includes(product.id)) {
          setCouponError('This coupon is not applicable to this product.');
          setCouponLoading(false);
          return;
        }
      }

      // Check free products
      if (isFreeProduct) {
        setCouponError('Coupons cannot be applied to free products.');
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon(coupon);
      window.showToast?.('Coupon applied successfully!', 'success');
    } catch (err) {
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const hasPreviewPages = product.previewPages && product.previewPages.length > 0;

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove  = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd   = () => {
    if (!hasPreviewPages) return;
    if (touchStart - touchEnd > 75)
      setSelectedPreviewPage(prev => prev < product.previewPages.length - 1 ? prev + 1 : prev);
    if (touchStart - touchEnd < -75)
      setSelectedPreviewPage(prev => prev > 0 ? prev - 1 : prev);
  };

  const handleAddToCart = () => {
    setAddingToCart(true);
    addToCart(product);
    setTimeout(() => { setAddingToCart(false); onClose(); }, 800);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!user) { window.showToast?.('Please login to add review!', 'error'); return; }
    if (!newReview.comment.trim()) { window.showToast?.('Please write a review comment!', 'error'); return; }
    const reviewData = {
      rating: newReview.rating,
      comment: newReview.comment.trim(),
      userName: user.displayName || user.email.split('@')[0],
      userEmail: user.email
    };
    onAddReview(reviewData);
    setNewReview({ rating: 5, comment: '' });
    setShowReviewForm(false);
  };

  // Coupon savings display
  const couponSavingsINR = appliedCoupon
    ? product.price - discountedINRPrice
    : 0;
  const couponSavingsInfo = appliedCoupon ? resolvePrice(couponSavingsINR) : null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#f8fafc', zIndex: 2000, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', animation: 'fadeIn 0.3s ease'
      }}
    >
      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
            borderRadius: '12px', padding: '0.6rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            cursor: 'pointer', color: '#fff', fontWeight: '700', fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'all 0.3s ease'
          }}
        >
          <ArrowLeft size={18} />
          Home
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease'
          }}
        >
          <X size={20} color="#1e293b" />
        </button>
      </div>

      {/* Main Content */}
      <div style={{ paddingBottom: '2rem' }}>
        {/* Thumbnail */}
        <div
          style={{
            background: product.thumbnail
              ? `url(${product.thumbnail})`
              : 'linear-gradient(135deg, #6366f1, #ec4899)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: product.thumbnail ? '0' : '6rem', position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          {!product.thumbnail && (product.image || '📚')}

          <div style={{
            position: 'absolute', top: '1rem', left: '1rem',
            background: 'rgba(16,185,129,0.95)', backdropFilter: 'blur(10px)',
            color: '#fff', padding: '0.5rem 1rem', borderRadius: '20px',
            fontSize: '0.75rem', fontWeight: '800',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
          }}>
            <Shield size={14} />
            PREMIUM
          </div>

          {!isIndia && geoData && (
            <div style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
              color: '#fff', padding: '0.4rem 0.85rem', borderRadius: '20px',
              fontSize: '0.72rem', fontWeight: '800',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              {geoData.flag} {geoData.currency} • 🅿️ PayPal
            </div>
          )}

          <div style={{
            position: 'absolute', bottom: '1rem', right: '1rem',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '16px',
            padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 8px 24px rgba(251,191,36,0.4)'
          }}>
            <Star size={16} fill="#fff" color="#fff" />
            <span style={{ fontWeight: '800', fontSize: '1rem', color: '#fff' }}>
              {product.rating || '4.5'}
            </span>
          </div>
        </div>

        {/* Padded content area */}
        <div style={{ padding: '1.5rem' }}>

          {/* Preview Pages Carousel */}
          {hasPreviewPages && (
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '1.25rem',
              marginBottom: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '1rem', fontWeight: '800', color: '#1e293b',
                marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <div style={{ width: '4px', height: '20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '2px' }}></div>
                Preview Pages
              </h3>

              <div
                style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={product.previewPages[selectedPreviewPage].imageData}
                  alt={`Preview ${selectedPreviewPage + 1}`}
                  style={{ width: '100%', height: 'auto', display: 'block', transition: 'opacity 0.3s ease' }}
                />
                <div style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                  color: '#fff', padding: '0.4rem 0.9rem', borderRadius: '20px',
                  fontSize: '0.75rem', fontWeight: '800', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                  {selectedPreviewPage + 1}/{product.previewPages.length}
                </div>

                {product.previewPages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedPreviewPage(prev => Math.max(0, prev - 1))}
                      disabled={selectedPreviewPage === 0}
                      style={{
                        position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: 'none',
                        borderRadius: '50%', width: '44px', height: '44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        opacity: selectedPreviewPage === 0 ? 0.4 : 1,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.2s ease'
                      }}
                    >
                      <ChevronLeft size={24} color="#1e293b" />
                    </button>
                    <button
                      onClick={() => setSelectedPreviewPage(prev => Math.min(product.previewPages.length - 1, prev + 1))}
                      disabled={selectedPreviewPage === product.previewPages.length - 1}
                      style={{
                        position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: 'none',
                        borderRadius: '50%', width: '44px', height: '44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        opacity: selectedPreviewPage === product.previewPages.length - 1 ? 0.4 : 1,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.2s ease'
                      }}
                    >
                      <ChevronRight size={24} color="#1e293b" />
                    </button>
                  </>
                )}
              </div>

              {product.previewPages.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
                  {product.previewPages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPreviewPage(index)}
                      style={{
                        width: selectedPreviewPage === index ? '28px' : '8px', height: '8px',
                        borderRadius: '4px',
                        background: selectedPreviewPage === index ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#cbd5e1',
                        border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: selectedPreviewPage === index ? '0 2px 8px rgba(99,102,241,0.4)' : 'none'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Info */}
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '1.5rem',
            marginBottom: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{
              fontSize: '1.75rem', fontWeight: '900', marginBottom: '1rem',
              color: '#1e293b', lineHeight: 1.2, letterSpacing: '-0.02em'
            }}>
              {product.title}
            </h1>

            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
              border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1',
              padding: '0.5rem 1.25rem', borderRadius: '50px',
              fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.25rem'
            }}>
              {product.category}
            </div>

            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {product.description}
            </p>

            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.05))',
              borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(16,185,129,0.2)'
            }}>
              <h3 style={{
                fontSize: '0.95rem', fontWeight: '800', color: '#10b981', marginBottom: '1rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <CheckCircle size={18} />
                What You Get
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {[
                  `${product.pages || 0} pages`,
                  'Instant download',
                  'Lifetime access',
                  'Mobile friendly'
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── COUPON INPUT SECTION ── */}
          {!isFreeProduct && (
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '1.25rem',
              marginBottom: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: appliedCoupon ? '2px solid rgba(16,185,129,0.4)' : '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '0.95rem', fontWeight: '800', color: '#1e293b',
                marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <Tag size={18} color="#6366f1" />
                Have a Coupon Code?
              </h3>

              {appliedCoupon ? (
                /* Applied coupon pill */
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.35)',
                  borderRadius: '14px', padding: '0.85rem 1.1rem', flexWrap: 'wrap', gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff', padding: '0.3rem 0.85rem', borderRadius: '8px',
                      fontWeight: '900', fontSize: '0.95rem', letterSpacing: '0.08em'
                    }}>
                      {appliedCoupon.code}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#10b981' }}>
                      {appliedCoupon.discountType === 'percent'
                        ? `${appliedCoupon.discountValue}% off`
                        : `₹${appliedCoupon.discountValue} off`} applied!
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#ef4444', padding: '0.4rem 0.85rem', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                /* Coupon input row */
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                    style={{
                      flex: 1, padding: '0.875rem 1rem',
                      border: couponError ? '2px solid #ef4444' : '2px solid #e2e8f0',
                      borderRadius: '12px', fontSize: '0.95rem', outline: 'none',
                      fontFamily: 'inherit', fontWeight: '700',
                      letterSpacing: couponCode ? '0.08em' : '0',
                      transition: 'border-color 0.2s ease', textTransform: 'uppercase'
                    }}
                    onFocus={(e) => { if (!couponError) e.target.style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { if (!couponError) e.target.style.borderColor = '#e2e8f0'; }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{
                      background: couponLoading || !couponCode.trim()
                        ? 'rgba(99,102,241,0.4)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      border: 'none', color: '#fff',
                      padding: '0.875rem 1.25rem', borderRadius: '12px',
                      cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer',
                      fontWeight: '700', fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                      boxShadow: couponLoading || !couponCode.trim() ? 'none' : '0 4px 12px rgba(99,102,241,0.35)'
                    }}
                  >
                    {couponLoading
                      ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />Checking</>
                      : 'Apply'
                    }
                  </button>
                </div>
              )}

              {/* Error message */}
              {couponError && (
                <div style={{
                  marginTop: '0.6rem', fontSize: '0.82rem', color: '#ef4444',
                  fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}>
                  ⚠️ {couponError}
                </div>
              )}
            </div>
          )}

          {/* Price Card — geo-aware + coupon-aware */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9))',
            backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '1.5rem',
            marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 20px 60px rgba(99,102,241,0.2)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '0.85rem', fontWeight: '700', color: '#64748b',
                marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                Total Price
              </div>

              {/* Original product price strikethrough (before product-level discount) */}
              {origPriceInfo && !appliedCoupon && (
                <div style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '0.25rem' }}>
                  {origPriceInfo.display}
                </div>
              )}

              {/* Coupon strikethrough: show product.price before coupon */}
              {couponStrikeInfo && (
                <div style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '0.25rem' }}>
                  {couponStrikeInfo.display}
                </div>
              )}

              {/* Main price */}
              <div style={{
                fontSize: '3.5rem', fontWeight: '900',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1, marginBottom: '0.5rem', letterSpacing: '-0.03em'
              }}>
                {isFreeProduct ? 'FREE' : priceInfo.display}
              </div>

              {/* Bundle savings badge */}
              {savingsInfo && !appliedCoupon && (
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                  padding: '0.6rem 1.25rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
                }}>
                  🎁 Save {savingsInfo.display}
                </div>
              )}

              {/* Coupon savings badge */}
              {appliedCoupon && couponSavingsInfo && (
                <div style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                  padding: '0.6rem 1.25rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3)'
                }}>
                  🏷️ Coupon saves {couponSavingsInfo.display}
                </div>
              )}

              {/* PayPal note for foreign users */}
              {!isIndia && geoData && (
                <div style={{
                  marginTop: '12px', fontSize: '0.75rem', color: '#64748b', fontWeight: '600'
                }}>
                  {geoData.flag} {geoData.countryName} • Checkout via 🅿️ PayPal
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons — pass coupon to onBuyNow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => {
                onBuyNow(appliedCoupon ? {
                  coupon: appliedCoupon,
                  finalPrice: discountedINRPrice
                } : null);
                onClose();
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', color: '#fff', padding: '1.25rem', borderRadius: '20px',
                cursor: 'pointer', fontWeight: '800', fontSize: '1.15rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                boxShadow: '0 12px 40px rgba(16,185,129,0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.01em', WebkitTapHighlightColor: 'transparent',
                position: 'relative', overflow: 'hidden'
              }}
              onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Zap size={24} />
              {!isIndia && geoData
                ? `Pay ${priceInfo.display} via PayPal`
                : isFreeProduct
                  ? 'Download Free'
                  : `Buy Now — ${priceInfo.display}`
              }
            </button>

            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              style={{
                width: '100%',
                background: addingToCart ? 'linear-gradient(135deg, #10b981, #059669)' : '#fff',
                border: '2px solid #6366f1',
                color: addingToCart ? '#fff' : '#6366f1',
                padding: '1.15rem', borderRadius: '20px', cursor: 'pointer',
                fontWeight: '700', fontSize: '1.05rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                transition: 'all 0.3s ease', WebkitTapHighlightColor: 'transparent',
                boxShadow: addingToCart ? '0 12px 40px rgba(16,185,129,0.4)' : 'none'
              }}
              onTouchStart={(e) => { if (!addingToCart) e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={(e) => { if (!addingToCart) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {addingToCart
                ? <><CheckCircle size={22} /> Added!</>
                : <><ShoppingCart size={22} /> Add to Cart</>
              }
            </button>
          </div>

          {/* Trust Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              { icon: Shield,      text: 'Secure',              color: '#10b981' },
              { icon: Download,    text: 'Instant',             color: '#6366f1' },
              { icon: Star,        text: `${product.rating}★`,  color: '#fbbf24' },
              { icon: CheckCircle, text: `${product.pages}p`,   color: '#ec4899' }
            ].map((badge, i) => (
              <div key={i} style={{
                background: `${badge.color}08`, border: `1px solid ${badge.color}20`,
                borderRadius: '14px', padding: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontSize: '0.8rem', fontWeight: '700', color: badge.color
              }}>
                <badge.icon size={16} />
                {badge.text}
              </div>
            ))}
          </div>

          {/* Write Review Button */}
          {user && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              style={{
                width: '100%',
                background: showReviewForm
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', color: '#fff', padding: '1.15rem', borderRadius: '20px',
                cursor: 'pointer', fontWeight: '700', fontSize: '1.05rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                boxShadow: '0 12px 40px rgba(99,102,241,0.4)', transition: 'all 0.3s ease', marginBottom: '1.5rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <MessageCircle size={22} />
              {showReviewForm ? 'Cancel Review' : 'Write a Review'}
            </button>
          )}

          {/* Review Form */}
          {showReviewForm && user && (
            <form onSubmit={handleSubmitReview} style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
              border: '2px solid rgba(99,102,241,0.2)', borderRadius: '20px',
              padding: '1.5rem', marginBottom: '1.5rem', animation: 'slideDown 0.3s ease'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem' }}>
                Share Your Experience
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>
                  Your Rating
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star} type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', transition: 'transform 0.2s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Star size={32} fill={star <= newReview.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>
                  Your Review
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Tell us what you think about this product..."
                  required rows={4}
                  style={{
                    width: '100%', padding: '0.875rem', borderRadius: '12px',
                    border: '2px solid #e2e8f0', fontSize: '0.95rem', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit', transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', color: '#fff', padding: '1rem', borderRadius: '12px',
                  fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)'; }}
              >
                <Send size={18} />
                Submit Review
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ background: '#fff', padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
        <ReviewSection
          product={product}
          reviews={product.reviews || []}
          onAddReview={onAddReview}
        />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { -webkit-overflow-scrolling: touch; }
        button { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
        img { image-rendering: -webkit-optimize-contrast; }
      `}</style>
    </div>
  );
}

export default ProductDetailPage;