import React, { useState } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { useAuth } from '../App';

function ReviewSection({ product, reviews, onAddReview }) {
  const { user } = useAuth();

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
        marginBottom: '2rem'
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
      </div>

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
    </div>
  );
}

export default ReviewSection;