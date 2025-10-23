import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/DeleteAppReview.css';
import ConfirmationModal from './ConfirmationModal';

const TABS = ['BOOK', 'VIDEO', 'APP'];
const PAGE_SIZE = 5;

function DeleteAppReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewToDelete, setReviewToDelete] = useState(null);

  // tabs + page per tab
  const [activeTab, setActiveTab] = useState('BOOK');
  const [pages, setPages] = useState({ BOOK: 1, VIDEO: 1, APP: 1 });

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

  // group by type
  const grouped = useMemo(() => {
    const g = { BOOK: [], VIDEO: [], APP: [] };
    for (const r of reviews) {
      const t = (r.review_type || '').toUpperCase();
      if (t === 'BOOK') g.BOOK.push(r);
      else if (t === 'VIDEO') g.VIDEO.push(r);
      else g.APP.push(r);
    }
    return g;
  }, [reviews]);

  const totalForTab = (tab) => grouped[tab]?.length || 0;
  const pageFor = (tab) => pages[tab] || 1;
  const setPageFor = (tab, p) => setPages((prev) => ({ ...prev, [tab]: p }));
  const pageCountFor = (tab) => Math.max(1, Math.ceil(totalForTab(tab) / PAGE_SIZE));
  const pagedItems = (tab) => {
    const page = pageFor(tab);
    const start = (page - 1) * PAGE_SIZE;
    return (grouped[tab] || []).slice(start, start + PAGE_SIZE);
  };

  // clamp page when switching tabs
  useEffect(() => {
    const pc = pageCountFor(activeTab);
    if (pageFor(activeTab) > pc) setPageFor(activeTab, pc);
  }, [activeTab, grouped]); // eslint-disable-line

  const handleDeleteClick = (review) => setReviewToDelete(review);

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      const { data } = await api.delete(`/reviews/${reviewToDelete.id}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
      setSuccess(data?.message || 'Review deleted successfully.');
      // clamp if we removed the last item on the page
      const pc = pageCountFor(activeTab);
      if (pageFor(activeTab) > pc) setPageFor(activeTab, pc);
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

  const currentItems = pagedItems(activeTab);
  const page = pageFor(activeTab);
  const pageCount = pageCountFor(activeTab);

  return (
    <div className="delete-review-container">
      <h2>Your Past Reviews</h2>
      {error && <p className="message error">{error}</p>}
      {success && <p className="message success">{success}</p>}

      {/* Tabs */}
      <div className="reviews-tabs" role="tablist" aria-label="Review types">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            id={`tab-${tab}`}
            className={`reviews-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}&nbsp;
            <span className="tab-count">{totalForTab(tab)}</span>
          </button>
        ))}
      </div>

      {/* Panel */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="reviews-panel"
      >
        {totalForTab(activeTab) === 0 ? (
          <p>No {activeTab.toLowerCase()} reviews yet.</p>
        ) : (
          <>
            {/* --- NICER CARDS --- */}
            <div className="reviews-list pretty">
              {currentItems.map((review) => (
                <article key={review.id} className="review-card">
                  <header className="review-card-header">
                    <span className={`pill ${kindClass(review.review_type)}`}>
                      {review.review_type}
                    </span>
                    {review.media_title && (
                      <h4 className="media-title" title={review.media_title}>
                        {review.media_title}
                      </h4>
                    )}
                  </header>

                  <div className="review-card-body">
                    <div className="review-stars" aria-label={`${review.stars} out of 5`}>
                      {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                    </div>
                    <p className="review-text">{review.review}</p>
                  </div>

                  <footer className="review-card-footer">
                    <span className="review-meta">
                      Reviewed on: {new Date(review.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteClick(review)}
                      className="btn-delete outline"
                    >
                      Delete
                    </button>
                  </footer>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination-controls cozy">
              <button
                onClick={() => setPageFor(activeTab, Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {page} of {pageCount}
              </span>
              <button
                onClick={() => setPageFor(activeTab, Math.min(pageCount, page + 1))}
                disabled={page === pageCount}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {reviewToDelete && (
        <ConfirmationModal
          message="Are you sure you want to permanently delete this review?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setReviewToDelete(null)}
        />
      )}
    </div>
  );
}

export default DeleteAppReview;
