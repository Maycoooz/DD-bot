import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/ViewVideoReviewsModal.css';

function ViewVideoReviewsModal({ video, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      if (!video?.id) {
        setLoading(false);
        setReviews([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await api.get(`/reviews/video-reviews/${video.id}`);
        setReviews(res.data || []);
      } catch (err) {
        console.error('Failed to load video reviews:', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [video]);

  return (
    <div className="modal-overlay">
      <div
        className="view-video-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Reviews for ${video.title}`}
      >
        {/* Header */}
        <div className="modal-header">
          <h3>Reviews for {video.title}</h3>
          <button
            onClick={onClose}
            className="btn-close"
            aria-label="Close reviews"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="video-reviews-body">
          {loading && <p>Loading reviews...</p>}
          {error && <p className="video-reviews-error">{error}</p>}

          {!loading && !error && reviews.length === 0 && (
            <p>No reviews have been submitted for this video yet.</p>
          )}

          {!loading && !error && reviews.length > 0 && (
            <ul className="video-reviews-list">
              {reviews.map((review) => {
                const author =
                  review.user?.username ||
                  review.username ||
                  'Anonymous';

                const comment = review.review ?? '';
                const rating = review.stars;
                const dateText = review.created_at
                  ? new Date(review.created_at).toLocaleDateString()
                  : '';

                return (
                  <li
                    key={review.id || `${author}-${dateText}`}
                    className="video-review-item"
                  >
                    <div className="video-review-header">
                      <span className="video-review-author">{author}</span>
                      {typeof rating === 'number' && (
                        <span className="video-review-rating">
                          {'★'.repeat(rating)}
                          <span className="video-review-rating-out-of">
                            {' '} / 5
                          </span>
                        </span>
                      )}
                    </div>

                    {dateText && (
                      <div className="video-review-date">{dateText}</div>
                    )}

                    <p className="video-review-comment">{comment}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer video-reviews-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewVideoReviewsModal;
