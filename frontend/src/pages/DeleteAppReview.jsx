import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/DeleteAppReview.css';
import ConfirmationModal from './ConfirmationModal';

function DeleteAppReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewToDelete, setReviewToDelete] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get('/reviews/my-reviews');
        setReviews(data || []);
      } catch {
        setError('Failed to load your reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleDeleteClick = (review) => setReviewToDelete(review);

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      const { data } = await api.delete(`/reviews/${reviewToDelete.id}`);
      setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));
      setSuccess(data?.message || 'Review deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete review.');
    } finally {
      setReviewToDelete(null);
    }
  };

  const kindClass = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'book') return 'badge-book';
    if (t === 'video') return 'badge-video';
    return 'badge-app';
  };

  if (loading) return <div>Loading your reviews...</div>;

  return (
    <div className="delete-review-container">
      <h2>Your Past Reviews</h2>
      {error && <p className="message error">{error}</p>}
      {success && <p className="message success">{success}</p>}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p>You have not submitted any reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-content">
                {/* NEW: type badge + optional media title */}
                <div className="review-header-line">
                  <span className={`review-kind ${kindClass(review.review_type)}`}>
                    {review.review_type}
                  </span>
                  {review.media_title ? (
                    <span className="review-media-title">• {review.media_title}</span>
                  ) : null}
                </div>

                <div className="review-stars">
                  {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                </div>

                <p className="review-text">{review.review}</p>
                <span className="review-meta">
                  Reviewed on: {new Date(review.created_at).toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => handleDeleteClick(review)}
                className="btn-delete"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {reviewToDelete && (
        <ConfirmationModal
          message="Are you sure you want to permanently delete this review?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setReviewToDelete(null)}
        />
      )}

      {/* minimal styles for the new line; move to CSS file if you prefer */}
      <style>{`
        .review-header-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 14px;
        }
        .review-kind {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: .02em;
        }
        .badge-book  { background: #ecfdf5; color: #065f46; } /* green */
        .badge-video { background: #eff6ff; color: #1e40af; } /* blue */
        .badge-app   { background: #fef3c7; color: #92400e; } /* amber */
        .review-media-title { color: #4b5563; }
      `}</style>
    </div>
  );
}

export default DeleteAppReview;
