import React from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { useAuth } from '../App';

function ReviewSection({ product, reviews, onAddReview }) {

  // ✅ get logged in user
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

      {/* HEADER */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: '900',
          color: '#1e293b'
        }}>
          Reviews & Ratings
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {[1,2,3,4,5].map(i => (
            <Star
              key={i}
              size={24}
              fill={i <= Math.round(averageRating) ? '#fbbf24' : 'none'}
              color="#fbbf24"
            />
          ))}

          <span style={{ fontSize: '2rem', fontWeight: '900' }}>
            {averageRating}
          </span>

          <span style={{ color: '#64748b' }}>
            ({reviews?.length || 0} reviews)
          </span>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {reviews && reviews.length > 0 ? (

          reviews.map((review, index) => {

            // ✅ check if this review belongs to logged user
            const isOwner = user && review.userId === user.id;

            return (
              <div key={index}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '2rem',
                  border: '1px solid #e2e8f0'
                }}>

                {/* USER INFO */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>

                  <div style={{ display: 'flex', gap: '1rem' }}>

                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#6366f1,#ec4899)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: '700'
                    }}>
                      {review.userName
                        ? review.userName[0].toUpperCase()
                        : <User size={22} />}
                    </div>

                    <div>
                      <div style={{ fontWeight: '700' }}>
                        {review.userName || 'Anonymous'}

                        {isOwner && (
                          <span style={{
                            marginLeft: '8px',
                            background: '#22c55e',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem'
                          }}>
                            You
                          </span>
                        )}
                      </div>

                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {review.date}
                      </div>
                    </div>

                  </div>

                  {/* STARS */}
                  <div>
                    {[1,2,3,4,5].map(i => (
                      <Star
                        key={i}
                        size={18}
                        fill={i <= review.rating ? '#fbbf24' : 'none'}
                        color="#fbbf24"
                      />
                    ))}
                  </div>

                </div>

                {/* COMMENT */}
                <p style={{
                  color: '#475569',
                  lineHeight: 1.7,
                  marginBottom: '1rem'
                }}>
                  {review.comment}
                </p>

                {/* LIKE BUTTON */}
                <button
                  disabled={!user}
                  onClick={() => {
                    if (!user) {
                      alert("Please login to like a review");
                      return;
                    }

                    window.showToast?.("Thanks for your feedback!", "info");
                  }}
                  style={{
                    background: user
                      ? 'rgba(99,102,241,0.1)'
                      : '#e5e7eb',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '20px',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: user ? 'pointer' : 'not-allowed',
                    color: '#6366f1',
                    fontWeight: '600'
                  }}
                >
                  <ThumbsUp size={16} />
                  Helpful ({review.likes || 0})
                </button>

              </div>
            );
          })

        ) : (

          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#94a3b8'
          }}>
            <Star size={64} color="#cbd5e1" />
            <p>No reviews yet. Be the first to review!</p>
          </div>

        )}

      </div>
    </div>
  );
}

export default ReviewSection;
