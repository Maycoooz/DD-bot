import React, { useState } from 'react';
import '../styles/ViewBookModal.css';
import ReviewBookModal from './AddBookReview';
import ViewBookReviewsModal from './ViewBookReviewsModal';

function ViewBookModal({ book, onClose }) {
  const [showReview, setShowReview] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  return (
    <>
      <div className="modal-overlay">
        <div
          className="view-book-modal"
          role="dialog"
          aria-modal="true"
          aria-label={book.title}
        >
          <div className="modal-header">
            <h3>{book.title}</h3>
            <button
              onClick={onClose}
              className="btn-close"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="detail-item">
              <label>Author</label>
              <span>{book.author}</span>
            </div>
            <div className="detail-item">
              <label>Category</label>
              <span>{book.category || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Age Group</label>
              <span>{book.age_group || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Description</label>
              <p>{book.description || 'No description available.'}</p>
            </div>
          </div>

          <div className="modal-footer modal-footer-actions">
            {book.link && (
              <a
                href={book.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-view-link"
              >
                View on Store
              </a>
            )}

            <button
              className="btn-secondary"
              onClick={() => setShowReviews(true)}
              aria-haspopup="dialog"
              aria-expanded={showReviews}
            >
              View Reviews
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowReview(true)}
              aria-haspopup="dialog"
              aria-expanded={showReview}
            >
              Review Book
            </button>
          </div>
        </div>
      </div>

      {showReview && (
        <ReviewBookModal
          book={book}
          onClose={() => setShowReview(false)}
        />
      )}

      {showReviews && (
        <ViewBookReviewsModal
          book={book}
          onClose={() => setShowReviews(false)}
        />
      )}
    </>
  );
}

export default ViewBookModal;
