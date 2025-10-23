import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/LibrarianViewAllReviews.css'; // create or reuse your admin table styles

// Small debounce hook so we don't hit the API on every keystroke
const useDebounce = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

function LibrarianViewAllReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // filters
  const [starFilter, setStarFilter] = useState('');      // '', '1'..'5'
  const [typeFilter, setTypeFilter] = useState('');      // '', 'BOOK', 'VIDEO'
  const [titleQuery, setTitleQuery] = useState('');      // search by media title
  const debouncedTitle = useDebounce(titleQuery, 400);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        size: 10,
        stars: starFilter || null,
        review_type: typeFilter || null, // BOOK | VIDEO
        q: debouncedTitle || null,       // search by book/video title
      };

      const { data } = await api.get('/librarian/all-reviews', { params });
      setReviews(data?.items || []);
      const total = data?.total ?? 0;
      setTotalReviews(total);
      setTotalPages(Math.max(1, Math.ceil(total / (params.size || 10))));
    } catch (e) {
      console.error(e);
      setError('Failed to load reviews.');
      setReviews([]);
      setTotalReviews(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, starFilter, typeFilter, debouncedTitle]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // when filters/search change, return to first page
  useEffect(() => { setCurrentPage(1); }, [starFilter, typeFilter, debouncedTitle]);

  const starsToIcons = useCallback((n) => {
    const s = Math.max(0, Math.min(5, Number(n) || 0));
    return '★'.repeat(s) + '☆'.repeat(5 - s);
  }, []);

  const countBadge = useMemo(() => (
    !loading && !error ? (
      <span className="total-reviews-badge">
        {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'} Found
      </span>
    ) : null
  ), [loading, error, totalReviews]);

  return (
    <div className="librarian-reviews-container">
      <div className="librarian-reviews-header">
        <h2>All Reviews (Books &amp; Videos)</h2>
      </div>

      {/* Filters */}
      <div className="librarian-filters">
        <div className="filter-controls-wrapper">
          <div className="filter-group">
            <label htmlFor="star-filter">Filter by Stars</label>
            <select
              id="star-filter"
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value)}
            >
              <option value="">All Star Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="type-filter">Filter by Type</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All (Book &amp; Video)</option>
              <option value="BOOK">Book</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>

          <div className="filter-group" style={{ minWidth: 280 }}>
            <label htmlFor="title-search">Search by Title</label>
            <input
              id="title-search"
              type="text"
              placeholder="Title"
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
            />
          </div>
        </div>

        {countBadge}
      </div>

      {/* Status */}
      {loading && <div className="librarian-loading-state">Loading reviews...</div>}
      {error && <div className="librarian-error-message">{error}</div>}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="librarian-table-container">
            <table className="librarian-reviews-table">
              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Review</th>
                  <th>Stars</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Publicly Approved</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.user?.username}</strong>
                        {r.user?.role_name && (
                          <span className="user-role-badge">{r.user.role_name}</span>
                        )}
                      </td>
                      <td className="review-text-cell" title={r.review}>
                        {r.review}
                      </td>
                      <td aria-label={`${r.stars} stars`}>{starsToIcons(r.stars)}</td>
                      <td>{r.review_type}</td>
                      <td className="media-title-cell" title={r.media_title || '—'}>
                        {r.media_title || '—'}
                      </td>
                      <td>{r.is_public_display_approved ? 'Yes' : 'No'}</td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-results">
                      No reviews found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LibrarianViewAllReviews;
