import React, { useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/AddMediaReview.css';

function ReviewBookModal({ book, onClose, onSuccess }) {
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!review.trim()) {
      setError('Please enter your review.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/reviews/book/${book.id}`, { review, stars });
      const msg = 'Your review has been submitted successfully.';
      setSuccess(msg);
      if (onSuccess) onSuccess(msg);
      setTimeout(onClose, 700);
    } catch (err) {
      const apiMsg =
        err?.response?.data?.detail || 'Failed to submit review. Please try again.';
      setError(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="view-book-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Review ${book.title}`}
      >
        <div className="modal-header">
          <h3>Review: {book.title}</h3>
          <button onClick={onClose} className="btn-close" aria-label="Close">
            &times;
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Rating */}
          <div className="detail-item">
            <label>Your Rating</label>
            <div className="star-rating" role="radiogroup" aria-label="Rating" style={{ display: 'flex', gap: 10 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hover || stars) >= n;
                return (
                  <button
                    type="button"
                    key={n}
                    className={`star-button ${filled ? 'filled' : ''}`}
                    role="radio"
                    aria-checked={stars === n}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    onClick={() => setStars(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setStars(n);
                      if (e.key === 'ArrowLeft') setStars((s) => Math.max(1, s - 1));
                      if (e.key === 'ArrowRight') setStars((s) => Math.min(5, s + 1));
                    }}
                    style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                  >
                    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true"
                         style={{ fill: filled ? '#ffc107' : '#d1d5db' }}>
                      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review text */}
          <div className="detail-item">
            <label htmlFor="reviewText">Your Review</label>
            <textarea
              id="reviewText"
              rows="6"
              placeholder="Share what you liked (or didn’t) about this book…"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-state" style={{ marginTop: 8 }}>{error}</div>}
          {success && <div className="success-state" style={{ marginTop: 8 }}>{success}</div>}

          <div className="modal-footer" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-view-link" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewBookModal;
