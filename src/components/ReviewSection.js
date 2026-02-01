import React, { useState } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { useAuth } from '../App';

function ReviewSection({ product, reviews, onAddReview }) {
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      window.showToast?.('Please login to add review!', 'error');
      return;
    }
    
    onAddReview({
      ...newReview,
      userName: user.displayName || user.email.split('@')[0],
      userEmail: user.email,
      date: new Date().toLocaleDateString(),
      likes: 0
    });
    
    setNewReview({ rating: 5, comment: '' });
    setShowReviewForm(false);
    window.showToast?.('✅ Review added successfully!', 'success');
  };

  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : product.rating || 4.5;

  return (
    <div style={{
      background: '#f8fafc',
      borderRadius: '20px',
      padding: '2.5rem',
      marginTop: '2rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.8rem',
            fontWeight: '900',
            color: '#1e293b',
            marginBottom: '0.5rem'
          }}>
            Reviews & Ratings
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Star 
                  key={i}
                  size={24} 
                  fill={i <= Math.round(averageRating) ? '#fbbf24' : 'none'}
                  color="#fbbf24"
                />
              ))}
            </div>
            <span style={{
              fontSize: '2rem',
              fontWeight: '900',
              color: '#1e293b'
            }}>
              {averageRating}
            </span>
            <span style={{
              color: '#64748b',
              fontSize: '1rem'
            }}>
              ({reviews?.length || 0} reviews)
            </span>
          </div>
        </div>

        {user && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              border: 'none',
              color: '#fff',
              padding: '0.9rem 2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
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
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #e2e8f0',
          animation: 'slideDown 0.3s ease'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1rem',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              Your Rating
            </label>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setNewReview({...newReview, rating})}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Star 
                    size={36}
                    fill={rating <= newReview.rating ? '#fbbf24' : 'none'}
                    color="#fbbf24"
                  />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '1rem',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              Your Review
            </label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
              placeholder="Share your experience with this product..."
              required
              rows="4"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#fff',
              padding: '1rem 2.5rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1.05rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.3)';
            }}
          >
            Submit Review
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {reviews && reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div key={index} style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '2rem',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '1.2rem'
                  }}>
                    {review.userName ? review.userName[0].toUpperCase() : <User size={24} />}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: '700',
                      color: '#1e293b',
                      fontSize: '1.1rem'
                    }}>
                      {review.userName || 'Anonymous'}
                    </div>
                    <div style={{
                      color: '#64748b',
                      fontSize: '0.9rem'
                    }}>
                      {review.date}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.25rem'
                }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star 
                      key={i}
                      size={18} 
                      fill={i <= review.rating ? '#fbbf24' : 'none'}
                      color="#fbbf24"
                    />
                  ))}
                </div>
              </div>

              <p style={{
                color: '#475569',
                fontSize: '1.05rem',
                lineHeight: 1.7,
                marginBottom: '1rem'
              }}>
                {review.comment}
              </p>

              <button
                onClick={() => {
                  // Like functionality can be added
                  window.showToast?.('Thanks for your feedback!', 'info');
                }}
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '0.5rem 1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#6366f1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ThumbsUp size={16} />
                Helpful ({review.likes || 0})
              </button>
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: '#94a3b8'
          }}>
            <Star size={64} color="#cbd5e1" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              No reviews yet. Be the first to review!
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
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

export default ReviewSection;