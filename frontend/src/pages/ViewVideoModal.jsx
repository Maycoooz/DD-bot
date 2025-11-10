import React, { useState } from 'react';
import '../styles/ViewVideoModal.css';
import ReviewVideoModal from './AddVideoReview';
import ViewVideoReviewsModal from './ViewVideoReviewsModal';

function ViewVideoModal({ video, onClose }) {
  const [showReview, setShowReview] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  // Helper to create a clean embeddable YouTube URL
  const getEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {
      // If URL is invalid or not a YouTube link, return the original
      return url;
    }
    return url;
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="view-video-modal">
          <div className="modal-header">
            <h3>{video.title}</h3>
            <button onClick={onClose} className="btn-close">
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="video-embed-container">
              <iframe
                width="100%"
                height="100%"
                src={getEmbedUrl(video.link)}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <div className="detail-item">
              <label>Creator</label>
              <span>{video.creator}</span>
            </div>

            <div className="detail-item">
              <label>Category</label>
              <span>{video.category || 'N/A'}</span>
            </div>

            <div className="detail-item">
              <label>Age Group</label>
              <span>{video.age_group || 'N/A'}</span>
            </div>

            <div className="detail-item">
              <label>Description</label>
              <p>{video.description || 'No description available.'}</p>
            </div>

            <div
              className="modal-footer"
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
            >
              {/* View Reviews */}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowReviews(true)}
                aria-haspopup="dialog"
                aria-expanded={showReviews}
              >
                View Reviews
              </button>

              {/* Add Review */}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowReview(true)}
                aria-haspopup="dialog"
                aria-expanded={showReview}
              >
                Review Video
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReview && (
        <ReviewVideoModal
          video={video}
          onClose={() => setShowReview(false)}
        />
      )}

      {showReviews && (
        <ViewVideoReviewsModal
          video={video}
          onClose={() => setShowReviews(false)}
        />
      )}
    </>
  );
}

export default ViewVideoModal;
