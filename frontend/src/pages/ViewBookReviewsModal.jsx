import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/ViewBookReviewModal.css';

function ViewBookReviewsModal({ book, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/reviews/book-reviews/${book.id}`);
        setReviews(res.data || []);
      } catch (err) {
        console.error('Failed to load reviews:', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (book?.id) {
      fetchReviews();
    } else {
      setLoading(false);
      setReviews([]);
    }
  }, [book]);

  return (
    <div className="modal-overlay">
      <div
        className="view-book-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Reviews for ${book.title}`}
      >
        <div className="modal-header">
          <h3>Reviews for {book.title}</h3>
          <button
            onClick={onClose}
            className="btn-close"
            aria-label="Close reviews"
          >
            &times;
          </button>
        </div>

        <div className="modal-body reviews-body">
          {loading && <p>Loading reviews...</p>}
          {error && <p className="reviews-error">{error}</p>}

          {!loading && !error && reviews.length === 0 && (
            <p>No reviews have been submitted for this book yet.</p>
          )}

          {!loading && !error && reviews.length > 0 && (
            <ul className="reviews-list">
              {reviews.map((review) => {
                const author = review.user?.username || 'Anonymous';
                const rating = review.stars;
                const comment = review.review;

                return (
                  <li key={review.id} className="review-item">
                    <div className="review-header">
                      <span className="review-author">{author}</span>
                      {typeof rating === 'number' && (
                        <span className="review-rating">
                          {'★'.repeat(rating)}
                          <span className="review-rating-out-of"> / 5</span>
                        </span>
                      )}
                    </div>
                    <p className="review-comment">{comment}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="modal-footer reviews-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewBookReviewsModal;
